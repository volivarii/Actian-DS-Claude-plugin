#!/usr/bin/env node
"use strict";

// Verifies the semver bump utility used by the auto-sync GitHub Action and
// foundations-derive workflow to PATCH-bump plugin.json when generated data
// changes (registries, styles, foundations JSONs). Pure semver math; no I/O.
//
// Covered cases:
//   1. Patch bump from x.y.z → x.y.(z+1)
//   2. Minor bump from x.y.z → x.(y+1).0  (z resets)
//   3. Major bump from x.y.z → (x+1).0.0  (y, z reset)
//   4. Multi-digit components (1.99.99 → 1.99.100)
//   5. Invalid semver throws
//   6. Invalid level throws

var { describe, it } = require("node:test");
var assert = require("node:assert");

var bumpVersion = require("../../scripts/lib/bump-version.js");

describe("bump-version", function () {
  describe("patch bumps", function () {
    it("1.0.0 → 1.0.1", function () {
      assert.strictEqual(bumpVersion("1.0.0", "patch"), "1.0.1");
    });

    it("1.62.4 → 1.62.5", function () {
      assert.strictEqual(bumpVersion("1.62.4", "patch"), "1.62.5");
    });

    it("multi-digit: 1.99.99 → 1.99.100", function () {
      assert.strictEqual(bumpVersion("1.99.99", "patch"), "1.99.100");
    });
  });

  describe("minor bumps", function () {
    it("1.62.4 → 1.63.0 (resets patch)", function () {
      assert.strictEqual(bumpVersion("1.62.4", "minor"), "1.63.0");
    });

    it("1.0.0 → 1.1.0", function () {
      assert.strictEqual(bumpVersion("1.0.0", "minor"), "1.1.0");
    });
  });

  describe("major bumps", function () {
    it("1.62.4 → 2.0.0 (resets minor + patch)", function () {
      assert.strictEqual(bumpVersion("1.62.4", "major"), "2.0.0");
    });
  });

  describe("invalid input", function () {
    it("throws on non-semver string", function () {
      assert.throws(function () {
        bumpVersion("not-a-version", "patch");
      }, /Invalid semver/);
    });

    it("throws on partial semver", function () {
      assert.throws(function () {
        bumpVersion("1.0", "patch");
      }, /Invalid semver/);
    });

    it("throws on extra components", function () {
      assert.throws(function () {
        bumpVersion("1.0.0.0", "patch");
      }, /Invalid semver/);
    });

    it("throws on unknown level", function () {
      assert.throws(function () {
        bumpVersion("1.0.0", "huge");
      }, /Invalid level/);
    });

    it("throws on non-numeric component", function () {
      assert.throws(function () {
        bumpVersion("1.x.0", "patch");
      }, /Invalid semver/);
    });
  });
});
