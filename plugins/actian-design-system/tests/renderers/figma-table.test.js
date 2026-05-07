"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");

var figma = require("../../scripts/renderers/figma-table/render-figma.js");
var html = require("../../scripts/renderers/figma-table/render-html.js");

// ---------------------------------------------------------------------------
// Token name set used for tests (avoid loading live registry to keep tests
// hermetic; live registry validation is exercised in CLI smoke).
// ---------------------------------------------------------------------------

var TEST_TOKENS = new Set([
  "--zen-spacing-lg",
  "--zen-border-radius-xs",
  "--zen-color-bg-emphasis",
]);

function spec(rows, opts) {
  opts = opts || {};
  return Object.assign(
    {
      schemaVersion: "2026.05",
      headers: opts.headers || ["Property", "Token", "Value"],
    },
    opts,
    { rows: rows },
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

test("validate accepts a minimal valid spec", function () {
  var s = spec([
    {
      cells: [
        { type: "text", value: "Box width" },
        { type: "token-pill", value: "--zen-spacing-lg" },
        { type: "text", value: "24px" },
      ],
    },
  ]);
  var errors = figma.validate(s, TEST_TOKENS);
  assert.deepEqual(errors, []);
});

test("validate rejects missing schemaVersion", function () {
  var s = { headers: ["A"], rows: [] };
  var errors = figma.validate(s, TEST_TOKENS);
  assert.ok(
    errors.some(function (e) {
      return e.path === "schemaVersion";
    }),
  );
});

test("validate rejects row cell-count mismatch with rich error", function () {
  var s = spec([{ cells: [{ type: "text", value: "x" }] }], {
    headers: ["A", "B", "C"],
  });
  var errors = figma.validate(s, TEST_TOKENS);
  var match = errors.find(function (e) {
    return e.path === "rows[0].cells";
  });
  assert.ok(match);
  assert.match(match.message, /1.+3/);
  assert.ok(match.suggestion);
});

test("validate rejects unknown cell type", function () {
  var s = spec([{ cells: [{ type: "banana", value: "x" }] }], {
    headers: ["A"],
  });
  var errors = figma.validate(s, TEST_TOKENS);
  assert.ok(
    errors.some(function (e) {
      return e.path === "rows[0].cells[0].type";
    }),
  );
});

test("validate rejects token-pill without --zen- prefix", function () {
  var s = spec([{ cells: [{ type: "token-pill", value: "primary" }] }], {
    headers: ["A"],
  });
  var errors = figma.validate(s, TEST_TOKENS);
  assert.ok(
    errors.some(function (e) {
      return /must start with '--zen-'/i.test(e.message);
    }),
  );
});

test("validate rejects token not in registry (with suggestion)", function () {
  var s = spec([{ cells: [{ type: "token-pill", value: "--zen-fake-xyz" }] }], {
    headers: ["A"],
  });
  var errors = figma.validate(s, TEST_TOKENS);
  var match = errors.find(function (e) {
    return /not found in registry/i.test(e.message);
  });
  assert.ok(match);
  assert.ok(match.suggestion);
});

test("validate accepts color-swatch with valid hex + token", function () {
  var s = spec(
    [
      {
        cells: [
          {
            type: "color-swatch",
            color: "#0550DC",
            tokenName: "--zen-color-bg-emphasis",
            hex: "#0550DC",
          },
        ],
      },
    ],
    { headers: ["Color"] },
  );
  assert.deepEqual(figma.validate(s, TEST_TOKENS), []);
});

test("validate rejects color-swatch with invalid hex", function () {
  var s = spec([{ cells: [{ type: "color-swatch", color: "blue" }] }], {
    headers: ["Color"],
  });
  var errors = figma.validate(s, TEST_TOKENS);
  assert.ok(
    errors.some(function (e) {
      return e.path === "rows[0].cells[0].color";
    }),
  );
});

test("validate rejects badge with unknown variant", function () {
  var s = spec([{ cells: [{ type: "badge", variant: "warning" }] }], {
    headers: ["Type"],
  });
  var errors = figma.validate(s, TEST_TOKENS);
  assert.ok(
    errors.some(function (e) {
      return e.path === "rows[0].cells[0].variant";
    }),
  );
});

// ---------------------------------------------------------------------------
// Figma emit — load-bearing structural assertions
// ---------------------------------------------------------------------------

test("emit Figma code: header row + data rows wired into table parent", function () {
  var s = spec([
    {
      cells: [
        { type: "text", value: "Box width" },
        { type: "token-pill", value: "--zen-spacing-lg" },
        { type: "text", value: "24px" },
      ],
    },
  ]);
  var out = figma.emit(s, "<contentSlotId>");
  // Outer table frame, both rows appended
  assert.match(out.code, /var table = figma.createFrame/);
  assert.match(out.code, /table\.appendChild\(row_header\)/);
  assert.match(out.code, /table\.appendChild\(row_data0\)/);
  // Header row hugs (interpreter sets the load-bearing modes)
  assert.match(out.code, /row_header\.counterAxisSizingMode = "AUTO"/);
  // Data row hugs (load-bearing fix from v1.70.4 audit)
  assert.match(out.code, /row_data0\.counterAxisSizingMode = "AUTO"/);
  assert.match(out.code, /row_data0\.layoutSizingHorizontal = "FILL"/);
  // Token pill correctly named (matches v1.70.4 registry probe pattern)
  assert.match(out.code, /\.name = "Token: " \+ "--zen-spacing-lg"/);
  // Manifest counts
  assert.equal(out.manifest.rowsEmitted, 1);
  assert.equal(out.manifest.cellsByType["text"], 2);
  assert.equal(out.manifest.cellsByType["token-pill"], 1);
});

test("emit Figma code: code cells trigger Fira Code font load", function () {
  var s = spec(
    [
      {
        cells: [{ type: "code", value: "size: 'sm' | 'md' | 'lg'" }],
      },
    ],
    { headers: ["Type"] },
  );
  var out = figma.emit(s, "<contentSlotId>");
  assert.match(out.code, /loadFontAsync.+Fira Code/);
});

test("emit Figma code: row data wrappers prevent the v1.70.x squash class", function () {
  // Bug 1 root cause: AI created cell wrappers at 1px height with absolute
  // positioning. The new emit MUST NOT contain layoutMode="NONE" for any
  // cell wrapper that holds visible content.
  var s = spec(
    [
      {
        cells: [
          { type: "token-pill", value: "--zen-spacing-lg" },
          {
            type: "color-swatch",
            color: "#0550DC",
            tokenName: "--zen-color-bg-emphasis",
          },
          { type: "text", value: "24px" },
        ],
      },
    ],
    { headers: ["Token", "Swatch", "Value"] },
  );
  var out = figma.emit(s, "<contentSlotId>");
  // No NONE layoutMode anywhere except potentially the table frame itself
  // (which DOES use VERTICAL — verified above)
  assert.equal(out.code.indexOf('layoutMode = "NONE"'), -1);
  // No negative-y absolute positioning (the v1.70.4 anti-pattern)
  assert.equal(out.code.indexOf("y = -"), -1);
});

// ---------------------------------------------------------------------------
// HTML render — structural parity with Figma emit
// ---------------------------------------------------------------------------

test("HTML render: produces a valid table structure", function () {
  var s = spec([
    {
      cells: [
        { type: "text", value: "Box width" },
        { type: "token-pill", value: "--zen-spacing-lg" },
        { type: "text", value: "24px" },
      ],
    },
  ]);
  var out = html.render(s);
  assert.match(out, /<table class="render-table">/);
  assert.match(out, /<th>Property<\/th>/);
  assert.match(out, /<th>Token<\/th>/);
  assert.match(out, /<th>Value<\/th>/);
  assert.match(out, /<span class="token-pill">--zen-spacing-lg<\/span>/);
});

test("HTML render: cells render per discriminator type", function () {
  var s = spec(
    [
      {
        cells: [
          { type: "text", value: "API" },
          { type: "code", value: "size?: 'sm'" },
          { type: "badge", variant: "req" },
          {
            type: "color-swatch",
            color: "#0550DC",
            tokenName: "--zen-color-bg-emphasis",
          },
          { type: "empty" },
        ],
      },
    ],
    { headers: ["A", "B", "C", "D", "E"] },
  );
  var out = html.render(s);
  // Single-quotes get HTML-escaped to &#39; — match either form for safety.
  assert.match(
    out,
    /<code class="code-cell">size\?: (&#39;|').+(&#39;|')<\/code>/,
  );
  assert.match(out, /<span class="badge badge--req">REQ<\/span>/);
  assert.match(out, /<span class="color-swatch-cell">/);
  assert.match(out, /<span class="empty-cell">&mdash;<\/span>/);
});

test("HTML render: text cell escapes special characters", function () {
  var s = spec(
    [{ cells: [{ type: "text", value: "<script>alert(1)</script>" }] }],
    { headers: ["A"] },
  );
  var out = html.render(s);
  assert.equal(out.indexOf("<script>"), -1);
  assert.match(out, /&lt;script&gt;/);
});

test("parity: same spec produces N rows in both Figma emit + HTML render", function () {
  var s = spec([
    {
      cells: [
        { type: "text", value: "row 1" },
        { type: "text", value: "x" },
        { type: "text", value: "y" },
      ],
    },
    {
      cells: [
        { type: "text", value: "row 2" },
        { type: "text", value: "x" },
        { type: "text", value: "y" },
      ],
    },
    {
      cells: [
        { type: "text", value: "row 3" },
        { type: "text", value: "x" },
        { type: "text", value: "y" },
      ],
    },
  ]);
  var fig = figma.emit(s, "<contentSlotId>");
  var ht = html.render(s);
  assert.equal(fig.manifest.rowsEmitted, 3);
  // Count <tr> in tbody (excludes header row)
  var bodyMatch = ht.match(/<tbody>([\s\S]*?)<\/tbody>/);
  assert.ok(bodyMatch);
  var rowCount = (bodyMatch[1].match(/<tr>/g) || []).length;
  assert.equal(rowCount, 3);
});
