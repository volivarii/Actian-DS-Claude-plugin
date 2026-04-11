#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..");
var changelog = require(path.join(PLUGIN_ROOT, "scripts", "changelog.js"));

describe("changelog", function () {
  describe("diffComponentKeys", function () {
    it("detects added keys", function () {
      var prev = ["key-a", "key-b"];
      var curr = ["key-a", "key-b", "key-c"];
      var diff = changelog.diffComponentKeys(prev, curr);
      assert.strictEqual(diff.added.length, 1);
      assert.strictEqual(diff.added[0], "key-c");
      assert.strictEqual(diff.removed.length, 0);
    });

    it("detects removed keys", function () {
      var prev = ["key-a", "key-b", "key-c"];
      var curr = ["key-a", "key-c"];
      var diff = changelog.diffComponentKeys(prev, curr);
      assert.strictEqual(diff.added.length, 0);
      assert.strictEqual(diff.removed.length, 1);
      assert.strictEqual(diff.removed[0], "key-b");
    });

    it("detects both added and removed", function () {
      var prev = ["key-a", "key-b"];
      var curr = ["key-b", "key-c", "key-d"];
      var diff = changelog.diffComponentKeys(prev, curr);
      assert.strictEqual(diff.added.length, 2);
      assert.strictEqual(diff.removed.length, 1);
    });

    it("returns empty diff for identical arrays", function () {
      var prev = ["key-a", "key-b"];
      var curr = ["key-a", "key-b"];
      var diff = changelog.diffComponentKeys(prev, curr);
      assert.strictEqual(diff.added.length, 0);
      assert.strictEqual(diff.removed.length, 0);
    });

    it("handles empty previous", function () {
      var diff = changelog.diffComponentKeys([], ["key-a"]);
      assert.strictEqual(diff.added.length, 1);
      assert.strictEqual(diff.removed.length, 0);
    });
  });

  describe("resolveKeyName", function () {
    it("resolves a known FM Kit component key", function () {
      var fmkit = require(path.join(PLUGIN_ROOT, "docs", "fmkit.json"));
      var firstSlug = Object.keys(fmkit.components)[0];
      var firstKey = fmkit.components[firstSlug].key;
      var name = changelog.resolveKeyName(firstKey);
      assert.ok(name, "should resolve to a name");
      assert.ok(name.length > 0);
    });

    it("returns truncated key for unknown key", function () {
      var name = changelog.resolveKeyName("0000000000000000000000000000000000000000");
      assert.ok(name.indexOf("00000000") !== -1);
    });
  });

  describe("buildChangelog", function () {
    it("reports no changes for identical state", function () {
      var prev = {
        sourceHash: "abc123",
        tokenHash: "def456",
        componentKeys: ["key-a"],
      };
      var result = changelog.buildChangelog(prev, "abc123", "def456", ["key-a"]);
      assert.strictEqual(result.sourceChanged, false);
      assert.strictEqual(result.tokensChanged, false);
      assert.strictEqual(result.components.added.length, 0);
      assert.strictEqual(result.components.removed.length, 0);
      assert.strictEqual(result.hasChanges, false);
    });

    it("reports source changed", function () {
      var prev = {
        sourceHash: "abc123",
        tokenHash: "def456",
        componentKeys: [],
      };
      var result = changelog.buildChangelog(prev, "xyz789", "def456", []);
      assert.strictEqual(result.sourceChanged, true);
      assert.strictEqual(result.hasChanges, true);
    });

    it("reports tokens changed", function () {
      var prev = {
        sourceHash: "abc123",
        tokenHash: "def456",
        componentKeys: [],
      };
      var result = changelog.buildChangelog(prev, "abc123", "newtoken", []);
      assert.strictEqual(result.tokensChanged, true);
      assert.strictEqual(result.hasChanges, true);
    });

    it("reports component changes", function () {
      var prev = {
        sourceHash: "abc123",
        tokenHash: "def456",
        componentKeys: ["key-a", "key-b"],
      };
      var result = changelog.buildChangelog(prev, "abc123", "def456", ["key-b", "key-c"]);
      assert.strictEqual(result.components.added.length, 1);
      assert.strictEqual(result.components.removed.length, 1);
      assert.strictEqual(result.hasChanges, true);
    });
  });
});
