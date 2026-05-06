#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var mod = require("../../scripts/lib/token-tag.js");

describe("token-tag — wiring", function () {
  it("exports the two pure functions", function () {
    assert.strictEqual(typeof mod.tokenTagSpec, "function");
    assert.strictEqual(typeof mod.tokenTagDimensions, "function");
  });
});

describe("tokenTagSpec", function () {
  it("returns the style object with the input text", function () {
    var spec = mod.tokenTagSpec("--zen-spacing-md");
    assert.strictEqual(spec.text, "--zen-spacing-md");
  });

  it("uses Inter Medium 12px monospace-style font", function () {
    var spec = mod.tokenTagSpec("--zen-color-primary");
    assert.deepStrictEqual(spec.fontName, { family: "Inter", style: "Medium" });
    assert.strictEqual(spec.fontSize, 12);
  });

  it("returns RGB color objects (not hex strings) for fills", function () {
    var spec = mod.tokenTagSpec("--zen-radius-sm");
    assert.strictEqual(typeof spec.bgColor.r, "number");
    assert.strictEqual(typeof spec.bgColor.g, "number");
    assert.strictEqual(typeof spec.bgColor.b, "number");
    assert.strictEqual(typeof spec.fgColor.r, "number");
    assert.strictEqual(typeof spec.fgColor.g, "number");
    assert.strictEqual(typeof spec.fgColor.b, "number");
  });

  it("returns padding 5 horizontal × 2 vertical and corner radius 3", function () {
    var spec = mod.tokenTagSpec("--zen-spacing-2xs");
    assert.strictEqual(spec.paddingX, 5);
    assert.strictEqual(spec.paddingY, 2);
    assert.strictEqual(spec.cornerRadius, 3);
  });

  it("preserves empty string input", function () {
    var spec = mod.tokenTagSpec("");
    assert.strictEqual(spec.text, "");
  });
});

describe("tokenTagDimensions", function () {
  // Standard fontMetrics for Inter Medium 12px — avgCharWidth ≈ 6.5, lineHeight ≈ 18
  var STANDARD = { avgCharWidth: 6.5, lineHeight: 18 };

  it("width grows linearly with text length", function () {
    var short = mod.tokenTagDimensions("ab", STANDARD);
    var long = mod.tokenTagDimensions("abcdefgh", STANDARD);
    assert.ok(long.width > short.width, "longer text → wider tag");
    // 6 extra chars × 6.5 avgCharWidth = 39px wider
    assert.ok(long.width - short.width >= 39 && long.width - short.width <= 40);
  });

  it("includes horizontal padding (5px each side = 10px)", function () {
    var dims = mod.tokenTagDimensions("a", STANDARD);
    // 1 char × 6.5 avgCharWidth + 10 padding = 16.5
    assert.ok(dims.width >= 16 && dims.width <= 17);
  });

  it("height is constant — lineHeight + 2*paddingY (regardless of text length)", function () {
    var short = mod.tokenTagDimensions("a", STANDARD);
    var long = mod.tokenTagDimensions("--zen-spacing-very-long-name", STANDARD);
    assert.strictEqual(short.height, long.height);
    // lineHeight 18 + 2*paddingY 2 = 22
    assert.strictEqual(short.height, 22);
  });

  it("handles empty text — width is just padding (10)", function () {
    var dims = mod.tokenTagDimensions("", STANDARD);
    assert.strictEqual(dims.width, 10);
  });

  it("uses provided fontMetrics — different metrics produce different widths", function () {
    var narrow = mod.tokenTagDimensions("hello", {
      avgCharWidth: 5,
      lineHeight: 18,
    });
    var wide = mod.tokenTagDimensions("hello", {
      avgCharWidth: 8,
      lineHeight: 18,
    });
    assert.ok(wide.width > narrow.width);
    // 5 chars × (8-5) = 15px difference
    assert.strictEqual(wide.width - narrow.width, 15);
  });
});
