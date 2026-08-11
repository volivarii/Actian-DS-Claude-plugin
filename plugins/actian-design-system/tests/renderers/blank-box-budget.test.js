#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var { measureBlankBoxes, compareBlankBoxes } = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "ds-coverage-report.js",
  ),
);

// The empty grey placeholder boxes the DS HTML renderer emits across the whole
// authorable vocabulary. For most of this plugin's audience, PMs and others with
// no Figma seat, that HTML render IS the product, so this count is a real
// quality number and not bookkeeping.
//
// It used to be guarded by two literals in this file, BUDGET = 136 and
// CHIP_BUDGET = 4, both baselined 2026-07-13 and described as ceilings that
// "RATCHET DOWN". Neither was ever lowered. By 2026-08-11 the renderer emitted
// 45 boxes and 2 chips, so the gate was carrying 91 boxes of silent headroom:
// the output could have tripled and still passed, and the gray-box programme's
// real win from 136 to 45 was invisible inside the very gate built to track it.
// A hand-maintained number standing in for a fact the data already knows is the
// same defect class as the hand-kept lists behind the 2026-07-25 outage.
//
// So the baseline is a GENERATED record, blank-box-baseline.json, and the rule
// is exact equality rather than a ceiling:
//
//   * a regression is a reviewable diff line (bar-graph 25 became 30), which is
//     louder than a total creeping from 136 to 137
//   * an improvement also fails, until it is banked with
//     `node scripts/renderers/ds-coverage-report.js --write-baseline`, which is
//     what stops the number going stale a second time
//
// The count is deliberately per slug. Today 42 of the 45 boxes are two chart
// components (bar-graph 25, line-graph 17), which a single total hides.
var BASELINE = require("./blank-box-baseline.json");
var { countBlankBoxes } = require(
  path.resolve(__dirname, "..", "..", "scripts", "renderers", "renderability.js"),
);

// measureBlankBoxes() re-parses the authoring markdown, rebuilds the doc map
// over ~72 slugs, and re-renders the unbuilt ones: expensive to repeat, and
// every assertion below wants the identical measurement anyway. Compute once
// and share it instead of calling it fresh from each `it` block.
var cached = null;
function renderAll() {
  if (!cached) cached = measureBlankBoxes();
  return cached;
}

function ratchetHint() {
  // Written as a cd + relative path on purpose: the bare invocation printed by
  // the first version failed when pasted from the repository root, and the one
  // instruction a failure gives has to work as written.
  return (
    "\n\nIf this change is correct, bank it:\n" +
    "  cd plugins/actian-design-system && \\\n" +
    "    node scripts/renderers/ds-coverage-report.js --write-baseline\n" +
    "then commit tests/renderers/blank-box-baseline.json, so the diff records " +
    "which slugs moved and in which direction. It refuses to write while any " +
    "slug has regressed or demoted to a chip."
  );
}

describe("blank-box budget", function () {
  it("POSITIVE CONTROL: the anatomy doc map is actually live", function () {
    // Without this, a broken/unset doc map chips every slug, emits zero blank
    // boxes, and the budget below passes while measuring NOTHING. Assert the
    // anatomy marker attribute (data-ds-slug=) is present in real output.
    var r = renderAll();
    assert.ok(
      r.anyAnatomy,
      "no slug rendered anatomy markup, so the doc map is not live and the " +
        "blank-box budget would pass vacuously",
    );
  });

  it("the authorable vocabulary is non-empty (guards a silent parse break)", function () {
    var r = renderAll();
    assert.ok(
      r.slugs.length > 50,
      "expected the ds-components-authoring.md table to parse to >50 slugs, got " +
        r.slugs.length,
    );
  });

  it("no slug emits more blank grey boxes than the recorded baseline", function () {
    var d = compareBlankBoxes(BASELINE, renderAll());
    assert.deepEqual(
      d.regressions,
      [],
      "blank-box count REGRESSED (total " +
        d.totalFrom +
        " -> " +
        d.totalTo +
        "). These slugs emit more empty boxes than they did:\n" +
        d.regressions
          .map(function (x) {
            return "  " + x.slug + ": " + x.from + " -> " + x.to;
          })
          .join("\n") +
        "\nFix the renderer. This one does not get banked: offering to " +
        "regenerate the baseline here is exactly how a regression would be " +
        "laundered into a green check.",
    );
  });

  it("the recorded baseline still describes the real output, in both directions", function () {
    var d = compareBlankBoxes(BASELINE, renderAll());
    var parts = [];
    if (d.improvements.length) {
      parts.push(
        "IMPROVED (record it):\n" +
          d.improvements
            .map(function (x) {
              return "  " + x.slug + ": " + x.from + " -> " + x.to;
            })
            .join("\n"),
      );
    }
    if (d.unlisted.length) {
      parts.push(
        "NOT IN THE BASELINE (a new or renamed slug):\n" +
          d.unlisted
            .map(function (x) {
              return "  " + x.slug + ": " + x.to;
            })
            .join("\n"),
      );
    }
    if (d.chipPromotions.length) {
      parts.push(
        "PROMOTED from a bare chip to real markup (progress, record it):\n" +
          d.chipPromotions
            .map(function (x) {
              return "  " + x.slug + ": " + x.from + " -> " + x.to;
            })
            .join("\n"),
      );
    }
    if (d.disappeared.length) {
      parts.push(
        "GONE FROM THE OUTPUT (removed, renamed, or newly built):\n" +
          d.disappeared
            .map(function (x) {
              return "  " + x.slug + ": was " + x.from;
            })
            .join("\n"),
      );
    }
    assert.equal(
      parts.length,
      0,
      "the baseline no longer matches what the renderer emits (total " +
        d.totalFrom +
        " -> " +
        d.totalTo +
        ").\n" +
        parts.join("\n") +
        ratchetHint(),
    );
  });

  it("SANITY: the blank-box detector still recognises a blank box", function () {
    // The false-zero control used to be `r.total > 0`, then briefly
    // `BASELINE.total > 0` gating that same check. A review found the second
    // form self-disarming: BASELINE.total is written by the very bank command
    // the sibling failures print, so banking one broken measurement would zero
    // it and skip this control for good.
    //
    // Assert the detector against markup instead of against the corpus. This
    // cannot be banked away, cannot go stale, and does not need retiring when
    // the real count legitimately reaches zero.
    var blank = '<div class="ds-appearance__vector" style="width:8px"></div>';
    assert.equal(countBlankBoxes(blank), 1, "a blank vector box must count");
    assert.equal(
      countBlankBoxes('<div class="ds-appearance__vector">real content</div>'),
      0,
      "a box with content in it is not blank",
    );
    assert.equal(countBlankBoxes(blank + blank), 2, "counts every occurrence");
  });

  it("the committed baseline is internally consistent", function () {
    // total is a separate field from perSlug, so a hand edit or a bad merge can
    // leave the two halves of the record disagreeing with each other while
    // nothing says so.
    var summed = Object.keys(BASELINE.perSlug).reduce(function (t, k) {
      return t + BASELINE.perSlug[k];
    }, 0);
    assert.equal(
      BASELINE.total,
      summed,
      "blank-box-baseline.json's total does not match its own perSlug sum, so " +
        "it was edited by hand rather than regenerated",
    );
  });

  it("the total number of blank boxes never rises, whatever the slugs are called", function () {
    // The rename-immune bound. The crude ceiling this replaced could not be
    // dodged by renaming a slug; a name-keyed comparison can be, and the held
    // knowledge tag sync renames radio-button-card to radio-card. A newly
    // authorable unbuilt slug lands here too.
    var d = compareBlankBoxes(BASELINE, renderAll());
    assert.equal(
      d.totalRose,
      false,
      "blank boxes rose from " +
        d.totalFrom +
        " to " +
        d.totalTo +
        ". Contributors:\n" +
        d.regressions
          .concat(d.unlisted.map(function (u) {
            return { slug: u.slug + " (new)", from: 0, to: u.to };
          }))
          .map(function (x) {
            return "  " + x.slug + ": " + x.from + " -> " + x.to;
          })
          .join("\n") +
        "\nA slug rename cannot hide inside this assertion, which is why it is " +
        "kept alongside the per-slug ones." +
        ratchetHint(),
    );
  });

  it("emits no new bare graceful-degradation chips", function () {
    // A bare chip means the slug renders nothing real, so a LOWER blank-box
    // total from that slug is a demotion, not an improvement. This is the
    // loophole the separate chip ceiling existed to close, kept as its own
    // assertion because its failure reads differently from a box count.
    var d = compareBlankBoxes(BASELINE, renderAll());
    assert.deepEqual(
      d.newChips,
      [],
      "these slugs demoted to a bare chip: " +
        d.newChips.join(", ") +
        ". They render nothing real now, so fix the renderer rather than " +
        "recording it.",
    );
  });

  it("records a chip that gained real anatomy", function () {
    var d = compareBlankBoxes(BASELINE, renderAll());
    assert.deepEqual(
      d.retiredChips,
      [],
      "these slugs are no longer bare chips, which is progress: " +
        d.retiredChips.join(", ") +
        ratchetHint(),
    );
  });
});
