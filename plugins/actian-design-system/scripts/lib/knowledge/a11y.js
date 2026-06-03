"use strict";

/**
 * knowledge/a11y.js — first member of the plugin's consumer-side knowledge layer.
 *
 * Resolves a component's linked WCAG criteria: the union of its own
 * meta.a11y_refs (component-pattern tier) and its category's foundation
 * a11y_refs.requirementRefs, resolved against the substrate a11y-index,
 * deduped, grouped by provenance ("This component" / "Inherited from category"),
 * render-agnostic. Reuses the substrate resolver in
 * transformers/category-defaults-loader.js. See ./README.md for the contract.
 */

var fs = require("fs");
var PATHS = require("../paths");
var catLoader = require("../../transformers/category-defaults-loader");

// Map a resolved a11y-index entry -> a render-agnostic Criterion.
function toCriterion(entry, note) {
  if (!entry) return null;
  var c = {
    slug: entry.slug,
    title: entry.title || entry.slug,
    wcag: Array.isArray(entry.wcag) ? entry.wcag : [],
    tier: entry.tier || null,
  };
  if (entry.body_excerpt) c.excerpt = entry.body_excerpt;
  if (note) c.note = note;
  return c;
}

// Normalize a raw [{ref, note?}] list, dropping malformed entries.
function refList(raw) {
  if (!Array.isArray(raw)) return [];
  var out = [];
  for (var i = 0; i < raw.length; i++) {
    var r = raw[i];
    if (r && typeof r.ref === "string" && r.ref) {
      out.push({
        ref: r.ref,
        note: typeof r.note === "string" ? r.note : null,
      });
    }
  }
  return out;
}

// Pure core: given an already-loaded guideline doc + category defaults, return
// grouped/deduped/resolved criteria. Component group wins on dedupe.
function resolveLinkedCriteria(guidelinesJson, categoryDefaults) {
  var componentRefs = refList(
    guidelinesJson && guidelinesJson.meta && guidelinesJson.meta.a11y_refs,
  );
  var categoryRefs = refList(
    categoryDefaults &&
      categoryDefaults.a11y_refs &&
      categoryDefaults.a11y_refs.requirementRefs,
  );

  var seen = {};
  var component = [];
  for (var i = 0; i < componentRefs.length; i++) {
    var s = componentRefs[i].ref;
    if (seen[s]) continue;
    var crit = toCriterion(
      catLoader.resolveAccessibilityRef(s),
      componentRefs[i].note,
    );
    if (crit) {
      component.push(crit);
      seen[s] = true;
    }
  }

  var inherited = [];
  for (var j = 0; j < categoryRefs.length; j++) {
    var cs = categoryRefs[j].ref;
    if (seen[cs]) continue; // component group wins
    var ccrit = toCriterion(
      catLoader.resolveAccessibilityRef(cs),
      categoryRefs[j].note,
    );
    if (ccrit) {
      inherited.push(ccrit);
      seen[cs] = true;
    }
  }

  return {
    component: component,
    inherited: inherited,
    resolved: component.length > 0 || inherited.length > 0,
  };
}

// --- load-by-slug helpers (the standalone / CLI / companion path) ---

function _loadComponentsMap(pathStr) {
  if (!pathStr || !fs.existsSync(pathStr)) return {};
  try {
    return JSON.parse(fs.readFileSync(pathStr, "utf8")).components || {};
  } catch (e) {
    return {};
  }
}

// Resolve a component slug -> categorySlug via the registries (dskit, then fm,
// then meta). The registry is the canonical source of categorySlug (knowledge
// #189) — do NOT slugify the label. null when the slug is in no registry.
function _categorySlugForComponent(slug) {
  var reg = PATHS.components && PATHS.components.registries;
  if (!reg) return null;
  var kits = [reg.dskit, reg.fmkit, reg.metakit];
  for (var i = 0; i < kits.length; i++) {
    var comps = _loadComponentsMap(kits[i]);
    if (comps[slug] && typeof comps[slug].categorySlug === "string") {
      return comps[slug].categorySlug;
    }
  }
  return null;
}

function _loadGuidelineDoc(slug) {
  var byKey =
    PATHS.components &&
    PATHS.components.guidelineDoc &&
    PATHS.components.guidelineDoc.byKey;
  var p = typeof byKey === "function" ? byKey(slug) : null;
  if (!p || !fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

// Resolve linked criteria for a component. opts.{guidelinesJson, categoryDefaults}
// let a caller (e.g. component-brief) pass already-loaded data; otherwise load
// by slug. Graceful throughout — unknown slug -> { ..., resolved: false }.
function linkedCriteriaForComponent(slug, opts) {
  opts = opts || {};
  var guidelinesJson = Object.prototype.hasOwnProperty.call(
    opts,
    "guidelinesJson",
  )
    ? opts.guidelinesJson
    : _loadGuidelineDoc(slug);
  var categoryDefaults;
  if (Object.prototype.hasOwnProperty.call(opts, "categoryDefaults")) {
    categoryDefaults = opts.categoryDefaults;
  } else {
    var catSlug = _categorySlugForComponent(slug);
    categoryDefaults = catSlug
      ? catLoader.loadDefaultsForCategory(catSlug)
      : null;
  }
  return resolveLinkedCriteria(guidelinesJson, categoryDefaults);
}

// Category-level query (the "behavior/category" question): inherited only.
function linkedCriteriaForCategory(categorySlug) {
  var defaults = categorySlug
    ? catLoader.loadDefaultsForCategory(categorySlug)
    : null;
  var res = resolveLinkedCriteria(null, defaults);
  return { inherited: res.inherited, resolved: res.inherited.length > 0 };
}

module.exports = {
  toCriterion: toCriterion,
  resolveLinkedCriteria: resolveLinkedCriteria,
  linkedCriteriaForComponent: linkedCriteriaForComponent,
  linkedCriteriaForCategory: linkedCriteriaForCategory,
};

// CLI: node a11y.js <componentSlug>  |  node a11y.js --category=<categorySlug>
if (require.main === module) {
  var arg = process.argv[2];
  if (!arg) {
    console.error(
      "usage: node a11y.js <componentSlug> | --category=<categorySlug>",
    );
    process.exit(2);
  }
  var out =
    arg.indexOf("--category=") === 0
      ? linkedCriteriaForCategory(arg.slice("--category=".length))
      : linkedCriteriaForComponent(arg);
  console.log(JSON.stringify(out, null, 2));
}
