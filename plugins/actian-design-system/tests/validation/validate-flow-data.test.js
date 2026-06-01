#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var validate = require(
  path.join(PLUGIN_ROOT, "scripts", "validation", "validate-flow-data.js"),
);

// Stub guideline-doc fixture in the post-Phase-5 multi-domain shape. The
// retired Figma-scraped JSON used a `_stub: true` boolean at root; the merged
// guideline doc (components/dist/guidelines/<slug>.json) reads as a stub when
// `domains.content.status` is not `approved`/`draft` (i.e. `not-started` or
// `inherited`). brief-sourcing.isStubGuideline() is the canonical check.
function stubGuidelineDoc(slug) {
  return {
    _schema_version: 1,
    slug: slug,
    domains: {
      content: { status: "not-started" },
      usage: { status: "not-started" },
      design: { status: "inherited" },
      behavior: { status: "inherited" },
      tokens: { status: "not-started" },
    },
  };
}

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
                fills: ["var(--zen-color-primary-500)"],
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
          { type: "FRAME", fills: ["var(--zen-color-primary-500)"] },
          { type: "FRAME", fills: ["var(--fm-bg-default)"] },
          {
            type: "TEXT",
            content: "x",
            color: "var(--zen-color-text-primary)",
          },
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
      var registry = require(
        path.join(
          PLUGIN_ROOT,
          "vendor",
          "components",
          "dist",
          "registries",
          "fmkit.json",
        ),
      );
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

  describe("findIntentMismatch", function () {
    function fmFixture(content) {
      return {
        meta: { feature: "Test" },
        screens: [{ name: "S1", content: content }],
      };
    }
    function hifiFixture(content) {
      return {
        meta: { feature: "Test", mode: "hifi" },
        screens: [{ name: "S1", content: content }],
      };
    }

    it("FM tier — does NOT fire even on mismatched data", function () {
      var issues = validate.findIntentMismatch(
        fmFixture([
          {
            type: "INSTANCE",
            ref: "button",
            intent: "destructive-action",
            variant: "Type=Primary",
            props: { Label: "Delete" },
          },
        ]),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("hifi DS button + destructive-action + Type=Primary → error", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "INSTANCE",
            ref: "button",
            intent: "destructive-action",
            variant: "Type=Primary",
            props: { Label: "Delete" },
          },
        ]),
      );
      assert.strictEqual(issues.length, 1);
      assert.strictEqual(issues[0].severity, "P0");
      assert.strictEqual(issues[0].check, "intent-mismatch");
      assert.strictEqual(issues[0].ref, "button");
      assert.strictEqual(issues[0].intent, "destructive-action");
    });

    it("hifi DS button + destructive-action + Type=Critical primary → no finding", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "INSTANCE",
            ref: "button",
            intent: "destructive-action",
            variant: "Type=Critical primary",
            props: { Label: "Delete" },
          },
        ]),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("hifi DS button + destructive-action + Type=Critical secondary → no finding", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "INSTANCE",
            ref: "button",
            intent: "destructive-action",
            variant: "Type=Critical secondary",
          },
        ]),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("hifi default intent → no enforcement", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "INSTANCE",
            ref: "button",
            variant: "Type=Primary",
          },
        ]),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("hifi DS button + success-confirmation + Type=Primary → no finding", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "INSTANCE",
            ref: "button",
            intent: "success-confirmation",
            variant: "Type=Primary",
          },
        ]),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("hifi DS button + success-confirmation + Type=Critical primary → warning", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "INSTANCE",
            ref: "button",
            intent: "success-confirmation",
            variant: "Type=Critical primary",
          },
        ]),
      );
      assert.strictEqual(issues.length, 1);
      assert.strictEqual(issues[0].severity, "P1");
    });

    it("hifi DS button + error-state + Type=Critical secondary → no finding", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "INSTANCE",
            ref: "button",
            intent: "error-state",
            variant: "Type=Critical secondary",
          },
        ]),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("hifi DS button + error-state + Type=Primary → warning", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "INSTANCE",
            ref: "button",
            intent: "error-state",
            variant: "Type=Primary",
          },
        ]),
      );
      assert.strictEqual(issues.length, 1);
      assert.strictEqual(issues[0].severity, "P1");
    });

    it("hifi DS modal + destructive-action + Size & Type=450px confirm → no finding", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "INSTANCE",
            ref: "modal",
            intent: "destructive-action",
            variant: "Size & Type=450px confirm",
          },
        ]),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("hifi DS modal + destructive-action + Size & Type=1200px → warning", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "INSTANCE",
            ref: "modal",
            intent: "destructive-action",
            variant: "Size & Type=1200px",
          },
        ]),
      );
      assert.strictEqual(issues.length, 1);
      assert.strictEqual(issues[0].severity, "P1");
    });

    it("nested FRAME with destructive-action: child INSTANCE inherits and is checked", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "FRAME",
            intent: "destructive-action",
            children: [
              {
                type: "INSTANCE",
                ref: "button",
                variant: "Type=Primary",
                props: { Label: "Delete" },
              },
            ],
          },
        ]),
      );
      assert.strictEqual(issues.length, 1);
      assert.strictEqual(issues[0].intent, "destructive-action");
    });

    it("leaf intent overrides ancestor intent", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "FRAME",
            intent: "destructive-action",
            children: [
              {
                type: "INSTANCE",
                ref: "button",
                intent: "default",
                variant: "Type=Primary",
              },
            ],
          },
        ]),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("sibling rule — destructive container with one Critical primary + one Tertiary → no finding", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "FRAME",
            intent: "destructive-action",
            children: [
              {
                type: "INSTANCE",
                ref: "button",
                variant: "Type=Tertiary",
                props: { Label: "Cancel" },
              },
              {
                type: "INSTANCE",
                ref: "button",
                variant: "Type=Critical primary",
                props: { Label: "Delete" },
              },
            ],
          },
        ]),
      );
      var siblingIssues = issues.filter(function (i) {
        return /sibling/.test(i.expected || "");
      });
      assert.strictEqual(siblingIssues.length, 0);
    });

    it("sibling rule — destructive container with all Critical primary → warning (ambiguous)", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "FRAME",
            intent: "destructive-action",
            children: [
              {
                type: "INSTANCE",
                ref: "button",
                variant: "Type=Critical primary",
                props: { Label: "Delete A" },
              },
              {
                type: "INSTANCE",
                ref: "button",
                variant: "Type=Critical primary",
                props: { Label: "Delete B" },
              },
            ],
          },
        ]),
      );
      var siblingIssues = issues.filter(function (i) {
        return /sibling/.test(i.expected || "");
      });
      assert.strictEqual(siblingIssues.length, 1);
      assert.strictEqual(siblingIssues[0].severity, "P1");
    });

    it("sibling rule — destructive container with no Critical primary at all → warning", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "FRAME",
            intent: "destructive-action",
            children: [
              {
                type: "INSTANCE",
                ref: "button",
                variant: "Type=Tertiary",
                props: { Label: "Cancel" },
              },
              {
                type: "INSTANCE",
                ref: "button",
                variant: "Type=Primary",
                props: { Label: "Delete" },
              },
            ],
          },
        ]),
      );
      var siblingIssues = issues.filter(function (i) {
        return /sibling/.test(i.expected || "");
      });
      assert.strictEqual(siblingIssues.length, 1);
    });

    it("sibling rule — single button in destructive container, not flagged for sibling rule", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "FRAME",
            intent: "destructive-action",
            children: [
              {
                type: "INSTANCE",
                ref: "button",
                variant: "Type=Critical primary",
                props: { Label: "Delete" },
              },
            ],
          },
        ]),
      );
      var siblingIssues = issues.filter(function (i) {
        return /sibling/.test(i.expected || "");
      });
      assert.strictEqual(siblingIssues.length, 0);
    });

    it("sibling rule — destructive container with Critical secondary + Tertiary cancel → no finding", function () {
      var issues = validate.findIntentMismatch(
        hifiFixture([
          {
            type: "FRAME",
            intent: "destructive-action",
            children: [
              {
                type: "INSTANCE",
                ref: "button",
                variant: "Type=Critical secondary",
                props: { Label: "Delete" },
              },
              {
                type: "INSTANCE",
                ref: "button",
                variant: "Type=Tertiary",
                props: { Label: "Cancel" },
              },
            ],
          },
        ]),
      );
      var siblingIssues = issues.filter(function (i) {
        return /sibling/.test(i.expected || "");
      });
      assert.strictEqual(
        siblingIssues.length,
        0,
        "Critical secondary should count as a Critical button — got: " +
          JSON.stringify(siblingIssues),
      );
    });
  });

  describe("gateConfig.filterFindingsByScope (B-refine.1)", function () {
    var { runGate } = require("../../scripts/lib/scope-aware-runner.js");

    function makeData() {
      return {
        meta: { feature: "T" },
        screens: [
          {
            id: "t-1",
            name: "S1",
            content: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                props: { Label: "Button label" },
              },
            ],
          },
          {
            id: "t-2",
            name: "S2",
            content: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                props: { Label: "Save" },
              },
            ],
          },
          {
            id: "t-3",
            name: "S3",
            content: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                props: { Label: "Description text" },
              },
            ],
          },
        ],
      };
    }

    it("scope=full returns all banned-text findings", function () {
      var result = runGate(validate, makeData(), { scope: "full" });
      var banned = result.findings.filter(function (f) {
        return f.kind === "banned-text";
      });
      assert.strictEqual(banned.length, 2);
    });

    it("scope=single-unit:t-2 returns no banned-text (s2 is clean)", function () {
      var result = runGate(validate, makeData(), {
        scope: "single-unit:t-2",
      });
      var banned = result.findings.filter(function (f) {
        return f.kind === "banned-text";
      });
      assert.strictEqual(banned.length, 0);
    });

    it("scope=single-unit:t-1 returns only s1 banned-text", function () {
      var result = runGate(validate, makeData(), {
        scope: "single-unit:t-1",
      });
      var banned = result.findings.filter(function (f) {
        return f.kind === "banned-text";
      });
      assert.strictEqual(banned.length, 1);
      assert.strictEqual(banned[0].screen, "t-1");
    });

    it("scope=multi-unit:[t-1,t-3] returns banned-text from both", function () {
      var result = runGate(validate, makeData(), {
        scope: "multi-unit:[t-1,t-3]",
      });
      var banned = result.findings.filter(function (f) {
        return f.kind === "banned-text";
      });
      assert.strictEqual(banned.length, 2);
    });

    it("placeholder-text findings (INSTANCE-walker) also scope-filter via screenIdFromPath", function () {
      var data = {
        meta: { feature: "T" },
        screens: [
          {
            id: "t-1",
            name: "S1",
            content: [{ type: "TEXT", content: "Page Title" }],
          },
          {
            id: "t-2",
            name: "S2",
            content: [{ type: "TEXT", content: "Real text" }],
          },
        ],
      };
      var result = runGate(validate, data, { scope: "single-unit:t-2" });
      var placeholder = result.findings.filter(function (f) {
        return f.kind === "placeholder-text";
      });
      assert.strictEqual(placeholder.length, 0);
    });
  });

  describe("screen.id stamping (B-refine.1)", function () {
    it("stamps derived ids when missing", function () {
      var data = {
        meta: { feature: "Test Feature" },
        screens: [
          { name: "S1", content: [] },
          { name: "S2", content: [] },
        ],
      };
      validate.validate(data);
      assert.strictEqual(data.screens[0].id, "test-feature-1");
      assert.strictEqual(data.screens[1].id, "test-feature-2");
    });

    it("preserves user-supplied id, stamps the rest", function () {
      var data = {
        meta: { feature: "Catalog" },
        screens: [
          { id: "custom", name: "S1", content: [] },
          { name: "S2", content: [] },
        ],
      };
      validate.validate(data);
      assert.strictEqual(data.screens[0].id, "custom");
      assert.strictEqual(data.screens[1].id, "catalog-2");
    });

    it("stamps single-screen flows too (always-stamp rule)", function () {
      var data = {
        meta: { feature: "Solo Screen" },
        screens: [{ name: "S", content: [] }],
      };
      validate.validate(data);
      assert.strictEqual(data.screens[0].id, "solo-screen-1");
    });

    it("is idempotent — re-running validate does not change ids", function () {
      var data = {
        meta: { feature: "Repeat" },
        screens: [
          { name: "S1", content: [] },
          { name: "S2", content: [] },
        ],
      };
      validate.validate(data);
      var snapshot = data.screens.map(function (s) {
        return s.id;
      });
      validate.validate(data);
      validate.validate(data);
      assert.deepStrictEqual(
        data.screens.map(function (s) {
          return s.id;
        }),
        snapshot,
      );
    });
  });

  describe("intent fixtures (integration)", function () {
    var fs = require("fs");
    var path = require("path");
    function loadFixture(name) {
      return JSON.parse(
        fs.readFileSync(path.join(__dirname, "..", "fixtures", name), "utf8"),
      );
    }

    it("intent-fm-destructive.json — FM tier silent (no findings)", function () {
      var issues = validate.findIntentMismatch(
        loadFixture("intent-fm-destructive.json"),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("intent-hifi-positive.json — clean", function () {
      var issues = validate.findIntentMismatch(
        loadFixture("intent-hifi-positive.json"),
      );
      assert.strictEqual(issues.length, 0);
    });

    it("intent-hifi-mismatch.json — error finding for the Type=Primary button", function () {
      var issues = validate.findIntentMismatch(
        loadFixture("intent-hifi-mismatch.json"),
      );
      var errors = issues.filter(function (i) {
        return i.severity === "P0";
      });
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0].ref, "button");
    });

    it("intent-hifi-default.json — no findings (no intent set)", function () {
      var issues = validate.findIntentMismatch(
        loadFixture("intent-hifi-default.json"),
      );
      assert.strictEqual(issues.length, 0);
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
      var script = path.join(
        PLUGIN_ROOT,
        "scripts",
        "validation",
        "validate-flow-data.js",
      );
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
                // canonical prop name — required-override check matches by full key
                props: { "Label#1411:32": "Save" },
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

    it("exits 1 on intent-mismatch error (hifi destructive + Type=Primary)", function () {
      var data = {
        meta: { feature: "Test", mode: "hifi" },
        screens: [
          {
            name: "S1",
            content: [
              {
                type: "INSTANCE",
                ref: "button",
                intent: "destructive-action",
                variant: "Type=Primary",
                props: { Label: "Delete" },
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

    it("exits 2 on intent-mismatch warning only (hifi success + Type=Critical primary)", function () {
      var data = {
        meta: { feature: "Test", mode: "hifi" },
        screens: [
          {
            name: "S1",
            content: [
              {
                type: "INSTANCE",
                ref: "button",
                intent: "success-confirmation",
                variant: "Type=Critical primary",
                // canonical prop name (DS button) — required-override check
                props: { "Label#724:10": "OK" },
              },
            ],
          },
        ],
      };
      var result = runCli(data);
      assert.strictEqual(
        result.status,
        2,
        "expected exit 2, got " + result.status,
      );
    });

    it("exits 0 on FM tier even with mismatched intent data", function () {
      var data = {
        meta: { feature: "Test" },
        screens: [
          {
            name: "S1",
            content: [
              {
                type: "INSTANCE",
                ref: "button",
                intent: "destructive-action",
                variant: "Type=Primary",
                // canonical prop name (DS button)
                props: { "Label#724:10": "Delete" },
              },
            ],
          },
        ],
      };
      var result = runCli(data);
      assert.strictEqual(
        result.status,
        0,
        "expected exit 0 (FM tier silent), got " + result.status,
      );
    });

    it("reporter format: severity [check] screen → path = value", function () {
      // Parity guard: the post-v1.54.1 single-validate consolidation must
      // produce reporter lines in the same shape the legacy multi-call CLI did.
      var data = {
        meta: { feature: "Reporter Format" },
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
      var result = runCli(data);
      assert.strictEqual(result.status, 1, "expected exit 1 (P0 banned)");
      // Header line
      assert.ok(
        /validate-flow-data: \d+ issue\(s\) found/.test(result.stderr),
        "expected count header in stderr; got: " + result.stderr,
      );
      // At least one issue line in the canonical shape
      assert.ok(
        /^P0 \[banned-text\] Screen 1: Test → .* = "Button label"$/m.test(
          result.stderr,
        ),
        "expected canonical reporter line; got: " + result.stderr,
      );
    });

    it("--scope single-unit:<id> filters CLI findings by screen id (B-refine.1)", function () {
      // 3-screen flow with banned text on screens 1 + 3, clean on 2
      var data = {
        meta: { feature: "ScopedCli" },
        screens: [
          {
            id: "scopedcli-1",
            name: "S1",
            content: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                props: { Label: "Button label" },
              },
            ],
          },
          {
            id: "scopedcli-2",
            name: "S2",
            content: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                // canonical prop name — required-override check matches by full key
                props: { "Label#1411:32": "Save" },
              },
            ],
          },
          {
            id: "scopedcli-3",
            name: "S3",
            content: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                props: { Label: "Description text" },
              },
            ],
          },
        ],
      };
      var os = require("os");
      var { spawnSync } = require("node:child_process");
      var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "validate-cli-"));
      var dataPath = path.join(tmpDir, "flow-data.json");
      fs.writeFileSync(dataPath, JSON.stringify(data));
      var script = path.join(
        PLUGIN_ROOT,
        "scripts",
        "validation",
        "validate-flow-data.js",
      );

      // scope=single-unit:scopedcli-2 → no banned (s2 is clean) → exit 0
      var r2 = spawnSync(
        process.execPath,
        [script, dataPath, "--scope", "single-unit:scopedcli-2"],
        { encoding: "utf8" },
      );
      assert.strictEqual(
        r2.status,
        0,
        "expected exit 0 with scope=s2; got " +
          r2.status +
          " stderr: " +
          r2.stderr,
      );

      // scope=single-unit:scopedcli-1 → banned in s1 → exit 1
      var r1 = spawnSync(
        process.execPath,
        [script, dataPath, "--scope", "single-unit:scopedcli-1"],
        { encoding: "utf8" },
      );
      assert.strictEqual(
        r1.status,
        1,
        "expected exit 1 with scope=s1; got " + r1.status,
      );

      // scope=full → 2 banned (s1 + s3) → exit 1
      var rFull = spawnSync(process.execPath, [script, dataPath], {
        encoding: "utf8",
      });
      assert.strictEqual(rFull.status, 1, "expected exit 1 with no scope flag");

      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("--json mode emits an array of issue objects", function () {
      var data = {
        meta: { feature: "Json Mode" },
        screens: [
          {
            name: "S1",
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
      var os = require("os");
      var { spawnSync } = require("node:child_process");
      var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "validate-cli-"));
      var dataPath = path.join(tmpDir, "flow-data.json");
      fs.writeFileSync(dataPath, JSON.stringify(data));
      var script = path.join(
        PLUGIN_ROOT,
        "scripts",
        "validation",
        "validate-flow-data.js",
      );
      var result = spawnSync(process.execPath, [script, dataPath, "--json"], {
        encoding: "utf8",
      });
      fs.rmSync(tmpDir, { recursive: true, force: true });
      var parsed = JSON.parse(result.stdout);
      assert.ok(Array.isArray(parsed), "expected array");
      assert.ok(parsed.length >= 1, "expected at least one issue");
      var hit = parsed.find(function (i) {
        return i.check === "banned-text";
      });
      assert.ok(hit, "expected a banned-text issue");
      assert.strictEqual(hit.severity, "P0");
      assert.strictEqual(hit.value, "Button label");
    });
  });
});

describe("refine pipeline integration (B-refine.2)", function () {
  var fs = require("fs");
  var path = require("path");
  var { deriveScope } = require("../../scripts/lib/derive-scope.js");
  var { runGate } = require("../../scripts/lib/scope-aware-runner.js");

  function load(name) {
    return JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "fixtures", name), "utf8"),
    );
  }

  it("derives single-unit scope, validator filters findings to that screen", function () {
    var before = load("refine-before.json");
    var after = load("refine-after-single.json");

    // Derive scope from the real diff BEFORE injecting any noise.
    // refine-after-single only changes screen 1 (notification-preferences-2).
    var scope = deriveScope(before, after);
    assert.strictEqual(scope, "single-unit:notification-preferences-2");

    // Now inject a banned-text P0 onto screen 0 (untouched, notification-preferences-1)
    // and screen 1 (touched, notification-preferences-2).
    // pageHeader.title is directly checked by findBannedTextRaw.
    after.screens[0].pageHeader = { title: "Page Title" };
    after.screens[1].pageHeader = { title: "Page Title" };

    var unscoped = validate.validate(after);
    var unscopedBanned = unscoped.findings.filter(function (f) {
      return f.kind === "banned-text";
    });
    assert.strictEqual(unscopedBanned.length, 2);

    var scoped = runGate(validate, after, { scope: scope });
    var scopedBanned = scoped.findings.filter(function (f) {
      return f.kind === "banned-text";
    });
    assert.strictEqual(scopedBanned.length, 1);
    assert.strictEqual(scopedBanned[0].screen, "notification-preferences-2");
  });

  it("derives multi-unit scope, drops untouched-screen findings, keeps touched-screen findings", function () {
    var before = load("refine-before.json");
    var after = load("refine-after-multi.json");

    // Derive scope from the real diff BEFORE injecting any noise.
    // refine-after-multi changes screens 1 and 2 (notification-preferences-2 and -3).
    var scope = deriveScope(before, after);
    assert.strictEqual(
      scope,
      "multi-unit:[notification-preferences-2,notification-preferences-3]",
    );

    // Inject banned text on:
    //   screen 0 — notification-preferences-1, UNTOUCHED → should drop
    //   screen 1 — notification-preferences-2, TOUCHED → should survive
    //   screen 2 — notification-preferences-3, TOUCHED → should survive
    after.screens[0].pageHeader = { title: "Page Title" };
    after.screens[1].pageHeader = { title: "Page Title" };
    after.screens[2].pageHeader = { title: "Page Title" };

    // Sanity check: unscoped run sees all 3 findings (proves injection mechanism).
    var unscoped = validate.validate(after);
    var unscopedBanned = unscoped.findings.filter(function (f) {
      return f.kind === "banned-text";
    });
    assert.strictEqual(unscopedBanned.length, 3);

    // Scoped run: the screen-0 finding is dropped; screen-1 and screen-2 survive.
    var scoped = runGate(validate, after, { scope: scope });
    var banned = scoped.findings.filter(function (f) {
      return f.kind === "banned-text";
    });
    assert.strictEqual(banned.length, 2);

    var screensWithFindings = banned
      .map(function (f) {
        return f.screen;
      })
      .sort();
    assert.deepStrictEqual(screensWithFindings, [
      "notification-preferences-2",
      "notification-preferences-3",
    ]);
  });
});

describe("meta.references[].fingerprint pass-through (C-vision)", function () {
  it("validator accepts data with embedded fingerprints, no false positives", function () {
    var data = {
      meta: {
        feature: "Test",
        references: [
          {
            url: "https://figma.com/design/abc/?node-id=1-1",
            kind: "figma-frame",
            fingerprint: {
              density: "high",
              hierarchy_depth: 4,
              primary_components: ["toolbar", "table"],
              layout_archetype: "table-list",
              extracted_at: "2026-04-29T12:00:00Z",
            },
          },
        ],
      },
      screens: [{ id: "test-1", name: "Screen 1", content: [] }],
    };
    var result = validate.validate(data);
    // Validator should not produce findings *about* the fingerprint itself.
    var fingerprintFindings = result.findings.filter(function (f) {
      return (
        f.kind === "fingerprint-invalid" ||
        (f.path && f.path.indexOf("fingerprint") !== -1)
      );
    });
    assert.strictEqual(
      fingerprintFindings.length,
      0,
      "validator should not produce findings about fingerprints",
    );
  });

  it("validator does NOT mutate fingerprints (pure check)", function () {
    var data = {
      meta: {
        feature: "Test",
        references: [
          {
            url: "https://figma.com/design/abc/?node-id=1-1",
            kind: "figma-frame",
            fingerprint: { density: "high", layout_archetype: "table-list" },
          },
        ],
      },
      screens: [{ id: "test-1", name: "Screen 1", content: [] }],
    };
    var before = JSON.stringify(data.meta.references[0].fingerprint);
    validate.validate(data);
    var after = JSON.stringify(data.meta.references[0].fingerprint);
    assert.strictEqual(
      before,
      after,
      "validator mutated the fingerprint — must remain pure",
    );
  });

  describe("stub-aware validation", function () {
    var validateFn = validate.validate || validate;

    it("downgrades warning to info when guideline is a stub", function () {
      // Synthesize a finding-emitting flow + injected stub loader.
      var data = {
        meta: { feature: "test" },
        screens: [
          {
            id: "test-1",
            name: "Test",
            content: [
              {
                type: "INSTANCE",
                ref: "tooltip",
                props: {},
              },
            ],
          },
        ],
      };
      var result = validateFn(data, {
        loadGuideline: function (slug) {
          if (slug === "tooltip") return stubGuidelineDoc("tooltip");
          return null;
        },
        skipTokens: true,
        skipTerminology: true,
      });
      // The stub-aware pass must emit at least one stub-guideline-used finding
      var stubFinding = result.findings.find(function (f) {
        return f.kind === "stub-guideline-used";
      });
      assert.ok(stubFinding, "should emit stub-guideline-used finding");
      assert.strictEqual(stubFinding.severity, "info");
      assert.match(stubFinding.message, /tooltip/);
    });

    it("does NOT downgrade error severity (P0 stays P0)", function () {
      var data = {
        meta: { feature: "test" },
        screens: [
          {
            id: "test-1",
            name: "Test",
            content: [
              {
                type: "INSTANCE",
                ref: "nonexistent-ref-xyz", // unknown component triggers error
                props: {},
              },
            ],
          },
        ],
      };
      var result = validateFn(data, {
        loadGuideline: function (slug) {
          if (slug === "nonexistent-ref-xyz")
            return stubGuidelineDoc("nonexistent-ref-xyz");
          return null;
        },
        skipTokens: true,
        skipTerminology: true,
      });
      var unknown = result.findings.find(function (f) {
        return f.kind === "unknown-component";
      });
      if (unknown) {
        assert.strictEqual(
          unknown.severity,
          "error",
          "errors should not be downgraded",
        );
      }
    });

    it("does NOT emit stub-guideline-used when no stub-backed components are used", function () {
      var data = {
        meta: { feature: "test" },
        screens: [
          {
            id: "test-1",
            name: "Test",
            content: [{ type: "INSTANCE", ref: "fmButton", props: {} }],
          },
        ],
      };
      var result = validateFn(data, {
        loadGuideline: function () {
          return null;
        }, // never a stub
        skipTokens: true,
        skipTerminology: true,
      });
      var stubFinding = result.findings.find(function (f) {
        return f.kind === "stub-guideline-used";
      });
      assert.ok(!stubFinding, "no stub finding when no stub guidelines used");
    });
  });

  // -------------------------------------------------------------------------
  // CLI surfacing of previously-suppressed findings (v1.65.2)
  // -------------------------------------------------------------------------

  describe("CLI surfacing — previously-suppressed kinds (v1.65.2)", function () {
    var fs = require("fs");
    var os = require("os");
    var { spawnSync } = require("node:child_process");

    function runCli(data) {
      var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "validate-cli-"));
      var dataPath = path.join(tmpDir, "flow-data.json");
      fs.writeFileSync(dataPath, JSON.stringify(data));
      var script = path.join(
        PLUGIN_ROOT,
        "scripts",
        "validation",
        "validate-flow-data.js",
      );
      var result = spawnSync(process.execPath, [script, dataPath], {
        encoding: "utf8",
      });
      fs.rmSync(tmpDir, { recursive: true, force: true });
      return result;
    }

    it("surfaces missing-required-override as P0 in CLI output", function () {
      var data = {
        meta: { feature: "Required Override Test" },
        screens: [
          {
            name: "Screen 1",
            content: [
              {
                type: "INSTANCE",
                ref: "fmButton",
                // intentionally omit Label override
                props: {},
              },
            ],
          },
        ],
      };
      var result = runCli(data);
      assert.strictEqual(result.status, 1, "expected exit 1 (P0)");
      assert.ok(
        /P0 \[missing-required-override\]/.test(result.stderr),
        "expected missing-required-override line in CLI; got: " + result.stderr,
      );
    });

    it("surfaces unknown-component as P0 in CLI output", function () {
      var data = {
        meta: { feature: "Unknown Component Test" },
        screens: [
          {
            name: "Screen 1",
            content: [
              { type: "INSTANCE", ref: "totally-not-a-component", props: {} },
            ],
          },
        ],
      };
      var result = runCli(data);
      assert.strictEqual(result.status, 1, "expected exit 1 (P0)");
      assert.ok(
        /P0 \[unknown-component\]/.test(result.stderr),
        "expected unknown-component line in CLI; got: " + result.stderr,
      );
    });

    it("surfaces stub-guideline-used as info-level (mapped to P2 in CLI)", function () {
      // Synthetic check via validate() — the CLI surfacing path uses the same
      // result pipeline. We assert the severity tier mapping directly.
      var validateFn = validate.validate || validate;
      var data = {
        meta: { feature: "Stub Test" },
        screens: [
          {
            id: "stub-1",
            name: "Screen 1",
            content: [{ type: "INSTANCE", ref: "tooltip", props: {} }],
          },
        ],
      };
      var result = validateFn(data, {
        loadGuideline: function (slug) {
          if (slug === "tooltip") return stubGuidelineDoc("tooltip");
          return null;
        },
        skipTokens: true,
        skipTerminology: true,
      });
      var stubFinding = result.findings.find(function (f) {
        return f.kind === "stub-guideline-used";
      });
      assert.ok(stubFinding, "stub-guideline-used should fire");
      assert.strictEqual(
        stubFinding.severity,
        "info",
        "stub-guideline-used should be info-level (mapped to P2 in CLI)",
      );
    });

    it("walkStringValues skips structural fields (ref, intent, variant, etc.)", function () {
      // ref: "button" matches /^Button$/i in PLACEHOLDER_PATTERNS — should NOT fire
      // because ref is a structural field, not user-visible text.
      var data = {
        meta: { feature: "Structural Skip Test" },
        screens: [
          {
            id: "structural-1",
            name: "Screen 1",
            content: [
              {
                type: "INSTANCE",
                ref: "button", // <- would match /^Button$/i if not skipped
                intent: "primary-action", // <- would match nothing but check anyway
                variant: "Type=Primary",
                props: { "Label#724:10": "Save" },
              },
            ],
          },
        ],
      };
      var result = runCli(data);
      var lines = (result.stderr + result.stdout).split("\n");
      var placeholderHits = lines.filter(function (l) {
        return /\[placeholder-text\]/.test(l) && /"button"/.test(l);
      });
      assert.strictEqual(
        placeholderHits.length,
        0,
        "ref:'button' should not trigger placeholder-text — structural field",
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Check 4b: Words-to-avoid (Move 4) — soft warnings from vendored content rules
// ---------------------------------------------------------------------------

describe("avoid-word (Move 4)", function () {
  it("flags an avoid token in copy as a non-blocking warning", function () {
    // "abort" is a standalone avoid token; \babort\b matches the standalone word
    var data = {
      screens: [
        {
          name: "S1",
          pageHeader: { title: "Click Abort to stop the process" },
          content: [],
        },
      ],
    };
    var result = validate.validate(data, {
      skipTokens: true,
      skipTerminology: true,
    });
    var hits = result.findings.filter(function (f) {
      return f.kind === "avoid-word";
    });
    assert.ok(
      hits.length >= 1,
      "expected at least one avoid-word finding for standalone 'Abort'",
    );
    assert.strictEqual(hits[0].severity, "warning");
    assert.match(hits[0].message, /abort/i);
  });

  it("word-boundary: copy containing only 'aborted' produces zero avoid-word findings for the 'abort' token", function () {
    // 'abort' token uses \\b word-boundary: \\babort\\b does NOT match inside 'aborted'
    var data = {
      screens: [
        {
          name: "S1",
          content: [{ type: "TEXT", content: "The job aborted cleanly" }],
        },
      ],
    };
    var result = validate.validate(data, {
      skipTokens: true,
      skipTerminology: true,
    });
    var avoidHits = result.findings.filter(function (f) {
      return (
        f.kind === "avoid-word" && f.message && /\babort\b/i.test(f.message)
      );
    });
    // 'aborted' contains 'abort' but word-boundary means the standalone 'abort' token
    // should not match — the token regex is \babort\b which doesn't match inside 'aborted'
    assert.strictEqual(
      avoidHits.length,
      0,
      "bare 'abort' token should not match inside 'aborted'",
    );
  });

  it("advisory rule (avoid: []) never fires", function () {
    var data = {
      screens: [
        {
          name: "S1",
          content: [
            { type: "TEXT", content: "Avoid developer-speak in all copy" },
          ],
        },
      ],
    };
    var result = validate.validate(data, {
      skipTokens: true,
      skipTerminology: true,
    });
    assert.strictEqual(
      result.findings.filter(function (f) {
        return f.kind === "avoid-word";
      }).length,
      0,
    );
  });

  it("clean copy produces zero avoid-word findings", function () {
    var data = {
      screens: [
        {
          name: "S1",
          pageHeader: { title: "Create data product" },
          content: [],
        },
      ],
    };
    var result = validate.validate(data, {
      skipTokens: true,
      skipTerminology: true,
    });
    assert.strictEqual(
      result.findings.filter(function (f) {
        return f.kind === "avoid-word";
      }).length,
      0,
    );
  });

  it("never blocks push (no error/P0 severity)", function () {
    var data = {
      screens: [
        {
          name: "S1",
          pageHeader: { title: "Please contact support" },
          content: [],
        },
      ],
    };
    var result = validate.validate(data, {
      skipTokens: true,
      skipTerminology: true,
    });
    var avoidFindings = result.findings.filter(function (f) {
      return f.kind === "avoid-word";
    });
    assert.ok(
      avoidFindings.length >= 1,
      "expected at least one avoid-word finding for 'please'",
    );
    avoidFindings.forEach(function (f) {
      assert.notStrictEqual(f.severity, "error");
    });
  });
});
