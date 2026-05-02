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
 *
 * Output: A single self-contained HTML file with all CSS, JS, and data inlined.
 * Logs:   Progress messages to stderr.
 */

var fs = require("fs");
var path = require("path");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

var PLUGIN_ROOT = path.resolve(__dirname, "..");

var TEMPLATES_DIR = path.join(PLUGIN_ROOT, "templates");
var RENDERERS_DIR = path.join(PLUGIN_ROOT, "scripts", "html-renderers");

// ---------------------------------------------------------------------------
// Type configurations
// ---------------------------------------------------------------------------

var TYPE_CONFIGS = {
  flow: {
    css: [
      path.join(RENDERERS_DIR, "fm-base.css"),
      path.join(RENDERERS_DIR, "flow-renderer.css"),
    ],
    renderers: [
      path.join(RENDERERS_DIR, "fm-html-map.js"),
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
    css: [path.join(RENDERERS_DIR, "presentation-renderer.css")],
    renderers: [path.join(RENDERERS_DIR, "presentation-renderer.js")],
    containerHtml: '<div id="deck-container"></div>',
    fonts: "Roboto:wght@400;500;700",
    title: function (data) {
      var meta = data.meta || {};
      return (meta.title || "Presentation") + " \u2014 Presentation";
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

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  var args = { input: null, type: null, output: null, annotations: true };
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
          ],
          types: Object.keys(TYPE_CONFIGS),
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

  var config = TYPE_CONFIGS[args.type];
  if (!config) {
    process.stderr.write(
      'ERROR: Unknown type "' +
        args.type +
        '". Must be one of: flow, brief, presentation.\n',
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
  var cssParts = [];
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

  // Assemble HTML
  var html =
    "<!DOCTYPE html>\n" +
    '<html lang="en">\n' +
    "<head>\n" +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
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
    "</body>\n" +
    "</html>\n";

  // Write output
  var outputDir = path.dirname(args.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(args.output, html, "utf8");

  var size = Buffer.byteLength(html, "utf8");
  process.stderr.write(
    "Done: " + args.output + " (" + (size / 1024).toFixed(1) + " KB)\n",
  );
}

main();
