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
  it("the color:transparent bar rules use !important (2026-09-16 LOOK: an inline style=\"color:var(--zen-…)\" on every authored .fm-text span otherwise wins over the external rule and no bar is ever visible)", function () {
    var out = skin.lofiSkinCss("");
    assert.match(out, /\.fm-text:not\([^)]*\)[^{]*\{\s*color:\s*transparent\s*!important/, "the fm-text bar rule beats an inline color");
    assert.match(out, /__helper[^{]*\{\s*color:\s*transparent\s*!important/, "the DS-leaf description bar rule beats an inline color too");
  });
  it("re-asserts the token remap under any nested [data-theme] scope (2026-09-16 LOOK: a rendered .screen always carries data-theme=\"…\", and tokens.css's own [data-theme=\"…\"] block re-declares the same --zen-* properties on that element — shadowing the [data-skin=\"lofi\"] ancestor's remap for the whole screen unless re-declared at least as specifically)", function () {
    var out = skin.lofiSkinCss(":root{--zen-color-text-primary:#0f5fdc;}\n[data-theme=\"studio\"]{--zen-color-text-primary:#0283be;}");
    assert.match(out, /\[data-skin="lofi"\]\s*\[data-theme\]\s*\{/, "re-declares the mapped tokens scoped under a nested [data-theme]");
    var themedBlock = out.match(/\[data-skin="lofi"\]\s*\[data-theme\]\s*\{([^}]*)\}/);
    assert.ok(themedBlock, "the nested-theme block exists");
    assert.match(themedBlock[1], /--zen-color-text-primary:\s*var\(--fm-text-primary\)/, "the nested block maps the same token, never leaking the theme's brand hex");
  });
  it("bars an inactive DS app-chrome side-nav item's label, leaves the active one alone (2026-09-16 LOOK: .ds-sidenav is a separate markup vocabulary from .fm-text)", function () {
    var out = skin.lofiSkinCss("");
    assert.match(out, /\.ds-sidenav__item:not\(\.is-active\)\s*\.ds-sidenav__label\s*\{\s*color:\s*transparent\s*!important/, "inactive side-nav labels are barred");
    assert.doesNotMatch(out, /\.ds-sidenav__item\.is-active[^{]*\{[^}]*transparent/, "the active side-nav item is never barred");
  });
});
