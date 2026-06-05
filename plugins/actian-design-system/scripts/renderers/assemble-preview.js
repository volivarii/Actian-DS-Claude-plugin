#!/usr/bin/env node
"use strict";

/**
 * assemble-preview.js — Assembles self-contained HTML preview files
 * from a data JSON file + static assets (CSS, renderers, annotation layer).
 *
 * Usage:
 *   node scripts/assemble-preview.js <data.json> --type <flow|brief|presentation> -o <output.html>
 *
 * Supported types:
 *   flow          — FM flow preview (fm-flow.css, fm-html-map + flow-renderer)
 *   brief         — Component brief preview (fm-brief.css, fm-html-map + brief-renderer)
 *   presentation  — DS presentation preview (ds-presentation.css, presentation-renderer)
 *   flow-share    — Self-contained shareable flow deliverable (two views:
 *                   Prototype + Overview; inlines Alpine + flow CSS; offline)
 *
 * Output: A single self-contained HTML file with all CSS, JS, and data inlined.
 * Logs:   Progress messages to stderr.
 */

var fs = require("fs");
var path = require("path");
var PATHS = require("../lib/paths");

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

var WRAPPER_PATH = path.join(TEMPLATES_DIR, "flow-prototype-wrapper.html");
var VENDOR_ALPINE = path.join(
  TEMPLATES_DIR,
  "vendor",
  "alpinejs-3.14.9.min.js",
);

// ---------------------------------------------------------------------------
// Type configurations
// ---------------------------------------------------------------------------

var TYPE_CONFIGS = {
  flow: {
    css: [
      path.join(RENDERERS_DIR, "fm-base.css"),
      path.join(RENDERERS_DIR, "render-node.css"),
      path.join(RENDERERS_DIR, "flow-renderer.css"),
    ],
    renderers: [
      path.join(RENDERERS_DIR, "fm-html-map.js"),
      // render-node.js UMD must load BEFORE flow-renderer.js so the IIFE can
      // pick it up via window.renderNode (shared structural-node renderer).
      path.join(RENDERERS_DIR, "render-node.js"),
      path.join(RENDERERS_DIR, "flow-renderer.js"),
    ],
    containerHtml: '<div id="flow-container"></div>',
    fonts: "Inter:wght@400;500;600;700",
    title: function (data) {
      var meta = data.meta || {};
      return (meta.feature || "Flow") + " \u2014 " + (meta.app || "Preview");
    },
  },
  brief: {
    css: [
      path.join(RENDERERS_DIR, "fm-base.css"),
      path.join(RENDERERS_DIR, "brief-renderer.css"),
    ],
    renderers: [
      path.join(RENDERERS_DIR, "fm-html-map.js"),
      // renderTableHtml UMD must load BEFORE brief-renderer.js so the IIFE
      // can pick it up via window.renderTableHtml during card rendering.
      path.join(FIGMA_TABLE_DIR, "render-html.js"),
      path.join(RENDERERS_DIR, "brief-renderer.js"),
    ],
    containerHtml:
      '<div class="brief-row"><div id="cards-container"></div></div>',
    fonts: "Inter:wght@400;500;600;700",
    title: function (data) {
      var header = data.card_header || data.card1_header || {};
      return (
        (header.componentName || header.name || "Component") +
        " \u2014 Component Brief"
      );
    },
  },
  presentation: {
    css: [
      path.join(RENDERERS_DIR, "render-node.css"),
      path.join(RENDERERS_DIR, "presentation-renderer.css"),
    ],
    renderers: [
      // render-node.js UMD must load BEFORE presentation-renderer.js so the
      // IIFE can pick it up via window.renderNode (shared structural-node
      // renderer). render-node carries its own esc fallback, so fm-html-map is
      // not required here; INSTANCE nodes (rare in decks) render empty as they
      // did before, since this bundle ships no fm-html-map.
      path.join(RENDERERS_DIR, "render-node.js"),
      path.join(RENDERERS_DIR, "presentation-renderer.js"),
    ],
    containerHtml: '<div id="deck-container"></div>',
    fonts: "Roboto:wght@400;500;700",
    title: function (data) {
      var meta = data.meta || {};
      return (meta.title || "Presentation") + " \u2014 Presentation";
    },
  },
};

// flow-share reuses the flow type's CSS set \u2014 derive from the single source of
// truth (TYPE_CONFIGS.flow.css) so the two never drift. Must come AFTER the
// TYPE_CONFIGS literal so the reference resolves.
var FLOW_CSS_FILES = TYPE_CONFIGS.flow.css;

// ---------------------------------------------------------------------------
// Annotation layer paths (shared across all types)
// ---------------------------------------------------------------------------

var ANNOTATION_CSS = path.join(TEMPLATES_DIR, "annotation-layer.css");
var ANNOTATION_JS = path.join(TEMPLATES_DIR, "annotation-layer.js");
var ANNOTATION_HTML = path.join(TEMPLATES_DIR, "annotation-layer-markup.html");

// ---------------------------------------------------------------------------
// Helpers
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

// Prevent meta values from closing the leading HTML comment early.
function maskComment(s) {
  return String(s == null ? "" : s).replace(/--/g, "-​-");
}

function escAttr(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  var args = {
    input: null,
    type: null,
    output: null,
    annotations: true,
    refresh: 0,
  };
  var positionals = [];
  var i = 2; // skip node + script

  while (i < argv.length) {
    var arg = argv[i];
    if (arg === "--type" && i + 1 < argv.length) {
      args.type = argv[++i];
    } else if ((arg === "-o" || arg === "--output") && i + 1 < argv.length) {
      args.output = argv[++i];
    } else if (arg === "--no-annotations") {
      args.annotations = false;
    } else if (arg === "--refresh" && i + 1 < argv.length) {
      args.refresh = parseFloat(argv[++i]);
    } else if (arg.charAt(0) !== "-") {
      positionals.push(arg);
    }
    i++;
  }

  if (positionals.length > 0) {
    args.input = positionals[0];
  }

  return args;
}

// ---------------------------------------------------------------------------
// Atomic write helper (shared by all assembly paths)
// ---------------------------------------------------------------------------

function writeOutput(outputPath, html) {
  // Write atomically (tmp sibling + rename): a 2s browser reload / Cowork panel
  // watch must never catch a half-written file. Fall back to a direct write.
  var outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  var tmpPath = outputPath + ".tmp";
  try {
    fs.writeFileSync(tmpPath, html, "utf8");
    fs.renameSync(tmpPath, outputPath);
  } catch (e) {
    process.stderr.write(
      "WARN: atomic rename failed (" + e.message + "); writing directly.\n",
    );
    fs.writeFileSync(outputPath, html, "utf8");
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch (e2) {
      /* ignore */
    }
  }
  var size = Buffer.byteLength(html, "utf8");
  process.stderr.write(
    "Done: " + outputPath + " (" + (size / 1024).toFixed(1) + " KB)\n",
  );
}

// ---------------------------------------------------------------------------
// flow-share assembler
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
  var cssParts = [readFileChecked(PATHS.tokens.css)];
  for (var i = 0; i < FLOW_CSS_FILES.length; i++) {
    cssParts.push(readFileChecked(FLOW_CSS_FILES[i]));
  }
  var flowCss = cssParts.join("\n");

  // Server-render each screen into a .proto-screen-cell. The cell is a click
  // target in Overview (enter that screen); display:contents in Prototype.
  var screensHtml = "";
  var navArray = [];
  for (var s = 0; s < screens.length; s++) {
    var id = s + 1;
    navArray.push({ id: id, label: screens[s].name || "Screen " + id });
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
      renderScreen(screens[s]) +
      "</div></div>\n";
  }
  var navJson = escapeJsonForScript(JSON.stringify(navArray));

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

  var featureName = escAttr(meta.feature || meta.flow || "Flow");

  // Use FUNCTION replacers everywhere so '$' inside CSS/JS/screens is not
  // interpreted as a replacement pattern by String.replace.
  // Strip the template-instruction comment block (contains example markup that
  // would confuse screen-count checks; it has no runtime value in the deliverable).
  var html = wrapper.replace(
    /[ \t]*<!--\s*═[\s\S]*?═+\s*-->\s*\n?/,
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
      return escAttr(shareMeta);
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
// Main
// ---------------------------------------------------------------------------

function main() {
  var args = parseArgs(process.argv);

  if (process.argv.indexOf("--help") !== -1) {
    process.stdout.write(
      JSON.stringify(
        {
          name: "assemble-preview",
          description:
            "Assembles self-contained HTML preview from data JSON + static assets.",
          flags: [
            {
              name: "--type",
              required: true,
              description: "Preview type: flow, brief, or presentation",
            },
            {
              name: "-o",
              required: true,
              description: "Output HTML file path",
            },
            { name: "--output", required: true, description: "Alias for -o" },
            {
              name: "--no-annotations",
              required: false,
              description: "Skip annotation layer (Alpine.js + UI)",
            },
            {
              name: "--refresh",
              required: false,
              description:
                "Inject a self-contained auto-reload (meta + JS) every N seconds; 0/absent = off",
            },
          ],
          types: Object.keys(TYPE_CONFIGS).concat(["flow-share"]),
        },
        null,
        2,
      ) + "\n",
    );
    process.exit(0);
  }

  // Validate required args
  if (!args.input) {
    process.stderr.write("ERROR: Missing input JSON file.\n");
    process.stderr.write(
      "Usage: node scripts/assemble-preview.js <data.json> --type <flow|brief|presentation> -o <output.html>\n",
    );
    process.exit(1);
  }
  if (!args.type) {
    process.stderr.write("ERROR: Missing --type argument.\n");
    process.stderr.write(
      "Usage: node scripts/assemble-preview.js <data.json> --type <flow|brief|presentation> -o <output.html>\n",
    );
    process.exit(1);
  }
  if (!args.output) {
    process.stderr.write("ERROR: Missing -o / --output argument.\n");
    process.stderr.write(
      "Usage: node scripts/assemble-preview.js <data.json> --type <flow|brief|presentation> -o <output.html>\n",
    );
    process.exit(1);
  }

  if (args.type === "flow-share") {
    process.stderr.write("Reading data: " + args.input + "\n");
    if (!fs.existsSync(args.input)) {
      process.stderr.write("ERROR: Input file not found: " + args.input + "\n");
      process.exit(1);
    }
    var shareData = JSON.parse(fs.readFileSync(args.input, "utf8"));
    var shareHtml = assembleFlowShare(shareData);
    writeOutput(args.output, shareHtml);
    return;
  }

  var config = TYPE_CONFIGS[args.type];
  if (!config) {
    process.stderr.write(
      'ERROR: Unknown type "' +
        args.type +
        '". Must be one of: flow, brief, presentation, flow-share.\n',
    );
    process.exit(1);
  }

  // Read input JSON
  process.stderr.write("Reading data: " + args.input + "\n");
  if (!fs.existsSync(args.input)) {
    process.stderr.write("ERROR: Input file not found: " + args.input + "\n");
    process.exit(1);
  }
  var rawJson = fs.readFileSync(args.input, "utf8");
  var data = JSON.parse(rawJson);

  // Derive title
  var title = config.title(data);

  // Read static assets
  process.stderr.write("Loading assets for type: " + args.type + "\n");
  var cssParts = [readFileChecked(PATHS.tokens.css)];
  var cssPaths = Array.isArray(config.css) ? config.css : [config.css];
  for (var c = 0; c < cssPaths.length; c++) {
    cssParts.push(readFileChecked(cssPaths[c]));
  }
  var cssContent = cssParts.join("\n");

  var rendererScripts = "";
  for (var r = 0; r < config.renderers.length; r++) {
    var rendererPath = config.renderers[r];
    var rendererSrc = readFileChecked(rendererPath);
    var filename = path.basename(rendererPath);
    rendererScripts +=
      "  <script>\n  /* " +
      filename +
      " */\n" +
      rendererSrc +
      "\n  </script>\n";
  }

  var annotationCss = args.annotations ? readFileChecked(ANNOTATION_CSS) : "";
  var annotationJs = args.annotations ? readFileChecked(ANNOTATION_JS) : "";
  var annotationHtml = args.annotations ? readFileChecked(ANNOTATION_HTML) : "";

  // Escape JSON for embedding
  // No transform needed — all renderers read the same format as their *-to-figma.js counterparts
  var escapedJson = escapeJsonForScript(rawJson);

  // Self-contained auto-reload (no server). Off unless --refresh <positive seconds>.
  // meta-refresh covers static panels; the setTimeout is a JS fallback. Both are
  // deterministic given the interval (no timestamps/randomness) so goldens are stable.
  var refreshSecs =
    typeof args.refresh === "number" && args.refresh > 0 ? args.refresh : 0;
  var refreshHead = refreshSecs
    ? '  <meta http-equiv="refresh" content="' + refreshSecs + '">\n'
    : "";
  var refreshBody = refreshSecs
    ? "  <script>setTimeout(function(){location.reload();}, " +
      Math.round(refreshSecs * 1000) +
      ");</script>\n"
    : "";

  // Assemble HTML
  var html =
    "<!DOCTYPE html>\n" +
    '<html lang="en">\n' +
    "<head>\n" +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    refreshHead +
    "  <title>" +
    title +
    "</title>\n" +
    '  <link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '  <link href="https://fonts.googleapis.com/css2?family=' +
    config.fonts +
    '&display=swap" rel="stylesheet">\n' +
    "  <style>\n" +
    cssContent +
    "\n  </style>\n" +
    "</head>\n" +
    "<body>\n" +
    '  <script id="spec-data" type="application/json">' +
    escapedJson +
    "</script>\n" +
    "  " +
    config.containerHtml +
    "\n" +
    rendererScripts +
    (args.annotations
      ? '  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/cdn.min.js"></script>\n' +
        "  <style>\n" +
        annotationCss +
        "\n  </style>\n" +
        "  <script>\n" +
        annotationJs +
        "\n  </script>\n" +
        "  " +
        annotationHtml +
        "\n"
      : "") +
    refreshBody +
    "</body>\n" +
    "</html>\n";

  writeOutput(args.output, html);
}

main();
