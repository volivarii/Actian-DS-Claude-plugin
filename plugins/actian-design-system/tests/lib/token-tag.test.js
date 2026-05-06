#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var mod = require("../../scripts/lib/token-tag.js");

describe("token-tag — wiring", function () {
  it("exports the two pure functions", function () {
    assert.strictEqual(typeof mod.tokenTagSpec, "function");
    assert.strictEqual(typeof mod.tokenTagDimensions, "function");
  });
});
