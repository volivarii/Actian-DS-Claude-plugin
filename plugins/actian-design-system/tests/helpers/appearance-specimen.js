"use strict";

// appearance-specimen.js — pick a live specimen for the appearance-doc path.
//
// Several deliverable-level tests prove the captured-appearance renderer is
// wired by rendering ONE representative slug and asserting it came out as
// appearance HTML rather than a graceful chip. The slug itself was never the
// subject; it was only a specimen that had to be non-BUILT (BUILT slugs take
// their bespoke ds-html-map leaf instead) and carry usable anatomy.
//
// Those specimens used to be hardcoded ("tag-status", "link"). The
// gray-box-to-zero programme is deliberately converting non-BUILT slugs into
// BUILT ones slice by slice (knowledge #465 built `link`, #472 built
// `tag-status` and `avatar`), so every hardcoded specimen eventually becomes
// BUILT and reds these tests for a reason that is not a regression. Picking
// the specimen at run time from whatever is still on the appearance path
// keeps the assertion pointed at the wiring instead of at a slug name.
//
// The population is asserted non-empty on purpose. When gray-box finishes and
// nothing is left on the appearance path, these tests must fail loudly and be
// retired or repointed, not pass vacuously against zero specimens.

var fs = require("node:fs");
var path = require("node:path");

var ANATOMY_DIR = path.join(__dirname, "../../vendor/components/dist/anatomy");

function loadAnatomyDocs() {
  var docs = {};
  fs.readdirSync(ANATOMY_DIR)
    .filter(function (f) {
      return f.endsWith(".json");
    })
    .sort() // deterministic: same specimen on every run and every machine
    .forEach(function (f) {
      var slug = f.replace(/\.json$/, "");
      docs[slug] = JSON.parse(
        fs.readFileSync(path.join(ANATOMY_DIR, f), "utf8"),
      );
    });
  return docs;
}

// Slugs still served by the appearance path: they have an anatomy doc and no
// bespoke BUILT leaf shadowing it.
function nonBuiltSlugs(builtSlugs) {
  var docs = loadAnatomyDocs();
  return Object.keys(docs).filter(function (slug) {
    return builtSlugs.indexOf(slug) === -1;
  });
}

// First non-BUILT slug (deterministic order) for which `isUsable(slug, doc)`
// holds. Callers supply the usability predicate because "usable" differs per
// test: one needs buildDsAnatomyDocMap to yield a doc, another needs a
// resolved background colour to assert against.
function pickSpecimen(builtSlugs, isUsable) {
  var docs = loadAnatomyDocs();
  var candidates = nonBuiltSlugs(builtSlugs);
  if (!candidates.length) {
    throw new Error(
      "no non-BUILT slugs remain on the appearance path — the appearance-doc " +
        "tests have no subject left; retire or repoint them rather than " +
        "letting them pass against an empty population",
    );
  }
  for (var i = 0; i < candidates.length; i++) {
    if (isUsable(candidates[i], docs[candidates[i]])) {
      return { slug: candidates[i], doc: docs[candidates[i]] };
    }
  }
  throw new Error(
    "none of the " +
      candidates.length +
      " non-BUILT slugs satisfied the specimen predicate (checked: " +
      candidates.join(", ") +
      ")",
  );
}

// The first resolved background hex anywhere in a doc's tree. Appearance
// rendering emits resolved values, never `var(--token)` references, so this
// hex is what the rendered output must contain — a data-derived oracle rather
// than a hardcoded colour that goes stale when the capture is re-synced.
function firstResolvedBackground(node) {
  if (!node || typeof node !== "object") return null;
  var ap = node.appearance || {};
  if (
    typeof ap.background === "string" &&
    /^#[0-9a-fA-F]{3,8}$/.test(ap.background)
  ) {
    return ap.background;
  }
  var kids = node.children || [];
  for (var i = 0; i < kids.length; i++) {
    var hit = firstResolvedBackground(kids[i]);
    if (hit) return hit;
  }
  return null;
}

// A slug that is authorable (present in the vendored dskit registry) but has
// no BUILT leaf, i.e. one that must still raise the ds-slug-unbuilt warning
// tier. Same churn story as pickSpecimen: the validation test hardcoded
// "tooltip", was hand-repointed to "avatar" when tooltip was built, and #472
// built avatar too. Deterministic (sorted) so the chosen slug is stable.
function pickUnbuiltRegistrySlug(builtSlugs, registryPath) {
  var registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  var components = registry.components || registry;
  // Intersect with the anatomy-backed set rather than walking raw registry
  // keys: dskit also carries the ~200 icon entries, which are not authorable
  // as DS component nodes and would be a bogus specimen for the warning tier.
  var candidates = nonBuiltSlugs(builtSlugs)
    .filter(function (slug) {
      return slug in components;
    })
    .sort();
  if (!candidates.length) {
    throw new Error(
      "every registry slug now has a BUILT leaf — the ds-slug-unbuilt warning " +
        "tier has no subject left; retire or repoint that test rather than " +
        "letting it assert against nothing",
    );
  }
  return candidates[0];
}

// ---------------------------------------------------------------------------
// Variant-axis specimens.
//
// Same rot story as pickSpecimen above, one level down: several tests needed a
// read-only-tag variant that actually PAINTS something, and named one
// ("Color=Pink", "Color=Purple"). The 2026-08-12 fold-in replaced the whole
// Color axis with a 14-value Type axis, so those names resolved to nothing and
// the tests failed for a reason that was not a regression. Naming a Type value
// instead would only buy time until the next redesign, so the axis AND the
// value are read off the anatomy doc the renderer itself reads.

// The renderer's own modifier-suffix transform (ds-html-map.js, read-only-tag:
// `String(v.Type).toLowerCase().replace(/\s+/g, "-")`). Mirrored once here so
// every test that predicts a `ds-<block>--<value>` class agrees, instead of
// each re-deriving it slightly differently.
function variantClassSuffix(value) {
  return String(value).toLowerCase().replace(/\s+/g, "-");
}

// Every { prop, value } the doc's root appearance paints DIFFERENTLY from the
// base, in the doc's own array order (deterministic).
//
// These are exactly the values a per-variant CSS rule must exist for: a value
// with no entry here has no captured delta, so it renders as the base pill and
// a rule for it would be invention. Callers get the captured background/border
// alongside, so an assertion can check the real value rather than just the
// class name.
function capturedVariantPaints(doc) {
  var root = (doc && doc.root) || {};
  var base = root.appearance || {};
  var out = [];
  (base.variants || []).forEach(function (entry) {
    if (!entry || !entry.prop || !Array.isArray(entry.values)) return;
    if (!entry.background || entry.background === base.background) return;
    entry.values.forEach(function (value) {
      out.push({
        prop: entry.prop,
        value: value,
        variantString: entry.prop + "=" + value,
        classSuffix: variantClassSuffix(value),
        background: entry.background,
        border: entry.border || null,
      });
    });
  });
  return out;
}

// The first captured paint, asserted non-empty. Throws rather than returning
// null so a doc that stops painting anything fails loudly instead of letting
// the caller assert against nothing (the pickSpecimen contract).
function pickPaintedVariant(doc, slug) {
  var paints = capturedVariantPaints(doc);
  if (!paints.length) {
    throw new Error(
      (slug || "the anatomy doc") +
        " carries no appearance.variants entry that paints a background " +
        "differing from the base, so there is no painted specimen left; " +
        "retire or repoint the test rather than letting it pass vacuously",
    );
  }
  return paints[0];
}

// A variant string for the doc's OWN declared default, read from
// variantDefaults rather than assumed to be called "Default".
function defaultVariantString(doc, slug) {
  var defaults = (doc && doc.variantDefaults) || {};
  var prop = Object.keys(defaults)[0];
  if (!prop) {
    throw new Error(
      (slug || "the anatomy doc") +
        " declares no variantDefaults, so its default variant cannot be " +
        "derived (precondition)",
    );
  }
  return {
    prop: prop,
    value: defaults[prop],
    variantString: prop + "=" + defaults[prop],
    classSuffix: variantClassSuffix(defaults[prop]),
  };
}

module.exports = {
  ANATOMY_DIR: ANATOMY_DIR,
  loadAnatomyDocs: loadAnatomyDocs,
  nonBuiltSlugs: nonBuiltSlugs,
  pickSpecimen: pickSpecimen,
  firstResolvedBackground: firstResolvedBackground,
  pickUnbuiltRegistrySlug: pickUnbuiltRegistrySlug,
  variantClassSuffix: variantClassSuffix,
  capturedVariantPaints: capturedVariantPaints,
  pickPaintedVariant: pickPaintedVariant,
  defaultVariantString: defaultVariantString,
};
