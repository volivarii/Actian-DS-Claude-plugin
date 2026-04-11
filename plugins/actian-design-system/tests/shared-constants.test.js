#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..");

var sc = require(path.join(PLUGIN_ROOT, "scripts", "shared-constants.js"));

describe("shared-constants", function () {
  describe("FM_SLUGS", function () {
    it("maps fmButton to fm-button", function () {
      assert.strictEqual(sc.FM_SLUGS.fmButton, "fm-button");
    });

    it("maps fmAppHeader to fm-app-header", function () {
      assert.strictEqual(sc.FM_SLUGS.fmAppHeader, "fm-app-header");
    });

    it("maps fmDropdown to fm-dropdown", function () {
      assert.strictEqual(sc.FM_SLUGS.fmDropdown, "fm-dropdown");
    });

    it("has entries for all FM components in registry (or fallback)", function () {
      var fmkit = require(path.join(PLUGIN_ROOT, "docs", "fmkit.json"));
      var registrySlugs = Object.keys(fmkit.components);
      var mappedSlugs = Object.values(sc.FM_SLUGS);
      // Slugs covered by hardcoded fallback keys are expected to be missing
      var fallbackSlugs = ["fm-banner", "fm-dialog", "fm-spinner", "fm-tabs"];
      var invalid = mappedSlugs.filter(function (slug) {
        return (
          registrySlugs.indexOf(slug) === -1 &&
          fallbackSlugs.indexOf(slug) === -1
        );
      });
      assert.ok(
        invalid.length === 0,
        "FM_SLUGS references non-existent registry slugs: " +
          invalid.join(", "),
      );
    });
  });

  describe("DS_SLUGS", function () {
    it("maps dsButton to button", function () {
      assert.strictEqual(sc.DS_SLUGS.dsButton, "button");
    });

    it("has valid registry references", function () {
      var dskit = require(path.join(PLUGIN_ROOT, "docs", "dskit.json"));
      var registrySlugs = Object.keys(dskit.components);
      var mappedSlugs = Object.values(sc.DS_SLUGS);
      var invalid = mappedSlugs.filter(function (slug) {
        return registrySlugs.indexOf(slug) === -1;
      });
      assert.ok(
        invalid.length === 0,
        "DS_SLUGS references non-existent registry slugs: " +
          invalid.join(", "),
      );
    });
  });

  describe("FM_FALLBACK_KEYS", function () {
    it("contains fmButton with a key", function () {
      assert.ok(
        sc.FM_FALLBACK_KEYS.fmButton,
        "fmButton missing from FM_FALLBACK_KEYS",
      );
      assert.ok(sc.FM_FALLBACK_KEYS.fmButton.key, "fmButton has no key");
      assert.ok(sc.FM_FALLBACK_KEYS.fmButton.method, "fmButton has no method");
    });

    it("contains fallback entries for components not in registry", function () {
      assert.ok(sc.FM_FALLBACK_KEYS.fmBanner, "fmBanner fallback missing");
      assert.ok(sc.FM_FALLBACK_KEYS.fmDialog, "fmDialog fallback missing");
      assert.ok(sc.FM_FALLBACK_KEYS.fmSpinner, "fmSpinner fallback missing");
    });
  });

  describe("DS_KEYS", function () {
    it("contains dsButton with a key", function () {
      assert.ok(sc.DS_KEYS.dsButton, "dsButton missing from DS_KEYS");
      assert.ok(sc.DS_KEYS.dsButton.key, "dsButton has no key");
    });
  });

  describe("META_KEYS", function () {
    it("contains genLog with a key", function () {
      assert.ok(sc.META_KEYS.genLog, "genLog missing from META_KEYS");
      assert.ok(sc.META_KEYS.genLog.key, "genLog has no key");
    });
  });

  describe("getProperties", function () {
    it("returns properties for fmButton via slug map (old convention)", function () {
      var props = sc.getProperties("fmkit", sc.FM_SLUGS, "fmButton");
      assert.ok(props, "getProperties returned null for fmButton");
      var hasLabel = Object.keys(props).some(function (k) {
        return k.startsWith("Label");
      });
      assert.ok(hasLabel, "fmButton properties should include Label");
    });

    it("returns properties for fmButton via ref name (new convention)", function () {
      var props = sc.getProperties("fmkit", "fmButton", "fm");
      assert.ok(
        props,
        "getProperties returned null for fmButton (new convention)",
      );
      var hasLabel = Object.keys(props).some(function (k) {
        return k.startsWith("Label");
      });
      assert.ok(
        hasLabel,
        "fmButton properties should include Label (new convention)",
      );
    });

    it("returns null for unknown ref", function () {
      var props = sc.getProperties("fmkit", sc.FM_SLUGS, "fmNonexistent");
      assert.strictEqual(props, null);
    });
  });

  describe("buildGenLog", function () {
    it("returns an INSTANCE node with correct props", function () {
      var node = sc.buildGenLog(
        { skill: "generate-flow", prompt: "test prompt", duration: "1m" },
        {},
      );
      assert.strictEqual(node.type, "INSTANCE");
      assert.strictEqual(node.ref, "genLog");
      assert.ok(node.props.Skill.indexOf("generate-flow") !== -1);
      assert.ok(node.props.Prompt.indexOf("test prompt") !== -1);
    });
  });

  describe("slugToRef", function () {
    it("converts fm-button to fmButton", function () {
      assert.strictEqual(sc.slugToRef("fm-button", "fm"), "fmButton");
    });

    it("converts fm-text-input to fmTextInput", function () {
      assert.strictEqual(sc.slugToRef("fm-text-input", "fm"), "fmTextInput");
    });

    it("converts fm-app-header to fmAppHeader", function () {
      assert.strictEqual(sc.slugToRef("fm-app-header", "fm"), "fmAppHeader");
    });

    it("converts button to dsButton", function () {
      assert.strictEqual(sc.slugToRef("button", "ds"), "dsButton");
    });

    it("converts dropdown-select-default to dsDropdownSelectDefault", function () {
      assert.strictEqual(
        sc.slugToRef("dropdown-select-default", "ds"),
        "dsDropdownSelectDefault",
      );
    });

    it("converts fm-nav-item to fmNavItem", function () {
      assert.strictEqual(sc.slugToRef("fm-nav-item", "fm"), "fmNavItem");
    });
  });

  describe("buildSlugMap", function () {
    it("returns an object mapping ref names to slugs", function () {
      var map = sc.buildSlugMap("fmkit", "fm");
      assert.strictEqual(map.fmButton, "fm-button");
      assert.strictEqual(typeof map, "object");
    });
  });

  describe("FM_KEYS (derived)", function () {
    it("contains fmButton with key and method", function () {
      assert.ok(sc.FM_KEYS, "FM_KEYS not exported");
      assert.ok(sc.FM_KEYS.fmButton, "fmButton missing from FM_KEYS");
      assert.ok(sc.FM_KEYS.fmButton.key, "fmButton has no key");
      assert.ok(sc.FM_KEYS.fmButton.method, "fmButton has no method");
    });
  });
});
