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

describe("endcapPositions", function () {
  it("horizontal — cap1 at x=0, cap2 at x=distance, both rotated 90°", function () {
    var caps = mod.endcapPositions(16, "horizontal", 1);
    assert.strictEqual(caps.cap1.x, 0);
    assert.strictEqual(caps.cap2.x, 16);
    assert.strictEqual(caps.cap1.rotation, 90);
    assert.strictEqual(caps.cap2.rotation, 90);
  });

  it("horizontal — caps centered vertically on the line (y = -length/2)", function () {
    var caps = mod.endcapPositions(16, "horizontal", 1);
    var expectedLength = 1 + 6; // strokeWeight + 6
    assert.strictEqual(caps.cap1.y, -expectedLength / 2);
    assert.strictEqual(caps.cap2.y, -expectedLength / 2);
  });

  it("vertical — cap1 at y=0, cap2 at y=distance, both rotated 0°", function () {
    var caps = mod.endcapPositions(24, "vertical", 1);
    assert.strictEqual(caps.cap1.y, 0);
    assert.strictEqual(caps.cap2.y, 24);
    assert.strictEqual(caps.cap1.rotation, 0);
    assert.strictEqual(caps.cap2.rotation, 0);
  });

  it("vertical — caps centered horizontally on the line (x = -length/2)", function () {
    var caps = mod.endcapPositions(24, "vertical", 1);
    var expectedLength = 1 + 6;
    assert.strictEqual(caps.cap1.x, -expectedLength / 2);
    assert.strictEqual(caps.cap2.x, -expectedLength / 2);
  });

  it("length scales with strokeWeight (cap = strokeWeight + 6)", function () {
    var caps = mod.endcapPositions(16, "horizontal", 2);
    assert.strictEqual(caps.length, 8); // 2 + 6
  });

  it("throws on unknown orientation", function () {
    assert.throws(function () {
      mod.endcapPositions(16, "diagonal", 1);
    }, /Unknown orientation: diagonal/);
  });
});
