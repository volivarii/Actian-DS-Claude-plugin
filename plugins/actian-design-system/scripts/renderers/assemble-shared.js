"use strict";

/**
 * assemble-shared.js: shared primitives for assemble-direct.js and
 * assemble-proposal.js.
 *
 * No side effects (no main, no process.exit at load).
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

// DS anatomy-doc-map / variant-style-map injection (Phase 1B). Every
// server-side flow renderer that pre-renders DS leaves in Node needs the
// same setup, then reset, sequence around its render pass: build both maps
// from `data` (collectDsSlugs walks the whole content-shaped tree), inject
// them into ds-html-map.js's module-level seam so a DS instance with no
// authored override still picks up its harvested per-instance appearance,
// run `fn`, then reset to null in a finally so this render's state never
// leaks into a later one. assemble-direct.js renders the app frame through
// it. Returns fn()'s return value.
function withDsMaps(data, fn) {
  var renderer = require("../lib/renderer.js");
  var dsHtmlMap = renderer.dsHtmlMap;
  var anatomyHelpers = renderer.dsAnatomyMap;
  var dsSlugs = anatomyHelpers.collectDsSlugs(data);
  var docMap = anatomyHelpers.buildDsAnatomyDocMap(dsSlugs);
  var variantStyleMap = anatomyHelpers.buildDsVariantStyleMap(data);
  dsHtmlMap.setAnatomyDocMap(docMap);
  dsHtmlMap.setVariantStyleMap(variantStyleMap);
  try {
    return fn();
  } finally {
    dsHtmlMap.setAnatomyDocMap(null);
    dsHtmlMap.setVariantStyleMap(null);
  }
}

// ---------------------------------------------------------------------------
// Flow CSS list (single source of truth: the app frame and the brief read it)
// ---------------------------------------------------------------------------

// Three roots since the fm relocation: ds-fonts.css, fm-base.css, and
// ds-base.css are the styling source KNOWLEDGE owns (vendored back); the
// other two are the plugin's own flow chrome. Cascade order is functional,
// not cosmetic: fonts first, then the plugin chrome, then the DS leaf styles
// last so component rules win. Do not reorder when editing.
var rendererCss = require("../lib/renderer.js").cssPaths;
var FLOW_CSS = [
  rendererCss.fonts, // embedded woff2 faces (offline) — MUST precede any use.
  rendererCss.fmBase,
  path.join(RENDERERS_DIR, "render-node.css"),
  path.join(RENDERERS_DIR, "flow-renderer.css"),
  rendererCss.base, // the DS leaf styles (only styles .ds-*).
];

// Insert a zero-width space between consecutive dashes so a value can never
// form a "-->" that closes the surrounding provenance HTML comment early (a
// /--/g pair-replace would leave a live "-->" on an odd-length run like "--->").
function maskComment(s) {
  return String(s == null ? "" : s).replace(/-(?=-)/g, "-\u200b");
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  PLUGIN_ROOT: PLUGIN_ROOT,
  TEMPLATES_DIR: TEMPLATES_DIR,
  RENDERERS_DIR: RENDERERS_DIR,
  readFileChecked: readFileChecked,
  escapeJsonForScript: escapeJsonForScript,
  withDsMaps: withDsMaps,
  FLOW_CSS: FLOW_CSS,
  maskComment: maskComment,
};
