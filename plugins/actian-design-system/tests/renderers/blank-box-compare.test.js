"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");

var R = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "ds-coverage-report.js",
  ),
);

// Why this comparison exists at all.
//
// The blank-box gate shipped on 2026-07-13 with two literals in the test file:
// BUDGET = 136 and CHIP_BUDGET = 4, described as ceilings that "RATCHET DOWN".
// Neither was ever lowered. Measured on 2026-08-11 the renderer emits 45 boxes
// and 2 chips, so the gate carried 91 boxes of silent headroom: output could
// have tripled and still passed, while the gray-box programme's real win from
// 136 to 45 was invisible in the very gate built to track it.
//
// A hand-maintained number standing in for a fact the data already knows is the
// same defect class as the hand-kept lists behind the 2026-07-25 outage. So the
// baseline is now a generated per-slug record, and the rule is exact equality:
// the committed baseline must equal what the renderer actually emits. A
// regression shows up as a diff line saying 25 became 30, which is louder than
// a total creeping from 136 to 137, and an improvement has to be recorded to go
// green, which is what keeps the number true.

function baseline(perSlug, chipSlugs) {
  return { perSlug: perSlug, chipSlugs: chipSlugs || [] };
}

test("compareBlankBoxes: an exact match is clean", function () {
  var d = R.compareBlankBoxes(
    baseline({ "bar-graph": 25, "checkbox-card": 2 }, ["scroll-bar"]),
    { perSlug: { "bar-graph": 25, "checkbox-card": 2 }, chipSlugs: ["scroll-bar"] },
  );
  assert.equal(d.clean, true);
  assert.deepEqual(d.regressions, []);
  assert.deepEqual(d.improvements, []);
});

test("compareBlankBoxes: a slug emitting MORE boxes than recorded is a regression", function () {
  var d = R.compareBlankBoxes(baseline({ "bar-graph": 25 }), {
    perSlug: { "bar-graph": 30 },
    chipSlugs: [],
  });
  assert.equal(d.clean, false);
  assert.deepEqual(d.regressions, [
    { slug: "bar-graph", from: 25, to: 30 },
  ]);
});

test("compareBlankBoxes: a slug emitting FEWER boxes is an improvement, and still has to be recorded", function () {
  var d = R.compareBlankBoxes(baseline({ "bar-graph": 25 }), {
    perSlug: { "bar-graph": 4 },
    chipSlugs: [],
  });
  assert.equal(d.clean, false, "an unrecorded improvement is not clean");
  assert.deepEqual(d.improvements, [{ slug: "bar-graph", from: 25, to: 4 }]);
  assert.deepEqual(d.regressions, []);
});

test("compareBlankBoxes: a slug the baseline has never seen is reported as unlisted", function () {
  var d = R.compareBlankBoxes(baseline({ "bar-graph": 25 }), {
    perSlug: { "bar-graph": 25, "pie-graph": 9 },
    chipSlugs: [],
  });
  assert.deepEqual(d.unlisted, [{ slug: "pie-graph", to: 9 }]);
});

test("compareBlankBoxes: a recorded slug that vanished is reported, since a rename must not pass silently", function () {
  // radio-button-card becomes radio-card in the held tag sync, so this is the
  // live case, not a hypothetical.
  var d = R.compareBlankBoxes(baseline({ "radio-button-card": 1 }), {
    perSlug: { "radio-card": 1 },
    chipSlugs: [],
  });
  assert.deepEqual(d.disappeared, [{ slug: "radio-button-card", from: 1 }]);
  assert.deepEqual(d.unlisted, [{ slug: "radio-card", to: 1 }]);
});

test("compareBlankBoxes: a new graceful-degradation chip is a regression", function () {
  // The loophole the separate chip ceiling was written to close: a slug that
  // used to render real markup can demote to a bare chip, which makes the box
  // count look better while the output got worse.
  var d = R.compareBlankBoxes(baseline({}, ["scroll-bar"]), {
    perSlug: {},
    chipSlugs: ["scroll-bar", "notification-dropdown"],
  });
  assert.equal(d.clean, false);
  assert.deepEqual(d.newChips, ["notification-dropdown"]);
});

test("compareBlankBoxes: a chip that gained real anatomy is an improvement", function () {
  var d = R.compareBlankBoxes(baseline({}, ["scroll-bar", "lineage-connecting-line"]), {
    perSlug: {},
    chipSlugs: ["scroll-bar"],
  });
  assert.deepEqual(d.retiredChips, ["lineage-connecting-line"]);
  assert.deepEqual(d.newChips, []);
});

test("compareBlankBoxes: the totals both ways are reported, so the message can state direction", function () {
  var d = R.compareBlankBoxes(baseline({ a: 10, b: 5 }), {
    perSlug: { a: 10, b: 1 },
    chipSlugs: [],
  });
  assert.equal(d.totalFrom, 15);
  assert.equal(d.totalTo, 11);
});
