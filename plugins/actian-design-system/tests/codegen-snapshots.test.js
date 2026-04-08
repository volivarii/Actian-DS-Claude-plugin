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

function compareFile(
  outputDir,
  snapshotDir,
  filename,
  testName,
  currentPassed,
) {
  const actualPath = path.join(outputDir, filename);
  const baselinePath = path.join(snapshotDir, filename);

  if (!fs.existsSync(actualPath)) {
    console.error(`FAIL [${testName}] Missing output file: ${filename}`);
    return false;
  }
  if (!fs.existsSync(baselinePath)) {
    console.error(`FAIL [${testName}] New file: ${filename} (not in baseline)`);
    return false;
  }

  const actual = fs.readFileSync(actualPath, "utf8");
  const baseline = fs.readFileSync(baselinePath, "utf8");

  if (actual !== baseline) {
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
      `FAIL [${testName}] ${filename} differs at line ${diffLine} (size ${sizeDiff > 0 ? "+" : ""}${sizeDiff} bytes)`,
    );
    if (diffLine > 0) {
      console.error(
        `  baseline: ${(baselineLines[diffLine - 1] || "").substring(0, 100)}`,
      );
      console.error(
        `  actual:   ${(actualLines[diffLine - 1] || "").substring(0, 100)}`,
      );
    }
    return false;
  }

  return currentPassed;
}

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
    // Clean old files first
    const existingFiles = fs.existsSync(snapshotDir)
      ? fs.readdirSync(snapshotDir)
      : [];
    for (const ef of existingFiles) {
      fs.unlinkSync(path.join(snapshotDir, ef));
    }
    fs.copyFileSync(manifestPath, path.join(snapshotDir, "manifest.json"));

    if (manifest.version === 2) {
      // V2: scaffold + fills
      fs.copyFileSync(
        path.join(outputDir, manifest.scaffold.file),
        path.join(snapshotDir, manifest.scaffold.file),
      );
      fs.copyFileSync(
        path.join(outputDir, manifest.scaffold.specFile),
        path.join(snapshotDir, manifest.scaffold.specFile),
      );
      for (const fill of manifest.fills) {
        fs.copyFileSync(
          path.join(outputDir, fill.file),
          path.join(snapshotDir, fill.file),
        );
        fs.copyFileSync(
          path.join(outputDir, fill.specFile),
          path.join(snapshotDir, fill.specFile),
        );
      }
      console.log(
        `UPDATED [${test.name}] v2: scaffold + ${manifest.fills.length} fill(s)`,
      );
    } else {
      // V1: runtime + calls
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
      console.log(`UPDATED [${test.name}] ${manifest.totalCalls} call(s)`);
    }
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

  let testPassed = true;

  // Check version matches
  if ((manifest.version || 1) !== (baselineManifest.version || 1)) {
    console.error(
      `FAIL [${test.name}] Manifest version changed: ${baselineManifest.version || 1} → ${manifest.version || 1}`,
    );
    failed++;
    continue;
  }

  if (manifest.version === 2) {
    // V2: compare scaffold + fills
    // Check fill count
    if (manifest.fills.length !== baselineManifest.fills.length) {
      console.error(
        `FAIL [${test.name}] Fill count changed: ${baselineManifest.fills.length} → ${manifest.fills.length}`,
      );
      failed++;
      continue;
    }

    // Compare scaffold files
    for (const fname of [manifest.scaffold.file, manifest.scaffold.specFile]) {
      testPassed = compareFile(
        outputDir,
        snapshotDir,
        fname,
        test.name,
        testPassed,
      );
    }

    // Compare fill files
    for (const fill of manifest.fills) {
      for (const fname of [fill.file, fill.specFile]) {
        testPassed = compareFile(
          outputDir,
          snapshotDir,
          fname,
          test.name,
          testPassed,
        );
      }
    }
  } else {
    // V1: compare runtime + calls
    // Check call count
    if (manifest.totalCalls !== baselineManifest.totalCalls) {
      console.error(
        `FAIL [${test.name}] Call count changed: ${baselineManifest.totalCalls} → ${manifest.totalCalls}`,
      );
      failed++;
      continue;
    }

    if (manifest.runtime) {
      testPassed = compareFile(
        outputDir,
        snapshotDir,
        manifest.runtime,
        test.name,
        testPassed,
      );
    }

    for (const call of manifest.calls) {
      testPassed = compareFile(
        outputDir,
        snapshotDir,
        call.file,
        test.name,
        testPassed,
      );
    }
  }

  if (testPassed) {
    const desc =
      manifest.version === 2
        ? `scaffold + ${manifest.fills.length} fill(s)`
        : `${manifest.totalCalls} call(s)`;
    console.log(`PASS [${test.name}] ${desc}, all match`);
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
