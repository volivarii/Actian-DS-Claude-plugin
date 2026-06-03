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

// ---------------------------------------------------------------------------
// CLI — bulk inspector for screen-generator pre-check
// ---------------------------------------------------------------------------
//
// Usage:
//   node component-property-rules.js --inspect fmButton,fmPageHeader,fmCheckbox
//   node component-property-rules.js --inspect button,checkbox  (DS Kit)
//   node component-property-rules.js --inspect fmButton --json
//
// Returns required-override TEXT props and default-true booleans per slug,
// looking up in fmkit.json (fm* slugs) or dskit.json (others). Output is
// concise text by default (~3 lines per component) so the AI can read it
// without doing python registry dumps.
// ---------------------------------------------------------------------------

if (require.main === module) {
  var fs = require("fs");
  var PATHS = require("../lib/paths.js");
  var args = process.argv.slice(2);

  var slugs = null;
  var jsonOutput = false;

  for (var i = 0; i < args.length; i++) {
    if (args[i] === "--inspect" && i + 1 < args.length) {
      slugs = args[i + 1].split(",").map(function (s) {
        return s.trim();
      });
      i++;
    } else if (args[i] === "--json") {
      jsonOutput = true;
    } else if (args[i] === "--help") {
      process.stdout.write(
        "Usage: component-property-rules.js --inspect <slug>[,<slug>...] [--json]\n",
      );
      process.stdout.write(
        "Looks up required-override TEXT props and default-true booleans per slug.\n",
      );
      process.stdout.write(
        "fm* slugs read from vendor/components/dist/registries/fmkit.json; others read from vendor/components/dist/registries/dskit.json.\n",
      );
      process.exit(0);
    }
  }

  if (!slugs || slugs.length === 0) {
    process.stderr.write(
      "Usage: component-property-rules.js --inspect <slug>[,<slug>...] [--json]\n",
    );
    process.exit(1);
  }

  function loadKit(registryPath) {
    try {
      return JSON.parse(fs.readFileSync(registryPath, "utf8"));
    } catch (e) {
      return { components: {} };
    }
  }
  var fm = loadKit(PATHS.components.registries.fmkit).components || {};
  var ds = loadKit(PATHS.components.registries.dskit).components || {};

  function indexBoth(kit) {
    var index = {};
    var keys = Object.keys(kit);
    for (var k = 0; k < keys.length; k++) {
      index[keys[k]] = kit[keys[k]]; // kebab
      var camel = keys[k].replace(/-([a-z])/g, function (_, c) {
        return c.toUpperCase();
      });
      index[camel] = kit[keys[k]];
    }
    return index;
  }
  var combined = Object.assign({}, indexBoth(fm), indexBoth(ds));

  var results = {};
  for (var s = 0; s < slugs.length; s++) {
    var slug = slugs[s];
    var def = combined[slug];
    if (!def) {
      results[slug] = { error: "not found in fmkit.json or dskit.json" };
      continue;
    }
    var required = getRequiredOverrideProps(def).map(function (r) {
      return r.propName;
    });
    var booleans = getDefaultTrueBooleans(def).map(function (b) {
      return b.propName;
    });
    results[slug] = { required: required, defaultTrueBooleans: booleans };
  }

  if (jsonOutput) {
    process.stdout.write(JSON.stringify(results, null, 2) + "\n");
  } else {
    var lines = [];
    var resultSlugs = Object.keys(results);
    for (var rs = 0; rs < resultSlugs.length; rs++) {
      var rSlug = resultSlugs[rs];
      var r = results[rSlug];
      if (r.error) {
        lines.push(rSlug + ": ERROR — " + r.error);
        continue;
      }
      var reqStr = r.required.length > 0 ? r.required.join(", ") : "(none)";
      var boolStr =
        r.defaultTrueBooleans.length > 0
          ? r.defaultTrueBooleans.join(", ")
          : "(none)";
      lines.push(rSlug);
      lines.push("  required overrides: " + reqStr);
      lines.push("  default-true booleans: " + boolStr);
    }
    process.stdout.write(lines.join("\n") + "\n");
  }
}
