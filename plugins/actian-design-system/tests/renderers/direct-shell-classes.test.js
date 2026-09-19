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
      if (/^proto-[a-z0-9-]+$/.test(tok) && out.indexOf(tok) === -1)
        out.push(tok);
    });
  }
  return out;
}

// dockLayers in assemble-direct.js never writes proto-layer--drawer,
// proto-layer--panel, proto-layer--modal or proto-layer--toast as literals:
// it appends one of its exported LAYER_KINDS to a "proto-layer--" stem. That
// stem (and the plain "proto-layer" base class beside it) lives in its own
// string literal built ahead of the returned markup, not inside a literal
// `class="..."` attribute, so literalProtoClasses above cannot see either
// one: find the whole literal that is immediately joined
// to the bare identifier `kind` (either quote style, via a backreference),
// read every whitespace-separated token out of it, and treat the LAST one as
// the stem each kind is appended to; any other clean token in that same
// literal (here, "proto-layer") is a static class emitted as-is.
function dockLayerClasses(src) {
  const kinds = require(ASSEMBLE_PATH).LAYER_KINDS;
  assert.ok(
    Array.isArray(kinds) && kinds.length,
    "expected assemble-direct.js to export its LAYER_KINDS",
  );
  const literalMatch = src.match(/(["'])((?:(?!\1).)*)\1\s*\+\s*kind\b/);
  assert.ok(
    literalMatch,
    "expected assemble-direct.js dockLayers to build a proto-layer--<kind> class from kind",
  );
  const tokens = literalMatch[2].trim().split(/\s+/);
  const stem = tokens[tokens.length - 1];
  assert.ok(
    /^proto-[a-z0-9-]+$/.test(stem),
    "expected the stem joined to kind to be a clean proto-* token, got: " +
      stem,
  );
  const staticClasses = tokens.slice(0, -1).filter(function (t) {
    return /^proto-[a-z0-9-]+$/.test(t);
  });
  const variants = kinds.map(function (k) {
    return stem + k;
  });
  return staticClasses.concat(variants);
}

// The full set of proto-* classes both files emit in markup, derived from the
// source rather than hand-listed.
function emittedProtoClasses() {
  const out = literalProtoClasses(shellSrc).concat(
    literalProtoClasses(assembleSrc),
  );
  dockLayerClasses(assembleSrc).forEach(function (c) {
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
    // The real count after F2 (dockLayers keeps data-layer + the author's own
    // class) and F4 (PROTO_NAV moves the rail): 11, unchanged by either since
    // neither adds a new proto-* class. F9: this floor must never drop again.
    assert.ok(
      classes.length >= 11,
      "expected at least 11 proto-* classes from direct-shell.js and assemble-direct.js, found: " +
        classes.join(", "),
    );
    [
      "proto-layer--drawer",
      "proto-layer--panel",
      "proto-layer--modal",
      "proto-layer--toast",
    ].forEach(function (variant) {
      assert.ok(
        classes.indexOf(variant) !== -1,
        "expected " +
          variant +
          " among the derived classes, found: " +
          classes.join(", "),
      );
    });
    const missing = missingRules(shell.CSS, classes);
    assert.deepStrictEqual(
      missing,
      [],
      "proto-* classes with no rule in direct-shell.js CSS: " +
        missing.join(", "),
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
      "test setup: " +
        target +
        " should have no rule left in the broken CSS copy",
    );
    const missing = missingRules(brokenCss, classes);
    assert.ok(
      missing.indexOf(target) !== -1,
      "the checker did not report " +
        target +
        " as missing once its rule was removed",
    );
  });
});
