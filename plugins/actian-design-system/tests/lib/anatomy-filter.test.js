#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var mod = require("../../scripts/lib/anatomy-filter.js");

describe("anatomy-filter — wiring", function () {
  it("exports the two pure functions", function () {
    assert.strictEqual(typeof mod.filterPartsByLayerExistence, "function");
    assert.strictEqual(typeof mod.pickClosestEdge, "function");
  });
});
