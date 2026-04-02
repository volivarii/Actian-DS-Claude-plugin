#!/usr/bin/env node
"use strict";

/**
 * assemble-preview.test.js — Tests for assemble-preview.js
 *
 * Run with: node tests/assemble-preview.test.js
 * (from the plugins/actian-design-system directory)
 */

var spawnSync = require("child_process").spawnSync;
var path = require("path");
var os = require("os");
var fs = require("fs");

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

var passed = 0;
var failed = 0;
var failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    process.stdout.write("  \u2713 " + message + "\n");
  } else {
    failed++;
    failures.push(message);
    process.stdout.write("  \u2717 FAIL: " + message + "\n");
  }
}

function assertContains(str, substr, message) {
  assert(
    typeof str === "string" && str.indexOf(substr) !== -1,
    message + " (expected to contain: " + JSON.stringify(substr) + ")"
  );
}

function section(name) {
  process.stdout.write("\n" + name + "\n");
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

var SCRIPT = path.join(__dirname, "..", "scripts", "assemble-preview.js");
var FIXTURES = path.join(__dirname, "fixtures");
var FLOW_FIXTURE = path.join(FIXTURES, "admin-dashboard.json");
var BRIEF_FIXTURE = path.join(FIXTURES, "button-brief-data.json");
var PRES_FIXTURE = path.join(FIXTURES, "sample-presentation.json");

// ---------------------------------------------------------------------------
// Helper: run the script and return { status, stdout, stderr, html }
// ---------------------------------------------------------------------------

function run(args) {
  var outputFile = path.join(
    os.tmpdir(),
    "assemble-preview-test-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".html"
  );
  var fullArgs = [SCRIPT].concat(args).concat(["-o", outputFile]);
  var result = spawnSync("node", fullArgs, { encoding: "utf8" });
  var html = "";
  if (fs.existsSync(outputFile)) {
    html = fs.readFileSync(outputFile, "utf8");
    fs.unlinkSync(outputFile);
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, html: html };
}

// ---------------------------------------------------------------------------
// Tests: Flow type
// ---------------------------------------------------------------------------

section("Flow type assembly");

(function () {
  var r = run([FLOW_FIXTURE, "--type", "flow"]);
  assert(r.status === 0, "exits cleanly");
  assertContains(r.html, "<!DOCTYPE html>", "starts with DOCTYPE");
  assertContains(r.html, 'id="spec-data"', "has #spec-data script tag");
  assertContains(r.html, 'id="flow-container"', "has flow container div");
  assertContains(r.html, "/* fm-html-map.js */", "has fm-html-map renderer marker");
  assertContains(r.html, "/* flow-renderer.js */", "has flow-renderer marker");
  assertContains(r.html, "alpinejs@3.14.9", "has Alpine CDN");
  assertContains(r.html, "annotation-layer", "has annotation layer");
  assertContains(r.html, "id=\"anno-root\"", "has annotation layer markup");
  assertContains(r.html, "fonts.googleapis.com", "has Google Fonts link");
  assertContains(r.html, "family=Inter", "loads Inter font");
  assertContains(r.html, "--fm-", "CSS contains FM tokens");

  // Title derivation: meta.feature + " — " + meta.app
  assertContains(r.html, "<title>Admin Dashboard", "title includes feature name");
  assertContains(r.html, "Administration</title>", "title includes app name");
})();

// ---------------------------------------------------------------------------
// Tests: Brief type
// ---------------------------------------------------------------------------

section("Brief type assembly");

(function () {
  var r = run([BRIEF_FIXTURE, "--type", "brief"]);
  assert(r.status === 0, "exits cleanly");
  assertContains(r.html, 'id="cards-container"', "has cards container div");
  assertContains(r.html, "brief-row", "has brief-row wrapper");
  assertContains(r.html, "/* fm-html-map.js */", "has fm-html-map renderer marker");
  assertContains(r.html, "/* brief-renderer.js */", "has brief-renderer marker");
  assertContains(r.html, "family=Inter", "loads Inter font");

  // Title derivation: card1_header.name + " — Component Brief"
  assertContains(r.html, "<title>Button", "title includes component name");
  assertContains(r.html, "Component Brief</title>", "title includes brief suffix");
})();

// ---------------------------------------------------------------------------
// Tests: Presentation type
// ---------------------------------------------------------------------------

section("Presentation type assembly");

(function () {
  var r = run([PRES_FIXTURE, "--type", "presentation"]);
  assert(r.status === 0, "exits cleanly");
  assertContains(r.html, 'id="deck-container"', "has deck container div");
  assertContains(r.html, "/* presentation-renderer.js */", "has presentation-renderer marker");
  assertContains(r.html, "family=Roboto", "loads Roboto font");

  // Title derivation: meta.title + " — Presentation"
  assertContains(r.html, "<title>Design System Progress", "title includes presentation title");
  assertContains(r.html, "Presentation</title>", "title includes presentation suffix");
})();

// ---------------------------------------------------------------------------
// Tests: Embedded JSON is parseable
// ---------------------------------------------------------------------------

section("Embedded JSON integrity");

(function () {
  var r = run([FLOW_FIXTURE, "--type", "flow"]);
  // Extract JSON from #spec-data tag
  var startMarker = '<script id="spec-data" type="application/json">';
  var endMarker = "</script>";
  var startIdx = r.html.indexOf(startMarker);
  assert(startIdx !== -1, "found spec-data start tag");

  if (startIdx !== -1) {
    var jsonStart = startIdx + startMarker.length;
    var jsonEnd = r.html.indexOf(endMarker, jsonStart);
    var embedded = r.html.substring(jsonStart, jsonEnd);
    // Unescape for parsing
    var unescaped = embedded.replace(/<\\\//g, "</");
    var parsed = null;
    try {
      parsed = JSON.parse(unescaped);
    } catch (e) {
      // parsed stays null
    }
    assert(parsed !== null, "embedded JSON is parseable");
    assert(parsed && parsed.meta && parsed.meta.feature === "Admin Dashboard", "embedded JSON data is correct");
  }
})();

// ---------------------------------------------------------------------------
// Tests: </script> escaping
// ---------------------------------------------------------------------------

section("Script tag escaping");

(function () {
  // Create a temporary JSON file with </script> inside it
  var tmpJson = path.join(
    os.tmpdir(),
    "escape-test-" + Date.now() + ".json"
  );
  var payload = {
    meta: { feature: "Test</script>XSS", app: "App" },
    screens: []
  };
  fs.writeFileSync(tmpJson, JSON.stringify(payload), "utf8");

  var r = run([tmpJson, "--type", "flow"]);
  fs.unlinkSync(tmpJson);

  assert(r.status === 0, "exits cleanly with </script> in data");
  // The literal </script> should NOT appear inside the spec-data tag
  var startMarker = '<script id="spec-data" type="application/json">';
  var startIdx = r.html.indexOf(startMarker);
  if (startIdx !== -1) {
    var jsonStart = startIdx + startMarker.length;
    var nextClose = r.html.indexOf("</script>", jsonStart);
    var specDataContent = r.html.substring(jsonStart, nextClose);
    assert(
      specDataContent.indexOf("</script>") === -1,
      "</script> is escaped in embedded JSON"
    );
    assertContains(specDataContent, "<\\/script>", "uses <\\/ escaping");
  }
})();

// ---------------------------------------------------------------------------
// Tests: Error handling
// ---------------------------------------------------------------------------

section("Error handling");

(function () {
  // Missing input
  var r1 = spawnSync("node", [SCRIPT, "--type", "flow", "-o", "/tmp/x.html"], { encoding: "utf8" });
  assert(r1.status !== 0, "exits with error when input missing");
  assertContains(r1.stderr, "Missing input", "stderr mentions missing input");

  // Missing --type
  var r2 = spawnSync("node", [SCRIPT, FLOW_FIXTURE, "-o", "/tmp/x.html"], { encoding: "utf8" });
  assert(r2.status !== 0, "exits with error when --type missing");
  assertContains(r2.stderr, "Missing --type", "stderr mentions missing --type");

  // Unknown type
  var r3 = spawnSync("node", [SCRIPT, FLOW_FIXTURE, "--type", "bogus", "-o", "/tmp/x.html"], { encoding: "utf8" });
  assert(r3.status !== 0, "exits with error for unknown type");
  assertContains(r3.stderr, "Unknown type", "stderr mentions unknown type");

  // Missing -o
  var r4 = spawnSync("node", [SCRIPT, FLOW_FIXTURE, "--type", "flow"], { encoding: "utf8" });
  assert(r4.status !== 0, "exits with error when -o missing");
  assertContains(r4.stderr, "Missing -o", "stderr mentions missing -o");
})();

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

process.stdout.write("\n---\n");
process.stdout.write(
  passed + " passed, " + failed + " failed, " + (passed + failed) + " total\n"
);

if (failures.length > 0) {
  process.stdout.write("\nFailures:\n");
  for (var i = 0; i < failures.length; i++) {
    process.stdout.write("  - " + failures[i] + "\n");
  }
}

process.exit(failed > 0 ? 1 : 0);
