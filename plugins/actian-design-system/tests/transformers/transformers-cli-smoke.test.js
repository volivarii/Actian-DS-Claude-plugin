#!/usr/bin/env node
"use strict";

/**
 * transformers-cli-smoke.test.js — End-to-end CLI smoke tests for the hifi
 * conversion pipeline.
 *
 * These exercise the transformer scripts AS CLIs (via execFileSync), which is
 * exactly how the convert-to-hifi skill invokes them. The existing
 * transform-to-hifi.test.js suite injects the registry via the module API and
 * never spawns the CLI, so it never touched the on-disk registry path — which
 * is why a stale `docs/generated/` reference shipped silently and crashed the
 * pipeline with ENOENT. This file closes that blind spot.
 *
 * Run with: node --test plugins/actian-design-system/tests/transformers/transformers-cli-smoke.test.js
 */

var { describe, it, after } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var fs = require("fs");
var os = require("os");
var { execFileSync } = require("child_process");

var TRANSFORMERS_DIR = path.resolve(__dirname, "..", "..", "scripts", "transformers");
var EXAMPLES_DIR = path.resolve(__dirname, "..", "..", "examples");
var FIXTURES_DIR = path.resolve(__dirname, "..", "fixtures");

var FM_TREE_TO_FLOW = path.join(TRANSFORMERS_DIR, "fm-tree-to-flow-data.js");
var TRANSFORM_TO_HIFI = path.join(TRANSFORMERS_DIR, "transform-to-hifi.js");

// Track temp outputs for cleanup.
var tempOutputs = [];
function tempOut(name) {
  var p = path.join(
    os.tmpdir(),
    "transformers-cli-smoke-" + process.pid + "-" + Date.now() + "-" + name,
  );
  tempOutputs.push(p);
  return p;
}

function runCli(scriptPath, inputPath, outPath) {
  // execFileSync throws on non-zero exit; capturing stderr keeps failures
  // readable. We don't assert on stderr (the scripts emit progress there).
  execFileSync(process.execPath, [scriptPath, inputPath, "-o", outPath], {
    stdio: ["ignore", "pipe", "pipe"],
  });
}

after(function () {
  for (var i = 0; i < tempOutputs.length; i++) {
    try {
      if (fs.existsSync(tempOutputs[i])) fs.unlinkSync(tempOutputs[i]);
    } catch (e) {
      /* best-effort cleanup */
    }
  }
});

describe("transformers CLI smoke", function () {
  it("transform-to-hifi.js CLI runs end-to-end and writes valid JSON", function () {
    var input = path.join(EXAMPLES_DIR, "flow-data-example.json");
    assert.ok(fs.existsSync(input), "fixture flow-data-example.json must exist");

    var out = tempOut("hifi-data.json");
    runCli(TRANSFORM_TO_HIFI, input, out);

    assert.ok(fs.existsSync(out), "transform-to-hifi must write its output file");
    var parsed = JSON.parse(fs.readFileSync(out, "utf8"));
    assert.ok(parsed && typeof parsed === "object", "output must parse as a JSON object");
    assert.ok(
      Array.isArray(parsed.screens) && parsed.screens.length > 0,
      "output must have a non-empty screens array",
    );
    assert.strictEqual(parsed.meta.mode, "hifi", "transform must mark meta.mode === 'hifi'");
  });

  it("fm-tree-to-flow-data.js CLI runs end-to-end and writes valid flow-data", function () {
    var input = path.join(FIXTURES_DIR, "fm-tree-minimal.json");
    assert.ok(fs.existsSync(input), "fixture fm-tree-minimal.json must exist");

    var out = tempOut("flow-data.json");
    runCli(FM_TREE_TO_FLOW, input, out);

    assert.ok(fs.existsSync(out), "fm-tree-to-flow-data must write its output file");
    var parsed = JSON.parse(fs.readFileSync(out, "utf8"));
    assert.ok(parsed && typeof parsed === "object", "output must parse as a JSON object");
    assert.ok(
      Array.isArray(parsed.screens) && parsed.screens.length > 0,
      "output must have a non-empty screens array",
    );
  });
});
