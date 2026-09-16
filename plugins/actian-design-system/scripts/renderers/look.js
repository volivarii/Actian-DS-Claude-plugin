#!/usr/bin/env node
"use strict";

/**
 * look.js — side-by-side "look" tool (catalog-quality Task 7.2).
 *
 * Renders one screen of a flow-data JSON through the same renderer the
 * flow-share deliverable uses (flow-renderer.js's renderScreen /
 * renderLayered), screenshots it at 1440x960, and writes a two-column HTML
 * page next to the vendored product capture it is being compared against.
 * This is a look, not a pixel diff: the deliverable is a page a person (or
 * the gate step in references/generate-flow/gates.md) reads and describes
 * "what differs, three lines" from.
 *
 * CLI: look.js <flow.json> --screen <n> --against <png> -o <dir>
 *   Writes <dir>/look-<n>.png (the render) and <dir>/look-<n>.html (the
 *   side-by-side page). Exits 1 on a usage/input error, 2 with the
 *   resolver's message when Chrome is absent.
 *
 * The input must be a flow-data JSON (a "*.flow.json" or any parsed
 * { meta, screens[] } file) — the assembled flow-share HTML bundles every
 * screen into one Alpine app with no per-screen URL, so there is no
 * `?screen=n` to screenshot; pass the flow-data JSON instead.
 */

var fs = require("fs");
var os = require("os");
var path = require("path");

var PATHS = require("../lib/paths");
var assembleShared = require("./assemble-shared");
var defaultRenderLeaf = require("../fidelity/render-leaf.js");
var defaultResolveBinaries = require("../fidelity/resolve-binaries.js");

// ---------------------------------------------------------------------------
// Pure builder — the side-by-side page
// ---------------------------------------------------------------------------

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildLookHtml(opts) {
  opts = opts || {};
  var renderPng = opts.renderPng || "";
  var againstPng = opts.againstPng || "";
  var title = opts.title || "Look";
  return (
    "<!doctype html><html><head><meta charset=\"utf-8\">" +
    "<title>Look: " +
    esc(title) +
    "</title>" +
    "<style>" +
    "body{margin:0;padding:24px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a}" +
    "h1{font-size:16px;margin:0 0 16px}" +
    ".look-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}" +
    ".look-grid h2{font-size:13px;margin:0 0 8px;color:#555}" +
    ".look-grid img{max-width:100%;display:block;border:1px solid #ccc;background:#fff}" +
    "h3{font-size:13px;margin:24px 0 8px}" +
    "ol{font-size:13px;line-height:1.6}" +
    "</style></head><body>" +
    "<h1>" +
    esc(title) +
    "</h1>" +
    "<div class=\"look-grid\">" +
    "<div><h2>Render</h2><img src=\"" +
    esc(renderPng) +
    "\" alt=\"Render\"></div>" +
    "<div><h2>Product</h2><img src=\"" +
    esc(againstPng) +
    "\" alt=\"Product\"></div>" +
    "</div>" +
    "<h3>What differs, three lines</h3>" +
    "<ol><li></li><li></li><li></li></ol>" +
    "</body></html>"
  );
}

// ---------------------------------------------------------------------------
// Render — one screen, standalone, through the same renderer flow-share uses
// ---------------------------------------------------------------------------

// Reads the same CSS assemble-flow-share.js inlines (tokens first, then
// FLOW_CSS in its documented order): reused via assemble-shared.js's
// exports, never re-read from a copy.
function readFlowCss() {
  var cssParts = [assembleShared.readFileChecked(PATHS.tokens.css)].concat(
    assembleShared.FLOW_CSS.map(assembleShared.readFileChecked),
  );
  return cssParts.join("\n");
}

// Renders screen `n` (1-based) of `flowData` to an HTML fragment, exactly
// the way assemble-flow-share.js renders each screen: same per-screen
// `library` defaulting, the same anatomy-doc-map / variant-style-map
// injection around the call (assemble-shared.js's withDsMaps, shared with
// assemble-flow-share.js so the setup and reset sequence lives in one
// place), and the same layer-vs-plain dispatch (a layered screen renders
// over its base, looked up by id).
function renderScreenFragment(flowData, n) {
  var screens = Array.isArray(flowData.screens) ? flowData.screens : [];
  var idx = n - 1;
  if (idx < 0 || idx >= screens.length) {
    throw new Error(
      "--screen " + n + " out of range (flow has " + screens.length + " screen(s))",
    );
  }

  var meta = flowData.meta || {};
  var metaLibrary =
    meta.library ||
    (meta._glossary && meta._glossary.library) ||
    (meta.hifi ? "ds" : null) ||
    (meta.mode === "hifi" ? "ds" : null);
  var procScreens = screens.map(function (sc) {
    return metaLibrary && !sc.library ? Object.assign({}, sc, { library: metaLibrary }) : sc;
  });
  var screenById = {};
  procScreens.forEach(function (sc) {
    if (sc.id) screenById[sc.id] = sc;
  });

  var flowRenderer = require("./html-renderers/flow-renderer.js");
  var sc = procScreens[idx];
  var html = assembleShared.withDsMaps(flowData, function () {
    return sc.layer && screenById[sc.layer.over]
      ? flowRenderer.renderLayered(sc, screenById[sc.layer.over])
      : flowRenderer.renderScreen(sc);
  });
  return { html: html, screen: sc };
}

function buildStandalonePage(screenHtml, flowCss) {
  return (
    "<!doctype html><html><head><meta charset=\"utf-8\">" +
    "<style>" +
    flowCss +
    "</style><style>body{margin:0;padding:0;background:#fff}</style>" +
    "</head><body>" +
    screenHtml +
    "</body></html>"
  );
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

var USAGE = "usage: look.js <flow.json> --screen <n> --against <png> -o <dir>\n";

function parseArgs(argv) {
  var flowPath = null,
    screen = 1,
    against = null,
    outDir = null;
  for (var i = 0; i < argv.length; i++) {
    var a = argv[i];
    if (a === "--screen") {
      screen = parseInt(argv[++i], 10);
    } else if (a === "--against") {
      against = argv[++i];
    } else if (a === "-o") {
      outDir = argv[++i];
    } else if (a.indexOf("-") !== 0 && flowPath === null) {
      flowPath = a;
    }
  }
  return { flowPath: flowPath, screen: screen, against: against, outDir: outDir };
}

function main(argv, deps) {
  deps = deps || {};
  var renderLeaf = deps.renderLeaf || defaultRenderLeaf;
  var resolveBinaries = deps.resolveBinaries || defaultResolveBinaries;

  var parsed = parseArgs(argv);
  if (!parsed.flowPath || !parsed.against || !parsed.outDir || !parsed.screen) {
    process.stderr.write(USAGE);
    return 1;
  }
  if (path.extname(parsed.flowPath) !== ".json") {
    process.stderr.write(
      "look: expected a flow-data .json path — the assembled flow-share HTML " +
        "bundles every screen with no per-screen URL, so ?screen=n cannot be " +
        "screenshotted; pass the flow-data JSON instead.\n",
    );
    return 1;
  }

  // Chrome is the fast-fail precondition, checked before touching the flow
  // file, so a missing browser is reported the same way on any input.
  var resolved = resolveBinaries.resolveAll();
  try {
    resolveBinaries.requireAll(resolved);
  } catch (e) {
    process.stderr.write(e.message + "\n");
    return 2;
  }

  var flowData;
  try {
    flowData = JSON.parse(fs.readFileSync(parsed.flowPath, "utf8"));
  } catch (e) {
    process.stderr.write("look: cannot read " + parsed.flowPath + ": " + e.message + "\n");
    return 1;
  }

  var rendered;
  try {
    rendered = renderScreenFragment(flowData, parsed.screen);
  } catch (e) {
    process.stderr.write("look: " + e.message + "\n");
    return 1;
  }

  fs.mkdirSync(parsed.outDir, { recursive: true });

  var page = buildStandalonePage(rendered.html, readFlowCss());
  var tmpHtml = path.join(
    os.tmpdir(),
    "look-render-" + process.pid + "-" + Date.now() + ".html",
  );
  var outPng = path.join(parsed.outDir, "look-" + parsed.screen + ".png");
  fs.writeFileSync(tmpHtml, page);
  try {
    renderLeaf.screenshot({
      chrome: resolved.chrome,
      htmlPath: tmpHtml,
      outPng: outPng,
      width: 1440,
      height: 960,
    });
  } catch (e) {
    process.stderr.write("look: " + e.message + "\n");
    return 1;
  } finally {
    try {
      fs.unlinkSync(tmpHtml);
    } catch (_) {
      // best-effort cleanup of the transient standalone render page
    }
  }

  var title = (rendered.screen && rendered.screen.name) || "Screen " + parsed.screen;
  var outDirAbs = path.resolve(parsed.outDir);
  var lookHtml = buildLookHtml({
    renderPng: "look-" + parsed.screen + ".png",
    againstPng: path.relative(outDirAbs, path.resolve(parsed.against)),
    title: title,
  });
  var outHtmlPath = path.join(parsed.outDir, "look-" + parsed.screen + ".html");
  fs.writeFileSync(outHtmlPath, lookHtml);

  process.stdout.write("look: wrote " + outPng + " and " + outHtmlPath + "\n");
  return 0;
}

module.exports = {
  buildLookHtml: buildLookHtml,
  renderScreenFragment: renderScreenFragment,
  buildStandalonePage: buildStandalonePage,
  readFlowCss: readFlowCss,
  parseArgs: parseArgs,
  main: main,
};

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
