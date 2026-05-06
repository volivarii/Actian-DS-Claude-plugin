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
  var slots = [];
  var nextY = 0;
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    var idealY = e.anchorY - entryHeight / 2;
    var slotY = Math.max(nextY, idealY);
    if (slotY < 0) slotY = 0;
    slots.push({ slotY: slotY, anchorY: e.anchorY });
    nextY = slotY + entryHeight;
  }
  return slots;
}

function buildLeaderPath(
  slotY,
  anchorY,
  gutterWidth,
  gutterGap,
  tickLength,
  pillHeight,
) {
  var labelCenterY = slotY + pillHeight / 2;
  var bendX = gutterWidth + gutterGap;
  var horizontalLine = {
    x: 0,
    y: labelCenterY,
    length: bendX,
    orientation: "horizontal",
  };
  var witnessLine = null;
  var diff = Math.abs(labelCenterY - anchorY);
  if (diff > 2) {
    witnessLine = {
      x: bendX,
      y: Math.min(labelCenterY, anchorY),
      length: diff,
      orientation: "vertical",
    };
  }
  var tick = {
    x: bendX,
    y: anchorY,
    length: tickLength,
    orientation: "horizontal",
  };
  return {
    horizontalLine: horizontalLine,
    witnessLine: witnessLine,
    tick: tick,
  };
}

module.exports = {
  computeGutterSlots,
  buildLeaderPath,
};
