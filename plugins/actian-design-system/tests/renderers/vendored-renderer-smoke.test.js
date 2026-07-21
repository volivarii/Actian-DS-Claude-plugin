"use strict";

// Renderer relocation phase 2: knowledge owns the ONE renderer and the plugin
// vendors it back. This is the proof gate that runs BEFORE any consumer is
// repointed, per the spec's "the plugin's parametric path must not break
// mid-flight" risk.
//
// The failure mode this exists to catch is silent. The vendored ds-html-map
// resolves icons via require("../../lib/paths.js"); from
// vendor/components/render/renderer/html-renderers/ that path does not exist,
// and the require sits inside a try/catch, so without an injected icon map
// every glyph renders BLANK with no error. Nothing else in the suite catches
// it: the ds-screen-tree goldens inject window.dsHtmlMap and never exercise
// the require fallback.
//
// renderDSComponent also NEVER THROWS: every case is wrapped in a try that
// falls back to gracefulChip(), a bare <span class="ds-component">. So a
// completely broken renderer still returns a string, and "it produced output"
// proves nothing. Every assertion below proves real rendering.

var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("node:fs");
var path = require("node:path");
var PATHS = require("../../scripts/lib/paths.js");
var renderer = require("../../scripts/lib/renderer.js");

// Drive variants from the vendored matrix rather than hardcoding them, so a
// registry change cannot leave this test asserting against variants that no
// longer exist.
function firstCell(slug) {
  var cells = renderer.matrix.variantMatrix(slug);
  assert.ok(cells && cells.length, "no matrix cells for " + slug);
  return cells[0];
}

function render(slug, cell) {
  return renderer.dsHtmlMap.renderDSComponent({
    dsSlug: slug,
    variant: cell.variant,
    props: cell.props || {},
  });
}

function assertNotGracefulChip(html, what) {
  assert.ok(
    !/^<span class="ds-component"/.test(html),
    what +
      " fell back to gracefulChip, meaning the renderer swallowed an " +
      "exception. Output: " +
      String(html).slice(0, 200),
  );
}

test("every vendored renderer member resolves to a real file", function () {
  [
    "ds-base.css",
    "ds-fonts.css",
    "default-props.json",
    "matrix.js",
    "anatomy-render.js",
    "appearance-render.js",
    "appearance-style.js",
    "ds-anatomy-map.js",
    "html-renderers/ds-html-map.js",
    "html-renderers/anatomy-variant-key.js",
  ].forEach(function (name) {
    var resolved = renderer.modulePath(name);
    assert.ok(resolved, name + " resolved to null");
    assert.ok(
      fs.existsSync(resolved),
      name + " resolved to a missing file: " + resolved,
    );
  });
});

test("the vendored renderer exposes its entry points", function () {
  assert.equal(typeof renderer.dsHtmlMap.renderDSComponent, "function");
  assert.ok(Array.isArray(renderer.dsHtmlMap.BUILT_SLUGS));
  assert.ok(
    renderer.dsHtmlMap.BUILT_SLUGS.length >= 30,
    "expected the full built-slug set, got " +
      renderer.dsHtmlMap.BUILT_SLUGS.length,
  );
  assert.equal(typeof renderer.matrix.variantMatrix, "function");
  assert.ok(renderer.matrix.RENDER_SLUGS.length >= 30);
});

test("a component renders real markup, not the graceful fallback", function () {
  var html = render("button", firstCell("button"));
  assertNotGracefulChip(html, "button");
  assert.match(html, /ds-button/, "expected the .ds-button class");
});

// THE GATE. Without the icon injection this renders an empty <svg> and the
// component still "works", which is exactly why it needs its own assertion.
test("icons are injected: an icon-bearing component emits real path geometry", function () {
  var html = render("tag-interactive", firstCell("tag-interactive"));
  assertNotGracefulChip(html, "tag-interactive");
  var paths = html.match(/ d="M[^"]{20,}"/g) || [];
  assert.ok(
    paths.length > 0,
    "no substantial svg path data in the output: icons degraded to blank, " +
      "which means the setIcons injection is not wired (the vendored " +
      "ds-html-map cannot reach the plugin's lib/paths.js and fails silently)",
  );
});

test("the icon map is non-empty and matches the vendored source", function () {
  var count = Object.keys(renderer.icons).length;
  assert.ok(count > 100, "expected a populated icon map, got " + count);
});

// Phase 1b fixed tag colours and checkbox state IN the generic renderer, but
// only knowledge's gallery had them. Consuming the vendored renderer is what
// closes that divergence in the plugin's OWN output (spec success criterion 3),
// so pin it here rather than discovering it after the repoint.
test("the tag/checkbox divergence is closed in the plugin's own renderer", function () {
  var tagCells = renderer.matrix.variantMatrix("tag-default");
  var pink = tagCells.filter(function (c) {
    return /Color=Pink/.test(c.variant);
  })[0];
  assert.ok(pink, "tag-default matrix has no Pink cell");
  assert.match(
    render("tag-default", pink),
    /ds-tag--pink/,
    "tag-default must emit its colour class, not render as base grey",
  );

  var cbCells = renderer.matrix.variantMatrix("checkbox");
  var checked = cbCells.filter(function (c) {
    return /Selection=Checked/.test(c.variant);
  })[0];
  assert.ok(checked, "checkbox matrix has no Checked cell");
  assert.match(
    render("checkbox", checked),
    /ds-checkbox--checked/,
    "checkbox must emit its checked state class, not render as an empty box",
  );
});

test("the styling source is the vendored one and carries the phase-1b rules", function () {
  var css = fs.readFileSync(renderer.cssPaths.base, "utf8");
  assert.match(
    css,
    /\.ds-tag--pink/,
    "ds-base.css missing the tag colour rules",
  );
  assert.match(
    css,
    /\.ds-checkbox--indeterminate/,
    "ds-base.css missing the checkbox indeterminate rule",
  );
});

test("the icon map is the inner .icons, not the whole file", function () {
  // Guards the shape assertion in renderer.js. Handing setIcons the whole
  // icons.json ({_schema_version, _meta, icons}) yields a map with no icon
  // entries, and renderIcon returns '' for an unknown slug without throwing,
  // so every glyph would blank silently. Pin the shape so a "defensive"
  // fallback cannot be reintroduced.
  var sample = Object.keys(renderer.icons)[0];
  assert.ok(sample, "icon map is empty");
  assert.ok(
    renderer.icons[sample].viewBox && renderer.icons[sample].body,
    "icon entries must carry viewBox + body; got " +
      JSON.stringify(Object.keys(renderer.icons[sample] || {})),
  );
  assert.ok(
    !Object.prototype.hasOwnProperty.call(renderer.icons, "_meta"),
    "icon map still has the file wrapper's _meta key, so the whole file was " +
      "passed instead of the inner .icons map",
  );
});

// THE GATE for graphics, mirroring the icon gate above. Without the
// injection, renderGraphic() returns '' for every slug (same silent-blank
// contract as renderIcon), and empty-state "works" (still emits its
// container, headline, body, and buttons) with no error anywhere else in
// the suite.
test("graphics are injected: empty-state emits real artwork path geometry", function () {
  var html = render("empty-state", firstCell("empty-state"));
  assertNotGracefulChip(html, "empty-state");
  assert.match(html, /class="ds-graphic"/, "no ds-graphic svg in the output");
  var paths = html.match(/ d="M[^"]{20,}"/g) || [];
  assert.ok(
    paths.length > 0,
    "no substantial svg path data in the output: the illustration degraded " +
      "to blank, which means the setGraphics injection is not wired",
  );
});

test("the graphics map is non-empty and matches the vendored source", function () {
  var count = Object.keys(renderer.graphics).length;
  assert.ok(count > 0, "expected a populated graphics map, got " + count);
});

test("the graphics map is the inner .graphics, not the whole file", function () {
  // Guards the shape assertion in renderer.js, same reasoning as the icon
  // counterpart above: passing the whole graphics.json ({_schema_version,
  // _meta, graphics}) yields a map with no graphic entries, and
  // renderGraphic returns '' for an unknown slug without throwing, so every
  // graphic would blank silently.
  var sample = Object.keys(renderer.graphics)[0];
  assert.ok(sample, "graphics map is empty");
  assert.ok(
    renderer.graphics[sample].viewBox && renderer.graphics[sample].body,
    "graphics entries must carry viewBox + body; got " +
      JSON.stringify(Object.keys(renderer.graphics[sample] || {})),
  );
  assert.ok(
    !Object.prototype.hasOwnProperty.call(renderer.graphics, "_meta"),
    "graphics map still has the file wrapper's _meta key, so the whole " +
      "file was passed instead of the inner .graphics map",
  );
});

// The anatomy counterpart of the icon gate, and the one that actually bit.
// The vendored anatomy modules degrade lib/paths to null and their fs read is
// try/catch'd, so without an injected loader EVERY slug returns null, which
// reads as "this component has no anatomy" and renders a blank box. Honest in
// knowledge, a lie in the plugin, where the anatomy is right there in vendor/.
test("anatomy is injected: a known slug loads a real doc", function () {
  var doc = renderer.anatomyLoader("button");
  assert.ok(doc, "anatomyLoader returned null for button");
  assert.ok(doc.root, "button anatomy has no root node");
});

test("loadAnatomy defaults to the bound loader, no argument required", function () {
  var doc = renderer.anatomyRender.loadAnatomy("button");
  assert.ok(
    doc && doc.root,
    "loadAnatomy('button') returned null: the loader is not bound, so every " +
      "anatomy-driven render would silently degrade to a blank box",
  );
});

test("buildDsAnatomyDocMap defaults the loader too", function () {
  // It serves the ANATOMY tier, so it deliberately skips BUILT slugs (those
  // have a hand-written renderer case). Feed it non-built slugs, chosen from
  // the vendor tree rather than hardcoded so the test cannot rot.
  var built = {};
  renderer.dsHtmlMap.BUILT_SLUGS.forEach(function (s) {
    built[s] = true;
  });
  var anatomyDir = path.dirname(PATHS.components.anatomy.byKey("button"));
  var candidates = fs
    .readdirSync(anatomyDir)
    .filter(function (f) {
      return f.endsWith(".json");
    })
    .map(function (f) {
      return f.replace(/\.json$/, "");
    })
    .filter(function (slug) {
      return !built[slug];
    });
  assert.ok(candidates.length, "no non-built slugs with anatomy to test");

  var map = renderer.dsAnatomyMap.buildDsAnatomyDocMap(candidates);
  assert.ok(
    Object.keys(map).length > 0,
    "buildDsAnatomyDocMap returned an EMPTY map for " +
      candidates.length +
      " non-built slugs: opts.anatomyLoader is not defaulted, so every " +
      "anatomy-tier component would render as a blank box",
  );
});

test("an explicitly passed loader still wins over the bound default", function () {
  var sentinel = { root: { name: "SENTINEL" } };
  var doc = renderer.anatomyRender.loadAnatomy("button", function () {
    return sentinel;
  });
  assert.equal(doc, sentinel, "explicit loader must not be overridden");
});
