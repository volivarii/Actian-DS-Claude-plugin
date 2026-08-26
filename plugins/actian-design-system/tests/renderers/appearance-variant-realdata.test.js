// tests/renderers/appearance-variant-realdata.test.js
// Every OTHER real-data appearance test (appearance-render-realdata.test.js,
// appearance-emit-values-only.test.js, ds-coverage.test.js) renders a
// component at its captured DEFAULT variant only, the vendored anatomy doc's
// own `root.name`. That leaves resolveNodeAppearance's variant MATCH and
// deep-merge logic (appearance-render.js), including the C1 fix that
// deep-merges `border`/`text` sub-keys instead of replacing them wholesale,
// exercised on one specimen.
//
// This test renders EVERY vendored non-BUILT_SLUGS doc that carries a
// variants[] entry (root or descendant node) at the first non-default value
// that entry names, and asserts the rendered HTML reflects the delta. Scoped
// to non-BUILT_SLUGS because only the default: seam (renderAppearanceComponent)
// reads appearance/variants at all; a BUILT_SLUGS case renders from its own
// hand-authored branch and would never exercise this code path.
//
// WHAT COUNTS AS THE DELTA. The expected change is computed by the renderer's
// own exported functions, not restated here: resolveNodeAppearance() gives the
// node's resolved appearance at the base and at the target variant, and
// appearanceToDecls() turns each into the CSS declarations the seam emits.
// Declarations present only at the target must appear MORE often in the target
// render than in the base render; declarations present only at the base must
// appear LESS often (a `border: null` delta removes one, which is the only way
// `card`'s single variant is observable). A per-variant `slug` swap (an icon
// instance that changes glyph) has no declaration, so it is asserted as the
// two renders differing. Counting occurrences rather than testing presence
// keeps a matching declaration on some OTHER node of the same doc from masking
// the change on this one.
//
// There is deliberately no skip path. An earlier version classified a
// removal-only delta as "structural, nothing literal to match" and skipped it,
// guarded by `exercised > 0`; that floor held with 1 of 12 candidates rendered
// and the one removal delta in the data was the one never rendered. Now every
// candidate is rendered and an entry that produces no observable delta at all
// fails by name, because the seam is then not under test for that slug.
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var renderer = require("../../scripts/lib/renderer.js");
var ds = renderer.dsHtmlMap;
var resolveNodeAppearance = renderer.appearanceRender.resolveNodeAppearance;
var appearanceToDecls = renderer.appearanceStyle.appearanceToDecls;

var ANATOMY_DIR = path.join(__dirname, "../../vendor/components/dist/anatomy");

// Depth-first (root first, then children in order): the first variants[]
// entry anywhere in the tree that names a prop and at least one value, with
// the node that carries it (resolution is per node).
function firstVariantEntry(node) {
  if (!node || typeof node !== "object") return null;
  var ap = node.appearance;
  if (ap && Array.isArray(ap.variants)) {
    for (var i = 0; i < ap.variants.length; i++) {
      var entry = ap.variants[i];
      if (entry && entry.prop && Array.isArray(entry.values) && entry.values.length) {
        return { node: node, entry: entry };
      }
    }
  }
  if (Array.isArray(node.children)) {
    for (var c = 0; c < node.children.length; c++) {
      var found = firstVariantEntry(node.children[c]);
      if (found) return found;
    }
  }
  return null;
}

// "Prop=Value, Other=Value" <-> { Prop: Value, Other: Value }
function parseVariant(str) {
  var out = {};
  String(str || "")
    .split(",")
    .forEach(function (pair) {
      var i = pair.indexOf("=");
      if (i > 0) out[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
    });
  return out;
}

function variantString(obj) {
  return Object.keys(obj)
    .map(function (k) {
      return k + "=" + obj[k];
    })
    .join(", ");
}

function count(haystack, needle) {
  return needle ? haystack.split(needle).length - 1 : 0;
}

test("appearance variant deltas resolve correctly on real vendored data (non-default variant)", function () {
  var slugFiles = fs.readdirSync(ANATOMY_DIR).filter(function (f) {
    return f.endsWith(".json");
  });
  var docs = {};
  var raw = {};
  slugFiles.forEach(function (f) {
    var slug = f.replace(/\.json$/, "");
    raw[slug] = fs.readFileSync(path.join(ANATOMY_DIR, f), "utf8");
    docs[slug] = JSON.parse(raw[slug]);
  });
  ds.setAnatomyDocMap(docs);

  var exercised = [];

  try {
    Object.keys(docs).forEach(function (slug) {
      if (ds.BUILT_SLUGS.indexOf(slug) !== -1) return; // only the appearance seam is under test
      var doc = docs[slug];
      var pick = firstVariantEntry(doc.root);
      if (!pick) return; // nothing non-default to exercise

      var entry = pick.entry;
      var label = slug + " (" + entry.prop + "=" + entry.values[0] + ")";
      var baseVariant = Object.assign(
        parseVariant(doc.root && doc.root.name),
        doc.variantDefaults || {},
      );
      var targetVariant = Object.assign({}, baseVariant);
      targetVariant[entry.prop] = entry.values[0];

      // Expected, from the renderer's own resolution of THIS node.
      var baseResolved = resolveNodeAppearance(pick.node, baseVariant) || {};
      var targetResolved = resolveNodeAppearance(pick.node, targetVariant) || {};
      var baseDecls = appearanceToDecls(baseResolved);
      var targetDecls = appearanceToDecls(targetResolved);
      var added = targetDecls.filter(function (d) {
        return baseDecls.indexOf(d) === -1;
      });
      var removed = baseDecls.filter(function (d) {
        return targetDecls.indexOf(d) === -1;
      });
      var slugSwap = (targetResolved.slug || null) !== (baseResolved.slug || null);
      assert.ok(
        added.length || removed.length || slugSwap,
        label +
          " produces no observable delta (no declaration added or removed, " +
          "no glyph swap), so the variant-match seam is not under test for it",
      );

      var baseHtml = ds.renderDSComponent({
        type: "INSTANCE",
        library: "ds",
        dsSlug: slug,
        variant: variantString(baseVariant),
      });
      var targetHtml = ds.renderDSComponent({
        type: "INSTANCE",
        library: "ds",
        dsSlug: slug,
        variant: variantString(targetVariant),
      });

      added.forEach(function (d) {
        assert.ok(
          count(targetHtml, d) > count(baseHtml, d),
          label + " expected the variant render to gain " + JSON.stringify(d),
        );
      });
      removed.forEach(function (d) {
        assert.ok(
          count(targetHtml, d) < count(baseHtml, d),
          label + " expected the variant render to lose " + JSON.stringify(d),
        );
      });
      assert.notStrictEqual(
        targetHtml,
        baseHtml,
        label + " variant render should differ from the base/default render",
      );
      exercised.push(slug);
    });
  } finally {
    ds.setAnatomyDocMap(null);
  }

  // Population guard, computed from the data by a route independent of the
  // tree walk above: every non-BUILT doc whose FILE carries a variants[] entry
  // must have been exercised. A walk that stops short (say, root only) shrinks
  // the exercised list and fails here by slug. When gray-box-to-zero empties
  // this population the test needs retiring, which is a decision, not a pass.
  var expected = Object.keys(raw)
    .filter(function (slug) {
      return (
        ds.BUILT_SLUGS.indexOf(slug) === -1 &&
        /"variants"\s*:\s*\[\s*\{/.test(raw[slug])
      );
    })
    .sort();
  assert.ok(
    expected.length > 0,
    "no non-BUILT_SLUGS docs carry variants[] data any more; this test has " +
      "no subject left, retire or repoint it rather than letting it pass " +
      "against an empty population",
  );
  assert.deepEqual(
    exercised.sort(),
    expected,
    "every non-BUILT doc with a variants[] entry must be rendered at a " +
      "non-default variant; the candidate walk and the file scan disagree",
  );
});
