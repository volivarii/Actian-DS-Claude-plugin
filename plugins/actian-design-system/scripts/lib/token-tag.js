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

function tokenTagSpec(text) {
  return {
    text: text,
    bgColor: { r: 0.941, g: 0.949, b: 0.984 }, // ~#F0F2FA — light blue tint
    fgColor: { r: 0.02, g: 0.314, b: 0.863 }, // ~#0550DC — primary blue
    fontName: { family: "Inter", style: "Medium" },
    fontSize: 12,
    paddingX: 5,
    paddingY: 2,
    cornerRadius: 3,
  };
}

function tokenTagDimensions(text, fontMetrics) {
  throw new Error("not implemented");
}

module.exports = {
  tokenTagSpec,
  tokenTagDimensions,
};
