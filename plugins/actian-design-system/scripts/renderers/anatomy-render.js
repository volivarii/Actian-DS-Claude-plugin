#!/usr/bin/env node
"use strict";
// Assemble-time (Node) interpreter: a DS component's vendored anatomy
// part-tree → structural HTML. Returns null when the slug has no usable
// anatomy so the caller falls back. NOT for client runtime — the result is
// embedded into the deliverable by assemble-preview.js.
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
function renderNode(node) {
  if (!node || typeof node !== "object") return "";
  var kind = node.kind,
    cls = "ds-anatomy__" + (kind || "node");
  if (kind === "text")
    return '<span class="' + cls + '">' + esc(node.text || "") + "</span>";
  if (kind === "image" || kind === "vector")
    return '<div class="' + cls + '" aria-hidden="true"></div>';
  var kids = Array.isArray(node.children)
    ? node.children.map(renderNode).join("")
    : "";
  return (
    '<div class="' +
    cls +
    '" style="' +
    esc(flexStyle(node.layout)) +
    '">' +
    kids +
    "</div>"
  );
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

  // Base root classes
  var rootClass = "ds-anatomy ds-anatomy--" + esc(dsSlug);

  // Apply opts.binding to root wrapper only
  var binding = opts.binding;
  var styleAttr = "";
  if (binding && typeof binding === "object") {
    // Append binding classes
    if (Array.isArray(binding.classes) && binding.classes.length > 0) {
      rootClass +=
        " " +
        binding.classes
          .map(function (c) {
            return esc(c);
          })
          .join(" ");
    }
    // Build style string from cssVars
    if (binding.cssVars && typeof binding.cssVars === "object") {
      var declarations = Object.keys(binding.cssVars).map(function (k) {
        return k + ":" + binding.cssVars[k];
      });
      if (declarations.length > 0) {
        styleAttr = ' style="' + esc(declarations.join(";")) + '"';
      }
    }
  }

  return (
    '<div class="' +
    rootClass +
    '" data-ds-slug="' +
    esc(dsSlug) +
    '"' +
    styleAttr +
    ">" +
    renderNode(data.root) +
    "</div>"
  );
}
module.exports = {
  renderAnatomy: renderAnatomy,
  loadAnatomy: loadAnatomy,
  flexStyle: flexStyle,
};
