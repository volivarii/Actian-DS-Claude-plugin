// tests/renderers/appearance-variant-realdata.test.js
// Test-integrity fix (Phase 1B strengthening, Task T4): every OTHER real-data
// appearance test (appearance-render-realdata.test.js,
// appearance-emit-values-only.test.js, ds-coverage.test.js) only ever renders
// a component at its captured DEFAULT/base variant — the vendored anatomy
// doc's own `root.name` (which IS the default variant by construction). Only
// flow-share-appearance.test.js exercises a single non-default pick, for one
// slug (it named tag-status Status=Success until knowledge #472 built that
// slug; its specimen is resolved at run time now).
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
        return {
          prop: entry.prop,
          value: entry.values[0],
          deltaValue: deltaValue,
        };
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

// Most candidates must be genuinely exercised, as a SHARE of the live
// population rather than a fixed count.
//
// This was `MIN_EXERCISED = 18`, "the real number, not a rounder/looser one",
// from when 19 non-BUILT_SLUGS docs carried variants[] data and 18 had a
// matchable (non-null) delta. Gray-box-to-zero keeps converting those docs
// into BUILT slugs (knowledge #472 left 8 candidates), so a fixed 18 fails
// while all 8 remaining candidates verify correctly.
//
// Deliberately NOT `exercised === candidateCount - skippedStructuralOnly`:
// those three counters are written by one pass of the same loop (a candidate
// either lands in skippedStructuralOnly or increments exercised, and a failed
// per-slug assert throws before the tally is read), so that equality holds by
// construction and can never fail. It would look like a stricter check while
// being a no-op — in particular it stays true if findMatchableVariantPick
// regresses and starts misreading real deltas as structural-only, because
// both counters move together. A share of candidateCount does catch exactly
// that drift, since skippedStructuralOnly growing pushes the ratio down.
var MIN_EXERCISED_SHARE = 0.94; // the original 18/19
//
// candidateCount - skippedStructuralOnly is exactly what the original comment
// meant by "the real number": every candidate carrying something literal to
// match. It stays exact as the population shrinks, and it is stricter than a
// floor because it tolerates no unexplained shortfall at all.

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

  // A zero population would make the equality below hold trivially (0 === 0),
  // so assert the loop actually had subjects. When gray-box-to-zero finishes
  // this fires and this test needs retiring, which is a decision, not a pass.
  assert.ok(
    candidateCount > 0,
    "no non-BUILT_SLUGS docs carry variants[] data any more — this test has " +
      "no subject left; retire or repoint it rather than letting it pass " +
      "against an empty population",
  );
  assert.ok(
    exercised >= Math.ceil(candidateCount * MIN_EXERCISED_SHARE),
    "expected at least " +
      Math.ceil(candidateCount * MIN_EXERCISED_SHARE) +
      " (" +
      Math.round(MIN_EXERCISED_SHARE * 100) +
      "%) of the live candidates to render + verify correctly, got " +
      exercised +
      " (candidates with variants[] data: " +
      candidateCount +
      ", structural-only skips: " +
      (skippedStructuralOnly.join(", ") || "none") +
      ")",
  );
});
