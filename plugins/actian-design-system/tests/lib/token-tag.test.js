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
