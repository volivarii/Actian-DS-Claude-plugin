"use strict";

// Renderer relocation phase 2: knowledge owns the ONE renderer and the plugin
// vendors it back. A plugin-local copy would silently re-open the two-owner
// split this program closed, and that split is not hypothetical: tag colours
// and checkbox state were fixed in knowledge's gallery at phase 1b and stayed
// broken in the plugin's own output for weeks, because the same component had
// two renderers and only one was fixed.
//
// There is deliberately no byte-identity drift-guard, because there is
// deliberately no copy to guard. scripts/lib/renderer.js requires the vendored
// modules directly, the same way scripts/lib/paths.js requires
// vendor/clients/resolve-paths.js. This test enforces the absence.

var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("node:fs");
var path = require("node:path");

var PLUGIN_ROOT = path.join(__dirname, "..", "..");

var FORBIDDEN = [
  "scripts/renderers/anatomy-render.js",
  "scripts/renderers/appearance-render.js",
  "scripts/renderers/appearance-style.js",
  "scripts/renderers/ds-anatomy-map.js",
  "scripts/renderers/html-renderers/ds-html-map.js",
  "scripts/renderers/html-renderers/anatomy-variant-key.js",
  "scripts/renderers/html-renderers/ds-base.css",
  "scripts/renderers/html-renderers/ds-fonts.css",
  "scripts/fidelity/default-props.json",
  "scripts/renderers/html-renderers/fm-html-map.js",
  "scripts/renderers/html-renderers/fm-base.css",
];

test("the plugin holds no local copy of the vendored renderer", function () {
  var reappeared = FORBIDDEN.filter(function (rel) {
    return fs.existsSync(path.join(PLUGIN_ROOT, rel));
  });
  assert.deepEqual(
    reappeared,
    [],
    "these reappeared: " +
      reappeared.join(", ") +
      ". Knowledge owns the renderer at components/render/renderer/; require " +
      "it via scripts/lib/renderer.js rather than copying it back.",
  );
});

test("the accessor is the only file that reaches into the vendored renderer", function () {
  // Everything else must go through scripts/lib/renderer.js, which is what
  // keeps no-bare-vendor-paths satisfied by construction and keeps the "the
  // renderer is vendored" fact in exactly one place.
  var offenders = [];
  function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
      if (entry.name === "node_modules" || entry.name === "vendor") return;
      var full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      if (!/\.(js|cjs|mjs)$/.test(entry.name)) return;
      var rel = path.relative(PLUGIN_ROOT, full);
      if (rel === path.join("scripts", "lib", "renderer.js")) return;
      var src = fs.readFileSync(full, "utf8");
      // Match a code reference, not prose: the path inside a string literal.
      if (/["'][^"']*components\/render\/renderer[^"']*["']/.test(src)) {
        offenders.push(rel);
      }
    });
  }
  walk(path.join(PLUGIN_ROOT, "scripts"));
  assert.deepEqual(
    offenders,
    [],
    "these reach the vendored renderer directly instead of via " +
      "scripts/lib/renderer.js: " +
      offenders.join(", "),
  );
});
