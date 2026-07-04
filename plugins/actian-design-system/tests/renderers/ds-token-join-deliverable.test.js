#!/usr/bin/env node
"use strict";

// ds-token-join-deliverable.test.js — deliverable-level gate for the
// anatomy-id → token-bindings-sidecar JOIN mechanism (knowledge #333/#335
// consumer). The former producer of this coverage (buildDsAnatomyMap /
// renderAnatomy, "path c") was retired in Group C; the join itself
// (loadAnatomy + loadTokenBindings + resolveTokenDecls) survives as path b's
// substrate (see resolveRootTokenStyle / ds-anatomy-map.js's
// buildDsVariantStyleMap). This walks the real anatomy tree locally and
// asserts resolveTokenDecls joins the same per-part facts a card slug's
// sidecar carries. Real files, no fixtures: if the vendor tree loses the
// sidecars or anatomy loses node ids, this fails.

var { describe, it } = require("node:test");
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

var SLUGS = ["card-for-perimeter", "card-for-grouped-content"];

// Collect { nodeId -> decl[] } for every node in the doc's tree, via the SAME
// join (loadTokenBindings + resolveTokenDecls) path b's resolveRootTokenStyle
// uses for the root node alone.
function joinAllNodes(slug) {
  var doc = ar.loadAnatomy(slug);
  var bindings = ar.loadTokenBindings(slug);
  var byNodeId = bindings ? bindings.byNodeId : null;
  var variantDefaults = bindings ? bindings.variantDefaults : null;
  var out = {};
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (node.id) {
      out[node.id] = ar.resolveTokenDecls(
        byNodeId ? byNodeId[node.id] : null,
        null,
        variantDefaults,
      );
    }
    (node.children || []).forEach(walk);
  }
  walk(doc.root);
  return { doc: doc, out: out };
}

describe("token-bindings join deliverable (real vendored Card sidecars)", function () {
  it("both harvested card slugs have usable anatomy above the render-tier gate", function () {
    SLUGS.forEach(function (slug) {
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

  it("card-for-perimeter root carries the harvested shell facts", function () {
    var joined = joinAllNodes("card-for-perimeter");
    var decls = joined.out[joined.doc.root.id];
    [
      "background-color:var(--zen-color-bg-default)",
      "border-radius:var(--zen-border-radius-sm)",
      "padding:var(--zen-spacing-sm)",
    ].forEach(function (decl) {
      assert.ok(decls.indexOf(decl) !== -1, "missing root fact: " + decl);
    });
  });

  it("card-for-perimeter inner parts carry gap/typography facts (incl. font-family)", function () {
    var joined = joinAllNodes("card-for-perimeter");
    var allDecls = [].concat.apply([], Object.values(joined.out));
    [
      "gap:var(--zen-spacing-2xs)", // Body container
      "color:var(--zen-color-text-default)", // Name + counter
      "letter-spacing:var(--zen-font-letterspacing-2)", // primitive-grade fact still renders
      "font-family:var(--zen-font-family-text)", // text nodes
      "font-weight:var(--zen-font-weight-medium)", // Name
      "font-weight:var(--zen-font-weight-regular)", // Counter
    ].forEach(function (decl) {
      assert.ok(allDecls.indexOf(decl) !== -1, "missing part fact: " + decl);
    });
  });

  it("instance nodes (excluded from harvest) carry no token facts", function () {
    SLUGS.forEach(function (slug) {
      var joined = joinAllNodes(slug);
      function walkInstances(node) {
        if (!node || typeof node !== "object") return;
        if (node.kind === "instance") {
          assert.deepStrictEqual(
            joined.out[node.id] || [],
            [],
            slug + ": instance node " + node.id + " must stay token-free",
          );
        }
        (node.children || []).forEach(walkInstances);
      }
      walkInstances(joined.doc.root);
    });
  });

  it("card-for-grouped-content joins shell + slot facts", function () {
    var joined = joinAllNodes("card-for-grouped-content");
    var allDecls = [].concat.apply([], Object.values(joined.out));
    assert.ok(
      allDecls.some(function (d) {
        return d.indexOf("background-color:var(--zen-") === 0;
      }) &&
        allDecls.some(function (d) {
          return d.indexOf("border-radius:var(--zen-") === 0;
        }),
      "shell facts missing",
    );
  });
});
