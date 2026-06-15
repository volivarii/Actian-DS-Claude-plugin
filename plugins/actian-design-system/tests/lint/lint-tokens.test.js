#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");

var lint = require("../../scripts/lint/lint-tokens.js");

describe("lintCssVarRefs", function () {
  it("flags a var() reference with no matching definition", function () {
    var css = [
      ":root {",
      "  --zen-font-family-text: \"Roboto\", sans-serif;",
      "  --zen-font-heading-display-family: var(--zen-font-family-roboto);",
      "}",
    ].join("\n");
    var findings = lint.lintCssVarRefs(css);
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].rule, "broken-ref");
    assert.strictEqual(findings[0].severity, "error");
    assert.strictEqual(findings[0].token, "--zen-font-family-roboto");
  });

  it("returns no findings when every referenced var is defined", function () {
    var css = [
      ":root {",
      "  --zen-font-family-text: \"Roboto\", sans-serif;",
      "  --zen-font-heading-display-family: var(--zen-font-family-text);",
      "}",
    ].join("\n");
    assert.deepStrictEqual(lint.lintCssVarRefs(css), []);
  });

  it("reports each undefined var only once even if referenced many times", function () {
    var css = [
      "a { color: var(--zen-undefined-x); }",
      "b { color: var(--zen-undefined-x); }",
    ].join("\n");
    var findings = lint.lintCssVarRefs(css);
    assert.strictEqual(findings.length, 1);
  });
});
