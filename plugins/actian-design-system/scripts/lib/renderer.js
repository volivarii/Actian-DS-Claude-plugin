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
var anatomyVariantKey = require(
  modulePath("html-renderers/anatomy-variant-key.js"),
);

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

// --- Anatomy loader injection ---------------------------------------------
// The SAME silent-failure shape as the icon injection above, and the one that
// actually bit during the Task 6 repoint. The vendored anatomy-render.js and
// ds-anatomy-map.js degrade their lib/paths require to `PATHS = null` (phase 1a
// severed the coupling so knowledge, which has no lib/paths, can inject a
// loader instead). Their default fs read is wrapped in try/catch, so a null
// PATHS yields null = "this component has no anatomy" rather than an error.
//
// That is honest in knowledge. In the plugin it is a LIE: lib/paths exists and
// the anatomy is right there in the vendor tree. Left unhandled, every
// anatomy-driven render silently degrades to a blank box, which is what failed
// the flow-share appearance tests and the blank-box budget.
//
// The seams (loadAnatomy's `loader` arg, buildDs*'s opts.anatomyLoader) require
// every call site to remember to pass a loader. Relying on that is how this
// broke in the first place, so bind the loader HERE and let call sites keep
// their existing signatures: correct by default, not by discipline.
function anatomyLoader(slug) {
  try {
    return JSON.parse(
      fs.readFileSync(PATHS.components.anatomy.byKey(slug), "utf8"),
    );
  } catch (e) {
    // Per-slug null is legitimate: not every component has an anatomy doc.
    // A SYSTEMIC failure (wrong root, missing vendor) would null every slug,
    // which the smoke test catches by asserting a known slug loads.
    return null;
  }
}

function withAnatomyLoader(opts) {
  opts = opts || {};
  if (typeof opts.anatomyLoader === "function") return opts;
  var merged = Object.assign({}, opts);
  merged.anatomyLoader = anatomyLoader;
  return merged;
}

// --- appearance-render icon injection -------------------------------------
// Third instance of the same silent class, and the narrowest. appearance-render
// resolves icons INDEPENDENTLY of ds-html-map, via the same dual-source idiom
// whose Node branch cannot resolve from the vendored layout, so its
// module-level `dsIcons` is {} and `dsIconsShadowed` is []. Through phase 2 it
// had per-call seams (opts.iconMap, opts.shadowedSlugs) and NO module-level
// setter, because phase 1a added setIcons to ds-html-map and missed this module.
//
// That matters because ds-html-map's anatomy-tier branch calls
// renderAppearanceComponent(doc, {variant, props}) with NO icon keys, so the
// broken module default is what production gets. Measured across the whole
// anatomy tier: the injection is worth 17 glyphs on 9 of 86 components
// (alert-banner, alert-inline, dropdown-select-default, global-header, popover,
// search, tag-default, tag-interactive, tag-stage). Silent visual loss in the
// server-side deliverable. The empty shadowed list is the inverse risk: a slug
// a component owns could draw a glyph it should not.
//
// Until knowledge v0.34.111 this module had no module-level setter, so the
// plugin wrapped renderAppearanceComponent and defaulted the two opts keys on
// the exports object, labelled a WORKAROUND. Relocation phase 3 added the
// setIcons/setShadowedSlugs seam that ds-html-map got at phase 1a, so that
// wrapper is retired here in favour of the module's own seam. The seam wins
// over the broken module default and still yields to an explicit opts key, so
// the "force the map absent" test branch keeps working.
//
// Permanent by design, for the same reason as the ds-html-map injection above:
// the plugin injects ONE process-wide map that is the correct answer for every
// render, and it has no lib/paths fallback to fall back to. Do not "fix" this
// by adding a reset, which would blank every glyph.
var shadowedSlugs =
  (iconsFile._meta && iconsFile._meta.shadowed_by_component) || [];
if (
  typeof appearanceRender.setIcons !== "function" ||
  typeof appearanceRender.setShadowedSlugs !== "function"
) {
  throw new Error(
    "renderer.js: the vendored appearance-render is missing setIcons and/or " +
      "setShadowedSlugs. The vendor snapshot predates knowledge v0.34.111 " +
      "(renderer-relocation phase 3); refresh the vendor.",
  );
}
appearanceRender.setIcons(icons);
appearanceRender.setShadowedSlugs(shadowedSlugs);

var boundAnatomyRender = Object.assign({}, anatomyRender, {
  loadAnatomy: function (slug, loader) {
    return anatomyRender.loadAnatomy(
      slug,
      typeof loader === "function" ? loader : anatomyLoader,
    );
  },
});

var boundDsAnatomyMap = Object.assign({}, dsAnatomyMap, {
  buildDsAnatomyDocMap: function (slugs, opts) {
    return dsAnatomyMap.buildDsAnatomyDocMap(slugs, withAnatomyLoader(opts));
  },
  buildDsVariantStyleMap: function (data, opts) {
    return dsAnatomyMap.buildDsVariantStyleMap(data, withAnatomyLoader(opts));
  },
});

module.exports = {
  dsHtmlMap: dsHtmlMap,
  dsAnatomyMap: boundDsAnatomyMap,
  appearanceRender: appearanceRender,
  appearanceStyle: appearanceStyle,
  anatomyRender: boundAnatomyRender,
  anatomyLoader: anatomyLoader,
  matrix: matrix,
  anatomyVariantKey: anatomyVariantKey,
  defaultProps: defaultProps,
  icons: icons,
  cssPaths: {
    fonts: modulePath("ds-fonts.css"),
    base: modulePath("ds-base.css"),
  },
  modulePath: modulePath,
};
