#!/usr/bin/env node
"use strict";

/**
 * doc-counts.test.js — Guard the human-facing inventory counts against the
 * actual ground truth (filesystem + vendored registries).
 *
 * WHY THIS EXISTS
 * ---------------
 * The plugin advertises counts in prose across many surfaces: README banner,
 * marketplace.json (two descriptions), plugin.json, llms.txt, companion-context,
 * figma-push-patterns. Nothing kept them in sync, so they drifted badly
 * (v1.97.0 sweep found: skills 9 vs 8, agents 8 vs 9, recipes 23/25 vs 24,
 * WCAG 2.1 vs 2.2, DS Kit 322/107 vs 318, "85 guidelines / 41 stubs" when the
 * vendored snapshot ships 44 docs and 0 stubs).
 *
 * This test DERIVES the canonical counts from the source of truth and asserts
 * each managed doc states them correctly. When the registries re-vendor or a
 * skill/agent/recipe is added, this test fails loudly and tells you exactly
 * which doc string to update — drift can no longer ship silently.
 *
 * Ground truth:
 *   - skills   = skills/<name>/ dirs containing a SKILL.md
 *   - agents   = agents/*.md files
 *   - recipes  = recipes/<kind>/*.json files excluding _index.json
 *   - DS/FM/Meta components + sets = vendor/components/dist/registries/*.json
 *   - guideline docs = vendor/components/dist/guidelines/*.json (minus the bundle)
 *
 * Zero dependencies — Node.js built-ins only.
 * Run with: node tests/integration/doc-counts.test.js
 * (from the plugins/actian-design-system directory)
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var REPO_ROOT = path.resolve(PLUGIN_ROOT, "..", "..");

// ---------------------------------------------------------------------------
// Derive canonical counts from ground truth
// ---------------------------------------------------------------------------

function listDirs(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readdirSync(p).filter(function (e) {
    return fs.statSync(path.join(p, e)).isDirectory();
  });
}

function deriveSkills() {
  return listDirs(path.join(PLUGIN_ROOT, "skills")).filter(function (d) {
    return fs.existsSync(path.join(PLUGIN_ROOT, "skills", d, "SKILL.md"));
  }).length;
}

function deriveAgents() {
  var dir = path.join(PLUGIN_ROOT, "agents");
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(function (f) {
    return f.endsWith(".md");
  }).length;
}

function deriveRecipes() {
  var root = path.join(PLUGIN_ROOT, "recipes");
  var total = 0;
  listDirs(root).forEach(function (kind) {
    fs.readdirSync(path.join(root, kind)).forEach(function (f) {
      if (f.endsWith(".json") && f !== "_index.json") total++;
    });
  });
  return total;
}

function deriveRegistry(lib) {
  var p = path.join(
    PLUGIN_ROOT,
    "vendor",
    "components",
    "dist",
    "registries",
    lib + ".json",
  );
  var reg = JSON.parse(fs.readFileSync(p, "utf8"));
  var keys = Object.keys(reg.components || {});
  var sets = keys.filter(function (k) {
    return reg.components[k].importMethod === "set";
  }).length;
  // Prefer the declared componentCount; fall back to key count.
  var count =
    typeof reg.componentCount === "number" ? reg.componentCount : keys.length;
  return { count: count, sets: sets, keyCount: keys.length };
}

function deriveGuidelines() {
  var dir = path.join(
    PLUGIN_ROOT,
    "vendor",
    "components",
    "dist",
    "guidelines",
  );
  var files = fs.readdirSync(dir).filter(function (f) {
    return f.endsWith(".json") && f !== "guidelines.bundle.json";
  });
  var aliases = files.filter(function (f) {
    var j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    return Object.prototype.hasOwnProperty.call(j, "_alias_of");
  }).length;
  return {
    total: files.length,
    canonical: files.length - aliases,
    aliases: aliases,
  };
}

var SKILLS = deriveSkills();
var AGENTS = deriveAgents();
var RECIPES = deriveRecipes();
var DS = deriveRegistry("dskit");
var FM = deriveRegistry("fmkit");
var META = deriveRegistry("metakit");
var GUIDE = deriveGuidelines();

// ---------------------------------------------------------------------------
// Managed doc surfaces + the strings each must contain / must not contain.
// `mustContain` strings are built FROM the derived counts, so they track the
// ground truth automatically. `mustNotContain` are regression guards for the
// specific stale values this guard was created to kill.
// ---------------------------------------------------------------------------

function f(rel) {
  return path.join(REPO_ROOT, rel);
}

var CHECKS = [
  {
    file: f("README.md"),
    mustContain: [
      SKILLS + " skills",
      AGENTS + " agents",
      RECIPES + " recipes",
      "WCAG 2.2 AA",
      DS.count +
        " DS Kit + " +
        FM.count +
        " FM Kit + " +
        META.count +
        " Meta Kit",
      DS.count + " DS Kit components (" + DS.sets + " sets)",
      GUIDE.total + " per-component guideline docs",
    ],
    mustNotContain: [
      "WCAG 2.1 AA",
      "322 DS Kit",
      "82 / 33 / 11",
      "82 sets",
      "85 per-component",
      "41 auto-stub",
      "44 fully curated",
    ],
  },
  {
    file: f(".claude-plugin/marketplace.json"),
    mustContain: [
      SKILLS + " skills, " + AGENTS + " agents",
      SKILLS + " skills + " + AGENTS + " agents",
      RECIPES + " recipes",
      "WCAG 2.2 AA",
      "brief-researcher",
    ],
    mustNotContain: ["WCAG 2.1 AA", "sync-design-system", "25 recipes"],
  },
  {
    file: f("plugins/actian-design-system/.claude-plugin/plugin.json"),
    mustContain: [SKILLS + " skills", AGENTS + " agents", "WCAG 2.2 AA"],
    mustNotContain: ["WCAG 2.1 AA"],
  },
  {
    file: f("llms.txt"),
    mustContain: [
      SKILLS + " skills",
      DS.count + " DS Kit components",
      FM.count + " FM Kit wireframe components",
      META.count + " Meta Kit components",
      "WCAG 2.2 AA",
      GUIDE.total + " JSON files",
    ],
    mustNotContain: [
      "WCAG 2.1 AA",
      "107 DS Kit",
      "107 design system",
      "85 JSON files",
    ],
  },
  {
    file: f("USAGE.md"),
    mustContain: ["WCAG 2.2 AA"],
    mustNotContain: ["WCAG 2.1 AA"],
  },
  {
    file: f(
      "plugins/actian-design-system/references/context/companion-context.md",
    ),
    mustContain: [
      DS.count + " components (" + DS.sets + " sets)",
      FM.count + " components (" + FM.sets + " sets)",
      META.count + " components (" + META.sets + " sets)",
      GUIDE.total + " guideline docs",
    ],
    mustNotContain: ["107 sets", "44 components |", "~41 of 85"],
  },
  {
    file: f(
      "plugins/actian-design-system/references/figma/figma-push-patterns.md",
    ),
    mustContain: [
      DS.count + " design system components",
      FM.count + " wireframe components",
    ],
    mustNotContain: ["107 design system components", "33 wireframe components"],
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Doc inventory counts match ground truth", function () {
  it("derives sane counts from the filesystem + registries", function () {
    assert.ok(SKILLS >= 1, "skills count should be >= 1");
    assert.ok(AGENTS >= 1, "agents count should be >= 1");
    assert.ok(RECIPES >= 1, "recipes count should be >= 1");
    assert.ok(DS.count > 0 && FM.count > 0 && META.count > 0);
    assert.ok(GUIDE.total > 0);
    // The declared componentCount must equal the actual component-key count.
    ["dskit", "fmkit", "metakit"].forEach(function (lib) {
      var r = deriveRegistry(lib);
      assert.equal(
        r.count,
        r.keyCount,
        lib +
          ".json: componentCount (" +
          r.count +
          ") != #components keys (" +
          r.keyCount +
          ")",
      );
    });
  });

  CHECKS.forEach(function (check) {
    var rel = path.relative(REPO_ROOT, check.file);
    describe(rel, function () {
      var content = fs.existsSync(check.file)
        ? fs.readFileSync(check.file, "utf8")
        : null;

      it("exists", function () {
        assert.ok(content !== null, "managed doc not found: " + rel);
      });

      (check.mustContain || []).forEach(function (needle) {
        it('states "' + needle + '"', function () {
          assert.ok(
            content && content.indexOf(needle) !== -1,
            rel +
              ' is missing expected count string "' +
              needle +
              '".\nGround truth: ' +
              SKILLS +
              " skills / " +
              AGENTS +
              " agents / " +
              RECIPES +
              " recipes / DS " +
              DS.count +
              "(" +
              DS.sets +
              " sets) / FM " +
              FM.count +
              "(" +
              FM.sets +
              " sets) / Meta " +
              META.count +
              "(" +
              META.sets +
              " sets) / " +
              GUIDE.total +
              " guideline docs.\nUpdate the doc to match.",
          );
        });
      });

      (check.mustNotContain || []).forEach(function (needle) {
        it('does not contain stale "' + needle + '"', function () {
          assert.ok(
            content && content.indexOf(needle) === -1,
            rel + ' still contains stale string "' + needle + '" — remove it.',
          );
        });
      });
    });
  });
});
