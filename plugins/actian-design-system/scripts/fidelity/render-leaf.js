// scripts/fidelity/render-leaf.js
"use strict";
var fs = require("node:fs");
var cp = require("node:child_process");
var url = require("node:url");

var renderer = require("../lib/renderer.js");
var dsMap = renderer.dsHtmlMap;
var dsAnatomyMap = renderer.dsAnatomyMap;
var PATHS = require("../lib/paths");

var _cssCache = null;
function readCss() {
  if (_cssCache === null) {
    // tokens.css FIRST — it defines the :root `--zen-*` custom properties that
    // ds-base.css references. Without it leaves render unstyled/collapsed (blank).
    var tokens = fs.readFileSync(PATHS.tokens.css, "utf8");
    var fonts = fs.readFileSync(renderer.cssPaths.fonts, "utf8");
    var base = fs.readFileSync(renderer.cssPaths.base, "utf8");
    _cssCache = tokens + "\n" + fonts + "\n" + base;
  }
  return _cssCache;
}

var _defaultProps = null;
function defaultProps() {
  if (_defaultProps === null) {
    _defaultProps = renderer.defaultProps;
  }
  return _defaultProps;
}

// Read the captured variant from the anatomy substrate so the rendered leaf
// matches the oracle's state; merge per-slug content from default-props.json
// (the variant string can't carry Label/Message text). Missing anatomy →
// empty variant; missing map entry → empty props (the leaf renders its own
// defaults and simply won't pixel-match, which is visible, not a crash).
function defaultNodeForSlug(slug) {
  var variant = "";
  try {
    var anatomy = JSON.parse(
      fs.readFileSync(PATHS.components.anatomy.byKey(slug), "utf8"),
    );
    if (anatomy && anatomy.source && anatomy.source.variant) {
      variant = anatomy.source.variant;
    }
  } catch (_) {
    // no anatomy file → render the empty variant (component defaults)
  }
  var props = defaultProps()[slug] || {};
  return { dsSlug: slug, variant: variant, props: props };
}

// F1: default-routed slugs (no BUILT_SLUGS case) render through
// ds-html-map.js's default: seam, which reads the appearance doc map
// (setAnatomyDocMap) rather than any argument on the node itself — without
// injecting it here, that seam has nothing to look up and degrades to the
// graceful `.ds-component` chip, so the fidelity gate would silently compare
// a labeled chip against the real oracle instead of the real per-instance
// appearance render. Build the single-slug doc map the SAME way
// assemble-flow-share.js / assemble-preview.js do (buildDsAnatomyDocMap,
// which also applies the BUILT_SLUGS skip + R2 quality-ratio floor), inject
// it immediately around the render call, and reset in a finally so module
// state never leaks into the next slug/gate.
function renderLeafFragment(slug) {
  var docMap = dsAnatomyMap.buildDsAnatomyDocMap([slug]);
  dsMap.setAnatomyDocMap(docMap);
  try {
    return dsMap.renderDSComponent(defaultNodeForSlug(slug));
  } finally {
    dsMap.setAnatomyDocMap(null);
  }
}

// Capture-ready signal: flips data-fidelity-ready once fonts have loaded so the
// screenshot/measure step waits for a settled render. WC-ready seam: a future
// web-component tier extends this to also await customElements.whenDefined()
// + Stencil hydration before signalling ready.
function readySignalScript() {
  return [
    "<script>document.fonts.ready.then(function(){",
    "requestAnimationFrame(function(){document.documentElement.setAttribute('data-fidelity-ready','1');});",
    "});</script>",
  ].join("");
}

// Single render entry both gates (pixel/structural here, axe in Plan B) consume.
// WC-ready seam: the fragment source is ds-html-map today; a web-component tier
// would register an alternative producer here. The oracle SOURCE stays swappable
// via oracleFor() in run-fidelity.js (Figma-export now, browser-capture later).
function renderTarget(slug) {
  var fragment = renderLeafFragment(slug);
  return { fragment: fragment, html: buildLeafHtml(slug, fragment) };
}

function buildMeasureHtml(slug, fragmentHtml, measureJs) {
  // The MEASURE path renders the leaf in a FULL-WIDTH block body (fullWidth:true)
  // so a too-wide component actually overflows the viewport at 360/768/1440.
  // The default (pixel/screenshot) body stays inline-block — byte-identical — so
  // the pixel oracle diff is unaffected.
  return buildLeafHtml(slug, fragmentHtml, { fullWidth: true }).replace(
    "</body>",
    "<script>" + measureJs + "</script></body>",
  );
}

function buildLeafHtml(slug, fragmentHtml, opts) {
  var css = readCss();
  // DEFAULT body is inline-block (shrink-wraps to content) — the pixel path
  // depends on this exact byte string staying unchanged. Only the measure path
  // opts into a full-width block body via { fullWidth: true }.
  var bodyStyle =
    opts && opts.fullWidth
      ? "body{margin:0;padding:24px;background:#fff}"
      : "body{margin:0;padding:24px;background:#fff;display:inline-block}";
  return [
    "<!doctype html><html><head><meta charset='utf-8'>",
    "<style>" + css + "</style>",
    "<style>" + bodyStyle + "</style>",
    "</head><body>",
    '<div id="fidelity-root" data-slug="' +
      dsMap.esc(slug) +
      '">' +
      fragmentHtml +
      "</div>",
    readySignalScript(),
    "</body></html>",
  ].join("");
}

// Wrap an image file (e.g. the .webp oracle) in a standalone page so Chrome can
// rasterize it to PNG — pngjs can't decode webp, but Chrome can, so we screenshot
// the decoded <img>. The content-box trim in pixel-diff removes the surrounding canvas.
function buildImageHtml(imagePath) {
  var href = url.pathToFileURL(imagePath).href;
  return [
    "<!doctype html><html><head><meta charset='utf-8'>",
    "<style>html,body{margin:0;padding:0;background:#fff}img{display:block}</style>",
    "</head><body>",
    '<img id="fidelity-oracle" src="' + href + '">',
    "<script>var i=document.getElementById('fidelity-oracle');",
    "function rdy(){document.documentElement.setAttribute('data-fidelity-ready','1');}",
    "if(i.complete)rdy();else i.onload=rdy;</script>",
    "</body></html>",
  ].join("");
}

// Pure builder for the headless-Chrome screenshot args — extracted so the
// flag set (incl. the Linux-determinism flags below) is unit-testable without
// launching Chrome. --no-sandbox + --disable-dev-shm-usage are required on CI
// runners (GitHub ubuntu-latest); --font-render-hinting=none + --disable-lcd-text
// reduce cross-OS font-rasterization noise so the pixel diff is portable.
function screenshotArgs(opts) {
  var width = opts.width || 1440,
    height = opts.height || 900;
  return [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--font-render-hinting=none",
    "--disable-lcd-text",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--virtual-time-budget=2000",
    "--window-size=" + width + "," + height,
    "--screenshot=" + opts.outPng,
    url.pathToFileURL(opts.htmlPath).href,
  ];
}

// Shell edge: write HTML, screenshot via headless Chrome to PNG. Gated on chrome present.
function screenshot(opts) {
  var chrome = opts.chrome; // resolved path
  var outPng = opts.outPng;
  var args = screenshotArgs(opts);
  try {
    cp.execFileSync(chrome, args, { stdio: "pipe" });
  } catch (e) {
    var detail = (e.stderr || "").toString().slice(0, 500);
    throw new Error(
      "[fidelity] Chrome screenshot failed (exit " +
        e.status +
        ")" +
        (detail ? ":\n" + detail : ""),
    );
  }
  return outPng;
}

module.exports = {
  defaultNodeForSlug,
  renderLeafFragment,
  readySignalScript,
  renderTarget,
  buildLeafHtml,
  buildMeasureHtml,
  buildImageHtml,
  screenshotArgs,
  screenshot,
  readCss,
};
