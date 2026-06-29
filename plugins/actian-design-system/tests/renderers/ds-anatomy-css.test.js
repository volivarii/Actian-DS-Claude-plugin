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
});
