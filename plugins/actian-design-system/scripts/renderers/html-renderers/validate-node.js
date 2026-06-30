"use strict";

// Tier-agnostic component-node validator. Pure, never throws. Mirrors the
// hand-rolled, error-accumulating style of figma-table/render-figma.js.
// See ./SEAM.md for the contract.

var NODE_TYPES = ["FRAME", "TEXT", "INSTANCE", "RECT", "ELLIPSE", "DIVIDER"];

// The closed key allowlist. Styling/presentation keys (class, style, css) are
// intentionally absent — the discipline rule that keeps the spec target-neutral.
var ALLOWED_KEYS = [
  "type",
  "ref",
  "dsSlug",
  "variant",
  "props",
  "library",
  "children",
  "name",
  "fills",
  "stroke",
  "sizing",
  "layout",
  "padding",
  "cornerRadius",
  "opacity",
  "clipsContent",
  "text",
  "font",
  "size",
  "color",
  "width",
  "height",
  "letterSpacing",
  "lineHeight",
  "textAlign",
  "textCase",
  "primaryAxisAlignItems",
  "counterAxisAlignItems",
  "counterAxisAlign",
  "sides",
  "contentHtml",
  "content",
  "intent",
];

function validateNode(node) {
  var errors = [];
  if (!node || typeof node !== "object") {
    errors.push({ path: "", message: "node must be an object" });
    return errors;
  }
  if (NODE_TYPES.indexOf(node.type) === -1) {
    errors.push({
      path: "type",
      message: "unknown node type: " + String(node.type),
    });
  }
  if (node.type === "INSTANCE") {
    var hasRef = typeof node.ref === "string" && node.ref;
    var hasDsSlug = typeof node.dsSlug === "string" && node.dsSlug;
    if (!hasRef && !hasDsSlug) {
      errors.push({
        path: "ref",
        message:
          "INSTANCE requires a non-empty string ref (or dsSlug for library:ds nodes)",
      });
    }
  }
  Object.keys(node).forEach(function (k) {
    if (ALLOWED_KEYS.indexOf(k) === -1) {
      errors.push({
        path: k,
        message:
          "unexpected key '" +
          k +
          "' (fidelity vocabulary must live in the interpreter, not the spec)",
      });
    }
  });
  return errors;
}

function validateTree(node, basePath) {
  basePath = basePath || "";
  var errors = validateNode(node).map(function (e) {
    return {
      path: basePath ? basePath + "." + e.path : e.path,
      message: e.message,
    };
  });
  if (node && Array.isArray(node.children)) {
    node.children.forEach(function (child, i) {
      errors = errors.concat(
        validateTree(
          child,
          (basePath ? basePath + "." : "") + "children[" + i + "]",
        ),
      );
    });
  }
  return errors;
}

module.exports = {
  NODE_TYPES: NODE_TYPES,
  ALLOWED_KEYS: ALLOWED_KEYS,
  validateNode: validateNode,
  validateTree: validateTree,
};
