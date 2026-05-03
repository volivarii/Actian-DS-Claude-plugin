#!/usr/bin/env node
"use strict";

// Pure utility: resolve effective intent via ancestor inheritance,
// leaf-override semantics. No I/O, no registry reads.

function resolveEffectiveIntent(nodeIntent, ancestorIntent) {
  if (nodeIntent) return nodeIntent;
  if (ancestorIntent) return ancestorIntent;
  return "default";
}

function walkWithIntent(node, callback, ancestorIntent, path) {
  ancestorIntent = ancestorIntent || null;
  path = path || "";
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      walkWithIntent(node[i], callback, ancestorIntent, path + "[" + i + "]");
    }
    return;
  }
  if (typeof node !== "object") return;
  var effective = resolveEffectiveIntent(node.intent, ancestorIntent);
  callback(node, effective, path);
  if (node.children) {
    walkWithIntent(node.children, callback, effective, path + ".children");
  }
}

module.exports = {
  resolveEffectiveIntent: resolveEffectiveIntent,
  walkWithIntent: walkWithIntent,
};
