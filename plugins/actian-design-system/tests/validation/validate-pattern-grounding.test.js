#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var fs = require("fs");
var os = require("os");
var child_process = require("child_process");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var validate = require(
  path.join(PLUGIN_ROOT, "scripts", "validation", "validate-flow-data.js"),
);

// Inject a tiny recipe index so the check is deterministic and independent of
// the real recipes/flow/_index.json tag contents.
var RECIPES = [
  {
    archetype: "browse-search",
    tags: ["search", "browse", "catalog", "results", "filter"],
  },
  {
    archetype: "dashboard",
    tags: ["dashboard", "cards", "overview", "metrics", "home"],
  },
];
var QUIET = {
  skipTokens: true,
  skipTerminology: true,
  skipAvoidWords: true,
  recipeIndex: RECIPES,
};

function flow(patterns, matchedRecipe) {
  var glossary = { app: "Studio" };
  if (patterns !== undefined) glossary.patterns = patterns;
  return {
    meta: { feature: "t", app: "Studio", library: "ds", _glossary: glossary },
    screens: [
      {
        id: "s1",
        name: "S",
        template: "studio",
        content: [],
        matchedRecipe: matchedRecipe,
      },
    ],
  };
}

function patternFindings(data) {
  return validate.validate(data, QUIET).findings.filter(function (f) {
    return f.kind === "pattern-ungrounded";
  });
}

describe("validate-pattern-grounding (S2, advisory)", function () {
  it("recipe tag overlaps a pattern tag → no finding", function () {
    // pattern 'search-filtered-table' tags include 'search'; recipe 'browse-search' tags include 'search'
    var f = patternFindings(
      flow(
        [
          {
            slug: "search-filtered-table",
            tags: ["search", "filtered", "table"],
          },
        ],
        "browse-search",
      ),
    );
    assert.strictEqual(f.length, 0);
  });

  it("recipe shares no tag with any pattern → pattern-ungrounded info", function () {
    var f = patternFindings(
      flow(
        [{ slug: "lineage-graph", tags: ["lineage", "graph"] }],
        "dashboard",
      ),
    );
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].kind, "pattern-ungrounded");
    assert.strictEqual(f[0].severity, "info");
    assert.strictEqual(f[0].screen, "s1");
    assert.ok(f[0].message, "finding should carry a non-empty message");
  });

  it("no _glossary.patterns (legacy flow) → no findings (backward compat)", function () {
    assert.strictEqual(patternFindings(flow(undefined, "dashboard")).length, 0);
  });

  it("screen without matchedRecipe → skipped", function () {
    var f = patternFindings(
      flow([{ slug: "lineage-graph", tags: ["lineage", "graph"] }], undefined),
    );
    assert.strictEqual(f.length, 0);
  });

  it("the finding is advisory — no error/P0 severity emitted for it", function () {
    var all = validate.validate(
      flow(
        [{ slug: "lineage-graph", tags: ["lineage", "graph"] }],
        "dashboard",
      ),
      QUIET,
    ).findings;
    var ours = all.filter(function (f) {
      return f.kind === "pattern-ungrounded";
    });
    assert.strictEqual(ours.length, 1);
    ours.forEach(function (f) {
      assert.notStrictEqual(f.severity, "error");
      assert.notStrictEqual(f.severity, "P0");
    });
  });

  // Fix 2: unknown/stale recipe archetype must be skipped, not flagged
  it("unknown matchedRecipe not in recipe index → skipped (0 findings)", function () {
    var f = patternFindings(
      flow(
        [{ slug: "lineage-graph", tags: ["lineage", "graph"] }],
        "no-such-recipe",
      ),
    );
    assert.strictEqual(
      f.length,
      0,
      "screen with unknown recipe should be skipped, not flagged",
    );
  });

  // Fix 3: if no pattern has tags, patternTagSet is empty → skip everything
  it("tagless patterns build empty patternTagSet → no findings (nothing to check against)", function () {
    // Pattern present but has no tags field — vocabulary is empty
    var f = patternFindings(flow([{ slug: "x" }], "dashboard"));
    assert.strictEqual(
      f.length,
      0,
      "empty pattern-tag vocabulary should skip all screens",
    );
  });
});

describe("validate-pattern-grounding (CLI visibility)", function () {
  // Fix 1: pattern-ungrounded must appear in CLI --json output
  it("pattern-ungrounded finding reaches CLI --json output (not silently dropped)", function () {
    // Build a minimal flow-data.json on disk that will produce a pattern-ungrounded
    // finding: dashboard recipe tags = ["dashboard","cards","overview","metrics","home"],
    // pattern tags = ["lineage","graph"] — guaranteed no overlap.
    var data = {
      meta: {
        feature: "cli-test",
        app: "Studio",
        library: "ds",
        _glossary: {
          app: "Studio",
          patterns: [{ slug: "lineage-graph", tags: ["lineage", "graph"] }],
        },
      },
      screens: [
        {
          id: "sc1",
          name: "SC1",
          template: "studio",
          content: [],
          matchedRecipe: "dashboard",
        },
      ],
    };
    var tmpFile = path.join(
      os.tmpdir(),
      "validate-pg-cli-test-" + Date.now() + ".json",
    );
    fs.writeFileSync(tmpFile, JSON.stringify(data));
    try {
      var CLI = path.join(
        PLUGIN_ROOT,
        "scripts",
        "validation",
        "validate-flow-data.js",
      );
      var out = child_process.execFileSync(
        process.execPath,
        [
          CLI,
          tmpFile,
          "--json",
          "--skip-tokens",
          "--skip-terminology",
          "--skip-avoid-words",
        ],
        { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
      );
      var findings = JSON.parse(out);
      var found = findings.some(function (f) {
        return f.check === "pattern-ungrounded";
      });
      assert.ok(
        found,
        "CLI --json output should include a pattern-ungrounded entry",
      );
    } finally {
      try {
        fs.unlinkSync(tmpFile);
      } catch (_) {}
    }
  });
});
