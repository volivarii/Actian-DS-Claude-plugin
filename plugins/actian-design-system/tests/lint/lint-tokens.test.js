#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");

var lint = require("../../scripts/lint/lint-tokens.js");

describe("lintCssVarRefs", function () {
  it("flags a var() reference with no matching definition", function () {
    var css = [
      ":root {",
      '  --zen-font-family-text: "Roboto", sans-serif;',
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
      '  --zen-font-family-text: "Roboto", sans-serif;',
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

describe("contrastRatio", function () {
  it("black on white is 21:1", function () {
    assert.strictEqual(
      Math.round(lint.contrastRatio("#000000", "#FFFFFF")),
      21,
    );
  });

  it("is order-independent", function () {
    assert.strictEqual(
      lint.contrastRatio("#000000", "#FFFFFF"),
      lint.contrastRatio("#FFFFFF", "#000000"),
    );
  });

  it("white on white is 1:1", function () {
    assert.strictEqual(Math.round(lint.contrastRatio("#FFFFFF", "#FFFFFF")), 1);
  });
});

describe("themeValue", function () {
  var tokens = {
    color: {
      text: {
        primary: {
          $type: "color",
          $value: "#000000",
          $extensions: {
            "com.actian.themes": {
              actian: "#000000",
              studio: "#111111",
              explorer: "#222222",
            },
          },
        },
      },
      bg: { default: { $type: "color", $value: "#FFFFFF" } },
    },
  };

  it("returns the per-theme override when present", function () {
    assert.strictEqual(
      lint.themeValue(tokens, "color.text.primary", "studio"),
      "#111111",
    );
  });

  it("falls back to $value when no theme override exists", function () {
    assert.strictEqual(
      lint.themeValue(tokens, "color.bg.default", "studio"),
      "#FFFFFF",
    );
  });
});

describe("lintContrast", function () {
  it("flags a pair below its minimum ratio", function () {
    var tokens = {
      color: {
        text: { faint: { $type: "color", $value: "#AAAAAA" } },
        bg: { default: { $type: "color", $value: "#FFFFFF" } },
      },
    };
    var pairs = [{ fg: "color.text.faint", bg: "color.bg.default", min: 4.5 }];
    var findings = lint.lintContrast(tokens, pairs, ["actian"]);
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].rule, "contrast");
    assert.strictEqual(findings[0].severity, "error");
  });

  it("passes a high-contrast pair", function () {
    var tokens = {
      color: {
        text: { primary: { $type: "color", $value: "#000000" } },
        bg: { default: { $type: "color", $value: "#FFFFFF" } },
      },
    };
    var pairs = [
      { fg: "color.text.primary", bg: "color.bg.default", min: 4.5 },
    ];
    assert.deepStrictEqual(lint.lintContrast(tokens, pairs, ["actian"]), []);
  });
});
