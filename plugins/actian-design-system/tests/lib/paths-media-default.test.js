"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("node:path");
var PATHS = require("../../scripts/lib/paths");

test("mediaDefault resolves to the per-slug default.webp oracle", function () {
  var p = PATHS.components.mediaDefault("button");
  assert.ok(
    p.endsWith(path.join("vendor", "components", "dist", "media", "button", "default.webp")),
    "got: " + p,
  );
});
