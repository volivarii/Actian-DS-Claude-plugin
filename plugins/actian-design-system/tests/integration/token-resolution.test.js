"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var PATHS = require("../../scripts/lib/paths.js");

var RDIR = path.join(
  __dirname,
  "..",
  "..",
  "scripts",
  "renderers",
  "html-renderers",
);
var CSS_FILES = [
  "fm-base.css",
  "flow-renderer.css",
  "brief-renderer.css",
  "presentation-renderer.css",
  "render-node.css",
].map(function (f) {
  return path.join(RDIR, f);
});
// hi-fi DS tier — 100% --zen-* bound; gated here so any drift is caught. Lives
// in the vendored renderer since relocation phase 2.
CSS_FILES.push(require("../../scripts/lib/renderer.js").cssPaths.base);

// Renderer JS also hand-writes inline `var(--…)` (e.g. brief-renderer SVG/style
// strings). The spec called for the gate to cover renderer CSS *and JS*; JS only
// REFERENCES vars (it never DEFINES them), so these are scanned for references
// against the CSS+tokens `defined` set.
var JS_FILES = [
  "fm-html-map.js",
  "flow-renderer.js",
  "presentation-renderer.js",
  "brief-renderer.js",
  "render-node-figma.js", // render-node-figma.js emits {r,g,b} literals (no var(--…) today); listed so any future token leak into the emitter is auto-caught.
  "render-node.js",
].map(function (f) {
  return path.join(RDIR, f);
});
// hi-fi DS interpreter — scanned for any inline var(--…) references. Vendored
// since renderer-relocation phase 2.
JS_FILES.push(
  require("../../scripts/lib/renderer.js").modulePath(
    "html-renderers/ds-html-map.js",
  ),
);

// Strip /* block */ and // line comments before scanning. A var(--…) written
// in PROSE is not a reference, and flagging it is a false alarm that pressures
// the next person to weaken the gate. Knowledge's ds-base.css does exactly this
// ("these bind var(--token) only where the token round-trips"), which is how the
// blind spot surfaced at renderer-relocation phase 2.
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

// Extract every referenced custom-property NAME from `var(--name` (ignoring fallback).
function referencedVars(src) {
  var out = new Set();
  var re = /var\(\s*(--[a-zA-Z0-9-]+)/g,
    m;
  var scannable = stripComments(src);
  while ((m = re.exec(scannable))) out.add(m[1]);
  return out;
}
// Extract every DEFINED custom-property NAME (`  --name: value;`).
function definedVars(src) {
  var out = new Set();
  var re = /^\s*(--[a-zA-Z0-9-]+)\s*:/gm,
    m;
  while ((m = re.exec(src))) out.add(m[1]);
  return out;
}

test("every var(--…) referenced in renderer CSS/JS resolves to a definition", function () {
  var defined = definedVars(fs.readFileSync(PATHS.tokens.css, "utf8"));
  var referenced = new Set();
  CSS_FILES.forEach(function (f) {
    var src = fs.readFileSync(f, "utf8");
    definedVars(src).forEach(function (n) {
      defined.add(n);
    });
    referencedVars(src).forEach(function (n) {
      referenced.add(n);
    });
  });
  // JS files only contribute references (they don't define tokens).
  JS_FILES.forEach(function (f) {
    referencedVars(fs.readFileSync(f, "utf8")).forEach(function (n) {
      referenced.add(n);
    });
  });
  var unresolved = [];
  referenced.forEach(function (n) {
    if (!defined.has(n)) unresolved.push(n);
  });
  assert.deepEqual(
    unresolved.sort(),
    [],
    "unresolved token references (phantom var() — fix the reference or it silently falls back): " +
      unresolved.join(", "),
  );
});
