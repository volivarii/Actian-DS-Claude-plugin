"use strict";

/**
 * assemble-flow-share.js — Assembles a self-contained shareable flow
 * deliverable (two views: Prototype + Overview; inlines Alpine + flow CSS;
 * offline-safe).
 *
 * No side effects at load (no main, no process.exit at module level).
 * Exported: assembleFlowShare(data) → html string.
 *
 * F2 determination (real icon glyphs): unlike assemble-preview.js
 * (--type flow), this deliverable does NOT re-render DS instances
 * client-side. Every screen is rendered server-side in Node below
 * (renderScreen), and the resulting static HTML is spliced straight into
 * templates/flow-prototype-wrapper.html, whose only <script> block is the
 * inlined Alpine.js (view/nav toggling — no DOM re-render of DS content). No
 * appearance-style.js / appearance-render.js / ds-html-map.js script tags,
 * no window.__dsAnatomyDocs, and no window.dsIcons are ever embedded here.
 * So appearance-render.js's icon glyphs resolve entirely through its Node
 * dual-source branch (guarded require of the vendored icons.json) at
 * server-render time — assemble-shared.js's buildDsIconsScript() (which
 * assemble-preview.js injects for its browser bundle) is NOT needed for this
 * deliverable, and should not be added here.
 */

var path = require("path");
var PATHS = require("../lib/paths");
var shared = require("./assemble-shared");
var esc = require("../lib/renderer.js").fmHtmlMap.esc;

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
  var renderLayered = flowRenderer.renderLayered;

  // Hi-fi anatomy tier: this deliverable pre-renders each screen server-side in
  // Node (no `window`), so the assemble-time anatomy doc map for non-override
  // DS slugs must be injected into the renderer module rather than embedded
  // for the browser. Build it from the flow-data (content-shaped) and inject;
  // the loop below resets it in a finally so module state never leaks across
  // calls.
  var renderer = require("../lib/renderer.js");
  var dsHtmlMap = renderer.dsHtmlMap;
  var anatomyHelpers = renderer.dsAnatomyMap;
  var dsSlugs = anatomyHelpers.collectDsSlugs(data);
  // Phase 1B: anatomy DOC map (raw parsed docs, not pre-rendered HTML) for the
  // default: seam's appearance-aware render path — each instance's own variant
  // selects the right captured colors. (The legacy slug→pre-rendered-HTML
  // anatomy map — "path c" — was retired in Group C.)
  var docMap = anatomyHelpers.buildDsAnatomyDocMap(dsSlugs);
  // Token-injection tier (slice 1: read-only-tag): { anatomyVariantKey ->
  // inline-style-string } for delegated slugs, so their hand-authored
  // templates render with the harvested variant-correct token instead of
  // being replaced by anatomy HTML.
  var variantStyleMap = anatomyHelpers.buildDsVariantStyleMap(data);

  // Assets (fail loudly if missing — same contract as readFileChecked).
  var wrapper = readFileChecked(WRAPPER_PATH);
  var alpine = readFileChecked(VENDOR_ALPINE);
  var cssParts = [readFileChecked(PATHS.tokens.css)].concat(
    FLOW_CSS.map(readFileChecked),
  );
  var flowCss = cssParts.join("\n");

  // Flow-level hi-fi signal → per-screen library flag.
  // Sources (in priority order):
  //   1. meta.library:"ds"    — generate-flow skill stamps this for DS-native flows
  //                             (being wired this week); direct and authoritative.
  //   2. meta._glossary.library — legacy glossary path, kept for back-compat.
  //   3. meta.hifi:true       — older boolean shorthand; maps to "ds".
  //   4. meta.mode:"hifi"     — /convert-to-hifi transform output carries this signal
  //                             (transform-to-hifi.js stamps mode, not library).
  // Authored per-screen `library` always wins (screen-level overrides meta-level).
  var metaLibrary =
    meta.library ||
    (meta._glossary && meta._glossary.library) ||
    (meta.hifi ? "ds" : null) || // legacy boolean — kept for back-compat with older flow files
    (meta.mode === "hifi" ? "ds" : null);

  // Server-render each screen into a .proto-screen-cell. The cell is a click
  // target in Overview (enter that screen); display:contents in Prototype.
  var screensHtml = "";
  var navArray = [];
  // Resolve the per-screen library flag up front (same rule as inside the
  // loop below) so the base-screen lookup for a layered screen sees the
  // same augmented screen the base would render as on its own turn.
  var procScreens = screens.map(function (sc) {
    return metaLibrary && !sc.library
      ? Object.assign({}, sc, { library: metaLibrary })
      : sc;
  });
  var screenById = {};
  for (var bi = 0; bi < procScreens.length; bi++) {
    if (procScreens[bi].id) screenById[procScreens[bi].id] = procScreens[bi];
  }
  dsHtmlMap.setAnatomyDocMap(docMap);
  dsHtmlMap.setVariantStyleMap(variantStyleMap);
  try {
    for (var s = 0; s < procScreens.length; s++) {
      var id = s + 1;
      var sc = procScreens[s];
      navArray.push({ id: id, key: sc.id || "", label: sc.name || "Screen " + id });
      // A layered screen whose `over` target is missing renders as a plain
      // screen rather than throwing; the validator (Task 6.2) already
      // reports the missing target as an error.
      var screenHtml =
        sc.layer && screenById[sc.layer.over]
          ? renderLayered(sc, screenById[sc.layer.over])
          : renderScreen(sc);
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
        screenHtml +
        "</div></div>\n";
    }
  } finally {
    // Reset module-level state so it never leaks into a later assembly.
    dsHtmlMap.setAnatomyDocMap(null);
    dsHtmlMap.setVariantStyleMap(null);
  }
  // navJson sits inside a double-quoted HTML attribute (x-data="{ screens: … }").
  // esc (not escapeJsonForScript) is required: a bare " in a screen name would
  // truncate the attribute and allow markup injection.
  var navJson = esc(JSON.stringify(navArray));

  // Audience-safe visible meta (NO prompt, NO model).
  var shareMeta = [
    meta.app || "",
    String(meta.generatedAt || meta.date || "").slice(0, 10),
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
    maskComment(String(meta.generatedAt || meta.date || "").slice(0, 10)) +
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

  // Lo-fi skin (Task 3.4): meta.skin === "lofi" scans the SAME tokens CSS
  // string already inlined for {{FLOW_CSS}} (flowCss, not just the tokens
  // slice of it) for --zen-* hex declarations and emits a
  // [data-skin="lofi"] {...} override block + the FM placeholder rules.
  // Off (meta.skin unset/other), both markers resolve to empty strings.
  var skinOn = meta.skin === "lofi";
  var skinCss = skinOn ? require("./lofi-skin.js").lofiSkinCss(flowCss) : "";

  // Additions cover (Task 6.4): every screen's adds[] entry (Task 6.1
  // schema, declared per screen and rung in the render by Task 6.3) is
  // listed once on the deliverable's cover so a reader sees what the flow
  // invents without opening each screen.
  var addsHtml = screens.reduce(function (acc, s) {
    return acc.concat(
      (s.adds || []).map(function (a) {
        return (
          "<li><strong>" +
          esc(a.name) +
          "</strong> from " +
          esc((a.composedFrom || []).join(", ")) +
          (a.newPrimitives && a.newPrimitives.length
            ? "; new: " + esc(a.newPrimitives.join(", "))
            : "") +
          " (" +
          esc(s.name) +
          ")</li>"
        );
      }),
    );
  }, []);
  var addsBlock = addsHtml.length
    ? '<details class="proto-adds"><summary>This flow adds ' +
      addsHtml.length +
      "</summary><ul>" +
      addsHtml.join("") +
      "</ul></details>"
    : "";

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
    .replace("{{SKIN_CSS}}", function () {
      return skinCss;
    })
    .replace("{{SKIN_ATTR}}", function () {
      return skinOn ? ' data-skin="lofi"' : "";
    })
    .replace("{{ADDS_BLOCK}}", function () {
      return addsBlock;
    })
    .replace("<!-- {{SCREENS}} -->", function () {
      return screensHtml;
    });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { assembleFlowShare: assembleFlowShare };
