#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var fs = require("fs");

var PLUGIN_ROOT = path.resolve(__dirname, "..");
var renderer = require(
  path.join(PLUGIN_ROOT, "scripts", "render-component-reference.js"),
);

var FIXTURE_DIR = path.join(__dirname, "fixtures", "render-component-reference");

describe("render-component-reference", function () {
  describe("renderRegistry", function () {
    it("matches the FM golden fixture", function () {
      var registry = JSON.parse(
        fs.readFileSync(path.join(FIXTURE_DIR, "registry-mini-fm.json"), "utf8"),
      );
      var actual = renderer.renderRegistry(registry, "fm");
      var expected = fs.readFileSync(path.join(FIXTURE_DIR, "expected-fm.md"), "utf8");
      assert.strictEqual(actual, expected);
    });
  });
});
