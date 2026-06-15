#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var H = require("../../scripts/fidelity/render-leaf.js");

describe("measure HTML uses a full-width body so overflow can trip", function () {
  it("buildLeafHtml default body is inline-block (pixel path, unchanged)", function () {
    var html = H.buildLeafHtml("button", "<b>x</b>");
    assert.match(html, /display:inline-block/);
  });
  it("buildLeafHtml fullWidth option drops inline-block (block, full width)", function () {
    var html = H.buildLeafHtml("button", "<b>x</b>", { fullWidth: true });
    assert.doesNotMatch(html, /display:inline-block/);
    assert.match(html, /<body>/);
  });
  it("buildMeasureHtml uses the full-width body + injects the measure script", function () {
    var html = H.buildMeasureHtml("button", "<b>x</b>", "/*MJS*/");
    assert.doesNotMatch(html, /display:inline-block/);
    assert.match(html, /\/\*MJS\*\//);
  });
});
