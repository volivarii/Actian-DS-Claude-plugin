"use strict";

// Pure version bump utility for plugin.json, used by the vendor-snapshot
// GitHub Action to bump the version when vendored/generated data changes.
//
// The plugin uses CALENDAR versioning (YYYY.MM.PATCH) — see CLAUDE.md
// "Versioning". `calendarBump(version, date)` is the primary path: same month
// → PATCH+1, new month/year → YYYY.MM.0. The legacy `bumpVersion(version,
// level)` semver math (patch/minor/major) is kept for explicit manual bumps.
//
// Both functions are pure (date is passed in, no clock read) and do no I/O —
// the caller reads/writes plugin.json. They throw on a malformed version.

var SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;
var LEVELS = ["major", "minor", "patch"];

function bumpVersion(version, level) {
  if (LEVELS.indexOf(level) === -1) {
    throw new Error(
      "Invalid level: " +
        level +
        " (expected one of: " +
        LEVELS.join(", ") +
        ")",
    );
  }
  var match = SEMVER_RE.exec(version);
  if (!match) {
    throw new Error(
      "Invalid semver: " +
        version +
        " (expected x.y.z with non-negative integers)",
    );
  }
  var major = parseInt(match[1], 10);
  var minor = parseInt(match[2], 10);
  var patch = parseInt(match[3], 10);

  if (level === "major") return major + 1 + ".0.0";
  if (level === "minor") return major + "." + (minor + 1) + ".0";
  return major + "." + minor + "." + (patch + 1);
}

// Calendar bump: YYYY.MM.PATCH keyed off the UTC date.
//   - Same train (version's YYYY.MM matches the date's): PATCH + 1.
//   - New month or new year: reset to YYYY.MM.0.
// Migrating from a legacy semver (e.g. 1.108.0) naturally resets to the
// current YYYY.MM.0. `date` is required so the function stays pure/testable;
// the CLI passes `new Date()`. Uses UTC to match the CI runner clock.
//
// The month is emitted UNPADDED (2026.6.0, 2026.10.0) on purpose: leading
// zeros are illegal in SemVer, so a padded "2026.06.0" would risk
// `claude plugin validate`/parser rejection. Unpadded stays valid SemVer and
// compares correctly segment-wise as integers. The only cost is that naive
// lexical string sort mis-orders two-digit months — but nothing sorts plugin
// versions lexically (update detection is string-equality). Do NOT zero-pad.
function calendarBump(version, date) {
  var match = SEMVER_RE.exec(version);
  if (!match) {
    throw new Error(
      "Invalid version: " +
        version +
        " (expected YYYY.MM.PATCH with non-negative integers)",
    );
  }
  var year = date.getUTCFullYear();
  var month = date.getUTCMonth() + 1; // getUTCMonth is 0-based
  var sameTrain =
    parseInt(match[1], 10) === year && parseInt(match[2], 10) === month;
  var patch = sameTrain ? parseInt(match[3], 10) + 1 : 0;
  return year + "." + month + "." + patch;
}

module.exports = bumpVersion;
module.exports.calendarBump = calendarBump;

// CLI: node bump-version.js <plugin.json path> <calendar|patch|minor|major>
// Reads, bumps, writes back. Used by GitHub workflows. `calendar` is the
// plugin's default scheme (see CLAUDE.md "Versioning").
if (require.main === module) {
  var fs = require("fs");
  var args = process.argv.slice(2);
  if (args.length !== 2) {
    process.stderr.write(
      "Usage: bump-version.js <plugin.json path> <calendar|patch|minor|major>\n",
    );
    process.exit(1);
  }
  var pluginJsonPath = args[0];
  var level = args[1];
  var plugin = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
  var oldVersion = plugin.version;
  var newVersion =
    level === "calendar"
      ? calendarBump(oldVersion, new Date())
      : bumpVersion(oldVersion, level);
  plugin.version = newVersion;
  fs.writeFileSync(
    pluginJsonPath,
    JSON.stringify(plugin, null, 2) + "\n",
    "utf8",
  );
  process.stdout.write(oldVersion + " -> " + newVersion + "\n");
}
