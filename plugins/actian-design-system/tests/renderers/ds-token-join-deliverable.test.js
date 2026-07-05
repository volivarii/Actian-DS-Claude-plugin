#!/usr/bin/env node
"use strict";

// ds-token-join-deliverable.test.js — deliverable-level gate for the
// anatomy-id -> token-bindings-sidecar JOIN mechanism (knowledge #333/#335
// consumer), exercised through the SURVIVING production seams
// (resolveRootTokenStyle + buildDsVariantStyleMap, "path b") instead of a
// test-only tree-walk helper. The former producer of this coverage
// (buildDsAnatomyMap / renderAnatomy, "path c") was retired in Group C.
//
// Real vendored files, no fixtures for the anatomy/sidecar data: if the
// vendor tree loses the sidecars or anatomy loses node ids,
// resolveRootTokenStyle silently returns "" and these assertions fail.
//
// buildDsVariantStyleMap only resolves DELEGATED slugs (isDelegated() in
// anatomy-variant-key.js currently allows only "tag-default"; Slice 1 scope),
// so it can't be exercised against the card slugs directly. It's covered
// here via tag-default instead, the one real production caller of that
// wrapper today, still against real vendored anatomy + sidecar data.

var { describe, it, before } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var ar = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "anatomy-render.js",
  ),
);
var dsAnatomyMap = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "ds-anatomy-map.js",
  ),
);

var CARD_SLUGS = ["card-for-perimeter", "card-for-grouped-content"];

// Shared fixtures, computed ONCE at module scope rather than per-test.
var cardStyle = {};
var tagDefaultStyleMap;

before(function () {
  CARD_SLUGS.forEach(function (slug) {
    cardStyle[slug] = ar.resolveRootTokenStyle(slug);
  });
  var flowData = {
    screens: [
      {
        content: [
          {
            type: "INSTANCE",
            library: "ds",
            dsSlug: "tag-default",
            variant: "",
          },
        ],
      },
    ],
  };
  tagDefaultStyleMap = dsAnatomyMap.buildDsVariantStyleMap(flowData);
});

describe("token-bindings join deliverable (real vendored Card + tag-default sidecars, path b)", function () {
  it("both harvested card slugs have usable anatomy above the render-tier gate", function () {
    CARD_SLUGS.forEach(function (slug) {
      var doc = ar.loadAnatomy(slug);
      assert.ok(doc && doc.root, slug + " must have a parsed anatomy root");
      var ratio = doc.quality && doc.quality.ratio;
      assert.ok(
        typeof ratio === "number" && ratio >= 0.6,
        slug +
          " ratio should be above the render-tier gate (got " +
          ratio +
          ")",
      );
    });
  });

  it("resolveRootTokenStyle joins card-for-perimeter's real harvested shell facts", function () {
    var style = cardStyle["card-for-perimeter"];
    assert.ok(style, "resolveRootTokenStyle must resolve a non-empty style");
    [
      "background-color:var(--zen-color-bg-default)",
      "border-radius:var(--zen-border-radius-sm)",
      "padding:var(--zen-spacing-sm)",
    ].forEach(function (decl) {
      assert.ok(
        style.indexOf(decl) !== -1,
        "missing root fact: " + decl + " (got: " + style + ")",
      );
    });
  });

  it("resolveRootTokenStyle joins card-for-grouped-content's real shell facts", function () {
    var style = cardStyle["card-for-grouped-content"];
    assert.ok(style, "resolveRootTokenStyle must resolve a non-empty style");
    assert.ok(
      /background-color:var\(--zen-/.test(style),
      "shell background-color fact missing (got: " + style + ")",
    );
    assert.ok(
      /border-radius:var\(--zen-/.test(style),
      "shell border-radius fact missing (got: " + style + ")",
    );
  });

  it("buildDsVariantStyleMap (path b's variant-aware wrapper) resolves real vendored facts for its one delegated slug (tag-default)", function () {
    var keys = Object.keys(tagDefaultStyleMap);
    assert.ok(
      keys.length > 0,
      "expected buildDsVariantStyleMap to resolve at least one entry",
    );
    var joined = keys
      .map(function (k) {
        return tagDefaultStyleMap[k];
      })
      .join(";");
    assert.ok(
      /var\(--zen-/.test(joined),
      "buildDsVariantStyleMap must resolve a real vendored token, got: " +
        joined,
    );
  });
});
