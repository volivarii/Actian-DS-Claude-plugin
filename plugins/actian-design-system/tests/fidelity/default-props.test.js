"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var props = require("../../scripts/fidelity/default-props.json");
var BUILT = require("../../scripts/renderers/html-renderers/ds-html-map.js").BUILT_SLUGS;

test("every default-props key is a built slug with a plain-object value", function () {
  Object.keys(props).forEach(function (slug) {
    assert.ok(BUILT.indexOf(slug) !== -1, slug + " is not in BUILT_SLUGS");
    var v = props[slug];
    assert.ok(v && typeof v === "object" && !Array.isArray(v), slug + " props must be an object");
  });
});
