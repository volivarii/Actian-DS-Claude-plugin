#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..");
var rules = require(
  path.join(
    PLUGIN_ROOT,
    "scripts",
    "validation",
    "component-property-rules.js",
  ),
);

describe("component-property-rules", function () {
  describe("isPlaceholderDefault", function () {
    it("matches Page Title", function () {
      assert.strictEqual(rules.isPlaceholderDefault("Page Title"), true);
    });
    it("matches Button label (case-insensitive)", function () {
      assert.strictEqual(rules.isPlaceholderDefault("button label"), true);
    });
    it("matches Dropdown text", function () {
      assert.strictEqual(rules.isPlaceholderDefault("Dropdown text"), true);
    });
    it("matches Label exactly", function () {
      assert.strictEqual(rules.isPlaceholderDefault("Label"), true);
    });
    it("matches Placeholder prefix", function () {
      assert.strictEqual(rules.isPlaceholderDefault("Placeholder text"), true);
    });
    it("matches Description exactly", function () {
      assert.strictEqual(rules.isPlaceholderDefault("Description"), true);
    });
    it("rejects legitimate string MyButton", function () {
      assert.strictEqual(rules.isPlaceholderDefault("MyButton"), false);
    });
    it("rejects Save", function () {
      assert.strictEqual(rules.isPlaceholderDefault("Save"), false);
    });
    it("rejects empty string", function () {
      assert.strictEqual(rules.isPlaceholderDefault(""), false);
    });
    it("rejects non-string input", function () {
      assert.strictEqual(rules.isPlaceholderDefault(null), false);
      assert.strictEqual(rules.isPlaceholderDefault(undefined), false);
      assert.strictEqual(rules.isPlaceholderDefault(42), false);
    });
  });

  describe("getRequiredOverrideProps", function () {
    it("returns TEXT props with placeholder defaults", function () {
      var componentDef = {
        properties: {
          "Title#1:0": { type: "TEXT", default: "Page Title" },
          "Subtitle#1:1": { type: "TEXT", default: "Custom subtitle" },
          "Label#1:2": { type: "TEXT", default: "Label" },
        },
      };
      var result = rules.getRequiredOverrideProps(componentDef);
      var names = result
        .map(function (r) {
          return r.propName;
        })
        .sort();
      assert.deepStrictEqual(names, ["Label#1:2", "Title#1:0"]);
    });

    it("returns empty array for component with no placeholder TEXT defaults", function () {
      var componentDef = {
        properties: {
          Label: { type: "TEXT", default: "Save" },
        },
      };
      assert.deepStrictEqual(rules.getRequiredOverrideProps(componentDef), []);
    });

    it("ignores non-TEXT props", function () {
      var componentDef = {
        properties: {
          "Show Icon": { type: "BOOLEAN", default: true },
          Icon: { type: "INSTANCE_SWAP", default: "abc123" },
        },
      };
      assert.deepStrictEqual(rules.getRequiredOverrideProps(componentDef), []);
    });

    it("handles missing properties object", function () {
      assert.deepStrictEqual(rules.getRequiredOverrideProps({}), []);
      assert.deepStrictEqual(
        rules.getRequiredOverrideProps({ properties: null }),
        [],
      );
    });

    it("preserves default value in result", function () {
      var componentDef = {
        properties: {
          Title: { type: "TEXT", default: "Page Title" },
        },
      };
      var result = rules.getRequiredOverrideProps(componentDef);
      assert.strictEqual(result[0].defaultValue, "Page Title");
    });
  });

  describe("getDefaultTrueBooleans", function () {
    it("returns BOOLEAN props with default true", function () {
      var componentDef = {
        properties: {
          "Show Leading Icon#1:0": { type: "BOOLEAN", default: true },
          "Show Trailing Icon#1:1": { type: "BOOLEAN", default: true },
          "Show Disabled#1:2": { type: "BOOLEAN", default: false },
        },
      };
      var result = rules.getDefaultTrueBooleans(componentDef);
      var names = result
        .map(function (r) {
          return r.propName;
        })
        .sort();
      assert.deepStrictEqual(names, [
        "Show Leading Icon#1:0",
        "Show Trailing Icon#1:1",
      ]);
    });

    it("ignores non-BOOLEAN props", function () {
      var componentDef = {
        properties: {
          Title: { type: "TEXT", default: "Page Title" },
        },
      };
      assert.deepStrictEqual(rules.getDefaultTrueBooleans(componentDef), []);
    });

    it("handles missing properties object", function () {
      assert.deepStrictEqual(rules.getDefaultTrueBooleans({}), []);
    });

    it("preserves default value in result", function () {
      var componentDef = {
        properties: { "Show Icon": { type: "BOOLEAN", default: true } },
      };
      assert.strictEqual(
        rules.getDefaultTrueBooleans(componentDef)[0].defaultValue,
        true,
      );
    });
  });

  describe("propertyDefaultsHash", function () {
    it("produces deterministic hash for same registry", function () {
      var registry = {
        components: {
          "fm-button": {
            properties: { Label: { type: "TEXT", default: "Button" } },
          },
        },
      };
      var h1 = rules.propertyDefaultsHash(registry);
      var h2 = rules.propertyDefaultsHash(registry);
      assert.strictEqual(h1, h2);
      assert.strictEqual(typeof h1, "string");
      assert.strictEqual(h1.length, 64); // sha256 hex
    });

    it("differs when a default value changes", function () {
      var before = {
        components: {
          "fm-button": {
            properties: { Label: { type: "TEXT", default: "Button" } },
          },
        },
      };
      var after = {
        components: {
          "fm-button": {
            properties: { Label: { type: "TEXT", default: "Action" } },
          },
        },
      };
      assert.notStrictEqual(
        rules.propertyDefaultsHash(before),
        rules.propertyDefaultsHash(after),
      );
    });

    it("is insensitive to component-key ordering", function () {
      var a = {
        components: {
          "fm-a": { properties: { P: { type: "TEXT", default: "X" } } },
          "fm-b": { properties: { P: { type: "TEXT", default: "Y" } } },
        },
      };
      var b = {
        components: {
          "fm-b": { properties: { P: { type: "TEXT", default: "Y" } } },
          "fm-a": { properties: { P: { type: "TEXT", default: "X" } } },
        },
      };
      assert.strictEqual(
        rules.propertyDefaultsHash(a),
        rules.propertyDefaultsHash(b),
      );
    });

    it("handles missing components object", function () {
      assert.strictEqual(
        rules.propertyDefaultsHash({}),
        rules.propertyDefaultsHash({ components: {} }),
      );
    });
  });
});
