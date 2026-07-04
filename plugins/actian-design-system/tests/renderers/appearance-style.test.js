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
    text: { color: "#50505d", size: "12px", weight: 400, lineHeight: "16px", letterSpacing: "0.3px" },
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
  assert.deepEqual(s.appearanceToDecls({ background: "rgba(15, 95, 220, 0.8)" }), [
    "background:rgba(15, 95, 220, 0.8)",
  ]);
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
