/**
 * The design system's component inventory, as one set of slugs.
 *
 * A proposal's drawings are meant to be composed from components that exist. Nothing
 * enforced that until 2026-09-14, and the failure mode it allowed is quiet: a drawing
 * invents a label, a summary row and a small table, renders beautifully, and the design
 * lead is the first mechanism that notices the design system was never in the room.
 *
 * So an option declares what it composes from (`uses`) or what it adds (`adds`), and the
 * validator resolves both against this list. The list is the vendored anatomy bundle, which
 * is the same snapshot every other consumer reads; it is never a hand-kept copy, because a
 * hand-kept copy of a registry drifts and then vouches for components that no longer exist.
 *
 * Read lazily and cached: the bundle is large and most runs never need it.
 */
"use strict";

var fs = require("fs");
var PATHS = require("./paths");

var cache = null;

function bundlePath() {
  return PATHS.components && PATHS.components.anatomy && PATHS.components.anatomy.bundle;
}

/**
 * Every component slug the vendored snapshot knows, as { slug: true }.
 * Returns null when the snapshot is absent, which callers must treat as "cannot check"
 * rather than as "nothing exists": a missing snapshot failing every slug would turn one
 * vendoring problem into a document full of P0s naming real components.
 */
function componentSlugs() {
  if (cache !== null) return cache;
  var p = bundlePath();
  if (!p || !fs.existsSync(p)) {
    cache = false;
    return null;
  }
  var raw = JSON.parse(fs.readFileSync(p, "utf8"));
  var list = raw && raw.components;
  var slugs = Object.create(null);
  if (Array.isArray(list)) {
    list.forEach(function (c) {
      var s = c && (c.slug || c.name);
      if (s) slugs[s] = true;
    });
  } else if (list && typeof list === "object") {
    Object.keys(list).forEach(function (k) { slugs[k] = true; });
  }
  cache = Object.keys(slugs).length ? slugs : false;
  return cache || null;
}

/** Sorted slugs, for a finding that has to suggest what the author meant. */
function componentList() {
  var s = componentSlugs();
  return s ? Object.keys(s).sort() : [];
}

module.exports = { componentSlugs: componentSlugs, componentList: componentList };
