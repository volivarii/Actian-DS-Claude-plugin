"use strict";

/**
 * Pure decision functions for component-brief Pattern 14 (Specs Redline).
 *
 * These functions are extracted from the push-pattern code so they can be
 * unit-tested without a Figma Plugin API context. The push pattern itself
 * lives in references/component-brief/push-patterns.md.
 */

function shouldSurfaceFrame(frameNode, anatomyParts, isTopLevel) {
  throw new Error("not implemented");
}

function resolveSpacingValue(numericPx, boundVariableId, variableLookup) {
  throw new Error("not implemented");
}

function formatAnnotationLabel(value) {
  throw new Error("not implemented");
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
