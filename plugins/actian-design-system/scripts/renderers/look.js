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
 * "what differs in structure, three lines" from. The product screenshot is
 * a reference for page structure only, never appearance: the render draws
 * the design system's Figma components on purpose, and production may
 * still show older ones, so a styling difference is never a defect.
 *
 * CLI: look.js <flow.json> --screen <n> --against <png> -o <dir>
 *      look.js <flow.json> --brief <brief.json> -o <dir>
 *   Writes <dir>/look-<n>.png (the render) and <dir>/look-<n>.html (the
 *   side-by-side page) for each screen. --brief pairs every screen whose
 *   page recipe carries a product screenshot; with no such screen, exits 0
 *   with a message and writes nothing. Exits 1 on a usage/input error, 2
 *   with the resolver's message when Chrome is absent.
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
    '<!doctype html><html><head><meta charset="utf-8">' +
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
    "p{font-size:13px;line-height:1.5;color:#444;margin:0 0 8px}" +
    "ol{font-size:13px;line-height:1.6}" +
    "</style></head><body>" +
    "<h1>" +
    esc(title) +
    "</h1>" +
    '<div class="look-grid">' +
    '<div><h2>Render (design system components)</h2><img src="' +
    esc(renderPng) +
    '" alt="Render"></div>' +
    '<div><h2>Product (page structure)</h2><img src="' +
    esc(againstPng) +
    '" alt="Product"></div>' +
    "</div>" +
    "<h3>What differs in structure, three lines</h3>" +
    "<p>Compare the regions, their order, the kind of surface and how full the lists are. " +
    "Ignore colour, type, spacing and component styling: the render draws the design system's " +
    "components on purpose, and the product may still show older ones. A region the flow " +
    "added or changed on purpose is not a difference.</p>" +
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
      "--screen " +
        n +
        " out of range (flow has " +
        screens.length +
        " screen(s))",
    );
  }

  var meta = flowData.meta || {};
  var metaLibrary =
    meta.library ||
    (meta._glossary && meta._glossary.library) ||
    (meta.hifi ? "ds" : null) ||
    (meta.mode === "hifi" ? "ds" : null);
  var procScreens = screens.map(function (sc) {
    return metaLibrary && !sc.library
      ? Object.assign({}, sc, { library: metaLibrary })
      : sc;
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
    '<!doctype html><html><head><meta charset="utf-8">' +
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

var USAGE =
  "usage: look.js <flow.json> (--screen <n> --against <png> | --brief <brief.json>) -o <dir>\n";

function parseArgs(argv) {
  var flowPath = null,
    screen = 1,
    against = null,
    outDir = null,
    brief = null;
  for (var i = 0; i < argv.length; i++) {
    var a = argv[i];
    if (a === "--screen") {
      screen = parseInt(argv[++i], 10);
    } else if (a === "--against") {
      against = argv[++i];
    } else if (a === "--brief") {
      brief = argv[++i];
    } else if (a === "-o") {
      outDir = argv[++i];
    } else if (a.indexOf("-") !== 0 && flowPath === null) {
      flowPath = a;
    }
  }
  return {
    flowPath: flowPath,
    screen: screen,
    against: against,
    outDir: outDir,
    brief: brief,
  };
}

// Which screens a look can compare: each brief screen whose page recipe
// carries a product screenshot that exists on disk, with that screenshot's
// path. derivedFrom.screenshot is relative to the recipe's SOURCE directory
// (vendor/app-context/src/recipes), where the capture PNG lives; the dist
// copy of a recipe has no captures folder beside it. A recipe that cannot be
// read is warned about, not silently folded into "no capture" (an unreadable
// recipe and a recipe that legitimately has no screenshot look identical to
// the caller otherwise); a recipe whose screenshot file is missing is
// warned about too, for the same reason. Only a recipe with no
// derivedFrom.screenshot at all (it never claimed one) stays a silent skip.
function captureScreens(brief, deps) {
  deps = deps || {};
  var readRecipe =
    deps.readRecipe ||
    function (slug) {
      return JSON.parse(fs.readFileSync(PATHS.appContextRecipes(slug), "utf8"));
    };
  var srcDir =
    deps.srcDir ||
    function (slug) {
      return path.dirname(PATHS.appContextRecipesSrc(slug));
    };
  var exists = deps.exists || fs.existsSync;
  var warn =
    deps.warn ||
    function (msg) {
      process.stderr.write(msg);
    };
  var out = [];
  ((brief && brief.screens) || []).forEach(function (s, i) {
    var slug = s && s.pageRecipe && s.pageRecipe.slug;
    if (!slug) return;
    var recipe;
    try {
      recipe = readRecipe(slug);
    } catch (e) {
      warn(
        "look: screen " +
          (i + 1) +
          ": cannot read recipe " +
          slug +
          ": " +
          e.message +
          "\n",
      );
      return;
    }
    var rel = recipe && recipe.derivedFrom && recipe.derivedFrom.screenshot;
    if (!rel) return;
    var against = path.join(srcDir(slug), rel);
    if (!exists(against)) {
      warn(
        "look: screen " +
          (i + 1) +
          ": recipe " +
          slug +
          " names " +
          against +
          ", not on disk\n",
      );
      return;
    }
    out.push({ n: i + 1, slug: slug, against: against });
  });
  return out;
}

// One look: render screen n, screenshot it, write the side-by-side page.
// Returns 0, or 1 with the reason already on stderr.
function lookOne(o) {
  var rendered;
  try {
    rendered = renderScreenFragment(o.flowData, o.screen);
  } catch (e) {
    process.stderr.write("look: " + e.message + "\n");
    return 1;
  }

  fs.mkdirSync(o.outDir, { recursive: true });

  var page = buildStandalonePage(rendered.html, readFlowCss());
  var tmpHtml = path.join(
    os.tmpdir(),
    "look-render-" + process.pid + "-" + Date.now() + ".html",
  );
  var outPng = path.join(o.outDir, "look-" + o.screen + ".png");
  fs.writeFileSync(tmpHtml, page);
  try {
    o.renderLeaf.screenshot({
      chrome: o.chrome,
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

  var title = (rendered.screen && rendered.screen.name) || "Screen " + o.screen;
  var outDirAbs = path.resolve(o.outDir);
  var lookHtml = buildLookHtml({
    renderPng: "look-" + o.screen + ".png",
    againstPng: path.relative(outDirAbs, path.resolve(o.against)),
    title: title,
  });
  var outHtmlPath = path.join(o.outDir, "look-" + o.screen + ".html");
  fs.writeFileSync(outHtmlPath, lookHtml);

  process.stdout.write(
    "look: wrote " +
      outPng +
      " and " +
      outHtmlPath +
      " against " +
      o.against +
      "\n",
  );
  return 0;
}

function main(argv, deps) {
  deps = deps || {};
  var renderLeaf = deps.renderLeaf || defaultRenderLeaf;
  var resolveBinaries = deps.resolveBinaries || defaultResolveBinaries;

  var parsed = parseArgs(argv);
  var single = parsed.against && parsed.screen;
  if (!parsed.flowPath || !parsed.outDir || (!single && !parsed.brief)) {
    process.stderr.write(USAGE);
    return 1;
  }
  if (path.extname(parsed.flowPath) !== ".json") {
    process.stderr.write(
      "look: expected a flow-data .json path, the assembled flow-share HTML " +
        "bundles every screen with no per-screen URL, so ?screen=n cannot be " +
        "screenshotted; pass the flow-data JSON instead.\n",
    );
    return 1;
  }

  var pairs;
  if (parsed.brief) {
    var briefData;
    try {
      briefData = JSON.parse(fs.readFileSync(parsed.brief, "utf8"));
    } catch (e) {
      process.stderr.write(
        "look: cannot read " + parsed.brief + ": " + e.message + "\n",
      );
      return 1;
    }
    try {
      pairs = captureScreens(briefData);
    } catch (e) {
      process.stderr.write("look: " + e.message + "\n");
      return 1;
    }
    if (!pairs.length) {
      process.stdout.write(
        "look: no screen composes from a capture with a screenshot\n",
      );
      return 0;
    }
  } else {
    pairs = [{ n: parsed.screen, against: parsed.against }];
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
    process.stderr.write(
      "look: cannot read " + parsed.flowPath + ": " + e.message + "\n",
    );
    return 1;
  }

  var code = 0;
  pairs.forEach(function (pair) {
    var c = lookOne({
      flowData: flowData,
      screen: pair.n,
      against: pair.against,
      outDir: parsed.outDir,
      chrome: resolved.chrome,
      renderLeaf: renderLeaf,
    });
    if (c > code) code = c;
  });
  return code;
}

module.exports = {
  buildLookHtml: buildLookHtml,
  renderScreenFragment: renderScreenFragment,
  buildStandalonePage: buildStandalonePage,
  readFlowCss: readFlowCss,
  parseArgs: parseArgs,
  captureScreens: captureScreens,
  main: main,
};

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
