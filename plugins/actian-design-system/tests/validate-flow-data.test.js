#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..");
var validate = require(
  path.join(PLUGIN_ROOT, "scripts", "validate-flow-data.js"),
);

describe("validate-flow-data", function () {
  describe("findBannedText", function () {
    it("detects banned text in props.Label", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1: Test",
            content: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                props: { Label: "Button label" },
              },
            ],
          },
        ],
      };
      var issues = validate.findBannedText(data);
      assert.ok(issues.length > 0, "should find banned text");
      assert.ok(issues[0].value === "Button label");
      assert.strictEqual(issues[0].severity, "P0");
    });

    it("detects banned text in TEXT node content", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1: Test",
            content: [
              {
                type: "TEXT",
                content: "Page Title",
              },
            ],
          },
        ],
      };
      var issues = validate.findBannedText(data);
      assert.ok(issues.length > 0);
      assert.ok(issues[0].value === "Page Title");
    });

    it("detects banned text in pageHeader.title", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1: Test",
            pageHeader: { title: "Page Title" },
            content: [],
          },
        ],
      };
      var issues = validate.findBannedText(data);
      assert.ok(issues.length > 0);
    });

    it("detects banned text nested in children", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1: Test",
            content: [
              {
                type: "FRAME",
                children: [
                  {
                    type: "TEXT",
                    content: "Description text",
                  },
                ],
              },
            ],
          },
        ],
      };
      var issues = validate.findBannedText(data);
      assert.ok(issues.length > 0);
      assert.ok(issues[0].value === "Description text");
    });

    it("returns empty array for clean data", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1: Dashboard",
            content: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                props: { Label: "Create data product" },
              },
            ],
          },
        ],
      };
      var issues = validate.findBannedText(data);
      assert.strictEqual(issues.length, 0);
    });
  });

  describe("findUnresolvedTokens", function () {
    it("detects unresolved --zen- token in fills", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1: Test",
            content: [
              {
                type: "FRAME",
                fills: ["var(--zen-nonexistent-token)"],
              },
            ],
          },
        ],
      };
      var issues = validate.findUnresolvedTokens(data);
      assert.ok(issues.length > 0, "should find unresolved token");
      assert.strictEqual(issues[0].severity, "P1");
      assert.ok(issues[0].value.indexOf("--zen-nonexistent-token") !== -1);
    });

    it("accepts valid --zen- tokens", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1: Test",
            content: [
              {
                type: "FRAME",
                fills: ["var(--zen-color-brand-primary)"],
              },
            ],
          },
        ],
      };
      var issues = validate.findUnresolvedTokens(data);
      assert.strictEqual(issues.length, 0, "valid token should not be flagged");
    });

    it("detects unresolved token in color field", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1: Test",
            content: [
              {
                type: "TEXT",
                content: "Hello",
                color: "var(--zen-fake-color)",
              },
            ],
          },
        ],
      };
      var issues = validate.findUnresolvedTokens(data);
      assert.ok(issues.length > 0);
    });
  });

  describe("findTerminologyIssues", function () {
    it("detects 'admin panel' and suggests 'Studio'", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1: Test",
            content: [
              {
                type: "TEXT",
                content: "Open the admin panel to configure settings",
              },
            ],
          },
        ],
      };
      var issues = validate.findTerminologyIssues(data);
      assert.ok(issues.length > 0, "should detect 'admin panel'");
      assert.strictEqual(issues[0].severity, "P1");
      assert.ok(issues[0].suggestion.indexOf("Studio") !== -1);
    });

    it("detects 'the tool' and suggests 'Data Intelligence Platform'", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1: Test",
            content: [
              {
                type: "TEXT",
                content: "Welcome to the tool",
              },
            ],
          },
        ],
      };
      var issues = validate.findTerminologyIssues(data);
      assert.ok(issues.length > 0);
    });

    it("does not flag correct terminology", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1: Test",
            content: [
              {
                type: "TEXT",
                content: "Browse the Studio catalog",
              },
            ],
          },
        ],
      };
      var issues = validate.findTerminologyIssues(data);
      assert.strictEqual(issues.length, 0);
    });

    it("detects terminology in props values", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1: Test",
            content: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                props: { Label: "Go to admin panel" },
              },
            ],
          },
        ],
      };
      var issues = validate.findTerminologyIssues(data);
      assert.ok(issues.length > 0);
    });
  });

  // === Task 3: Tier justification checks ===
  describe("tier justification (validate)", function () {
    it("tier 'recognized' without justification: no missing-justification error", function () {
      var data = {
        meta: { feature: "X", app: "Studio" },
        screens: [
          {
            name: "Catalog browse",
            template: "studio",
            pageHeader: { title: "Catalog" },
            content: [],
            tier: "recognized",
            confidence: 0.9,
            matchedRecipe: "table-list",
          },
        ],
      };
      var result = validate.validate(data);
      var errs = (result.findings || []).filter(function (f) {
        return f.kind === "missing-justification";
      });
      assert.strictEqual(
        errs.length,
        0,
        "tier 1 should not require justification",
      );
    });

    it("tier 'adapted' without justification: missing-justification error", function () {
      var data = {
        meta: { feature: "X", app: "Studio" },
        screens: [
          {
            name: "X",
            template: "studio",
            pageHeader: { title: "X" },
            content: [],
            tier: "adapted",
            confidence: 0.8,
            composition: ["detail-page", "table-list"],
          },
        ],
      };
      var result = validate.validate(data);
      var errs = (result.findings || []).filter(function (f) {
        return f.kind === "missing-justification";
      });
      assert.strictEqual(errs.length, 1, "tier 2 must require justification");
      assert.strictEqual(errs[0].severity, "error");
    });

    it("tier 'improvised' without justification: missing-justification error", function () {
      var data = {
        meta: { feature: "X", app: "Studio" },
        screens: [
          {
            name: "X",
            template: "studio",
            pageHeader: { title: "X" },
            content: [],
            tier: "improvised",
          },
        ],
      };
      var result = validate.validate(data);
      var errs = (result.findings || []).filter(function (f) {
        return f.kind === "missing-justification";
      });
      assert.strictEqual(errs.length, 1);
      assert.strictEqual(errs[0].severity, "error");
    });

    it("tier 'adapted' with too-short justification (<30 chars): error", function () {
      var data = {
        meta: { feature: "X", app: "Studio" },
        screens: [
          {
            name: "X",
            template: "studio",
            pageHeader: { title: "X" },
            content: [],
            tier: "adapted",
            composition: ["detail-page", "table-list"],
            justification: "too short",
          },
        ],
      };
      var result = validate.validate(data);
      var errs = (result.findings || []).filter(function (f) {
        return f.kind === "missing-justification";
      });
      assert.strictEqual(
        errs.length,
        1,
        "<30 char justification treated as missing",
      );
    });

    it("tier 'adapted' with valid justification: no error", function () {
      var data = {
        meta: { feature: "X", app: "Studio" },
        screens: [
          {
            name: "X",
            template: "studio",
            pageHeader: { title: "X" },
            content: [],
            tier: "adapted",
            composition: ["detail-page", "table-list"],
            justification:
              "Form authoring benefits from real-time preview of the term card across screens.",
          },
        ],
      };
      var result = validate.validate(data);
      var errs = (result.findings || []).filter(function (f) {
        return f.kind === "missing-justification";
      });
      assert.strictEqual(errs.length, 0);
    });

    it("screen with no tier field at all: no missing-justification error (backwards compat)", function () {
      var data = {
        meta: { feature: "X", app: "Studio" },
        screens: [
          {
            name: "X",
            template: "studio",
            pageHeader: { title: "X" },
            content: [],
          },
        ],
      };
      var result = validate.validate(data);
      var errs = (result.findings || []).filter(function (f) {
        return f.kind === "missing-justification";
      });
      assert.strictEqual(
        errs.length,
        0,
        "pre-tier flow-data must validate without injecting tier-related errors",
      );
    });
  });

  // === Task 4: Severity-tiered soft-deviation checks ===
  describe("severity-tiered soft-deviation", function () {
    it("soft-deviation at tier 'recognized': severity warning", function () {
      var data = {
        meta: { feature: "X", app: "Studio" },
        screens: [
          {
            name: "X",
            template: "studio",
            pageHeader: { title: "X" },
            content: [{ type: "FRAME", role: "off-recipe" }],
            tier: "recognized",
            matchedRecipe: "table-list",
          },
        ],
      };
      var result = validate.validate(data);
      var softs = (result.findings || []).filter(function (f) {
        return f.kind === "soft-deviation";
      });
      assert.strictEqual(softs.length, 1);
      assert.strictEqual(softs[0].severity, "warning");
    });

    it("soft-deviation at tier 'adapted': severity warning", function () {
      var data = {
        meta: { feature: "X", app: "Studio" },
        screens: [
          {
            name: "X",
            template: "studio",
            pageHeader: { title: "X" },
            content: [{ type: "FRAME", role: "off-recipe" }],
            tier: "adapted",
            composition: ["detail-page", "table-list"],
            justification:
              "Form authoring benefits from real-time preview of related records.",
          },
        ],
      };
      var result = validate.validate(data);
      var softs = (result.findings || []).filter(function (f) {
        return f.kind === "soft-deviation";
      });
      assert.strictEqual(softs.length, 1);
      assert.strictEqual(softs[0].severity, "warning");
    });

    it("soft-deviation at tier 'improvised': severity info", function () {
      var data = {
        meta: { feature: "X", app: "Studio" },
        screens: [
          {
            name: "X",
            template: "studio",
            pageHeader: { title: "X" },
            content: [{ type: "FRAME", role: "off-recipe" }],
            tier: "improvised",
            justification:
              "No recipe matches; inventing structure for permission-block UX pattern.",
          },
        ],
      };
      var result = validate.validate(data);
      var softs = (result.findings || []).filter(function (f) {
        return f.kind === "soft-deviation";
      });
      assert.strictEqual(softs.length, 1);
      assert.strictEqual(softs[0].severity, "info");
    });

    it("soft-deviation at no-tier (pre-tier flow-data): severity warning", function () {
      var data = {
        meta: { feature: "X", app: "Studio" },
        screens: [
          {
            name: "X",
            template: "studio",
            pageHeader: { title: "X" },
            content: [{ type: "FRAME", role: "off-recipe" }],
            // no tier
          },
        ],
      };
      var result = validate.validate(data);
      var softs = (result.findings || []).filter(function (f) {
        return f.kind === "soft-deviation";
      });
      assert.strictEqual(softs.length, 1);
      assert.strictEqual(softs[0].severity, "warning");
    });

    it("missing-justification stays error at every tier (hard constraint)", function () {
      // Verifies severityForTier doesn't downgrade hard-constraint findings
      var data = {
        meta: { feature: "X", app: "Studio" },
        screens: [
          {
            name: "X",
            template: "studio",
            pageHeader: { title: "X" },
            content: [],
            tier: "improvised",
            // missing justification — hard constraint
          },
        ],
      };
      var result = validate.validate(data);
      var errs = (result.findings || []).filter(function (f) {
        return f.kind === "missing-justification";
      });
      assert.strictEqual(errs.length, 1);
      assert.strictEqual(
        errs[0].severity,
        "error",
        "hard constraints don't downgrade by tier",
      );
    });
  });

  describe("CLI exit codes (contract lock)", function () {
    var fs = require("fs");
    var os = require("os");
    var { spawnSync } = require("node:child_process");

    function runCli(data) {
      var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "validate-cli-"));
      var dataPath = path.join(tmpDir, "flow-data.json");
      fs.writeFileSync(dataPath, JSON.stringify(data));
      var script = path.join(PLUGIN_ROOT, "scripts", "validate-flow-data.js");
      var result = spawnSync(process.execPath, [script, dataPath], {
        encoding: "utf8",
      });
      fs.rmSync(tmpDir, { recursive: true, force: true });
      return result;
    }

    it("exits 0 on clean data", function () {
      var data = {
        meta: { feature: "Clean Test" },
        screens: [
          {
            name: "Screen 1: Clean",
            content: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                props: { Label: "Save" },
              },
            ],
          },
        ],
      };
      var result = runCli(data);
      assert.strictEqual(result.status, 0, "expected exit 0, got " + result.status + ": " + result.stderr);
    });

    it("exits 1 on banned text (P0)", function () {
      var data = {
        meta: { feature: "Banned" },
        screens: [
          {
            name: "Screen 1: Banned",
            content: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                props: { Label: "Button label" },
              },
            ],
          },
        ],
      };
      var result = runCli(data);
      assert.strictEqual(result.status, 1, "expected exit 1, got " + result.status);
    });
  });
});
