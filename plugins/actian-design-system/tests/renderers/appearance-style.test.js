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
