"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var s = require("../../scripts/renderers/appearance-style.js");

test("appearanceToDecls: background + border + radius", function () {
  var d = s.appearanceToDecls({
    background: "#fff4ec",
    border: { color: "#ffdacf", width: "1px" },
    radius: "4px",
  });
  assert.deepEqual(d, [
    "background:#fff4ec",
    "border:1px solid #ffdacf",
    "border-radius:4px",
  ]);
});

test("appearanceToDecls: text block", function () {
  var d = s.appearanceToDecls({
    text: {
      color: "#50505d",
      size: "12px",
      weight: 400,
      lineHeight: "16px",
      letterSpacing: "0.3px",
    },
  });
  assert.deepEqual(d, [
    "color:#50505d",
    "font-size:12px",
    "font-weight:400",
    "line-height:16px",
    "letter-spacing:0.3px",
  ]);
});

test("appearanceToDecls: null background is skipped, rgba passes through", function () {
  assert.deepEqual(s.appearanceToDecls({ background: null }), []);
  assert.deepEqual(
    s.appearanceToDecls({ background: "rgba(15, 95, 220, 0.8)" }),
    ["background:rgba(15, 95, 220, 0.8)"],
  );
});

test("appearanceToDecls: border with default width when absent", function () {
  assert.deepEqual(s.appearanceToDecls({ border: { color: "#c7c7ce" } }), [
    "border:1px solid #c7c7ce",
  ]);
});

test("appearanceToDecls: empty / non-object -> []", function () {
  assert.deepEqual(s.appearanceToDecls(null), []);
  assert.deepEqual(s.appearanceToDecls({}), []);
});

test("appearanceToDecls: C3 denylist drops injection but keeps legit values", function () {
  // Malicious background carrying a `;` (extra declaration) is dropped whole,
  // while the legit sibling text values survive unchanged.
  var d = s.appearanceToDecls({
    background: "red;position:fixed",
    text: { color: "#50505d", size: "12px", weight: 400 },
  });
  assert.ok(
    !d.some(function (x) {
      return /position:fixed/.test(x);
    }),
    "malicious background must be dropped entirely",
  );
  assert.ok(
    !d.some(function (x) {
      return /^background:/.test(x);
    }),
  );
  assert.deepEqual(d, ["color:#50505d", "font-size:12px", "font-weight:400"]);
});

// F2 — icon glyph color. A resolved glyph draws via currentColor, so the icon
// branch needs a single `color:` declaration (never background/border/radius,
// which would repaint the neutral-box background behind a transparent glyph,
// the washout-bug class). appearance.background on an instance node is always
// the instance root frame's own surface fill, never the glyph color, so
// iconColorDecl only ever reads text.color and otherwise returns "" (glyph
// inherits currentColor from its parent).
test("iconColorDecl: uses text.color when present", function () {
  assert.equal(
    s.iconColorDecl({ background: "#fff4ec", text: { color: "#50505d" } }),
    "color:#50505d",
  );
});

test("iconColorDecl: background alone never used, no fallback", function () {
  assert.equal(s.iconColorDecl({ background: "#fff4ec" }), "");
});

test("iconColorDecl: no color anywhere -> empty string", function () {
  assert.equal(s.iconColorDecl(null), "");
  assert.equal(s.iconColorDecl({}), "");
  assert.equal(s.iconColorDecl({ border: { color: "#c7c7ce" } }), "");
});

test("iconColorDecl: C3 denylist applies to text.color", function () {
  assert.equal(s.iconColorDecl({ text: { color: "red;position:fixed" } }), "");
});

test("iconColorDecl: malicious background is never emitted (background unused)", function () {
  assert.equal(s.iconColorDecl({ background: "url(http://x/e.png)" }), "");
});

// ─── P2 name layer: token names ride as var(--token, value) ─────────────────
// When the anatomy appearance carries the published --zen-* name a color slot
// is bound to, the emit wraps the value as var(<token>, <value>): the value is
// the FALLBACK (fidelity + no washout if the name is unpublished downstream),
// the name enables theming. No token / null token / unsafe token -> value-only
// (byte-identical to Phase 1B). A token never rescues an unsafe VALUE.

test("P2: backgroundToken wraps the value as var(token, value)", function () {
  assert.deepEqual(
    s.appearanceToDecls({
      background: "#f3f5f9",
      backgroundToken: "--zen-color-bg-selected",
    }),
    ["background:var(--zen-color-bg-selected, #f3f5f9)"],
  );
});

test("P2: border.colorToken wraps the color inside the border shorthand", function () {
  assert.deepEqual(
    s.appearanceToDecls({
      border: {
        color: "#0f5fdc",
        colorToken: "--zen-color-primary-500",
        width: "1px",
      },
    }),
    ["border:1px solid var(--zen-color-primary-500, #0f5fdc)"],
  );
});

test("P2: text.colorToken wraps the text color", function () {
  assert.deepEqual(
    s.appearanceToDecls({
      text: {
        color: "#50505d",
        colorToken: "--zen-color-text-secondary",
        size: "12px",
      },
    }),
    ["color:var(--zen-color-text-secondary, #50505d)", "font-size:12px"],
  );
});

test("P2: no token / null token -> value-only (unchanged 1B behavior)", function () {
  assert.deepEqual(s.appearanceToDecls({ background: "#f3f5f9" }), [
    "background:#f3f5f9",
  ]);
  assert.deepEqual(
    s.appearanceToDecls({ background: "#f3f5f9", backgroundToken: null }),
    ["background:#f3f5f9"],
  );
});

test("P2: an unsafe token name is rejected (value-only), never emitted into var()", function () {
  // A token carrying anything outside a CSS custom-property identifier must not
  // reach the output — the value still rides, so fidelity is preserved.
  assert.deepEqual(
    s.appearanceToDecls({
      background: "#fff",
      backgroundToken: "--zen); color:red",
    }),
    ["background:#fff"],
  );
  assert.deepEqual(
    s.appearanceToDecls({ background: "#fff", backgroundToken: "notavar" }),
    ["background:#fff"],
  );
});

test("P2: a token never rescues an UNSAFE value (whole decl still dropped)", function () {
  assert.deepEqual(
    s.appearanceToDecls({
      background: "red;position:fixed",
      backgroundToken: "--zen-color-bg-selected",
    }),
    [],
  );
});

test("P2: iconColorDecl wraps text.color with its token", function () {
  assert.equal(
    s.iconColorDecl({
      text: { color: "#50505d", colorToken: "--zen-color-text-secondary" },
    }),
    "color:var(--zen-color-text-secondary, #50505d)",
  );
});

test("appearanceToDecls: C3 drops url()/braces/markup, keeps hex/rgba/px/rem/%", function () {
  // url(), braces, and </ markup escapes are all rejected.
  assert.deepEqual(
    s.appearanceToDecls({ background: "url(http://x/e.png)" }),
    [],
  );
  assert.deepEqual(s.appearanceToDecls({ background: "#fff}" }), []);
  assert.deepEqual(s.appearanceToDecls({ radius: "4px}</style>" }), []);
  // Everything legit still passes through untouched.
  assert.deepEqual(
    s.appearanceToDecls({
      background: "rgba(0, 0, 0, 0.05)",
      border: { color: "#d3efcd", width: "0.3px" },
      radius: "9999px",
      text: {
        color: "hsl(210, 50%, 40%)",
        size: "1.25rem",
        weight: 700,
        letterSpacing: "0.2px",
      },
    }),
    [
      "background:rgba(0, 0, 0, 0.05)",
      "border:0.3px solid #d3efcd",
      "border-radius:9999px",
      "color:hsl(210, 50%, 40%)",
      "font-size:1.25rem",
      "font-weight:700",
      "letter-spacing:0.2px",
    ],
  );
});

// ─── variantColorDecls: tag bespoke per-variant color overrides ─────────────
// Emits ONLY background + border-color (never radius/border-width/text);
// ds-base.css owns the invariant geometry and default colors). Reuses the
// same has/safeValue/safeToken/tokenized gates as appearanceToDecls, so the
// C3 injection denylist and P2 token-wrap behavior apply identically here.
test.describe("variantColorDecls", function () {
  test.it("variantColorDecls emits only background + border-color", function () {
    var decls = s.variantColorDecls({
      background: "#fff9ff",
      backgroundToken: "--zen-color-tag-purple",
      border: { color: "#f2e6f8", width: "1px" },
      radius: "4px",
      text: { color: "#50505d" },
    });
    assert.deepEqual(decls, [
      "background:var(--zen-color-tag-purple, #fff9ff)",
      "border-color:#f2e6f8",
    ]);
  });

  test.it("variantColorDecls is value-only when no token rides", function () {
    var decls = s.variantColorDecls({
      background: "#fff4ec",
      border: { color: "#ffdacf" },
    });
    assert.deepEqual(decls, ["background:#fff4ec", "border-color:#ffdacf"]);
  });

  test.it("variantColorDecls drops unsafe/absent slots", function () {
    assert.deepEqual(s.variantColorDecls({ background: "red;}" }), []);
    assert.deepEqual(s.variantColorDecls(null), []);
    assert.deepEqual(s.variantColorDecls({ radius: "4px" }), []);
    // Coverage gap (review): an unsafe border.color alone, with no background,
    // must also be dropped whole rather than partially emitted.
    assert.deepEqual(
      s.variantColorDecls({ border: { color: "url(x)" } }),
      [],
    );
  });
});
