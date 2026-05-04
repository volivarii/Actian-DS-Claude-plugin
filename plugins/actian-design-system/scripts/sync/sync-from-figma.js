#!/usr/bin/env node
"use strict";

// Sprint 1 Wave 1 orchestrator. Glues figma-rest + transformers + classifier
// into a single nightly sync entry point. Called by the GitHub Action via:
//
//   node scripts/sync-from-figma.js --phase all
//
// Wave 1 scope: Phase 1 (registries: dsKit/fmKit/metaKit) + Phase 3 (text +
// effect styles, written to docs/generated/meta-kit/styles.json).
//
// Phases 5 + 6 (component guidelines + foundations) stay manual via the
// /sync-design-system skill — they're hand-curated content, not pure data.
// See SKILL.md for the architectural rationale.
//
// Exit codes:
//   0 — verdict additive or unchanged
//   1 — verdict breaking (review required)
//   2 — error (one or more phases threw)

var fs = require("fs");
var path = require("path");

var transformRegistry = require("../transformers/transform-registry.js");
var transformStyles = require("../transformers/transform-styles.js");
var classify = require("../changelog/changelog-classifier.js");
var defaultRest = require("./figma-rest.js");

var KIT_MAP = {
  dsKit: { library: "ds", outputFile: "dskit.json" },
  fmKit: { library: "fm", outputFile: "fmkit.json" },
  metaKit: { library: "meta-kit", outputFile: "metakit.json" },
};

var REGISTRY_KITS = ["dsKit", "fmKit", "metaKit"];
var STYLES_KITS = ["dsKit"]; // Only DS Kit hosts text + effect styles

// ---- Helpers ----

function readJsonOrNull(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// Filter REST `/components` payload to standalones only (variants of sets,
// internals starting with '.', removed). Per Sprint 1 memory:
//   "containing_frame.containingComponentSet" is set on variants of a set.
function filterStandalones(componentsList) {
  return (componentsList || []).filter(function (c) {
    if (!c || typeof c.name !== "string") return false;
    if (c.name.startsWith(".")) return false;
    if (c.containing_frame && c.containing_frame.containingComponentSet)
      return false;
    return true;
  });
}

// Fetch /nodes for many ids via the wrapper's batched getNodes. Returns a
// map of nodeId → node payload. Internal batching keeps Figma's rate limit
// happy — a single sync that needs 300+ nodes lands in ~6 batched calls
// instead of 300 individual ones, well under any per-second limit.
function fetchNodesMap(rest, fileKey, ids) {
  var unique = [];
  var seen = {};
  for (var i = 0; i < ids.length; i++) {
    if (!ids[i] || seen[ids[i]]) continue;
    seen[ids[i]] = true;
    unique.push(ids[i]);
  }
  if (unique.length === 0) return Promise.resolve({});
  return rest.getNodes(fileKey, unique).then(function (resp) {
    return (resp && resp.nodes) || {};
  });
}

// ---- Per-phase syncs ----

async function syncRegistry(opts, kitId) {
  var meta = KIT_MAP[kitId];
  var fileKey = opts.keys[kitId];
  if (!fileKey)
    throw new Error(
      "Missing file key for kit '" + kitId + "' in figma keys file",
    );
  var outputPath = path.join(opts.outputDir, meta.outputFile);

  var beforeFile = readJsonOrNull(outputPath);
  var before = beforeFile || {
    library: meta.library,
    fileKey: fileKey,
    components: {},
  };

  // Fetch lightweight metadata
  var csResp = await opts.rest.getComponentSets(fileKey);
  var cResp = await opts.rest.getComponents(fileKey);
  var componentSets =
    (csResp && csResp.meta && csResp.meta.component_sets) || [];
  var componentsList = (cResp && cResp.meta && cResp.meta.components) || [];
  var standalones = filterStandalones(componentsList);

  // Fetch node payloads (componentPropertyDefinitions) in parallel
  var setIds = componentSets.map(function (s) {
    return s.node_id;
  });
  var standaloneIds = standalones.map(function (s) {
    return s.node_id;
  });
  var [componentSetNodes, standaloneNodes] = await Promise.all([
    fetchNodesMap(opts.rest, fileKey, setIds),
    fetchNodesMap(opts.rest, fileKey, standaloneIds),
  ]);

  var after = transformRegistry({
    library: meta.library,
    fileKey: fileKey,
    componentSets: componentSets,
    componentSetNodes: componentSetNodes,
    standalones: standalones,
    standaloneNodes: standaloneNodes,
  });

  // Meta Kit: preserve hand-curated `templates` section across resync (Task 2.3).
  if (kitId === "metaKit" && beforeFile && beforeFile.templates) {
    after.templates = beforeFile.templates;
  }

  var verdict = classify({
    fileKind: "registry",
    before: before,
    after: after,
  });
  // Skip the write when nothing meaningful changed AND the file already exists.
  // Otherwise `lastSynced` timestamps drift every run and the GH workflow
  // would open a no-op PR every night.
  var wrote = false;
  if (verdict.category !== "unchanged" || !fs.existsSync(outputPath)) {
    writeJson(outputPath, after);
    wrote = true;
  }
  return {
    kitId: kitId,
    fileLabel: meta.outputFile,
    verdict: verdict,
    wrote: wrote,
  };
}

async function syncStyles(opts, kitId) {
  var fileKey = opts.keys[kitId];
  if (!fileKey)
    throw new Error(
      "Missing file key for kit '" + kitId + "' in figma keys file",
    );
  var outputPath = path.join(opts.outputDir, "meta-kit", "styles.json");

  var before = readJsonOrNull(outputPath) || {
    textStyles: [],
    effectStyles: [],
  };

  var stylesPayload = await opts.rest.getStyles(fileKey);
  var styleEntries =
    (stylesPayload && stylesPayload.meta && stylesPayload.meta.styles) || [];
  var styleIds = styleEntries.map(function (s) {
    return s.node_id;
  });
  var nodes = await fetchNodesMap(opts.rest, fileKey, styleIds);

  var after = transformStyles({ stylesPayload: stylesPayload, nodes: nodes });
  var verdict = classify({ fileKind: "styles", before: before, after: after });
  var wrote = false;
  if (verdict.category !== "unchanged" || !fs.existsSync(outputPath)) {
    writeJson(outputPath, after);
    wrote = true;
  }
  return {
    kitId: kitId,
    fileLabel: "meta-kit/styles.json",
    verdict: verdict,
    wrote: wrote,
  };
}

// ---- Verdict aggregation ----

function aggregateVerdict(results, errors) {
  if (errors.length > 0) return "error";
  var anyBreaking = results.some(function (r) {
    return r.verdict.category === "breaking";
  });
  if (anyBreaking) return "breaking";
  var anyAdditive = results.some(function (r) {
    return r.verdict.category === "additive";
  });
  if (anyAdditive) return "additive";
  return "unchanged";
}

function exitCodeFor(category) {
  if (category === "breaking") return 1;
  if (category === "error") return 2;
  return 0;
}

// ---- Changelog assembly ----

function buildChangelog(date, category, results, errors) {
  var lines = [];
  lines.push("# Sync " + date + " — " + category);
  lines.push("");
  lines.push(
    "Auto-generated by `scripts/sync-from-figma.js` at " +
      new Date().toISOString() +
      ".",
  );
  lines.push("");
  results.forEach(function (r) {
    lines.push("## " + r.fileLabel + " — " + r.verdict.category);
    lines.push("");
    lines.push(r.verdict.changelog || "_(empty)_");
    lines.push("");
  });
  if (errors.length > 0) {
    lines.push("## Errors (" + errors.length + ")");
    lines.push("");
    errors.forEach(function (e) {
      lines.push("- **" + e.label + "**: " + e.error.message);
    });
    lines.push("");
  }
  return lines.join("\n");
}

// ---- Public entry point ----

async function run(opts) {
  opts = opts || {};
  var pluginDir = opts.pluginDir || path.resolve(__dirname, "../..");
  var rest = opts.rest || defaultRest;
  var outputDir = opts.outputDir || path.join(pluginDir, "docs", "generated");
  var releaseNotesDir =
    opts.releaseNotesDir || path.join(pluginDir, "release-notes");
  var keysFile = opts.keysFile || path.join(pluginDir, ".figma-keys.json");
  var artifactsDir = opts.artifactsDir || "/tmp";
  var phase = opts.phase || "all";
  var date = opts.date || todayIso();
  var keys = opts.keys || readJsonOrNull(keysFile);
  if (!keys) throw new Error("Cannot read figma keys from " + keysFile);

  var orchOpts = { rest: rest, outputDir: outputDir, keys: keys };
  var results = [];
  var errors = [];

  async function runWithGuard(label, fn) {
    try {
      var r = await fn();
      results.push(r);
    } catch (err) {
      errors.push({ label: label, error: err });
      if (opts.logger && typeof opts.logger.error === "function") {
        opts.logger.error("[sync] " + label + " failed:", err.message);
      }
    }
  }

  if (phase === "registries" || phase === "all") {
    for (var i = 0; i < REGISTRY_KITS.length; i++) {
      var kit = REGISTRY_KITS[i];
      // Bind kit into the closure
      // eslint-disable-next-line no-loop-func
      await runWithGuard(
        "registry:" + kit,
        (
          (k) => () =>
            syncRegistry(orchOpts, k)
        )(kit),
      );
    }
  }

  if (phase === "styles" || phase === "all") {
    for (var j = 0; j < STYLES_KITS.length; j++) {
      var sKit = STYLES_KITS[j];
      // eslint-disable-next-line no-loop-func
      await runWithGuard(
        "styles:" + sKit,
        (
          (k) => () =>
            syncStyles(orchOpts, k)
        )(sKit),
      );
    }
  }

  var category = aggregateVerdict(results, errors);
  var exitCode = exitCodeFor(category);
  var changelog = buildChangelog(date, category, results, errors);

  // Per-day release notes
  fs.mkdirSync(releaseNotesDir, { recursive: true });
  var releasePath = path.join(releaseNotesDir, "sync-" + date + ".md");
  fs.writeFileSync(releasePath, changelog, "utf8");

  // Workflow handoff artifacts
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.writeFileSync(
    path.join(artifactsDir, "sync-verdict.txt"),
    category + "\n",
    "utf8",
  );
  fs.writeFileSync(
    path.join(artifactsDir, "sync-changelog.md"),
    changelog,
    "utf8",
  );

  // Auto-bump plugin.json patch when generated data actually changed.
  // Cowork (cloud) re-pulls plugin per session and reads from the bumped
  // version; without this, designers see stale registries/styles until the
  // next manual ship. Skip on `unchanged` (no diff) and `error` (failed run).
  //
  // Only fires when opts.pluginJsonPath is set explicitly (CLI passes it;
  // tests omit it). This keeps test fixtures from polluting the real
  // plugin.json when their mock REST data produces additive/breaking diffs.
  var bumpedFrom = null;
  var bumpedTo = null;
  var pluginJsonPath = opts.pluginJsonPath || null;
  if (
    pluginJsonPath &&
    (category === "additive" || category === "breaking") &&
    fs.existsSync(pluginJsonPath)
  ) {
    var bumpVersion = require("../lib/bump-version.js");
    var plugin = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
    bumpedFrom = plugin.version;
    bumpedTo = bumpVersion(bumpedFrom, "patch");
    plugin.version = bumpedTo;
    fs.writeFileSync(
      pluginJsonPath,
      JSON.stringify(plugin, null, 2) + "\n",
      "utf8",
    );
  }

  // Auto-stub: generate guideline stubs for any new set-importable
  // components that landed in this sync. No-op on unchanged. Idempotent —
  // existing guideline files are never overwritten (skip-if-exists in
  // generateStubs). Stubs land in the same PR as the registry diff via
  // peter-evans add-paths (already includes docs/**).
  //
  // Only fires when opts.guidelinesDir is set explicitly (CLI passes it;
  // tests omit it). Mirrors the auto-bump opt-in pattern above — keeps
  // test fixtures from polluting the real plugin's docs/component-guidelines/
  // directory when their mock REST data produces additive/breaking diffs.
  var stubsGenerated = [];
  var guidelinesDir = opts.guidelinesDir || null;
  if (
    guidelinesDir &&
    (category === "additive" || category === "breaking") &&
    fs.existsSync(guidelinesDir)
  ) {
    var registryFile = path.join(outputDir, "dskit.json");
    var indexFile = path.join(guidelinesDir, "_index.json");
    if (fs.existsSync(registryFile) && fs.existsSync(indexFile)) {
      var generateStubs =
        require("../foundations/generate-guideline-stubs.js").generateStubs;
      var stubResult = generateStubs({
        registryPath: registryFile,
        guidelinesDir: guidelinesDir,
        indexPath: indexFile,
      });
      stubsGenerated = stubResult.generated;
    } else {
      console.warn(
        "[sync] auto-stub skipped: missing " +
          (fs.existsSync(registryFile)
            ? ""
            : "registry (" + registryFile + ") ") +
          (fs.existsSync(indexFile) ? "" : "index (" + indexFile + ")"),
      );
    }
  }

  return {
    category: category,
    exitCode: exitCode,
    results: results,
    errors: errors,
    releasePath: releasePath,
    changelog: changelog,
    bumpedFrom: bumpedFrom,
    bumpedTo: bumpedTo,
    stubsGenerated: stubsGenerated,
  };
}

// ---- CLI ----

function parseArgs(argv) {
  var out = { phase: "all" };
  for (var i = 0; i < argv.length; i++) {
    var a = argv[i];
    var next = function () {
      return argv[++i];
    };
    if (a === "--phase") out.phase = next();
    else if (a === "--output-dir") out.outputDir = next();
    else if (a === "--release-notes-dir") out.releaseNotesDir = next();
    else if (a === "--keys-file") out.keysFile = next();
    else if (a === "--artifacts-dir") out.artifactsDir = next();
    else if (a === "--plugin-dir") out.pluginDir = next();
    else if (a === "--plugin-json-path") out.pluginJsonPath = next();
    else if (a === "--guidelines-dir") out.guidelinesDir = next();
  }
  return out;
}

if (require.main === module) {
  var cliOpts = parseArgs(process.argv.slice(2));
  // CLI mode (e.g., GitHub Action) defaults pluginJsonPath to plugin.json
  // under the resolved pluginDir, so auto-bump fires without explicit
  // wiring. Programmatic callers (tests, scripts) must opt in by passing
  // pluginJsonPath explicitly — keeps test fixtures from polluting the
  // real plugin.json on additive/breaking verdicts from mock data.
  var resolvedPluginDir = cliOpts.pluginDir || path.resolve(__dirname, "../..");
  if (!cliOpts.pluginJsonPath) {
    cliOpts.pluginJsonPath = path.join(
      resolvedPluginDir,
      ".claude-plugin",
      "plugin.json",
    );
  }
  // Same pattern as pluginJsonPath above: CLI mode defaults guidelinesDir to
  // <pluginDir>/docs/component-guidelines so auto-stub fires without explicit
  // wiring. Programmatic callers (tests, scripts) must opt in by passing
  // guidelinesDir explicitly — keeps test fixtures from polluting the real
  // docs/component-guidelines/ directory on additive/breaking verdicts.
  if (!cliOpts.guidelinesDir) {
    cliOpts.guidelinesDir = path.join(
      resolvedPluginDir,
      "docs",
      "component-guidelines",
    );
  }
  run(cliOpts).then(
    function (r) {
      console.log("[sync] verdict=" + r.category + " exit=" + r.exitCode);
      if (r.errors.length > 0) {
        r.errors.forEach(function (e) {
          console.error(
            "[sync]   error in " + e.label + ": " + e.error.message,
          );
        });
      }
      console.log("[sync] release notes: " + r.releasePath);
      process.exit(r.exitCode);
    },
    function (err) {
      console.error("[sync] FATAL:", err.message);
      process.exit(2);
    },
  );
}

module.exports = { run: run, parseArgs: parseArgs };
