"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var shared = require("../../scripts/renderers/assemble-shared.js");

test("buildDsIconsScript emits window.dsIcons with geometry-only entries", function () {
  var s = shared.buildDsIconsScript();
  assert.match(s, /<script>\s*window\.dsIcons\s*=/, "must assign window.dsIcons");
  // Extract the JSON object literal and parse it.
  var json = s.replace(/^[\s\S]*window\.dsIcons\s*=\s*/, "").replace(/;?\s*<\/script>[\s\S]*$/, "");
  var map = JSON.parse(json);
  var slugs = Object.keys(map);
  assert.ok(slugs.length >= 35, "expected >=35 icons, got " + slugs.length);
  assert.ok("simple-check" in map, "simple-check present");
  // geometry-only: each entry has exactly viewBox + body, no provenance.
  slugs.forEach(function (k) {
    assert.deepEqual(Object.keys(map[k]).sort(), ["body", "viewBox"], k + " must be geometry-only");
  });
});
