"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..", "..");
function read(p) { return fs.readFileSync(path.join(ROOT, p), "utf8"); }

test("figma-output.md no longer asserts HTML is preview-only without the twin caveat", function () {
  var doc = read("references/figma/figma-output.md");
  assert.ok(doc.indexOf("never use HTML as a Figma output path") === -1,
    "the absolute 'never use HTML' assertion is gone");
  assert.ok(/twin deliverable|first-class deliverable|shareable deliverable/i.test(doc),
    "twin-deliverable framing present");
});

test("html-reference.md documents the shareable flow-share deliverable", function () {
  var doc = read("references/generate-flow/html-reference.md");
  assert.ok(/flow-share/.test(doc), "names the flow-share deliverable");
});
