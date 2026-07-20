// tests/renderers/appearance-css-coverage.test.js
// Test-integrity fix (Phase 1B strengthening, Task T5): a static guard
// against the exact R1 regression class — the appearance renderer minting a
// `ds-appearance*` class the CSS never styles, so the node it's on renders
// 0x0 and vanishes (this is precisely what happened to the media
// vector/image/icon slots before the R1 fix in ds-base.css).
//
// This test is DYNAMIC on the emitted side (it renders real vendored data
// and asks "what classes did the renderer actually mint today"), not a
// hardcoded list of expected classes — a hardcoded list would go stale
// exactly when a new `kind` shows up in vendored data and silently render
// 0x0, which is the one thing this test exists to catch.
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var ds = require("../../scripts/lib/renderer.js").dsHtmlMap;

var ANATOMY_DIR = path.join(__dirname, "../../vendor/components/dist/anatomy");
var CSS_PATH = require("../../scripts/lib/renderer.js").cssPaths.base;

// Render every vendored non-BUILT_SLUGS doc through the real seam and collect
// every distinct `ds-appearance` BEM token actually emitted in a `class="..."`
// attribute: the wrapper (`ds-appearance`) and any BEM element
// (`ds-appearance__container`/`__instance`/`__text`/`__vector`/`__image`/
// `__icon`, and any future kind). Per-slug modifier classes
// (`ds-appearance--<slug>`) are deliberately NOT collected as distinct
// entries here — a bare `\bds-appearance\b` match inside
// `ds-appearance--tag-status` collapses to the wrapper token itself (the `--`
// after "appearance" is still a word boundary, but the optional `__` capture
// group below only matches a literal double underscore, so a `--slug`
// modifier never becomes its own reportable token). Those per-component hook
// classes are not a "kind" needing its own visual floor.
function emittedAppearanceClasses() {
  var slugFiles = fs.readdirSync(ANATOMY_DIR).filter(function (f) {
    return f.endsWith(".json");
  });
  var docs = {};
  slugFiles.forEach(function (f) {
    var slug = f.replace(/\.json$/, "");
    docs[slug] = JSON.parse(fs.readFileSync(path.join(ANATOMY_DIR, f), "utf8"));
  });
  ds.setAnatomyDocMap(docs);
  var classes = new Set();
  var byClass = {}; // class -> first slug that emitted it, for a useful failure message
  try {
    Object.keys(docs).forEach(function (slug) {
      if (ds.BUILT_SLUGS.indexOf(slug) !== -1) return; // only the appearance seam is under test
      var name = docs[slug].root && docs[slug].root.name;
      var html = ds.renderDSComponent({
        type: "INSTANCE",
        library: "ds",
        dsSlug: slug,
        variant: name || "",
      });
      var classAttrRe = /class="([^"]*)"/g;
      var m;
      while ((m = classAttrRe.exec(html))) {
        m[1].split(/\s+/).forEach(function (token) {
          if (!token) return;
          var bem = token.match(/^ds-appearance(__[a-zA-Z0-9-]+)?/);
          if (!bem) return;
          classes.add(bem[0]);
          if (!byClass[bem[0]]) byClass[bem[0]] = slug;
        });
      }
    });
  } finally {
    ds.setAnatomyDocMap(null);
  }
  return { classes: classes, byClass: byClass };
}

// Read ds-base.css and collect every `.ds-appearance` BEM token declared in a
// real rule's selector list (comments stripped first, so prose mentioning
// ".ds-appearance__foo" in a doc-comment can't be mistaken for real CSS
// coverage — that would defeat the whole point of this test).
function declaredAppearanceClasses() {
  var raw = fs.readFileSync(CSS_PATH, "utf8");
  var css = raw.replace(/\/\*[\s\S]*?\*\//g, "");
  var declared = new Set();
  var blockRe = /([^{}]*)\{([^{}]*)\}/g;
  var m;
  while ((m = blockRe.exec(css))) {
    var selectorList = m[1];
    var tokenRe = /\.ds-appearance(__[a-zA-Z0-9-]+)?\b/g;
    var tm;
    while ((tm = tokenRe.exec(selectorList))) {
      declared.add(tm[0].slice(1)); // drop the leading "."
    }
  }
  return declared;
}

test("every ds-appearance* class the renderer emits has matching CSS coverage (R1 regression guard)", function () {
  var emitted = emittedAppearanceClasses();
  var declared = declaredAppearanceClasses();

  assert.ok(
    emitted.classes.size > 0,
    "expected the appearance renderer to emit at least one ds-appearance class across vendored docs",
  );

  var missing = [];
  emitted.classes.forEach(function (klass) {
    if (!declared.has(klass)) {
      missing.push(klass + " (first seen on slug: " + emitted.byClass[klass] + ")");
    }
  });

  assert.deepEqual(
    missing,
    [],
    "ds-base.css does not style the following ds-appearance* class(es) the " +
      "renderer actually emits — an unstyled leaf/media slot renders 0x0 and " +
      "vanishes (the R1 regression class): " +
      missing.join(", "),
  );
});
