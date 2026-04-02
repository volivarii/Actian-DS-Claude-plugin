#!/usr/bin/env node
"use strict";

/**
 * snapshot.test.js — Capture the "shape" of cross-cutting interfaces and fail
 * when they change without updating dependents.
 *
 * Part 1: templates.json flow-template keys
 * Part 2: CLAUDE.md Skill Review Gates table
 * Part 3: CLI flags accepted by each script (argv parsing)
 * Part 4: assemble-preview.js TYPE_CONFIGS type names
 *
 * First run:  creates .snap files, all tests PASS
 * Later runs: compares against .snap files, FAIL with diff if changed
 * To update:  delete the specific tests/snapshots/<file>.snap and rerun
 *
 * Run with: node tests/snapshot.test.js
 */

var fs = require("fs");
var path = require("path");

var passed = 0;
var failed = 0;
var failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    process.stdout.write("  \u2717 FAIL: " + message + "\n");
  }
}

function section(name) {
  process.stdout.write("\n" + name + "\n");
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

var PLUGIN_ROOT = path.resolve(__dirname, "..");
var SCRIPTS_DIR = path.join(PLUGIN_ROOT, "scripts");
var SNAP_DIR = path.join(__dirname, "snapshots");

// Ensure snapshots directory exists
if (!fs.existsSync(SNAP_DIR)) {
  fs.mkdirSync(SNAP_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Snapshot helpers
// ---------------------------------------------------------------------------

/**
 * Compare actual value against a snapshot file.
 * - If snap doesn't exist: create it, PASS (first run)
 * - If snap exists and matches: PASS
 * - If snap exists and differs: FAIL with diff detail
 *
 * Returns true if passed, false if failed.
 */
function matchSnapshot(name, snapFile, actual) {
  var snapPath = path.join(SNAP_DIR, snapFile);
  var actualStr = typeof actual === "string" ? actual : JSON.stringify(actual, null, 2);

  if (!fs.existsSync(snapPath)) {
    // First run — create the snapshot
    fs.writeFileSync(snapPath, actualStr, "utf8");
    process.stdout.write("  \u2713 " + name + " — snapshot created (" + snapFile + ")\n");
    passed++;
    return true;
  }

  var expected = fs.readFileSync(snapPath, "utf8");

  if (actualStr === expected) {
    process.stdout.write("  \u2713 " + name + " — matches snapshot\n");
    passed++;
    return true;
  }

  // Mismatch — compute diff detail
  var actualLines = actualStr.split("\n");
  var expectedLines = expected.split("\n");
  var diffLines = [];

  var maxLen = Math.max(actualLines.length, expectedLines.length);
  for (var i = 0; i < maxLen; i++) {
    var a = i < actualLines.length ? actualLines[i] : undefined;
    var e = i < expectedLines.length ? expectedLines[i] : undefined;
    if (a !== e) {
      if (e !== undefined && a === undefined) {
        diffLines.push("  - (removed) " + e);
      } else if (a !== undefined && e === undefined) {
        diffLines.push("  + (added)   " + a);
      } else {
        diffLines.push("  - (expected) " + e);
        diffLines.push("  + (actual)   " + a);
      }
    }
  }

  var msg = name + " — snapshot mismatch";
  failed++;
  failures.push(msg);
  process.stdout.write("  \u2717 FAIL: " + msg + "\n");
  process.stdout.write("    Diff:\n");
  for (var d = 0; d < diffLines.length; d++) {
    process.stdout.write("    " + diffLines[d] + "\n");
  }
  process.stdout.write(
    "    Snapshot mismatch for " + name + ". If this change is intentional, " +
    "delete tests/snapshots/" + snapFile + " and rerun.\n"
  );
  return false;
}

// ---------------------------------------------------------------------------
// Part 1: templates.json keys snapshot
// ---------------------------------------------------------------------------

section("Part 1: templates.json keys snapshot");

var templatesJson = JSON.parse(
  fs.readFileSync(path.join(SCRIPTS_DIR, "templates.json"), "utf8")
);
var templateKeys = Object.keys(templatesJson["flow-templates"]).sort();

matchSnapshot("template keys", "template-keys.snap", templateKeys);

// ---------------------------------------------------------------------------
// Part 2: CLAUDE.md gate table snapshot
// ---------------------------------------------------------------------------

section("Part 2: CLAUDE.md gate table snapshot");

var claudeMd = fs.readFileSync(path.join(PLUGIN_ROOT, "CLAUDE.md"), "utf8");

// Extract the Skill Review Gates section: from "## Skill Review Gates" to next "---" or "##"
var gateMatch = claudeMd.match(
  /## Skill Review Gates\n([\s\S]*?)(?=\n---|\n## )/
);

var gateTable = "";
if (gateMatch) {
  gateTable = gateMatch[0].trim();
}

assert(gateTable.length > 0, "gate table extracted from CLAUDE.md");
if (gateTable.length > 0) {
  process.stdout.write("  \u2713 gate table extracted from CLAUDE.md\n");
}

matchSnapshot("gate table", "gate-table.snap", gateTable);

// ---------------------------------------------------------------------------
// Part 3: Script CLI flags snapshot
// ---------------------------------------------------------------------------

section("Part 3: Script CLI flags snapshot");

var SCRIPTS_TO_CHECK = [
  "flow-to-figma.js",
  "brief-to-figma.js",
  "slide-to-figma.js",
  "assemble-preview.js",
];

var cliFlags = {};

for (var si = 0; si < SCRIPTS_TO_CHECK.length; si++) {
  var scriptName = SCRIPTS_TO_CHECK[si];
  var scriptPath = path.join(SCRIPTS_DIR, scriptName);
  var baseName = scriptName.replace(".js", "");

  assert(fs.existsSync(scriptPath), baseName + " — script exists");
  if (fs.existsSync(scriptPath)) {
    process.stdout.write("  \u2713 " + baseName + " — script exists\n");
  }

  var src = fs.readFileSync(scriptPath, "utf8");

  // Extract flags from === '--flag' patterns
  var flagRe = /=== '(--[a-z][-a-z]*)'/g;
  var flags = [];
  var fmatch;
  while ((fmatch = flagRe.exec(src)) !== null) {
    if (flags.indexOf(fmatch[1]) === -1) {
      flags.push(fmatch[1]);
    }
  }

  // Also check === '-x' short flags
  var shortRe = /=== '(-[a-z])'/g;
  while ((fmatch = shortRe.exec(src)) !== null) {
    if (flags.indexOf(fmatch[1]) === -1) {
      flags.push(fmatch[1]);
    }
  }

  flags.sort();
  cliFlags[baseName] = flags;

  assert(flags.length > 0, baseName + " — has CLI flags");
  if (flags.length > 0) {
    process.stdout.write(
      "  \u2713 " + baseName + " — " + flags.length + " flags: " + flags.join(", ") + "\n"
    );
  }
}

matchSnapshot("CLI flags", "cli-flags.snap", cliFlags);

// ---------------------------------------------------------------------------
// Part 4: assemble-preview TYPE_CONFIGS type names snapshot
// ---------------------------------------------------------------------------

section("Part 4: assemble-preview type names snapshot");

var assemblePreviewSrc = fs.readFileSync(
  path.join(SCRIPTS_DIR, "assemble-preview.js"),
  "utf8"
);

// Extract TYPE_CONFIGS keys by finding the object literal after "var TYPE_CONFIGS = {"
var typeConfigMatch = assemblePreviewSrc.match(
  /var TYPE_CONFIGS\s*=\s*\{([\s\S]*?)\n\};/
);

var typeNames = [];
if (typeConfigMatch) {
  // Match top-level keys (lines like "  flow: {" or "  brief: {")
  var keyRe = /^\s{2}(\w+)\s*:\s*\{/gm;
  var kmatch;
  while ((kmatch = keyRe.exec(typeConfigMatch[1])) !== null) {
    typeNames.push(kmatch[1]);
  }
}
typeNames.sort();

assert(typeNames.length > 0, "TYPE_CONFIGS type names extracted");
if (typeNames.length > 0) {
  process.stdout.write(
    "  \u2713 TYPE_CONFIGS type names: " + typeNames.join(", ") + "\n"
  );
}

matchSnapshot("type names", "type-names.snap", typeNames);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

process.stdout.write("\n");
process.stdout.write(
  "Results: " + passed + " passed, " + failed + " failed\n"
);

if (failures.length > 0) {
  process.stdout.write("\nSnapshot violations:\n");
  for (var i = 0; i < failures.length; i++) {
    process.stdout.write("  - " + failures[i] + "\n");
  }
  process.exit(1);
} else {
  process.stdout.write("All snapshots verified.\n");
}
