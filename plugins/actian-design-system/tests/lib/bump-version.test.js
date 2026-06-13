#!/usr/bin/env node
"use strict";

// Verifies the version bump utility used by the vendor-snapshot GitHub Action
// to bump plugin.json when generated/vendored data changes. Pure math; no I/O.
//
// The plugin uses calendar versioning (YYYY.MM.PATCH) — see CLAUDE.md
// "Versioning". The legacy semver level bumps (patch/minor/major) are retained
// for explicit manual bumps and exercised here too.
//
// Covered cases:
//   1. Patch bump from x.y.z → x.y.(z+1)
//   2. Minor bump from x.y.z → x.(y+1).0  (z resets)
//   3. Major bump from x.y.z → (x+1).0.0  (y, z reset)
//   4. Multi-digit components (1.99.99 → 1.99.100)
//   5. Invalid semver throws
//   6. Invalid level throws
//   7. Calendar bump: same month → PATCH+1; new month/year → YYYY.MM.0;
//      migration from legacy semver; UTC-based; invalid version throws

var { describe, it } = require("node:test");
var assert = require("node:assert");

var bumpVersion = require("../../scripts/lib/bump-version.js");
var calendarBump = bumpVersion.calendarBump;

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

  describe("calendar bumps", function () {
    // Date.UTC(year, monthIndex, day) — monthIndex is 0-based, so 5 = June.
    it("same month → PATCH+1 (2026.6.0 → 2026.6.1)", function () {
      assert.strictEqual(
        calendarBump("2026.6.0", new Date(Date.UTC(2026, 5, 13))),
        "2026.6.1",
      );
    });

    it("multi-digit patch, same month (2026.6.47 → 2026.6.48)", function () {
      assert.strictEqual(
        calendarBump("2026.6.47", new Date(Date.UTC(2026, 5, 30))),
        "2026.6.48",
      );
    });

    it("new month → reset to YYYY.MM.0 (2026.6.4 → 2026.7.0)", function () {
      assert.strictEqual(
        calendarBump("2026.6.4", new Date(Date.UTC(2026, 6, 1))),
        "2026.7.0",
      );
    });

    it("new year → reset to YYYY.MM.0 (2026.12.9 → 2027.1.0)", function () {
      assert.strictEqual(
        calendarBump("2026.12.9", new Date(Date.UTC(2027, 0, 5))),
        "2027.1.0",
      );
    });

    it("double-digit month resets unpadded (2026.9.5 → 2026.10.0)", function () {
      // Month is emitted UNPADDED by design (valid SemVer — no leading zero).
      // Pins the October output as "2026.10.0", not "2026.010.0"/"2026.10.0"
      // padded. Lexical sort would mis-order this vs 2026.9.x; numeric compare
      // (the only kind anything uses) is correct. See calendarBump comment.
      assert.strictEqual(
        calendarBump("2026.9.5", new Date(Date.UTC(2026, 9, 1))),
        "2026.10.0",
      );
    });

    it("migrates from legacy semver (1.108.0 → 2026.6.0)", function () {
      assert.strictEqual(
        calendarBump("1.108.0", new Date(Date.UTC(2026, 5, 13))),
        "2026.6.0",
      );
    });

    it("uses UTC, not local time", function () {
      // 2026-07-01T00:30:00Z is still June 30 in US timezones; the bump must
      // key off the UTC month (July → reset), matching the CI runner clock.
      assert.strictEqual(
        calendarBump("2026.6.9", new Date(Date.UTC(2026, 6, 1, 0, 30))),
        "2026.7.0",
      );
    });

    it("throws on a malformed version string", function () {
      assert.throws(function () {
        calendarBump("not-a-version", new Date(Date.UTC(2026, 5, 13)));
      }, /Invalid version/);
    });
  });
});
