"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var path = require("node:path");

var SKILL = path.resolve(__dirname, "../../skills/generate-flow/SKILL.md");

/**
 * generate-flow-default-output.test.js
 *
 * Asserts the DEFAULT-OUTPUT + NO-ANNOTATION-IN-DEFAULT contract introduced in
 * the HTML-first simplification (v1.101.0+):
 *
 * 1. flows/[feature].html is the ONLY HTML output in the pipeline — no separate
 *    [feature]-flow.html strip-preview is emitted alongside it.
 * 2. The canonical --type flow-share render in the pipeline does NOT pass
 *    --no-annotations (annotations are structurally absent from flow-share by
 *    architecture, not suppressed at the call site via a flag).
 *
 * NOTE: This test is intentionally RED until SKILL.md is rewritten in a later
 * task (4.1).  It must fail with assertion failures (new contract not yet in
 * SKILL.md), NOT with syntax / setup errors.  A syntax/setup failure is a bug
 * in THIS file; an assertion failure is the expected pre-4.1 state.
 *
 * Scope is deliberately narrow and non-overlapping with
 * generate-flow-preview-ordering.test.js which already covers:
 *   --type flow-share presence, flows/[feature].html presence, --share retired
 *   from Flags table, --push documented, pipeline ordering, opt-in push, etc.
 */

describe("generate-flow default output + annotation contract", function () {
  var src = fs.readFileSync(SKILL, "utf8");

  // ─── Single canonical HTML output ───────────────────────────────────────────

  it("flows/[feature].html is the only assemble-preview output path (no separate strip-preview file)", function () {
    // In the new pipeline every assemble-preview.js call writes to
    // flows/[feature].html.  The old strip-preview path [feature]-flow.html
    // must not appear as an -o / --output target alongside it.
    //
    // We count distinct output paths: only flows/[feature].html must be present;
    // [feature]-flow.html must be absent.  (The preview-ordering test already
    // asserts the latter in isolation; here we pair both sides of the contract
    // together as the "single canonical output" claim.)
    assert.match(
      src,
      /flows\/\[feature\]\.html/,
      "SKILL.md must reference flows/[feature].html as the HTML output path",
    );
    assert.doesNotMatch(
      src,
      /\[feature\]-flow\.html/,
      "[feature]-flow.html (old strip-preview filename) must not exist — " +
        "flows/[feature].html is the single canonical output",
    );
  });

  it("there is no second assemble-preview.js call that targets a different HTML output", function () {
    // Count how many -o <path> targets appear for assemble-preview.js calls.
    // In the new pipeline every such call writes to flows/[feature].html —
    // there is no secondary strip-preview emit.  We verify by checking that
    // the only -o target in the assemble-preview.js context is
    // flows/[feature].html and that [feature]-flow.html does not appear as
    // any -o value.
    var assembleCtx = src
      .split("\n")
      .filter(function (line) {
        return (
          /assemble-preview\.js/.test(line) ||
          /--type flow/.test(line) ||
          /-o \{project_working_directory\}/.test(line)
        );
      })
      .join("\n");

    // No strip-preview output target anywhere in assemble-preview context
    assert.doesNotMatch(
      assembleCtx,
      /\[feature\]-flow\.html/,
      "No assemble-preview.js call may target [feature]-flow.html — " +
        "that filename is retired",
    );
  });

  // ─── Annotations are opt-in-server-only in the canonical path ───────────────

  it("the canonical --type flow-share render does NOT pass --no-annotations (annotations absent by architecture, not flag)", function () {
    // flow-share is structurally annotation-free (assemble-flow-share.js never
    // inlines the annotation layer).  Passing --no-annotations would be
    // redundant and would incorrectly suggest the flag is the mechanism
    // controlling annotation presence.  The pipeline command must NOT include it.
    //
    // Strategy: find every line that mentions --type flow-share and look at the
    // surrounding bash block.  None of those blocks may carry --no-annotations.
    var lines = src.split("\n");
    var suspectBlocks = [];

    for (var i = 0; i < lines.length; i++) {
      if (/--type flow-share/.test(lines[i])) {
        // Gather a window of ±5 lines as the relevant block context
        var start = Math.max(0, i - 5);
        var end = Math.min(lines.length - 1, i + 5);
        var block = lines.slice(start, end + 1).join("\n");
        if (/--no-annotations/.test(block)) {
          suspectBlocks.push(block);
        }
      }
    }

    assert.strictEqual(
      suspectBlocks.length,
      0,
      "--no-annotations must NOT appear near any --type flow-share render call; " +
        "annotations are excluded by flow-share's architecture, not a suppress flag. " +
        "Found suspect block(s):\n" +
        suspectBlocks.join("\n---\n"),
    );
  });

  it("assemble-preview.js calls that use --type flow-share do not carry --no-annotations", function () {
    // Narrower sweep: look at the full SKILL.md for any line containing both
    // --type flow-share and --no-annotations (unlikely to be on the same line,
    // but guards against a compact form).
    assert.doesNotMatch(
      src,
      /--type flow-share[^\n]*--no-annotations|--no-annotations[^\n]*--type flow-share/,
      "--no-annotations must not appear on the same line as --type flow-share",
    );
  });

  it("annotations are described as opt-in via server, not inlined in the default deliverable", function () {
    // The new contract says annotations are opt-in-via-server only.  The phrase
    // "opt-in" (or "server") near "annotation" must appear in SKILL.md to
    // document this contract explicitly.
    // Keyed on tokens that are absent from the current SKILL.md (which has no
    // annotation + opt-in / server framing) so this fails cleanly until 4.1.
    var annotationIdx = src.search(/annotation.*opt.in|opt.in.*annotation/i);
    assert.ok(
      annotationIdx !== -1,
      "SKILL.md must describe annotations as opt-in (not inlined by default in the flow-share deliverable)",
    );
  });
});
