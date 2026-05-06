"use strict";

/**
 * Pure decision function for component-brief Pattern 9 (Anatomy Diagram)
 * scale factor selection. Picks the smallest scale from {1, 2, 3, 4} where
 * the smaller axis dimension exceeds 80px, with optional integer override
 * via component-guidelines/<slug>.json `anatomyScale` field.
 *
 * Per cross-DS research (Carbon, Material 3, Polaris): small components
 * (checkbox, radio, toggle) are universally scaled up 2-4x in anatomy
 * diagrams; the scaled instance is a visual copy, the tokens table beside
 * it shows the actual values.
 */

function pickScale(width, height, override) {
  throw new Error("not implemented");
}

module.exports = {
  pickScale,
};
