"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var H = require("../../scripts/fidelity/render-leaf");

test("defaultNodeForSlug uses dsSlug shape", function () {
  assert.deepEqual(H.defaultNodeForSlug("button"), { dsSlug: "button", variant: "", props: {} });
});

test("buildLeafHtml embeds the rendered leaf + a fonts.ready measure hook", function () {
  var html = H.buildLeafHtml("button", "<button class='ds-button'>Go</button>");
  assert.ok(html.indexOf("ds-button") >= 0, "leaf fragment present");
  assert.ok(/document\.fonts\.ready/.test(html), "waits for fonts");
  assert.ok(/data-fidelity-ready/.test(html), "exposes a ready flag for the screenshotter");
  assert.ok(/<style/.test(html) || /<link/.test(html), "DS CSS included");
});
