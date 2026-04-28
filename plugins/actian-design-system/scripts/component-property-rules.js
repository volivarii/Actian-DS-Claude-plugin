#!/usr/bin/env node
"use strict";

// ---------------------------------------------------------------------------
// Placeholder default detection
// ---------------------------------------------------------------------------
//
// PLACEHOLDER_PATTERNS lists the literal default strings used by FM/DS
// components in their Figma master definitions. When a component instance is
// pushed without an override, these strings leak into the rendered design.
// The validator + render script consult this list to flag them.
// ---------------------------------------------------------------------------

var PLACEHOLDER_PATTERNS = [
  /^Page Title$/i,
  /^Section Title$/i,
  // 'Description text' and 'Description' are both common placeholder defaults
  // on FM components — both patterns are deliberate.
  /^Description text$/i,
  /^Description$/i,
  /^Button label$/i,
  /^Button$/i,
  /^Label$/i,
  /^Dropdown text$/i,
  /^Dropdown$/i,
  /^Placeholder/i,
  /^Nav Item$/i,
  /^Header text$/i,
  /^Helper text$/i,
];

function isPlaceholderDefault(text) {
  if (typeof text !== "string" || text.length === 0) return false;
  for (var i = 0; i < PLACEHOLDER_PATTERNS.length; i++) {
    if (PLACEHOLDER_PATTERNS[i].test(text)) return true;
  }
  return false;
}

module.exports = {
  PLACEHOLDER_PATTERNS: PLACEHOLDER_PATTERNS,
  isPlaceholderDefault: isPlaceholderDefault,
};
