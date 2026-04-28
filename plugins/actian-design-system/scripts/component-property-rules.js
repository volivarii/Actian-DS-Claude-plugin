#!/usr/bin/env node
"use strict";

var crypto = require("crypto");

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

// ---------------------------------------------------------------------------
// Required-override prop detection
// ---------------------------------------------------------------------------
//
// A "required-override" prop is a TEXT property whose default value matches
// PLACEHOLDER_PATTERNS — meaning the AI/designer MUST override it or the
// placeholder string leaks into the design. Returned shape lets callers
// reference both the prop name (for setProperties calls) and the default
// (for error messages).
// ---------------------------------------------------------------------------

function getRequiredOverrideProps(componentDef) {
  if (
    !componentDef ||
    !componentDef.properties ||
    typeof componentDef.properties !== "object"
  ) {
    return [];
  }
  var result = [];
  var names = Object.keys(componentDef.properties);
  for (var i = 0; i < names.length; i++) {
    var prop = componentDef.properties[names[i]];
    if (prop && prop.type === "TEXT" && isPlaceholderDefault(prop.default)) {
      result.push({ propName: names[i], defaultValue: prop.default });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Default-true boolean detection
// ---------------------------------------------------------------------------
//
// Many FM/DS components have BOOLEAN props that default to `true` and
// control visibility of optional UI (icons, trailing actions, etc.). When
// designers don't explicitly address them, the default-on element shows
// unwanted. The validator surfaces these as warnings (not errors) so the
// designer can decide explicitly.
// ---------------------------------------------------------------------------

function getDefaultTrueBooleans(componentDef) {
  if (
    !componentDef ||
    !componentDef.properties ||
    typeof componentDef.properties !== "object"
  ) {
    return [];
  }
  var result = [];
  var names = Object.keys(componentDef.properties);
  for (var i = 0; i < names.length; i++) {
    var prop = componentDef.properties[names[i]];
    if (prop && prop.type === "BOOLEAN" && prop.default === true) {
      result.push({ propName: names[i], defaultValue: true });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Property defaults hash
// ---------------------------------------------------------------------------
//
// Stable sha256 over all property defaults across all components in a
// registry, sorted by component slug then prop name. Used by changelog.js
// to surface upstream drift when a designer edits a Figma component default.
// ---------------------------------------------------------------------------

function propertyDefaultsHash(registry) {
  var components = (registry && registry.components) || {};
  var slugs = Object.keys(components).sort();
  var rows = [];
  for (var i = 0; i < slugs.length; i++) {
    var slug = slugs[i];
    var props = (components[slug] && components[slug].properties) || {};
    var propNames = Object.keys(props).sort();
    for (var j = 0; j < propNames.length; j++) {
      var prop = props[propNames[j]];
      var defaultStr = JSON.stringify(
        prop && prop.default !== undefined ? prop.default : null,
      );
      rows.push(slug + "\t" + propNames[j] + "\t" + defaultStr);
    }
  }
  var canon = rows.join("\n");
  return crypto.createHash("sha256").update(canon).digest("hex");
}

module.exports = {
  PLACEHOLDER_PATTERNS: PLACEHOLDER_PATTERNS,
  isPlaceholderDefault: isPlaceholderDefault,
  getRequiredOverrideProps: getRequiredOverrideProps,
  getDefaultTrueBooleans: getDefaultTrueBooleans,
  propertyDefaultsHash: propertyDefaultsHash,
};
