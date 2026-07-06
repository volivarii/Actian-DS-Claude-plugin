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

// Task A2: updated for the appearance-sourced data contract (the prior
// fixture modeled the retired token-bindings sidecar join, "path b" — see
// the two new appearance-sourced tests below for the real-vendored-data
// coverage). Same intent, injected-loader unit coverage of the composite-key
// lookup, now shaped like an anatomy `root.appearance` doc.
test("buildDsVariantStyleMap: keys tag-default by composite key with the appearance-resolved variant style", () => {
  const anatomy = {
    quality: { ratio: 1 },
    root: {
      id: "r",
      appearance: {
        background: "#fbfbff",
        border: { color: "#e1e1e6", width: "1px" },
        variants: [
          {
            prop: "Color",
            values: ["Pink"],
            background: "#fff5f6",
            border: { color: "#ffd6d8", width: "1px" },
          },
        ],
      },
    },
  };
  const data = {
    screens: [{ content: [{ dsSlug: "tag-default", variant: "Color=Pink" }] }],
  };
  const map = anatomyMapMod.buildDsVariantStyleMap(data, {
    anatomyLoader: () => anatomy,
  });
  assert.strictEqual(
    map["tag-default|Color=Pink"],
    "background:#fff5f6;border-color:#ffd6d8",
  );
});

// Task A2: buildDsVariantStyleMap is re-sourced from the appearance layer
// (real vendored tag-default anatomy, no fixtures) instead of the
// token-bindings sidecar join (resolveRootTokenStyle, "path b").
function flowWith(variants) {
  return {
    screens: [
      {
        content: variants.map(function (v) {
          return {
            type: "INSTANCE",
            library: "ds",
            dsSlug: "tag-default",
            variant: v,
            props: { Label: "Tag" },
          };
        }),
      },
    ],
  };
}

it("tag-default variant style is appearance-sourced: per-color bg + border, no bare unresolved token", function () {
  var map = anatomyMapMod.buildDsVariantStyleMap(flowWith(["Color=Purple"]));
  var style = map["tag-default|Color=Purple"];
  assert.ok(style, "Purple entry present");
  assert.match(style, /background:/);
  assert.match(style, /border-color:/);
  // regression guard: the washout bug was bare var(--token) with NO fallback.
  // Every var() the appearance path emits carries a value fallback.
  var bareVar = /var\(\s*--[A-Za-z0-9-]+\s*\)/; // no comma => no fallback
  assert.ok(!bareVar.test(style), "no fallback-less var() (washout guard)");
  // color VALUE present (fidelity guarantee), hex or var-with-fallback
  assert.match(style, /#[0-9a-fA-F]{3,8}/);
});

it("tag-default DEFAULT variant emits no injected style (ds-base.css is correct)", function () {
  var map = anatomyMapMod.buildDsVariantStyleMap(flowWith([""]));
  assert.strictEqual(map["tag-default"], undefined);
});
