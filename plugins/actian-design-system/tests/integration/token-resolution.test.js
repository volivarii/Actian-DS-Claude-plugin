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

// Extract every referenced custom-property NAME from `var(--name` (ignoring fallback).
function referencedVars(src) {
  var out = new Set();
  var re = /var\(\s*(--[a-zA-Z0-9-]+)/g,
    m;
  while ((m = re.exec(src))) out.add(m[1]);
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

test("every var(--…) referenced in renderer CSS resolves to a definition", function () {
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
