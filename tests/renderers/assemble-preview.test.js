#!/usr/bin/env node
"use strict";
// assemble-preview.js: the proposal document's CLI. The document itself is
// assemble-proposal.test.js's; this file holds the arguments and the write.
var { describe, it } = require("node:test");
var assert = require("node:assert");
var spawnSync = require("child_process").spawnSync;
var path = require("path");
var os = require("os");
var fs = require("fs");

var SCRIPT = path.join(__dirname, "..", "..", "plugins", "actian-design-system", "scripts", "renderers", "assemble-preview.js");
var PROPOSAL = path.join(__dirname, "..", "fixtures", "proposal-dip-i-496.json");

function run(args) {
  return spawnSync(process.execPath, [SCRIPT].concat(args), { encoding: "utf8" });
}
function tmpOut() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "assemble-preview-")), "out.html");
}

describe("assemble-preview", function () {
  it("writes the complete proposal document atomically, leaving no .tmp sibling", function () {
    var out = tmpOut();
    var r = run([PROPOSAL, "--type", "proposal", "-o", out]);
    assert.strictEqual(r.status, 0, r.stderr);
    var html = fs.readFileSync(out, "utf8");
    assert.match(html, /<!DOCTYPE html>/);
    assert.match(html, /<\/html>\s*$/);
    assert.ok(!fs.existsSync(out + ".tmp"), "no .tmp sibling left behind");
  });

  it("exits 1 naming what is missing: the input, --type, -o", function () {
    var out = tmpOut();
    var noInput = run(["--type", "proposal", "-o", out]);
    assert.strictEqual(noInput.status, 1);
    assert.match(noInput.stderr, /Missing input/);
    var noType = run([PROPOSAL, "-o", out]);
    assert.strictEqual(noType.status, 1);
    assert.match(noType.stderr, /Missing --type/);
    var noOut = run([PROPOSAL, "--type", "proposal"]);
    assert.strictEqual(noOut.status, 1);
    assert.match(noOut.stderr, /Missing -o/);
    assert.ok(!fs.existsSync(out));
  });

  it("refuses every type but proposal, naming the one it accepts", function () {
    ["flow", "flow-share", "bogus"].forEach(function (t) {
      var r = run([PROPOSAL, "--type", t, "-o", tmpOut()]);
      assert.strictEqual(r.status, 1, t);
      assert.match(r.stderr, /Unknown type "[a-z-]+"\. Must be one of: proposal\./, t);
    });
  });

  it("exits 1 when the input file does not exist", function () {
    var r = run([path.join(os.tmpdir(), "no-such-proposal.json"), "--type", "proposal", "-o", tmpOut()]);
    assert.strictEqual(r.status, 1);
    assert.match(r.stderr, /Input file not found/);
  });
});
