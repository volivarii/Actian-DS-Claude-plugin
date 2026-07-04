#!/usr/bin/env node
"use strict";

/**
 * ds-anatomy-map.js — Assemble-time helpers that turn a flow's non-override DS
 * slugs into a { slug → structural-HTML } map.
 *
 * Extracted from assemble-preview.js so BOTH the strip renderer (assemble-preview)
 * and the canonical shareable deliverable (assemble-flow-share) can build the map
 * without one renderer depending on the other's CLI module. No side effects at
 * load. Pure functions; substrate reads happen via injectable loaders (defaults
 * read the vendored anatomy + token-bindings sidecars).
 *
 * Token facts come from the per-node sidecar join inside anatomy-render.js
 * (anatomy node id → token-bindings byNodeId). The former root-level
 * guideline domains.tokens read is gone: domains.tokens stays a human doc,
 * the render-grade facts live in components/dist/token-bindings/.
 */

var fs = require("fs");
var path = require("path");
var PATHS = require(path.join(__dirname, "..", "lib", "paths.js"));

var anatomyRender = require("./anatomy-render");
var renderAnatomy = anatomyRender.renderAnatomy;
var resolveRootTokenStyle = anatomyRender.resolveRootTokenStyle;
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
 * Build the anatomy map { slug → htmlString } for all non-override DS slugs.
 *
 * @param {string[]} slugs - candidate slug list (typically from collectDsSlugs)
 * @param {object}   opts
 *   opts.builtSlugs          - override list (default: BUILT_SLUGS from ds-html-map.js)
 *   opts.anatomyLoader       - injectable loader(slug) for anatomy JSON (default: fs read)
 *   opts.tokenBindingsLoader - injectable loader(slug) → the sidecar doc
 *                              { byNodeId: { nodeId: [...] }, variantDefaults }
 *                              (default: fs read of the vendored token-bindings sidecar)
 * @returns {{ [slug: string]: string }}
 */
function buildDsAnatomyMap(slugs, opts) {
  opts = opts || {};
  // Default builtSlugs: load from the renderer to keep it as single source of truth
  var builtSlugs = Array.isArray(opts.builtSlugs)
    ? opts.builtSlugs
    : require("./html-renderers/ds-html-map.js").BUILT_SLUGS;
  var builtSet = {};
  for (var b = 0; b < builtSlugs.length; b++) builtSet[builtSlugs[b]] = true;

  var map = {};
  for (var i = 0; i < slugs.length; i++) {
    var slug = slugs[i];
    // Override slugs have hand-authored HTML leaves — skip them
    if (builtSet[slug]) continue;

    var html = renderAnatomy(slug, {
      loader: opts.anatomyLoader,
      bindingsLoader: opts.tokenBindingsLoader,
    });

    // Drop nulls (quality too low, missing root, or no anatomy file)
    if (html) map[slug] = html;
  }

  return map;
}

/**
 * Build the anatomy DOC map { slug → anatomyDoc } for all non-override DS
 * slugs — unlike buildDsAnatomyMap (which renders each doc straight to an
 * HTML string), this keeps the parsed doc itself so callers can drive the
 * appearance-aware render seam (Phase 1B) with the raw tree.
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
    // R2: quality-ratio floor, mirroring the legacy anatomy-render path
    // (minRatio 0.6). Low-normalization docs (e.g. freeform diagrams,
    // connecting lines) render garbled from their washed-out geometry, so
    // skip them here and let the seam fall through to gracefulChip(). Only a
    // NUMERIC ratio below the floor is skipped: docs with no quality/ratio
    // field are kept (synthetic/hand-built docs carry none).
    if (
      doc.quality &&
      typeof doc.quality.ratio === "number" &&
      doc.quality.ratio < 0.6
    )
      continue;
    map[slug] = doc;
  }
  return map;
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
    var style = resolveRootTokenStyle(pair.slug, {
      variant: pair.variant,
      loader: opts.anatomyLoader,
      bindingsLoader: opts.tokenBindingsLoader,
    });
    if (style) map[anatomyVariantKey(pair.slug, pair.variant)] = style;
  }
  return map;
}

module.exports = {
  collectDsSlugs: collectDsSlugs,
  collectDsSlugVariants: collectDsSlugVariants,
  buildDsAnatomyMap: buildDsAnatomyMap,
  buildDsAnatomyDocMap: buildDsAnatomyDocMap,
  buildDsVariantStyleMap: buildDsVariantStyleMap,
};
