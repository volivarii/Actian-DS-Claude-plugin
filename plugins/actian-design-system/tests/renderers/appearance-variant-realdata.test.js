// tests/renderers/appearance-variant-realdata.test.js
// Test-integrity fix (Phase 1B strengthening, Task T4): every OTHER real-data
// appearance test (appearance-render-realdata.test.js,
// appearance-emit-values-only.test.js, ds-coverage.test.js) only ever renders
// a component at its captured DEFAULT/base variant — the vendored anatomy
// doc's own `root.name` (which IS the default variant by construction). Only
// flow-share-appearance.test.js exercises a single non-default pick
// (tag-status Status=Success), for one slug.
//
// That leaves resolveNodeAppearance's variant-MATCH and deep-merge logic
// (appearance-render.js) — including the C1 fix that deep-merges `border`/
// `text` sub-keys instead of wholesale-replacing them — exercised on exactly
// one real component. A variant-matching bug specific to another component's
// variants[] shape (different prop axis, different nesting, a node other
// than root carrying the variants[] array) would be uncaught.
//
// This test renders EVERY vendored non-BUILT_SLUGS doc that carries any
// variants[] data (root or descendant node) at a real NON-default variant
// value taken straight from that entry, and asserts the rendered HTML
// reflects the delta: contains the entry's own literal value, and differs
// from the base/default render. Scoped to non-BUILT_SLUGS because only the
// default: seam (renderAppearanceComponent) reads appearance/variants at
// all — a BUILT_SLUGS case renders from its own hand-authored branch and
// would never exercise this code path.
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var ds = require("../../scripts/lib/renderer.js").dsHtmlMap;

var ANATOMY_DIR = path.join(__dirname, "../../vendor/components/dist/anatomy");

// A literal, matchable delta value from a variants[] entry: the first
// non-null background / border.color / radius / text.color the entry
// declares. An entry that only sets a key to `null` (e.g. `border: null` to
// REMOVE a border for a variant) emits no CSS declaration at all — see
// appearanceToDecls's `has()` gate — so there is nothing literal to assert a
// string match on. Such entries are treated as unmatchable here and skipped
// in favor of the next entry (see findMatchableVariantPick).
function pickDeltaValue(entry) {
  if (!entry) return null;
  if (typeof entry.background === "string" && entry.background) {
    return entry.background;
  }
  if (
    entry.border &&
    typeof entry.border === "object" &&
    typeof entry.border.color === "string" &&
    entry.border.color
  ) {
    return entry.border.color;
  }
  if (typeof entry.radius === "string" && entry.radius) return entry.radius;
  if (
    entry.text &&
    typeof entry.text === "object" &&
    typeof entry.text.color === "string" &&
    entry.text.color
  ) {
    return entry.text.color;
  }
  return null;
}

// Depth-first search (root first, then children in order) for the first
// variants[] entry ANYWHERE in the tree — not just root — that carries a
// real matchable delta value. Returns { prop, value, deltaValue } or null if
// every variants[] entry found is a structural/removal-only (`null`) delta.
function findMatchableVariantPick(node) {
  if (!node || typeof node !== "object") return null;
  var ap = node.appearance;
  if (ap && Array.isArray(ap.variants)) {
    for (var i = 0; i < ap.variants.length; i++) {
      var entry = ap.variants[i];
      if (!entry || !entry.prop || !Array.isArray(entry.values)) continue;
      if (!entry.values.length) continue;
      var deltaValue = pickDeltaValue(entry);
      if (deltaValue) {
        return { prop: entry.prop, value: entry.values[0], deltaValue: deltaValue };
      }
    }
  }
  if (Array.isArray(node.children)) {
    for (var c = 0; c < node.children.length; c++) {
      var found = findMatchableVariantPick(node.children[c]);
      if (found) return found;
    }
  }
  return null;
}

function hasAnyVariants(node) {
  if (!node || typeof node !== "object") return false;
  if (
    node.appearance &&
    Array.isArray(node.appearance.variants) &&
    node.appearance.variants.length
  ) {
    return true;
  }
  if (Array.isArray(node.children)) {
    return node.children.some(hasAnyVariants);
  }
  return false;
}

function variantString(obj) {
  return Object.keys(obj)
    .map(function (k) {
      return k + "=" + obj[k];
    })
    .join(", ");
}

// Real observed floor: 19 vendored non-BUILT_SLUGS docs carry variants[] data
// anywhere in their tree; 18 of them have at least one matchable (non-null)
// delta today (the 19th, lineage-grouped-node, has only a `border: null`
// removal delta on its sole variants[] entry — a genuine structural-only
// case, counted via the skip path below, not padded into the floor). Set at
// the real number, not a rounder/looser one, so a real regression in
// variant-matching or the deep-merge fails this immediately.
var MIN_EXERCISED = 18;

test("appearance variant deltas resolve correctly on real vendored data (non-default variant)", function () {
  var slugFiles = fs.readdirSync(ANATOMY_DIR).filter(function (f) {
    return f.endsWith(".json");
  });
  var docs = {};
  slugFiles.forEach(function (f) {
    var slug = f.replace(/\.json$/, "");
    docs[slug] = JSON.parse(fs.readFileSync(path.join(ANATOMY_DIR, f), "utf8"));
  });
  ds.setAnatomyDocMap(docs);

  var exercised = 0;
  var skippedStructuralOnly = [];
  var candidateCount = 0;

  try {
    Object.keys(docs).forEach(function (slug) {
      if (ds.BUILT_SLUGS.indexOf(slug) !== -1) return; // only the appearance seam is under test
      var doc = docs[slug];
      if (!hasAnyVariants(doc.root)) return; // nothing non-default to exercise

      candidateCount++;
      var pick = findMatchableVariantPick(doc.root);
      if (!pick) {
        // Every variants[] entry in this doc's tree is a null/removal-only
        // delta — nothing literal to assert a match on. Skip explicitly and
        // count, per design, rather than weaken the assertion to pass.
        skippedStructuralOnly.push(slug);
        return;
      }

      var baseVariantStr = (doc.root && doc.root.name) || "";
      var targetVariantObj = Object.assign({}, doc.variantDefaults || {});
      targetVariantObj[pick.prop] = pick.value;
      var targetVariantStr = variantString(targetVariantObj);

      var baseHtml = ds.renderDSComponent({
        type: "INSTANCE",
        library: "ds",
        dsSlug: slug,
        variant: baseVariantStr,
      });
      var targetHtml = ds.renderDSComponent({
        type: "INSTANCE",
        library: "ds",
        dsSlug: slug,
        variant: targetVariantStr,
      });

      assert.ok(
        targetHtml.indexOf(pick.deltaValue) !== -1,
        slug +
          " (" +
          pick.prop +
          "=" +
          pick.value +
          ") expected the rendered output to contain the variant delta value " +
          JSON.stringify(pick.deltaValue),
      );
      assert.notStrictEqual(
        targetHtml,
        baseHtml,
        slug +
          " (" +
          pick.prop +
          "=" +
          pick.value +
          ") variant render should differ from the base/default render",
      );
      exercised++;
    });
  } finally {
    ds.setAnatomyDocMap(null);
  }

  assert.ok(
    exercised >= MIN_EXERCISED,
    "expected at least " +
      MIN_EXERCISED +
      " non-BUILT_SLUGS docs with real variant deltas to render + verify " +
      "correctly, got " +
      exercised +
      " (candidates with variants[] data: " +
      candidateCount +
      ", structural-only skips: " +
      (skippedStructuralOnly.join(", ") || "none") +
      ")",
  );
});
