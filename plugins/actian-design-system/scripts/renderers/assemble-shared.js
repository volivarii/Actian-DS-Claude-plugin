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

// ---------------------------------------------------------------------------
// Flow CSS list (single source of truth — shared by flow preview + flow-share)
// ---------------------------------------------------------------------------

var FLOW_CSS = [
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
  FLOW_CSS: FLOW_CSS,
};
