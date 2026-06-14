"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var path = require("node:path");
var RF = require("../../scripts/fidelity/run-fidelity");

test("oracleFor prefers default.webp, falls back to preview.webp", function () {
  var fakeExists = function (p) {
    return p.endsWith("default.webp");
  };
  var chosen = RF.oracleFor("button", fakeExists);
  assert.ok(
    chosen.endsWith(path.join("button", "default.webp")),
    "chose default: " + chosen,
  );
});

test("oracleFor falls back to preview.webp when default is absent", function () {
  var fakeExists = function (p) {
    return p.endsWith("preview.webp");
  };
  var chosen = RF.oracleFor("button", fakeExists);
  assert.ok(
    chosen.endsWith(path.join("button", "preview.webp")),
    "chose preview: " + chosen,
  );
});

test("oracleFor returns null when neither exists", function () {
  var chosen = RF.oracleFor("button", function () {
    return false;
  });
  assert.equal(chosen, null);
});

test("oracleFor prefers default.webp when BOTH default and preview exist", function () {
  // Pins the precedence: with both files present, the single-component oracle
  // must win over the legacy preview.webp board. Guards against a regression
  // that silently reverts Gate-1 to the board oracle (which skips on aspect).
  var probed = [];
  var fakeExists = function (p) {
    probed.push(p);
    return true; // both default.webp AND preview.webp exist
  };
  var chosen = RF.oracleFor("button", fakeExists);
  assert.ok(
    chosen.endsWith(path.join("button", "default.webp")),
    "default must win when both exist: " + chosen,
  );
  // and it short-circuits — preview.webp is never probed once default exists
  assert.ok(
    probed[0].endsWith("default.webp"),
    "default.webp must be probed first",
  );
  assert.equal(
    probed.length,
    1,
    "preview.webp must not be probed when default exists",
  );
});
