#!/usr/bin/env node
"use strict";

/**
 * fm-tree-to-flow-data.js — Convert a raw Figma tree (from Stage 1 extraction)
 * into the flow-data format expected by transform-to-hifi.js.
 *
 * Resolves componentKeys against fmkit.json to get FM ref names (e.g., fmButton).
 * Uses FM_SLUGS from shared-constants.js for accurate slug → ref mapping.
 *
 * Usage:
 *   node scripts/fm-tree-to-flow-data.js <fm-tree.json> -o <flow-data.json>
 */

var fs = require("fs");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "../..");
var DOCS_DIR = path.join(PLUGIN_ROOT, "docs", "generated");
var shared = require("../lib/shared-constants");

// Build reverse lookup: componentKey → FM ref name
function buildKeyToRefMap() {
  var fmRegistry = JSON.parse(
    fs.readFileSync(path.join(DOCS_DIR, "fmkit.json"), "utf8"),
  );

  // Reverse FM_SLUGS: slug → ref name
  var slugToRef = {};
  for (var ref in shared.FM_SLUGS) {
    slugToRef[shared.FM_SLUGS[ref]] = ref;
  }

  // Map component key → ref name via registry slug
  var keyToRef = {};
  for (var slug in fmRegistry.components) {
    var entry = fmRegistry.components[slug];
    var refName = slugToRef[slug];
    if (refName && entry.key) {
      keyToRef[entry.key] = refName;
    }
  }

  return keyToRef;
}

// Build variant string from variantProperties object
function buildVariantString(variantProps) {
  if (!variantProps || typeof variantProps !== "object") return "";
  var parts = [];
  for (var axis in variantProps) {
    parts.push(axis + "=" + variantProps[axis]);
  }
  return parts.join(", ");
}

// Convert a raw Figma tree node to flow-data format
function convertNode(node, keyToRef) {
  if (!node) return null;

  if (node.type === "INSTANCE") {
    var ref = node.componentKey ? keyToRef[node.componentKey] : null;
    var result = {
      type: "INSTANCE",
      ref: ref || "unknown_" + (node.name || "").replace(/\s+/g, "_"),
      variant: buildVariantString(node.variantProperties),
      props: node.props || {},
    };
    if (!ref) {
      result.unmapped = true;
      result.unmappedReason =
        "Component key not found in FM Kit registry: " +
        (node.componentKey || "none") +
        " (name: " +
        (node.name || "unknown") +
        ")";
      result.originalRef = node.name || "unknown";
    }
    return result;
  }

  if (node.type === "TEXT") {
    return {
      type: "TEXT",
      content: node.characters || node.content || "",
      font: "Inter:Regular",
      size: node.fontSize || 14,
    };
  }

  // FRAME, GROUP, or other container
  if (node.children && node.children.length > 0) {
    var children = [];
    for (var i = 0; i < node.children.length; i++) {
      var child = convertNode(node.children[i], keyToRef);
      if (child) children.push(child);
    }
    return {
      type: "FRAME",
      name: node.name || "Frame",
      layout: { mode: "VERTICAL", spacing: 0, padding: [0, 0, 0, 0] },
      fills: [],
      children: children,
      sizing: { horizontal: "FILL", vertical: "HUG" },
    };
  }

  // Skip non-container, non-instance, non-text nodes
  return null;
}

// Convert flat node list (from Pass 1 extraction) to nested tree
function flatToTree(flatData) {
  var root = { name: flatData.root || "Screen", type: "FRAME", children: [] };
  var pathMap = {};
  pathMap[root.name] = root;

  var nodes = flatData.nodes || [];
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var entry;
    if (n.t === "I") {
      entry = {
        type: "INSTANCE",
        name: n.n,
        componentKey: n.k,
        variantProperties: n.v || {},
        props: n.pr || {},
        width: n.w,
        height: n.h,
        children: [],
      };
    } else if (n.t === "T") {
      entry = {
        type: "TEXT",
        name: n.n,
        characters: n.c,
        fontSize: n.s,
      };
    } else if (n.t === "F") {
      entry = {
        type: "FRAME",
        name: n.n,
        width: n.w,
        height: n.h,
        layoutMode: n.lm,
        children: [],
      };
    } else {
      continue;
    }

    // Find parent by path
    var pathParts = (n.p || "").split("/");
    var parentPath = pathParts.slice(0, -1).join("/");
    var parent = pathMap[parentPath] || root;
    if (parent.children) parent.children.push(entry);

    // Register this node in pathMap for potential children
    if (entry.children) {
      pathMap[n.p] = entry;
    }
  }

  return root;
}

function convert(fmTree) {
  var keyToRef = buildKeyToRefMap();

  // Detect flat format (from Pass 1 extraction)
  if (fmTree.nodes && Array.isArray(fmTree.nodes)) {
    fmTree = flatToTree(fmTree);
  }

  var screen = {
    name: fmTree.name || "Screen",
    content: [],
  };

  // If the root is a frame with children, convert each child
  if (fmTree.children) {
    for (var i = 0; i < fmTree.children.length; i++) {
      var node = convertNode(fmTree.children[i], keyToRef);
      if (node) screen.content.push(node);
    }
  } else {
    var rootNode = convertNode(fmTree, keyToRef);
    if (rootNode) screen.content.push(rootNode);
  }

  return {
    meta: {
      feature: fmTree.name || "HiFi conversion",
      skill: "convert-to-hifi",
      generatedAt: new Date().toISOString(),
    },
    screens: [screen],
  };
}

// CLI mode
if (require.main === module) {
  var args = process.argv.slice(2);
  var inputPath = null;
  var outputPath = null;
  for (var i = 0; i < args.length; i++) {
    if ((args[i] === "-o" || args[i] === "--output") && i + 1 < args.length) {
      outputPath = args[++i];
    } else if (args[i].charAt(0) !== "-") {
      inputPath = args[i];
    }
  }
  if (!inputPath) {
    process.stderr.write(
      "Usage: node scripts/fm-tree-to-flow-data.js <fm-tree.json> -o <flow-data.json>\n",
    );
    process.exit(1);
  }
  var fmTree = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  var flowData = convert(fmTree);

  // Count stats
  var total = 0;
  var resolved = 0;
  var unresolved = 0;
  function countInstances(nodes) {
    if (!Array.isArray(nodes)) return;
    for (var n = 0; n < nodes.length; n++) {
      if (nodes[n].type === "INSTANCE") {
        total++;
        if (nodes[n].unmapped) unresolved++;
        else resolved++;
      }
      if (nodes[n].children) countInstances(nodes[n].children);
      if (nodes[n].content && Array.isArray(nodes[n].content))
        countInstances(nodes[n].content);
    }
  }
  flowData.screens.forEach(function (s) {
    countInstances(s.content);
  });

  process.stderr.write(
    "Converted: " +
      total +
      " instances (" +
      resolved +
      " resolved, " +
      unresolved +
      " unresolved keys)\n",
  );

  var output = JSON.stringify(flowData, null, 2);
  if (outputPath) {
    var dir = path.dirname(path.resolve(outputPath));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.resolve(outputPath), output, "utf8");
    process.stderr.write("Wrote: " + outputPath + "\n");
  } else {
    process.stdout.write(output + "\n");
  }
}

module.exports = convert;
