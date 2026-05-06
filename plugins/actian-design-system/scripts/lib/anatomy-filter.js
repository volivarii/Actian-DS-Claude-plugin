"use strict";

/**
 * Pure decision functions for component-brief Pattern 9 (Anatomy Diagram).
 *
 * filterPartsByLayerExistence — given anatomy parts and the set of layer
 * names actually present in the rendered Enabled-state instance, returns
 * which parts are visible (badges go on the diagram) vs absent (footnoted
 * in the parts table). Implements the cross-DS convention from Carbon /
 * Material 3 / Polaris: state-conditional parts (focus ring, hover surface)
 * never appear on the primary anatomy diagram.
 *
 * pickClosestEdge — closest-edge math with EightShapes left-then-top
 * tiebreaker for badge placement.
 */

function filterPartsByLayerExistence(parts, layerNamesPresent) {
  var visible = [];
  var absent = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    if (layerNamesPresent.has(p.figmaLayerName)) {
      visible.push(p);
    } else {
      absent.push(p);
    }
  }
  return { visible: visible, absent: absent };
}

function pickClosestEdge(box, container, leftFirst) {
  throw new Error("not implemented");
}

module.exports = {
  filterPartsByLayerExistence,
  pickClosestEdge,
};
