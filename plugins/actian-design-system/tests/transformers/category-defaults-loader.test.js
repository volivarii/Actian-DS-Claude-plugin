"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var loader = require("../../scripts/transformers/category-defaults-loader.js");

// Tests in this file depend on the live vendor snapshot at
// plugins/actian-design-system/vendor/. If vendor is absent or stale, the
// "known slug returns X" tests below will fail loudly (asserting truthy
// on returned values); the "unknown slug returns null" tests would pass
// vacuously since a missing file yields an empty cache. Read failures
// top-to-bottom — the first failure that says "must resolve" or "must
// return a defaults object" is the real signal that the vendor needs a
// refresh via scripts/vendor/vendor-snapshot.js --range.

test.beforeEach(function () {
  loader._resetCache();
});

// --- normalizeCategorySlug ---

test("normalizeCategorySlug — known labels map correctly", function () {
  assert.equal(loader.normalizeCategorySlug("Action"), "action");
  assert.equal(
    loader.normalizeCategorySlug("Form (input & selection)"),
    "form-input-selection",
  );
  assert.equal(loader.normalizeCategorySlug("Navigation"), "navigation");
  assert.equal(loader.normalizeCategorySlug("Data Display"), "data-display");
  assert.equal(loader.normalizeCategorySlug("Feedback"), "feedback");
  assert.equal(loader.normalizeCategorySlug("Overlays"), "overlays");
});

test("normalizeCategorySlug — already-slugged input returns unchanged", function () {
  assert.equal(
    loader.normalizeCategorySlug("form-input-selection"),
    "form-input-selection",
  );
  assert.equal(loader.normalizeCategorySlug("data-display"), "data-display");
});

test("normalizeCategorySlug — null/empty returns null", function () {
  assert.equal(loader.normalizeCategorySlug(null), null);
  assert.equal(loader.normalizeCategorySlug(""), null);
  assert.equal(loader.normalizeCategorySlug(undefined), null);
});

// --- loadDefaultsForCategory ---

test("loadDefaultsForCategory — known category returns parsed dist JSON", function () {
  var defaults = loader.loadDefaultsForCategory("form-input-selection");
  assert.ok(defaults, "must return a defaults object");
  assert.equal(defaults.slug, "form-input-selection");
  assert.equal(defaults._schema_version, 2);
  assert.ok(defaults.anatomy);
  assert.ok(defaults.variants);
  assert.ok(defaults.motion_refs);
  assert.ok(defaults.a11y_refs);
});

test("loadDefaultsForCategory — accepts label, normalizes to slug", function () {
  var defaults = loader.loadDefaultsForCategory("Form (input & selection)");
  assert.ok(defaults);
  assert.equal(defaults.slug, "form-input-selection");
});

test("loadDefaultsForCategory — unknown slug returns null", function () {
  assert.equal(loader.loadDefaultsForCategory("nonexistent-category"), null);
});

test("loadDefaultsForCategory — null input returns null", function () {
  assert.equal(loader.loadDefaultsForCategory(null), null);
});

test("loadDefaultsForCategory — caches by slug (2nd call returns same object)", function () {
  var a = loader.loadDefaultsForCategory("action");
  var b = loader.loadDefaultsForCategory("action");
  assert.strictEqual(a, b, "second call must return cached reference");
});

// --- resolveMotionRef ---

test("resolveMotionRef — known slug returns pattern object", function () {
  var pattern = loader.resolveMotionRef("state-transitions");
  assert.ok(pattern, "must resolve");
  assert.equal(pattern.slug, "state-transitions");
  assert.ok(pattern.name);
  assert.ok(Array.isArray(pattern.phases));
});

test("resolveMotionRef — slug-renamed pattern resolves (slug !== key)", function () {
  // motion.json's `.patterns.drawer` has slug "drawer-open-close".
  // Loader must match by `.slug`, not by object key.
  var pattern = loader.resolveMotionRef("drawer-open-close");
  assert.ok(
    pattern,
    "drawer-open-close must resolve (lookup by .slug, not by key)",
  );
  assert.equal(pattern.slug, "drawer-open-close");
});

test("resolveMotionRef — unknown slug returns null", function () {
  assert.equal(loader.resolveMotionRef("nonexistent-motion-pattern"), null);
});

test("resolveMotionRef — null input returns null", function () {
  assert.equal(loader.resolveMotionRef(null), null);
  assert.equal(loader.resolveMotionRef(""), null);
});

// --- resolveAccessibilityRef ---

// The a11y index restructures across knowledge releases — the Accessibility
// v1.3.0 rework (knowledge v0.19.4+) replaced the old "aria-guidance"
// section with finer-grained slugs. Derive the "known slug" from the
// vendored index itself so this test survives upstream restructures; a
// hardcoded content slug breaks on every vendor refresh that renames it.
var fs = require("fs");
var PATHS = require("../../scripts/lib/paths.js");
var a11yIndex = JSON.parse(fs.readFileSync(PATHS.accessibility.index, "utf8"));
var knownA11ySlug = ((a11yIndex.sections || [])[0] || {}).slug;

test("resolveAccessibilityRef — known slug returns section object", function () {
  assert.ok(
    knownA11ySlug,
    "vendored a11y-index.json must carry at least one section",
  );
  var section = loader.resolveAccessibilityRef(knownA11ySlug);
  assert.ok(section, "known slug '" + knownA11ySlug + "' must resolve");
  assert.equal(section.slug, knownA11ySlug);
  assert.ok(section.title);
});

test("resolveAccessibilityRef — known slug 'color-contrast' resolves", function () {
  var section = loader.resolveAccessibilityRef("color-contrast");
  assert.ok(section);
  assert.equal(section.slug, "color-contrast");
});

test("resolveAccessibilityRef — unknown slug returns null", function () {
  assert.equal(loader.resolveAccessibilityRef("nonexistent-a11y-slug"), null);
});

test("resolveAccessibilityRef — null input returns null", function () {
  assert.equal(loader.resolveAccessibilityRef(null), null);
});

// --- All category-MD motion_refs + accessibility refs resolve end-to-end ---

test("category defaults — every motion_refs.ref resolves against motion.json", function () {
  var slugs = [
    "action",
    "form-input-selection",
    "navigation",
    "data-display",
    "feedback",
    "overlays",
  ];
  var unresolved = [];
  slugs.forEach(function (catSlug) {
    var d = loader.loadDefaultsForCategory(catSlug);
    var refs = (d && d.motion_refs && d.motion_refs.patternRefs) || [];
    refs.forEach(function (r) {
      if (!loader.resolveMotionRef(r.ref)) {
        unresolved.push(catSlug + " → " + r.ref);
      }
    });
  });
  assert.deepEqual(
    unresolved,
    [],
    "all motion_refs must resolve: " + unresolved.join("; "),
  );
});

test("category defaults — every accessibility.ref resolves against a11y-index", function () {
  var slugs = [
    "action",
    "form-input-selection",
    "navigation",
    "data-display",
    "feedback",
    "overlays",
  ];
  var unresolved = [];
  slugs.forEach(function (catSlug) {
    var d = loader.loadDefaultsForCategory(catSlug);
    var refs = (d && d.a11y_refs && d.a11y_refs.requirementRefs) || [];
    refs.forEach(function (r) {
      if (!loader.resolveAccessibilityRef(r.ref)) {
        unresolved.push(catSlug + " → " + r.ref);
      }
    });
  });
  assert.deepEqual(
    unresolved,
    [],
    "all accessibility refs must resolve: " + unresolved.join("; "),
  );
});
