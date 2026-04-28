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

  describe("findHardcodedColors", function () {
    function fixture(content) {
      return {
        meta: { feature: "Test" },
        screens: [{ name: "S1", content: content }],
      };
    }

    it("flags hex strings in fills", function () {
      var issues = validate.findHardcodedColors(
        fixture([{ type: "FRAME", fills: ["#ffffff"] }]),
      );
      assert.strictEqual(issues.length, 1);
      assert.strictEqual(issues[0].severity, "P0");
      assert.strictEqual(issues[0].check, "hardcoded-color");
      assert.strictEqual(issues[0].value, "#ffffff");
    });

    it("flags 3-char hex strings", function () {
      var issues = validate.findHardcodedColors(
        fixture([{ type: "FRAME", fills: ["#fff"] }]),
      );
      assert.strictEqual(issues.length, 1);
    });

    it("flags rgb() / rgba() / hsl() strings", function () {
      var issues = validate.findHardcodedColors(
        fixture([
          { type: "FRAME", fills: ["rgb(255, 255, 255)"] },
          { type: "FRAME", fills: ["rgba(0, 0, 0, 0.5)"] },
          { type: "FRAME", color: "hsl(120, 50%, 50%)" },
        ]),
      );
      assert.strictEqual(issues.length, 3);
    });

    it("flags Figma {r,g,b} color objects", function () {
      var issues = validate.findHardcodedColors(
        fixture([
          {
            type: "FRAME",
            fills: [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.95 } }],
          },
        ]),
      );
      assert.strictEqual(issues.length, 1);
      assert.strictEqual(issues[0].severity, "P0");
      assert.ok(/"r":0.95/.test(issues[0].value));
    });

    it("flags hex color inside SOLID fill object", function () {
      var issues = validate.findHardcodedColors(
        fixture([{ type: "FRAME", fills: [{ type: "SOLID", color: "#abc" }] }]),
      );
      assert.strictEqual(issues.length, 1);
    });

    it("flags hex inside stroke object", function () {
      var issues = validate.findHardcodedColors(
        fixture([{ type: "FRAME", stroke: { color: "#E2E7F0", weight: 1 } }]),
      );
      assert.strictEqual(issues.length, 1);
      assert.ok(/stroke/.test(issues[0].path));
      assert.strictEqual(issues[0].value, "#E2E7F0");
    });

    it("flags hex on TEXT.color field", function () {
      var issues = validate.findHardcodedColors(
        fixture([{ type: "TEXT", content: "x", color: "#101828" }]),
      );
      assert.strictEqual(issues.length, 1);
    });

    it("accepts var(--zen-…) and var(--fm-…) references", function () {
      var issues = validate.findHardcodedColors(
        fixture([
          { type: "FRAME", fills: ["var(--zen-color-brand-primary)"] },
          { type: "FRAME", fills: ["var(--fm-bg-default)"] },
          { type: "TEXT", content: "x", color: "var(--zen-text-default)" },
        ]),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("accepts transparent / none / currentColor / inherit literals", function () {
      var issues = validate.findHardcodedColors(
        fixture([
          { type: "FRAME", fills: ["transparent"] },
          { type: "FRAME", fills: ["none"] },
          { type: "TEXT", content: "x", color: "currentColor" },
          { type: "TEXT", content: "x", color: "inherit" },
        ]),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("ignores non-color string values at color fields", function () {
      // Some flow-data uses semantic tokens like "primary" — leave alone here;
      // the unresolved-token check handles its own surface.
      var issues = validate.findHardcodedColors(
        fixture([{ type: "FRAME", fills: ["primary"] }]),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("recurses into deeply nested children", function () {
      var issues = validate.findHardcodedColors(
        fixture([
          {
            type: "FRAME",
            children: [
              {
                type: "FRAME",
                children: [{ type: "TEXT", content: "x", color: "#FF0000" }],
              },
            ],
          },
        ]),
      );
      assert.strictEqual(issues.length, 1);
    });

    it("flags multiple hardcoded colors per screen", function () {
      var issues = validate.findHardcodedColors(
        fixture([
          { type: "FRAME", fills: ["#fff", "#000"] },
          { type: "TEXT", content: "x", color: "#101828" },
        ]),
      );
      assert.strictEqual(issues.length, 3);
    });

    it("CLI exit code is 1 when hardcoded colors present", function () {
      var result = validate.validate(
        fixture([{ type: "FRAME", fills: ["#fff"] }]),
      );
      var hardcoded = result.findings.filter(function (f) {
        return f.kind === "hardcoded-color";
      });
      assert.strictEqual(hardcoded.length, 1);
      assert.strictEqual(hardcoded[0].severity, "error");
    });
  });

  describe("findUnmutedChrome", function () {
    function fixture(opts) {
      opts = opts || {};
      return {
        meta: Object.assign(
          { feature: opts.feature || "Settings" },
          opts.glossary ? { _glossary: opts.glossary } : {},
        ),
        screens: [
          {
            name: opts.screenName || "Screen 1: Settings",
            content: opts.content,
          },
        ],
      };
    }

    it("flags fmNavItem with State=On + invented label on non-chrome feature", function () {
      var issues = validate.findUnmutedChrome(
        fixture({
          content: [
            {
              type: "INSTANCE",
              ref: "fmNavItem",
              variant: "State=On",
              props: { Label: "Catalog" },
            },
          ],
        }),
      );
      assert.strictEqual(issues.length, 1);
      assert.strictEqual(issues[0].severity, "P1");
      assert.strictEqual(issues[0].check, "unmuted-chrome");
      assert.strictEqual(issues[0].ref, "fmNavItem");
      assert.strictEqual(issues[0].value, "Catalog");
    });

    it("flags fmNavItem with State=Off + invented label", function () {
      var issues = validate.findUnmutedChrome(
        fixture({
          content: [
            {
              type: "INSTANCE",
              ref: "fmNavItem",
              variant: "State=Off",
              props: { Label: "Pipelines" },
            },
          ],
        }),
      );
      assert.strictEqual(issues.length, 1);
    });

    it("does NOT flag fmNavItem with State=Placeholder", function () {
      var issues = validate.findUnmutedChrome(
        fixture({
          content: [
            {
              type: "INSTANCE",
              ref: "fmNavItem",
              variant: "State=Placeholder",
              props: { Label: "Pipelines" },
            },
          ],
        }),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("does NOT flag fmNavItem with default 'Nav Item' label", function () {
      // The default-leak case is handled by placeholder-text check, not here
      var issues = validate.findUnmutedChrome(
        fixture({
          content: [
            {
              type: "INSTANCE",
              ref: "fmNavItem",
              variant: "State=Off",
              props: { Label: "Nav Item" },
            },
          ],
        }),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("exempts fmNavItem whose label matches glossary.sidebarActive", function () {
      var issues = validate.findUnmutedChrome(
        fixture({
          glossary: { sidebarActive: "Catalog" },
          content: [
            {
              type: "INSTANCE",
              ref: "fmNavItem",
              variant: "State=On",
              props: { Label: "Catalog" },
            },
          ],
        }),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("flags non-active nav items even when sidebarActive is set", function () {
      var issues = validate.findUnmutedChrome(
        fixture({
          glossary: { sidebarActive: "Catalog" },
          content: [
            {
              type: "INSTANCE",
              ref: "fmNavItem",
              variant: "State=On",
              props: { Label: "Catalog" },
            },
            {
              type: "INSTANCE",
              ref: "fmNavItem",
              variant: "State=Off",
              props: { Label: "Pipelines" },
            },
            {
              type: "INSTANCE",
              ref: "fmNavItem",
              variant: "State=Off",
              props: { Label: "Settings" },
            },
          ],
        }),
      );
      assert.strictEqual(issues.length, 2);
      assert.deepStrictEqual(issues.map((i) => i.value).sort(), [
        "Pipelines",
        "Settings",
      ]);
    });

    it("skips entirely when feature description mentions navigation", function () {
      var issues = validate.findUnmutedChrome(
        fixture({
          feature: "Sidebar navigation editor",
          content: [
            {
              type: "INSTANCE",
              ref: "fmNavItem",
              variant: "State=On",
              props: { Label: "Catalog" },
            },
          ],
        }),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("skips when screen name mentions tabs", function () {
      var issues = validate.findUnmutedChrome(
        fixture({
          screenName: "Screen 2: Settings tabs",
          content: [
            {
              type: "INSTANCE",
              ref: "fmTab",
              variant: "State=On",
              props: { "Tab label": "Overview" },
            },
          ],
        }),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("flags fmTab with State=On + Tab label on non-tab feature", function () {
      var issues = validate.findUnmutedChrome(
        fixture({
          content: [
            {
              type: "INSTANCE",
              ref: "fmTab",
              variant: "State=On",
              props: { "Tab label": "Overview" },
            },
          ],
        }),
      );
      assert.strictEqual(issues.length, 1);
      assert.strictEqual(issues[0].ref, "fmTab");
    });

    it("does NOT flag fmTab with State=Placeholder", function () {
      var issues = validate.findUnmutedChrome(
        fixture({
          content: [
            {
              type: "INSTANCE",
              ref: "fmTab",
              variant: "State=Placeholder",
              props: {},
            },
          ],
        }),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("ignores non-chrome refs (fmButton, fmInput)", function () {
      var issues = validate.findUnmutedChrome(
        fixture({
          content: [
            {
              type: "INSTANCE",
              ref: "fmButton",
              variant: "Type=Primary",
              props: { Label: "Save" },
            },
          ],
        }),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("recurses into deeply nested chrome instances", function () {
      var issues = validate.findUnmutedChrome(
        fixture({
          content: [
            {
              type: "FRAME",
              children: [
                {
                  type: "FRAME",
                  children: [
                    {
                      type: "INSTANCE",
                      ref: "fmNavItem",
                      variant: "State=Off",
                      props: { Label: "Reports" },
                    },
                  ],
                },
              ],
            },
          ],
        }),
      );
      assert.strictEqual(issues.length, 1);
    });

    it("supports hash-suffixed prop keys (Label#1463:4)", function () {
      var issues = validate.findUnmutedChrome(
        fixture({
          content: [
            {
              type: "INSTANCE",
              ref: "fmNavItem",
              variant: "State=Off",
              props: { "Label#1463:4": "Workspaces" },
            },
          ],
        }),
      );
      assert.strictEqual(issues.length, 1);
      assert.strictEqual(issues[0].value, "Workspaces");
    });

    it("severity is warning in validate() output", function () {
      var data = fixture({
        content: [
          {
            type: "INSTANCE",
            ref: "fmNavItem",
            variant: "State=On",
            props: { Label: "Catalog" },
          },
        ],
      });
      var result = validate.validate(data);
      var unmuted = result.findings.filter(function (f) {
        return f.kind === "unmuted-chrome";
      });
      assert.strictEqual(unmuted.length, 1);
      assert.strictEqual(unmuted[0].severity, "warning");
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

  describe("validate() placeholder-text findings", function () {
    it("flags 'Page Title' in pageHeader.title", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1",
            pageHeader: { title: "Page Title" },
            content: [],
          },
        ],
      };
      var findings = validate.validate(data).findings.filter(function (f) {
        return f.kind === "placeholder-text";
      });
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].severity, "error");
      assert.match(findings[0].path, /screens\[0\]\.pageHeader\.title/);
    });

    it("flags 'Dropdown text' in INSTANCE props (alongside banned-text)", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1",
            content: [
              {
                type: "INSTANCE",
                ref: "fmDropdown",
                props: { Text: "Dropdown text" },
              },
            ],
          },
        ],
      };
      var findings = validate.validate(data).findings;
      var placeholderFindings = findings.filter(function (f) {
        return f.kind === "placeholder-text";
      });
      assert.ok(placeholderFindings.length >= 1);
    });

    it("does not flag strings inside meta block", function () {
      var data = {
        meta: { feature: "Page Title test" },
        screens: [{ name: "Screen 1", content: [] }],
      };
      var findings = validate.validate(data).findings.filter(function (f) {
        return f.kind === "placeholder-text";
      });
      assert.strictEqual(findings.length, 0);
    });

    it("clean data has no placeholder-text findings", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1",
            pageHeader: { title: "Notification preferences" },
            content: [],
          },
        ],
      };
      var findings = validate.validate(data).findings.filter(function (f) {
        return f.kind === "placeholder-text";
      });
      assert.strictEqual(findings.length, 0);
    });
  });

  describe("validate() INSTANCE-level findings", function () {
    it("flags missing-required-override when fmPageHeader title is omitted", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1",
            content: [
              {
                type: "INSTANCE",
                ref: "fmPageHeader",
                props: {},
              },
            ],
          },
        ],
      };
      var findings = validate.validate(data).findings.filter(function (f) {
        return f.kind === "missing-required-override";
      });
      assert.ok(
        findings.length >= 1,
        "expected at least one missing-required-override finding",
      );
      assert.strictEqual(findings[0].severity, "error");
    });

    it("flags unknown-component for bogus ref", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1",
            content: [
              { type: "INSTANCE", ref: "fmTotallyNotAComponent", props: {} },
            ],
          },
        ],
      };
      var findings = validate.validate(data).findings.filter(function (f) {
        return f.kind === "unknown-component";
      });
      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].severity, "error");
    });

    it("does not flag missing-required-override when all required props are provided", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1",
            content: [
              {
                type: "INSTANCE",
                ref: "fmPageHeader",
                props: {
                  "Title#979:22": "Notification preferences",
                  "Subtitle#979:23": "Manage your alert subscriptions",
                },
              },
            ],
          },
        ],
      };
      var findings = validate.validate(data).findings.filter(function (f) {
        return f.kind === "missing-required-override";
      });
      assert.strictEqual(findings.length, 0);
    });
  });

  describe("validate() default-true-boolean-unset findings", function () {
    it("warns when fmButton default-true booleans are unset", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1",
            content: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                // FM Button has default-true booleans (icon-show toggles).
                // We provide the required Label override but no boolean overrides.
                props: { "Label#1411:32": "Save" },
              },
            ],
          },
        ],
      };
      var findings = validate.validate(data).findings.filter(function (f) {
        return f.kind === "default-true-boolean-unset";
      });
      assert.ok(
        findings.length >= 1,
        "expected at least one default-true-boolean-unset",
      );
      assert.strictEqual(findings[0].severity, "warning");
    });

    it("does not warn when default-true booleans are explicitly set", function () {
      // We need to set ALL default-true booleans explicitly (true OR false) to suppress
      // all warnings. Use the actual prop names from the registry.
      var booleanProps = {};
      // Read registry to get default-true boolean names dynamically
      var registry = require(path.join(PLUGIN_ROOT, "docs", "fmkit.json"));
      var fmButton = registry.components["fm-button"];
      var props = fmButton.properties;
      var keys = Object.keys(props);
      for (var i = 0; i < keys.length; i++) {
        if (
          props[keys[i]].type === "BOOLEAN" &&
          props[keys[i]].default === true
        ) {
          booleanProps[keys[i]] = false; // explicitly hide
        }
      }
      booleanProps["Label#1411:32"] = "Save"; // required Label override

      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "Screen 1",
            content: [
              { type: "INSTANCE", ref: "fmButton", props: booleanProps },
            ],
          },
        ],
      };
      var findings = validate.validate(data).findings.filter(function (f) {
        return f.kind === "default-true-boolean-unset";
      });
      assert.strictEqual(findings.length, 0);
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
      assert.strictEqual(
        result.status,
        0,
        "expected exit 0, got " + result.status + ": " + result.stderr,
      );
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
      assert.strictEqual(
        result.status,
        1,
        "expected exit 1, got " + result.status,
      );
    });
  });
});
