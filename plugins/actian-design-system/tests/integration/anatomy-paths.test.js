"use strict";
// PATHS.components.anatomy resolves the vendored anatomy artifacts (knowledge's
// `anatomy` domain). v0.32.x vendors a placeholder bundle + .gitkeep; real
// <slug>.json artifacts land on the next knowledge Figma sync.
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("node:fs");
var PATHS = require("../../scripts/lib/paths");

test("PATHS.components.anatomy(slug) builds the per-component path", function () {
  var p = PATHS.components.anatomy("button");
  assert.ok(/components\/dist\/anatomy\/button\.json$/.test(p), p);
});

test("PATHS.components.anatomyBundle points at the vendored bundle", function () {
  assert.ok(
    /components\/dist\/anatomy\.bundle\.json$/.test(PATHS.components.anatomyBundle),
    PATHS.components.anatomyBundle,
  );
});

test("the anatomy dir + bundle are actually vendored (resolvable)", function () {
  // dir-level check (per-slug artifacts are CI-generated; .gitkeep holds the dir)
  var dir = require("path").dirname(PATHS.components.anatomy("button"));
  assert.ok(fs.existsSync(dir), "anatomy dir vendored: " + dir);
  assert.ok(
    fs.existsSync(PATHS.components.anatomyBundle),
    "bundle vendored: " + PATHS.components.anatomyBundle,
  );
});
