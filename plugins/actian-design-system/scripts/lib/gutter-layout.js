"use strict";

/**
 * Pure decision functions for the left-gutter ordinate lane used by
 * component-brief Pattern 14 (Specs Redline) when a surface has N > 1
 * annotations. Replaces the per-edge placement model from v1.69.0 which
 * produced label-on-component collisions (e.g. Checkbox smoke 2026-05-06).
 *
 * Architecture proven across Zeplin redlines, Carbon Design System anatomy,
 * Material 3 anatomy diagrams, and CAD ordinate dimensioning. Greedy
 * sort-and-stack guarantees zero collisions by construction.
 *
 * The push-pattern code in references/component-brief/push-patterns.md inlines
 * this logic for Figma sandbox execution; this module exists for unit testing.
 */

function computeGutterSlots(entries, entryHeight) {
  throw new Error("not implemented");
}

function buildLeaderPath(slotY, anchorY, gutterWidth, gutterGap, tickLength, pillHeight) {
  throw new Error("not implemented");
}

module.exports = {
  computeGutterSlots,
  buildLeaderPath,
};
