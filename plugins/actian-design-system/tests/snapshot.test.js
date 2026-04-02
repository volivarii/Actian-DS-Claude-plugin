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

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

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
 * - If snap doesn't exist: create it, return { created: true }
 * - If snap exists and matches: return { match: true }
 * - If snap exists and differs: return { mismatch: true, diff: string }
 */
function checkSnapshot(snapFile, actual) {
  var snapPath = path.join(SNAP_DIR, snapFile);
  var actualStr = typeof actual === "string" ? actual : JSON.stringify(actual, null, 2);

  if (!fs.existsSync(snapPath)) {
    fs.writeFileSync(snapPath, actualStr, "utf8");
    return { created: true };
  }

  var expected = fs.readFileSync(snapPath, "utf8");

  if (actualStr === expected) {
    return { match: true };
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

  return {
    mismatch: true,
    diff: diffLines.join("\n") +
      "\n  Snapshot mismatch. If intentional, delete tests/snapshots/" + snapFile + " and rerun.",
  };
}

describe("Snapshots", function () {
  // ---------------------------------------------------------------------------
  // Part 1: templates.json keys snapshot
  // ---------------------------------------------------------------------------

  describe("Part 1: templates.json keys snapshot", function () {
    it("template keys match snapshot", function () {
      var templatesJson = JSON.parse(
        fs.readFileSync(path.join(SCRIPTS_DIR, "templates.json"), "utf8")
      );
      var templateKeys = Object.keys(templatesJson["flow-templates"]).sort();

      var result = checkSnapshot("template-keys.snap", templateKeys);
      if (result.mismatch) {
        assert.fail("template keys snapshot mismatch:\n" + result.diff);
      }
      // created or match — pass
    });
  });

  // ---------------------------------------------------------------------------
  // Part 2: CLAUDE.md gate table snapshot
  // ---------------------------------------------------------------------------

  describe("Part 2: CLAUDE.md gate table snapshot", function () {
    it("gate table extracted and matches snapshot", function () {
      var claudeMd = fs.readFileSync(path.join(PLUGIN_ROOT, "CLAUDE.md"), "utf8");

      var gateMatch = claudeMd.match(
        /## Skill Review Gates\n([\s\S]*?)(?=\n---|\n## )/
      );

      var gateTable = "";
      if (gateMatch) {
        gateTable = gateMatch[0].trim();
      }

      assert.ok(gateTable.length > 0, "gate table extracted from CLAUDE.md");

      var result = checkSnapshot("gate-table.snap", gateTable);
      if (result.mismatch) {
        assert.fail("gate table snapshot mismatch:\n" + result.diff);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Part 3: Script CLI flags snapshot
  // ---------------------------------------------------------------------------

  describe("Part 3: Script CLI flags snapshot", function () {
    var SCRIPTS_TO_CHECK = [
      "flow-to-figma.js",
      "brief-to-figma.js",
      "slide-to-figma.js",
      "assemble-preview.js",
    ];

    it("all scripts exist and have CLI flags", function () {
      SCRIPTS_TO_CHECK.forEach(function (scriptName) {
        var scriptPath = path.join(SCRIPTS_DIR, scriptName);
        assert.ok(fs.existsSync(scriptPath), scriptName + " — script not found");

        var src = fs.readFileSync(scriptPath, "utf8");
        var flags = [];
        var fmatch;

        var flagRe = /=== '(--[a-z][-a-z]*)'/g;
        while ((fmatch = flagRe.exec(src)) !== null) {
          if (flags.indexOf(fmatch[1]) === -1) flags.push(fmatch[1]);
        }

        var shortRe = /=== '(-[a-z])'/g;
        while ((fmatch = shortRe.exec(src)) !== null) {
          if (flags.indexOf(fmatch[1]) === -1) flags.push(fmatch[1]);
        }

        assert.ok(flags.length > 0, scriptName.replace(".js", "") + " — has no CLI flags");
      });
    });

    it("CLI flags match snapshot", function () {
      var cliFlags = {};

      SCRIPTS_TO_CHECK.forEach(function (scriptName) {
        var scriptPath = path.join(SCRIPTS_DIR, scriptName);
        var baseName = scriptName.replace(".js", "");

        if (!fs.existsSync(scriptPath)) return;

        var src = fs.readFileSync(scriptPath, "utf8");
        var flags = [];
        var fmatch;

        var flagRe = /=== '(--[a-z][-a-z]*)'/g;
        while ((fmatch = flagRe.exec(src)) !== null) {
          if (flags.indexOf(fmatch[1]) === -1) flags.push(fmatch[1]);
        }

        var shortRe = /=== '(-[a-z])'/g;
        while ((fmatch = shortRe.exec(src)) !== null) {
          if (flags.indexOf(fmatch[1]) === -1) flags.push(fmatch[1]);
        }

        flags.sort();
        cliFlags[baseName] = flags;
      });

      var result = checkSnapshot("cli-flags.snap", cliFlags);
      if (result.mismatch) {
        assert.fail("CLI flags snapshot mismatch:\n" + result.diff);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Part 4: assemble-preview TYPE_CONFIGS type names snapshot
  // ---------------------------------------------------------------------------

  describe("Part 4: assemble-preview type names snapshot", function () {
    it("TYPE_CONFIGS type names extracted and match snapshot", function () {
      var assemblePreviewSrc = fs.readFileSync(
        path.join(SCRIPTS_DIR, "assemble-preview.js"),
        "utf8"
      );

      var typeConfigMatch = assemblePreviewSrc.match(
        /var TYPE_CONFIGS\s*=\s*\{([\s\S]*?)\n\};/
      );

      var typeNames = [];
      if (typeConfigMatch) {
        var keyRe = /^\s{2}(\w+)\s*:\s*\{/gm;
        var kmatch;
        while ((kmatch = keyRe.exec(typeConfigMatch[1])) !== null) {
          typeNames.push(kmatch[1]);
        }
      }
      typeNames.sort();

      assert.ok(typeNames.length > 0, "TYPE_CONFIGS type names not extracted — none found");

      var result = checkSnapshot("type-names.snap", typeNames);
      if (result.mismatch) {
        assert.fail("type names snapshot mismatch:\n" + result.diff);
      }
    });
  });
});
