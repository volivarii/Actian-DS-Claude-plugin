"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert/strict");
var path = require("path");

var look = require(path.join(__dirname, "..", "..", "scripts", "renderers", "look.js"));

describe("look.buildLookHtml (pure)", function () {
  it("builds a side-by-side page with both images and a three-line prompt", function () {
    var html = look.buildLookHtml({
      renderPng: "look-1.png",
      againstPng: "captures/faceted-browse.png",
      title: "Catalog",
    });
    assert.match(html, /<img[^>]+src="look-1\.png"/);
    assert.match(html, /<img[^>]+src="captures\/faceted-browse\.png"/);
    assert.match(html, /What differs, three lines/);
  });

  it("labels the two columns Render and Product", function () {
    var html = look.buildLookHtml({ renderPng: "a.png", againstPng: "b.png", title: "X" });
    assert.match(html, /<h2>Render<\/h2>/);
    assert.match(html, /<h2>Product<\/h2>/);
  });

  it("escapes the title so it cannot break out of the page", function () {
    var html = look.buildLookHtml({
      renderPng: "a.png",
      againstPng: "b.png",
      title: "<script>alert(1)</script>",
    });
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  });
});

describe("look.main (CLI)", function () {
  it("exits 1 with the usage line when a required arg is missing", function () {
    var written = "";
    var realWrite = process.stderr.write;
    process.stderr.write = function (s) {
      written += s;
      return true;
    };
    var code;
    try {
      code = look.main(["flow.json", "--screen", "1", "-o", "/tmp/look-out"]);
    } finally {
      process.stderr.write = realWrite;
    }
    assert.strictEqual(code, 1);
    assert.match(written, /usage: look\.js/);
  });

  it("exits 1 when the input is not a .json path (no ?screen=n on the share HTML)", function () {
    var written = "";
    var realWrite = process.stderr.write;
    process.stderr.write = function (s) {
      written += s;
      return true;
    };
    var code;
    try {
      code = look.main([
        "flow-share.html",
        "--screen",
        "1",
        "--against",
        "against.png",
        "-o",
        "/tmp/look-out",
      ]);
    } finally {
      process.stderr.write = realWrite;
    }
    assert.strictEqual(code, 1);
    assert.match(written, /flow-data \.json path/);
  });

  it("exits 2 with the resolver's message when Chrome is absent", function () {
    var fakeResolveBinaries = {
      resolveAll: function () {
        return { chrome: null };
      },
      requireAll: function () {
        throw new Error(
          "[fidelity] missing required tool:\n  - Chrome/Chromium (set CHROME_BIN, or install Google Chrome)",
        );
      },
    };
    var written = "";
    var realWrite = process.stderr.write;
    process.stderr.write = function (s) {
      written += s;
      return true;
    };
    var code;
    try {
      code = look.main(
        ["flow.json", "--screen", "1", "--against", "against.png", "-o", "/tmp/look-out"],
        { resolveBinaries: fakeResolveBinaries },
      );
    } finally {
      process.stderr.write = realWrite;
    }
    assert.strictEqual(code, 2);
    assert.match(written, /missing required tool/);
    assert.match(written, /Chrome\/Chromium/);
  });
});

describe("look.renderScreenFragment", function () {
  it("renders screen n (1-based) as an HTML fragment", function () {
    var flowData = {
      meta: {},
      screens: [
        { name: "One", template: "bare", content: [{ type: "TEXT", content: "First" }] },
        { name: "Two", template: "bare", content: [{ type: "TEXT", content: "Second" }] },
      ],
    };
    var out = look.renderScreenFragment(flowData, 2);
    assert.match(out.html, /Second/);
    assert.strictEqual(out.screen.name, "Two");
  });

  it("throws on an out-of-range screen index", function () {
    var flowData = { meta: {}, screens: [{ name: "One", template: "bare", content: [] }] };
    assert.throws(function () {
      look.renderScreenFragment(flowData, 5);
    }, /out of range/);
  });

  it("renders a layered screen over its base, looked up by id", function () {
    var flowData = {
      meta: {},
      screens: [
        {
          id: "catalog",
          name: "Catalog",
          template: "bare",
          content: [{ type: "TEXT", content: "Base content" }],
        },
        {
          id: "toast",
          name: "Toast",
          layer: { kind: "toast", over: "catalog" },
          content: [{ type: "TEXT", content: "Published" }],
        },
      ],
    };
    var out = look.renderScreenFragment(flowData, 2);
    assert.match(out.html, /screen--layered/);
    assert.match(out.html, /Base content/);
    assert.match(out.html, /Published/);
  });
});
