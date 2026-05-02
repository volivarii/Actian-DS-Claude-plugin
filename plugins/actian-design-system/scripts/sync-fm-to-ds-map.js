#!/usr/bin/env node
"use strict";

/**
 * sync-fm-to-ds-map.js — Idempotent reconcile of fm-to-ds-map.json against dskit.json.
 *
 * Run as a step in /sync-design-system Phase 1 after dskit.json is written.
 *
 * For each entry in mappings:
 *   1. If dsKey missing AND dsSlug present → backfill dsKey from dskit.components[dsSlug].key.
 *   2. If dsKey present → re-derive dsSlug via reverse index; overwrite if drifted.
 *   3. If dsKey unresolvable → emit warning, do NOT mutate (designer decides whether to move to unmappable).
 *   4. If both fields missing → emit warning.
 *
 * Pure module API (reconcile / writeMap) used by tests; CLI shim at the bottom calls
 * the same functions against real files.
 */

var fs = require("fs");
var path = require("path");

/**
 * Build a { key: slug } reverse index from a registry.
 */
function buildKeyIndex(registry) {
  var index = {};
  var components = (registry && registry.components) || {};
  var slugs = Object.keys(components);
  for (var i = 0; i < slugs.length; i++) {
    var entry = components[slugs[i]];
    if (entry && entry.key) index[entry.key] = slugs[i];
  }
  return index;
}

/**
 * Reconcile a fm-to-ds-map document against a dskit registry IN PLACE.
 * Returns { changes: { backfilled, refreshed, warnings } } for reporting.
 */
function reconcile(map, dsRegistry) {
  var dsComponents = (dsRegistry && dsRegistry.components) || {};
  var keyIndex = buildKeyIndex(dsRegistry);
  var changes = { backfilled: [], refreshed: [], warnings: [] };

  var mappings = (map && map.mappings) || {};
  var fmRefs = Object.keys(mappings);

  for (var i = 0; i < fmRefs.length; i++) {
    var fmRef = fmRefs[i];
    var entry = mappings[fmRef];
    if (!entry) continue;

    if (!entry.dsKey && entry.dsSlug) {
      // Case 1: backfill dsKey from current dsSlug
      var component = dsComponents[entry.dsSlug];
      if (component && component.key) {
        entry.dsKey = component.key;
        changes.backfilled.push(fmRef + ": dsKey ← " + component.key);
      } else {
        changes.warnings.push(
          fmRef + ': dsSlug "' + entry.dsSlug +
          '" not found in dskit.json — cannot backfill dsKey. Consider moving to unmappable.'
        );
      }
      continue;
    }

    if (entry.dsKey) {
      // Case 2: refresh dsSlug from key
      var resolved = keyIndex[entry.dsKey];
      if (!resolved) {
        changes.warnings.push(
          fmRef + ': dsKey "' + entry.dsKey +
          '" not found in dskit.json. Component may have been hidden from publishing or removed. Consider moving to unmappable with a composition note.'
        );
        continue;
      }
      if (entry.dsSlug !== resolved) {
        changes.refreshed.push(
          fmRef + ': dsSlug "' + entry.dsSlug + '" → "' + resolved + '"'
        );
        entry.dsSlug = resolved;
      }
      continue;
    }

    // Case 3: neither field present
    changes.warnings.push(fmRef + ": entry has neither dsKey nor dsSlug.");
  }

  return { changes: changes };
}

/**
 * Reconcile from disk: read both files, run reconcile in place, write map back.
 * Returns the same { changes } object.
 */
function reconcileFromDisk(mapPath, registryPath) {
  var map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  var registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  var result = reconcile(map, registry);
  if (map._meta) map._meta.lastUpdated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + "\n");
  return result;
}

module.exports = { reconcile: reconcile, buildKeyIndex: buildKeyIndex, reconcileFromDisk: reconcileFromDisk };

// CLI: node sync-fm-to-ds-map.js
if (require.main === module) {
  var pluginRoot = path.resolve(__dirname, "..");
  var mapPath = path.join(pluginRoot, "docs", "generated", "fm-to-ds-map.json");
  var registryPath = path.join(pluginRoot, "docs", "generated", "dskit.json");
  var result = reconcileFromDisk(mapPath, registryPath);
  var c = result.changes;
  console.log("fm-to-ds-map reconcile complete:");
  console.log("  backfilled: " + c.backfilled.length);
  c.backfilled.forEach(function (s) { console.log("    " + s); });
  console.log("  refreshed:  " + c.refreshed.length);
  c.refreshed.forEach(function (s) { console.log("    " + s); });
  console.log("  warnings:   " + c.warnings.length);
  c.warnings.forEach(function (s) { console.log("    " + s); });
  if (c.warnings.length > 0) process.exit(1);
}
