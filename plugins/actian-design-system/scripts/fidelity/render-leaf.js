// scripts/fidelity/render-leaf.js
"use strict";
var fs = require("node:fs");
var path = require("node:path");
var cp = require("node:child_process");
var url = require("node:url");

var HR = path.join(__dirname, "..", "renderers", "html-renderers");
var dsMap = require(path.join(HR, "ds-html-map.js"));
var PATHS = require("../lib/paths");

var _cssCache = null;
function readCss() {
  if (_cssCache === null) {
    // tokens.css FIRST — it defines the :root `--zen-*` custom properties that
    // ds-base.css references. Without it leaves render unstyled/collapsed (blank).
    var tokens = fs.readFileSync(PATHS.tokens.css, "utf8");
    var fonts = fs.readFileSync(path.join(HR, "ds-fonts.css"), "utf8");
    var base = fs.readFileSync(path.join(HR, "ds-base.css"), "utf8");
    _cssCache = tokens + "\n" + fonts + "\n" + base;
  }
  return _cssCache;
}

var _defaultProps = null;
function defaultProps() {
  if (_defaultProps === null) {
    _defaultProps = JSON.parse(
      fs.readFileSync(path.join(__dirname, "default-props.json"), "utf8"),
    );
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

function renderLeafFragment(slug) {
  return dsMap.renderDSComponent(defaultNodeForSlug(slug));
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
  return buildLeafHtml(slug, fragmentHtml).replace(
    "</body>",
    "<script>" + measureJs + "</script></body>",
  );
}

function buildLeafHtml(slug, fragmentHtml) {
  var css = readCss();
  return [
    "<!doctype html><html><head><meta charset='utf-8'>",
    "<style>" + css + "</style>",
    "<style>body{margin:0;padding:24px;background:#fff;display:inline-block}</style>",
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
