#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var mod = require("../../scripts/lib/gutter-layout.js");

describe("gutter-layout — wiring", function () {
  it("exports the two pure functions", function () {
    assert.strictEqual(typeof mod.computeGutterSlots, "function");
    assert.strictEqual(typeof mod.buildLeaderPath, "function");
  });
});

describe("computeGutterSlots", function () {
  var ENTRY_HEIGHT = 28;

  it("returns empty array for no entries", function () {
    var slots = mod.computeGutterSlots([], ENTRY_HEIGHT);
    assert.deepStrictEqual(slots, []);
  });

  it("single entry — slot centered on anchor", function () {
    var slots = mod.computeGutterSlots([{ anchorY: 100 }], ENTRY_HEIGHT);
    // ideal = anchorY - entryHeight/2 = 100 - 14 = 86; nextY starts at 0 so slotY = max(0, 86) = 86
    assert.deepStrictEqual(slots, [{ slotY: 86, anchorY: 100 }]);
  });

  it("two non-overlapping entries — both stay centered on anchors", function () {
    var slots = mod.computeGutterSlots(
      [{ anchorY: 50 }, { anchorY: 200 }],
      ENTRY_HEIGHT,
    );
    assert.strictEqual(slots[0].slotY, 36); // 50 - 14
    assert.strictEqual(slots[1].slotY, 186); // 200 - 14, doesn't conflict with 36+28=64
  });

  it("two overlapping entries — second pushed down to maintain entryHeight gap", function () {
    var slots = mod.computeGutterSlots(
      [{ anchorY: 50 }, { anchorY: 60 }],
      ENTRY_HEIGHT,
    );
    // first: ideal 36, slot 36
    // second: ideal 46, but 36 + 28 = 64; max(64, 46) = 64
    assert.strictEqual(slots[0].slotY, 36);
    assert.strictEqual(slots[1].slotY, 64);
  });

  it("anchor near zero — slot does not go negative", function () {
    var slots = mod.computeGutterSlots([{ anchorY: 5 }], ENTRY_HEIGHT);
    // ideal = 5 - 14 = -9; max(0, -9) = 0
    assert.strictEqual(slots[0].slotY, 0);
  });

  it("five tightly packed entries — all stack with entryHeight spacing", function () {
    var slots = mod.computeGutterSlots(
      [
        { anchorY: 10 },
        { anchorY: 12 },
        { anchorY: 14 },
        { anchorY: 16 },
        { anchorY: 18 },
      ],
      ENTRY_HEIGHT,
    );
    assert.strictEqual(slots[0].slotY, 0); // ideal -4 clamped to 0
    assert.strictEqual(slots[1].slotY, 28); // 0 + 28
    assert.strictEqual(slots[2].slotY, 56);
    assert.strictEqual(slots[3].slotY, 84);
    assert.strictEqual(slots[4].slotY, 112);
  });

  it("preserves anchorY in output (caller needs both slot and anchor for leader routing)", function () {
    var slots = mod.computeGutterSlots(
      [{ anchorY: 50 }, { anchorY: 200 }],
      ENTRY_HEIGHT,
    );
    assert.strictEqual(slots[0].anchorY, 50);
    assert.strictEqual(slots[1].anchorY, 200);
  });
});
