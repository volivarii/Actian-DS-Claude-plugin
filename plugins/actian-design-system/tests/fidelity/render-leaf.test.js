"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var H = require("../../scripts/fidelity/render-leaf");

test("defaultNodeForSlug uses dsSlug shape", function () {
  assert.deepEqual(H.defaultNodeForSlug("button"), {
    dsSlug: "button",
    variant: "",
    props: {},
  });
});

test("buildLeafHtml embeds the rendered leaf + a fonts.ready measure hook", function () {
  var html = H.buildLeafHtml("button", "<button class='ds-button'>Go</button>");
  assert.ok(html.indexOf("ds-button") >= 0, "leaf fragment present");
  assert.ok(/document\.fonts\.ready/.test(html), "waits for fonts");
  assert.ok(
    /data-fidelity-ready/.test(html),
    "exposes a ready flag for the screenshotter",
  );
  assert.ok(/<style/.test(html), "DS CSS inlined in a style tag");
  // Verify the CSS file content was actually read in (not an empty <style>):
  assert.ok(
    /ds-button|--zen-|Roboto/.test(html),
    "real DS CSS content present",
  );
});

test("buildMeasureHtml injects the measure script", function () {
  var html = H.buildMeasureHtml("button", "<button></button>", "/*MEASURE*/");
  assert.ok(html.indexOf("/*MEASURE*/") >= 0);
  assert.ok(html.indexOf("<button></button>") >= 0);
});

test("buildLeafHtml escapes the slug in the data-slug attribute", function () {
  var html = H.buildLeafHtml('a"b', "<span></span>");
  assert.ok(
    html.indexOf('data-slug="a"b"') < 0,
    "raw double quote not injected",
  );
  assert.ok(
    /data-slug="a&quot;b"/.test(html),
    "double quote escaped to &quot;",
  );
});
