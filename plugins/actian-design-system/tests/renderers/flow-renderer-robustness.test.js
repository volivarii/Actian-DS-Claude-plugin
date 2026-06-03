"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var flow = require("../../scripts/renderers/html-renderers/flow-renderer.js");

test("fixed-width single-line TEXT node clamps overflow", function () {
  var style = flow.buildTextStyle({ type: "TEXT", text: "x", width: 120 });
  assert.match(style, /overflow\s*:\s*hidden/);
  assert.match(style, /text-overflow\s*:\s*ellipsis/);
});

test("zero/absent dimension RECT emits a min-size guard", function () {
  var html = flow.renderContentNode({ type: "RECT" });
  assert.match(html, /min-width\s*:\s*1px/);
  assert.match(html, /min-height\s*:\s*1px/);
});

test("multi-line TEXT (content with newline) clips without forcing nowrap", function () {
  var style = flow.buildTextStyle({
    type: "TEXT",
    content: "line one\nline two",
    width: 120,
  });
  assert.match(style, /overflow\s*:\s*hidden/);
  assert.ok(
    !/white-space\s*:\s*nowrap/.test(style),
    "multi-line must NOT force nowrap",
  );
});
