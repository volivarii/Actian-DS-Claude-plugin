#!/usr/bin/env node
"use strict";

/**
 * preview-tokens-inlined.test.js — Asserts that assembled previews inline
 * vendor/tokens/tokens.css and bind brand colors to --zen-color-* variables.
 *
 * Run with: node --test tests/renderers/preview-tokens-inlined.test.js
 */

var { describe, it } = require("node:test");
var assert = require("node:assert/strict");
var spawnSync = require("child_process").spawnSync;
var path = require("path");
var os = require("os");
var fs = require("fs");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

var SCRIPT = path.join(
  __dirname,
  "..",
  "..",
  "scripts",
  "renderers",
  "assemble-preview.js",
);
var FIXTURES = path.join(__dirname, "..", "fixtures");
var FLOW_FIXTURE = path.join(FIXTURES, "admin-dashboard.json");

// ---------------------------------------------------------------------------
// Helper: run the script and return { status, stdout, stderr, html }
// ---------------------------------------------------------------------------

function run(args) {
  var outputFile = path.join(
    os.tmpdir(),
    "preview-tokens-test-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 8) +
      ".html",
  );
  var fullArgs = [SCRIPT].concat(args).concat(["-o", outputFile]);
  var result = spawnSync("node", fullArgs, { encoding: "utf8" });
  var html = "";
  if (fs.existsSync(outputFile)) {
    html = fs.readFileSync(outputFile, "utf8");
    fs.unlinkSync(outputFile);
  }
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    html: html,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("preview-tokens-inlined", function () {
  describe("Flow-share deliverable", function () {
    it("inlines vendored tokens.css (--zen-color-primary-500 present)", function () {
      var r = run([FLOW_FIXTURE, "--type", "flow-share"]);
      assert.strictEqual(r.status, 0, "exits cleanly");
      assert.ok(
        r.html.includes("--zen-color-primary-500"),
        "HTML contains --zen-color-primary-500 from vendor/tokens/tokens.css",
      );
    });
  });
});
