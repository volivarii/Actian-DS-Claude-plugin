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


// The shipped category slugs, read from the vendored dist rather than restated.
function shippedCategorySlugs() {
  var fs = require("fs");
  var path = require("path");
  var PATHS = require("../../scripts/lib/paths.js");
  var dir = path.dirname(PATHS.components.categoryDefaults.byKey("action"));
  var slugs = fs
    .readdirSync(dir)
    .filter(function (f) {
      return /-defaults\.json$/.test(f);
    })
    .map(function (f) {
      return f.replace(/-defaults\.json$/, "");
    })
    .sort();
  assert.ok(slugs.length, "the vendored dist ships category defaults at all");
  return slugs;
}

test.beforeEach(function () {
  loader._resetCache();
});

// --- loadDefaultsForCategory ---

// Taken from the vendored dist rather than written out. These read the real
// snapshot, so a named category strands them on the next rename: this file said
// `form-input-selection` until knowledge #541 renamed it, the fourth hand-written
// copy of that one slug to go stale in a week.
function liveCategories() {
  var fs = require("fs");
  var path = require("path");
  var PATHS = require("../../scripts/lib/paths.js");
  var dir = path.dirname(PATHS.components.categoryDefaults.byKey("action"));
  return fs
    .readdirSync(dir)
    .filter(function (f) {
      return /-defaults\.json$/.test(f);
    })
    .map(function (f) {
      return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    });
}

test("loadDefaultsForCategory — known category returns parsed dist JSON", function () {
  var live = liveCategories()[0];
  assert.ok(live, "the vendored dist ships at least one category defaults file");
  var defaults = loader.loadDefaultsForCategory(live.slug);
  assert.ok(defaults, "must return a defaults object");
  assert.equal(defaults.slug, live.slug);
  assert.equal(defaults._schema_version, 2);
  assert.ok(defaults.anatomy);
  assert.ok(defaults.variants);
  assert.ok(defaults.motion_refs);
  assert.ok(defaults.a11y_refs);
});

test("loadDefaultsForCategory — consumes categorySlug verbatim; a raw label no longer resolves", function () {
  // Move 3: the loader takes the registry's canonical categorySlug
  // (= slugify(category), knowledge #189) directly, and does not re-derive a
  // slug from a human label. Demonstrated on a category whose label differs
  // from its slug by more than case, so the assertion cannot pass by accident.
  var differing = liveCategories().filter(function (c) {
    return c.label && c.slug && c.label.toLowerCase() !== c.slug;
  })[0];
  assert.ok(
    differing,
    "at least one shipped category has a label that is not its slug",
  );
  assert.equal(
    loader.loadDefaultsForCategory(differing.slug).slug,
    differing.slug,
  );
  assert.equal(loader.loadDefaultsForCategory(differing.label), null);
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
  // Read from the dist, not written out. These loops iterate against the REAL
  // vendored files, so a retired name does not fail here, it makes the inner
  // loop body never execute: the Form category's 1 motion ref and 6 a11y refs
  // stopped being verified and every one of these gates stayed green.
  var slugs = shippedCategorySlugs();
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
  // Read from the dist, not written out. These loops iterate against the REAL
  // vendored files, so a retired name does not fail here, it makes the inner
  // loop body never execute: the Form category's 1 motion ref and 6 a11y refs
  // stopped being verified and every one of these gates stayed green.
  var slugs = shippedCategorySlugs();
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
