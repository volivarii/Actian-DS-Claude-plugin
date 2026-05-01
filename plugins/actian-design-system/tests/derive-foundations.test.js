"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var { parseMarkdown } = require("../scripts/foundations-parser/ast-walk.js");

describe("ast-walk: parseMarkdown", function () {
  it("returns a flat token array for valid markdown", function () {
    var tokens = parseMarkdown("# Hello\n\nWorld.\n");
    assert.ok(Array.isArray(tokens));
    var heading = tokens.find(function (t) {
      return t.type === "heading";
    });
    assert.ok(heading, "expected a heading token");
    assert.strictEqual(heading.depth, 1);
  });

  it("parses GFM tables", function () {
    var tokens = parseMarkdown("| A | B |\n|---|---|\n| 1 | 2 |\n");
    var table = tokens.find(function (t) {
      return t.type === "table";
    });
    assert.ok(table, "expected a table token");
    assert.strictEqual(table.header.length, 2);
    assert.strictEqual(table.rows.length, 1);
    assert.strictEqual(table.rows[0][0].text, "1");
  });

  it("parses fenced code blocks with lang", function () {
    var tokens = parseMarkdown("```yaml\nfoo: bar\n```\n");
    var code = tokens.find(function (t) {
      return t.type === "code";
    });
    assert.ok(code);
    assert.strictEqual(code.lang, "yaml");
    assert.strictEqual(code.text, "foo: bar");
  });
});

var {
  findNumberedHeadings,
} = require("../scripts/foundations-parser/ast-walk.js");

describe("ast-walk: findNumberedHeadings", function () {
  it("extracts the leading number from H2/H3 headings", function () {
    var tokens = parseMarkdown(
      "## 1. Color Primitives\n\n## 2. Tokens\n\n### 2.1 Color — Global Tokens\n\n### 2.2 Color — Text Tokens\n",
    );
    var headings = findNumberedHeadings(tokens);
    assert.strictEqual(headings.length, 4);
    assert.strictEqual(headings[0].number, "1");
    assert.strictEqual(headings[0].text, "Color Primitives");
    assert.strictEqual(headings[2].number, "2.1");
    assert.strictEqual(headings[2].text, "Color — Global Tokens");
  });

  it("ignores headings without a leading number", function () {
    var tokens = parseMarkdown("## Introduction\n\n## 1. Tokens\n");
    var headings = findNumberedHeadings(tokens);
    assert.strictEqual(headings.length, 1);
    assert.strictEqual(headings[0].number, "1");
  });

  it("captures the token index for content extraction", function () {
    var tokens = parseMarkdown("## 1. First\n\nbody\n\n## 2. Second\n\nbody\n");
    var headings = findNumberedHeadings(tokens);
    assert.strictEqual(typeof headings[0].tokenIndex, "number");
    assert.ok(headings[1].tokenIndex > headings[0].tokenIndex);
  });

  it("captures the depth (2 vs 3) for slicing logic later", function () {
    var tokens = parseMarkdown("## 1. Outer\n\n### 1.1 Inner\n");
    var headings = findNumberedHeadings(tokens);
    assert.strictEqual(headings[0].depth, 2);
    assert.strictEqual(headings[1].depth, 3);
  });

  it("ignores H1, H4, H5, H6 (only H2 and H3 are structural for foundations)", function () {
    var tokens = parseMarkdown(
      "# 0. Title\n\n## 1. Section\n\n### 1.1 Sub\n\n#### 1.1.1 Deeper\n\n##### 1.1.1.1 Tiny\n",
    );
    var headings = findNumberedHeadings(tokens);
    assert.strictEqual(headings.length, 2);
    assert.deepStrictEqual(
      headings.map(function (h) {
        return h.depth;
      }),
      [2, 3],
    );
  });
});
