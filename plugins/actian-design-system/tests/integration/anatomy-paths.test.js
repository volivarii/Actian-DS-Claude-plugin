"use strict";
// The knowledge `anatomy` domain is manifest-driven: paths-manifest.json declares
// components.anatomy.byKey (collection) + components.anatomy.bundle (path), so
// buildPathsFromManifest produces PATHS.components.anatomy.byKey(slug) +
// PATHS.components.anatomy.bundle — no plugin overlay needed. v0.32.x vendors a
// placeholder bundle + .gitkeep; real <slug>.json land on the next Figma sync.
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("node:fs");
var path = require("node:path");
var PATHS = require("../../scripts/lib/paths");

test("manifest builds PATHS.components.anatomy.byKey(slug)", function () {
  assert.equal(typeof PATHS.components.anatomy.byKey, "function");
  var p = PATHS.components.anatomy.byKey("button");
  assert.ok(/components\/dist\/anatomy\/button\.json$/.test(p), p);
});

test("manifest builds PATHS.components.anatomy.bundle", function () {
  assert.ok(
    /components\/dist\/anatomy\.bundle\.json$/.test(
      PATHS.components.anatomy.bundle,
    ),
    PATHS.components.anatomy.bundle,
  );
});

test("the vendored anatomy dir + bundle actually resolve", function () {
  var dir = path.dirname(PATHS.components.anatomy.byKey("button"));
  assert.ok(fs.existsSync(dir), "anatomy dir vendored: " + dir);
  assert.ok(
    fs.existsSync(PATHS.components.anatomy.bundle),
    "bundle vendored: " + PATHS.components.anatomy.bundle,
  );
  // vendored bundle is the placeholder envelope (real data lands on next sync)
  var bundle = JSON.parse(
    fs.readFileSync(PATHS.components.anatomy.bundle, "utf8"),
  );
  assert.ok(
    bundle.components && typeof bundle.components === "object",
    "bundle has a components envelope",
  );
});
