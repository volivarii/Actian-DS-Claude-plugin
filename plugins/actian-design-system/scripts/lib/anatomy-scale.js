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
  if (override !== null && override !== undefined) {
    if (!Number.isInteger(override) || override < 1 || override > 4) {
      throw new Error(
        "Invalid anatomyScale override: " + override + " (must be integer 1-4)",
      );
    }
    return override;
  }
  var smaller = Math.min(width, height);
  for (var scale = 1; scale <= 4; scale++) {
    if (smaller * scale > 80) return scale;
  }
  return 4;
}

module.exports = {
  pickScale,
};
