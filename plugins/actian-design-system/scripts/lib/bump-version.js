"use strict";

// Pure semver bump utility used by the auto-sync GitHub Action workflow and
// foundations-derive workflow to PATCH-bump plugin.json when generated data
// (registries, styles, foundations JSONs) changes.
//
// Returns the bumped version string. Throws on invalid semver or unknown
// level. No I/O — caller reads/writes plugin.json.

var SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;
var LEVELS = ["major", "minor", "patch"];

function bumpVersion(version, level) {
  if (LEVELS.indexOf(level) === -1) {
    throw new Error(
      "Invalid level: " + level + " (expected one of: " + LEVELS.join(", ") + ")",
    );
  }
  var match = SEMVER_RE.exec(version);
  if (!match) {
    throw new Error(
      "Invalid semver: " + version + " (expected x.y.z with non-negative integers)",
    );
  }
  var major = parseInt(match[1], 10);
  var minor = parseInt(match[2], 10);
  var patch = parseInt(match[3], 10);

  if (level === "major") return major + 1 + ".0.0";
  if (level === "minor") return major + "." + (minor + 1) + ".0";
  return major + "." + minor + "." + (patch + 1);
}

module.exports = bumpVersion;

// CLI: node bump-version.js <plugin.json path> <level>
// Reads, bumps, writes back. Used by GitHub workflows.
if (require.main === module) {
  var fs = require("fs");
  var args = process.argv.slice(2);
  if (args.length !== 2) {
    process.stderr.write("Usage: bump-version.js <plugin.json path> <patch|minor|major>\n");
    process.exit(1);
  }
  var pluginJsonPath = args[0];
  var level = args[1];
  var plugin = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
  var oldVersion = plugin.version;
  var newVersion = bumpVersion(oldVersion, level);
  plugin.version = newVersion;
  fs.writeFileSync(pluginJsonPath, JSON.stringify(plugin, null, 2) + "\n", "utf8");
  process.stdout.write(oldVersion + " -> " + newVersion + "\n");
}
