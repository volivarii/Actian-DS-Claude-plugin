#!/usr/bin/env node
"use strict";
// Token/state binding seam. Maps registry variant axes → state classes and
// guideline domains.tokens bindings → CSS custom-property assignments. The
// enrichment point for a future Figma-MCP / Zen·zng-ui token/state harvest.
function bindTokens(dsSlug, ctx) {
  var out = { classes: [], cssVars: {} };
  if (!ctx || typeof ctx !== "object") return out;
  var v = ctx.variants;
  if (v && typeof v === "object") {
    Object.keys(v).forEach(function (axis) {
      var val = v[axis];
      if (typeof val === "string" && val) {
        out.classes.push("ds--" + axis.toLowerCase() + "-" + String(val).toLowerCase().replace(/\s+/g, "-"));
      }
    });
  }
  var tb = ctx.tokenBindings;
  if (Array.isArray(tb)) {
    tb.forEach(function (b) {
      if (b && typeof b.token === "string" && typeof b.context === "string") {
        out.cssVars[b.context] = "var(" + b.token + ")";
      }
    });
  }
  return out;
}
module.exports = { bindTokens: bindTokens };
