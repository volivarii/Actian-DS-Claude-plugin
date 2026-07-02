#!/usr/bin/env node
"use strict";
// Assemble-time (Node) interpreter: a DS component's vendored anatomy
// part-tree → structural HTML. Returns null when the slug has no usable
// anatomy so the caller falls back. NOT for client runtime — the result is
// embedded into the deliverable by assemble-preview.js.
//
// Token facts: each anatomy node's Figma `id` is joined against the vendored
// token-bindings sidecar (components/dist/token-bindings/<slug>.json,
// byNodeId → [{property, token, grade}]) and emitted as inline
// `property:var(--zen-*)` declarations. Facts append AFTER the structural
// flex declarations so a bound token (e.g. padding:var(--zen-spacing-sm))
// wins the cascade over the baked px value. Slugs without a sidecar render
// structurally, unchanged. Sidecars only carry own-nodes — instance internals
// are excluded at harvest time, so instance nodes never match.
var fs = require("fs");
var path = require("path");
var PATHS = require(path.join(__dirname, "..", "lib", "paths.js"));

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c];
  });
}
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
// byNodeId map from the vendored sidecar, or null when the slug has none.
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
function mapAlign(v) {
  return (
    {
      center: "center",
      end: "flex-end",
      "flex-end": "flex-end",
      "space-between": "space-between",
      start: "flex-start",
      "flex-start": "flex-start",
    }[v] || "flex-start"
  );
}
function flexStyle(layout) {
  if (!layout || typeof layout !== "object") return "";
  var p = layout.padding || {};
  var parts = [
    "display:flex",
    "flex-direction:" + (layout.axis === "row" ? "row" : "column"),
  ];
  if (layout.gap) parts.push("gap:" + layout.gap);
  parts.push(
    "padding:" +
      [p.top || "0", p.right || "0", p.bottom || "0", p.left || "0"].join(" "),
  );
  var a = layout.align || {};
  if (a.main) parts.push("justify-content:" + mapAlign(a.main));
  if (a.cross) parts.push("align-items:" + mapAlign(a.cross));
  return parts.join(";");
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

function tokenDecls(node, byNodeId, targetVariant, variantDefaults) {
  if (!byNodeId || !node.id) return [];
  return resolveTokenDecls(byNodeId[node.id], targetVariant, variantDefaults);
}
function renderNode(node, byNodeId, targetVariant, variantDefaults) {
  if (!node || typeof node !== "object") return "";
  var kind = node.kind,
    cls = "ds-anatomy__" + (kind || "node");
  var decls = tokenDecls(node, byNodeId, targetVariant, variantDefaults);
  if (kind === "text") {
    var textStyle = decls.length ? ' style="' + esc(decls.join(";")) + '"' : "";
    return (
      '<span class="' +
      cls +
      '"' +
      textStyle +
      ">" +
      esc(node.text || "") +
      "</span>"
    );
  }
  if (kind === "image" || kind === "vector") {
    var leafStyle = decls.length ? ' style="' + esc(decls.join(";")) + '"' : "";
    return (
      '<div class="' + cls + '"' + leafStyle + ' aria-hidden="true"></div>'
    );
  }
  var kids = Array.isArray(node.children)
    ? node.children
        .map(function (c) {
          return renderNode(c, byNodeId, targetVariant, variantDefaults);
        })
        .join("")
    : "";
  var style = flexStyle(node.layout);
  var all = style
    ? decls.length
      ? style + ";" + decls.join(";")
      : style
    : decls.join(";");
  return '<div class="' + cls + '" style="' + esc(all) + '">' + kids + "</div>";
}
function renderAnatomy(dsSlug, opts) {
  if (!dsSlug) return null;
  opts = opts || {};
  var minRatio = typeof opts.minRatio === "number" ? opts.minRatio : 0.6;
  var data = loadAnatomy(dsSlug, opts.loader);
  if (!data || !data.root || typeof data.root !== "object") return null;
  var ratio =
    data.quality && typeof data.quality.ratio === "number"
      ? data.quality.ratio
      : 0;
  if (ratio < minRatio) return null;
  var bindings = loadTokenBindings(dsSlug, opts.bindingsLoader);
  var byNodeId = bindings ? bindings.byNodeId : null;
  var variantDefaults = bindings ? bindings.variantDefaults : null;
  return (
    '<div class="ds-anatomy ds-anatomy--' +
    esc(dsSlug) +
    '" data-ds-slug="' +
    esc(dsSlug) +
    '">' +
    renderNode(data.root, byNodeId, opts.variant || null, variantDefaults) +
    "</div>"
  );
}
module.exports = {
  renderAnatomy: renderAnatomy,
  loadAnatomy: loadAnatomy,
  loadTokenBindings: loadTokenBindings,
  flexStyle: flexStyle,
  resolveTokenDecls: resolveTokenDecls,
};
