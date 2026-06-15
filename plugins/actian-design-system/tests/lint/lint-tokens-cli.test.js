#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var { execFileSync } = require("node:child_process");
var path = require("node:path");

var CLI = path.join(__dirname, "..", "..", "scripts", "lint", "lint-tokens-cli.js");

function run(args) {
  try {
    var out = execFileSync("node", [CLI].concat(args || []), { encoding: "utf8" });
    return { code: 0, out: out };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

describe("lint-tokens-cli (against real vendored tokens)", function () {
  it("report-only mode exits 0 and prints a report", function () {
    var r = run([]);
    assert.strictEqual(r.code, 0);
    assert.match(r.out, /token-lint:/);
  });

  it("--json emits parseable JSON with a findings array", function () {
    var r = run(["--json"]);
    var parsed = JSON.parse(r.out);
    assert.ok(Array.isArray(parsed.findings));
  });
});
