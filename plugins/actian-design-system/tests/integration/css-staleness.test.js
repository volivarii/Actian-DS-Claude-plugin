#!/usr/bin/env node
"use strict";

/**
 * css-staleness.test.js — Verify renderer CSS files cover all classes used by renderer JS.
 *
 * Scans each renderer JS for class="..." patterns, extracts base class names,
 * and checks the paired CSS file contains a rule for each one.
 *
 * Run with: node tests/css-staleness.test.js
 * (from the plugins/actian-design-system directory)
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

var RENDERER = require("../../scripts/lib/renderer.js");

var RENDERERS_DIR = path.join(
  __dirname,
  "..",
  "..",
  "scripts",
  "renderers",
  "html-renderers",
);

/**
 * Extract static CSS class names from a JS file.
 * Matches class="..." patterns and splits on spaces.
 * Filters out dynamic expressions (containing +, ', (, esc, etc.)
 */
function extractClassesFromJS(jsPath) {
  var src = fs.readFileSync(jsPath, "utf8");
  var classes = new Set();

  // Match class="..." in string literals
  var re = /class="([^"]*)"/g;
  var match;
  while ((match = re.exec(src)) !== null) {
    // Only the STATIC prefix of the attribute is a class list. The capture is
    // line-agnostic, so `class="' + cls + '"` captures the concatenation itself,
    // and the old code tried to salvage class names token by token out of it.
    // That is not analysable: everything after the first quote or `+` is a JS
    // expression, and its identifiers are variables, not classes. Two rounds of
    // filters were added to guess which tokens to drop (a bare `?` from a
    // multi-line ternary, then camelCase names like `alertType`), and both were
    // patching symptoms. A lowercase, hyphen-free variable such as `cls` slipped
    // through every one of them and the gate reported a missing rule for it.
    //
    // Cutting at the first marker is exact rather than heuristic. It keeps the
    // real half: `class="ds-x ' + extra + '"` still yields `ds-x` and is still
    // checked. It only drops what static analysis genuinely cannot see.
    var staticPrefix = match[1].split(/['"`+(]/)[0];
    var parts = staticPrefix.split(/\s+/);
    // If the static half does not end at a space, the expression CONTINUES its
    // last token, so that token is a truncated stem and not a class. This is the
    // `class="fm-button fm-button--' + variant + '"` case: `fm-button` is a real
    // class and `fm-button--` is half of one. The old code got this right only by
    // accident, because it split before stripping the quote and the surviving
    // `fm-button--'` was then dropped for containing a quote.
    // Only when something was actually cut off. A fully static attribute was not
    // truncated, so its last token is a real class: popping unconditionally made
    // `class="ds-foo"` extract nothing, which a positive control caught.
    if (staticPrefix !== match[1] && parts.length && !/\s$/.test(staticPrefix)) {
      parts.pop();
    }
    for (var i = 0; i < parts.length; i++) {
      var cls = parts[i].trim();
      // Skip dynamic parts (contain JS variable concatenation)
      if (!cls || /['+()`%]/.test(cls) || /^[A-Z]/.test(cls)) continue;
      // Skip variable names used in templates (e.g., alertType, btnSize)
      if (/^[a-z]+[A-Z]/.test(cls) && cls.indexOf("-") === -1) continue;
      // Skip anything that could not be a CSS class name in the first place.
      // The `class="([^"]*)"` capture above is line-agnostic, so a class
      // attribute built with a multi-line ternary (e.g. ds-html-map's
      // loading-skeleton block: `'<span class="ds-x' + (extra ? " " + extra
      // : "") + '"...'`) captures across the newline and yields bare operator
      // tokens like `?`. Those pass every filter above yet are not classes,
      // so the gate reported a missing rule for `?`. Mirrors the identifier
      // pattern extractClassesFromCSS already uses, keeping both sides of the
      // comparison to the same notion of "a class name".
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(cls)) continue;
      classes.add(cls);
    }
  }

  return classes;
}

/**
 * Extract all class selectors from a CSS file.
 * Returns a Set of class names (without the leading dot).
 */
function extractClassesFromCSS(cssPath) {
  var src = fs.readFileSync(cssPath, "utf8");
  var classes = new Set();

  // Match .classname in selectors (handles .a, .a--b, .a__b, .a:hover, etc.)
  var re = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
  var match;
  while ((match = re.exec(src)) !== null) {
    classes.add(match[1]);
  }

  return classes;
}

/**
 * Check that every JS class has a matching CSS rule.
 * For BEM variant classes (e.g., fm-button--primary), also accept the base class (fm-button).
 */
function checkCoverage(jsClasses, cssClasses) {
  var missing = [];

  jsClasses.forEach(function (cls) {
    // Direct match
    if (cssClasses.has(cls)) return;

    // BEM modifier: fm-button--primary → accept if fm-button exists in CSS
    // (modifiers are often styled via the base class + state)
    var base = cls.replace(/--[a-zA-Z0-9_-]+$/, "");
    if (base !== cls && cssClasses.has(base)) return;

    missing.push(cls);
  });

  return missing;
}

// ---------------------------------------------------------------------------
// Test pairs
// ---------------------------------------------------------------------------

var PAIRS = [
  {
    name: "Flow",
    js: [
      path.join(RENDERERS_DIR, "flow-renderer.js"),
      path.join(RENDERERS_DIR, "render-node.js"),
      RENDERER.modulePath("html-renderers/fm-html-map.js"),
    ],
    css: [
      RENDERER.cssPaths.fmBase,
      path.join(RENDERERS_DIR, "render-node.css"),
      path.join(RENDERERS_DIR, "flow-renderer.css"),
    ],
  },
  {
    name: "Brief",
    js: [
      path.join(RENDERERS_DIR, "brief-renderer.js"),
      RENDERER.modulePath("html-renderers/fm-html-map.js"),
    ],
    css: [
      RENDERER.cssPaths.fmBase,
      path.join(RENDERERS_DIR, "brief-renderer.css"),
    ],
  },
  {
    name: "Presentation",
    js: [
      path.join(RENDERERS_DIR, "presentation-renderer.js"),
      path.join(RENDERERS_DIR, "render-node.js"),
    ],
    css: [
      path.join(RENDERERS_DIR, "render-node.css"),
      path.join(RENDERERS_DIR, "presentation-renderer.css"),
    ],
  },
  {
    name: "DS",
    // Vendored since renderer-relocation phase 2: knowledge owns the DS
    // renderer and its styling source. The plugin's own flow chrome above
    // still resolves from RENDERERS_DIR.
    js: [RENDERER.modulePath("html-renderers/ds-html-map.js")],
    css: [RENDERER.cssPaths.base],
  },
];

describe("CSS Staleness", function () {
  PAIRS.forEach(function (pair) {
    describe(pair.name + " renderer CSS coverage", function () {
      it("all JS classes are covered by CSS", function () {
        var jsClasses = new Set();
        for (var j = 0; j < pair.js.length; j++) {
          extractClassesFromJS(pair.js[j]).forEach(function (c) {
            jsClasses.add(c);
          });
        }

        var cssClasses = new Set();
        var cssPaths = Array.isArray(pair.css) ? pair.css : [pair.css];
        for (var c = 0; c < cssPaths.length; c++) {
          extractClassesFromCSS(cssPaths[c]).forEach(function (cls) {
            cssClasses.add(cls);
          });
        }
        var missing = checkCoverage(jsClasses, cssClasses);

        assert.ok(
          missing.length === 0,
          pair.name + ": missing CSS rules for: " + missing.join(", "),
        );
      });
    });
  });
});
