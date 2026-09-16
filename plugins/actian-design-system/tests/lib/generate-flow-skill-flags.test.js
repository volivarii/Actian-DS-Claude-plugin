#!/usr/bin/env node
"use strict";

// generate-flow-skill-flags.test.js — Task 3.5: the authoring-default flip.
//
// DS-native authoring became the default since 2026.9.x, so `--hifi` now
// defaults `on`. Two new flags cover the flows that opt back out of DS-native
// authoring: `--lofi` (same DS tree, rendered in the lo-fi skin) and `--fm`
// (FatMarker authoring, the pre-2026.9.x default, required for a lo-fi Figma
// push). This test pins the flags table in skills/generate-flow/SKILL.md so a
// future edit can't silently revert the default or drop either flag row.

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var SKILL = path.resolve(__dirname, "../../skills/generate-flow/SKILL.md");

describe("generate-flow SKILL.md flags table — DS-native default", function () {
  var src = fs.readFileSync(SKILL, "utf8");
  var lines = src.split("\n");

  it("has a flags table row starting with `--lofi`", function () {
    var lofiRow = lines.find(function (l) {
      return l.indexOf("| `--lofi`") === 0;
    });
    assert.ok(
      lofiRow,
      "SKILL.md flags table must have a row starting with `| \\`--lofi\\``",
    );
  });

  it("has a flags table row starting with `--fm`", function () {
    var fmRow = lines.find(function (l) {
      return l.indexOf("| `--fm`") === 0;
    });
    assert.ok(
      fmRow,
      "SKILL.md flags table must have a row starting with `| \\`--fm\\``",
    );
  });

  it("the --hifi row's Default column reads `on`", function () {
    var hifiRow = lines.find(function (l) {
      return l.indexOf("| `--hifi`") === 0;
    });
    assert.ok(hifiRow, "SKILL.md flags table must have a `--hifi` row");

    var cols = hifiRow.split("|");
    // cols[0] is empty (leading "|"), cols[1] = Flag, cols[2] = Type,
    // cols[3] = Default, cols[4] = Behavior.
    var defaultCol = (cols[3] || "").trim();
    assert.strictEqual(
      defaultCol,
      "on",
      "the --hifi row's Default column must read 'on' " +
        "(DS-native authoring is the default since 2026.9.x); got: " +
        JSON.stringify(defaultCol),
    );
  });
});
