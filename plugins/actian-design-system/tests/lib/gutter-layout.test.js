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

describe("buildLeaderPath", function () {
  it("slot aligned with anchor — single horizontal segment + tick, no witness", function () {
    var path = mod.buildLeaderPath(86, 100, 220, 24, 6, 24);
    // labelCenterY = 86 + 12 = 98 ≈ anchorY 100 (within 2px? no, 2px diff exactly)
    // labelCenterY (98) vs anchorY (100) — abs diff = 2, NOT > 2, so no witness
    assert.strictEqual(path.witnessLine, null);
    assert.strictEqual(path.horizontalLine.x, 0);
    assert.strictEqual(path.horizontalLine.y, 98);
    assert.strictEqual(path.horizontalLine.length, 244); // gutterWidth + gutterGap = 220 + 24
    assert.strictEqual(path.horizontalLine.orientation, "horizontal");
  });

  it("slot below anchor — witness line goes UP from leader to anchor", function () {
    var path = mod.buildLeaderPath(150, 100, 220, 24, 6, 24);
    // labelCenterY = 150 + 12 = 162; anchorY = 100; |diff| = 62, > 2
    assert.notStrictEqual(path.witnessLine, null);
    assert.strictEqual(path.witnessLine.x, 244); // bendX = gutterWidth + gutterGap
    assert.strictEqual(path.witnessLine.y, 100); // min(labelCenterY 162, anchorY 100)
    assert.strictEqual(path.witnessLine.length, 62); // |162 - 100|
    assert.strictEqual(path.witnessLine.orientation, "vertical");
  });

  it("slot above anchor — witness line goes DOWN from leader to anchor", function () {
    var path = mod.buildLeaderPath(50, 200, 220, 24, 6, 24);
    // labelCenterY = 50 + 12 = 62; anchorY = 200; |diff| = 138
    assert.strictEqual(path.witnessLine.x, 244);
    assert.strictEqual(path.witnessLine.y, 62); // min(62, 200)
    assert.strictEqual(path.witnessLine.length, 138);
  });

  it("tick is positioned at component left edge at anchor Y, with given length", function () {
    var path = mod.buildLeaderPath(50, 200, 220, 24, 6, 24);
    assert.strictEqual(path.tick.x, 244); // bendX
    assert.strictEqual(path.tick.y, 200);
    assert.strictEqual(path.tick.length, 6);
    assert.strictEqual(path.tick.orientation, "horizontal");
  });

  it("witness skipped within 2px tolerance (alignment threshold)", function () {
    var path = mod.buildLeaderPath(87, 100, 220, 24, 6, 24);
    // labelCenterY = 87 + 12 = 99; |99 - 100| = 1, ≤ 2, no witness
    assert.strictEqual(path.witnessLine, null);
  });

  it("witness emitted when difference is exactly 3px (just above threshold)", function () {
    var path = mod.buildLeaderPath(85, 100, 220, 24, 6, 24);
    // labelCenterY = 85 + 12 = 97; |97 - 100| = 3, > 2, witness emitted
    assert.notStrictEqual(path.witnessLine, null);
  });

  it("respects custom pillHeight in labelCenterY computation", function () {
    var path = mod.buildLeaderPath(50, 100, 220, 24, 6, 30);
    // labelCenterY = 50 + 15 = 65 (with pillHeight 30)
    assert.strictEqual(path.horizontalLine.y, 65);
  });
});
