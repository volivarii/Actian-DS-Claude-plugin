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
  if (orientation === "horizontal") return "M 0 0 L " + distance + " 0 Z";
  if (orientation === "vertical") return "M 0 0 L 0 " + distance + " Z";
  throw new Error("Unknown orientation: " + orientation);
}

function endcapPositions(distance, orientation, strokeWeight) {
  var length = strokeWeight + 6;
  if (orientation === "horizontal") {
    return {
      length: length,
      cap1: { x: 0, y: -length / 2, rotation: 90 },
      cap2: { x: distance, y: -length / 2, rotation: 90 },
    };
  }
  if (orientation === "vertical") {
    return {
      length: length,
      cap1: { x: -length / 2, y: 0, rotation: 0 },
      cap2: { x: -length / 2, y: distance, rotation: 0 },
    };
  }
  throw new Error("Unknown orientation: " + orientation);
}

function labelAnchorFor(distance, orientation, labelDimensions) {
  throw new Error("not implemented");
}

module.exports = {
  vectorPathFor,
  endcapPositions,
  labelAnchorFor,
};
