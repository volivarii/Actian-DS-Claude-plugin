"use strict";

/**
 * Pure decision functions for the Token Tag pill style used across the brief.
 * Used by component-brief Pattern 14 (Specs Redline) labels AND by Pattern 3
 * (Table) cells + Pattern 4 (Color Swatch) labels wherever a --zen-* token
 * name appears.
 *
 * The push-pattern code in references/component-brief/push-patterns.md inlines
 * this logic for Figma sandbox execution; this module exists for unit testing.
 */

var TOKEN_TAG_PADDING_X = 5;
var TOKEN_TAG_PADDING_Y = 2;

function tokenTagSpec(text) {
  return {
    text: text,
    bgColor: { r: 0.941, g: 0.949, b: 0.984 }, // ~#F0F2FA — light blue tint
    fgColor: { r: 0.02, g: 0.314, b: 0.863 }, // ~#0550DC — primary blue
    fontName: { family: "Inter", style: "Medium" },
    fontSize: 12,
    paddingX: TOKEN_TAG_PADDING_X,
    paddingY: TOKEN_TAG_PADDING_Y,
    cornerRadius: 3,
  };
}

/**
 * Heuristic estimator — uses fontMetrics.avgCharWidth × text.length, NOT
 * Figma's actual glyph metrics. Use for layout planning only; for precise
 * sizing, create the actual text node and read .width/.height after Figma
 * has rendered it.
 */
function tokenTagDimensions(text, fontMetrics) {
  var width =
    (text || "").length * fontMetrics.avgCharWidth + 2 * TOKEN_TAG_PADDING_X;
  var height = fontMetrics.lineHeight + 2 * TOKEN_TAG_PADDING_Y;
  return { width: width, height: height };
}

module.exports = {
  tokenTagSpec,
  tokenTagDimensions,
};
