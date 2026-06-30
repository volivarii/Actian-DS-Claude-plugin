"use strict";

/**
 * ds-set-props.js — best-effort Figma instance property setter.
 *
 * Exports a single self-contained function that runs BOTH in Node (unit tests)
 * AND inside Figma (stringified via .toString() into the emitted Plugin API JS).
 * It must remain self-contained — no closures over outer scope; only its args
 * and standard built-in JS.
 *
 * Design doc: task-4fix — phantom props + vendor drift resilience.
 */

/**
 * dsSetPropsBestEffort(inst, want, dropped)
 *
 * Sets only the Figma component properties that actually exist on the instance,
 * skipping phantom props without crashing. On a value-rejection throw (vendor
 * drift), falls back to per-property retry so one bad value doesn't block the
 * rest. Any prop that couldn't be set is appended to `dropped[]`.
 *
 * @param {object} inst    — Figma ComponentNode instance (has componentProperties + setProperties)
 * @param {object} want    — { propName: value } from the node spec (variant + props merged)
 * @param {Array}  dropped — mutable array; names of skipped/failed props are pushed here
 */
function dsSetPropsBestEffort(inst, want, dropped) {
  var defs = inst.componentProperties || {};
  var resolved = {};
  Object.keys(want).forEach(function (name) {
    var k = Object.keys(defs).find(function (d) {
      return d === name || d.split("#")[0] === name;
    });
    if (k) resolved[k] = want[name];
    else if (dropped) dropped.push(name);
  });
  var keys = Object.keys(resolved);
  if (!keys.length) return;
  try {
    inst.setProperties(resolved);
  } catch (e) {
    // An invalid value for one prop must not drop the rest (vendor drift).
    // Retry per-prop so we set everything that is valid.
    keys.forEach(function (k) {
      var one = {};
      one[k] = resolved[k];
      try {
        inst.setProperties(one);
      } catch (e2) {
        if (dropped) dropped.push(k);
      }
    });
  }
}

module.exports = { dsSetPropsBestEffort: dsSetPropsBestEffort };
