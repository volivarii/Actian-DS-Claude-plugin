"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var RF = require("../../scripts/fidelity/run-fidelity");

test("thresholdFor returns the per-slug override when present, else the default", function () {
  assert.equal(RF.thresholdFor("button", 0.06, { button: 0.09 }), 0.09);
  assert.equal(RF.thresholdFor("badge", 0.06, { button: 0.09 }), 0.06);
});

test("thresholdFor falls back to the module THRESHOLD_OVERRIDES table when none is passed", function () {
  // This 2-arg form is the production call site (runPixel). With the default
  // table empty, every slug resolves to the global default — guards the
  // `overrides || THRESHOLD_OVERRIDES` default-arg wiring against regression.
  assert.equal(RF.thresholdFor("button", 0.06), 0.06);
  assert.equal(RF.thresholdFor("alert-banner", 0.06), 0.06);
});
