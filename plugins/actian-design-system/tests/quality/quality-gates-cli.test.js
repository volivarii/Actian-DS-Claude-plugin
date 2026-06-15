#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var { execFileSync } = require("node:child_process");
var path = require("node:path");
var R = require("../../scripts/fidelity/resolve-binaries.js");

var CLI = path.join(__dirname, "..", "..", "scripts", "quality", "quality-gates-cli.js");
var chrome = R.resolveAll().chrome;

function run(args) {
  try {
    return { code: 0, out: execFileSync("node", [CLI].concat(args || []), { encoding: "utf8" }) };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

describe("quality-gates-cli (live composite)", { skip: chrome ? false : "Chrome not resolvable" }, function () {
  it("prints a live DS Quality Score with a structural fidelity sub-score and exits 0", function () {
    var r = run(["--no-write"]);
    assert.strictEqual(r.code, 0);
    assert.match(r.out, /DS Quality Score:/);
    assert.match(r.out, /fidelity/);
  });
});
