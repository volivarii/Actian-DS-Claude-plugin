#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var mod = require("../../scripts/lib/specs-extraction.js");

describe("specs-extraction module", function () {
  it("exports the four decision functions", function () {
    assert.strictEqual(typeof mod.shouldSurfaceFrame, "function");
    assert.strictEqual(typeof mod.resolveSpacingValue, "function");
    assert.strictEqual(typeof mod.formatAnnotationLabel, "function");
    assert.strictEqual(typeof mod.dimensionAnnotationVariant, "function");
  });
});
