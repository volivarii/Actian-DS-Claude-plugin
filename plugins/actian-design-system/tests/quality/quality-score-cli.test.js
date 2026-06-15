#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var { execFileSync } = require("node:child_process");
var fs = require("node:fs");
var path = require("node:path");

var CLI = path.join(
  __dirname,
  "..",
  "..",
  "scripts",
  "quality",
  "quality-score-cli.js",
);
var LEDGER = path.join(
  __dirname,
  "..",
  "..",
  "tests",
  "renderers",
  "__fidelity__",
  "quality-ledger.jsonl",
);

function run(args) {
  try {
    return {
      code: 0,
      out: execFileSync("node", [CLI].concat(args || []), { encoding: "utf8" }),
    };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

describe("quality-score-cli (real tokens + real fidelity ledger)", function () {
  it("prints a DS Quality Score headline and exits 0 (report-only)", function () {
    var r = run(["--no-write"]);
    assert.strictEqual(r.code, 0);
    assert.match(r.out, /DS Quality Score:/);
  });

  it("--json emits a parseable row with score + gates", function () {
    var r = run(["--json", "--no-write"]);
    var row = JSON.parse(r.out);
    assert.ok("score" in row);
    assert.ok(row.gates.tokens);
    assert.ok("fidelity" in row.gates);
  });

  it("does not mutate the real ledger when --no-write is passed", function () {
    var before = fs.existsSync(LEDGER) ? fs.readFileSync(LEDGER, "utf8") : null;
    run(["--no-write"]);
    run(["--json", "--no-write"]);
    var after = fs.existsSync(LEDGER) ? fs.readFileSync(LEDGER, "utf8") : null;
    assert.strictEqual(after, before);
  });
});
