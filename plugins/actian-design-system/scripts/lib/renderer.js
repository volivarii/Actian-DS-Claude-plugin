"use strict";

/**
 * renderer.js — the single accessor for the vendored DS component renderer.
 *
 * Knowledge owns the ONE renderer (components/render/renderer/); the plugin
 * vendors it and requires it directly, the same way scripts/lib/paths.js
 * requires vendor/clients/resolve-paths.js. There is deliberately NO
 * plugin-local copy and therefore no drift-guard: read-only runtime code
 * refreshed on every vendor pull has nothing to drift from, and the plugin's
 * old copy already differed from knowledge's on 4 of 9 files (knowledge moved
 * ahead in relocation phases 1a/1b), so a byte-identity guard could never have
 * been armed.
 *
 * This file is the ONLY place that knows the renderer is vendored. Every
 * consumer goes through it, which keeps
 * tests/integration/no-bare-vendor-paths.test.js satisfied by construction
 * instead of allowlisting a dozen call sites.
 *
 * Renderer relocation phase 2. Spec:
 * docs/superpowers/specs/2026-07-17-renderer-relocation-one-owner-design.md
 */

var fs = require("fs");
var PATHS = require("./paths.js");

function modulePath(relPath) {
  var resolved = PATHS.components.render.renderer(relPath);
  if (!resolved) {
    throw new Error(
      "renderer.js: could not resolve '" +
        relPath +
        "' in the vendored renderer. Either the vendor snapshot predates " +
        "components/render/renderer/ (check vendored.json), or it predates " +
        "the {name}-collection fix in clients/resolve-paths.js, which made " +
        "every lookup on this collection return null.",
    );
  }
  return resolved;
}

var dsHtmlMap = require(modulePath("html-renderers/ds-html-map.js"));
var dsAnatomyMap = require(modulePath("ds-anatomy-map.js"));
var appearanceRender = require(modulePath("appearance-render.js"));
var appearanceStyle = require(modulePath("appearance-style.js"));
var anatomyRender = require(modulePath("anatomy-render.js"));
var matrix = require(modulePath("matrix.js"));

var defaultProps = JSON.parse(
  fs.readFileSync(modulePath("default-props.json"), "utf8"),
);

// --- Icon injection -------------------------------------------------------
// The vendored ds-html-map resolves icons via require("../../lib/paths.js").
// That relative walk was written for the plugin's own scripts/renderers/ tree;
// from the vendored renderer's html-renderers/ directory it lands two levels up
// on a lib/paths.js that has no counterpart in the vendored layout, and the
// require sits inside a try/catch. Without this injection icons render BLANK,
// with no error and no failing test anywhere else in the suite (proven by
// mutation: commenting out the setIcons call below fails exactly one of the
// seven smoke assertions). Knowledge added the setIcons seam in relocation
// phase 1a for exactly this case.
//
// Deliberate deviation from the seam's documented contract: ds-html-map tells
// callers to reset with setIcons(null) after rendering, to avoid leaking state
// between renders. That warning is aimed at knowledge's derive, which renders
// many slugs in one process and injects per-slug maps. The plugin injects ONE
// process-wide map that is the correct answer for every render, and it has no
// lib/paths fallback to fall back to. The injection is permanent by design; do
// not "fix" this by adding a reset, which would blank every icon.
//
// Shape is asserted, NOT defaulted. icons.json is {_schema_version, _meta,
// icons}; the map the renderer wants is the inner .icons. Falling back to the
// whole file on a shape change would hand over an object with no icon entries,
// and renderIcon returns '' for an unknown slug without throwing, so every
// glyph would silently blank. That is the failure this whole task exists to
// prevent, so a wrong shape must be loud. Mirrors knowledge's canonical caller,
// scripts/render/derive-from-renderer.js.
var iconsFile = JSON.parse(fs.readFileSync(PATHS.components.icons.svg, "utf8"));
var icons = iconsFile.icons;
if (!icons || typeof icons !== "object" || Object.keys(icons).length === 0) {
  throw new Error(
    "renderer.js: icons.json has no usable '.icons' map (found keys: " +
      Object.keys(iconsFile).join(", ") +
      "). Passing the wrong shape to setIcons blanks every glyph silently, so " +
      "this fails loudly instead.",
  );
}

if (typeof dsHtmlMap.setIcons !== "function") {
  throw new Error(
    "renderer.js: the vendored ds-html-map has no setIcons seam. The vendor " +
      "snapshot predates renderer-relocation phase 1a; refresh the vendor.",
  );
}
dsHtmlMap.setIcons(icons);

module.exports = {
  dsHtmlMap: dsHtmlMap,
  dsAnatomyMap: dsAnatomyMap,
  appearanceRender: appearanceRender,
  appearanceStyle: appearanceStyle,
  anatomyRender: anatomyRender,
  matrix: matrix,
  defaultProps: defaultProps,
  icons: icons,
  cssPaths: {
    fonts: modulePath("ds-fonts.css"),
    base: modulePath("ds-base.css"),
  },
  modulePath: modulePath,
};
