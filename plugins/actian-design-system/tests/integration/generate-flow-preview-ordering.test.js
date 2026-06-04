"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var path = require("node:path");

var SKILL = path.resolve(__dirname, "../../skills/generate-flow/SKILL.md");

describe("generate-flow pipeline ordering", function () {
  var src = fs.readFileSync(SKILL, "utf8");

  it("renders the preview before pushing to Figma", function () {
    // The auto-render step (6.5) must appear before the push (Step 7) in the pipeline.
    var renderIdx = src.indexOf("Auto-render the HTML preview");
    var pushIdx = src.indexOf("7. Push to Figma");
    assert.ok(renderIdx !== -1, "Step 6.5 auto-render block must exist");
    assert.ok(pushIdx !== -1, "Step 7 push must exist");
    assert.ok(renderIdx < pushIdx, "preview render (6.5) must precede the push (7)");
  });

  it("documents the preview render as automatic / before the push", function () {
    assert.match(src, /before the push/i, "preview must be described as before the push");
  });
});
