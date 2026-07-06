#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");

var sc = require(
  path.join(PLUGIN_ROOT, "scripts", "lib", "shared-constants.js"),
);

describe("shared-constants", function () {
  describe("buildKeyMapFromStore ref-collision handling", function () {
    // "chip" and "fm-chip" both derive the ref fmChip (slugToRef strips the
    // kit prefix). Before the fix, the winner was whichever the registry
    // emitted LAST — which flipped when the knowledge sync started emitting
    // canonically sorted keys (#355) and broke render-node-figma's fmChip.
    var single = {
      key: "46e1d850aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      importMethod: "single",
    };
    var set = {
      key: "0861d937bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      importMethod: "set",
    };

    it("prefers the plain slug over the prefix-stripped one, in either store order", function () {
      var a = sc.buildKeyMapFromStore({ chip: single, "fm-chip": set }, "fm");
      var b = sc.buildKeyMapFromStore({ "fm-chip": set, chip: single }, "fm");
      assert.deepStrictEqual(a.fmChip, { key: single.key, method: "single" });
      assert.deepStrictEqual(b.fmChip, { key: single.key, method: "single" });
    });

    it("falls back to sorted-first-wins when neither colliding slug is prefix-stripped", function () {
      var a = sc.buildKeyMapFromStore({ "a-b": set, aB: single }, "fm");
      var b = sc.buildKeyMapFromStore({ aB: single, "a-b": set }, "fm");
      // "a-b" sorts before "aB" — same winner regardless of insertion order.
      assert.deepStrictEqual(a.fmAB, { key: set.key, method: "set" });
      assert.deepStrictEqual(b.fmAB, a.fmAB);
    });

    it("non-colliding slugs are unaffected", function () {
      var m = sc.buildKeyMapFromStore(
        { chip: single, button: { key: "cc", importMethod: "set" } },
        "fm",
      );
      assert.deepStrictEqual(m.fmChip, { key: single.key, method: "single" });
      assert.deepStrictEqual(m.fmButton, { key: "cc", method: "set" });
    });
  });

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
      var fmkit = require(
        path.join(
          PLUGIN_ROOT,
          "vendor",
          "components",
          "dist",
          "registries",
          "fmkit.json",
        ),
      );
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

  describe("FM_SLUGS renamed components", function () {
    it("maps fmTextInput to fm-text-input", function () {
      assert.strictEqual(sc.FM_SLUGS.fmTextInput, "fm-text-input");
    });

    it("maps fmSearchInput to fm-search-input", function () {
      assert.strictEqual(sc.FM_SLUGS.fmSearchInput, "fm-search-input");
    });

    it("maps fmNavItem to fm-nav-item", function () {
      assert.strictEqual(sc.FM_SLUGS.fmNavItem, "fm-nav-item");
    });

    it("maps fmNavBar to fm-nav-bar", function () {
      assert.strictEqual(sc.FM_SLUGS.fmNavBar, "fm-nav-bar");
    });
  });

  describe("DS_SLUGS", function () {
    it("maps dsButton to button", function () {
      assert.strictEqual(sc.DS_SLUGS.dsButton, "button");
    });

    it("has valid registry references", function () {
      var dskit = require(
        path.join(
          PLUGIN_ROOT,
          "vendor",
          "components",
          "dist",
          "registries",
          "dskit.json",
        ),
      );
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

  describe("FM_KEYS", function () {
    it("contains fmButton with a key", function () {
      assert.ok(sc.FM_KEYS.fmButton, "fmButton missing from FM_KEYS");
      assert.ok(sc.FM_KEYS.fmButton.key, "fmButton has no key");
      assert.ok(sc.FM_KEYS.fmButton.method, "fmButton has no method");
    });

    it("contains standalone components from registry", function () {
      assert.ok(sc.FM_KEYS.fmBanner, "fmBanner missing from FM_KEYS");
      assert.ok(sc.FM_KEYS.fmDialog, "fmDialog missing from FM_KEYS");
      assert.ok(sc.FM_KEYS.fmSpinner, "fmSpinner missing from FM_KEYS");
      assert.ok(sc.FM_KEYS.fmTabs, "fmTabs missing from FM_KEYS");
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

  describe("tierShort", function () {
    it("maps recognized to 'tier 1'", function () {
      assert.strictEqual(sc.tierShort("recognized"), "tier 1");
    });
    it("maps adapted to 'tier 2'", function () {
      assert.strictEqual(sc.tierShort("adapted"), "tier 2");
    });
    it("maps improvised to 'tier 3'", function () {
      assert.strictEqual(sc.tierShort("improvised"), "tier 3");
    });
    it("returns 'tier ?' for unknown / missing tier", function () {
      assert.strictEqual(sc.tierShort(undefined), "tier ?");
      assert.strictEqual(sc.tierShort("nonsense"), "tier ?");
    });
  });

  describe("buildTierSummary", function () {
    it("returns null when no screen has a tier", function () {
      var node = sc.buildTierSummary([
        { name: "Screen A" },
        { name: "Screen B" },
      ]);
      assert.strictEqual(node, null);
    });

    it("returns null for empty / missing screens", function () {
      assert.strictEqual(sc.buildTierSummary([]), null);
      assert.strictEqual(sc.buildTierSummary(undefined), null);
    });

    it("returns a TEXT node with tier roll-up + per-screen lines when at least one screen is tiered", function () {
      var node = sc.buildTierSummary([
        {
          name: "Catalog browse",
          tier: "recognized",
          confidence: 0.92,
          matchedRecipe: "table-list",
        },
        {
          name: "Pipeline create",
          tier: "adapted",
          confidence: 0.78,
          composition: ["form-create", "sticky-footer"],
        },
        {
          name: "Permission denied",
          tier: "improvised",
          confidence: 0.61,
          justification: "x".repeat(40),
        },
      ]);
      assert.strictEqual(node.type, "TEXT");
      assert.match(
        node.text,
        /Tiers:\s*1 recognized,\s*1 adapted,\s*1 improvised/,
      );
      assert.match(node.text, /Catalog browse.*tier 1.*table-list.*0\.92/);
      assert.match(
        node.text,
        /Pipeline create.*tier 2.*form-create\+sticky-footer.*0\.78/,
      );
      assert.match(node.text, /Permission denied.*tier 3.*0\.61/);
    });

    it("includes a Justifications block listing every tier-3 screen's justification", function () {
      var node = sc.buildTierSummary([
        {
          name: "S1",
          tier: "improvised",
          confidence: 0.55,
          justification:
            "Considered detail-page; no detail data — auth-pre-empts query.",
        },
      ]);
      assert.match(node.text, /Justifications:/);
      assert.match(node.text, /S1: Considered detail-page; no detail data/);
    });

    it("includes a Justifications block for tier-2 deviation screens (matchedRecipe set, composition null)", function () {
      var node = sc.buildTierSummary([
        {
          name: "Audit log",
          tier: "adapted",
          confidence: 0.74,
          matchedRecipe: "table-list",
          composition: null,
          justification:
            "App-context signals power-user density; deviates from default table padding.",
        },
      ]);
      assert.match(node.text, /Audit log.*tier 2.*table-list/);
      assert.match(node.text, /Justifications:/);
      assert.match(
        node.text,
        /Audit log: App-context signals power-user density/,
      );
    });

    it("omits Justifications block when no tier-2-deviation or tier-3 screens are present", function () {
      var node = sc.buildTierSummary([
        {
          name: "S1",
          tier: "recognized",
          confidence: 0.95,
          matchedRecipe: "table-list",
        },
        {
          name: "S2",
          tier: "adapted",
          confidence: 0.82,
          composition: ["form-create", "sticky-footer"],
          justification: "Composition: form + sticky footer for confirmation.",
        },
      ]);
      assert.doesNotMatch(node.text, /Justifications:/);
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

  describe("slugFromKey", function () {
    it("returns the slug for a known DS Kit key", function () {
      // Pick the Button key — known stable component used elsewhere in tests
      var slug = sc.slugFromKey(
        "5a6d10d26bef3cc83955bf32a318c6b4682f25d3",
        "ds",
      );
      assert.strictEqual(slug, "button");
    });

    it("returns the slug for a known FM Kit key", function () {
      var fmRegistry = sc.loadRegistry("fmkit");
      var fmButton = fmRegistry.components["fm-button"];
      assert.ok(
        fmButton && fmButton.key,
        "fmkit registry must include fm-button",
      );
      var slug = sc.slugFromKey(fmButton.key, "fm");
      assert.strictEqual(slug, "fm-button");
    });

    it("returns null for an unknown key", function () {
      var slug = sc.slugFromKey(
        "0000000000000000000000000000000000000000",
        "ds",
      );
      assert.strictEqual(slug, null);
    });

    it("returns null for null/undefined/empty input", function () {
      assert.strictEqual(sc.slugFromKey(null, "ds"), null);
      assert.strictEqual(sc.slugFromKey(undefined, "ds"), null);
      assert.strictEqual(sc.slugFromKey("", "ds"), null);
    });
  });
});
