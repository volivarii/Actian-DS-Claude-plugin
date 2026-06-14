"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("node:path");
var RF = require("../../scripts/fidelity/run-fidelity");

test("oracleFor prefers default.webp, falls back to preview.webp", function () {
  var fakeExists = function (p) { return p.endsWith("default.webp"); };
  var chosen = RF.oracleFor("button", fakeExists);
  assert.ok(chosen.endsWith(path.join("button", "default.webp")), "chose default: " + chosen);
});

test("oracleFor falls back to preview.webp when default is absent", function () {
  var fakeExists = function (p) { return p.endsWith("preview.webp"); };
  var chosen = RF.oracleFor("button", fakeExists);
  assert.ok(chosen.endsWith(path.join("button", "preview.webp")), "chose preview: " + chosen);
});

test("oracleFor returns null when neither exists", function () {
  var chosen = RF.oracleFor("button", function () { return false; });
  assert.equal(chosen, null);
});
