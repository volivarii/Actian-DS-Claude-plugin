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

describe("resolveSpacingValue", function () {
  it("returns token name when variable resolves", async function () {
    var lookup = async function (id) {
      assert.strictEqual(id, "VariableID:1:1");
      return { name: "--zen-spacing-md" };
    };
    var result = await mod.resolveSpacingValue(16, "VariableID:1:1", lookup);
    assert.deepStrictEqual(result, { px: 16, token: "--zen-spacing-md" });
  });

  it("returns token null when boundVariableId is null", async function () {
    var lookup = async function () {
      throw new Error("should not be called");
    };
    var result = await mod.resolveSpacingValue(8, null, lookup);
    assert.deepStrictEqual(result, { px: 8, token: null });
  });

  it("returns token null when boundVariableId is undefined", async function () {
    var result = await mod.resolveSpacingValue(8, undefined, async function () {
      throw new Error("should not be called");
    });
    assert.deepStrictEqual(result, { px: 8, token: null });
  });

  it("returns token null when lookup returns null", async function () {
    var lookup = async function () {
      return null;
    };
    var result = await mod.resolveSpacingValue(4, "VariableID:9:9", lookup);
    assert.deepStrictEqual(result, { px: 4, token: null });
  });

  it("returns token null when lookup throws", async function () {
    var lookup = async function () {
      throw new Error("variable deleted");
    };
    var result = await mod.resolveSpacingValue(12, "VariableID:8:8", lookup);
    assert.deepStrictEqual(result, { px: 12, token: null });
  });

  it("returns token null when lookup returns object without name", async function () {
    var lookup = async function () {
      return { id: "x" };
    };
    var result = await mod.resolveSpacingValue(2, "VariableID:7:7", lookup);
    assert.deepStrictEqual(result, { px: 2, token: null });
  });
});

describe("formatAnnotationLabel", function () {
  it("includes token when present", function () {
    assert.strictEqual(
      mod.formatAnnotationLabel({ px: 16, token: "--zen-spacing-md" }),
      "16px — --zen-spacing-md",
    );
  });

  it("returns plain px when token is null", function () {
    assert.strictEqual(
      mod.formatAnnotationLabel({ px: 16, token: null }),
      "16px",
    );
  });

  it("returns plain px when token is undefined", function () {
    assert.strictEqual(mod.formatAnnotationLabel({ px: 8 }), "8px");
  });
});

describe("dimensionAnnotationVariant", function () {
  it("paddingLeft is Horizontal regardless of autolayout", function () {
    assert.strictEqual(
      mod.dimensionAnnotationVariant("paddingLeft", "HORIZONTAL"),
      "Horizontal",
    );
    assert.strictEqual(
      mod.dimensionAnnotationVariant("paddingLeft", "VERTICAL"),
      "Horizontal",
    );
  });

  it("paddingRight is Horizontal regardless of autolayout", function () {
    assert.strictEqual(
      mod.dimensionAnnotationVariant("paddingRight", "HORIZONTAL"),
      "Horizontal",
    );
    assert.strictEqual(
      mod.dimensionAnnotationVariant("paddingRight", "VERTICAL"),
      "Horizontal",
    );
  });

  it("paddingTop is Vertical regardless of autolayout", function () {
    assert.strictEqual(
      mod.dimensionAnnotationVariant("paddingTop", "HORIZONTAL"),
      "Vertical",
    );
    assert.strictEqual(
      mod.dimensionAnnotationVariant("paddingTop", "VERTICAL"),
      "Vertical",
    );
  });

  it("paddingBottom is Vertical regardless of autolayout", function () {
    assert.strictEqual(
      mod.dimensionAnnotationVariant("paddingBottom", "HORIZONTAL"),
      "Vertical",
    );
    assert.strictEqual(
      mod.dimensionAnnotationVariant("paddingBottom", "VERTICAL"),
      "Vertical",
    );
  });

  it("itemSpacing follows autolayout direction (HORIZONTAL → Horizontal)", function () {
    assert.strictEqual(
      mod.dimensionAnnotationVariant("itemSpacing", "HORIZONTAL"),
      "Horizontal",
    );
  });

  it("itemSpacing follows autolayout direction (VERTICAL → Vertical)", function () {
    assert.strictEqual(
      mod.dimensionAnnotationVariant("itemSpacing", "VERTICAL"),
      "Vertical",
    );
  });

  it("throws on unknown property", function () {
    assert.throws(function () {
      mod.dimensionAnnotationVariant("strokeWidth", "HORIZONTAL");
    }, /Unknown property: strokeWidth/);
  });
});
