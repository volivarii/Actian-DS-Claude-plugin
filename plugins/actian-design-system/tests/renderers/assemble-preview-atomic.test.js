"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");
var cp = require("node:child_process");

var SCRIPT = path.resolve(__dirname, "../../scripts/renderers/assemble-preview.js");
var FIXTURE = path.join(__dirname, "fixtures", "refresh-probe.flow.json");

describe("assemble-preview atomic write", function () {
  it("writes the complete file and leaves no .tmp sibling", function () {
    var out = path.join(os.tmpdir(), "csw-atomic-" + process.pid + ".html");
    var r = cp.spawnSync(
      process.execPath,
      [SCRIPT, FIXTURE, "--type", "flow", "-o", out, "--no-annotations"],
      { encoding: "utf8" }
    );
    assert.equal(r.status, 0, r.stderr);
    var html = fs.readFileSync(out, "utf8");
    assert.match(html, /<!DOCTYPE html>/, "complete document written");
    assert.match(html, /id="spec-data"/, "data block present");
    assert.ok(!fs.existsSync(out + ".tmp"), "no .tmp sibling left behind");
    fs.unlinkSync(out);
  });
});
