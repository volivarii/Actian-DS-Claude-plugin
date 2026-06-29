#!/usr/bin/env node
"use strict";
// Token/state binding seam. Maps registry variant axes → state classes and
// guideline domains.tokens bindings → CSS custom-property assignments. The
// enrichment point for a future Figma-MCP / Zen·zng-ui token/state harvest.
//
// cssVars behaviour: a binding's `context` field must be a recognized CSS
// property (see CSS_PROPS allowlist below) for a var() to be emitted.
// Descriptive contexts (e.g. "Card padding", "Badge fill (error/notification)")
// which represent the current substrate norm are SKIPPED — they produce no
// output and leave `cssVars` empty. This keeps the seam clean and honest: it
// lights up automatically when a render-grade token harvest supplies
// CSS-property contexts instead of human descriptions.
//
// Token resolution: tokens already prefixed with "--" are used as-is inside
// var(); bare tokens (e.g. "color-bg-default") are resolved to the --zen-
// namespace → var(--zen-color-bg-default).

var CSS_PROPS = new Set([
  "background",
  "background-color",
  "color",
  "border-color",
  "border",
  "border-top-color",
  "border-bottom-color",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "gap",
  "row-gap",
  "column-gap",
  "height",
  "min-height",
  "max-height",
  "width",
  "min-width",
  "max-width",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "border-radius",
  "box-shadow",
  "fill",
  "stroke",
  "opacity",
]);

function bindTokens(dsSlug, ctx) {
  var out = { classes: [], cssVars: {} };
  if (!ctx || typeof ctx !== "object") return out;
  var v = ctx.variants;
  if (v && typeof v === "object") {
    Object.keys(v).forEach(function (axis) {
      var val = v[axis];
      if (typeof val === "string" && val) {
        out.classes.push(
          "ds--" +
            axis.toLowerCase() +
            "-" +
            String(val).toLowerCase().replace(/\s+/g, "-"),
        );
      }
    });
  }
  var tb = ctx.tokenBindings;
  if (Array.isArray(tb)) {
    tb.forEach(function (b) {
      if (b && typeof b.token === "string" && typeof b.context === "string") {
        if (!CSS_PROPS.has(b.context)) return; // descriptive context — skip
        var ref =
          b.token.indexOf("--") === 0
            ? "var(" + b.token + ")"
            : "var(--zen-" + b.token + ")";
        out.cssVars[b.context] = ref;
      }
    });
  }
  return out;
}
module.exports = { bindTokens: bindTokens };
