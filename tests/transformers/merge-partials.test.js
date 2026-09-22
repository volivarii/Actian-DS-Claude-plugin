#!/usr/bin/env node
"use strict";

/**
 * merge-partials.test.js — Tests for the merge-partials.js script.
 *
 * Run with: node tests/merge-partials.test.js
 * (from the repository root)
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

const ROOT = path.resolve(__dirname, "..", "..", "plugins", "actian-design-system");
const SCRIPT = path.join(ROOT, "scripts", "transformers", "merge-partials.js");
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

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

process.stdout.write("\n" + passed + " passed, " + failed + " failed\n");
if (failures.length) {
  process.stdout.write("\nFailures:\n");
  failures.forEach((f) => process.stdout.write("  - " + f + "\n"));
  process.exit(1);
}
