#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var mod = require("../../scripts/lib/specs-extraction.js");

describe("specs-extraction module", function () {
  it("exports the four decision functions", function () {
    assert.strictEqual(typeof mod.shouldSurfaceFrame, "function");
    assert.strictEqual(typeof mod.resolveSpacingValue, "function");
    assert.strictEqual(typeof mod.formatAnnotationLabel, "function");
    assert.strictEqual(typeof mod.dimensionAnnotationVariant, "function");
  });
});

describe("shouldSurfaceFrame", function () {
  var anatomyParts = [{ figmaLayerName: "Box" }, { figmaLayerName: "Label" }];

  it("returns true for top-level instance regardless of children", function () {
    assert.strictEqual(
      mod.shouldSurfaceFrame(
        { name: "Checkbox", children: [] },
        anatomyParts,
        true,
      ),
      true,
    );
  });

  it("returns true when a direct child name matches an anatomy part", function () {
    var frame = {
      name: "Inner",
      children: [{ name: "Label" }, { name: "Helper" }],
    };
    assert.strictEqual(
      mod.shouldSurfaceFrame(frame, anatomyParts, false),
      true,
    );
  });

  it("returns false when no direct child matches an anatomy part", function () {
    var frame = {
      name: "Inner",
      children: [{ name: "Helper" }, { name: "Decoration" }],
    };
    assert.strictEqual(
      mod.shouldSurfaceFrame(frame, anatomyParts, false),
      false,
    );
  });

  it("returns false for nested empty frame", function () {
    assert.strictEqual(
      mod.shouldSurfaceFrame(
        { name: "Empty", children: [] },
        anatomyParts,
        false,
      ),
      false,
    );
  });

  it("returns false when children property is missing", function () {
    assert.strictEqual(
      mod.shouldSurfaceFrame({ name: "Empty" }, anatomyParts, false),
      false,
    );
  });
});
