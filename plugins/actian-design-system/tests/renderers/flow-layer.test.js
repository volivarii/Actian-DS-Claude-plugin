"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var FR = require(path.join(
  __dirname,
  "..",
  "..",
  "scripts",
  "renderers",
  "html-renderers",
  "flow-renderer.js",
));

describe("layered screens", function () {
  var base = {
    id: "catalog",
    name: "Catalog",
    template: "studio",
    content: [{ type: "TEXT", content: "98 results" }],
  };
  var panel = {
    id: "steward",
    name: "Steward",
    layer: { kind: "panel", over: "catalog" },
    adds: [
      { name: "Data Steward panel", composedFrom: ["drawer"], why: "w" },
    ],
    content: [
      {
        type: "FRAME",
        name: "Panel",
        adds: "Data Steward panel",
        children: [{ type: "TEXT", content: "Message Data Steward" }],
      },
    ],
  };
  it("renders the base byte-identically inside the layer wrapper", function () {
    var baseHtml = FR.renderScreen(base);
    var html = FR.renderLayered(panel, base);
    assert.ok(
      html.indexOf('<div class="flow-layer-base">' + baseHtml + "</div>") !==
        -1,
    );
    assert.match(html, /class="flow-layer flow-layer--panel"/);
  });
  it("rings a declared addition and emits data-goto", function () {
    var html = FR.renderScreen({
      id: "x",
      name: "X",
      template: "bare",
      content: [
        {
          type: "FRAME",
          name: "P",
          adds: "P",
          goto: "catalog",
          children: [],
        },
      ],
    });
    assert.match(html, /class="fm-frame flow-adds"/);
    assert.match(html, /data-adds="P"/);
    assert.match(html, /data-goto="catalog"/);
  });
});
