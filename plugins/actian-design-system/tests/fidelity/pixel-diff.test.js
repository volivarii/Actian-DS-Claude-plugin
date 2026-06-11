// tests/fidelity/pixel-diff.test.js
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var P = require("../../scripts/fidelity/pixel-diff");

test("buildNormalizeArgs trims + flattens to a canvas", function () {
  var a = P.buildNormalizeArgs("in.webp", "out.png");
  assert.ok(a.indexOf("-trim") >= 0 && a.indexOf("+repage") >= 0);
  assert.equal(a[0], "in.webp");
  assert.equal(a[a.length - 1], "out.png");
});

test("buildCompareArgs targets RMSE with fuzz", function () {
  var a = P.buildCompareArgs({ a: "x.png", b: "y.png", fuzz: 3 });
  assert.ok(a.indexOf("-metric") >= 0 && a.indexOf("RMSE") >= 0);
  assert.ok(a.indexOf("-fuzz") >= 0 && a.indexOf("3%") >= 0);
});

test("parseMetric reads the normalized RMSE from compare stderr", function () {
  // ImageMagick compare emits e.g. "1357.36 (0.0207100)" on stderr
  assert.ok(Math.abs(P.parseMetric("1357.36 (0.0207100)") - 0.02071) < 1e-6);
  assert.equal(P.parseMetric("garbage"), null);
  // perfect-match is Gate 1's success path — must read 0, not null
  assert.equal(P.parseMetric("0 (0)"), 0);
});

test("gridVerdict fails if ANY cell exceeds threshold", function () {
  assert.equal(P.gridVerdict([0.01, 0.02, 0.015], 0.05).pass, true);
  var v = P.gridVerdict([0.01, 0.09, 0.02], 0.05);
  assert.equal(v.pass, false);
  assert.equal(v.worstCell, 0.09);
});

test("aspectMismatch flags structural divergence beyond tolerance", function () {
  assert.equal(
    P.aspectMismatch({ w: 100, h: 50 }, { w: 100, h: 51 }, 0.1),
    false,
  );
  assert.equal(
    P.aspectMismatch({ w: 100, h: 50 }, { w: 100, h: 90 }, 0.1),
    true,
  );
});

test("gridVerdict empty array passes with worstCell 0", function () {
  var v = P.gridVerdict([], 0.05);
  assert.equal(v.pass, true);
  assert.equal(v.worstCell, 0);
  assert.equal(v.cells, 0);
});
