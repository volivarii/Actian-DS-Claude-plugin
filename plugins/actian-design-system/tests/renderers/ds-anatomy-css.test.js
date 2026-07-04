"use strict";

// ds-anatomy-css.test.js — I1: the anatomy structural floor must be visible.
// anatomy-render.js emits aria-hidden <div class="ds-anatomy__image|__vector">
// media boxes that render 0x0 without CSS, and a .ds-anatomy wrapper with no
// neutral surface. Assert ds-base.css sizes the media slots and fills them from
// tokens (no hardcoded color — DS rule: 100% token binding).

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var CSS = fs.readFileSync(
  path.join(__dirname, "../../scripts/renderers/html-renderers/ds-base.css"),
  "utf8",
);

// Every CSS rule block whose selector list mentions ds-anatomy.
function anatomyBlocks() {
  var re = /([^{}]*ds-anatomy[^{}]*)\{([^}]*)\}/g;
  var blocks = [];
  var m;
  while ((m = re.exec(CSS))) {
    blocks.push({ selector: m[1].trim(), body: m[2] });
  }
  return blocks;
}

describe("ds-base.css: anatomy structural floor (I1)", function () {
  it("media placeholders (__image/__vector) are sized so they are visible", function () {
    var media = anatomyBlocks().filter(function (b) {
      return /ds-anatomy__(image|vector)/.test(b.selector);
    });
    assert.ok(
      media.length > 0,
      "ds-base.css must style .ds-anatomy__image / .ds-anatomy__vector",
    );
    var body = media
      .map(function (b) {
        return b.body;
      })
      .join("\n");
    assert.ok(
      /(min-width|width|min-height|height|min-block-size|block-size|inline-size)\s*:/.test(
        body,
      ),
      "media placeholders must declare a non-zero dimension (else they render 0x0)",
    );
    assert.ok(
      /background[^;]*:\s*var\(--zen-/.test(body),
      "media placeholders must have a token-bound neutral fill",
    );
  });

  it("anatomy rules are tokens-only (no hardcoded color)", function () {
    var blocks = anatomyBlocks();
    assert.ok(blocks.length > 0, "expected .ds-anatomy rules to exist");
    blocks.forEach(function (b) {
      assert.ok(
        !/#[0-9a-fA-F]{3,8}\b/.test(b.body),
        "no hardcoded hex in anatomy rule: " + b.selector,
      );
      assert.ok(
        !/\b(rgb|rgba|hsl|hsla)\(/.test(b.body),
        "no hardcoded rgb/hsl in anatomy rule: " + b.selector,
      );
    });
  });

  // Phase 1B: appearance-render.js emits parallel .ds-appearance* classes for
  // the SAME structural floor. Without CSS coverage, appearance media nodes
  // (avatar/spinner/illustration/logos) render 0x0 and vanish (R1), and text
  // loses the DS font (R3). Assert the shared floor covers the appearance side.
  function appearanceBlocks() {
    var re = /([^{}]*ds-appearance[^{}]*)\{([^}]*)\}/g;
    var blocks = [];
    var m;
    while ((m = re.exec(CSS)))
      blocks.push({ selector: m[1].trim(), body: m[2] });
    return blocks;
  }

  it("appearance media slots (__image/__vector/__icon) are sized + token-filled (R1)", function () {
    [
      "ds-appearance__image",
      "ds-appearance__vector",
      "ds-appearance__icon",
    ].forEach(function (klass) {
      var media = appearanceBlocks().filter(function (b) {
        return b.selector.indexOf(klass) !== -1;
      });
      assert.ok(media.length > 0, "ds-base.css must style ." + klass);
      var body = media
        .map(function (b) {
          return b.body;
        })
        .join("\n");
      assert.ok(
        /(min-width|width|min-height|height)\s*:/.test(body),
        klass + " must declare a non-zero dimension (else it renders 0x0)",
      );
      assert.ok(
        /background[^;]*:\s*var\(--zen-/.test(body),
        klass + " must have a token-bound neutral fill",
      );
    });
  });

  it("appearance text carries the DS font-family (R3)", function () {
    var text = appearanceBlocks().filter(function (b) {
      return b.selector.indexOf("ds-appearance__text") !== -1;
    });
    assert.ok(text.length > 0, "ds-base.css must style .ds-appearance__text");
    var body = text
      .map(function (b) {
        return b.body;
      })
      .join("\n");
    assert.ok(
      /font-family\s*:\s*var\(--zen-font-family/.test(body),
      "ds-appearance__text must bind the DS font-family token (else Inter)",
    );
  });
});
