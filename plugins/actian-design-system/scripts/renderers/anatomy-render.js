#!/usr/bin/env node
"use strict";
// Token-injection substrate (path b): resolves DS anatomy + the vendored
// token-bindings sidecar into inline `property:var(--zen-*)` declarations for
// a delegated slug's root node, so a hand-authored template can be injected
// with the harvested variant-correct token (see resolveRootTokenStyle, and
// its consumer ds-anatomy-map.js's buildDsVariantStyleMap). NOT for client
// runtime — resolution happens at assemble-time.
//
// The former slug→html anatomy-tree renderer (renderAnatomy/renderNode/
// tokenDecls — "path c") was retired in Group C: it is superseded by
// appearance-render.js's captured-appearance renderer (Phase 1B). This file
// now only carries the token-bindings JOIN mechanism the retired renderer
// used internally, which path b still depends on.
//
// Token facts: each anatomy node's Figma `id` is joined against the vendored
// token-bindings sidecar (components/dist/token-bindings/<slug>.json,
// byNodeId → [{property, token, grade}]) and emitted as inline
// `property:var(--zen-*)` declarations. Sidecars only carry own-nodes —
// instance internals are excluded at harvest time, so instance nodes never
// match.
var fs = require("fs");
var path = require("path");
var PATHS = require(path.join(__dirname, "..", "lib", "paths.js"));

function loadAnatomy(slug, loader) {
  if (typeof loader === "function") return loader(slug);
  try {
    return JSON.parse(
      fs.readFileSync(PATHS.components.anatomy.byKey(slug), "utf8"),
    );
  } catch (e) {
    return null;
  }
}
// Returns the sidecar { byNodeId, variantDefaults } from the vendored sidecar,
// or null when the slug has none.
// Sidecars are registered as per-slug manifest entries
// (components.tokenBindings.<slug>), so the PATHS node is a plain
// slug → absolute-path object — no byKey collection (yet).
function loadTokenBindings(slug, loader) {
  if (typeof loader === "function") return loader(slug);
  try {
    var p =
      PATHS.components.tokenBindings && PATHS.components.tokenBindings[slug];
    if (typeof p !== "string") return null;
    var doc = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!doc || typeof doc !== "object" || !doc.byNodeId) return null;
    return {
      byNodeId: doc.byNodeId,
      variantDefaults: doc.variantDefaults || null,
    };
  } catch (e) {
    return null;
  }
}
// Shape guards on the sidecar entries (the vendored files are
// schema-validated upstream, but the loader is injectable).
var PROP_RE = /^[a-z][a-z-]*$/;
var TOKEN_RE = /^--[a-zA-Z0-9-]+$/;
// Pick one binding for a property group given a target variant.
// Precedence: scoped match > variantDefaults-scoped > unscoped > last.
function pickBinding(cands, targetVariant, variantDefaults) {
  var unscoped = null,
    matched = null,
    defaulted = null;
  for (var i = 0; i < cands.length; i++) {
    var b = cands[i];
    var v = b.variant;
    if (!v || !v.prop || !Array.isArray(v.values)) {
      if (!unscoped) unscoped = b;
      continue;
    }
    var target = targetVariant ? targetVariant[v.prop] : undefined;
    if (target != null && v.values.indexOf(target) !== -1 && !matched)
      matched = b;
    var dv = variantDefaults ? variantDefaults[v.prop] : undefined;
    if (dv != null && v.values.indexOf(dv) !== -1 && !defaulted) defaulted = b;
  }
  return matched || defaulted || unscoped || cands[cands.length - 1];
}

// Resolve the inline token declarations for one node's binding list.
// No targetVariant -> emit every valid binding in order (current behavior).
// With a targetVariant -> emit one decl per property via pickBinding.
function resolveTokenDecls(list, targetVariant, variantDefaults) {
  if (!Array.isArray(list)) return [];
  var valid = list.filter(function (b) {
    return (
      b &&
      typeof b === "object" &&
      PROP_RE.test(String(b.property || "")) &&
      TOKEN_RE.test(String(b.token || ""))
    );
  });
  if (!targetVariant) {
    return valid.map(function (b) {
      return b.property + ":var(" + b.token + ")";
    });
  }
  var byProp = {},
    order = [];
  valid.forEach(function (b) {
    if (!Object.prototype.hasOwnProperty.call(byProp, b.property)) {
      byProp[b.property] = [];
      order.push(b.property);
    }
    byProp[b.property].push(b);
  });
  var decls = [];
  order.forEach(function (prop) {
    var chosen = pickBinding(byProp[prop], targetVariant, variantDefaults);
    if (chosen) decls.push(prop + ":var(" + chosen.token + ")");
  });
  return decls;
}

// Resolve the anatomy ROOT node's variant token declarations to an inline CSS
// style string, for token-injection into a hand-authored template. Returns ""
// when there is no anatomy, quality is below minRatio, there is no sidecar, or
// the root has no resolvable bindings.
function resolveRootTokenStyle(dsSlug, opts) {
  opts = opts || {};
  var minRatio = typeof opts.minRatio === "number" ? opts.minRatio : 0.6;
  var data = loadAnatomy(dsSlug, opts.loader);
  if (!data || !data.root || typeof data.root !== "object") return "";
  var ratio =
    data.quality && typeof data.quality.ratio === "number"
      ? data.quality.ratio
      : 0;
  if (ratio < minRatio) return "";
  var bindings = loadTokenBindings(dsSlug, opts.bindingsLoader);
  if (!bindings || !bindings.byNodeId) return "";
  var decls = resolveTokenDecls(
    bindings.byNodeId[data.root.id],
    opts.variant || null,
    bindings.variantDefaults || null,
  );
  return decls.join(";");
}

module.exports = {
  loadAnatomy: loadAnatomy,
  loadTokenBindings: loadTokenBindings,
  resolveTokenDecls: resolveTokenDecls,
  resolveRootTokenStyle: resolveRootTokenStyle,
};
