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

  it("does not flag a pair whose ratio exactly equals the minimum", function () {
    var tokens = {
      color: {
        text: { mid: { $type: "color", $value: "#767676" } },
        bg: { default: { $type: "color", $value: "#FFFFFF" } },
      },
    };
    var ratio = lint.contrastRatio("#767676", "#FFFFFF");
    var pairs = [{ fg: "color.text.mid", bg: "color.bg.default", min: ratio }];
    assert.deepStrictEqual(lint.lintContrast(tokens, pairs, ["actian"]), []);
  });

  it("skips (does not flag) an alpha (8-digit) hex value", function () {
    var tokens = {
      color: {
        text: { alpha: { $type: "color", $value: "#00000066" } },
        bg: { default: { $type: "color", $value: "#FFFFFF" } },
      },
    };
    var pairs = [{ fg: "color.text.alpha", bg: "color.bg.default", min: 4.5 }];
    assert.deepStrictEqual(lint.lintContrast(tokens, pairs, ["actian"]), []);
  });
});

describe("lintTokens + formatReport", function () {
  it("returns [] and does not throw when called with no argument", function () {
    assert.deepStrictEqual(lint.lintTokens(), []);
  });

  it("aggregates css + contrast findings", function () {
    var css = "a { font: var(--zen-undefined-y); }";
    var tokens = {
      color: {
        text: { faint: { $type: "color", $value: "#AAAAAA" } },
        bg: { default: { $type: "color", $value: "#FFFFFF" } },
      },
    };
    var findings = lint.lintTokens({
      cssText: css,
      tokensJson: tokens,
      pairs: [{ fg: "color.text.faint", bg: "color.bg.default", min: 4.5 }],
      themes: ["actian"],
    });
    assert.strictEqual(findings.length, 2);
  });

  it("formats a PASS line when there are no findings", function () {
    assert.match(lint.formatReport([]), /PASS/);
  });

  it("formats an error count when findings exist", function () {
    var report = lint.formatReport([
      { rule: "broken-ref", severity: "error", token: "--x", message: "msg" },
    ]);
    assert.match(report, /1 error/);
  });
});
