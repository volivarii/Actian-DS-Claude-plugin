#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var { bindTokens } = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "ds-token-binding.js",
  ),
);

describe("ds-token-binding", function () {
  it("maps variant axes to state classes", function () {
    var r = bindTokens("button", {
      variants: { State: "Disabled", Emphasis: "Filled" },
    });
    assert.ok(r.classes.indexOf("ds--state-disabled") !== -1);
    assert.ok(r.classes.indexOf("ds--emphasis-filled") !== -1);
  });
  it("maps guideline domains.tokens bindings to cssVars", function () {
    var r = bindTokens("button", {
      tokenBindings: [
        { token: "--zen-color-action-primary", context: "background" },
      ],
    });
    assert.strictEqual(
      r.cssVars["background"],
      "var(--zen-color-action-primary)",
    );
  });
  it("returns neutral on no data; never throws", function () {
    assert.deepStrictEqual(bindTokens("x", undefined), {
      classes: [],
      cssVars: {},
    });
    assert.deepStrictEqual(bindTokens("x", {}), { classes: [], cssVars: {} });
  });
  it("skips bindings with descriptive (non-CSS-property) contexts", function () {
    var r = bindTokens("card", {
      tokenBindings: [{ token: "spacing-md", context: "Card padding" }],
    });
    assert.deepStrictEqual(r.cssVars, {});
  });
  it("prefixes bare token with --zen- when context is a real CSS property", function () {
    var r = bindTokens("x", {
      tokenBindings: [{ token: "color-bg-default", context: "background" }],
    });
    assert.strictEqual(r.cssVars["background"], "var(--zen-color-bg-default)");
  });
});
