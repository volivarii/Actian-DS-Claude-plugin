#!/usr/bin/env node
"use strict";

/**
 * codegen-snapshots.test.js — Snapshot tests for codegen scripts.
 *
 * Runs each example JSON through its -to-figma.js script and compares
 * generated code against stored baselines. Catches regressions.
 *
 * Usage:
 *   node tests/codegen-snapshots.test.js             # Run tests
 *   UPDATE_SNAPSHOTS=1 node tests/codegen-snapshots.test.js  # Update baselines
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SNAPSHOTS_DIR = path.join(__dirname, "snapshots");
const UPDATE = process.env.UPDATE_SNAPSHOTS === "1";

const TESTS = [
  {
    name: "brief",
    script: "scripts/brief-to-figma.js",
    input: "examples/brief-data-example.json",
    targetNodeId: "0:0",
  },
  {
    name: "flow",
    script: "scripts/flow-to-figma.js",
    input: "examples/flow-data-example.json",
    targetNodeId: "0:0",
  },
  {
    name: "slide",
    script: "scripts/slide-to-figma.js",
    input: "examples/slide-data-example.json",
    targetNodeId: "0:0",
  },
];

let passed = 0;
let failed = 0;
let updated = 0;

for (const test of TESTS) {
  const scriptPath = path.join(ROOT, test.script);
  const inputPath = path.join(ROOT, test.input);
  const outputDir = path.join("/tmp", `snapshot-test-${test.name}`);
  const snapshotDir = path.join(SNAPSHOTS_DIR, test.name);

  // Clean output dir
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }

  // Run the script
  try {
    execSync(
      `node "${scriptPath}" "${inputPath}" --target-node-id "${test.targetNodeId}" --output-dir "${outputDir}"`,
      { stdio: "pipe", cwd: ROOT },
    );
  } catch (err) {
    console.error(`FAIL [${test.name}] Script execution failed:`);
    console.error(err.stderr ? err.stderr.toString() : err.message);
    failed++;
    continue;
  }

  // Read manifest
  const manifestPath = path.join(outputDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error(`FAIL [${test.name}] No manifest.json generated`);
    failed++;
    continue;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  if (UPDATE) {
    // Update snapshots
    fs.mkdirSync(snapshotDir, { recursive: true });
    fs.copyFileSync(manifestPath, path.join(snapshotDir, "manifest.json"));
    if (manifest.runtime) {
      fs.copyFileSync(
        path.join(outputDir, manifest.runtime),
        path.join(snapshotDir, manifest.runtime),
      );
    }
    for (const call of manifest.calls) {
      fs.copyFileSync(
        path.join(outputDir, call.file),
        path.join(snapshotDir, call.file),
      );
    }
    console.log(`UPDATED [${test.name}] ${manifest.calls.length} call(s)`);
    updated++;
    continue;
  }

  // Compare against snapshots
  if (!fs.existsSync(snapshotDir)) {
    console.error(
      `FAIL [${test.name}] No snapshots found. Run with UPDATE_SNAPSHOTS=1 first.`,
    );
    failed++;
    continue;
  }

  const baselineManifest = JSON.parse(
    fs.readFileSync(path.join(snapshotDir, "manifest.json"), "utf8"),
  );

  // Check call count
  if (manifest.totalCalls !== baselineManifest.totalCalls) {
    console.error(
      `FAIL [${test.name}] Call count changed: ${baselineManifest.totalCalls} → ${manifest.totalCalls}`,
    );
    failed++;
    continue;
  }

  // Compare runtime.js if present
  let testPassed = true;
  if (manifest.runtime) {
    const runtimeActual = fs.readFileSync(
      path.join(outputDir, manifest.runtime),
      "utf8",
    );
    const runtimeBaselinePath = path.join(snapshotDir, manifest.runtime);
    if (fs.existsSync(runtimeBaselinePath)) {
      if (runtimeActual !== fs.readFileSync(runtimeBaselinePath, "utf8")) {
        console.error(`FAIL [${test.name}] runtime.js differs`);
        testPassed = false;
      }
    }
  }

  // Compare each call file
  for (const call of manifest.calls) {
    const actual = fs.readFileSync(path.join(outputDir, call.file), "utf8");
    const baselinePath = path.join(snapshotDir, call.file);

    if (!fs.existsSync(baselinePath)) {
      console.error(
        `FAIL [${test.name}] New call file: ${call.file} (not in baseline)`,
      );
      testPassed = false;
      continue;
    }

    const baseline = fs.readFileSync(baselinePath, "utf8");

    if (actual !== baseline) {
      // Find first diff line
      const actualLines = actual.split("\n");
      const baselineLines = baseline.split("\n");
      let diffLine = -1;
      for (
        let i = 0;
        i < Math.max(actualLines.length, baselineLines.length);
        i++
      ) {
        if (actualLines[i] !== baselineLines[i]) {
          diffLine = i + 1;
          break;
        }
      }

      const sizeDiff = Buffer.byteLength(actual) - Buffer.byteLength(baseline);
      console.error(
        `FAIL [${test.name}] ${call.file} differs at line ${diffLine} (size ${sizeDiff > 0 ? "+" : ""}${sizeDiff} bytes)`,
      );
      if (diffLine > 0) {
        console.error(
          `  baseline: ${(baselineLines[diffLine - 1] || "").substring(0, 100)}`,
        );
        console.error(
          `  actual:   ${(actualLines[diffLine - 1] || "").substring(0, 100)}`,
        );
      }
      testPassed = false;
    }
  }

  if (testPassed) {
    console.log(
      `PASS [${test.name}] ${manifest.totalCalls} call(s), all match`,
    );
    passed++;
  } else {
    failed++;
  }
}

console.log("");
if (UPDATE) {
  console.log(`Updated ${updated} snapshot(s).`);
} else {
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}
