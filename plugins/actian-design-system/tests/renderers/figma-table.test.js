"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");

var figma = require("../../scripts/renderers/figma-table/render-figma.js");
var html = require("../../scripts/renderers/figma-table/render-html.js");

// ---------------------------------------------------------------------------
// Hermetic token set used by most tests so failures don't depend on the live
// registry shape. Two dedicated tests below exercise loadTokenNames() against
// vendor/tokens/tokens.json directly.
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

// ---------------------------------------------------------------------------
// additionalProperties enforcement — schema declares it, validator must too.
// Stray fields are improvisation surface and break the determinism guarantee.
// ---------------------------------------------------------------------------

test("validate rejects unexpected field on spec root", function () {
  var s = spec([], { headers: ["A"] });
  s.madeUpField = true;
  var errors = figma.validate(s, TEST_TOKENS);
  var match = errors.find(function (e) {
    return e.path === "$.madeUpField";
  });
  assert.ok(match, "expected $.madeUpField error");
  assert.match(match.suggestion, /Allowed:/);
});

test("validate rejects unexpected field on row", function () {
  var s = spec([{ cells: [{ type: "text", value: "x" }], orphan: 1 }], {
    headers: ["A"],
  });
  var errors = figma.validate(s, TEST_TOKENS);
  var match = errors.find(function (e) {
    return e.path === "rows[0].orphan";
  });
  assert.ok(match);
  assert.match(match.message, /Unexpected field on row/);
});

test("validate rejects stray field on text cell", function () {
  // Bug class: AI improvises a 'color' field on text cells. The schema bans
  // it; the validator must catch it before the interpreter runs.
  var s = spec([{ cells: [{ type: "text", value: "x", color: "#fff" }] }], {
    headers: ["A"],
  });
  var errors = figma.validate(s, TEST_TOKENS);
  var match = errors.find(function (e) {
    return e.path === "rows[0].cells[0].color";
  });
  assert.ok(match);
  assert.match(match.suggestion, /Allowed: type, value, weight/);
});

test("validate rejects stray field on token-pill / code / badge / color-swatch / empty", function () {
  // One per cell type — guards against future additions to CELL_ALLOWED_KEYS
  // forgetting a discriminator.
  var cases = [
    { type: "token-pill", value: "--zen-spacing-lg", stray: "stray" },
    { type: "code", value: "x", stray: "stray" },
    { type: "badge", variant: "req", stray: "stray" },
    {
      type: "color-swatch",
      color: "#0550DC",
      tokenName: "--zen-color-bg-emphasis",
      stray: "stray",
    },
    { type: "empty", stray: "stray" },
  ];
  cases.forEach(function (cell, i) {
    var s = spec([{ cells: [cell] }], { headers: ["A"] });
    var errors = figma.validate(s, TEST_TOKENS);
    var match = errors.find(function (e) {
      return e.path === "rows[0].cells[0].stray";
    });
    assert.ok(match, "case " + i + " (" + cell.type + ") should reject stray");
  });
});

// ---------------------------------------------------------------------------
// Footnote ↔ footnoteRef cross-reference. Dangling refs render as superscripts
// pointing nowhere — silent UX bug. The validator catches them at the boundary.
// ---------------------------------------------------------------------------

test("validate rejects dangling footnoteRef with no footnotes[]", function () {
  var s = spec([{ cells: [{ type: "text", value: "x" }], footnoteRef: "*" }], {
    headers: ["A"],
  });
  var errors = figma.validate(s, TEST_TOKENS);
  var match = errors.find(function (e) {
    return e.path === "rows[0].footnoteRef";
  });
  assert.ok(match);
  assert.match(match.message, /not defined in footnotes/);
  assert.ok(match.suggestion);
});

test("validate rejects footnoteRef that doesn't match any footnotes[] entry", function () {
  var s = spec([{ cells: [{ type: "text", value: "x" }], footnoteRef: "†" }], {
    headers: ["A"],
  });
  s.footnotes = [{ ref: "*", text: "asterisk note" }];
  var errors = figma.validate(s, TEST_TOKENS);
  var match = errors.find(function (e) {
    return e.path === "rows[0].footnoteRef";
  });
  assert.ok(match);
  assert.match(match.message, /"†" not defined/);
});

test("validate accepts footnoteRef when a matching footnotes[] entry exists", function () {
  var s = spec([{ cells: [{ type: "text", value: "x" }], footnoteRef: "*" }], {
    headers: ["A"],
  });
  s.footnotes = [{ ref: "*", text: "asterisk note" }];
  var errors = figma.validate(s, TEST_TOKENS);
  assert.deepEqual(errors, []);
});

test("validate rejects footnotes[] entry missing ref or text", function () {
  var s = spec([], { headers: ["A"] });
  s.footnotes = [{ ref: "*" }, { text: "no ref" }];
  var errors = figma.validate(s, TEST_TOKENS);
  assert.ok(
    errors.some(function (e) {
      return e.path === "footnotes[0].text";
    }),
  );
  assert.ok(
    errors.some(function (e) {
      return e.path === "footnotes[1].ref";
    }),
  );
});

test("validate rejects unexpected field on footnote", function () {
  var s = spec([], { headers: ["A"] });
  s.footnotes = [{ ref: "*", text: "note", priority: "high" }];
  var errors = figma.validate(s, TEST_TOKENS);
  var match = errors.find(function (e) {
    return e.path === "footnotes[0].priority";
  });
  assert.ok(match);
});

// ---------------------------------------------------------------------------
// Live-registry validation — proves loadTokenNames() walks the actual DTCG
// token file correctly. The other validate tests use a hardcoded TEST_TOKENS
// Set for hermeticism; this test confirms the walker handles the real shape.
// ---------------------------------------------------------------------------

test("loadTokenNames parses the live vendor/tokens/tokens.json registry", function () {
  var names = figma.loadTokenNames();
  assert.ok(names instanceof Set, "expected a Set");
  assert.ok(names.size > 100, "expected >100 tokens, got " + names.size);
  // Three known tokens that the brief generator references in production.
  // If any of these disappear, briefs will break — so this triples as a
  // canary for accidental token deletions.
  assert.ok(names.has("--zen-spacing-lg"));
  assert.ok(names.has("--zen-color-bg-emphasis"));
  assert.ok(names.has("--zen-border-radius-xs"));
});

test("validate against live registry: known token passes, typo fails", function () {
  var names = figma.loadTokenNames();
  var ok = spec(
    [{ cells: [{ type: "token-pill", value: "--zen-color-bg-emphasis" }] }],
    { headers: ["Token"] },
  );
  assert.deepEqual(figma.validate(ok, names), []);

  var typo = spec(
    [{ cells: [{ type: "token-pill", value: "--zen-color-bg-emphsis" }] }],
    { headers: ["Token"] },
  );
  var errors = figma.validate(typo, names);
  assert.ok(
    errors.some(function (e) {
      return /not found in registry/i.test(e.message);
    }),
  );
});
