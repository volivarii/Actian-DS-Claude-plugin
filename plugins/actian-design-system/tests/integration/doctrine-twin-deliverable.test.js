"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..", "..");
function read(p) {
  return fs.readFileSync(path.join(ROOT, p), "utf8");
}

test("figma-output.md no longer asserts HTML is preview-only without the twin caveat", function () {
  var doc = read("references/figma/figma-output.md");
  assert.ok(
    doc.indexOf("never use HTML as a Figma output path") === -1,
    "the absolute 'never use HTML' assertion is gone",
  );
  assert.ok(
    /twin deliverable|first-class deliverable|shareable deliverable/i.test(doc),
    "twin-deliverable framing present",
  );
});

test("html-reference.md documents the shareable flow-share deliverable", function () {
  var doc = read("references/generate-flow/html-reference.md");
  assert.ok(/flow-share/.test(doc), "names the flow-share deliverable");
});

test("figma-output.md frames HTML (flow-share) as the default first-class deliverable", function () {
  var doc = read("references/figma/figma-output.md");
  assert.ok(
    /default.*first.?class|first.?class.*default/i.test(doc),
    "figma-output.md describes HTML/flow-share as default and first-class",
  );
  assert.ok(
    /flow-share/.test(doc),
    "flow-share token present in figma-output.md",
  );
});

test("figma-output.md frames Figma push as opt-in (not the default)", function () {
  var doc = read("references/figma/figma-output.md");
  assert.ok(
    /figma push is (the )?opt.?in|opt.?in.*figma push|opt.?in.*second output/i.test(
      doc,
    ),
    "figma-output.md describes Figma push as opt-in",
  );
  // Discriminating regression guard: the pre-flip doc declared the Figma push
  // "the default output" — the OPPOSITE doctrine. Asserting that phrasing is
  // ABSENT catches a revert of the HTML-first flip (the positive opt-in match
  // above also passed against intermediate twin-deliverable wording).
  assert.doesNotMatch(
    doc,
    /figma push[^.]*\bdefault output\b/i,
    "the Figma push must NOT be described as the default output (HTML-first flip)",
  );
});
