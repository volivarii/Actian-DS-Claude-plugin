"use strict";

/**
 * Pure decision functions for the runtime-primitive dimension annotation used
 * by component-brief Pattern 14 (Specs Redline). Replaces the Meta Kit
 * "Dimension Annotation" component path that was blocked by the Plugin API's
 * resize() limitation on component-instance children (Phase 1 finding).
 *
 * Algorithm mirrors figma-measure (https://github.com/ph1p/figma-measure, MIT)
 * — createVector for the line, two createLine endcaps rotated 90° at each end,
 * label centered above (horizontal) or to the right (vertical).
 *
 * The push-pattern code in references/component-brief/push-patterns.md inlines
 * this logic for Figma sandbox execution; this module exists for unit testing.
 */

function vectorPathFor(distance, orientation) {
  throw new Error("not implemented");
}

function endcapPositions(distance, orientation, strokeWeight) {
  throw new Error("not implemented");
}

function labelAnchorFor(distance, orientation, labelDimensions) {
  throw new Error("not implemented");
}

module.exports = {
  vectorPathFor,
  endcapPositions,
  labelAnchorFor,
};
