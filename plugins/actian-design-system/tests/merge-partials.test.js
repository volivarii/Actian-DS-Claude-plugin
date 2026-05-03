#!/usr/bin/env node
"use strict";

/**
 * merge-partials.test.js — Tests for the merge-partials.js script.
 *
 * Run with: node tests/merge-partials.test.js
 * (from the plugins/actian-design-system directory)
 */

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    process.stdout.write("  \u2713 " + message + "\n");
  } else {
    failed++;
    failures.push(message);
    process.stdout.write("  \u2717 " + message + "\n");
  }
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "..");
const SCRIPT = path.join(ROOT, "scripts", "merge-partials.js");
const TEST_DIR = path.join(__dirname, ".test-partials");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setup() {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

function cleanup() {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

function writePartial(name, data) {
  fs.writeFileSync(path.join(TEST_DIR, name), JSON.stringify(data, null, 2));
}

function runMerge(args, expectFail) {
  const output = path.join(TEST_DIR, "output.json");
  const fullArgs = [SCRIPT, ...args, "--output", output];
  try {
    execFileSync(process.execPath, fullArgs, { stdio: "pipe" });
    if (expectFail) return { exitCode: 0, output: null };
    return { exitCode: 0, data: JSON.parse(fs.readFileSync(output, "utf8")) };
  } catch (err) {
    return { exitCode: err.status || 1, data: null };
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

process.stdout.write("\nmerge-partials.js\n");

// Test 1: brief — merges 3 partials into complete brief-data.json
{
  setup();
  try {
    writePartial("cards-header-anatomy.json", {
      meta: { component: "Button", version: "1.0" },
      card_header: { title: "Button" },
      card_component: { preview: true },
      card_anatomy: { parts: ["root", "label"] },
    });
    writePartial("cards-tokens-usage.json", {
      meta: { component: "Button", version: "1.0" },
      card_tokens: { tokens: [] },
      card_usage: { dos: [], donts: [] },
    });
    writePartial("cards-content-accessibility.json", {
      meta: { component: "Button", version: "1.0" },
      card_content: { guidelines: "" },
      card_accessibility: { role: "button" },
    });

    const result = runMerge(["--type", "brief", "--partials-dir", TEST_DIR]);
    const keys = Object.keys(result.data || {});
    assert(result.exitCode === 0, "brief: exits 0 on valid merge");
    assert(
      keys.length === 8,
      "brief: merges 3 partials into complete brief-data.json (meta + 7 cards = 8 keys)",
    );
    assert(
      keys.includes("meta") &&
        keys.includes("card_header") &&
        keys.includes("card_accessibility"),
      "brief: contains meta, first, and last card keys",
    );
  } finally {
    cleanup();
  }
}

// Test 2: brief — fails when a card key is missing
{
  setup();
  try {
    writePartial("cards-partial.json", {
      meta: { component: "Button" },
      card_header: { title: "Button" },
      card_component: { preview: true },
      // missing card_anatomy through card_accessibility
    });

    const result = runMerge(
      ["--type", "brief", "--partials-dir", TEST_DIR],
      true,
    );
    assert(result.exitCode !== 0, "brief: fails when a card key is missing");
  } finally {
    cleanup();
  }
}

// Test 3: brief — merges partial brief (subset of cards)
{
  setup();
  try {
    writePartial("subset.json", {
      meta: { component: "Button" },
      card_header: { title: "Button" },
      card_usage: { dos: [], donts: [] },
    });

    const result = runMerge([
      "--type",
      "brief",
      "--partials-dir",
      TEST_DIR,
      "--partial",
    ]);
    const keys = Object.keys(result.data || {});
    assert(
      result.exitCode === 0,
      "brief: --partial flag allows subset of cards",
    );
    assert(
      keys.length === 3,
      "brief: merges partial brief (subset of cards) — meta + 2 cards = 3 keys",
    );
  } finally {
    cleanup();
  }
}

// Test 4: flow — merges screen arrays in order
{
  setup();
  try {
    writePartial("flow-part-1.json", {
      meta: { flow: "Login" },
      _index: 0,
      screens: [{ id: "screen-1" }, { id: "screen-2" }],
    });
    writePartial("flow-part-2.json", {
      meta: { flow: "Login" },
      _index: 1,
      screens: [{ id: "screen-3" }, { id: "screen-4" }],
    });

    const result = runMerge(["--type", "flow", "--partials-dir", TEST_DIR]);
    assert(result.exitCode === 0, "flow: exits 0 on valid merge");
    assert(
      result.data && result.data.screens && result.data.screens.length === 4,
      "flow: merges screen arrays in order (4 screens)",
    );
    assert(
      result.data &&
        result.data.screens[0].id === "screen-1" &&
        result.data.screens[3].id === "screen-4",
      "flow: screens concatenated in correct order",
    );
  } finally {
    cleanup();
  }
}

// Test 5: presentation — merges slide arrays in order
{
  setup();
  try {
    writePartial("slides-part-1.json", {
      meta: { title: "DS Overview" },
      _index: 0,
      slides: [{ id: "slide-1" }],
    });
    writePartial("slides-part-2.json", {
      meta: { title: "DS Overview" },
      _index: 1,
      slides: [{ id: "slide-2" }, { id: "slide-3" }],
    });

    const result = runMerge([
      "--type",
      "presentation",
      "--partials-dir",
      TEST_DIR,
    ]);
    assert(result.exitCode === 0, "presentation: exits 0 on valid merge");
    assert(
      result.data && result.data.slides && result.data.slides.length === 3,
      "presentation: merges slide arrays in order (3 slides)",
    );
    assert(
      result.data &&
        result.data.slides[0].id === "slide-1" &&
        result.data.slides[2].id === "slide-3",
      "presentation: slides concatenated in correct order",
    );
  } finally {
    cleanup();
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

process.stdout.write("\n" + passed + " passed, " + failed + " failed\n");
if (failures.length) {
  process.stdout.write("\nFailures:\n");
  failures.forEach((f) => process.stdout.write("  - " + f + "\n"));
  process.exit(1);
}
