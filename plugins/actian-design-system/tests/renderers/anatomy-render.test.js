#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var { renderAnatomy } = require(path.resolve(__dirname, "..", "..", "scripts", "renderers", "anatomy-render.js"));

var GOOD = { slug: "x", quality: { ratio: 0.9 }, root: {
  name: "root", kind: "container", layout: { axis: "row", gap: "8px", padding: { top: "0px", right: "12px", bottom: "0px", left: "12px" }, align: { main: "center", cross: "center" } },
  children: [ { name: "label", kind: "text" }, { name: "icon", kind: "vector" } ] } };

describe("anatomy-render", function () {
  var loader = function () { return GOOD; };
  it("renders a container with flex layout + nested text/vector parts", function () {
    var html = renderAnatomy("x", { loader: loader });
    assert.ok(html.indexOf("ds-anatomy") !== -1);
    assert.ok(html.indexOf("display:flex") !== -1 && html.indexOf("flex-direction:row") !== -1);
    assert.ok(html.indexOf("gap:8px") !== -1 && html.indexOf("padding:0px 12px 0px 12px") !== -1);
    assert.ok(html.indexOf("ds-anatomy__text") !== -1 && html.indexOf("ds-anatomy__vector") !== -1);
  });
  it("returns null when ratio < minRatio", function () {
    assert.strictEqual(renderAnatomy("x", { loader: function () { return { quality: { ratio: 0.4 }, root: GOOD.root }; } }), null);
  });
  it("returns null when missing/no root", function () {
    assert.strictEqual(renderAnatomy("x", { loader: function () { return null; } }), null);
    assert.strictEqual(renderAnatomy("x", { loader: function () { return { quality: { ratio: 0.9 } }; } }), null);
  });
  it("escapes text content (XSS-safe)", function () {
    var html = renderAnatomy("x", { loader: function () { return { quality: { ratio: 0.9 }, root: { kind: "text", text: "<script>" } }; } });
    assert.ok(html.indexOf("<script>") === -1 && html.indexOf("&lt;script&gt;") !== -1);
  });
  it("is deterministic", function () {
    assert.strictEqual(renderAnatomy("x", { loader: loader }), renderAnatomy("x", { loader: loader }));
  });
  it("applies binding classes and cssVars to root wrapper", function () {
    var binding = { classes: ["ds--state-disabled"], cssVars: { background: "var(--zen-color-x)" } };
    var html = renderAnatomy("x", { loader: loader, binding: binding });
    assert.ok(html.indexOf("ds--state-disabled") !== -1, "root div should contain binding class");
    assert.ok(html.indexOf("background:var(--zen-color-x)") !== -1, "root div should contain cssVar style");
  });
  it("is neutral (no style= or binding classes) when no binding provided", function () {
    var html = renderAnatomy("x", { loader: loader });
    // Root wrapper should have no style attribute and no ds-- binding class
    var rootDivMatch = html.match(/^<div[^>]*>/);
    assert.ok(rootDivMatch, "html should start with a root div");
    var rootDiv = rootDivMatch[0];
    assert.ok(rootDiv.indexOf("style=") === -1, "root div should have no style attribute when no binding");
    assert.ok(rootDiv.indexOf("ds--") === -1, "root div should have no ds-- binding class when no binding");
  });
});
