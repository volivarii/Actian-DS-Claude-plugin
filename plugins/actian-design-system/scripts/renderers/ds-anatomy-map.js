#!/usr/bin/env node
"use strict";

/**
 * ds-anatomy-map.js — Assemble-time helpers that turn a flow's non-override DS
 * slugs into a { slug → anatomyDoc } map (buildDsAnatomyDocMap), consumed by
 * the Phase 1B appearance-aware render seam, plus a { compositeKey →
 * inline-style } token-injection map for delegated slugs (buildDsVariantStyleMap).
 *
 * Extracted from assemble-preview.js so BOTH the strip renderer (assemble-preview)
 * and the canonical shareable deliverable (assemble-flow-share) can build the map
 * without one renderer depending on the other's CLI module. No side effects at
 * load. Pure functions; substrate reads happen via injectable loaders (default
 * reads the vendored anatomy).
 *
 * The former buildDsAnatomyMap (slug → pre-rendered HTML, "path c") was
 * retired in Group C: it's superseded by the doc map + appearance-render.js.
 * Task A2 re-sourced buildDsVariantStyleMap's color facts from the appearance
 * layer (resolveNodeAppearance, via the module-local appearanceVariantStyle)
 * instead of the token-bindings sidecar join ("path b", the washout bug's
 * origin: bare var(--token) with no fallback, most unresolved in tokens.css).
 * The default variant's colors equal the base, so it emits no map entry and
 * ds-base.css's `.ds-tag` renders the correct default with no injection.
 */

var fs = require("fs");
var path = require("path");
var PATHS = require(path.join(__dirname, "..", "lib", "paths.js"));

var anatomyRender = require("./anatomy-render");
var loadAnatomy = anatomyRender.loadAnatomy;
var passesRatioGate = anatomyRender.passesRatioGate;
var appearanceRender = require("./appearance-render");
var { variantColorDecls } = require("./appearance-style.js");
var {
  isDelegated,
  anatomyVariantKey,
} = require("./html-renderers/anatomy-variant-key.js");
var parseVariant = require("./html-renderers/ds-html-map.js").parseVariant;

/**
 * Shared recursive tree-walk over a flow data tree (screens → content →
 * nodes), invoking visitFn(node) for every node encountered (pre-order,
 * children before nodes). Both collectors below differ only in what their
 * visitor does with each node.
 */
function walkDsContent(data, visitFn) {
  function walk(nodes) {
    if (!Array.isArray(nodes)) return;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n || typeof n !== "object") continue;
      visitFn(n);
      if (Array.isArray(n.children)) walk(n.children);
      if (Array.isArray(n.nodes)) walk(n.nodes);
    }
  }
  var screens = (data && data.screens) || [];
  for (var s = 0; s < screens.length; s++) {
    walk((screens[s] && screens[s].content) || []);
  }
}

/**
 * Collect every unique dsSlug from a flow data tree (screens → content → nodes).
 * Returns a deduplicated array of slug strings.
 */
function collectDsSlugs(data) {
  var seen = {};
  var slugs = [];
  walkDsContent(data, function (n) {
    if (typeof n.dsSlug === "string" && n.dsSlug && !seen[n.dsSlug]) {
      seen[n.dsSlug] = true;
      slugs.push(n.dsSlug);
    }
  });
  return slugs;
}

/**
 * Collect every unique {slug, variant} pair for DELEGATED dsSlugs (see
 * isDelegated in anatomy-variant-key.js) from a flow data tree (screens →
 * content → nodes). variant is the PARSED object (via ds-html-map's
 * parseVariant), deduped by the same composite key anatomyVariantKey
 * produces, so callers render each distinct pair exactly once.
 */
function collectDsSlugVariants(data) {
  var seen = {};
  var pairs = [];
  walkDsContent(data, function (n) {
    if (typeof n.dsSlug === "string" && isDelegated(n.dsSlug)) {
      var variant = parseVariant(n.variant || "");
      var key = anatomyVariantKey(n.dsSlug, variant);
      if (!seen[key]) {
        seen[key] = true;
        pairs.push({ slug: n.dsSlug, variant: variant });
      }
    }
  });
  return pairs;
}

/**
 * Build the anatomy DOC map { slug → anatomyDoc } for all non-override DS
 * slugs — keeps the parsed doc itself (rather than pre-rendering to an HTML
 * string) so callers can drive the appearance-aware render seam (Phase 1B)
 * with the raw tree.
 *
 * @param {string[]} slugs - candidate slug list (typically from collectDsSlugs)
 * @param {object}   opts
 *   opts.builtSlugs    - override list (default: BUILT_SLUGS from ds-html-map.js)
 *   opts.anatomyLoader - injectable loader(slug) for anatomy JSON (default: fs read)
 * @returns {{ [slug: string]: object }}
 */
function buildDsAnatomyDocMap(slugs, opts) {
  opts = opts || {};
  var builtSlugs = Array.isArray(opts.builtSlugs)
    ? opts.builtSlugs
    : require("./html-renderers/ds-html-map.js").BUILT_SLUGS;
  var builtSet = {};
  for (var b = 0; b < builtSlugs.length; b++) builtSet[builtSlugs[b]] = true;
  var loader =
    typeof opts.anatomyLoader === "function"
      ? opts.anatomyLoader
      : function (slug) {
          try {
            return JSON.parse(
              fs.readFileSync(PATHS.components.anatomy.byKey(slug), "utf8"),
            );
          } catch (e) {
            return null;
          }
        };
  var map = {};
  for (var i = 0; i < slugs.length; i++) {
    var slug = slugs[i];
    if (builtSet[slug]) continue;
    var doc = loader(slug);
    if (!doc || !doc.root || typeof doc.root !== "object") continue;
    // R2: quality-ratio floor, sharing anatomy-render.js's passesRatioGate
    // with keepMissingRatio (minRatio 0.6). Low-normalization docs (e.g.
    // freeform diagrams, connecting lines) render garbled from their
    // washed-out geometry, so skip them here and let the seam fall through
    // to gracefulChip(). Docs with no quality/ratio field are kept
    // (synthetic/hand-built docs carry none).
    var r2Ratio = doc.quality && doc.quality.ratio;
    if (!passesRatioGate(r2Ratio, 0.6, { keepMissingRatio: true })) continue;
    map[slug] = doc;
  }
  return map;
}

// Task A2: re-sourced from the appearance layer (Phase 1B) instead of the
// token-bindings sidecar join (resolveRootTokenStyle, "path b", the washout
// bug's origin: bare var(--token) with no fallback, most unresolved in
// tokens.css). Resolves the root node's appearance for the variant and emits
// ONLY the color-only override (variantColorDecls); the DEFAULT variant's
// colors equal the base, so it returns "" and ds-base.css's `.ds-tag` owns
// the correct default geometry + colors with no injection.
function appearanceVariantStyle(slug, variant, loader) {
  var doc = loadAnatomy(slug, loader);
  if (!doc || !doc.root) return "";
  var base = appearanceRender.resolveNodeAppearance(doc.root, null);
  var res = appearanceRender.resolveNodeAppearance(doc.root, variant);
  if (!res) return "";
  // Default variant: colors equal the base => no override, ds-base.css wins.
  var baseBg = base && base.background;
  var baseBorder = base && base.border && base.border.color;
  var resBg = res.background;
  var resBorder = res.border && res.border.color;
  if (resBg === baseBg && resBorder === baseBorder) return "";
  return variantColorDecls(res).join(";");
}

// Build { anatomyVariantKey(slug, variant) -> inline-style-string } for the
// delegated slugs used in the flow, for token-injection into hand-authored
// templates. Entries with no resolvable root style are omitted.
function buildDsVariantStyleMap(data, opts) {
  opts = opts || {};
  var map = {};
  var pairs = collectDsSlugVariants(data);
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var style = appearanceVariantStyle(
      pair.slug,
      pair.variant,
      opts.anatomyLoader,
    );
    if (style) map[anatomyVariantKey(pair.slug, pair.variant)] = style;
  }
  return map;
}

module.exports = {
  collectDsSlugs: collectDsSlugs,
  collectDsSlugVariants: collectDsSlugVariants,
  buildDsAnatomyDocMap: buildDsAnatomyDocMap,
  buildDsVariantStyleMap: buildDsVariantStyleMap,
};
