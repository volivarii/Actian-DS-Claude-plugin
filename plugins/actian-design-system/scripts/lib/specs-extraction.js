"use strict";

/**
 * Pure decision functions for component-brief Pattern 14 (Specs Redline).
 *
 * These functions are extracted from the push-pattern code so they can be
 * unit-tested without a Figma Plugin API context. The push pattern itself
 * lives in references/component-brief/push-patterns.md.
 */

function shouldSurfaceFrame(frameNode, anatomyParts, isTopLevel) {
  if (isTopLevel) return true;
  if (
    !frameNode ||
    !Array.isArray(frameNode.children) ||
    frameNode.children.length === 0
  ) {
    return false;
  }
  var partNames = new Set(
    (anatomyParts || []).map(function (p) {
      return p.figmaLayerName;
    }),
  );
  return frameNode.children.some(function (c) {
    return partNames.has(c.name);
  });
}

async function resolveSpacingValue(numericPx, boundVariableId, variableLookup) {
  if (!boundVariableId) return { px: numericPx, token: null };
  try {
    var variable = await variableLookup(boundVariableId);
    if (!variable || !variable.name) return { px: numericPx, token: null };
    return { px: numericPx, token: variable.name };
  } catch (e) {
    return { px: numericPx, token: null };
  }
}

function formatAnnotationLabel(value) {
  if (value && value.token) return value.px + "px — " + value.token;
  return value.px + "px";
}

function dimensionAnnotationVariant(propertyName, autolayoutMode) {
  throw new Error("not implemented");
}

module.exports = {
  shouldSurfaceFrame,
  resolveSpacingValue,
  formatAnnotationLabel,
  dimensionAnnotationVariant,
};
