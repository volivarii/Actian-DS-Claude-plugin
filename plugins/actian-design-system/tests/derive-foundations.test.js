"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var { parseMarkdown } = require("../scripts/foundations-parser/ast-walk.js");

describe("ast-walk: parseMarkdown", function () {
  it("returns a flat token array for valid markdown", function () {
    var tokens = parseMarkdown("# Hello\n\nWorld.\n");
    assert.ok(Array.isArray(tokens));
    var heading = tokens.find(function (t) { return t.type === "heading"; });
    assert.ok(heading, "expected a heading token");
    assert.strictEqual(heading.depth, 1);
  });

  it("parses GFM tables", function () {
    var tokens = parseMarkdown("| A | B |\n|---|---|\n| 1 | 2 |\n");
    var table = tokens.find(function (t) { return t.type === "table"; });
    assert.ok(table, "expected a table token");
    assert.strictEqual(table.header.length, 2);
    assert.strictEqual(table.rows.length, 1);
    assert.strictEqual(table.rows[0][0].text, "1");
  });

  it("parses fenced code blocks with lang", function () {
    var tokens = parseMarkdown("```yaml\nfoo: bar\n```\n");
    var code = tokens.find(function (t) { return t.type === "code"; });
    assert.ok(code);
    assert.strictEqual(code.lang, "yaml");
    assert.strictEqual(code.text, "foo: bar");
  });
});
