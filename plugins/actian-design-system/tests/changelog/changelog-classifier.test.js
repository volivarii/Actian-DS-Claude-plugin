#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");

var classify = require("../../scripts/changelog/changelog-classifier.js");

function registryWith(components) {
  return {
    library: "ds",
    fileKey: "k",
    lastSynced: "2026-04-30T00:00:00Z",
    componentCount: Object.keys(components).length,
    components: components,
  };
}

var BUTTON = {
  name: "Button", key: "btn-key", nodeId: "1:1", importMethod: "set",
  description: "Primary trigger", lastSynced: "2026-04-30T00:00:00Z",
  page: "Button", properties: { "Label#1": { type: "TEXT", default: "Button" } },
  nestedComponents: [], guidelinesFile: null,
  variants: { Type: ["Primary", "Secondary"], Size: ["Default"] },
};

describe("changelog-classifier — registry kind", function () {
  describe("unchanged", function () {
    it("identical registries (modulo lastSynced) → unchanged", function () {
      var before = registryWith({ button: BUTTON });
      var after = registryWith({ button: Object.assign({}, BUTTON, { lastSynced: "2026-05-01T00:00:00Z" }) });
      var result = classify({ before: before, after: after, fileKind: "registry" });
      assert.strictEqual(result.category, "unchanged");
    });
  });

  describe("additive", function () {
    it("new component slug → additive", function () {
      var before = registryWith({ button: BUTTON });
      var after = registryWith({
        button: BUTTON,
        toggle: Object.assign({}, BUTTON, { name: "Toggle", key: "tgl-key" }),
      });
      var result = classify({ before: before, after: after, fileKind: "registry" });
      assert.strictEqual(result.category, "additive");
      assert.match(result.changelog, /Toggle/);
    });

    it("new variant axis value → additive", function () {
      var before = registryWith({ button: BUTTON });
      var afterButton = Object.assign({}, BUTTON, {
        variants: { Type: ["Primary", "Secondary", "Tertiary"], Size: ["Default"] },
      });
      var after = registryWith({ button: afterButton });
      var result = classify({ before: before, after: after, fileKind: "registry" });
      assert.strictEqual(result.category, "additive");
      assert.match(result.changelog, /Tertiary/);
    });

    it("new variant axis (entire new key) → additive", function () {
      var before = registryWith({ button: BUTTON });
      var afterButton = Object.assign({}, BUTTON, {
        variants: { Type: ["Primary", "Secondary"], Size: ["Default"], State: ["Default", "Hovered"] },
      });
      var after = registryWith({ button: afterButton });
      var result = classify({ before: before, after: after, fileKind: "registry" });
      assert.strictEqual(result.category, "additive");
      assert.match(result.changelog, /State/);
    });

    it("new property → additive", function () {
      var before = registryWith({ button: BUTTON });
      var afterButton = Object.assign({}, BUTTON, {
        properties: {
          "Label#1": { type: "TEXT", default: "Button" },
          "Show icon#2": { type: "BOOLEAN", default: false },
        },
      });
      var after = registryWith({ button: afterButton });
      var result = classify({ before: before, after: after, fileKind: "registry" });
      assert.strictEqual(result.category, "additive");
    });
  });

  describe("breaking", function () {
    it("removed component slug → breaking", function () {
      var before = registryWith({
        button: BUTTON,
        toggle: Object.assign({}, BUTTON, { name: "Toggle", key: "tgl-key" }),
      });
      var after = registryWith({ button: BUTTON });
      var result = classify({ before: before, after: after, fileKind: "registry" });
      assert.strictEqual(result.category, "breaking");
      assert.ok(result.reasons.some(function (r) { return /Toggle|toggle/.test(r); }));
    });

    it("renamed component (key match, name change) → breaking", function () {
      var before = registryWith({ toggle: Object.assign({}, BUTTON, { name: "Toggle", key: "tgl-key" }) });
      var after = registryWith({ toglge: Object.assign({}, BUTTON, { name: "Toglge", key: "tgl-key" }) });
      var result = classify({ before: before, after: after, fileKind: "registry" });
      assert.strictEqual(result.category, "breaking");
      assert.ok(result.reasons.some(function (r) { return /rename/i.test(r); }));
    });

    it("removed variant value → breaking", function () {
      var before = registryWith({ button: BUTTON });
      var afterButton = Object.assign({}, BUTTON, {
        variants: { Type: ["Primary"], Size: ["Default"] }, // Secondary removed
      });
      var after = registryWith({ button: afterButton });
      var result = classify({ before: before, after: after, fileKind: "registry" });
      assert.strictEqual(result.category, "breaking");
      assert.ok(result.reasons.some(function (r) { return /Secondary/.test(r); }));
    });

    it("removed property → breaking", function () {
      var before = registryWith({ button: BUTTON });
      var afterButton = Object.assign({}, BUTTON, { properties: {} });
      var after = registryWith({ button: afterButton });
      var result = classify({ before: before, after: after, fileKind: "registry" });
      assert.strictEqual(result.category, "breaking");
    });

    it("property type change → breaking", function () {
      var before = registryWith({ button: BUTTON });
      var afterButton = Object.assign({}, BUTTON, {
        properties: { "Label#1": { type: "BOOLEAN", default: true } }, // was TEXT
      });
      var after = registryWith({ button: afterButton });
      var result = classify({ before: before, after: after, fileKind: "registry" });
      assert.strictEqual(result.category, "breaking");
      assert.ok(result.reasons.some(function (r) { return /type/i.test(r); }));
    });

    it("property default change → breaking", function () {
      var before = registryWith({ button: BUTTON });
      var afterButton = Object.assign({}, BUTTON, {
        properties: { "Label#1": { type: "TEXT", default: "Click me" } }, // was "Button"
      });
      var after = registryWith({ button: afterButton });
      var result = classify({ before: before, after: after, fileKind: "registry" });
      assert.strictEqual(result.category, "breaking");
    });
  });
});

describe("changelog-classifier — styles kind", function () {
  function stylesWith(textStyles, effectStyles) {
    return { textStyles: textStyles || [], effectStyles: effectStyles || [] };
  }
  var HD = { name: "heading-display", key: "hd-key", fontFamily: "Roboto",
    fontStyle: "SemiBold", fontSize: 24, lineHeight: { unit: "PIXELS", value: 32 },
    letterSpacing: { unit: "PIXELS", value: 0 }, textDecoration: "NONE", textCase: "ORIGINAL" };
  var SHADOW = { name: "shadow-md", key: "sm-key", effects: [
    { type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0.3, a: 0.3 }, offset: { x: 0, y: 1 }, radius: 3, spread: 0, visible: true },
  ] };

  it("unchanged when identical", function () {
    var before = stylesWith([HD], [SHADOW]);
    var after = stylesWith([HD], [SHADOW]);
    var result = classify({ before: before, after: after, fileKind: "styles" });
    assert.strictEqual(result.category, "unchanged");
  });

  it("new style → additive", function () {
    var before = stylesWith([HD], [SHADOW]);
    var after = stylesWith([HD, Object.assign({}, HD, { name: "body-large", key: "bl-key", fontSize: 18 })], [SHADOW]);
    var result = classify({ before: before, after: after, fileKind: "styles" });
    assert.strictEqual(result.category, "additive");
  });

  it("removed style → breaking", function () {
    var before = stylesWith([HD], [SHADOW]);
    var after = stylesWith([], [SHADOW]);
    var result = classify({ before: before, after: after, fileKind: "styles" });
    assert.strictEqual(result.category, "breaking");
  });

  it("changed value (font size) → breaking", function () {
    var before = stylesWith([HD], [SHADOW]);
    var after = stylesWith([Object.assign({}, HD, { fontSize: 28 })], [SHADOW]);
    var result = classify({ before: before, after: after, fileKind: "styles" });
    assert.strictEqual(result.category, "breaking");
  });

  it("changed effect (radius) → breaking", function () {
    var before = stylesWith([HD], [SHADOW]);
    var after = stylesWith([HD], [Object.assign({}, SHADOW, { effects: [Object.assign({}, SHADOW.effects[0], { radius: 5 })] })]);
    var result = classify({ before: before, after: after, fileKind: "styles" });
    assert.strictEqual(result.category, "breaking");
  });
});

describe("changelog formatting", function () {
  it("changelog is markdown with section headers", function () {
    var before = registryWith({ button: BUTTON });
    var after = registryWith({
      button: BUTTON,
      toggle: Object.assign({}, BUTTON, { name: "Toggle", key: "tgl-key" }),
    });
    var result = classify({ before: before, after: after, fileKind: "registry" });
    assert.match(result.changelog, /^## /m, "should contain a section header");
  });

  it("breaking diffs surface reasons in order", function () {
    var before = registryWith({ button: BUTTON });
    var afterButton = Object.assign({}, BUTTON, { properties: {} });
    var after = registryWith({ button: afterButton });
    var result = classify({ before: before, after: after, fileKind: "registry" });
    assert.ok(Array.isArray(result.reasons));
    assert.ok(result.reasons.length > 0);
  });
});
