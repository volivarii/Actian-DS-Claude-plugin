"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");
var skin = require(path.join(__dirname, "..", "..", "scripts", "renderers", "lofi-skin.js"));

describe("lofi-skin", function () {
  it("grays every --zen-color-* token and leaves others alone", function () {
    var css = ":root{--zen-color-primary-500:#1a6ee0;--zen-space-4:16px;--zen-color-text-default:#101828;}";
    var out = skin.lofiSkinCss(css);
    assert.match(out, /\[data-skin="lofi"\]\s*\{/);
    assert.match(out, /--zen-color-primary-500:\s*#([0-9a-f]{2})\1\1;/, "primary becomes an r=g=b gray");
    assert.doesNotMatch(out, /--zen-space-4/, "spacing is not a colour");
  });
  it("maps white to white and black to black", function () {
    var out = skin.lofiSkinCss(":root{--zen-color-a:#ffffff;--zen-color-b:#000000;}");
    assert.match(out, /--zen-color-a:\s*#ffffff/);
    assert.match(out, /--zen-color-b:\s*#000000/);
  });
  it("maps text and surface tokens onto the FM palette instead of computing a gray", function () {
    var out = skin.lofiSkinCss(":root{--zen-color-text-default:#101828;--zen-color-background-subtle:#f2f4f7;--zen-color-primary-500:#1a6ee0;}");
    assert.match(out, /--zen-color-text-default:\s*var\(--fm-text-primary\)/);
    assert.match(out, /--zen-color-background-subtle:\s*var\(--fm-base-100\)/);
    assert.match(out, /--zen-color-primary-500:\s*#([0-9a-f]{2})\1\1;/, "brand becomes a gray, never a blue");
  });
  it("carries the placeholder rules: regular text is a bar, heading text and keep stay legible, focus is untouched", function () {
    var out = skin.lofiSkinCss("");
    assert.match(out, /\.fm-text:not\(\.flow-focus \*\):not\(\.fm-text--heading\):not\(\.fm-text--keep\)/, "regular text outside focus becomes a bar");
    assert.match(out, /color:\s*transparent/);
    assert.match(out, /background:\s*var\(--fm-base-300\)/, "bars use the FM bar colour");
    assert.match(out, /__desc|__prop|__tech/, "a DS card's secondary text is barred, its title is not");
    assert.doesNotMatch(out, /\.flow-focus \.fm-text\b[^{]*\{[^}]*transparent/, "nothing inside focus is barred by the skin");
  });
});
