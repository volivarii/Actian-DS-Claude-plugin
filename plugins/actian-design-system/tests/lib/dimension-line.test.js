#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var mod = require("../../scripts/lib/dimension-line.js");

describe("dimension-line — wiring", function () {
  it("exports the three pure functions", function () {
    assert.strictEqual(typeof mod.vectorPathFor, "function");
    assert.strictEqual(typeof mod.endcapPositions, "function");
    assert.strictEqual(typeof mod.labelAnchorFor, "function");
  });
});
