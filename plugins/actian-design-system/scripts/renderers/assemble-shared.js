"use strict";

/**
 * assemble-shared.js — Shared primitives for the assemble-* family.
 *
 * No side effects (no main, no process.exit at load).
 * Both assemble-preview.js and assemble-flow-share.js import from here.
 */

var fs = require("fs");
var path = require("path");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

var PLUGIN_ROOT = path.resolve(__dirname, "../..");
var TEMPLATES_DIR = path.join(PLUGIN_ROOT, "templates");
var RENDERERS_DIR = path.join(
  PLUGIN_ROOT,
  "scripts",
  "renderers",
  "html-renderers",
);
var FIGMA_TABLE_DIR = path.join(
  PLUGIN_ROOT,
  "scripts",
  "renderers",
  "figma-table",
);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function readFileChecked(filePath) {
  if (!fs.existsSync(filePath)) {
    process.stderr.write("ERROR: Missing asset: " + filePath + "\n");
    process.exit(1);
  }
  return fs.readFileSync(filePath, "utf8");
}

function escapeJsonForScript(jsonStr) {
  // Replace </ with <\/ to prevent </script> from closing the tag
  return jsonStr.replace(/<\//g, "<\\/");
}

// Build the inline <script> that exposes the vendored icon geometry as a
// browser global, so ds-html-map.js's renderIcon() can resolve glyphs client-
// side. Geometry-only ({viewBox, body}) — drops dsKey/nodeId/group (the browser
// needs no provenance). Read from the vendored read-surface via PATHS.
function buildDsIconsScript() {
  var PATHS = require("../lib/paths.js");
  var doc = JSON.parse(fs.readFileSync(PATHS.components.icons.svg, "utf8"));
  var icons = doc.icons || {};
  var geo = {};
  Object.keys(icons).forEach(function (slug) {
    geo[slug] = { viewBox: icons[slug].viewBox, body: icons[slug].body };
  });
  // Slugs a NON-icon component also answers to (`calendar` is the glyph AND the
  // Calendar component; `search` is the glyph AND the Search field). Ship the list
  // with the geometry: the renderer runs in the BROWSER here, so it has no
  // registry to consult and cannot work this out for itself. Without it, an
  // anatomy that nests `search` — global-header does — resolves against the icon
  // map and draws a magnifier where an entire search input belongs.
  var shadowed = (doc._meta && doc._meta.shadowed_by_component) || [];
  return (
    "  <script>window.dsIcons = " +
    escapeJsonForScript(JSON.stringify(geo)) +
    "; window.dsIconsShadowedByComponent = " +
    escapeJsonForScript(JSON.stringify(shadowed)) +
    ";</script>"
  );
}

// ---------------------------------------------------------------------------
// Flow CSS list (single source of truth — shared by flow preview + flow-share)
// ---------------------------------------------------------------------------

var FLOW_CSS = [
  path.join(RENDERERS_DIR, "ds-fonts.css"), // embedded woff2 faces (offline) — MUST precede any use.
  path.join(RENDERERS_DIR, "fm-base.css"),
  path.join(RENDERERS_DIR, "render-node.css"),
  path.join(RENDERERS_DIR, "flow-renderer.css"),
  path.join(RENDERERS_DIR, "ds-base.css"), // hi-fi DS tier; inert for lo-fi (only styles .ds-*).
];

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  PLUGIN_ROOT: PLUGIN_ROOT,
  TEMPLATES_DIR: TEMPLATES_DIR,
  RENDERERS_DIR: RENDERERS_DIR,
  FIGMA_TABLE_DIR: FIGMA_TABLE_DIR,
  readFileChecked: readFileChecked,
  escapeJsonForScript: escapeJsonForScript,
  buildDsIconsScript: buildDsIconsScript,
  FLOW_CSS: FLOW_CSS,
};
