#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");

var transform = require("../../scripts/transformers/transformers/transform-styles.js");

// Sample REST /styles entry shapes
var SAMPLE_STYLES_PAYLOAD = {
  meta: {
    styles: [
      { key: "effect-key-1", node_id: "100:1", style_type: "EFFECT", name: "shadow-sm", description: "" },
      { key: "effect-key-2", node_id: "100:2", style_type: "EFFECT", name: "shadow-md", description: "" },
      { key: "text-key-1",   node_id: "200:1", style_type: "TEXT",   name: "heading-display", description: "" },
      { key: "text-key-2",   node_id: "200:2", style_type: "TEXT",   name: "body-standard", description: "" },
      // Non-effect, non-text — should be ignored
      { key: "fill-key",     node_id: "300:1", style_type: "FILL",   name: "primary-fill", description: "" },
      { key: "grid-key",     node_id: "300:2", style_type: "GRID",   name: "12-col grid", description: "" },
    ],
  },
};

var SAMPLE_NODES = {
  // Effect style — shadow-sm: 2 DROP_SHADOW layers
  "100:1": {
    document: {
      id: "100:1",
      name: "shadow-sm",
      type: "RECTANGLE",
      effects: [
        { type: "DROP_SHADOW", visible: true,
          color: { r: 0, g: 0, b: 0.078, a: 0.08 },
          offset: { x: 0, y: 1 }, radius: 7, spread: 3 },
        { type: "DROP_SHADOW", visible: true,
          color: { r: 0, g: 0, b: 0.122, a: 0.12 },
          offset: { x: 0, y: 1 }, radius: 3, spread: 1 },
      ],
    },
  },
  "100:2": {
    document: {
      id: "100:2",
      name: "shadow-md",
      type: "RECTANGLE",
      effects: [
        { type: "DROP_SHADOW", visible: true,
          color: { r: 0, g: 0, b: 0.302, a: 0.30 },
          offset: { x: 0, y: 1 }, radius: 3, spread: 0 },
      ],
    },
  },
  // Text style — heading-display
  "200:1": {
    document: {
      id: "200:1",
      name: "heading-display",
      type: "TEXT",
      characters: "Sample",
      style: {
        fontFamily: "Roboto",
        fontStyle: "SemiBold",
        fontWeight: 600,
        fontSize: 24,
        letterSpacing: 0,
        lineHeightUnit: "PIXELS",
        lineHeightPx: 32,
      },
    },
  },
  // Text style — body-standard with explicit textDecoration + textCase
  "200:2": {
    document: {
      id: "200:2",
      name: "body-standard",
      type: "TEXT",
      characters: "Sample",
      style: {
        fontFamily: "Roboto",
        fontStyle: "Regular",
        fontWeight: 400,
        fontSize: 14,
        letterSpacing: 0.2,
        lineHeightUnit: "PIXELS",
        lineHeightPx: 20,
        textDecoration: "UNDERLINE",
        textCase: "UPPER",
      },
    },
  },
};

describe("transform-styles", function () {
  describe("output shape", function () {
    var result = transform({ stylesPayload: SAMPLE_STYLES_PAYLOAD, nodes: SAMPLE_NODES });

    it("returns { textStyles, effectStyles } only", function () {
      assert.deepStrictEqual(Object.keys(result).sort(), ["effectStyles", "textStyles"]);
    });

    it("ignores FILL/GRID styles", function () {
      var allKeys = result.textStyles.concat(result.effectStyles).map(s => s.key);
      assert.ok(allKeys.indexOf("fill-key") === -1);
      assert.ok(allKeys.indexOf("grid-key") === -1);
    });
  });

  describe("effect styles", function () {
    var result = transform({ stylesPayload: SAMPLE_STYLES_PAYLOAD, nodes: SAMPLE_NODES });

    it("extracts both effect entries", function () {
      assert.strictEqual(result.effectStyles.length, 2);
      assert.deepStrictEqual(result.effectStyles.map(e => e.name).sort(), ["shadow-md", "shadow-sm"]);
    });

    it("preserves effect array shape (type/color/offset/radius/spread/visible)", function () {
      var sm = result.effectStyles.find(e => e.name === "shadow-sm");
      assert.strictEqual(sm.key, "effect-key-1");
      assert.strictEqual(sm.effects.length, 2);
      var first = sm.effects[0];
      assert.strictEqual(first.type, "DROP_SHADOW");
      assert.deepStrictEqual(first.offset, { x: 0, y: 1 });
      assert.strictEqual(first.radius, 7);
      assert.strictEqual(first.spread, 3);
      assert.strictEqual(first.visible, true);
      assert.ok(typeof first.color === "object");
      assert.ok(Math.abs(first.color.a - 0.08) < 0.01);
    });
  });

  describe("text styles", function () {
    var result = transform({ stylesPayload: SAMPLE_STYLES_PAYLOAD, nodes: SAMPLE_NODES });

    it("extracts both text entries", function () {
      assert.strictEqual(result.textStyles.length, 2);
    });

    it("converts lineHeight + letterSpacing to {unit, value} shape", function () {
      var hd = result.textStyles.find(s => s.name === "heading-display");
      assert.strictEqual(hd.fontFamily, "Roboto");
      assert.strictEqual(hd.fontStyle, "SemiBold");
      assert.strictEqual(hd.fontSize, 24);
      assert.deepStrictEqual(hd.lineHeight, { unit: "PIXELS", value: 32 });
      assert.deepStrictEqual(hd.letterSpacing, { unit: "PIXELS", value: 0 });
    });

    it("preserves textDecoration + textCase when explicitly set", function () {
      var bs = result.textStyles.find(s => s.name === "body-standard");
      assert.strictEqual(bs.textDecoration, "UNDERLINE");
      assert.strictEqual(bs.textCase, "UPPER");
    });

    it("defaults textDecoration=NONE and textCase=ORIGINAL when absent", function () {
      var hd = result.textStyles.find(s => s.name === "heading-display");
      assert.strictEqual(hd.textDecoration, "NONE");
      assert.strictEqual(hd.textCase, "ORIGINAL");
    });
  });

  describe("error handling", function () {
    it("returns empty arrays when stylesPayload has no styles", function () {
      var result = transform({ stylesPayload: { meta: { styles: [] } }, nodes: {} });
      assert.deepStrictEqual(result, { textStyles: [], effectStyles: [] });
    });

    it("skips style entries whose node payload is missing", function () {
      // Effect style listed in /styles but missing from /nodes — skip silently
      var result = transform({
        stylesPayload: { meta: { styles: [
          { key: "k1", node_id: "X:Y", style_type: "EFFECT", name: "missing", description: "" },
        ] } },
        nodes: {}, // no node entry for X:Y
      });
      assert.strictEqual(result.effectStyles.length, 0);
    });
  });
});
