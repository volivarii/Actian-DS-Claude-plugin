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
  throw new Error("not implemented");
}

function tokenTagDimensions(text, fontMetrics) {
  throw new Error("not implemented");
}

module.exports = {
  tokenTagSpec,
  tokenTagDimensions,
};
