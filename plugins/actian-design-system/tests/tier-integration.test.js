#!/usr/bin/env node
"use strict";

/**
 * tier-integration.test.js — End-to-end tier metadata flow:
 * fixture → validator → buildTierSummary → flow-renderer screen() badge
 *
 * Run: source scripts/lib/resolve-node.sh && "$NODE_BIN" tests/tier-integration.test.js
 */

const fs = require("fs");
const path = require("path");

const { validate } = require("../scripts/validation/validate-flow-data.js");
const sc = require("../scripts/lib/shared-constants.js");

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    process.stdout.write("  ✓ " + message + "\n");
  } else {
    failed++;
    failures.push(message);
    process.stdout.write("  ✗ FAIL: " + message + "\n");
  }
}

function assertContains(str, substr, message) {
  assert(
    typeof str === "string" && str.indexOf(substr) !== -1,
    message + " (expected to contain: " + JSON.stringify(substr) + ")",
  );
}

function section(name) {
  process.stdout.write("\n" + name + "\n");
}

function loadFixture(name) {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8"),
  );
}

// ---------------------------------------------------------------------------
// Load flow-renderer.js in a simulated browser environment
// (mirrors tests/flow-renderer.test.js harness)
// ---------------------------------------------------------------------------

const RENDERER_PATH = path.join(
  __dirname,
  "../scripts/html-renderers/flow-renderer.js",
);
const rendererCode = fs.readFileSync(RENDERER_PATH, "utf8");

const mockDocument = {
  _listeners: {},
  addEventListener: function (event, fn) {
    this._listeners[event] = fn;
  },
  getElementById: function () {
    return null;
  },
};

const fmHtmlMap = require("../scripts/html-renderers/fm-html-map");
const mockWindow = { fmHtmlMap: fmHtmlMap };

new Function("window", "document", rendererCode)(mockWindow, mockDocument);
const { screen } = mockWindow._testExports || {};
assert(typeof screen === "function", "flow-renderer screen() loaded");

const FIXTURES = [
  "tier-1-recognized.json",
  "tier-2-adapted.json",
  "tier-3-improvised.json",
];

// ---------------------------------------------------------------------------
section("Validator — fixtures pass clean (no error-severity findings)");

for (const name of FIXTURES) {
  const data = loadFixture(name);
  const r = validate(data);
  const errors = (r.findings || []).filter((f) => f.severity === "error");
  assert(
    errors.length === 0,
    name +
      " produces zero error findings (got " +
      errors.length +
      ": " +
      JSON.stringify(errors) +
      ")",
  );
}

// ---------------------------------------------------------------------------
section(
  "Validator — tier-3 without justification produces missing-justification error",
);

{
  const data = loadFixture("tier-3-improvised.json");
  delete data.screens[0].justification;
  const r = validate(data);
  const missing = (r.findings || []).filter(
    (f) => f.kind === "missing-justification",
  );
  assert(
    missing.length === 1,
    "exactly one missing-justification finding (got " + missing.length + ")",
  );
  assert(
    missing[0] && missing[0].severity === "error",
    "missing-justification has severity=error",
  );
}

section(
  "Validator — tier-2 without justification produces missing-justification error",
);

{
  const data = loadFixture("tier-2-adapted.json");
  delete data.screens[0].justification;
  const r = validate(data);
  const missing = (r.findings || []).filter(
    (f) => f.kind === "missing-justification",
  );
  assert(
    missing.length === 1,
    "tier-2 missing-justification finding present",
  );
}

// ---------------------------------------------------------------------------
section(
  "buildTierSummary — produces TEXT node with tier rollup for each fixture",
);

for (const name of FIXTURES) {
  const data = loadFixture(name);
  const node = sc.buildTierSummary(data.screens);
  assert(node && node.type === "TEXT", name + " produces a TEXT node");
  assertContains(node.text, "Tiers:", name + " text starts with Tiers: roll-up");
  assertContains(
    node.text,
    data.screens[0].name,
    name + " text includes screen name",
  );
}

section("buildTierSummary — tier-1 fixture omits Justifications block");
{
  const data = loadFixture("tier-1-recognized.json");
  const node = sc.buildTierSummary(data.screens);
  assert(
    node.text.indexOf("Justifications:") === -1,
    "tier-1-only fixture has no Justifications block",
  );
}

section("buildTierSummary — tier-3 fixture includes Justifications block");
{
  const data = loadFixture("tier-3-improvised.json");
  const node = sc.buildTierSummary(data.screens);
  assertContains(
    node.text,
    "Justifications:",
    "tier-3 fixture has Justifications: block",
  );
  assertContains(
    node.text,
    "auth-block-with-cta",
    "tier-3 justification text included",
  );
}

// ---------------------------------------------------------------------------
section("flow-renderer screen() — emits tier-badge for each fixture");

for (const name of FIXTURES) {
  const data = loadFixture(name);
  const html = screen(data.screens[0]);
  assertContains(html, 'class="tier-badge"', name + " HTML contains tier-badge");
  assertContains(
    html,
    'data-tier="' + data.screens[0].tier + '"',
    name + " HTML carries data-tier attribute",
  );
}

// ---------------------------------------------------------------------------
process.stdout.write("\n---\nPassed: " + passed + "  Failed: " + failed + "\n");
if (failed > 0) {
  process.stdout.write("\nFailures:\n");
  failures.forEach(function (m) {
    process.stdout.write("  - " + m + "\n");
  });
  process.exit(1);
}
process.stdout.write("All integration tests passed.\n");
