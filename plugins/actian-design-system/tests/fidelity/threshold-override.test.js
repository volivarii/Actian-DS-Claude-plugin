"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var RF = require("../../scripts/fidelity/run-fidelity");

test("thresholdFor returns the per-slug override when present, else the default", function () {
  assert.equal(RF.thresholdFor("button", 0.06, { button: 0.09 }), 0.09);
  assert.equal(RF.thresholdFor("badge", 0.06, { button: 0.09 }), 0.06);
});
