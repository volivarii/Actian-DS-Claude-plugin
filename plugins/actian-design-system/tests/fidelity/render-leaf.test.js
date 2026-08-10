"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var H = require("../../scripts/fidelity/render-leaf");

test("defaultNodeForSlug reads anatomy variant + merges default-props", function () {
  var node = H.defaultNodeForSlug("button");
  assert.equal(node.dsSlug, "button");
  // variant comes from vendored anatomy source.variant (Button taxonomy is
  // Intent×Emphasis as of knowledge v0.34.x — was the legacy single Type axis)
  assert.match(node.variant, /Intent=Default, Emphasis=Filled/);
  // props come from default-props.json
  assert.equal(node.props.Label, "Button");
});

// The specimen must be a REAL component that simply has no default-props entry.
// It was `radio-button`, which the 2026-07-23 sync renamed to `radio`: the test
// kept passing, but for the wrong reason (a slug that exists nowhere is unmapped
// trivially), so it stopped covering the case it names. `radio` is still a real
// Components-section slug with anatomy and no default-props entry.
test("defaultNodeForSlug falls back to empty props for an unmapped slug", function () {
  var node = H.defaultNodeForSlug("radio");
  assert.equal(node.dsSlug, "radio");
  assert.deepEqual(node.props, {});
});

test("defaultNodeForSlug yields an empty variant when the slug has no anatomy", function () {
  // A slug with no vendored anatomy file: the anatomy read throws (ENOENT, or
  // byKey rejects the unknown slug) and the try/catch degrades to variant="".
  // Every BUILT_SLUG has anatomy, so this fabricated slug is the only way to
  // exercise the fail-soft branch the gate relies on.
  var node = H.defaultNodeForSlug("definitely-not-a-real-slug-xyz");
  assert.equal(node.variant, "");
  assert.deepEqual(node.props, {});
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

test("buildImageHtml wraps the oracle image with a file:// URL + ready flag", function () {
  var html = H.buildImageHtml("/tmp/x/preview.webp");
  assert.ok(/id="fidelity-oracle"/.test(html), "oracle img present");
  assert.ok(/src="file:\/\//.test(html), "file:// URL");
  assert.ok(/data-fidelity-ready/.test(html), "ready flag on load");
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
