"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");
var vs = require("../../scripts/vendor/vendor-snapshot.js");

test("selectEntries: include-mode copies ONLY listed entries", function () {
  var names = ["accessibility", "editor", "auth-worker", "components", "paths-manifest.json"];
  var include = new Set(["accessibility", "components", "paths-manifest.json"]);
  var out = vs.selectEntries(names, include, new Set(["scripts"]));
  assert.deepEqual(out.sort(), ["accessibility", "components", "paths-manifest.json"]);
});

test("selectEntries: falls back to exclude-set when include is null", function () {
  var names = ["accessibility", "scripts", "components"];
  var out = vs.selectEntries(names, null, new Set(["scripts"]));
  assert.deepEqual(out.sort(), ["accessibility", "components"]);
});

test("readVendorInclude: returns a Set when vendor-include.json present", function () {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "vi-"));
  fs.writeFileSync(path.join(dir, "vendor-include.json"), JSON.stringify({ include: ["a", "b"] }));
  var set = vs.readVendorInclude(dir);
  assert.ok(set instanceof Set && set.has("a") && set.has("b"));
  fs.rmSync(dir, { recursive: true, force: true });
});

test("readVendorInclude: returns null when absent (legacy pin → exclude fallback)", function () {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "vi-"));
  assert.equal(vs.readVendorInclude(dir), null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("readVendorInclude: returns null on malformed json", function () {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "vi-"));
  fs.writeFileSync(path.join(dir, "vendor-include.json"), "{ not json");
  assert.equal(vs.readVendorInclude(dir), null);
  fs.rmSync(dir, { recursive: true, force: true });
});
