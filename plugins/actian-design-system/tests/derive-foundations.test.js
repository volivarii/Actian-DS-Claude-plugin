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

var {
  sliceSectionContent,
} = require("../scripts/foundations-parser/ast-walk.js");

describe("ast-walk: sliceSectionContent", function () {
  it("returns tokens between a heading and the next same-or-higher-depth heading", function () {
    var tokens = parseMarkdown(
      "## 2.1 First\n\npara1\n\n* item\n\n## 2.2 Second\n\npara2\n",
    );
    var headings = findNumberedHeadings(tokens);
    var content = sliceSectionContent(tokens, headings[0]);
    var types = content.map(function (t) {
      return t.type;
    });
    assert.ok(types.indexOf("paragraph") !== -1, "expected a paragraph");
    assert.ok(types.indexOf("list") !== -1, "expected a list");
    // Should NOT include the next heading (## 2.2)
    var hasNextHeading = content.some(function (t) {
      return t.type === "heading" && t.depth === 2;
    });
    assert.strictEqual(hasNextHeading, false);
  });

  it("includes deeper headings as content (e.g., H3 under H2)", function () {
    var tokens = parseMarkdown(
      "## 1. Outer\n\n### 1.1 Inner\n\nbody\n\n## 2. Next\n",
    );
    var headings = findNumberedHeadings(tokens);
    var outer = headings[0]; // depth 2
    var content = sliceSectionContent(tokens, outer);
    // The H3 (1.1 Inner) is part of outer's content because it's deeper.
    var hasInnerHeading = content.some(function (t) {
      return t.type === "heading" && t.depth === 3;
    });
    assert.strictEqual(hasInnerHeading, true);
    // But the next H2 (2. Next) should NOT be included.
    var hasNextH2 = content.some(function (t) {
      return t.type === "heading" && t.depth === 2;
    });
    assert.strictEqual(hasNextH2, false);
  });

  it("stops at a same-depth heading", function () {
    var tokens = parseMarkdown("### 2.1 First\n\nbody\n\n### 2.2 Second\n");
    var headings = findNumberedHeadings(tokens);
    var first = headings[0]; // depth 3
    var content = sliceSectionContent(tokens, first);
    // No heading at all should appear in content (next heading is depth 3, same).
    var hasHeading = content.some(function (t) {
      return t.type === "heading";
    });
    assert.strictEqual(hasHeading, false);
  });

  it("returns empty array when the section has no following content", function () {
    var tokens = parseMarkdown("## 1. Empty\n\n## 2. Next\n");
    var headings = findNumberedHeadings(tokens);
    var content = sliceSectionContent(tokens, headings[0]);
    assert.deepStrictEqual(content, []);
  });

  it("returns content through end-of-document when no following heading exists", function () {
    var tokens = parseMarkdown("## 1. Last\n\nbody\n\nmore body\n");
    var headings = findNumberedHeadings(tokens);
    var content = sliceSectionContent(tokens, headings[0]);
    var paragraphs = content.filter(function (t) {
      return t.type === "paragraph";
    });
    assert.strictEqual(paragraphs.length, 2);
  });
});

var {
  extractStatus,
} = require("../scripts/foundations-parser/status-emoji.js");

describe("status-emoji: extractStatus", function () {
  it("maps known emojis to canonical status strings", function () {
    assert.strictEqual(extractStatus("✅"), null);
    assert.strictEqual(extractStatus("⚠️"), "proposed");
    assert.strictEqual(extractStatus("❌"), "deprecated");
    assert.strictEqual(extractStatus("🚧"), "in-progress");
  });

  it("trims surrounding whitespace before matching", function () {
    assert.strictEqual(extractStatus("  ⚠️  "), "proposed");
  });

  it("strips status emoji from a value-bearing string and returns both parts", function () {
    var res = extractStatus.fromValueCell("⚠️ #AD88C1");
    assert.strictEqual(res.value, "#AD88C1");
    assert.strictEqual(res.status, "proposed");
  });

  it("returns null status for unflagged values", function () {
    var res = extractStatus.fromValueCell("#0078A8");
    assert.strictEqual(res.value, "#0078A8");
    assert.strictEqual(res.status, null);
  });

  it("treats unknown emojis as no-status (does not throw)", function () {
    assert.strictEqual(extractStatus("🎉"), null);
  });
});

var {
  extractTable,
  extractFencedBlock,
} = require("../scripts/foundations-parser/extractors.js");

describe("extractors: extractTable", function () {
  it("converts a table to an array of objects keyed by header", function () {
    var tokens = parseMarkdown(
      "| Token | Value |\n|---|---|\n| `--zen-color-blue-500` | `#0078A8` |\n| `--zen-color-blue-600` | `#005C82` |\n",
    );
    var table = tokens.find(function (t) {
      return t.type === "table";
    });
    var rows = extractTable(table);
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[0].Token, "--zen-color-blue-500");
    assert.strictEqual(rows[0].Value, "#0078A8");
    assert.strictEqual(rows[1].Token, "--zen-color-blue-600");
  });

  it("preserves a Status column verbatim (downstream extracts the emoji)", function () {
    var tokens = parseMarkdown("| Token | Status |\n|---|---|\n| x | ⚠️ |\n");
    var table = tokens.find(function (t) {
      return t.type === "table";
    });
    var rows = extractTable(table);
    assert.strictEqual(rows[0].Status, "⚠️");
  });

  it("returns empty array for a table with only a header", function () {
    var tokens = parseMarkdown("| A | B |\n|---|---|\n");
    var table = tokens.find(function (t) {
      return t.type === "table";
    });
    var rows = extractTable(table);
    assert.deepStrictEqual(rows, []);
  });

  it("returns empty array for a non-table input (defensive)", function () {
    assert.deepStrictEqual(extractTable(null), []);
    assert.deepStrictEqual(extractTable({ type: "paragraph" }), []);
  });

  it("trims cell text", function () {
    var tokens = parseMarkdown("| A |\n|---|\n|   spaced   |\n");
    var table = tokens.find(function (t) {
      return t.type === "table";
    });
    var rows = extractTable(table);
    assert.strictEqual(rows[0].A, "spaced");
  });
});

describe("extractors: extractFencedBlock", function () {
  it("returns raw value with lang for a code block", function () {
    var tokens = parseMarkdown("```yaml\nfoo: bar\n```\n");
    var code = tokens.find(function (t) {
      return t.type === "code";
    });
    var result = extractFencedBlock(code);
    assert.strictEqual(result.lang, "yaml");
    assert.strictEqual(result.value, "foo: bar");
  });

  it("normalizes lang to lowercase", function () {
    var tokens = parseMarkdown('```JSON\n{"a":1}\n```\n');
    var code = tokens.find(function (t) {
      return t.type === "code";
    });
    var result = extractFencedBlock(code);
    assert.strictEqual(result.lang, "json");
  });

  it("returns null lang when no language tag is present", function () {
    var tokens = parseMarkdown("```\nplain\n```\n");
    var code = tokens.find(function (t) {
      return t.type === "code";
    });
    var result = extractFencedBlock(code);
    assert.strictEqual(result.lang, null);
    assert.strictEqual(result.value, "plain");
  });

  it("returns null for non-code input", function () {
    assert.strictEqual(extractFencedBlock(null), null);
    assert.strictEqual(extractFencedBlock({ type: "paragraph" }), null);
  });
});
