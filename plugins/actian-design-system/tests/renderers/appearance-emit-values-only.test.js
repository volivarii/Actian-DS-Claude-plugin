// tests/renderers/appearance-emit-values-only.test.js
// Runtime emit gate (Phase 1B, Task 7): renders every vendored appearance
// doc through the real ds-html-map.js seam (setAnatomyDocMap ->
// renderDSComponent's default: case) and asserts the emitted HTML never
// contains a bare var(--name) with no fallback. Phase 1 is VALUES-ONLY:
// appearance-style.js's appearanceToDecls() emits raw resolved values, never
// var(--token, value) wrapping (that's Phase 2). This is the runtime
// replacement for the static token-resolution.test.js source-scan, which
// cannot see values injected through this doc-map seam.
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var ds = require("../../scripts/renderers/html-renderers/ds-html-map.js");

var ANATOMY_DIR = path.join(__dirname, "../../vendor/components/dist/anatomy");
// Bare var() with no comma fallback: var(--x) but NOT var(--x, value)
var BARE_VAR = /var\(\s*--[a-zA-Z0-9-]+\s*\)/;

test("appearance-rendered output emits values only (no bare var(--name))", function () {
  var slugs = fs.readdirSync(ANATOMY_DIR).filter(function (f) {
    return f.endsWith(".json");
  });
  var docs = {};
  slugs.forEach(function (f) {
    var slug = f.replace(/\.json$/, "");
    docs[slug] = JSON.parse(fs.readFileSync(path.join(ANATOMY_DIR, f), "utf8"));
  });
  ds.setAnatomyDocMap(docs);
  try {
    Object.keys(docs).forEach(function (slug) {
      if (ds.BUILT_SLUGS.indexOf(slug) !== -1) return; // bespoke cases excluded
      var name = docs[slug].root && docs[slug].root.name;
      var html = ds.renderDSComponent({
        type: "INSTANCE",
        library: "ds",
        dsSlug: slug,
        variant: name || "",
      });
      assert.doesNotMatch(html, BARE_VAR, slug + " emitted a bare var(--name)");
    });
  } finally {
    ds.setAnatomyDocMap(null);
  }
});
