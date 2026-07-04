// tests/renderers/appearance-emit-values-only.test.js
// Runtime emit gate (Phase 1B, Task 7): renders every vendored appearance
// doc through the real ds-html-map.js seam (setAnatomyDocMap ->
// renderDSComponent's default: case) and asserts the emitted HTML never
// contains a bare var(--name) with no fallback. Phase 1 is VALUES-ONLY:
// appearance-style.js's appearanceToDecls() emits raw resolved values, never
// var(--token, value) wrapping (that's Phase 2). This is the runtime
// replacement for the static token-resolution.test.js source-scan, which
// cannot see values injected through this doc-map seam.
//
// Test-integrity fix (Phase 1B strengthening, Task T1): the bare-var()
// assertion alone is VACUOUS — it passes 100% even with the appearance path
// fully broken, because a graceful `.ds-component` chip also contains no
// var(). This file adds a second, load-bearing assertion: count how many
// non-BUILT_SLUGS outputs actually rendered via `.ds-appearance` (not a
// chip) and require a real majority floor, so a total wiring collapse (every
// slug degrading to a chip) fails the test.
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var ds = require("../../scripts/renderers/html-renderers/ds-html-map.js");

var ANATOMY_DIR = path.join(__dirname, "../../vendor/components/dist/anatomy");
// Bare var() with no comma fallback: var(--x) but NOT var(--x, value)
var BARE_VAR = /var\(\s*--[a-zA-Z0-9-]+\s*\)/;

// Load-bearing floor (Task 8 fix): with the doc map fully populated, a real
// wiring collapse — e.g. renderAppearanceComponent always returning "" / the
// default: seam never reading _serverAnatomyDocs — would make every one of
// these slugs fall through to the legacy anatomy map (also unset here) and
// degrade to gracefulChip() (`class="ds-component"`), not a `ds-appearance`
// wrapper. Observed today: 48/48 non-BUILT_SLUGS docs render via the
// appearance path. MIN_APPEARANCE_RENDERED is set well below that (not at
// it) so normal per-slug churn (a doc dropping its root appearance, a new
// low-quality doc skipped by the R2 ratio floor) doesn't make this test
// flaky, while a total collapse (0 rendered) still fails hard.
var MIN_APPEARANCE_RENDERED = 40;

test("appearance-rendered output emits values only (no bare var(--name))", function () {
  var slugs = fs.readdirSync(ANATOMY_DIR).filter(function (f) {
    return f.endsWith(".json");
  });
  var docs = {};
  slugs.forEach(function (f) {
    var slug = f.replace(/\.json$/, "");
    docs[slug] = JSON.parse(fs.readFileSync(path.join(ANATOMY_DIR, f), "utf8"));
  });
  ds.setAnatomyDocMap(docs);
  try {
    var nonBuiltSlugs = Object.keys(docs).filter(function (slug) {
      return ds.BUILT_SLUGS.indexOf(slug) === -1; // bespoke cases excluded
    });
    var appearanceRenderedCount = 0;
    nonBuiltSlugs.forEach(function (slug) {
      var name = docs[slug].root && docs[slug].root.name;
      var html = ds.renderDSComponent({
        type: "INSTANCE",
        library: "ds",
        dsSlug: slug,
        variant: name || "",
      });
      assert.doesNotMatch(html, BARE_VAR, slug + " emitted a bare var(--name)");
      // Load-bearing: count outputs that actually took the appearance render
      // path (a real `.ds-appearance` wrapper), not the graceful `.ds-component`
      // chip. The bare-var() assertion above passes vacuously on a chip (a
      // chip has no var() at all), so it alone cannot catch a wiring collapse
      // — this count is what makes that failure mode visible.
      if (html.indexOf('class="ds-appearance') !== -1) {
        appearanceRenderedCount++;
      }
    });
    assert.ok(
      appearanceRenderedCount >= MIN_APPEARANCE_RENDERED,
      "expected at least " +
        MIN_APPEARANCE_RENDERED +
        " of " +
        nonBuiltSlugs.length +
        " non-BUILT_SLUGS docs to render via the appearance path " +
        '(class="ds-appearance"), got ' +
        appearanceRenderedCount +
        " — a total wiring collapse would degrade every one of these to a " +
        "graceful chip instead",
    );
  } finally {
    ds.setAnatomyDocMap(null);
  }
});
