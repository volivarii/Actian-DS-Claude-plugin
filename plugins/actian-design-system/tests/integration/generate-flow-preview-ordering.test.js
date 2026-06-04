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
    assert.ok(
      renderIdx < pushIdx,
      "preview render (6.5) must precede the push (7)",
    );
  });

  it("documents the preview render as automatic / before the push", function () {
    assert.match(
      src,
      /before the push/i,
      "preview must be described as before the push",
    );
  });

  it("shows a skeleton preview at approval, before the build", function () {
    var skeletonIdx = src.indexOf("Skeleton preview at approval");
    var buildIdx = src.indexOf("5. Build");
    assert.ok(skeletonIdx !== -1, "Step 5.0 skeleton block must exist");
    assert.ok(buildIdx !== -1, "Step 5 build must exist");
    assert.ok(
      skeletonIdx < buildIdx,
      "skeleton (5.0) must precede the build (5)",
    );
  });

  it("streams with --refresh but the final render (6.5) is clean (no --refresh)", function () {
    // Streaming renders carry --refresh.
    assert.match(src, /--refresh 2/, "streaming renders must pass --refresh 2");
    // The final render block (6.5) must describe itself as without --refresh.
    var finalIdx = src.indexOf("final, clean");
    assert.ok(
      finalIdx !== -1,
      "Step 6.5 must be marked as the final clean render",
    );
    assert.match(
      src,
      /without `--refresh`/,
      "final render must state it omits --refresh",
    );
    // The skeleton/streaming markers precede the final render.
    assert.ok(
      src.indexOf("Skeleton preview at approval") < finalIdx,
      "skeleton precedes final render",
    );
  });
});
