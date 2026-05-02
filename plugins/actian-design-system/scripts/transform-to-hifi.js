#!/usr/bin/env node
"use strict";

/**
 * transform-to-hifi.js — Deterministic Stage 2 transform core.
 *
 * Rewrites flow-data FM component refs to DS Kit refs using the mapping table.
 * Works as both a require()able module and a CLI tool.
 *
 * Module API:
 *   var t = require('./transform-to-hifi');
 *   var hifi = t.transform(flowData);            // full transform
 *   var node = t.transformInstance(node, map, reg); // single node
 *   var obj  = t.parseVariant("Type=Primary, Size=md");
 *   var str  = t.serializeVariant({ Type: "Primary", Size: "md" });
 *
 * CLI usage:
 *   node scripts/transform-to-hifi.js <input.json> -o <output.json>
 */

var fs = require("fs");
var path = require("path");
var resolver = require("./intent-resolver.js");
var shared = require("./shared-constants.js");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

var DOCS_DIR = path.resolve(__dirname, "..", "docs");
var MAP_PATH = path.join(DOCS_DIR, "fm-to-ds-map.json");
var DS_REGISTRY_PATH = path.join(DOCS_DIR, "dskit.json");

// ---------------------------------------------------------------------------
// Variant helpers
// ---------------------------------------------------------------------------

/**
 * Parse a variant string like "Type=Primary, Size=md" into an object.
 * Handles whitespace around delimiters and empty strings gracefully.
 *
 * @param {string} str - Variant string (comma-separated axis=value pairs)
 * @returns {object} Parsed variant object, e.g. { Type: "Primary", Size: "md" }
 */
function parseVariant(str) {
  var result = {};
  if (!str || typeof str !== "string") return result;

  var pairs = str.split(",");
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].trim();
    if (!pair) continue;
    var eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    var axis = pair.substring(0, eqIdx).trim();
    var value = pair.substring(eqIdx + 1).trim();
    if (axis) {
      result[axis] = value;
    }
  }
  return result;
}

/**
 * Serialize a variant object back to a string.
 * Output: "Type=Primary, Size=Default" (sorted by key for determinism).
 *
 * @param {object} obj - Variant object, e.g. { Type: "Primary", Size: "Default" }
 * @returns {string} Serialized variant string
 */
function serializeVariant(obj) {
  if (!obj || typeof obj !== "object") return "";
  var keys = Object.keys(obj).sort();
  var parts = [];
  for (var i = 0; i < keys.length; i++) {
    parts.push(keys[i] + "=" + obj[keys[i]]);
  }
  return parts.join(", ");
}

// ---------------------------------------------------------------------------
// Core transform: single INSTANCE node
// ---------------------------------------------------------------------------

/**
 * Transform a single INSTANCE node from FM refs to DS refs.
 *
 * @param {object} node - INSTANCE node with ref, variant, props
 * @param {object} mapData - Parsed fm-to-ds-map.json
 * @param {object} dsRegistry - Parsed dskit.json
 * @param {string} effectiveIntent - Effective intent resolved from node and ancestors, or "default".
 * @returns {object} Transformed node (new object, original not mutated)
 */
function transformInstance(node, mapData, dsRegistry, effectiveIntent) {
  var ref = node.ref;
  var mappings = mapData.mappings || {};
  var unmappable = mapData.unmappable || {};

  // Check if this FM ref has a mapping
  var mapping = mappings[ref];
  if (!mapping) {
    // Check if it's explicitly unmappable
    var reason = unmappable[ref]
      ? unmappable[ref]
      : 'No mapping found for FM ref "' + ref + '"';
    // Return node with unmapped flag — preserve all original fields
    var unmappedNode = {};
    var nodeKeys = Object.keys(node);
    for (var k = 0; k < nodeKeys.length; k++) {
      unmappedNode[nodeKeys[k]] = node[nodeKeys[k]];
    }
    unmappedNode.unmapped = true;
    unmappedNode.unmappedReason = reason;
    unmappedNode.originalRef = ref;
    return unmappedNode;
  }

  // Resolve current DS slug from immutable dsKey. dsSlug on the mapping is
  // derived/cached by /sync-design-system; we never trust it at runtime.
  var dsSlug = shared.slugFromKey(mapping.dsKey, "ds");
  var dsComponents = dsRegistry.components || {};
  if (!dsSlug || !dsComponents[dsSlug]) {
    var fallbackNode = {};
    var fKeys = Object.keys(node);
    for (var f = 0; f < fKeys.length; f++) {
      fallbackNode[fKeys[f]] = node[fKeys[f]];
    }
    fallbackNode.unmapped = true;
    fallbackNode.unmappedReason =
      'DS key "' + mapping.dsKey + '" does not resolve in dskit.json registry';
    fallbackNode.originalRef = ref;
    return fallbackNode;
  }

  var dsRef = shared.slugToRef(dsSlug, "ds");

  // --- Transform variant ---
  var srcVariant = node.variant ? parseVariant(node.variant) : {};
  var defaultVariant = mapping.defaultVariant || {};
  var variantMap = mapping.variantMap || {};
  var dropVariants = mapping.dropVariants || [];
  var dsEntry = dsComponents[dsSlug];
  var dsVariants = dsEntry.variants || {};

  // Start with a copy of the default variant
  var resultVariant = {};
  var dvKeys = Object.keys(defaultVariant);
  for (var d = 0; d < dvKeys.length; d++) {
    resultVariant[dvKeys[d]] = defaultVariant[dvKeys[d]];
  }

  // Walk source variant axes and apply mapping
  var srcAxes = Object.keys(srcVariant);
  for (var s = 0; s < srcAxes.length; s++) {
    var srcAxis = srcAxes[s];
    var srcValue = srcVariant[srcAxis];

    // Check if this axis should be dropped
    if (dropVariants.indexOf(srcAxis) !== -1) continue;

    // Check if there's a variantMap entry for this axis
    var axisMap = variantMap[srcAxis];
    if (axisMap) {
      // The axisMap maps FM values to DS values. The target DS axis
      // might be different from the source axis name.
      // Determine target DS axis: it's the axis in defaultVariant or dsVariants
      // that the mapped values belong to.
      var mappedValue = axisMap[srcValue];
      if (mappedValue !== undefined) {
        // Find which DS axis this mapped value belongs to
        var targetAxis = findTargetAxis(
          srcAxis,
          mappedValue,
          defaultVariant,
          dsVariants,
          variantMap,
        );
        resultVariant[targetAxis] = mappedValue;
      }
      // If no mapped value, the FM value is unknown — skip silently
    } else {
      // No explicit map for this axis — passthrough if DS has same axis and value
      if (dsVariants[srcAxis]) {
        var dsValues = dsVariants[srcAxis];
        if (dsValues.indexOf(srcValue) !== -1) {
          resultVariant[srcAxis] = srcValue;
        }
        // else: FM value doesn't exist in DS axis — keep default
      }
      // else: DS doesn't have this axis at all — drop silently
    }
  }

  // Intent-override pass — runs after variantMap so intent has highest priority
  // for axes it specifies. Axes not in intentVariants keep their variantMap-resolved values.
  var intentVariants = mapping.intentVariants || {};
  var intentOverride = intentVariants[effectiveIntent];
  if (intentOverride && typeof intentOverride === "object") {
    var ioKeys = Object.keys(intentOverride);
    for (var io = 0; io < ioKeys.length; io++) {
      resultVariant[ioKeys[io]] = intentOverride[ioKeys[io]];
    }
  }

  // --- Transform properties ---
  var srcProps = node.props || {};
  var propertyMap = mapping.propertyMap || {};
  var resultProps = {};

  var propKeys = Object.keys(srcProps);
  for (var p = 0; p < propKeys.length; p++) {
    var srcPropName = propKeys[p];
    var srcPropValue = srcProps[srcPropName];

    if (propertyMap.hasOwnProperty(srcPropName)) {
      var dsPropName = propertyMap[srcPropName];
      // null in propertyMap means "drop this property"
      if (dsPropName === null) continue;
      resultProps[dsPropName] = srcPropValue;
    } else {
      // Passthrough unmapped properties
      resultProps[srcPropName] = srcPropValue;
    }
  }

  // Build transformed node
  var result = {
    type: "INSTANCE",
    ref: dsRef,
    library: "ds",
    dsSlug: dsSlug,
  };

  // Preserve name if present
  if (node.name) {
    result.name = node.name;
  }

  result.variant = serializeVariant(resultVariant);
  result.props = resultProps;

  // Preserve sizing if present
  if (node.sizing) {
    result.sizing = node.sizing;
  }

  return result;
}

/**
 * Determine the target DS axis for a mapped variant value.
 *
 * The variantMap keys are FM axis names. When FM 'State' (On/Off) maps to
 * DS 'Selected' (Yes/No), we need to figure out that the target axis is
 * 'Selected', not 'State'.
 *
 * Strategy: check if the mapped value appears in the defaultVariant axes.
 * If a defaultVariant axis has this value (or the variantMap FM axis name
 * differs from where the value lands in dsVariants), pick that axis.
 *
 * @param {string} srcAxis - FM axis name
 * @param {string} mappedValue - The DS value after mapping
 * @param {object} defaultVariant - Default variant from the mapping
 * @param {object} dsVariants - DS component's variants from registry
 * @param {object} variantMap - The variant map from the mapping
 * @returns {string} Target DS axis name
 */
function findTargetAxis(
  srcAxis,
  mappedValue,
  defaultVariant,
  dsVariants,
  variantMap,
) {
  // First check: does defaultVariant have an axis whose default is being
  // replaced by mappedValue, and is it different from srcAxis?
  // Look for the axis in dsVariants that contains mappedValue.
  var dsAxes = Object.keys(dsVariants);
  for (var i = 0; i < dsAxes.length; i++) {
    var dsAxis = dsAxes[i];
    var dsValues = dsVariants[dsAxis];
    if (dsValues.indexOf(mappedValue) !== -1) {
      // If the defaultVariant also has this axis, it's a strong match
      if (defaultVariant.hasOwnProperty(dsAxis)) {
        return dsAxis;
      }
    }
  }

  // If the mapped value appears in a DS axis that matches srcAxis, use srcAxis
  if (dsVariants[srcAxis]) {
    var srcAxisValues = dsVariants[srcAxis];
    if (srcAxisValues.indexOf(mappedValue) !== -1) {
      return srcAxis;
    }
  }

  // Fallback: check all DS axes for the mapped value
  for (var j = 0; j < dsAxes.length; j++) {
    if (dsVariants[dsAxes[j]].indexOf(mappedValue) !== -1) {
      return dsAxes[j];
    }
  }

  // Last resort: use the source axis name
  return srcAxis;
}

// ---------------------------------------------------------------------------
// Recursive tree walk
// ---------------------------------------------------------------------------

/**
 * Recursively transform an array of nodes.
 * INSTANCE nodes get their refs rewritten; FRAME nodes recurse into children.
 * All other node types pass through unchanged.
 *
 * @param {Array} nodes - Array of flow-data nodes
 * @param {object} mapData - Parsed fm-to-ds-map.json
 * @param {object} dsRegistry - Parsed dskit.json
 * @param {string|null} ancestorIntent - Inherited intent from parent FRAME, or null at screen root.
 * @returns {Array} Transformed nodes (new array, originals not mutated)
 */
function transformNodes(nodes, mapData, dsRegistry, ancestorIntent) {
  if (!Array.isArray(nodes)) return [];

  var result = [];
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (!node || typeof node !== "object") {
      result.push(node);
      continue;
    }
    var effective = resolver.resolveEffectiveIntent(
      node.intent,
      ancestorIntent,
    );

    if (node.type === "INSTANCE") {
      result.push(transformInstance(node, mapData, dsRegistry, effective));
    } else if (node.children && Array.isArray(node.children)) {
      // FRAME, GROUP, or any container — copy and recurse into children
      var copy = {};
      var keys = Object.keys(node);
      for (var k = 0; k < keys.length; k++) {
        if (keys[k] === "children") {
          copy.children = transformNodes(
            node.children,
            mapData,
            dsRegistry,
            effective,
          );
        } else {
          copy[keys[k]] = node[keys[k]];
        }
      }
      result.push(copy);
    } else {
      // TEXT, DIVIDER, etc. — pass through unchanged
      result.push(node);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Top-level transform
// ---------------------------------------------------------------------------

/**
 * Transform an entire flow-data JSON from FM refs to DS refs.
 *
 * Loads the mapping table and DS registry, transforms all screens,
 * and sets meta.mode = "hifi".
 *
 * @param {object} flowData - Parsed flow-data JSON
 * @param {object} [options] - Optional overrides
 * @param {object} [options.mapData] - Pre-loaded mapping data (skips file read)
 * @param {object} [options.dsRegistry] - Pre-loaded DS registry (skips file read)
 * @returns {object} Transformed flow-data with DS refs
 */
function transform(flowData, options) {
  options = options || {};

  // Load mapping table
  var mapData = options.mapData;
  if (!mapData) {
    if (!fs.existsSync(MAP_PATH)) {
      throw new Error("Mapping table not found: " + MAP_PATH);
    }
    mapData = JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
  }

  // Load DS registry
  var dsRegistry = options.dsRegistry;
  if (!dsRegistry) {
    if (!fs.existsSync(DS_REGISTRY_PATH)) {
      throw new Error("DS registry not found: " + DS_REGISTRY_PATH);
    }
    dsRegistry = JSON.parse(fs.readFileSync(DS_REGISTRY_PATH, "utf8"));
  }

  // Deep-copy meta and set mode
  var meta = {};
  if (flowData.meta) {
    var metaKeys = Object.keys(flowData.meta);
    for (var m = 0; m < metaKeys.length; m++) {
      meta[metaKeys[m]] = flowData.meta[metaKeys[m]];
    }
  }
  meta.mode = "hifi";
  meta.transformedAt = new Date().toISOString();

  // Transform each screen
  var screens = flowData.screens || [];
  var transformedScreens = [];
  var stats = { total: 0, mapped: 0, unmapped: 0 };

  for (var i = 0; i < screens.length; i++) {
    var screen = screens[i];
    var transformedContent = transformNodes(
      screen.content || [],
      mapData,
      dsRegistry,
      null,
    );

    // Count stats
    countNodes(transformedContent, stats);

    var transformedScreen = {};
    var sKeys = Object.keys(screen);
    for (var s = 0; s < sKeys.length; s++) {
      if (sKeys[s] === "content") {
        transformedScreen.content = transformedContent;
      } else {
        transformedScreen[sKeys[s]] = screen[sKeys[s]];
      }
    }
    transformedScreens.push(transformedScreen);
  }

  meta.transformStats = stats;

  return {
    meta: meta,
    screens: transformedScreens,
  };
}

/**
 * Count mapped/unmapped INSTANCE nodes recursively for stats.
 * @param {Array} nodes
 * @param {object} stats - Mutated in place: { total, mapped, unmapped }
 */
function countNodes(nodes, stats) {
  if (!Array.isArray(nodes)) return;
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (!node || typeof node !== "object") continue;
    if (node.type === "INSTANCE") {
      stats.total++;
      if (node.unmapped) {
        stats.unmapped++;
      } else {
        stats.mapped++;
      }
    }
    if (node.children && Array.isArray(node.children)) {
      countNodes(node.children, stats);
    }
  }
}

// ---------------------------------------------------------------------------
// CLI mode
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  var args = { input: null, output: null };
  var positionals = [];
  var i = 2; // skip node + script

  while (i < argv.length) {
    var arg = argv[i];
    if ((arg === "-o" || arg === "--output") && i + 1 < argv.length) {
      args.output = argv[++i];
    } else if (arg === "--help") {
      args.help = true;
    } else if (arg.charAt(0) !== "-") {
      positionals.push(arg);
    }
    i++;
  }

  if (positionals.length > 0) {
    args.input = positionals[0];
  }

  return args;
}

if (require.main === module) {
  var args = parseArgs(process.argv);

  if (args.help) {
    process.stdout.write(
      JSON.stringify(
        {
          name: "transform-to-hifi",
          description: "Transform flow-data FM component refs to DS Kit refs.",
          usage:
            "node scripts/transform-to-hifi.js <input.json> -o <output.json>",
          flags: [
            {
              name: "-o / --output",
              required: true,
              description: "Output JSON file path",
            },
            { name: "--help", required: false, description: "Show this help" },
          ],
        },
        null,
        2,
      ) + "\n",
    );
    process.exit(0);
  }

  if (!args.input) {
    process.stderr.write("ERROR: Missing input JSON file.\n");
    process.stderr.write(
      "Usage: node scripts/transform-to-hifi.js <input.json> -o <output.json>\n",
    );
    process.exit(1);
  }
  if (!args.output) {
    process.stderr.write("ERROR: Missing -o / --output argument.\n");
    process.stderr.write(
      "Usage: node scripts/transform-to-hifi.js <input.json> -o <output.json>\n",
    );
    process.exit(1);
  }

  var inputPath = path.resolve(args.input);
  if (!fs.existsSync(inputPath)) {
    process.stderr.write("ERROR: Input file not found: " + inputPath + "\n");
    process.exit(1);
  }

  process.stderr.write("Reading: " + inputPath + "\n");
  var flowData = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  process.stderr.write("Transforming FM refs to DS refs...\n");
  var result = transform(flowData);

  var outputPath = path.resolve(args.output);
  var outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf8");

  var stats = result.meta.transformStats;
  process.stderr.write("Done: " + outputPath + "\n");
  process.stderr.write(
    "  Instances: " +
      stats.total +
      " total, " +
      stats.mapped +
      " mapped, " +
      stats.unmapped +
      " unmapped\n",
  );
}

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

module.exports = {
  transform: transform,
  transformInstance: transformInstance,
  transformNodes: transformNodes,
  parseVariant: parseVariant,
  serializeVariant: serializeVariant,
};
