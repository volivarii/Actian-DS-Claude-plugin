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

// Every candidate is either exercised or skipped as structural-only, and the
// three counters are written by one pass of the same loop, so
// `exercised === candidateCount - skippedStructuralOnly.length` holds by
// construction and can never fail. What CAN fail is the skip itself: if
// findMatchableVariantPick regresses and starts misreading a real delta as
// structural-only, the slug lands in skippedStructuralOnly with a literal
// value still sitting in its doc. So every skip is re-checked below by an
// INDEPENDENT walk of the whole doc (each variants[] entry, not the first
// matchable one, and its own key list rather than pickDeltaValue's), which
// must find no literal value at all.
//
// This replaces a share floor, `exercised >= ceil(candidateCount * 0.94)`
// (the original 18/19). That floor tolerated one structural-only skip only
// while the population was 17 or more. knowledge #588 (v0.34.150) added
// `card`, whose single delta is `Elevation=Raised with shadow` -> `border:
// null`, a removal the renderer emits no declaration for, and with 12
// candidates ceil(11.28) demanded all 12. Verifying the skip is the check
// the ratio was standing in for.
function entryHasLiteralDelta(entry) {
  if (!entry || typeof entry !== "object") return false;
  var literal = false;
  ["background", "border", "radius", "text"].forEach(function (key) {
    var v = entry[key];
    if (v === null || v === undefined) return;
    if (typeof v !== "object") {
      literal = true;
      return;
    }
    Object.keys(v).forEach(function (k) {
      if (v[k] !== null && v[k] !== undefined) literal = true;
    });
  });
  return literal;
}

function docHasLiteralDelta(node) {
  if (!node || typeof node !== "object") return false;
  var ap = node.appearance;
  if (ap && Array.isArray(ap.variants) && ap.variants.some(entryHasLiteralDelta)) {
    return true;
  }
  return Array.isArray(node.children) && node.children.some(docHasLiteralDelta);
}
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
  skippedStructuralOnly.forEach(function (slug) {
    assert.ok(
      !docHasLiteralDelta(docs[slug].root),
      slug +
        " was skipped as structural-only, but an independent walk of its " +
        "variants[] entries found a literal delta value: " +
        "findMatchableVariantPick is misreading real deltas",
    );
  });
  assert.ok(
    exercised > 0,
    "every candidate was skipped as structural-only (" +
      skippedStructuralOnly.join(", ") +
      "), so the variant-match seam was not exercised at all",
  );
});
