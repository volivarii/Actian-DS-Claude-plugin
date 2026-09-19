// tests/renderers/direct-shell-classes.test.js
//
// tests/integration/css-staleness.test.js does not cover direct-shell.js or
// assemble-direct.js (they are not in its PAIRS list). This gate fills that
// specific gap: every proto-* class the shell emits in markup (the strip, the
// adds note, the scrim, the stage, the icon, the docked layer and its
// drawer/panel/modal/toast variants) must have at least one rule in
// direct-shell.js's own CSS export, which is where all of this shell's
// styling lives.
"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const SHELL_PATH = path.join(ROOT, "scripts/renderers/direct-shell.js");
const ASSEMBLE_PATH = path.join(ROOT, "scripts/renderers/assemble-direct.js");
const shell = require("../../scripts/renderers/direct-shell.js");

const shellSrc = fs.readFileSync(SHELL_PATH, "utf8");
const assembleSrc = fs.readFileSync(ASSEMBLE_PATH, "utf8");

// Every literal proto-* token inside a class="..." string in the source. The
// class="([^"]*)" scan is line agnostic, so a class built by concatenation
// (dockLayers' '<aside class="proto-layer proto-layer--' + kind + '"')
// captures past the JS string's own boundary; requiring the whole token to be
// a clean identifier keeps the real static half (proto-layer) and drops the
// truncated stem ("proto-layer--'" with its trailing punctuation), which is
// completed separately below from the enum it is concatenated with.
function literalProtoClasses(src) {
  const out = [];
  const re = /class="([^"]*)"/g;
  let m;
  while ((m = re.exec(src))) {
    m[1].split(/\s+/).forEach(function (tok) {
      if (/^proto-[a-z0-9-]+$/.test(tok) && out.indexOf(tok) === -1) out.push(tok);
    });
  }
  return out;
}

// dockLayers in assemble-direct.js never writes proto-layer--drawer,
// proto-layer--panel, proto-layer--modal or proto-layer--toast as literals:
// it appends the kind captured by its own
// data-layer="(drawer|panel|modal|toast)" regex to a "proto-layer--" stem.
// Read both halves from the source instead of hand-listing the four names.
function layerVariantClasses(src) {
  const kindsMatch = src.match(/data-layer="\(([a-z|]+)\)"/);
  assert.ok(
    kindsMatch,
    "expected assemble-direct.js dockLayers to declare its data-layer kinds",
  );
  const kinds = kindsMatch[1].split("|");
  const prefixMatch = src.match(/class="proto-layer\s+([a-z-]+)'\s*\+\s*kind\b/);
  assert.ok(
    prefixMatch,
    "expected assemble-direct.js dockLayers to build a proto-layer--<kind> class from kind",
  );
  const prefix = prefixMatch[1];
  return kinds.map(function (k) {
    return prefix + k;
  });
}

// The full set of proto-* classes both files emit in markup, derived from the
// source rather than hand-listed.
function emittedProtoClasses() {
  const out = literalProtoClasses(shellSrc).concat(literalProtoClasses(assembleSrc));
  layerVariantClasses(assembleSrc).forEach(function (c) {
    if (out.indexOf(c) === -1) out.push(c);
  });
  return out;
}

// Class selectors actually present in a CSS string. ".proto-layer[hidden]"
// and ".proto-stage>.screen" both register their base class; the identifier
// character class stops at the bracket or combinator, so a modifier class
// like ".proto-layer--drawer" is captured as its own distinct token and never
// conflated with ".proto-layer".
function classesInCss(css) {
  const present = {};
  const re = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
  let m;
  while ((m = re.exec(css))) present[m[1]] = true;
  return present;
}

// The checker under test: which of `classes` has no rule anywhere in `css`.
function missingRules(css, classes) {
  const present = classesInCss(css);
  return classes.filter(function (c) {
    return !present[c];
  });
}

describe("direct-shell CSS covers every emitted proto-* class", function () {
  it("every proto-* class direct-shell.js and assemble-direct.js emit in markup has a CSS rule", function () {
    const classes = emittedProtoClasses();
    assert.ok(
      classes.length >= 8,
      "expected several proto-* classes from direct-shell.js and assemble-direct.js, found: " +
        classes.join(", "),
    );
    const missing = missingRules(shell.CSS, classes);
    assert.deepStrictEqual(
      missing,
      [],
      "proto-* classes with no rule in direct-shell.js CSS: " + missing.join(", "),
    );
  });

  it("the checker reports a class when its rule is removed from a copy of the CSS", function () {
    const classes = emittedProtoClasses();
    const target = classes[0];
    // A copy of the CSS with every rule mentioning the target class dropped,
    // built by removing lines the checker itself says style the target.
    const brokenCss = shell.CSS.split("\n")
      .filter(function (rule) {
        return missingRules(rule, [target]).length > 0;
      })
      .join("\n");
    assert.strictEqual(
      missingRules(brokenCss, [target]).length,
      1,
      "test setup: " + target + " should have no rule left in the broken CSS copy",
    );
    const missing = missingRules(brokenCss, classes);
    assert.ok(
      missing.indexOf(target) !== -1,
      "the checker did not report " + target + " as missing once its rule was removed",
    );
  });
});
