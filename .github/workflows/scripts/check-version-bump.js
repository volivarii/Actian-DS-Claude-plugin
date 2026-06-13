#!/usr/bin/env node
"use strict";

/**
 * check-version-bump.js — PR gate that requires plugin.json#version to be
 * bumped whenever PR-modified files under plugins/actian-design-system/
 * include any "source" file (anything except generated outputs and the
 * plugin manifest itself).
 *
 * Per CLAUDE.md: "Bump as part of the feature/fix commit, not separately."
 * Per memory feedback_version_bump.md: "Always bump plugin version in
 * plugin.json before pushing."
 *
 * Inputs (env vars set by GitHub Actions):
 *   BASE_SHA — SHA the PR is targeting
 *   HEAD_SHA — SHA at the tip of the PR branch
 *
 * Behaviour:
 *   - Lists files changed between BASE_SHA and HEAD_SHA
 *   - Filters to plugins/actian-design-system/** that aren't auto-generated
 *     (docs/generated/**) or the manifest itself
 *   - If no source files changed: pass (nothing to enforce)
 *   - If source files changed and version is unchanged from base: fail
 *   - If source files changed and version is bumped: pass
 *
 * The vendor-snapshot workflow auto-bumps via the shared bump-version.js
 * (calendar mode) on a data refresh; this gate covers human-authored PRs.
 */

var fs = require("fs");
var path = require("path");
var { execFileSync } = require("child_process");

// Repo root, derived from __dirname so the script works from any cwd
// (CI runs from $GITHUB_WORKSPACE; locally we may run from anywhere).
var REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
var PLUGIN_PREFIX = "plugins/actian-design-system/";
var MANIFEST_REL = ".claude-plugin/plugin.json";
var MANIFEST_PATH = PLUGIN_PREFIX + MANIFEST_REL;
// Paths inside the plugin that don't count as "source" for the bump rule:
// generated artifacts (CI rewrites them) and the manifest itself (a bump
// touches plugin.json so this would otherwise self-trigger).
var IGNORED_PREFIXES = [
  PLUGIN_PREFIX + "docs/generated/",
  MANIFEST_PATH,
];

function git() {
  var args = Array.prototype.slice.call(arguments);
  return execFileSync("git", args, { encoding: "utf8", cwd: REPO_ROOT });
}

function changedPlatformSourceFiles(baseSha, headSha) {
  var raw = git("diff", "--name-only", baseSha + ".." + headSha);
  var lines = raw
    .split("\n")
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
  var sourceFiles = [];
  for (var i = 0; i < lines.length; i++) {
    var f = lines[i];
    if (f.indexOf(PLUGIN_PREFIX) !== 0) continue;
    var ignored = false;
    for (var j = 0; j < IGNORED_PREFIXES.length; j++) {
      if (f === IGNORED_PREFIXES[j]) {
        ignored = true;
        break;
      }
      if (f.indexOf(IGNORED_PREFIXES[j]) === 0) {
        ignored = true;
        break;
      }
    }
    if (!ignored) sourceFiles.push(f);
  }
  return sourceFiles;
}

function readManifestVersion(sha) {
  // `git show <sha>:path` returns the file contents at that revision.
  try {
    var raw = git("show", sha + ":" + MANIFEST_PATH);
    var parsed = JSON.parse(raw);
    return parsed.version || null;
  } catch (err) {
    // Manifest may not have existed at base (rare). Treat as null.
    return null;
  }
}

function readManifestVersionFromDisk() {
  var p = path.join(REPO_ROOT, MANIFEST_PATH);
  var raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw).version || null;
}

function main() {
  var baseSha = process.env.BASE_SHA;
  var headSha = process.env.HEAD_SHA;
  if (!baseSha || !headSha) {
    process.stderr.write(
      "[check-version-bump] BASE_SHA and HEAD_SHA must be set\n",
    );
    return 2;
  }

  var sourceFiles = changedPlatformSourceFiles(baseSha, headSha);
  if (sourceFiles.length === 0) {
    process.stdout.write(
      "[check-version-bump] no plugin source files changed; nothing to enforce\n",
    );
    return 0;
  }

  var baseVersion = readManifestVersion(baseSha);
  var headVersion = readManifestVersionFromDisk();
  process.stdout.write(
    "[check-version-bump] base " +
      (baseVersion || "<unknown>") +
      " → head " +
      headVersion +
      "\n",
  );
  process.stdout.write(
    "[check-version-bump] " +
      sourceFiles.length +
      " source file(s) changed:\n",
  );
  for (var i = 0; i < sourceFiles.length; i++) {
    process.stdout.write("  " + sourceFiles[i] + "\n");
  }

  if (baseVersion && headVersion && baseVersion === headVersion) {
    process.stderr.write(
      "[check-version-bump] FAIL: plugin.json version unchanged (" +
        headVersion +
        ") despite source file changes.\n",
    );
    process.stderr.write(
      "  Bump plugins/actian-design-system/.claude-plugin/plugin.json " +
        "version (calendar versioning YYYY.MM.PATCH — same month bumps PATCH, " +
        "a new month resets to YYYY.MM.0; see CLAUDE.md 'Versioning').\n",
    );
    return 1;
  }

  process.stdout.write("[check-version-bump] OK\n");
  return 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  changedPlatformSourceFiles: changedPlatformSourceFiles,
  readManifestVersion: readManifestVersion,
  main: main,
};
