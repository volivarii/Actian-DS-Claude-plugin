#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var fs = require("fs");

var transform = require("../../scripts/transformers/transformers/transform-registry.js");

var subset = JSON.parse(fs.readFileSync(
  path.join(__dirname, "..", "fixtures", "rest", "dskit-subset.json"),
  "utf8"
));

describe("transform-registry", function () {
  describe("output shape", function () {
    var result = transform({
      library: "ds",
      fileKey: subset.fileKey,
      componentSets: subset.componentSets,
      componentSetNodes: subset.nodes,
      standalones: [],
      standaloneNodes: {},
    });

    it("returns top-level metadata fields", function () {
      assert.strictEqual(result.library, "ds");
      assert.strictEqual(result.fileKey, "l8biHxfarNi1I2RMvVxVOK");
      assert.ok(typeof result.lastSynced === "string");
      assert.match(result.lastSynced, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      assert.strictEqual(typeof result.componentCount, "number");
      assert.strictEqual(result.componentCount, 1);
    });

    it("components keyed by lowercase-hyphenated slug", function () {
      assert.ok("button" in result.components);
    });
  });

  describe("Button entry", function () {
    var result = transform({
      library: "ds",
      fileKey: subset.fileKey,
      componentSets: subset.componentSets,
      componentSetNodes: subset.nodes,
      standalones: [],
      standaloneNodes: {},
    });
    var button = result.components.button;

    it("has all required fields", function () {
      var expectedKeys = ["name", "key", "nodeId", "importMethod", "description",
        "lastSynced", "page", "properties", "nestedComponents", "guidelinesFile", "variants"];
      expectedKeys.forEach(function (k) {
        assert.ok(k in button, "missing key: " + k);
      });
    });

    it("identity fields match REST source", function () {
      assert.strictEqual(button.name, "Button");
      assert.strictEqual(button.key, "5a6d10d26bef3cc83955bf32a318c6b4682f25d3");
      assert.strictEqual(button.nodeId, "7206:2643");
      assert.strictEqual(button.importMethod, "set");
    });

    it("page name comes from containing_frame.pageName", function () {
      // Button page name in fixture: "✍️ Button" or "✅ Button" etc.
      assert.ok(button.page.length > 0);
      assert.ok(button.page.indexOf("Button") !== -1);
    });

    it("description is non-empty for Button", function () {
      assert.ok(button.description.length > 0);
    });

    it("variants extracted from VARIANT-typed properties as { axis: [values] }", function () {
      assert.ok(button.variants);
      assert.ok("Type" in button.variants);
      assert.ok(Array.isArray(button.variants.Type));
      assert.ok(button.variants.Type.indexOf("Primary") !== -1);
      assert.ok(button.variants.Type.indexOf("Secondary") !== -1);
      assert.ok("Size" in button.variants);
      assert.ok("State" in button.variants);
    });

    it("properties exclude VARIANT entries (those go into variants)", function () {
      assert.ok(button.properties);
      // VARIANT typed props (Type/Size/State) should NOT appear in properties
      var keys = Object.keys(button.properties);
      assert.ok(!keys.some(function (k) { return k === "Type" || k === "Size" || k === "State"; }));
    });

    it("properties preserve hash-suffixed keys", function () {
      assert.ok("Label#724:10" in button.properties);
      assert.ok("Show leading icon#809:73" in button.properties);
    });

    it("property entries have type and default", function () {
      var label = button.properties["Label#724:10"];
      assert.strictEqual(label.type, "TEXT");
      assert.strictEqual(label.default, "Button");

      var showLeading = button.properties["Show leading icon#809:73"];
      assert.strictEqual(showLeading.type, "BOOLEAN");
      assert.strictEqual(showLeading.default, true);

      var leadingIcon = button.properties["Leading icon#724:0"];
      assert.strictEqual(leadingIcon.type, "INSTANCE_SWAP");
      assert.strictEqual(leadingIcon.default, "7206:3772");
    });

    it("nestedComponents and guidelinesFile default to empty/null", function () {
      assert.deepStrictEqual(button.nestedComponents, []);
      assert.strictEqual(button.guidelinesFile, null);
    });

    it("per-component lastSynced populated", function () {
      assert.match(button.lastSynced, /\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe("internal component filtering", function () {
    it("strips component_sets whose name starts with '.' (internal)", function () {
      var input = {
        library: "ds",
        fileKey: "abc",
        componentSets: [
          { key: "k1", node_id: "1:1", name: "Button", description: "", containing_frame: { pageName: "Button" } },
          { key: "k2", node_id: "2:2", name: ".Internal", description: "", containing_frame: { pageName: "Internal" } },
        ],
        componentSetNodes: {
          "1:1": { document: { id: "1:1", name: "Button", type: "COMPONENT_SET", componentPropertyDefinitions: {}, children: [] } },
          "2:2": { document: { id: "2:2", name: ".Internal", type: "COMPONENT_SET", componentPropertyDefinitions: {}, children: [] } },
        },
        standalones: [],
        standaloneNodes: {},
      };
      var result = transform(input);
      assert.strictEqual(result.componentCount, 1);
      assert.ok("button" in result.components);
      assert.ok(!("internal" in result.components));
    });

    it("strips standalones whose name starts with '.'", function () {
      var input = {
        library: "ds",
        fileKey: "abc",
        componentSets: [],
        componentSetNodes: {},
        standalones: [
          { key: "k1", node_id: "1:1", name: ".Hidden", description: "", containing_frame: { pageName: "Foo" } },
          { key: "k2", node_id: "2:2", name: "Logo", description: "", containing_frame: { pageName: "Brand" } },
        ],
        standaloneNodes: {
          "1:1": { document: { id: "1:1", name: ".Hidden", type: "COMPONENT", componentPropertyDefinitions: {} } },
          "2:2": { document: { id: "2:2", name: "Logo", type: "COMPONENT", componentPropertyDefinitions: {} } },
        },
      };
      var result = transform(input);
      assert.strictEqual(result.componentCount, 1);
      assert.ok("logo" in result.components);
    });
  });

  describe("standalone components", function () {
    it("importMethod=single for standalones, no variants object", function () {
      var input = {
        library: "ds",
        fileKey: "abc",
        componentSets: [],
        componentSetNodes: {},
        standalones: [
          { key: "k1", node_id: "1:1", name: "Logo", description: "Brand mark", containing_frame: { pageName: "Brand" } },
        ],
        standaloneNodes: {
          "1:1": { document: { id: "1:1", name: "Logo", type: "COMPONENT", componentPropertyDefinitions: {
            "Theme#100:0": { type: "BOOLEAN", defaultValue: false },
          } } },
        },
      };
      var result = transform(input);
      var logo = result.components.logo;
      assert.strictEqual(logo.importMethod, "single");
      assert.strictEqual(logo.variants, undefined, "single components should not have variants object");
      assert.ok("Theme#100:0" in logo.properties);
    });
  });

  describe("description truncation", function () {
    it("description capped at 200 chars", function () {
      var long = "x".repeat(500);
      var input = {
        library: "ds",
        fileKey: "abc",
        componentSets: [
          { key: "k1", node_id: "1:1", name: "Long", description: long, containing_frame: { pageName: "Foo" } },
        ],
        componentSetNodes: {
          "1:1": { document: { id: "1:1", name: "Long", type: "COMPONENT_SET", componentPropertyDefinitions: {}, children: [] } },
        },
        standalones: [],
        standaloneNodes: {},
      };
      var result = transform(input);
      assert.ok(result.components.long.description.length <= 200);
    });
  });
});
