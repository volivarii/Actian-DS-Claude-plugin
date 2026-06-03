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
      out.push({ ref: r.ref, note: typeof r.note === "string" ? r.note : null });
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
    var crit = toCriterion(catLoader.resolveAccessibilityRef(s), componentRefs[i].note);
    if (crit) {
      component.push(crit);
      seen[s] = true;
    }
  }

  var inherited = [];
  for (var j = 0; j < categoryRefs.length; j++) {
    var cs = categoryRefs[j].ref;
    if (seen[cs]) continue; // component group wins
    var ccrit = toCriterion(catLoader.resolveAccessibilityRef(cs), categoryRefs[j].note);
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

module.exports = {
  toCriterion: toCriterion,
  resolveLinkedCriteria: resolveLinkedCriteria,
};
