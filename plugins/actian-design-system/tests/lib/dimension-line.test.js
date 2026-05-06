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

describe("vectorPathFor", function () {
  it("horizontal line goes left to right", function () {
    assert.strictEqual(mod.vectorPathFor(16, "horizontal"), "M 0 0 L 16 0 Z");
  });

  it("vertical line goes top to bottom", function () {
    assert.strictEqual(mod.vectorPathFor(24, "vertical"), "M 0 0 L 0 24 Z");
  });

  it("returns valid path even for zero distance (defensive — caller filters)", function () {
    assert.strictEqual(mod.vectorPathFor(0, "horizontal"), "M 0 0 L 0 0 Z");
  });

  it("throws on unknown orientation", function () {
    assert.throws(function () {
      mod.vectorPathFor(16, "diagonal");
    }, /Unknown orientation: diagonal/);
  });
});
