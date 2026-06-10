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
 * The canonical counts + the managed-doc check list now live in
 * scripts/lib/doc-counts.js, SHARED with scripts/vendor/sync-doc-counts.js
 * (the fixer that rewrites the doc strings during a vendor refresh). This test
 * is the GUARD side: it asserts each managed doc states the derived counts and
 * contains no stale regression strings. Because both sides read the same
 * buildChecks(), the guard and the fixer can never disagree.
 *
 * Ground truth (see scripts/lib/doc-counts.js):
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

var {
  deriveCounts,
  buildChecks,
  deriveRegistry,
} = require("../../scripts/lib/doc-counts.js");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var REPO_ROOT = path.resolve(PLUGIN_ROOT, "..", "..");

var COUNTS = deriveCounts();
var CHECKS = buildChecks(COUNTS);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Doc inventory counts match ground truth", function () {
  it("derives sane counts from the filesystem + registries", function () {
    assert.ok(COUNTS.SKILLS >= 1, "skills count should be >= 1");
    assert.ok(COUNTS.AGENTS >= 1, "agents count should be >= 1");
    assert.ok(COUNTS.RECIPES >= 1, "recipes count should be >= 1");
    assert.ok(
      COUNTS.DS.count > 0 && COUNTS.FM.count > 0 && COUNTS.META.count > 0,
    );
    assert.ok(COUNTS.GUIDE.total > 0);
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
    var rel = check.file;
    describe(rel, function () {
      var abs = path.join(REPO_ROOT, check.file);
      var content = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;

      it("exists", function () {
        assert.ok(content !== null, "managed doc not found: " + rel);
      });

      (check.contains || []).forEach(function (item) {
        it('states "' + item.str + '"', function () {
          assert.ok(
            content && content.indexOf(item.str) !== -1,
            rel +
              ' is missing expected count string "' +
              item.str +
              '".\nGround truth: ' +
              COUNTS.SKILLS +
              " skills / " +
              COUNTS.AGENTS +
              " agents / " +
              COUNTS.RECIPES +
              " recipes / DS " +
              COUNTS.DS.count +
              "(" +
              COUNTS.DS.sets +
              " sets) / FM " +
              COUNTS.FM.count +
              "(" +
              COUNTS.FM.sets +
              " sets) / Meta " +
              COUNTS.META.count +
              "(" +
              COUNTS.META.sets +
              " sets) / " +
              COUNTS.GUIDE.total +
              " guideline docs.\nRun `node scripts/vendor/sync-doc-counts.js` to fix, or update the doc to match.",
          );
        });
      });

      (check.notContains || []).forEach(function (needle) {
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
