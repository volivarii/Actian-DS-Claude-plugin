// tests/fidelity/structural-check.test.js
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var S = require("../../scripts/fidelity/structural-check");

test("measureScript references the metrics we need", function () {
  var js = S.measureScript();
  assert.ok(/scrollWidth/.test(js) && /clientWidth/.test(js));
  assert.ok(/position/.test(js), "checks computed position for abs-pos");
  assert.ok(/fidelity-metrics/.test(js), "writes into a known element id");
});

test("parseMetrics extracts the embedded JSON from dumped DOM", function () {
  var dom = "<div id='fidelity-metrics'>{\"overflow\":false,\"clipped\":0,\"absPos\":0}</div>";
  assert.deepEqual(S.parseMetrics(dom), { overflow: false, clipped: 0, absPos: 0 });
});

test("verdict fails on overflow at any width", function () {
  var per = {
    1440: { overflow: false, clipped: 0, absPos: 0 },
    768: { overflow: true, clipped: 0, absPos: 0 },
    360: { overflow: false, clipped: 0, absPos: 0 },
  };
  var v = S.verdict(per);
  assert.equal(v.pass, false);
  assert.deepEqual(v.failures, [{ width: 768, kind: "overflow" }]);
});

test("verdict fails on absolute positioning (anti-rigid, v1 heuristic)", function () {
  var per = { 1440: { overflow: false, clipped: 0, absPos: 2 } };
  var v = S.verdict(per);
  assert.equal(v.pass, false);
  assert.ok(v.failures.some(function (f) { return f.kind === "abs-pos"; }));
});

test("verdict passes a clean leaf", function () {
  var per = {
    1440: { overflow: false, clipped: 0, absPos: 0 },
    768: { overflow: false, clipped: 0, absPos: 0 },
  };
  assert.deepEqual(S.verdict(per), { pass: true, failures: [], perWidth: per });
});
