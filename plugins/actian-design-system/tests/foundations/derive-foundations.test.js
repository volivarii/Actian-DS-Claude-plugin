"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var {
  parseMarkdown,
} = require("../../scripts/foundations/foundations-parser/ast-walk.js");

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
} = require("../../scripts/foundations/foundations-parser/ast-walk.js");

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
} = require("../../scripts/foundations/foundations-parser/ast-walk.js");

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
} = require("../../scripts/foundations/foundations-parser/status-emoji.js");

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
} = require("../../scripts/foundations/foundations-parser/extractors.js");

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

var {
  extractList,
  extractProse,
} = require("../../scripts/foundations/foundations-parser/extractors.js");

describe("extractors: extractList", function () {
  it("returns array of plain-text strings from a bullet list", function () {
    var tokens = parseMarkdown(
      "- first item\n- second item\n- **third** item\n",
    );
    var list = tokens.find(function (t) {
      return t.type === "list";
    });
    var items = extractList(list);
    assert.deepStrictEqual(items, ["first item", "second item", "third item"]);
  });

  it("strips inline code backticks from list items", function () {
    var tokens = parseMarkdown("- use `--zen-color-blue-500`\n");
    var list = tokens.find(function (t) {
      return t.type === "list";
    });
    var items = extractList(list);
    assert.strictEqual(items[0], "use --zen-color-blue-500");
  });

  it("returns empty array for non-list input (defensive)", function () {
    assert.deepStrictEqual(extractList(null), []);
    assert.deepStrictEqual(extractList({ type: "paragraph" }), []);
  });
});

describe("extractors: extractProse", function () {
  it("returns paragraph text", function () {
    var tokens = parseMarkdown("This is a paragraph.\n");
    var p = tokens.find(function (t) {
      return t.type === "paragraph";
    });
    assert.strictEqual(extractProse(p), "This is a paragraph.");
  });

  it("strips inline code backticks", function () {
    var tokens = parseMarkdown("Use `--zen-color-blue-500` here.\n");
    var p = tokens.find(function (t) {
      return t.type === "paragraph";
    });
    assert.strictEqual(extractProse(p), "Use --zen-color-blue-500 here.");
  });

  it("strips bold/italic markers (text content only)", function () {
    var tokens = parseMarkdown("Some **bold** and *italic* text.\n");
    var p = tokens.find(function (t) {
      return t.type === "paragraph";
    });
    assert.strictEqual(extractProse(p), "Some bold and italic text.");
  });

  it("returns empty string for non-paragraph input", function () {
    assert.strictEqual(extractProse(null), "");
    assert.strictEqual(extractProse({ type: "heading" }), "");
  });
});

var {
  deriveFromMarkdown,
  writeOutputs,
  addMetaHeader,
} = require("../../scripts/foundations/derive-foundations.js");
var fs = require("fs");
var path = require("path");
var os = require("os");

describe("derive-foundations: deriveFromMarkdown", function () {
  it("dispatches numbered sections to the correct output file", function () {
    var md = [
      "## 2.7 Spacing",
      "",
      "| Token | Value |",
      "|---|---|",
      "| `--zen-spacing-100` | `4px` |",
      "",
      "## 2.6 Elevation",
      "",
      "| Token | Value |",
      "|---|---|",
      "| `--zen-elevation-1` | `0 1px 2px rgba(0,0,0,0.1)` |",
      "",
    ].join("\n");

    var parserMap = {
      2.6: { file: "elevation.json" },
      2.7: { file: "spacing.json" },
    };
    var result = deriveFromMarkdown(md, parserMap);
    assert.ok(result["spacing.json"], "expected spacing.json output");
    assert.ok(result["elevation.json"], "expected elevation.json output");
    assert.deepStrictEqual(result["spacing.json"].rows, [
      { Token: "--zen-spacing-100", Value: "4px" },
    ]);
  });

  it("nests under 'key' when parser map specifies one", function () {
    var md =
      "## 2.1 Color — Global\n\n| Token | Value |\n|---|---|\n| `--c-1` | `#fff` |\n";
    var parserMap = { 2.1: { file: "color.json", key: "global" } };
    var result = deriveFromMarkdown(md, parserMap);
    assert.ok(result["color.json"]);
    assert.ok(result["color.json"].global);
    assert.deepStrictEqual(result["color.json"].global.rows, [
      { Token: "--c-1", Value: "#fff" },
    ]);
  });

  it("ignores numbered headings absent from the parser map (warns to provided logger)", function () {
    var warns = [];
    var logger = {
      warn: function (m) {
        warns.push(m);
      },
    };
    var md = "## 2.1 Mapped\n\nbody\n\n## 99 Unmapped\n\nbody\n";
    var parserMap = { 2.1: { file: "mapped.json" } };
    var result = deriveFromMarkdown(md, parserMap, { logger: logger });
    assert.ok(result["mapped.json"]);
    assert.ok(!result["unmapped.json"]);
    assert.strictEqual(warns.length, 1);
    assert.match(warns[0], /99/);
  });

  it("converts Status column emoji to top-level status field", function () {
    var md = [
      "## 2.1 Test",
      "",
      "| Token | Value | Status |",
      "|---|---|---|",
      "| `--a` | `#fff` | ✅ |",
      "| `--b` | `#000` | ⚠️ |",
      "| `--c` | `#888` | ❌ |",
      "",
    ].join("\n");
    var parserMap = { 2.1: { file: "test.json" } };
    var result = deriveFromMarkdown(md, parserMap);
    var rows = result["test.json"].rows;
    assert.strictEqual(rows.length, 3);
    // ✅ → no status field
    assert.strictEqual(rows[0].Status, undefined);
    assert.strictEqual(rows[0].status, undefined);
    assert.strictEqual(rows[0].Token, "--a");
    // ⚠️ → status: "proposed"
    assert.strictEqual(rows[1].Status, undefined);
    assert.strictEqual(rows[1].status, "proposed");
    // ❌ → status: "deprecated"
    assert.strictEqual(rows[2].status, "deprecated");
  });

  it("collects bullet lists, code blocks, and prose into the section payload", function () {
    var md = [
      "## 2.1 Test",
      "",
      "Some intro prose.",
      "",
      "- bullet one",
      "- bullet two",
      "",
      "```yaml",
      "key: value",
      "```",
      "",
    ].join("\n");
    var parserMap = { 2.1: { file: "test.json" } };
    var result = deriveFromMarkdown(md, parserMap);
    var section = result["test.json"];
    assert.match(section.description, /Some intro prose/);
    assert.deepStrictEqual(section.lists, [["bullet one", "bullet two"]]);
    assert.strictEqual(section.code.length, 1);
    assert.strictEqual(section.code[0].lang, "yaml");
    assert.strictEqual(section.code[0].value, "key: value");
  });
});

describe("derive-foundations: addMetaHeader", function () {
  it("injects _meta.auto_generated marker", function () {
    var withMeta = addMetaHeader({ a: 1 });
    assert.strictEqual(withMeta._meta.auto_generated, true);
    assert.strictEqual(withMeta._meta.source, "docs/foundations.md");
    assert.match(withMeta._meta.do_not_edit, /Edit the source/);
    assert.strictEqual(withMeta.a, 1);
  });

  it("places _meta first when JSON-serialized", function () {
    var withMeta = addMetaHeader({ a: 1 });
    var keys = Object.keys(withMeta);
    assert.strictEqual(keys[0], "_meta");
  });
});

describe("derive-foundations: writeOutputs", function () {
  it("writes one JSON file per output entry, with header guard", function () {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "foundations-"));
    var output = {
      "color.json": { rows: [{ Token: "--c-1", Value: "#fff" }] },
      "spacing.json": { rows: [{ Token: "--s-1", Value: "4px" }] },
    };
    var written = writeOutputs(output, tmpDir);
    assert.strictEqual(written.length, 2);
    var color = JSON.parse(
      fs.readFileSync(path.join(tmpDir, "color.json"), "utf-8"),
    );
    assert.strictEqual(color._meta.auto_generated, true);
    assert.deepStrictEqual(color.rows, [{ Token: "--c-1", Value: "#fff" }]);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates the output directory if it doesn't exist", function () {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "foundations-"));
    var nested = path.join(tmpDir, "nested", "deeper");
    var output = { "test.json": { rows: [] } };
    writeOutputs(output, nested);
    assert.ok(fs.existsSync(path.join(nested, "test.json")));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("ends each file with a newline", function () {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "foundations-"));
    writeOutputs({ "x.json": { a: 1 } }, tmpDir);
    var content = fs.readFileSync(path.join(tmpDir, "x.json"), "utf-8");
    assert.strictEqual(content[content.length - 1], "\n");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

var { spawnSync } = require("child_process");

describe("derive-foundations CLI", function () {
  it("--check exits 0 when output is in sync, 1 when drifted", function () {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "foundations-cli-"));
    var fixture = path.join(
      __dirname,
      "..",
      "fixtures",
      "foundations-parser",
      "sample.md",
    );
    var parserMap = path.join(tmpDir, "parser.json");
    var outputDir = path.join(tmpDir, "out");
    fs.writeFileSync(
      parserMap,
      JSON.stringify({ 2.7: { file: "spacing.json" } }),
    );

    var SCRIPT = path.resolve(
      __dirname,
      "..",
      "..",
      "scripts",
      "foundations",
      "derive-foundations.js",
    );

    // Generate fresh output.
    var gen = spawnSync(
      process.execPath,
      [SCRIPT, "--md", fixture, "--map", parserMap, "--out", outputDir],
      { encoding: "utf-8" },
    );
    assert.strictEqual(gen.status, 0, "gen failed: " + gen.stderr);

    // --check on identical state should pass.
    var check1 = spawnSync(
      process.execPath,
      [
        SCRIPT,
        "--md",
        fixture,
        "--map",
        parserMap,
        "--out",
        outputDir,
        "--check",
      ],
      { encoding: "utf-8" },
    );
    assert.strictEqual(
      check1.status,
      0,
      "expected --check to pass on synced state, stderr: " + check1.stderr,
    );

    // Mutate the output file and verify --check fails.
    fs.writeFileSync(path.join(outputDir, "spacing.json"), '{"hand":"edited"}');
    var check2 = spawnSync(
      process.execPath,
      [
        SCRIPT,
        "--md",
        fixture,
        "--map",
        parserMap,
        "--out",
        outputDir,
        "--check",
      ],
      { encoding: "utf-8" },
    );
    assert.strictEqual(check2.status, 1, "expected --check to fail on drift");
    assert.match(check2.stderr + check2.stdout, /drift/i);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe("derive-foundations: status column handling (case + leading-emoji)", function () {
  it("matches Status column case-insensitively (status / STATUS)", function () {
    var md = "## 2.1 Test\n\n| Token | status |\n|---|---|\n| --a | ⚠️ |\n";
    var parserMap = { 2.1: { file: "test.json" } };
    var result = deriveFromMarkdown(md, parserMap);
    assert.strictEqual(result["test.json"].rows[0].status, "proposed");
  });

  it("handles leading-emoji-with-text in status cell", function () {
    var md =
      "## 2.1 Test\n\n| Token | Status |\n|---|---|\n| --a | ⚠️ proposed pending review |\n";
    var parserMap = { 2.1: { file: "test.json" } };
    var result = deriveFromMarkdown(md, parserMap);
    var row = result["test.json"].rows[0];
    assert.strictEqual(row.status, "proposed");
    assert.strictEqual(row.status_note, "proposed pending review");
  });

  it("does not warn when status cell is text-only without emoji (treated as note)", function () {
    var warns = [];
    var logger = {
      warn: function (m) {
        warns.push(m);
      },
    };
    var md = "## 2.1 Test\n\n| Token | Status |\n|---|---|\n| --a | wat |\n";
    var parserMap = { 2.1: { file: "test.json" } };
    var result = deriveFromMarkdown(md, parserMap, { logger: logger });
    // No warn — cell content is preserved as status_note instead
    assert.strictEqual(warns.length, 0);
    // Confirm text is preserved as status_note
    assert.strictEqual(result["test.json"].rows[0].status_note, "wat");
  });
});

describe("derive-foundations: dispatcher collision detection (issue #6)", function () {
  it("warns when two sections map to the same file+key (collision)", function () {
    var warns = [];
    var logger = {
      warn: function (m) {
        warns.push(m);
      },
    };
    var md =
      "## 2.1 First\n\n| A |\n|---|\n| 1 |\n\n## 2.2 Second\n\n| A |\n|---|\n| 2 |\n";
    var parserMap = {
      2.1: { file: "test.json", key: "shared" },
      2.2: { file: "test.json", key: "shared" },
    };
    deriveFromMarkdown(md, parserMap, { logger: logger });
    var collisionWarns = warns.filter(function (w) {
      return /collision|overwrites/i.test(w);
    });
    assert.strictEqual(collisionWarns.length, 1);
  });
});

describe("ast-walk: findNumberedHeadings — heading regex tightening (issue #7)", function () {
  it("does not match year-like headings (4-digit numbers)", function () {
    var tokens = parseMarkdown("## 2026 retrospective\n\n## 1. Real section\n");
    var headings = findNumberedHeadings(tokens);
    assert.strictEqual(headings.length, 1);
    assert.strictEqual(headings[0].number, "1");
  });

  it("matches up to 2-digit components (e.g., 2.10, 1.99) but not 3-digit (100.)", function () {
    var tokens = parseMarkdown(
      "## 2.10 Tokens\n\n## 1.99 Edge\n\n## 100. Too many digits\n",
    );
    var headings = findNumberedHeadings(tokens);
    assert.strictEqual(headings.length, 2);
    assert.strictEqual(headings[0].number, "2.10");
    assert.strictEqual(headings[1].number, "1.99");
  });
});

var {
  buildMotionPayload,
  slugifyPatternName,
} = require("../../scripts/foundations/derive-foundations.js");

describe("derive-foundations: slugifyPatternName", function () {
  it("kebab-cases simple names", function () {
    assert.strictEqual(slugifyPatternName("Drawer"), "drawer");
    assert.strictEqual(slugifyPatternName("Success Toast"), "success-toast");
  });

  it("drops content in parentheses", function () {
    assert.strictEqual(
      slugifyPatternName("Drawer (open/close)"),
      "drawer",
    );
    assert.strictEqual(
      slugifyPatternName("Accordion (expand/collapse)"),
      "accordion",
    );
  });

  it("drops content after em-dash", function () {
    assert.strictEqual(
      slugifyPatternName("Layered Overlays — Modals"),
      "layered-overlays",
    );
    assert.strictEqual(
      slugifyPatternName("Staggered Entrance — Lists, Table Rows, Search Cards"),
      "staggered-entrance",
    );
  });

  it("strips quotes and 'The ' prefix", function () {
    assert.strictEqual(
      slugifyPatternName('The "Anchor" Motion — Dropdowns'),
      "anchor-motion",
    );
  });

  it("decodes HTML entities before slugging", function () {
    assert.strictEqual(
      slugifyPatternName("The &quot;Anchor&quot; Motion — Dropdowns"),
      "anchor-motion",
    );
  });
});

describe("derive-foundations: buildMotionPayload", function () {
  function payloadFromMd(md) {
    var tokens = parseMarkdown(md);
    // Slice from the 2.9 heading through end (or next ###/##).
    var headings = findNumberedHeadings(tokens);
    var motion = headings.find(function (h) {
      return h.number === "2.9";
    });
    var content = [];
    for (var i = motion.tokenIndex + 1; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.type === "heading" && t.depth <= motion.depth) break;
      content.push(t);
    }
    return buildMotionPayload(content, { warn: function () {} });
  }

  it("groups duration/easing/delay token tables under tokens.<key>", function () {
    var md = [
      "### 2.9 Motion",
      "",
      "Intro paragraph.",
      "",
      "#### Duration",
      "",
      "| Token | Value |",
      "|-------|-------|",
      "| `--zen-motion-duration-instant` | `100ms` |",
      "",
      "#### Easing",
      "",
      "| Token | Value |",
      "|-------|-------|",
      "| `--zen-motion-ease-entrance` | `ease-out` |",
      "",
      "#### Delay",
      "",
      "| Token | Value |",
      "|-------|-------|",
      "| `--zen-motion-delay-stagger` | `20ms` |",
      "",
    ].join("\n");
    var p = payloadFromMd(md);
    assert.strictEqual(p.description, "Intro paragraph.");
    assert.ok(p.tokens.duration.rows[0].Token === "--zen-motion-duration-instant");
    assert.ok(p.tokens.easing.rows[0].Token === "--zen-motion-ease-entrance");
    assert.ok(p.tokens.delay.rows[0].Token === "--zen-motion-delay-stagger");
  });

  it("indexes named patterns by slug under patterns.<slug>", function () {
    var md = [
      "### 2.9 Motion",
      "",
      "#### Component Motion Guide",
      "",
      "**Drawer (open/close)**",
      "",
      "| Phase | Duration |",
      "|-------|----------|",
      "| Open | `duration-slow` |",
      "",
      "**Success Toast**",
      "",
      "| Phase | Duration |",
      "|-------|----------|",
      "| Entry | `duration-base` |",
      "",
    ].join("\n");
    var p = payloadFromMd(md);
    assert.deepStrictEqual(Object.keys(p.patterns), ["drawer", "success-toast"]);
    assert.strictEqual(p.patterns.drawer.name, "Drawer (open/close)");
    assert.strictEqual(p.patterns.drawer.phases[0].Phase, "Open");
    assert.strictEqual(p.patterns["success-toast"].name, "Success Toast");
  });

  it("attaches Logic & Accessibility list to current pattern, not as new pattern", function () {
    var md = [
      "### 2.9 Motion",
      "",
      "#### Component Motion Guide",
      "",
      "**Anchor Motion**",
      "",
      "| Phase | Duration |",
      "|-------|----------|",
      "| Open | `duration-base` |",
      "",
      "**Logic & Accessibility**",
      "",
      "- Intentionality: apply delay-intent",
      "- Reduced motion: disable fades",
      "",
    ].join("\n");
    var p = payloadFromMd(md);
    assert.deepStrictEqual(Object.keys(p.patterns), ["anchor-motion"]);
    assert.strictEqual(
      p.patterns["anchor-motion"].logic_and_accessibility.length,
      2,
    );
  });

  it("decodes HTML entities in pattern names", function () {
    var md = [
      "### 2.9 Motion",
      "",
      "#### Component Motion Guide",
      "",
      '**The "Anchor" Motion — Dropdowns**',
      "",
      "| Phase | Duration |",
      "|-------|----------|",
      "| Open | `duration-base` |",
      "",
    ].join("\n");
    var p = payloadFromMd(md);
    assert.strictEqual(
      p.patterns["anchor-motion"].name,
      'The "Anchor" Motion — Dropdowns',
    );
  });

  it("attaches non-bold paragraphs as notes on the current pattern", function () {
    var md = [
      "### 2.9 Motion",
      "",
      "#### Component Motion Guide",
      "",
      "**Staggered Entrance**",
      "",
      "| Item | Delay |",
      "|------|-------|",
      "| 1 | 0ms |",
      "",
      "Cascading effect guides the eye downward.",
      "",
    ].join("\n");
    var p = payloadFromMd(md);
    assert.deepStrictEqual(p.patterns["staggered-entrance"].notes, [
      "Cascading effect guides the eye downward.",
    ]);
  });
});

describe("derive-foundations: defensive cleanup", function () {
  it("strips _pendingSubsection from output even if no list followed the sub-label", function () {
    var md = [
      "### 2.9 Motion",
      "",
      "#### Component Motion Guide",
      "",
      "**Anchor Motion**",
      "",
      "| Phase | Duration |",
      "|-------|----------|",
      "| Open | `duration-base` |",
      "",
      "**Logic & Accessibility**",
      "",
      // Section ends here — no list follows the sub-label.
    ].join("\n");
    var tokens = parseMarkdown(md);
    var headings = findNumberedHeadings(tokens);
    var motion = headings.find(function (h) {
      return h.number === "2.9";
    });
    var content = [];
    for (var i = motion.tokenIndex + 1; i < tokens.length; i++) {
      content.push(tokens[i]);
    }
    var p = buildMotionPayload(content, { warn: function () {} });
    assert.ok(
      !Object.prototype.hasOwnProperty.call(
        p.patterns["anchor-motion"],
        "_pendingSubsection",
      ),
      "_pendingSubsection should not leak into output",
    );
  });
});
