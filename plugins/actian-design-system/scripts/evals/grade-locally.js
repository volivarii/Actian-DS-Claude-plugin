#!/usr/bin/env node
"use strict";

// grade-locally.js — programmatic grader for the component-brief eval lane.
// Replaces the per-run grader subagent with a single Node invocation.
//
// Usage:
//   node grade-locally.js \
//     --frame-id <file-key>:<node-id> \
//     --eval-name <checkbox|button> \
//     --fixture <abs path to brief-data.json> \
//     --expected-tables <int> \
//     --out <abs path to output dir>
//
// Writes <out>/grading.json in the schema expected by skill-creator's viewer:
//   { expectations: [{ text, passed, evidence }, ...] }
//
// Auth: process.env.FIGMA_PAT (same as figma-rest.js).
// Cost: ~0 tokens (one REST call); replaces ~100K-token grader subagent.

var fs = require("fs");
var path = require("path");

var rest = require("../sync/figma-rest.js");
var A = require("./grading-assertions.js");

function parseArgs(argv) {
  var out = {};
  for (var i = 2; i < argv.length; i++) {
    var arg = argv[i];
    var m = arg.match(/^--([a-zA-Z0-9-]+)(?:=(.*))?$/);
    if (!m) continue;
    var key = m[1];
    var val = m[2] !== undefined ? m[2] : argv[++i];
    out[key] = val;
  }
  return out;
}

function fail(msg) {
  process.stderr.write("grade-locally: " + msg + "\n");
  process.exit(1);
}

function splitFrameId(frameId) {
  // FRAME_NODE_ID format is `<file-key>:<node-id>` where node-id itself
  // contains colons (e.g. "1357:124"). Split only on the FIRST colon.
  var firstColon = frameId.indexOf(":");
  if (firstColon < 0) return null;
  return {
    fileKey: frameId.slice(0, firstColon),
    nodeId: frameId.slice(firstColon + 1),
  };
}

function loadFixtureVariantCount(fixturePath) {
  var raw = fs.readFileSync(fixturePath, "utf8");
  var parsed = JSON.parse(raw);
  if (parsed.card_variation && Array.isArray(parsed.card_variation.variants)) {
    return parsed.card_variation.variants.length;
  }
  return null;
}

async function main() {
  var args = parseArgs(process.argv);
  var frameId = args["frame-id"];
  var evalName = args["eval-name"];
  var fixturePath = args["fixture"];
  var expectedTables = args["expected-tables"]
    ? parseInt(args["expected-tables"], 10)
    : null;
  var outDir = args["out"];

  if (!frameId) fail("--frame-id required");
  if (!evalName) fail("--eval-name required (checkbox|button)");
  if (!fixturePath) fail("--fixture required");
  if (expectedTables === null) fail("--expected-tables required");
  if (!outDir) fail("--out required");

  var split = splitFrameId(frameId);
  if (!split) fail("--frame-id must be <file-key>:<node-id>");

  var resp = await rest.getNode(split.fileKey, split.nodeId);
  var nodeEntry = resp.nodes && resp.nodes[split.nodeId];
  if (!nodeEntry || !nodeEntry.document) {
    fail("Figma REST returned no document for node " + split.nodeId);
  }
  var doc = nodeEntry.document;

  var variantCount = loadFixtureVariantCount(fixturePath);

  var expectations = [];
  expectations.push(
    wrap(
      "A1: Frame names contain real component-part names",
      A.a1GenericFrameRatio(doc),
    ),
  );
  expectations.push(
    wrap(
      "A2: No row in Phase 1 token tables crushes below 32px",
      A.a2TokenTableRowHeights(doc),
    ),
  );
  expectations.push(
    wrap(
      "A3: Variation matrix renders rows >= 40px",
      A.a3VariationRowHeights(doc),
    ),
  );
  expectations.push(wrap("A4: No token typo regression", A.a4TokenTypos(doc)));
  expectations.push(wrap("A5: Specs sub-frame exists", A.a5SpecsSubFrame(doc)));

  if (evalName === "checkbox") {
    expectations.push(
      wrap("A6: Anatomy badges A and B exist", A.a6AnatomyBadges(doc)),
    );
  } else if (evalName === "button") {
    if (variantCount === null) {
      fail("button fixture missing card_variation.variants for A7");
    }
    expectations.push(
      wrap(
        "A7: Variation matrix row count matches fixture",
        A.a7VariationRowCount(doc, { variantCount: variantCount }),
      ),
    );
  }

  expectations.push(
    wrap(
      "A8: renderTable invocation rate >= 80% (interpreter-named frames)",
      A.a8RenderTableAdoption(doc, {
        expectedRenderTablesCount: expectedTables,
      }),
    ),
  );

  fs.mkdirSync(outDir, { recursive: true });
  var outPath = path.join(outDir, "grading.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify({ expectations: expectations }, null, 2) + "\n",
  );
  process.stdout.write("wrote " + outPath + "\n");
}

function wrap(text, result) {
  return { text: text, passed: result.passed, evidence: result.evidence };
}

main().catch(function (err) {
  fail((err && err.stack) || String(err));
});
