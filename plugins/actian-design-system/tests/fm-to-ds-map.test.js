#!/usr/bin/env node
"use strict";

/**
 * fm-to-ds-map.test.js — Validate the FM-to-DS mapping table against both registries.
 *
 * Ensures every mapping entry references real components and valid variant values
 * in dskit.json, catching breakage when either kit syncs.
 *
 * Test groups:
 *   Part 1: Every mapping's dsSlug exists in dskit.json
 *   Part 2: Every defaultVariant uses valid DS variant values
 *   Part 3: Every variantMap target value is valid in DS
 *   Part 4: Coverage check — all mappings + unmappable >= 20 FM components
 *
 * Run with: node --test plugins/actian-design-system/tests/fm-to-ds-map.test.js
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

var PLUGIN_ROOT = path.resolve(__dirname, "..");
var DOCS_DIR = path.join(PLUGIN_ROOT, "docs");

// ---------------------------------------------------------------------------
// Load registries
// ---------------------------------------------------------------------------

var dsRegistry = JSON.parse(fs.readFileSync(path.join(DOCS_DIR, "dskit.json"), "utf8"));
var fmRegistry = JSON.parse(fs.readFileSync(path.join(DOCS_DIR, "fmkit.json"), "utf8"));
var map = JSON.parse(fs.readFileSync(path.join(DOCS_DIR, "fm-to-ds-map.json"), "utf8"));

// ---------------------------------------------------------------------------
// Part 1: Every mapping's dsSlug exists in dskit.json
// ---------------------------------------------------------------------------

describe("FM-to-DS Map Tests", function () {
  describe("Part 1: dsSlug exists in dskit.json", function () {
    for (var ref1 in map.mappings) {
      (function (fmSlug) {
        var entry = map.mappings[fmSlug];
        it(fmSlug + " → dsSlug '" + entry.dsSlug + "' exists in dskit.json", function () {
          assert.ok(
            dsRegistry.components[entry.dsSlug] !== undefined,
            fmSlug + ": dsSlug '" + entry.dsSlug + "' not found in dskit.json"
          );
        });
      })(ref1);
    }
  });

  // ---------------------------------------------------------------------------
  // Part 2: Every defaultVariant uses valid DS variant values
  // ---------------------------------------------------------------------------

  describe("Part 2: defaultVariant values are valid in DS", function () {
    for (var ref2 in map.mappings) {
      (function (fmSlug) {
        var entry = map.mappings[fmSlug];
        var dsComp = dsRegistry.components[entry.dsSlug];
        if (!dsComp || !entry.defaultVariant) return;

        for (var axis2 in entry.defaultVariant) {
          (function (axisName, axisValue) {
            it(fmSlug + " defaultVariant['" + axisName + "'] = '" + axisValue + "' is valid in DS", function () {
              // Only validate if DS component has variants for this axis
              if (!dsComp.variants || !dsComp.variants[axisName]) {
                // Axis not present in DS variants — skip validation (may be a real DS axis
                // with a single implicit value or the axis name has a known typo in Figma)
                return;
              }
              var validValues = dsComp.variants[axisName];
              assert.ok(
                validValues.indexOf(axisValue) !== -1,
                fmSlug + " defaultVariant['" + axisName + "'] = '" + axisValue +
                "' not found in DS variants. Valid: " + validValues.join(", ")
              );
            });
          })(axis2, entry.defaultVariant[axis2]);
        }
      })(ref2);
    }
  });

  // ---------------------------------------------------------------------------
  // Part 3: Every variantMap target value is valid in DS
  // ---------------------------------------------------------------------------

  describe("Part 3: variantMap target values are valid in DS", function () {
    for (var ref3 in map.mappings) {
      (function (fmSlug) {
        var entry = map.mappings[fmSlug];
        var dsComp = dsRegistry.components[entry.dsSlug];
        if (!dsComp || !entry.variantMap) return;

        for (var axis3 in entry.variantMap) {
          (function (axisName) {
            var axisMap = entry.variantMap[axisName];

            // Determine which DS axis this FM axis maps to.
            // The variantMap may remap FM axis names to DS axis names.
            // We infer the DS axis by looking at which DS variant axis contains
            // the target values, starting with same-named axis then falling through all axes.
            for (var fmVal in axisMap) {
              (function (fmValue, dsValue) {
                // Null target values are explicit drops — skip validation
                if (dsValue === null) return;

                it(fmSlug + " variantMap['" + axisName + "']['" + fmValue + "'] = '" + dsValue + "' is valid in DS", function () {
                  if (!dsComp.variants) {
                    assert.fail(fmSlug + ": DS component '" + entry.dsSlug + "' has no variants");
                  }

                  // Find the DS axis whose values array contains dsValue
                  var foundInAxis = null;
                  var dsAxes = Object.keys(dsComp.variants);
                  for (var ai = 0; ai < dsAxes.length; ai++) {
                    if (dsComp.variants[dsAxes[ai]].indexOf(dsValue) !== -1) {
                      foundInAxis = dsAxes[ai];
                      break;
                    }
                  }

                  assert.ok(
                    foundInAxis !== null,
                    fmSlug + " variantMap['" + axisName + "']['" + fmValue + "'] target '" + dsValue +
                    "' not found in any DS variant axis for '" + entry.dsSlug +
                    "'. DS axes: " + dsAxes.map(function (a) {
                      return a + "=[" + dsComp.variants[a].join(", ") + "]";
                    }).join("; ")
                  );
                });
              })(fmVal, axisMap[fmVal]);
            }
          })(axis3);
        }
      })(ref3);
    }
  });

  // ---------------------------------------------------------------------------
  // Part 4: Coverage check — mappings + unmappable >= 20 FM components
  // ---------------------------------------------------------------------------

  describe("Part 4: Coverage check", function () {
    it("mappings + unmappable covers >= 20 FM components", function () {
      var mappingCount = Object.keys(map.mappings).length;
      var unmappableCount = Object.keys(map.unmappable || {}).length;
      var total = mappingCount + unmappableCount;
      assert.ok(
        total >= 20,
        "Expected >= 20 FM components covered (mappings + unmappable), got " +
        total + " (" + mappingCount + " mapped + " + unmappableCount + " unmappable)"
      );
    });

    it("map.mappings is a non-empty object", function () {
      assert.ok(
        map.mappings && typeof map.mappings === "object",
        "map.mappings must be an object"
      );
      assert.ok(
        Object.keys(map.mappings).length > 0,
        "map.mappings must not be empty"
      );
    });

    it("map has required top-level keys: _meta, mappings, unmappable", function () {
      assert.ok(map._meta !== undefined, "map._meta is missing");
      assert.ok(map.mappings !== undefined, "map.mappings is missing");
      assert.ok(map.unmappable !== undefined, "map.unmappable is missing");
    });
  });
});
