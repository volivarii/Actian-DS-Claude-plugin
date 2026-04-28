#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..");
var rules = require(
  path.join(PLUGIN_ROOT, "scripts", "component-property-rules.js"),
);

describe("component-property-rules", function () {
  describe("isPlaceholderDefault", function () {
    it("matches Page Title", function () {
      assert.strictEqual(rules.isPlaceholderDefault("Page Title"), true);
    });
    it("matches Button label (case-insensitive)", function () {
      assert.strictEqual(rules.isPlaceholderDefault("button label"), true);
    });
    it("matches Dropdown text", function () {
      assert.strictEqual(rules.isPlaceholderDefault("Dropdown text"), true);
    });
    it("matches Label exactly", function () {
      assert.strictEqual(rules.isPlaceholderDefault("Label"), true);
    });
    it("matches Placeholder prefix", function () {
      assert.strictEqual(rules.isPlaceholderDefault("Placeholder text"), true);
    });
    it("matches Description exactly", function () {
      assert.strictEqual(rules.isPlaceholderDefault("Description"), true);
    });
    it("rejects legitimate string MyButton", function () {
      assert.strictEqual(rules.isPlaceholderDefault("MyButton"), false);
    });
    it("rejects Save", function () {
      assert.strictEqual(rules.isPlaceholderDefault("Save"), false);
    });
    it("rejects empty string", function () {
      assert.strictEqual(rules.isPlaceholderDefault(""), false);
    });
    it("rejects non-string input", function () {
      assert.strictEqual(rules.isPlaceholderDefault(null), false);
      assert.strictEqual(rules.isPlaceholderDefault(undefined), false);
      assert.strictEqual(rules.isPlaceholderDefault(42), false);
    });
  });
});
