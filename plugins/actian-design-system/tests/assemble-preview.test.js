#!/usr/bin/env node
"use strict";

/**
 * assemble-preview.test.js — Tests for assemble-preview.js
 *
 * Run with: node tests/assemble-preview.test.js
 * (from the plugins/actian-design-system directory)
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var spawnSync = require("child_process").spawnSync;
var path = require("path");
var os = require("os");
var fs = require("fs");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

var SCRIPT = path.join(__dirname, "..", "scripts", "renderers", "assemble-preview.js");
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
// Tests
// ---------------------------------------------------------------------------

describe("assemble-preview", function () {
  describe("Flow type assembly", function () {
    it("generates valid HTML with all expected markers", function () {
      var r = run([FLOW_FIXTURE, "--type", "flow"]);
      assert.strictEqual(r.status, 0, "exits cleanly");
      assert.ok(r.html.includes("<!DOCTYPE html>"), "starts with DOCTYPE");
      assert.ok(r.html.includes('id="spec-data"'), "has #spec-data script tag");
      assert.ok(r.html.includes('id="flow-container"'), "has flow container div");
      assert.ok(r.html.includes("/* fm-html-map.js */"), "has fm-html-map renderer marker");
      assert.ok(r.html.includes("/* flow-renderer.js */"), "has flow-renderer marker");
      assert.ok(r.html.includes("alpinejs@3.14.9"), "has Alpine CDN");
      assert.ok(r.html.includes("annotation-layer"), "has annotation layer");
      assert.ok(r.html.includes('id="anno-root"'), "has annotation layer markup");
      assert.ok(r.html.includes("fonts.googleapis.com"), "has Google Fonts link");
      assert.ok(r.html.includes("family=Inter"), "loads Inter font");
      assert.ok(r.html.includes("--fm-"), "CSS contains FM tokens");
    });

    it("derives title from meta.feature and meta.app", function () {
      var r = run([FLOW_FIXTURE, "--type", "flow"]);
      assert.ok(r.html.includes("<title>Admin Dashboard"), "title includes feature name");
      assert.ok(r.html.includes("Administration</title>"), "title includes app name");
    });
  });

  describe("Brief type assembly", function () {
    it("generates valid HTML with brief-specific markers", function () {
      var r = run([BRIEF_FIXTURE, "--type", "brief"]);
      assert.strictEqual(r.status, 0, "exits cleanly");
      assert.ok(r.html.includes('id="cards-container"'), "has cards container div");
      assert.ok(r.html.includes("brief-row"), "has brief-row wrapper");
      assert.ok(r.html.includes("/* fm-html-map.js */"), "has fm-html-map renderer marker");
      assert.ok(r.html.includes("/* brief-renderer.js */"), "has brief-renderer marker");
      assert.ok(r.html.includes("family=Inter"), "loads Inter font");
    });

    it("derives title from component name", function () {
      var r = run([BRIEF_FIXTURE, "--type", "brief"]);
      assert.ok(r.html.includes("<title>Button"), "title includes component name");
      assert.ok(r.html.includes("Component Brief</title>"), "title includes brief suffix");
    });
  });

  describe("Presentation type assembly", function () {
    it("generates valid HTML with presentation-specific markers", function () {
      var r = run([PRES_FIXTURE, "--type", "presentation"]);
      assert.strictEqual(r.status, 0, "exits cleanly");
      assert.ok(r.html.includes('id="deck-container"'), "has deck container div");
      assert.ok(r.html.includes("/* presentation-renderer.js */"), "has presentation-renderer marker");
      assert.ok(r.html.includes("family=Roboto"), "loads Roboto font");
    });

    it("derives title from meta.title", function () {
      var r = run([PRES_FIXTURE, "--type", "presentation"]);
      assert.ok(r.html.includes("<title>Design System Progress"), "title includes presentation title");
      assert.ok(r.html.includes("Presentation</title>"), "title includes presentation suffix");
    });
  });

  describe("Embedded JSON integrity", function () {
    it("spec-data JSON is parseable and contains correct data", function () {
      var r = run([FLOW_FIXTURE, "--type", "flow"]);
      var startMarker = '<script id="spec-data" type="application/json">';
      var endMarker = "</script>";
      var startIdx = r.html.indexOf(startMarker);
      assert.ok(startIdx !== -1, "found spec-data start tag");

      if (startIdx !== -1) {
        var jsonStart = startIdx + startMarker.length;
        var jsonEnd = r.html.indexOf(endMarker, jsonStart);
        var embedded = r.html.substring(jsonStart, jsonEnd);
        var unescaped = embedded.replace(/<\\\//g, "</");
        var parsed = null;
        try {
          parsed = JSON.parse(unescaped);
        } catch (e) {
          // parsed stays null
        }
        assert.ok(parsed !== null, "embedded JSON is parseable");
        assert.ok(
          parsed && parsed.meta && parsed.meta.feature === "Admin Dashboard",
          "embedded JSON data is correct"
        );
      }
    });
  });

  describe("Script tag escaping", function () {
    it("</script> in data is escaped and does not break the HTML", function () {
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

      assert.strictEqual(r.status, 0, "exits cleanly with </script> in data");

      var startMarker = '<script id="spec-data" type="application/json">';
      var startIdx = r.html.indexOf(startMarker);
      if (startIdx !== -1) {
        var jsonStart = startIdx + startMarker.length;
        var nextClose = r.html.indexOf("</script>", jsonStart);
        var specDataContent = r.html.substring(jsonStart, nextClose);
        assert.ok(
          specDataContent.indexOf("</script>") === -1,
          "</script> is escaped in embedded JSON"
        );
        assert.ok(
          specDataContent.includes("<\\/script>"),
          "uses <\\/ escaping"
        );
      }
    });
  });

  describe("Error handling", function () {
    it("exits with error and useful message when input is missing", function () {
      var r1 = spawnSync("node", [SCRIPT, "--type", "flow", "-o", "/tmp/x.html"], { encoding: "utf8" });
      assert.ok(r1.status !== 0, "exits with error when input missing");
      assert.ok(r1.stderr.includes("Missing input"), "stderr mentions missing input");
    });

    it("exits with error and useful message when --type is missing", function () {
      var r2 = spawnSync("node", [SCRIPT, FLOW_FIXTURE, "-o", "/tmp/x.html"], { encoding: "utf8" });
      assert.ok(r2.status !== 0, "exits with error when --type missing");
      assert.ok(r2.stderr.includes("Missing --type"), "stderr mentions missing --type");
    });

    it("exits with error for unknown type", function () {
      var r3 = spawnSync("node", [SCRIPT, FLOW_FIXTURE, "--type", "bogus", "-o", "/tmp/x.html"], { encoding: "utf8" });
      assert.ok(r3.status !== 0, "exits with error for unknown type");
      assert.ok(r3.stderr.includes("Unknown type"), "stderr mentions unknown type");
    });

    it("exits with error when -o is missing", function () {
      var r4 = spawnSync("node", [SCRIPT, FLOW_FIXTURE, "--type", "flow"], { encoding: "utf8" });
      assert.ok(r4.status !== 0, "exits with error when -o missing");
      assert.ok(r4.stderr.includes("Missing -o"), "stderr mentions missing -o");
    });
  });
});
