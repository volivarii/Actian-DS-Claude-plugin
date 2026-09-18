"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var fs = require("fs");
var FR = require(
  path.join(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "html-renderers",
    "flow-renderer.js",
  ),
);

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
    adds: [{ name: "Data Steward panel", composedFrom: ["drawer"], why: "w" }],
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
  it("keeps both flow-focus and flow-adds on the same FRAME when both are set", function () {
    var html = FR.renderScreen({
      id: "y",
      name: "Y",
      template: "bare",
      content: [
        {
          type: "FRAME",
          name: "F",
          focus: true,
          adds: "X",
          children: [],
        },
      ],
    });
    assert.match(html, /class="fm-frame flow-focus flow-adds"/);
  });
  it("an INSTANCE root carrying goto wraps its rendered leaf in a flow-goto span", function () {
    var html = FR.renderContentNode({
      type: "INSTANCE",
      ref: "fmButton",
      variant: "Type=Primary, Size=md",
      goto: "catalog",
      props: { Label: "Click me" },
    });
    assert.ok(
      html.indexOf('<span class="flow-goto" data-goto="catalog">') === 0,
      "flow-goto span with data-goto opens the markup",
    );
    assert.ok(
      html.indexOf("fm-button") !== -1,
      "the wrapped leaf's own markup is still present",
    );
    assert.ok(
      html.indexOf("Click me") !== -1,
      "the wrapped leaf's content is still present",
    );
    assert.ok(html.endsWith("</span>"), "the span wrapper closes the markup");
  });
  it("a layer body takes the width its root frame declares", function () {
    var drawer = {
      id: "steward",
      name: "Quick edit",
      layer: { kind: "panel", over: "catalog" },
      content: [
        {
          type: "FRAME",
          name: "Quick edit drawer",
          sizing: { horizontal: 550, vertical: "FILL" },
          children: [],
        },
      ],
    };
    var html = FR.renderLayered(drawer, base);
    assert.match(html, /class="flow-layer__body" style="width:550px"/);
  });
  it("a layer body with no declared width keeps the stylesheet's width", function () {
    var toast = {
      id: "saved",
      name: "Saved",
      layer: { kind: "toast", over: "catalog" },
      content: [
        {
          type: "FRAME",
          name: "Toast",
          sizing: { horizontal: "HUG" },
          children: [],
        },
      ],
    };
    var html = FR.renderLayered(toast, base);
    assert.match(html, /class="flow-layer__body">/);
  });
  it("the drawer, panel and toast rules position from --flow-app-header, and the toast keeps its extra 16px", function () {
    var css = fs.readFileSync(
      path.join(
        __dirname,
        "..",
        "..",
        "scripts",
        "renderers",
        "html-renderers",
        "flow-renderer.css",
      ),
      "utf8",
    );
    var rule = function (sel) {
      return css.slice(css.indexOf(sel), css.indexOf("}", css.indexOf(sel)));
    };
    assert.match(
      rule(".flow-layer--drawer .flow-layer__body"),
      /top:\s*var\(--flow-app-header\)/,
    );
    assert.match(
      rule(".flow-layer--panel .flow-layer__body"),
      /top:\s*var\(--flow-app-header\)/,
    );
    assert.match(
      rule(".flow-layer--toast .flow-layer__body"),
      /top:\s*calc\(var\(--flow-app-header\)\s*\+\s*16px\)/,
    );
  });
  it("a layer over a DS-chromed base carries --flow-app-header:64px", function () {
    var dsBase = {
      id: "ds-base",
      name: "DS base",
      template: "admin",
      library: "ds",
      content: [{ type: "TEXT", content: "content" }],
    };
    var html = FR.renderLayered(panel, dsBase);
    assert.match(
      html,
      /<div class="screen screen--layered" data-name="[^"]*" style="--flow-app-header:64px">/,
    );
  });
  it("a layer over an FM-chromed base carries --flow-app-header:70px", function () {
    var html = FR.renderLayered(panel, base);
    assert.match(
      html,
      /<div class="screen screen--layered" data-name="[^"]*" style="--flow-app-header:70px">/,
    );
  });
  it("a layer over a bare base carries --flow-app-header:0px", function () {
    var bareBase = {
      id: "bare-base",
      name: "Bare base",
      template: "bare",
      content: [{ type: "TEXT", content: "content" }],
    };
    var html = FR.renderLayered(panel, bareBase);
    assert.match(
      html,
      /<div class="screen screen--layered" data-name="[^"]*" style="--flow-app-header:0px">/,
    );
  });
  it("a layer over a base with no recognized template carries the offset its own rendered HTML contains (0, no header emitted)", function () {
    var unknownBase = {
      id: "unknown-base",
      name: "Unknown base",
      template: "browse-search",
      content: [{ type: "TEXT", content: "content" }],
    };
    var html = FR.renderLayered(panel, unknownBase);
    assert.match(
      html,
      /<div class="screen screen--layered" data-name="[^"]*" style="--flow-app-header:0px">/,
    );
  });
});
