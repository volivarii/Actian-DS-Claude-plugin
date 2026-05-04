#!/usr/bin/env node
"use strict";

// Verifies the component-guideline stub generator. Reads a minimal registry
// fixture and a temp guidelines dir, writes stubs for set-importable
// uncovered components that pass the denylist, updates _index.json.
//
// Covered cases:
//   1. set-importable + uncovered + not denylisted → stub written
//   2. set-importable + already covered → skipped
//   3. importMethod=single → skipped (icon/logo, not briefable)
//   4. set-importable + denylisted (logo, grid) → skipped
//   5. _index.json updated with stub entries appended
//   6. Stub schema: _stub:true, _stubGeneratedAt is ISO, variants populated
//   7. --dry-run prints planned stubs without writing
//   8. Re-running is idempotent (no overwrites on second run)

var { describe, it, before, after } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var os = require("os");

var generateStubs = require("../../scripts/foundations/generate-guideline-stubs.js").generateStubs;
var REGISTRY_FIXTURE = require("./fixtures/dskit-stub-test.json");

function freshGuidelinesDir() {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), "stubs-test-"));
  fs.writeFileSync(
    path.join(dir, "_index.json"),
    JSON.stringify({ extracted_at: "2026-01-01T00:00:00Z", total_components: 1, components: [
      { slug: "button", component: "Button", has_content_guidelines: true, has_design_guidelines: false, has_examples: false, has_screenshots: false, has_behavior: false, frames_found: [], frames_missing: [] },
    ] }, null, 2),
  );
  fs.writeFileSync(
    path.join(dir, "button.json"),
    JSON.stringify({ component: "Button", page_id: "1:1", content_guidelines: { sections: [] } }, null, 2),
  );
  return dir;
}

function writeRegistryToTemp(dir) {
  var p = path.join(dir, "dskit.json");
  fs.writeFileSync(p, JSON.stringify(REGISTRY_FIXTURE, null, 2));
  return p;
}

describe("generate-guideline-stubs", function () {
  describe("filter logic", function () {
    var dir, registryPath, result;
    before(function () {
      dir = freshGuidelinesDir();
      registryPath = writeRegistryToTemp(dir);
      result = generateStubs({
        registryPath: registryPath,
        guidelinesDir: dir,
        indexPath: path.join(dir, "_index.json"),
      });
    });

    it("writes a stub for set-importable + uncovered + not denylisted (tooltip)", function () {
      var p = path.join(dir, "tooltip.json");
      assert.ok(fs.existsSync(p), "tooltip.json should be created");
      assert.ok(result.generated.includes("tooltip"));
    });

    it("skips set-importable + already covered (button)", function () {
      assert.ok(!result.generated.includes("button"));
      assert.ok(result.skipped.includes("button"));
    });

    it("skips importMethod=single (kafka)", function () {
      assert.ok(!result.generated.includes("kafka"));
      assert.ok(!fs.existsSync(path.join(dir, "kafka.json")));
    });

    it("denylists brand-asset slug (actian-data-intelligence-dev-logo)", function () {
      assert.ok(!result.generated.includes("actian-data-intelligence-dev-logo"));
      assert.ok(result.denylisted.includes("actian-data-intelligence-dev-logo"));
    });

    it("denylists -grid suffix (xs-grid)", function () {
      assert.ok(!result.generated.includes("xs-grid"));
      assert.ok(result.denylisted.includes("xs-grid"));
    });
  });

  describe("stub content", function () {
    var dir, stubData;
    before(function () {
      dir = freshGuidelinesDir();
      var registryPath = writeRegistryToTemp(dir);
      generateStubs({
        registryPath: registryPath,
        guidelinesDir: dir,
        indexPath: path.join(dir, "_index.json"),
      });
      stubData = JSON.parse(fs.readFileSync(path.join(dir, "tooltip.json"), "utf8"));
    });

    it("stub has _stub:true + _stubGeneratedAt as ISO timestamp", function () {
      assert.strictEqual(stubData._stub, true);
      assert.match(stubData._stubGeneratedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("variants populated from registry (axes + totalVariants computed)", function () {
      assert.deepStrictEqual(stubData.variants.axes, { Position: ["Top", "Bottom"] });
      assert.strictEqual(stubData.variants.totalVariants, 2);
    });

    it("curated sections set to null", function () {
      assert.strictEqual(stubData.content_guidelines, null);
      assert.strictEqual(stubData.design_guidelines, null);
      assert.strictEqual(stubData.examples, null);
      assert.strictEqual(stubData.screenshots, null);
      assert.strictEqual(stubData.behavior, null);
    });
  });

  describe("_index.json updates", function () {
    it("appends stub entries to components[] with has_*: false flags + _stub:true", function () {
      var dir = freshGuidelinesDir();
      var registryPath = writeRegistryToTemp(dir);
      generateStubs({
        registryPath: registryPath,
        guidelinesDir: dir,
        indexPath: path.join(dir, "_index.json"),
      });
      var idx = JSON.parse(fs.readFileSync(path.join(dir, "_index.json"), "utf8"));
      var tooltipEntry = idx.components.find(function (c) { return c.slug === "tooltip"; });
      assert.ok(tooltipEntry, "tooltip entry should exist in _index.json");
      assert.strictEqual(tooltipEntry._stub, true);
      assert.strictEqual(tooltipEntry.has_content_guidelines, false);
      assert.strictEqual(tooltipEntry.has_design_guidelines, false);
    });
  });

  describe("idempotency", function () {
    it("re-running does not overwrite existing files", function () {
      var dir = freshGuidelinesDir();
      var registryPath = writeRegistryToTemp(dir);
      generateStubs({ registryPath: registryPath, guidelinesDir: dir, indexPath: path.join(dir, "_index.json") });
      var firstStub = fs.readFileSync(path.join(dir, "tooltip.json"), "utf8");
      // Mutate the stub to detect overwrite
      fs.writeFileSync(path.join(dir, "tooltip.json"), firstStub.replace('"_stub": true', '"_stub": "MUTATED"'));
      var secondResult = generateStubs({ registryPath: registryPath, guidelinesDir: dir, indexPath: path.join(dir, "_index.json") });
      var secondStub = fs.readFileSync(path.join(dir, "tooltip.json"), "utf8");
      assert.match(secondStub, /"_stub": "MUTATED"/, "stub should not be overwritten");
      assert.ok(!secondResult.generated.includes("tooltip"));
    });
  });

  describe("--dry-run mode", function () {
    it("returns planned stubs without writing files", function () {
      var dir = freshGuidelinesDir();
      var registryPath = writeRegistryToTemp(dir);
      var result = generateStubs({
        registryPath: registryPath,
        guidelinesDir: dir,
        indexPath: path.join(dir, "_index.json"),
        dryRun: true,
      });
      assert.ok(result.generated.includes("tooltip"));
      assert.ok(!fs.existsSync(path.join(dir, "tooltip.json")), "no file should be written in dry-run");
    });
  });
});
