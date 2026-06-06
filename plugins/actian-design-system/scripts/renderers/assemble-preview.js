#!/usr/bin/env node
"use strict";

/**
 * assemble-preview.js — Assembles self-contained HTML preview files
 * from a data JSON file + static assets (CSS, renderers, annotation layer).
 *
 * Usage:
 *   node scripts/assemble-preview.js <data.json> --type <flow-share|brief|presentation> -o <output.html>
 *
 * Supported types:
 *   flow-share    — CANONICAL deliverable: self-contained two-view file
 *                   (clickable Prototype + all-screens Overview; inlines Alpine +
 *                   flow CSS; fully offline). This is the default streaming target
 *                   and the shareable output for the generate-flow pipeline.
 *   flow          — INTERNAL strip renderer retained for streaming-fallback and
 *                   existing tests; NOT the canonical pipeline output.
 *                   (fm-flow.css, fm-html-map + flow-renderer)
 *   brief         — Component brief preview (fm-brief.css, fm-html-map + brief-renderer)
 *   presentation  — DS presentation preview (ds-presentation.css, presentation-renderer)
 *
 * Output: A single self-contained HTML file with all CSS, JS, and data inlined.
 * Logs:   Progress messages to stderr.
 */

var fs = require("fs");
var path = require("path");
var PATHS = require("../lib/paths");
var shared = require("./assemble-shared");

// ---------------------------------------------------------------------------
// Paths (via shared module)
// ---------------------------------------------------------------------------

var TEMPLATES_DIR = shared.TEMPLATES_DIR;
var RENDERERS_DIR = shared.RENDERERS_DIR;
var FIGMA_TABLE_DIR = shared.FIGMA_TABLE_DIR;

var readFileChecked = shared.readFileChecked;
var escapeJsonForScript = shared.escapeJsonForScript;

// ---------------------------------------------------------------------------
// Type configurations
// ---------------------------------------------------------------------------

var TYPE_CONFIGS = {
  flow: {
    css: shared.FLOW_CSS,
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
      return (meta.feature || "Flow") + " — " + (meta.app || "Preview");
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
        " — Component Brief"
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
      return (meta.title || "Presentation") + " — Presentation";
    },
  },
};

// ---------------------------------------------------------------------------
// Annotation layer paths (shared across all types)
// ---------------------------------------------------------------------------

var ANNOTATION_CSS = path.join(TEMPLATES_DIR, "annotation-layer.css");
var ANNOTATION_JS = path.join(TEMPLATES_DIR, "annotation-layer.js");
var ANNOTATION_HTML = path.join(TEMPLATES_DIR, "annotation-layer-markup.html");

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
              description:
                "Preview type. Canonical deliverable: flow-share (two-view encapsulated offline file). " +
                "Internal/fallback renderer: flow. Also: brief, presentation.",
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
          types: ["flow-share"].concat(Object.keys(TYPE_CONFIGS)),
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
      "Usage: node scripts/assemble-preview.js <data.json> --type <flow-share|brief|presentation> -o <output.html>\n",
    );
    process.exit(1);
  }
  if (!args.type) {
    process.stderr.write("ERROR: Missing --type argument.\n");
    process.stderr.write(
      "Usage: node scripts/assemble-preview.js <data.json> --type <flow-share|brief|presentation> -o <output.html>\n",
    );
    process.exit(1);
  }
  if (!args.output) {
    process.stderr.write("ERROR: Missing -o / --output argument.\n");
    process.stderr.write(
      "Usage: node scripts/assemble-preview.js <data.json> --type <flow-share|brief|presentation> -o <output.html>\n",
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
    var assembleFlowShare =
      require("./assemble-flow-share.js").assembleFlowShare;
    writeOutput(args.output, assembleFlowShare(shareData));
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
