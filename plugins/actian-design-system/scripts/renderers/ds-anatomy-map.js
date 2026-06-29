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
 * read the vendored anatomy + guideline docs).
 */

var fs = require("fs");
var PATHS = require("../lib/paths");
var renderAnatomy = require("./anatomy-render").renderAnatomy;
var bindTokens = require("./ds-token-binding").bindTokens;

/**
 * Collect every unique dsSlug from a flow data tree (screens → content → nodes).
 * Returns a deduplicated array of slug strings.
 */
function collectDsSlugs(data) {
  var seen = {};
  var slugs = [];
  function walk(nodes) {
    if (!Array.isArray(nodes)) return;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n || typeof n !== "object") continue;
      if (typeof n.dsSlug === "string" && n.dsSlug && !seen[n.dsSlug]) {
        seen[n.dsSlug] = true;
        slugs.push(n.dsSlug);
      }
      if (Array.isArray(n.children)) walk(n.children);
      if (Array.isArray(n.nodes)) walk(n.nodes);
    }
  }
  var screens = (data && data.screens) || [];
  for (var s = 0; s < screens.length; s++) {
    walk((screens[s] && screens[s].content) || []);
  }
  return slugs;
}

/**
 * Build the anatomy map { slug → htmlString } for all non-override DS slugs.
 *
 * @param {string[]} slugs - candidate slug list (typically from collectDsSlugs)
 * @param {object}   opts
 *   opts.builtSlugs          - override list (default: BUILT_SLUGS from ds-html-map.js)
 *   opts.anatomyLoader       - injectable loader(slug) for anatomy JSON (default: fs read)
 *   opts.tokenBindingsLoader - injectable loader(slug) → [{token,context}] (default: fs read)
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

    // Read token bindings for this slug
    var tokenBindings = [];
    if (typeof opts.tokenBindingsLoader === "function") {
      tokenBindings = opts.tokenBindingsLoader(slug) || [];
    } else {
      try {
        var guidelineDoc = JSON.parse(
          fs.readFileSync(PATHS.components.guidelineDoc.byKey(slug), "utf8"),
        );
        var domains = (guidelineDoc && guidelineDoc.domains) || {};
        tokenBindings = (domains.tokens && domains.tokens.bindings) || [];
      } catch (e) {
        tokenBindings = [];
      }
    }

    // Build binding context from token bindings
    var binding = bindTokens(slug, { tokenBindings: tokenBindings });

    // Render anatomy with binding applied
    var html = renderAnatomy(slug, {
      loader: opts.anatomyLoader,
      binding: binding,
    });

    // Drop nulls (quality too low, missing root, or no anatomy file)
    if (html) map[slug] = html;
  }
  return map;
}

module.exports = {
  collectDsSlugs: collectDsSlugs,
  buildDsAnatomyMap: buildDsAnatomyMap,
};
