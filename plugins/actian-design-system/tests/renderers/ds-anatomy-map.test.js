"use strict";

// ds-anatomy-map.test.js — Tests for the ds-anatomy-map helpers.
// Verifies: collectDsSlugs (content-shaped traversal), collectDsSlugVariants +
// buildDsVariantStyleMap (delegated-slug token-injection). The former
// buildDsAnatomyMap coverage (override exclusion, anatomy+binding integration,
// null-anatomy exclusion) was retired in Group C along with the function
// itself — see buildDsAnatomyDocMap for its Phase 1B replacement.

var { describe, it, test } = require("node:test");
var assert = require("node:assert");

var { collectDsSlugs } = require("../../scripts/renderers/ds-anatomy-map.js");

describe("collectDsSlugs", function () {
  it("collects dsSlugs from real content-shaped screens (screens[].content)", function () {
    // Real flow-data carries nodes under screens[].content, NOT .frames.
    var data = {
      screens: [
        {
          name: "Screen 1",
          content: [
            { dsSlug: "actian-data-intelligence" },
            {
              dsSlug: "card-for-items",
              children: [{ dsSlug: "avatar" }],
            },
          ],
        },
        { name: "Screen 2", content: [{ dsSlug: "spinner" }] },
      ],
    };
    var slugs = collectDsSlugs(data);
    assert.deepEqual(slugs.sort(), [
      "actian-data-intelligence",
      "avatar",
      "card-for-items",
      "spinner",
    ]);
  });

  it("dedupes slugs that appear on multiple screens/nodes", function () {
    var data = {
      screens: [
        { content: [{ dsSlug: "spinner" }, { dsSlug: "spinner" }] },
        { content: [{ dsSlug: "spinner" }] },
      ],
    };
    assert.deepEqual(collectDsSlugs(data), ["spinner"]);
  });

  it("returns [] for empty / missing data without throwing", function () {
    assert.deepEqual(collectDsSlugs(null), []);
    assert.deepEqual(collectDsSlugs({}), []);
    assert.deepEqual(collectDsSlugs({ screens: [] }), []);
    assert.deepEqual(collectDsSlugs({ screens: [{}] }), []);
  });
});

var anatomyMapMod = require("../../scripts/renderers/ds-anatomy-map.js");

test("collectDsSlugVariants: emits distinct {slug, variant} for delegated nodes", () => {
  const data = {
    screens: [
      {
        content: [
          { dsSlug: "tag-default", variant: "Color=Pink" },
          { dsSlug: "tag-default", variant: "Color=Pink" }, // dup -> collapses
          { dsSlug: "tag-default", variant: "Color=Gray" },
          { dsSlug: "button", variant: "Type=Primary" }, // not delegated -> ignored here
        ],
      },
    ],
  };
  const pairs = anatomyMapMod.collectDsSlugVariants(data);
  const keys = pairs
    .map((p) => p.slug + "|" + JSON.stringify(p.variant))
    .sort();
  assert.deepStrictEqual(keys, [
    'tag-default|{"Color":"Gray"}',
    'tag-default|{"Color":"Pink"}',
  ]);
});

test("buildDsVariantStyleMap: keys tag-default by composite key with the root variant style", () => {
  const anatomy = { quality: { ratio: 1 }, root: { id: "r" } };
  const bindings = {
    variantDefaults: { Color: "Default" },
    byNodeId: {
      r: [
        {
          property: "background-color",
          token: "--zen-pink",
          variant: { prop: "Color", values: ["Pink"] },
        },
        {
          property: "background-color",
          token: "--zen-default",
          variant: { prop: "Color", values: ["Default"] },
        },
      ],
    },
  };
  const data = {
    screens: [{ content: [{ dsSlug: "tag-default", variant: "Color=Pink" }] }],
  };
  const map = anatomyMapMod.buildDsVariantStyleMap(data, {
    anatomyLoader: () => anatomy,
    tokenBindingsLoader: () => bindings,
  });
  assert.strictEqual(
    map["tag-default|Color=Pink"],
    "background-color:var(--zen-pink)",
  );
});
