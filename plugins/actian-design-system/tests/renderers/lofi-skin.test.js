"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
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
    var out = skin.lofiSkinCss(":root{--zen-color-text-default:#101828;--zen-color-bg-subtle:#f2f4f7;--zen-color-primary-500:#1a6ee0;--zen-border-primary:#0f5fdc;}");
    assert.match(out, /--zen-color-text-default:\s*var\(--fm-text-primary\)/);
    assert.match(out, /--zen-color-bg-subtle:\s*var\(--fm-base-100\)/, "the real bg-token family (not -background-) maps to fm-base-100");
    assert.match(out, /--zen-color-primary-500:\s*#([0-9a-f]{2})\1\1;/, "brand becomes a gray, never a blue");
    assert.match(out, /--zen-border-primary:\s*var\(--fm-border\)/, "the real border-token family (--zen-border-*, not --zen-color-border-*) maps to fm-border, never the surviving brand hex #0f5fdc");
  });
  it("runs against the real vendor/tokens/tokens.css: declares the real border/bg families and never leaks a non-fm, non-gray hex", function () {
    var tokensPath = path.join(__dirname, "..", "..", "vendor", "tokens", "tokens.css");
    var tokensCss = fs.readFileSync(tokensPath, "utf8");
    var out = skin.lofiSkinCss(tokensCss);

    assert.match(out, /--zen-border-primary:/, "declares the real --zen-border-* family (not --zen-color-border-*, which does not exist)");
    assert.match(out, /--zen-color-bg-subtle:/, "declares the real --zen-color-bg-* family (not --zen-color-background-*, which does not exist)");

    var block = out.match(/\[data-skin="lofi"\]\s*\{([^}]*)\}/);
    assert.ok(block, 'emits a [data-skin="lofi"] block');
    var lines = block[1].split("\n").filter(function (l) {
      return l.trim().length > 0;
    });
    assert.ok(lines.length > 20, "the real tokens.css yields a non-trivial number of declarations");
    lines.forEach(function (line) {
      assert.match(
        line,
        /:\s*(?:var\(--fm-[a-z0-9-]+\)|#([0-9a-f]{2})\1\1)\s*;\s*$/,
        "every emitted value must be an fm var() or an r=g=b gray, never a brand hex: " + line,
      );
    });
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
