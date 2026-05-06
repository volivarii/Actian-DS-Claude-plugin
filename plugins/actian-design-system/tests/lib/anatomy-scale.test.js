#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var mod = require("../../scripts/lib/anatomy-scale.js");

describe("anatomy-scale — wiring", function () {
  it("exports pickScale", function () {
    assert.strictEqual(typeof mod.pickScale, "function");
  });
});
