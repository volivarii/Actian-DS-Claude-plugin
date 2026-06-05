"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");

var WRAPPER = path.join(
  __dirname,
  "..",
  "..",
  "templates",
  "flow-prototype-wrapper.html",
);
var src = fs.readFileSync(WRAPPER, "utf8");

test("wrapper declares the full placeholder contract", function () {
  [
    "{{META_COMMENT}}",
    "{{FEATURE_NAME}}",
    "{{SHARE_META}}",
    "{{FLOW_CSS}}",
    "{{INLINE_ALPINE}}",
    "{{SCREENS}}",
    "{{SCREENS_ARRAY}}",
  ].forEach(function (p) {
    assert.ok(src.indexOf(p) !== -1, "wrapper has placeholder " + p);
  });
});

test("wrapper has the two-view state + toggle", function () {
  assert.ok(
    /view:\s*'prototype'/.test(src),
    "view state defaults to prototype",
  );
  assert.ok(
    src.indexOf("proto-stage--overview") !== -1,
    "overview stage modifier present",
  );
  assert.ok(src.indexOf("enter(") !== -1, "enter(index) handler present");
});

test("wrapper has NO external resource references (self-containing shell)", function () {
  assert.ok(src.indexOf("cdn.jsdelivr.net") === -1, "no Alpine CDN");
  assert.ok(src.indexOf("fonts.googleapis.com") === -1, "no Google Fonts");
  assert.ok(!/<script[^>]+src="https?:/.test(src), "no external <script src>");
  assert.ok(!/<link[^>]+href="https?:/.test(src), "no external <link href>");
});

test("wrapper no longer carries the annotation placeholder", function () {
  assert.ok(
    src.indexOf("{{ANNOTATION_LAYER}}") === -1,
    "annotation layer omitted in v1",
  );
});

test("single-fill placeholders appear exactly once", function () {
  function count(needle) {
    return src.split(needle).length - 1;
  }
  [
    "{{META_COMMENT}}",
    "{{SHARE_META}}",
    "{{FLOW_CSS}}",
    "{{INLINE_ALPINE}}",
    "{{SCREENS_ARRAY}}",
  ].forEach(function (p) {
    assert.equal(count(p), 1, p + " must appear exactly once");
  });
  assert.equal(
    count("{{FEATURE_NAME}}"),
    2,
    "{{FEATURE_NAME}} appears in <title> + top bar",
  );
});

test("the SCREENS fill marker is unique", function () {
  function count(needle) {
    return src.split(needle).length - 1;
  }
  assert.equal(
    count("<!-- {{SCREENS}} -->"),
    1,
    "exactly one <!-- {{SCREENS}} --> fill marker",
  );
});

test("instruction block is wrapped in strip sentinels; vestigial tokens removed", function () {
  assert.ok(
    src.indexOf("ASSEMBLER-STRIP-BEGIN") !== -1,
    "strip-begin sentinel present",
  );
  assert.ok(
    src.indexOf("ASSEMBLER-STRIP-END") !== -1,
    "strip-end sentinel present",
  );
  [
    "{{COMPONENT_SPECIFIC_CSS}}",
    "{{ADDITIONAL_STYLES}}",
    "{{VALIDATE_IMPL}}",
    "{{CAN_SUBMIT_IMPL}}",
  ].forEach(function (t) {
    assert.ok(src.indexOf(t) === -1, "vestigial token removed: " + t);
  });
});
