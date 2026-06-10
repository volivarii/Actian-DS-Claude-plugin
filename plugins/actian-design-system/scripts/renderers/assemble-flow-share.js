"use strict";

/**
 * assemble-flow-share.js — Assembles a self-contained shareable flow
 * deliverable (two views: Prototype + Overview; inlines Alpine + flow CSS;
 * offline-safe).
 *
 * No side effects at load (no main, no process.exit at module level).
 * Exported: assembleFlowShare(data) → html string.
 */

var path = require("path");
var PATHS = require("../lib/paths");
var shared = require("./assemble-shared");
var esc = require("./html-renderers/fm-html-map.js").esc;

var readFileChecked = shared.readFileChecked;
var FLOW_CSS = shared.FLOW_CSS;

// Keep a local binding so the vendor-guard filter matches the literal form
// `path.join(TEMPLATES_DIR, "vendor")` — Constraint 3.
var TEMPLATES_DIR = shared.TEMPLATES_DIR;

var WRAPPER_PATH = path.join(TEMPLATES_DIR, "flow-prototype-wrapper.html");
// templates/vendor/ holds offline-embeddable third-party assets (Alpine etc.).
// This is the plugin's OWN asset dir — unrelated to the knowledge vendor/
// substrate that no-bare-vendor-paths.test.js protects. The guard has a
// scoped exemption for templates/vendor references so path.join is idiomatic here.
var TEMPLATES_VENDOR_DIR = path.join(TEMPLATES_DIR, "vendor");
var VENDOR_ALPINE = path.join(TEMPLATES_VENDOR_DIR, "alpinejs-3.14.9.min.js");

// ---------------------------------------------------------------------------
// Helpers (flow-share-specific)
// ---------------------------------------------------------------------------

// Prevent meta values from closing the leading HTML comment early.
// Insert a zero-width space between consecutive dashes so meta values can never
// form a "-->" that closes the surrounding provenance HTML comment early (the
// /--/g pair-replace left a live "-->" on odd-length dash runs like "--->").
function maskComment(s) {
  return String(s == null ? "" : s).replace(/-(?=-)/g, "-​");
}

// ---------------------------------------------------------------------------
// Assembler
// ---------------------------------------------------------------------------

function assembleFlowShare(data) {
  var meta = data.meta || {};
  var screens = Array.isArray(data.screens) ? data.screens : [];

  // Per-screen render reuse — the SAME function the strip preview uses.
  var flowRenderer = require("./html-renderers/flow-renderer.js");
  var renderScreen = flowRenderer.renderScreen;

  // Assets (fail loudly if missing — same contract as readFileChecked).
  var wrapper = readFileChecked(WRAPPER_PATH);
  var alpine = readFileChecked(VENDOR_ALPINE);
  var cssParts = [readFileChecked(PATHS.tokens.css)].concat(
    FLOW_CSS.map(readFileChecked),
  );
  var flowCss = cssParts.join("\n");

  // Flow-level hi-fi signal → per-screen library flag. The generate-flow skill
  // sets meta.library:"ds" (or meta.hifi:true) for a hi-fi flow; the renderer
  // branches on a per-screen `library` so individual screens can still override
  // (mixed flows). Authored per-screen `library` always wins.
  var metaLibrary =
    meta.library ||
    (meta._glossary && meta._glossary.library) ||
    (meta.hifi ? "ds" : null);

  // Server-render each screen into a .proto-screen-cell. The cell is a click
  // target in Overview (enter that screen); display:contents in Prototype.
  var screensHtml = "";
  var navArray = [];
  for (var s = 0; s < screens.length; s++) {
    var id = s + 1;
    var sc = screens[s];
    if (metaLibrary && !sc.library) {
      sc = Object.assign({}, sc, { library: metaLibrary });
    }
    navArray.push({ id: id, label: sc.name || "Screen " + id });
    screensHtml +=
      '<div class="proto-screen-cell" @click="view === \'overview\' && enter(' +
      id +
      ')">' +
      '<div class="proto-screen" data-screen="' +
      id +
      '"' +
      " :aria-hidden=\"view === 'prototype' && screen !== " +
      id +
      '"' +
      " x-show=\"view === 'overview' || screen === " +
      id +
      '">' +
      renderScreen(sc) +
      "</div></div>\n";
  }
  // navJson sits inside a double-quoted HTML attribute (x-data="{ screens: … }").
  // esc (not escapeJsonForScript) is required: a bare " in a screen name would
  // truncate the attribute and allow markup injection.
  var navJson = esc(JSON.stringify(navArray));

  // Audience-safe visible meta (NO prompt, NO model).
  var shareMeta = [
    meta.app || "",
    meta.generatedAt || meta.date || "",
    meta.pluginVersion ? "v" + meta.pluginVersion : "",
  ]
    .filter(Boolean)
    .join("  \xb7  ");

  // Full provenance lives in a leading comment (satisfies the gen-card rule).
  var metaComment =
    "<!--\n" +
    "  Actian Design System — generate-flow (shareable deliverable)\n" +
    "  skill:    " +
    maskComment(meta.skill || "generate-flow") +
    "\n" +
    "  feature:  " +
    maskComment(meta.feature || "") +
    "\n" +
    "  prompt:   " +
    maskComment(meta.prompt || "") +
    "\n" +
    "  date:     " +
    maskComment(meta.generatedAt || meta.date || "") +
    "\n" +
    "  duration: " +
    maskComment(meta.duration || "") +
    "\n" +
    "  model:    " +
    maskComment(meta.model || "") +
    "\n" +
    "  plugin:   " +
    maskComment(meta.pluginVersion || "") +
    "\n" +
    "-->";

  var featureName = esc(meta.feature || meta.flow || "Flow");

  // Use FUNCTION replacers everywhere so '$' inside CSS/JS/screens is not
  // interpreted as a replacement pattern by String.replace.
  // Strip the ASSEMBLER-STRIP-BEGIN…END block (developer-guidance comment that
  // has no runtime value in the shareable deliverable).
  var html = wrapper.replace(
    /[ \t]*<!--\s*ASSEMBLER-STRIP-BEGIN[\s\S]*?ASSEMBLER-STRIP-END\s*-->\s*\n?/,
    function () {
      return "";
    },
  );
  return html
    .replace("{{META_COMMENT}}", function () {
      return metaComment;
    })
    .replace(/\{\{FEATURE_NAME\}\}/g, function () {
      return featureName;
    })
    .replace("{{SHARE_META}}", function () {
      return esc(shareMeta);
    })
    .replace("{{FLOW_CSS}}", function () {
      return flowCss;
    })
    .replace("{{INLINE_ALPINE}}", function () {
      return alpine;
    })
    .replace("{{SCREENS_ARRAY}}", function () {
      return navJson;
    })
    .replace("<!-- {{SCREENS}} -->", function () {
      return screensHtml;
    });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { assembleFlowShare: assembleFlowShare };
