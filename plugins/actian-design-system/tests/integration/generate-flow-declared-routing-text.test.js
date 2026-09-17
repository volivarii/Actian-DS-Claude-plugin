"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..", "..");
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

describe("declared routing: the author agent's text", function () {
  var agent = read("agents/screen-generator.md");
  var ref = read("references/generate-flow/html-reference.md");

  it("tells the agent a layered slice is its body only, and where goto ids come from", function () {
    assert.match(agent, /`screen\.layer`/);
    assert.match(agent, /layer body only/);
    assert.match(agent, /`flow`/);
    assert.match(agent, /Never emit `screen\.id`/);
    assert.doesNotMatch(agent, /you MAY emit a kebab-case `id`/);
  });

  it("html-reference shows goto aimed at a flow id and drops the hand-written screen id", function () {
    assert.match(ref, /A slice carries `flow`/);
    assert.match(ref, /"goto": "describe-catalog-items-4"/);
    assert.doesNotMatch(ref, /"id": "toast-published"/);
  });
});
