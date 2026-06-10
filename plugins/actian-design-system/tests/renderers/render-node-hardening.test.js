"use strict";

// render-node-hardening.test.js — TDD tests for audit bugs B5, B6, B10.
// B5: object fill.color must not leak [object Object] into style attributes.
// B6: hostile CSS color value must not escape the style attribute.
// B10: non-string font must not throw — degrades gracefully.

var { describe, it } = require("node:test");
var assert = require("node:assert");

var { renderNode, buildFrameStyle, buildTextStyle } =
  require("../../scripts/renderers/html-renderers/render-node.js");

// ---------------------------------------------------------------------------
// B5: fillToCss — object fill with object color leaks [object Object]
// ---------------------------------------------------------------------------
describe("render-node hardening: B5 — fillToCss object fill.color", function () {
  it("FRAME with object fill {type:SOLID, color:{r,g,b}} must not contain '[object Object]'", function () {
    var node = {
      type: "FRAME",
      name: "Box",
      fills: [{ type: "SOLID", color: { r: 1, g: 0, b: 0 } }],
    };
    var html = renderNode(node, {});
    assert.ok(
      html.indexOf("[object Object]") === -1,
      "must not leak [object Object] into output (got: " + html + ")",
    );
  });

  it("buildFrameStyle with object fill.color returns a string without [object Object]", function () {
    var style = buildFrameStyle({
      fills: [{ type: "SOLID", color: { r: 0, g: 1, b: 0 } }],
    });
    assert.ok(
      style.indexOf("[object Object]") === -1,
      "style must not contain [object Object]",
    );
  });

  it("FRAME with string fill still works (regression)", function () {
    var node = {
      type: "FRAME",
      name: "Box",
      fills: ["#FF0000"],
    };
    var html = renderNode(node, {});
    assert.ok(html.indexOf("background:#FF0000") !== -1, "string fill passes through");
  });
});

// ---------------------------------------------------------------------------
// B6: style attribute injection via hostile CSS color value
// ---------------------------------------------------------------------------
describe("render-node hardening: B6 — style attribute injection via color", function () {
  // The color field in a TEXT node flows into the style string as
  // "color:" + node.color. Without escaping at the style attribute concat
  // site, a hostile value that contains a double-quote can break out of the
  // attribute and inject event handlers.
  it("TEXT node with hostile color value must not contain raw event handler in output", function () {
    var hostile = 'red" onmouseover="alert(1)';
    var node = {
      type: "TEXT",
      name: "Inject",
      color: hostile,
      content: "Hello",
    };
    var html = renderNode(node, {});
    // The raw attribute-breaking sequence must be escaped
    assert.ok(
      html.indexOf('onmouseover="alert(1)') === -1,
      "must not contain unescaped event handler (got: " + html + ")",
    );
  });

  it("TEXT node with hostile color: style attribute must use &quot; not raw quote", function () {
    var hostile = 'red" onmouseover="alert(1)';
    var node = {
      type: "TEXT",
      name: "Inject",
      color: hostile,
      content: "Hello",
    };
    var html = renderNode(node, {});
    // The style attribute itself must still be properly closed
    assert.ok(
      html.indexOf("&quot;") !== -1 || html.indexOf('onmouseover') === -1,
      "hostile quote in style must be escaped",
    );
  });

  it("TEXT node with benign color is unaffected (regression)", function () {
    var node = {
      type: "TEXT",
      name: "Plain",
      color: "#1A1A1A",
      content: "Hello",
    };
    var html = renderNode(node, {});
    assert.ok(html.indexOf("color:#1A1A1A") !== -1, "benign color passes through in style");
    assert.ok(html.indexOf("Hello") !== -1, "content rendered");
  });
});

// ---------------------------------------------------------------------------
// B10: non-string font — renderNode must not throw
// ---------------------------------------------------------------------------
describe("render-node hardening: B10 — non-string font does not throw", function () {
  it("TEXT node with font: 42 (number) must not throw and must return a non-empty string", function () {
    var node = {
      type: "TEXT",
      name: "BadFont",
      font: 42,
      content: "Hello",
    };
    var html;
    assert.doesNotThrow(function () {
      html = renderNode(node, {});
    }, "renderNode must not throw on non-string font");
    assert.ok(
      typeof html === "string" && html.length > 0,
      "must return a non-empty string (got: " + html + ")",
    );
  });

  it("TEXT node with font: null must not throw", function () {
    var node = {
      type: "TEXT",
      name: "NullFont",
      font: null,
      content: "Hi",
    };
    assert.doesNotThrow(function () {
      renderNode(node, {});
    });
  });

  it("FRAME with non-string stroke.color must not throw", function () {
    var node = {
      type: "FRAME",
      name: "BadStroke",
      stroke: { color: { r: 0, g: 0, b: 0 }, weight: 1 },
    };
    assert.doesNotThrow(function () {
      renderNode(node, {});
    });
  });

  it("sibling nodes still render after a bad node (resilience)", function () {
    var frame = {
      type: "FRAME",
      name: "Parent",
      children: [
        { type: "TEXT", name: "Bad", font: 42, content: "Bad" },
        { type: "TEXT", name: "Good", font: "Inter:Regular", content: "Good" },
      ],
    };
    var html;
    assert.doesNotThrow(function () {
      html = renderNode(frame, {});
    });
    assert.ok(
      html.indexOf("Good") !== -1,
      "sibling text must still render after bad node",
    );
  });
});
