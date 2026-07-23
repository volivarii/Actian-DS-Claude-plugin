// tests/renderers/appearance-emit-values-only.test.js
// Runtime emit gate: renders every vendored appearance doc through the real
// ds-html-map.js seam (setAnatomyDocMap -> renderDSComponent's default: case)
// and enforces the P2 name-layer invariants on the actual emitted HTML — the
// runtime replacement for the static token-resolution.test.js source-scan,
// which cannot see values/tokens injected through this doc-map seam.
//
// Two invariants, both load-bearing:
//   (1) NO BARE var(--name): every var() the emit produces MUST carry a value
//       fallback (var(--token, value)). A bare var(--x) is the washout-bug
//       class — an unpublished name with no fallback resolves to nothing. The
//       emit is VALUES-ONLY for any slot without a token, and var(token, value)
//       when a token rides (P2); either way a bare var must never appear.
//   (2) EMITTED TOKEN NAMES RESOLVE: every --zen-* name the emit wraps in a
//       var() must be a real custom property defined in the vendored tokens.css
//       (else it silently falls back — fidelity holds, but theming is dead and
//       it signals a capture/publish drift). Data-driven: a no-op while the
//       variable-id export is empty (vendored data carries no token names yet),
//       it starts enforcing the instant names begin to flow.
//
// Non-vacuity floor: the bare-var() assertion alone passes 100% even with the
// appearance path fully broken (a graceful `.ds-component` chip also has no
// var()). So this also counts how many non-BUILT_SLUGS outputs actually
// rendered via `.ds-appearance` (not a chip) and requires a real floor, so a
// total wiring collapse (every slug degrading to a chip) fails hard.
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var ds = require("../../scripts/lib/renderer.js").dsHtmlMap;
var appearanceRender =
  require("../../scripts/lib/renderer.js").appearanceRender;
var PATHS = require("../../scripts/lib/paths.js");

var ANATOMY_DIR = path.join(__dirname, "../../vendor/components/dist/anatomy");
// Bare var() with no comma fallback: var(--x) but NOT var(--x, value)
var BARE_VAR = /var\(\s*--[a-zA-Z0-9-]+\s*\)/;
// Every var(--name referenced (name only; fallback ignored).
var VAR_REF = /var\(\s*(--[a-zA-Z0-9-]+)/g;
// Every --name: defined in a stylesheet.
var VAR_DEF = /(--[a-zA-Z0-9-]+)\s*:/g;

// Load-bearing floor (Task 8 fix): with the doc map fully populated, a real
// wiring collapse — e.g. renderAppearanceComponent always returning "" / the
// default: seam never reading _serverAnatomyDocs — would make every one of
// these slugs fall straight through to gracefulChip() (`class="ds-component"`)
// rather than a `ds-appearance` wrapper (there is no legacy anatomy-map
// fallback left to catch it — Group C retired that two-hop path).
//
// Expressed as a SHARE of the live non-BUILT population, not an absolute
// count. It was 40, chosen as comfortably below the 48/48 observed at the
// time so that normal per-slug churn (a doc dropping its root appearance, a
// new low-quality doc skipped by the R2 ratio floor) would not make this
// flaky. But gray-box-to-zero is deliberately shrinking that population one
// slice at a time (knowledge #472 took it to 23), so an absolute floor
// eventually exceeds the whole population and fails while every remaining
// slug renders perfectly — as it did here at 23/23. Lowering the number each
// slice would be exactly the slow tolerance-widening we do not do; a share
// keeps the original intent and stays true as the denominator falls.
var MIN_APPEARANCE_SHARE = 0.83; // ~ the original 40/48 margin

function definedVars(src) {
  var out = new Set(),
    m;
  while ((m = VAR_DEF.exec(src))) out.add(m[1]);
  VAR_DEF.lastIndex = 0;
  return out;
}

test("appearance emit: every var() carries a fallback and resolves in tokens.css", function () {
  var slugs = fs.readdirSync(ANATOMY_DIR).filter(function (f) {
    return f.endsWith(".json");
  });
  var docs = {};
  slugs.forEach(function (f) {
    var slug = f.replace(/\.json$/, "");
    docs[slug] = JSON.parse(fs.readFileSync(path.join(ANATOMY_DIR, f), "utf8"));
  });
  var defined = definedVars(fs.readFileSync(PATHS.tokens.css, "utf8"));
  ds.setAnatomyDocMap(docs);
  try {
    var nonBuiltSlugs = Object.keys(docs).filter(function (slug) {
      return ds.BUILT_SLUGS.indexOf(slug) === -1; // bespoke cases excluded
    });
    var appearanceRenderedCount = 0;
    var unresolved = []; // {slug, name} for any emitted var() name not in tokens.css
    nonBuiltSlugs.forEach(function (slug) {
      var name = docs[slug].root && docs[slug].root.name;
      var html = ds.renderDSComponent({
        type: "INSTANCE",
        library: "ds",
        dsSlug: slug,
        variant: name || "",
      });
      assert.doesNotMatch(html, BARE_VAR, slug + " emitted a bare var(--name)");
      // (2) Every emitted --zen-* name must resolve in the vendored tokens.css.
      // A no-op today (vendored anatomy carries no token names until the
      // variable-id export is populated), it catches a capture/publish drift
      // the moment names begin to ride — a name that themes to nothing.
      var m;
      while ((m = VAR_REF.exec(html))) {
        if (!defined.has(m[1])) unresolved.push(slug + ":" + m[1]);
      }
      VAR_REF.lastIndex = 0;
      // Load-bearing: count outputs that actually took the appearance render
      // path (a real `.ds-appearance` wrapper), not the graceful `.ds-component`
      // chip. The bare-var() assertion above passes vacuously on a chip (a
      // chip has no var() at all), so it alone cannot catch a wiring collapse
      // — this count is what makes that failure mode visible.
      if (html.indexOf('class="ds-appearance') !== -1) {
        appearanceRenderedCount++;
      }
    });
    assert.deepEqual(
      unresolved.sort(),
      [],
      "emitted var(--name) with no tokens.css definition (themes to nothing — " +
        "check the capture/publish join): " +
        unresolved.join(", "),
    );
    // The share is meaningless against an empty population, and "0 of 0"
    // would sail through as a pass. When gray-box-to-zero finishes there is
    // no appearance path left to guard, and that must be a loud decision
    // point rather than a silently vacuous assertion.
    assert.ok(
      nonBuiltSlugs.length > 0,
      "no non-BUILT_SLUGS docs remain — the appearance path has no subject " +
        "left to guard; retire or repoint this test rather than letting it " +
        "pass against an empty population",
    );
    var floor = Math.ceil(nonBuiltSlugs.length * MIN_APPEARANCE_SHARE);
    assert.ok(
      appearanceRenderedCount >= floor,
      "expected at least " +
        floor +
        " (" +
        Math.round(MIN_APPEARANCE_SHARE * 100) +
        "%) of " +
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

// Non-vacuity proof for invariant (2). The gate above is a no-op while vendored
// anatomy carries no token names, so this drives token-bearing appearance
// through the SAME emit and confirms the resolution check has teeth: a
// published name passes and rides as a real var(--name, value); an
// unpublished one is flagged by the exact defined-set check the gate uses.
test("resolution check is non-vacuous: published --zen name rides, unpublished is flagged", function () {
  var defined = definedVars(fs.readFileSync(PATHS.tokens.css, "utf8"));
  var doc = {
    slug: "synthetic",
    root: {
      name: "",
      kind: "container",
      appearance: {
        background: "#f3f5f9",
        backgroundToken: "--zen-color-bg-selected", // real, defined in tokens.css
        border: {
          color: "#000000",
          colorToken: "--zen-not-a-real-token-xyz", // deliberately unpublished
          width: "1px",
        },
      },
      children: [],
    },
  };
  var html = appearanceRender.renderAppearanceComponent(doc, {});
  assert.doesNotMatch(html, BARE_VAR); // both still carry a value fallback
  var refs = [];
  var m;
  while ((m = VAR_REF.exec(html))) refs.push(m[1]);
  VAR_REF.lastIndex = 0;
  assert.ok(
    refs.indexOf("--zen-color-bg-selected") !== -1,
    "a published token must ride as var(--name, value)",
  );
  var unresolved = refs.filter(function (n) {
    return !defined.has(n);
  });
  assert.deepEqual(
    unresolved,
    ["--zen-not-a-real-token-xyz"],
    "the resolution check must flag exactly the unpublished name",
  );
});

// Same teeth for the LAYOUT emit (flexStyle gap/padding), which the invariant-2
// scan covers structurally but no vendored data exercises yet. Drives a layout
// token through the SAME emit + gate regexes: a published spacing token rides as
// a real var() and an unpublished one is flagged, proving the layout path is not
// silently escaping the runtime gate.
test("resolution check is non-vacuous for LAYOUT tokens (flexStyle gap/padding)", function () {
  var defined = definedVars(fs.readFileSync(PATHS.tokens.css, "utf8"));
  var doc = {
    slug: "synthetic-layout",
    root: {
      name: "",
      kind: "container",
      layout: {
        axis: "row",
        gap: "8px",
        gapToken: "--zen-spacing-xs", // real, defined in tokens.css
        padding: { top: "16px", right: "8px", bottom: "16px", left: "8px" },
        paddingTokens: { left: "--zen-not-a-real-spacing-xyz" }, // unpublished
        align: { main: "start", cross: "center" },
      },
      children: [],
    },
  };
  var html = appearanceRender.renderAppearanceComponent(doc, {});
  assert.doesNotMatch(html, BARE_VAR); // gap + padding both carry a fallback
  var refs = [];
  var m;
  while ((m = VAR_REF.exec(html))) refs.push(m[1]);
  VAR_REF.lastIndex = 0;
  assert.ok(
    refs.indexOf("--zen-spacing-xs") !== -1,
    "a published layout token must ride as var(--name, value)",
  );
  var unresolved = refs.filter(function (n) {
    return !defined.has(n);
  });
  assert.deepEqual(
    unresolved,
    ["--zen-not-a-real-spacing-xyz"],
    "the gate must flag an unpublished layout token exactly as it does a color one",
  );
});
