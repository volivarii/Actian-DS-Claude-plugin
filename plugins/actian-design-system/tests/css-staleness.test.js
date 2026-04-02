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

var RENDERERS_DIR = path.join(__dirname, "..", "scripts", "html-renderers");

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
    var parts = match[1].split(/\s+/);
    for (var i = 0; i < parts.length; i++) {
      var cls = parts[i].trim();
      // Skip dynamic parts (contain JS variable concatenation)
      if (!cls || /['+()`%]/.test(cls) || /^[A-Z]/.test(cls)) continue;
      // Skip variable names used in templates (e.g., alertType, btnSize)
      if (/^[a-z]+[A-Z]/.test(cls) && cls.indexOf("-") === -1) continue;
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
      path.join(RENDERERS_DIR, "fm-html-map.js"),
    ],
    css: [
      path.join(RENDERERS_DIR, "fm-base.css"),
      path.join(RENDERERS_DIR, "flow-renderer.css"),
    ],
  },
  {
    name: "Brief",
    js: [
      path.join(RENDERERS_DIR, "brief-renderer.js"),
      path.join(RENDERERS_DIR, "fm-html-map.js"),
    ],
    css: [
      path.join(RENDERERS_DIR, "fm-base.css"),
      path.join(RENDERERS_DIR, "brief-renderer.css"),
    ],
  },
  {
    name: "Presentation",
    js: [path.join(RENDERERS_DIR, "presentation-renderer.js")],
    css: [path.join(RENDERERS_DIR, "presentation-renderer.css")],
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
