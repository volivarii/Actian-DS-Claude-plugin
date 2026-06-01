"use strict";

/**
 * category-defaults-loader.js
 *
 * Phase 2c (knowledge v0.4.5+ / v0.5.0+): loads per-category structural
 * defaults for component briefs and resolves cross-domain refs (motion +
 * accessibility) against the vendored knowledge layer.
 *
 * The category-defaults artifacts (one JSON per category at
 * vendor/components/dist/categories/<slug>-defaults.json) carry coarse
 * anatomy + variants + motion_refs + a11y_refs refs that apply to
 * every component in the category. Stub components with no curated
 * guidelines lift these into the brief grounding payload via
 * brief-sourcing.js, giving Phase B card-generators a baseline to adapt
 * rather than improvise from scratch.
 *
 * Refs are resolved by SLUG via the substrate's build-time `bySlug` index
 * (knowledge #188): motion.json and a11y-index.json each carry a top-level
 * `bySlug` map (slug → entry) so this loader reads O(1) rather than
 * scanning by `.slug`. Upstream motion patterns are keyed by short name
 * (`drawer`) but carry a separate slug (`drawer-open-close`); category MDs
 * reference the slug, and `bySlug` is keyed by that slug. Unresolved refs
 * return null gracefully so an upstream slug rename doesn't crash brief
 * generation.
 *
 * Module is pure (no MCP, no network). Reads vendor files via the PATHS
 * resolver from scripts/lib/paths.js.
 */

var fs = require("fs");
var path = require("path");
var PATHS = require("../lib/paths");

// In-process caches. Plugin processes are short-lived (one per skill
// invocation), so cache lifetime is the process. Tests call _resetCache.
var categoryCache = {};
var motionBySlugCache = null;
var a11yIndexCache = null;

function _resetCache() {
  categoryCache = {};
  motionBySlugCache = null;
  a11yIndexCache = null;
}

// Load the category-defaults artifact for a category. Takes the dskit
// registry's canonical `entry.categorySlug` (= slugify(category), emitted
// by the substrate — knowledge #189) and uses it verbatim. The plugin no
// longer re-derives the slug from a category label: the registry is the
// single source of the slug (Move 3). Returns null for null/empty input
// or an unknown slug (graceful — no curated defaults for that category).
function loadDefaultsForCategory(categorySlug) {
  if (categorySlug == null) return null;
  var slug = String(categorySlug).trim();
  if (slug.length === 0) return null;
  if (Object.prototype.hasOwnProperty.call(categoryCache, slug)) {
    return categoryCache[slug];
  }
  // Knowledge v0.5.1 renamed the collection: PATHS.components.categoryDefaults.byKey
  // is a (slug) => path function. (Pre-v0.5.1 was PATHS.components.categoryDefaults
  // — collection collided with sibling per-category leaf paths under the same
  // namespace; renamed for leaf-XOR-namespace compliance.)
  var distPath;
  if (
    PATHS.components &&
    PATHS.components.categoryDefaults &&
    typeof PATHS.components.categoryDefaults.byKey === "function"
  ) {
    distPath = PATHS.components.categoryDefaults.byKey(slug);
  } else {
    categoryCache[slug] = null;
    return null;
  }
  if (!fs.existsSync(distPath)) {
    categoryCache[slug] = null;
    return null;
  }
  try {
    var data = JSON.parse(fs.readFileSync(distPath, "utf8"));
    categoryCache[slug] = data;
    return data;
  } catch (err) {
    throw new Error(
      "category-defaults-loader: failed to parse " +
        distPath +
        ": " +
        err.message,
    );
  }
}

// Motion patterns live in vendor/foundations/dist/tokens/motion.json
// under `.patterns`. This file is covered by the foundations.leaf
// recursive collection in the manifest but isn't exposed as a named
// leaf — construct the path from PATHS.vendor.
function _motionPath() {
  return path.join(PATHS.foundations.distDir, "tokens", "motion.json");
}

function _loadMotionBySlug() {
  if (motionBySlugCache !== null) return motionBySlugCache;
  var motionPath = _motionPath();
  if (!fs.existsSync(motionPath)) {
    motionBySlugCache = {};
    return motionBySlugCache;
  }
  var data;
  try {
    data = JSON.parse(fs.readFileSync(motionPath, "utf8"));
  } catch (err) {
    throw new Error(
      "category-defaults-loader: failed to parse " +
        motionPath +
        ": " +
        err.message,
    );
  }
  // Move 2 (knowledge #188): motion.json carries a build-time `bySlug`
  // index (slug → pattern entry), co-derived from `.patterns`. Read it
  // directly — the substrate has already done the slug resolution.
  motionBySlugCache = data.bySlug || {};
  return motionBySlugCache;
}

// Resolve a motion-pattern ref by slug via the substrate's `bySlug` index
// (O(1)). Upstream `.patterns` keys (e.g. `drawer`) can differ from slugs
// (e.g. `drawer-open-close`); `bySlug` is keyed by the slug.
function resolveMotionRef(slug) {
  if (!slug || typeof slug !== "string") return null;
  var bySlug = _loadMotionBySlug();
  return Object.prototype.hasOwnProperty.call(bySlug, slug)
    ? bySlug[slug]
    : null;
}

function _loadA11yIndex() {
  if (a11yIndexCache !== null) return a11yIndexCache;
  // PATHS.accessibility.index is the slug-indexed JSON (a11y-index.json)
  var idxPath;
  if (PATHS.accessibility && typeof PATHS.accessibility.index === "string") {
    idxPath = PATHS.accessibility.index;
  } else {
    a11yIndexCache = { bySlug: {} };
    return a11yIndexCache;
  }
  if (!fs.existsSync(idxPath)) {
    a11yIndexCache = { bySlug: {} };
    return a11yIndexCache;
  }
  try {
    a11yIndexCache = JSON.parse(fs.readFileSync(idxPath, "utf8"));
  } catch (err) {
    throw new Error(
      "category-defaults-loader: failed to parse " +
        idxPath +
        ": " +
        err.message,
    );
  }
  return a11yIndexCache;
}

// Resolve an a11y requirement ref by slug via the substrate's `bySlug`
// index (O(1); knowledge #188), co-derived from `sections[]`.
function resolveAccessibilityRef(slug) {
  if (!slug || typeof slug !== "string") return null;
  var idx = _loadA11yIndex();
  var bySlug = (idx && idx.bySlug) || {};
  return Object.prototype.hasOwnProperty.call(bySlug, slug)
    ? bySlug[slug]
    : null;
}

module.exports = {
  loadDefaultsForCategory: loadDefaultsForCategory,
  resolveMotionRef: resolveMotionRef,
  resolveAccessibilityRef: resolveAccessibilityRef,
  _resetCache: _resetCache,
};
