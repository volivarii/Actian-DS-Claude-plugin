#!/usr/bin/env node
"use strict";

/**
 * sync-doc-counts.test.js — Tests for the doc-count FIXER (the write side of
 * the doc-counts contract). doc-counts.test.js GUARDS that the managed docs
 * state the derived counts; this fixer REWRITES them to match when a vendor
 * refresh changes a registry count, so count-changing refreshes self-heal
 * instead of failing CI and leaving the auto-merge PR stuck.
 *
 * Shared source of truth: scripts/lib/doc-counts.js (deriveCounts + buildChecks
 * + fixContent) — the same module the guard consumes, so guard and fixer can
 * never disagree.
 *
 * Zero dependencies — Node.js built-ins only.
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var {
  deriveCounts,
  buildChecks,
  fixContent,
  syncDocCounts,
} = require("../../scripts/lib/doc-counts.js");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var REPO_ROOT = path.resolve(PLUGIN_ROOT, "..", "..");

describe("doc-count fixer (fixContent)", function () {
  it("replaces a stale numeric phrase with the canonical string via its fixRx", function () {
    var items = [
      {
        str: "319 DS Kit components (80 sets)",
        fixRx: /\d+ DS Kit components \(\d+ sets\)/g,
      },
    ];
    assert.equal(
      fixContent("we ship 312 DS Kit components (77 sets) today", items),
      "we ship 319 DS Kit components (80 sets) today",
    );
  });

  it("rewrites every occurrence (global), not just the first", function () {
    var items = [{ str: "9 agents", fixRx: /\d+ agents/g }];
    assert.equal(
      fixContent("8 agents here and 8 agents there", items),
      "9 agents here and 9 agents there",
    );
  });

  it("leaves literal items (no fixRx) untouched", function () {
    var items = [{ str: "WCAG 2.2 AA" }];
    assert.equal(fixContent("WCAG 2.1 AA stuff", items), "WCAG 2.1 AA stuff");
  });

  it("treats the replacement as a literal (no $-pattern interpretation)", function () {
    var items = [{ str: "a$1b", fixRx: /XX/g }];
    assert.equal(fixContent("zzXXzz", items), "zza$1bzz");
  });
});

describe("doc-count fixer × real managed docs", function () {
  var counts = deriveCounts();
  var checks = buildChecks(counts);

  it("is idempotent on the real docs when counts are already correct", function () {
    // Safety net against an over-greedy fixRx: if any pattern would rewrite a
    // CORRECT doc (e.g. clobber the foundations "8 JSON files" while fixing the
    // "45 JSON files, all curated" guideline count), the doc changes here and
    // this fails. (It guards GREEDINESS, not COMPLETENESS — a count phrase with
    // no fixRx simply isn't synced; the doc-counts guard covers presence.)
    checks.forEach(function (check) {
      var p = path.join(REPO_ROOT, check.file);
      if (!fs.existsSync(p)) return;
      var content = fs.readFileSync(p, "utf8");
      var fixed = fixContent(content, check.contains);
      assert.equal(
        fixed,
        content,
        check.file +
          " was modified by the fixer despite correct counts — a fixRx is too greedy.",
      );
    });
  });

  it("restores a perturbed README count to the derived value", function () {
    var readme = checks.find(function (c) {
      return c.file === "README.md";
    });
    var content = fs.readFileSync(path.join(REPO_ROOT, "README.md"), "utf8");
    var stale = content.replace(
      counts.DS.count + " DS Kit + " + counts.FM.count + " FM Kit",
      counts.DS.count - 1 + " DS Kit + " + counts.FM.count + " FM Kit",
    );
    assert.notEqual(stale, content, "perturbation should have changed README");
    var fixed = fixContent(stale, readme.contains);
    assert.equal(
      fixed,
      content,
      "fixer should restore the perturbed README to the correct counts",
    );
  });
});

describe("syncDocCounts (file-level)", function () {
  it("reports no changes on the current repo in dry-run (docs already correct)", function () {
    var res = syncDocCounts(REPO_ROOT, { write: false });
    assert.deepEqual(
      res.changed,
      [],
      "dry run should report no stale docs, got: " + res.changed.join(", "),
    );
  });

  it("returns the derived counts alongside the change list", function () {
    var res = syncDocCounts(REPO_ROOT, { write: false });
    assert.equal(typeof res.counts.DS.count, "number");
    assert.ok(Array.isArray(res.changed));
  });
});
