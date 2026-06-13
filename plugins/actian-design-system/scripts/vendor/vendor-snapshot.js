#!/usr/bin/env node
"use strict";

// Federation Phase 1.4a — vendor a snapshot of the actian-ds-knowledge repo
// into plugins/actian-design-system/vendor/.
//
// THIN ENTRY over the substrate's shared snapshot core. The generic mechanics
// (range-resolve → fetch tarball → include-select → copy → write vendored.json)
// live in the canonical vendor/clients/vendor-snapshot.js, COPIED here as
// vendor-snapshot-core.js and byte-identity-guarded by
// tests/vendor/vendor-snapshot-core-drift.test.js — a build tool must not
// import the bundle it produces (bootstrap + safety). This entry owns only the
// plugin-specific bits: the vendor target/dir, the legacy exclude-set, the
// post-vendor component-mirror regeneration (postVendorHook), and the
// require.main / FATAL CLI shell.
//
// Usage:
//   node scripts/vendor/vendor-snapshot.js               (range from vendored.json)
//   node scripts/vendor/vendor-snapshot.js --sha <sha>   (override SHA)
//   node scripts/vendor/vendor-snapshot.js --range <r>   (override the range)
//   node scripts/vendor/vendor-snapshot.js --resolve-only
//
// vendored.json#knowledge_repo_version_range pins the snapshot; vendor-snapshot.yml
// refreshes it nightly and bumps plugin.json (calendar YYYY.MM.PATCH) on diff.

var fs = require("fs");
var path = require("path");
var { spawnSync } = require("child_process");
var core = require("./vendor-snapshot-core.js");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var VENDORED_JSON_PATH = path.join(PLUGIN_ROOT, "vendored.json");
var VENDOR_DIR = path.join(PLUGIN_ROOT, "vendor");
var KNOWLEDGE_REPO = "volivarii/actian-ds-knowledge";

// Legacy exclude-set — top-level entries in the knowledge repo NOT to vendor.
// Only consulted when a pinned snapshot predates vendor-include.json (the core
// prefers the substrate's declared include-set). Still passed because it also
// populates vendored.json#excluded_entries (the core stamps it verbatim).
var EXCLUDE_TOP_LEVEL = new Set([
  ".git",
  ".github",
  ".gitignore",
  "node_modules",
  "scripts",
  "tests",
  "package.json",
  "package-lock.json",
  ".figma-keys.json.example",
  "SMOKE_LOG.md",
  "LICENSE.txt",
  "README.md",
  // Contributor-facing AI surface files (Move B). The plugin doesn't read
  // these — they're for humans / agents authoring INSIDE the knowledge repo.
  "AGENTS.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "llms.txt",
  // CODEOWNERS governs review ownership of the knowledge repo itself; it is
  // meaningless inside the plugin's read-only vendor snapshot (matches the
  // docs repo, which also excludes it).
  "CODEOWNERS",
]);

// CI parity (postVendorHook): vendor-snapshot.yml runs render-component-reference.js
// as a separate step AFTER the snapshot copy to regenerate the three plugin-side
// component mirrors (dskit-components.md, fm-components.md, meta-kit/
// components.md). Local invocations bypassed that step and left fresh clones with
// missing mirrors, which broke path-validation tests. The core runs this hook at
// the same point (after vendored.json is written, before "[vendor] OK") so CI and
// local behave identically.
//
// If the renderer fails, the vendor tree on disk is still useful — we log a
// warning and set a non-zero exitCode rather than rolling back.
function runComponentReferenceRenderer() {
  var rendererPath = path.join(
    PLUGIN_ROOT,
    "scripts",
    "renderers",
    "render-component-reference.js",
  );
  if (!fs.existsSync(rendererPath)) {
    process.stderr.write(
      "[vendor] WARNING: renderer not found at " +
        rendererPath +
        " — skipping mirror regeneration (rare; check plugin install)\n",
    );
    return false;
  }
  process.stdout.write(
    "[vendor] regenerating component mirrors via render-component-reference.js --kit all\n",
  );
  var result = spawnSync(process.execPath, [rendererPath, "--kit", "all"], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.stderr.write(
      "[vendor] WARNING: render-component-reference.js exited with status " +
        result.status +
        ". Vendor snapshot is on disk but component mirrors " +
        "(dskit-components.md / fm-components.md / meta-kit/components.md) " +
        "may be stale. Run the renderer manually to recover.\n",
    );
    process.exitCode = 1;
    return false;
  }
  return true;
}

if (require.main === module) {
  try {
    core.runSnapshot({
      knowledgeRepo: KNOWLEDGE_REPO,
      vendorDir: VENDOR_DIR,
      vendoredJsonPath: VENDORED_JSON_PATH,
      excludeTopLevel: EXCLUDE_TOP_LEVEL,
      postVendorHook: runComponentReferenceRenderer,
    });
  } catch (err) {
    // exit 2 = any fatal vendor error. The core THROWS the unrecoverable
    // conditions (no in-range tag / no resolvable SHA) that the pre-shared-client
    // main() exit(1)'d inline; they now flow here, joining other thrown errors
    // under one fatal code. (The renderer-warning path is separate: postVendorHook
    // sets exitCode=1 without throwing — vendor stays on disk.) CI fails on any
    // non-zero, so the 1→2 shift for those two conditions is immaterial there.
    process.stderr.write("[vendor] FATAL: " + err.message + "\n");
    process.exit(2);
  }
}

// Public API preserved for consumers/tests: the pure range-resolution + include-
// selection helpers, re-exported from the copied core (single source).
module.exports = {
  runSnapshot: core.runSnapshot,
  matchesRange: core.matchesRange,
  compareSemver: core.compareSemver,
  resolveTargetTag: core.resolveTargetTag,
  notifyIfNewerAvailable: core.notifyIfNewerAvailable,
  selectEntries: core.selectEntries,
  readVendorInclude: core.readVendorInclude,
  runComponentReferenceRenderer: runComponentReferenceRenderer,
};
