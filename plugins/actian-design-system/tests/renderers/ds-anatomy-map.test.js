"use strict";

// ds-anatomy-map.test.js — Tests for the ds-anatomy-map helpers.
// Verifies: collectDsSlugs (content-shaped traversal), collectDsSlugVariants +
// buildDsVariantStyleMap (delegated-slug token-injection). The former
// buildDsAnatomyMap coverage (override exclusion, anatomy+binding integration,
// null-anatomy exclusion) was retired in Group C along with the function
// itself — see buildDsAnatomyDocMap for its Phase 1B replacement.

var { describe, it, test } = require("node:test");
var assert = require("node:assert");

var { collectDsSlugs } = require("../../scripts/lib/renderer.js").dsAnatomyMap;

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
              dsSlug: "card-for-perimeter",
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
      "card-for-perimeter",
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

var anatomyMapMod = require("../../scripts/lib/renderer.js").dsAnatomyMap;
var renderer = require("../../scripts/lib/renderer.js");
var specimen = require("../helpers/appearance-specimen.js");

test("collectDsSlugVariants: emits distinct {slug, variant} for delegated nodes", () => {
  const data = {
    screens: [
      {
        content: [
          { dsSlug: "tag-read-only", variant: "Type=Shared" },
          { dsSlug: "tag-read-only", variant: "Type=Shared" }, // dup -> collapses
          // Authored under the name this component answered to before the
          // 2026-08-26 rename. The collector resolves it through the identity
          // ledger BEFORE testing delegation, so it must collapse onto the
          // pair above rather than emit a third, unrenderable key.
          { dsSlug: "tag-default", variant: "Type=Shared" },
          { dsSlug: "tag-read-only", variant: "Type=Catalog" },
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
    'tag-read-only|{"Type":"Catalog"}',
    'tag-read-only|{"Type":"Shared"}',
  ]);
});

// Task A2: updated for the appearance-sourced data contract (the prior
// fixture modeled the retired token-bindings sidecar join, "path b"; see
// the two new appearance-sourced tests below for the real-vendored-data
// coverage). Same intent, injected-loader unit coverage of the composite-key
// lookup, now shaped like an anatomy `root.appearance` doc.
test("buildDsVariantStyleMap: keys tag-read-only by composite key with the appearance-resolved variant style", () => {
  const anatomy = {
    quality: { ratio: 1 },
    root: {
      id: "r",
      appearance: {
        background: "#fbfbff",
        border: { color: "#e1e1e6", width: "1px" },
        variants: [
          {
            prop: "Type",
            values: ["Shared"],
            background: "#fff5f6",
            border: { color: "#ffd6d8", width: "1px" },
          },
        ],
      },
    },
  };
  const data = {
    screens: [
      { content: [{ dsSlug: "tag-read-only", variant: "Type=Shared" }] },
    ],
  };
  const map = anatomyMapMod.buildDsVariantStyleMap(data, {
    anatomyLoader: () => anatomy,
  });
  assert.strictEqual(
    map["tag-read-only|Type=Shared"],
    "background:#fff5f6;border-color:#ffd6d8",
  );
});

// Task A2: buildDsVariantStyleMap is re-sourced from the appearance layer
// (real vendored tag-read-only anatomy, no fixtures) instead of the
// token-bindings sidecar join (resolveRootTokenStyle, "path b").
function flowWith(variants) {
  return {
    screens: [
      {
        content: variants.map(function (v) {
          return {
            type: "INSTANCE",
            library: "ds",
            dsSlug: "tag-read-only",
            variant: v,
            props: { Label: "Tag" },
          };
        }),
      },
    ],
  };
}

it("tag-read-only variant style is appearance-sourced: per-type paint, no bare unresolved token", function () {
  // The specimen is DERIVED. This named "Color=Purple" until the 2026-08-12
  // fold-in retired the Color axis, after which the key resolved to
  // nothing and the assertion read "Purple entry present" against a substrate
  // that has no Purple. Naming a Type value instead would rot the same way, so
  // the axis and the value come off the anatomy doc buildDsVariantStyleMap
  // itself reads. See tests/helpers/appearance-specimen.js.
  var painted = specimen.pickPaintedVariant(
    renderer.anatomyLoader("tag-read-only"),
    "tag-read-only",
  );
  var map = anatomyMapMod.buildDsVariantStyleMap(
    flowWith([painted.variantString]),
  );
  var style = map["tag-read-only|" + painted.variantString];
  assert.ok(style, painted.variantString + " entry present");
  assert.match(style, /background:/);
  // The paint is the capture's own value, not merely "some background".
  assert.ok(
    style.indexOf("background:" + painted.background) !== -1,
    painted.variantString +
      " must inject the captured background " +
      painted.background +
      ", got: " +
      style,
  );
  // No border assertion: the 2026-07-23 tag redesign removed tag borders, so
  // tag-read-only's captured appearance is background-only and the renderer
  // correctly emits no border-color. Demanding one asserted the old Figma, not
  // the appearance layer this test is about. The per-variant fidelity guard
  // (border present iff the substrate captured one) lives in
  // flow-share-variant-tag-deliverable.test.js, where the deliverable is built.
  // regression guard: the washout bug was bare var(--token) with NO fallback.
  // Every var() the appearance path emits carries a value fallback.
  var bareVar = /var\(\s*--[A-Za-z0-9-]+\s*\)/; // no comma => no fallback
  assert.ok(!bareVar.test(style), "no fallback-less var() (washout guard)");
  // color VALUE present (fidelity guarantee), hex or var-with-fallback
  assert.match(style, /#[0-9a-fA-F]{3,8}/);
});

it("tag-read-only DEFAULT variant emits no injected style (ds-base.css is correct)", function () {
  var map = anatomyMapMod.buildDsVariantStyleMap(flowWith([""]));
  assert.strictEqual(map["tag-read-only"], undefined);
});
