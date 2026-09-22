"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var flow = require("../../plugins/actian-design-system/scripts/renderers/html-renderers/flow-renderer.js");

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

test("TEXT node with a Semi Bold font gets fm-text--heading", function () {
  var html = flow.renderContentNode({
    type: "TEXT",
    content: "Section title",
    font: "Inter:Semi Bold",
  });
  assert.match(html, /class="fm-text fm-text--heading"/);
});

test("TEXT node with keep:true gets fm-text--keep", function () {
  var html = flow.renderContentNode({
    type: "TEXT",
    content: "Active item",
    keep: true,
  });
  assert.match(html, /class="fm-text fm-text--keep"/);
});

test("FRAME node with focus:true gets flow-focus", function () {
  var html = flow.renderContentNode({
    type: "FRAME",
    focus: true,
    children: [],
  });
  assert.match(html, /class="fm-frame flow-focus"/);
});
