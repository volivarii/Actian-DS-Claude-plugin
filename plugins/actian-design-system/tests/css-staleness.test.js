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

var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;
var failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    process.stdout.write("  \u2717 FAIL: " + message + "\n");
  }
}

function section(name) {
  process.stdout.write("\n" + name + "\n");
}

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

    // BEM variant: fm-button--primary → check fm-button exists
    var base = cls.replace(/--[a-zA-Z0-9_-]+$/, "");
    if (base !== cls && cssClasses.has(base)) return;

    // BEM element of variant: fm-alert__bar → check fm-alert exists
    var block = cls.split("__")[0];
    if (block !== cls && cssClasses.has(block)) return;

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
    css: path.join(RENDERERS_DIR, "flow-renderer.css"),
  },
  {
    name: "Brief",
    js: [
      path.join(RENDERERS_DIR, "brief-renderer.js"),
      path.join(RENDERERS_DIR, "fm-html-map.js"),
    ],
    css: path.join(RENDERERS_DIR, "brief-renderer.css"),
  },
  {
    name: "Presentation",
    js: [path.join(RENDERERS_DIR, "presentation-renderer.js")],
    css: path.join(RENDERERS_DIR, "presentation-renderer.css"),
  },
];

for (var p = 0; p < PAIRS.length; p++) {
  var pair = PAIRS[p];
  section(pair.name + " renderer CSS coverage");

  var jsClasses = new Set();
  for (var j = 0; j < pair.js.length; j++) {
    extractClassesFromJS(pair.js[j]).forEach(function (c) {
      jsClasses.add(c);
    });
  }

  var cssClasses = extractClassesFromCSS(pair.css);

  var missing = checkCoverage(jsClasses, cssClasses);

  if (missing.length === 0) {
    assert(
      true,
      pair.name + ": all " + jsClasses.size + " JS classes covered by CSS",
    );
    passed++; // count the section pass
    process.stdout.write(
      "  \u2713 " +
        pair.name +
        ": all " +
        jsClasses.size +
        " JS classes covered by CSS\n",
    );
  } else {
    assert(false, pair.name + ": missing CSS rules for: " + missing.join(", "));
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

process.stdout.write("\n");
process.stdout.write("Results: " + passed + " passed, " + failed + " failed\n");

if (failures.length > 0) {
  process.stdout.write("\nMissing CSS rules (add to the paired .css file):\n");
  for (var f = 0; f < failures.length; f++) {
    process.stdout.write("  - " + failures[f] + "\n");
  }
  process.exit(1);
} else {
  process.stdout.write("All renderer CSS is up to date.\n");
}
