"use strict";

// text-style-font-tolerance.test.js — TEXT node `font` accepts the object
// form { family?, weight? } (a screen-generator sometimes authors this
// instead of the schema's "Family:Weight" string) without throwing into
// render-node.js's catch-all render-error fallback.

var { describe, it } = require("node:test");
var assert = require("node:assert");

var { renderNode, buildTextStyle } = require("../../scripts/renderers/html-renderers/render-node.js");

describe("buildTextStyle: object-form font", function () {
  it("object font with weight: semibold renders font-weight:600 and no render-error", function () {
    var node = { type: "TEXT", content: "Product overview", size: 16, font: { weight: "semibold" } };
    var html = renderNode(node, {});
    assert.ok(html.indexOf("render-error") === -1, "must not fall into render-error (got: " + html + ")");
    assert.ok(html.indexOf("font-weight:600") !== -1, "must set font-weight:600 (got: " + html + ")");
    assert.ok(html.indexOf("Product overview") !== -1, "content still renders");
  });

  it("object font falls back to the caller's defaultFont when family is omitted", function () {
    var style = buildTextStyle({ font: { weight: "bold" } }, { defaultFont: "Roboto" });
    assert.ok(style.indexOf("font-family:Roboto") !== -1, "falls back to opts.defaultFont (got: " + style + ")");
    assert.ok(style.indexOf("font-weight:700") !== -1, "bold alias resolves to 700 (got: " + style + ")");
  });

  it("object font with an explicit family is honored", function () {
    var style = buildTextStyle({ font: { family: "Georgia", weight: "medium" } }, {});
    assert.ok(style.indexOf("font-family:Georgia") !== -1, "honors explicit family (got: " + style + ")");
    assert.ok(style.indexOf("font-weight:500") !== -1, "medium alias resolves to 500 (got: " + style + ")");
  });

  it("the string form still works (regression)", function () {
    var node = { type: "TEXT", content: "Status", size: 13, font: "Inter:Semi Bold" };
    var html = renderNode(node, {});
    assert.ok(html.indexOf("render-error") === -1, "string form must not render-error");
    assert.ok(html.indexOf("font-family:Inter") !== -1, "string form family (got: " + html + ")");
    assert.ok(html.indexOf("font-weight:600") !== -1, "string form weight (got: " + html + ")");
  });

  it("an unrecognized non-string, non-object font (e.g. a number) is ignored, not thrown", function () {
    var html;
    assert.doesNotThrow(function () {
      html = renderNode({ type: "TEXT", content: "Odd", font: 42 }, {});
    });
    assert.ok(html.indexOf("render-error") === -1, "a bad scalar font must not render-error either (got: " + html + ")");
    assert.ok(html.indexOf("Odd") !== -1, "content still renders");
  });
});
