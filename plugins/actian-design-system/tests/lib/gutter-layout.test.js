#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var mod = require("../../scripts/lib/gutter-layout.js");

describe("gutter-layout — wiring", function () {
  it("exports the two pure functions", function () {
    assert.strictEqual(typeof mod.computeGutterSlots, "function");
    assert.strictEqual(typeof mod.buildLeaderPath, "function");
  });
});
