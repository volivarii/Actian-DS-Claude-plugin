// scripts/fidelity/render-leaf.js
"use strict";
var fs = require("node:fs");
var path = require("node:path");
var cp = require("node:child_process");
var url = require("node:url");

var HR = path.join(__dirname, "..", "renderers", "html-renderers");
var dsMap = require(path.join(HR, "ds-html-map.js"));

var _cssCache = null;
function readCss() {
  if (_cssCache === null) {
    var base = fs.readFileSync(path.join(HR, "ds-base.css"), "utf8");
    var fonts = fs.readFileSync(path.join(HR, "ds-fonts.css"), "utf8");
    _cssCache = fonts + "\n" + base;
  }
  return _cssCache;
}

function defaultNodeForSlug(slug) {
  // v1: render the default variant. Per-slug variant strings may need tuning to
  // match the oracle's captured state (Spec §7 variant-mismatch risk).
  return { dsSlug: slug, variant: "", props: {} };
}

function renderLeafFragment(slug) {
  return dsMap.renderDSComponent(defaultNodeForSlug(slug));
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
    "<script>document.fonts.ready.then(function(){",
    "requestAnimationFrame(function(){document.documentElement.setAttribute('data-fidelity-ready','1');});",
    "});</script>",
    "</body></html>",
  ].join("");
}

// Shell edge: write HTML, screenshot via headless Chrome to PNG. Gated on chrome present.
function screenshot(opts) {
  var chrome = opts.chrome; // resolved path
  var htmlPath = opts.htmlPath,
    outPng = opts.outPng;
  var width = opts.width || 1440,
    height = opts.height || 900;
  var args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--virtual-time-budget=2000",
    "--window-size=" + width + "," + height,
    "--screenshot=" + outPng,
    url.pathToFileURL(htmlPath).href,
  ];
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
  buildLeafHtml,
  screenshot,
  readCss,
};
