"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var F = require("../../scripts/fidelity/fidelity-report");

test("aggregate computes mean over SCORED rows + counts skipped", function () {
  var rows = [
    {
      slug: "button",
      fidelity: { score: 1.0 },
      gates: { pixel_diff: "pass", responsive_structural: "pass" },
    },
    {
      slug: "alert-banner",
      fidelity: { score: 0.0 },
      gates: { pixel_diff: "fail", responsive_structural: "pass" },
    },
    {
      slug: "checkbox-with-label",
      fidelity: { score: null },
      gates: {
        pixel_diff: "skip(imagemagick-missing)",
        responsive_structural: "pass",
      },
    },
  ];
  var agg = F.aggregate(rows);
  assert.equal(agg.count, 3);
  assert.equal(agg.scored, 2);
  assert.equal(agg.skipped, 1);
  assert.equal(agg.meanScore, 0.5); // mean over the 2 scored rows, NOT 3
  assert.equal(agg.structuralPass, 3);
  assert.equal(agg.pixelPass, 1);
});

test("aggregate meanScore is null when all rows are pixel-skipped", function () {
  var rows = [
    {
      slug: "button",
      fidelity: { score: null },
      gates: { responsive_structural: "pass" },
    },
  ];
  var agg = F.aggregate(rows);
  assert.equal(agg.scored, 0);
  assert.equal(agg.meanScore, null);
});

test("latestPerSlug keeps the most recent row per slug", function () {
  var rows = [
    { slug: "button", date: "2026-06-01", fidelity: { score: 0.0 } },
    { slug: "button", date: "2026-06-11", fidelity: { score: 1.0 } },
  ];
  var latest = F.latestPerSlug(rows);
  assert.equal(latest.length, 1);
  assert.equal(latest[0].fidelity.score, 1.0);
});
