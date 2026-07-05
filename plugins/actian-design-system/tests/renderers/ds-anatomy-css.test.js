"use strict";

// ds-anatomy-css.test.js — I1: the appearance structural floor must be
// visible. appearance-render.js emits aria-hidden
// <div class="ds-appearance__image|__vector|__icon"> media boxes that render
// 0x0 without CSS. Assert ds-base.css sizes the media slots and fills them
// from tokens (no hardcoded color, per the DS rule of 100% token binding).
//
// The legacy .ds-anatomy__* structural floor (and its only emitter,
// anatomy-render.js's slug-to-HTML path) was retired in Group C; this suite
// now guards only the surviving .ds-appearance* floor.

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var CSS = fs.readFileSync(
  path.join(__dirname, "../../scripts/renderers/html-renderers/ds-base.css"),
  "utf8",
);

describe("ds-base.css: anatomy structural floor (I1)", function () {
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
