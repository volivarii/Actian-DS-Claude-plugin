"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var path = require("node:path");

var SKILL = path.resolve(__dirname, "../../skills/generate-flow/SKILL.md");

/**
 * generate-flow-preview-ordering.test.js
 *
 * Asserts the NEW HTML-first pipeline contract (v1.101.0+):
 *
 * - ONE artifact: flows/[feature].html, rendered as --type flow-share (two-view
 *   encapsulated deliverable — Prototype + Overview).  The old [feature]-flow.html
 *   strip-preview and --type flow --refresh streaming are RETIRED.
 * - Streaming preview (Steps 5.0 + live per-screen) re-emits the same
 *   --type flow-share file to flows/[feature].html each time.
 * - Step 6.5 final render: also --type flow-share to flows/[feature].html —
 *   happens BEFORE any Figma push.
 * - Figma push (Step 7) is OPT-IN / conditional — not unconditional.
 * - Step 7.5 is the single combined post-build gate (push + audit offer).
 * - --share flag is RETIRED (its behavior is now default); --push added.
 *
 * The HTML-first contract has landed (SKILL.md rewrite, Task 4.1) — these
 * assertions are GREEN and act as the regression gate.  Each is anchored on a
 * token absent from the old strip-preview pipeline (--type flow-share, --push,
 * the literal "## Step 7.5" heading, the [feature]-flow.html filename) so it
 * would fail if the old pipeline were reintroduced.
 */

describe("generate-flow pipeline ordering (HTML-first contract)", function () {
  var src = fs.readFileSync(SKILL, "utf8");

  // ─── Artifact shape ─────────────────────────────────────────────────────────

  it("uses --type flow-share for the encapsulated deliverable, not --type flow", function () {
    // The new pipeline renders --type flow-share for every emit (skeleton,
    // streaming, final). The old --type flow strip preview is retired.
    assert.match(
      src,
      /--type flow-share/,
      "SKILL.md must reference --type flow-share for the encapsulated deliverable",
    );
  });

  it("targets flows/[feature].html as the single canonical output path", function () {
    // Every render (skeleton, streaming, final) writes to flows/[feature].html,
    // not to [feature]-flow.html.
    assert.match(
      src,
      /flows\/\[feature\]\.html/,
      "SKILL.md must target flows/[feature].html as the canonical output",
    );
  });

  it("does NOT invoke a render with the --refresh auto-reload flag (old streaming retired)", function () {
    // The old strip-preview streamed via `assemble-preview.js … --refresh <s>`.
    // The new pipeline re-emits the flow-share file instead (file-watch / re-
    // render), with NO --refresh flag — SKILL.md Step 6.5 says so explicitly.
    // The ONLY permitted mention of --refresh is the backtick-quoted negation
    // ("No `--refresh`"); a --refresh used as a COMMAND flag is preceded by a
    // space, not a backtick, so a space-prefixed match catches the old pattern
    // (which had ` --refresh 2`) while ignoring the prose negation. NOTE the
    // bare `--type flow` token now legitimately appears in merge-partials.js
    // calls, so anchoring on it would false-trip — we anchor on --refresh.
    assert.doesNotMatch(
      src,
      / --refresh\b/,
      "--refresh must not appear as a command flag (old streaming auto-reload retired)",
    );
  });

  it("does NOT target the old [feature]-flow.html filename", function () {
    // The old strip-preview filename is retired.
    assert.doesNotMatch(
      src,
      /\[feature\]-flow\.html/,
      "[feature]-flow.html (old strip-preview filename) must not appear in SKILL.md",
    );
  });

  // ─── Skeleton / streaming (Step 5.0) ────────────────────────────────────────

  it("skeleton preview (Step 5.0) renders with --type flow-share to flows/[feature].html", function () {
    // Locate the skeleton block; confirm it uses the flow-share artifact shape.
    var skeletonIdx = src.indexOf("5.0");
    assert.ok(skeletonIdx !== -1, "Step 5.0 skeleton block must exist");

    // Grab a reasonable window around the skeleton step to check its render.
    var step5Idx = src.indexOf("\n5.", skeletonIdx + 1);
    var skeletonBlock =
      step5Idx !== -1
        ? src.slice(skeletonIdx, step5Idx)
        : src.slice(skeletonIdx, skeletonIdx + 2000);

    assert.match(
      skeletonBlock,
      /--type flow-share/,
      "Step 5.0 skeleton render must use --type flow-share",
    );
    assert.match(
      skeletonBlock,
      /flows\/\[feature\]\.html/,
      "Step 5.0 skeleton render must target flows/[feature].html",
    );
  });

  it("skeleton preview (Step 5.0) precedes the build step (Step 5)", function () {
    var skeletonIdx = src.indexOf("5.0");
    // Find "5. Build" — must come after 5.0
    var buildIdx = src.indexOf("5. Build");
    assert.ok(skeletonIdx !== -1, "Step 5.0 skeleton block must exist");
    assert.ok(buildIdx !== -1, "Step 5 build must exist");
    assert.ok(
      skeletonIdx < buildIdx,
      "skeleton (5.0) must precede the build (5)",
    );
  });

  // ─── Final render (Step 6.5) ────────────────────────────────────────────────

  it("Step 6.5 final render uses --type flow-share to flows/[feature].html", function () {
    // The final clean render must produce the encapsulated flow-share artifact.
    var step65Idx = src.indexOf("6.5");
    assert.ok(step65Idx !== -1, "Step 6.5 final render block must exist");

    // Grab a window covering Step 6.5 (up to the next numbered step).
    var step7Idx = src.indexOf("\n7.", step65Idx);
    var block65 =
      step7Idx !== -1
        ? src.slice(step65Idx, step7Idx)
        : src.slice(step65Idx, step65Idx + 2000);

    assert.match(
      block65,
      /--type flow-share/,
      "Step 6.5 must use --type flow-share",
    );
    assert.match(
      block65,
      /flows\/\[feature\]\.html/,
      "Step 6.5 must write to flows/[feature].html",
    );
  });

  it("the flow-share render(s) appear before the Figma push in the document", function () {
    // Anchor on the new render marker (--type flow-share) and the push marker.
    // Both streaming and the final (6.5) renders use --type flow-share and must
    // precede the push. Keyed on flow-share (absent in the old pipeline) so this
    // fails cleanly until the new contract lands — NOT on the first "6.5" prose
    // mention, which the old SKILL.md had inside the --share flag description.
    var renderIdx = src.lastIndexOf("--type flow-share");
    var pushIdx = src.search(/Push to Figma|\n7\.\s*Push|## Step 7\b/);
    assert.ok(renderIdx !== -1, "a --type flow-share render must exist");
    assert.ok(pushIdx !== -1, "a Figma push step must exist");
    assert.ok(
      renderIdx < pushIdx,
      "the final flow-share render must precede the Figma push",
    );
  });

  // ─── Push is opt-in / conditional ───────────────────────────────────────────

  it("Figma push (Step 7) is opt-in / conditional, not unconditional", function () {
    // The push step must be described as conditional: only when --push is set,
    // or the user accepts the post-build gate, or flags like --hifi/--audit
    // imply it.  An unconditional "Push to Figma" without any qualifier is the
    // old behavior.
    // Anchor tightly to the push step and key on push-SPECIFIC conditional
    // language. A bare /opt.in/ is deliberately NOT accepted: it also matches the
    // "Parity check (opt-in)" step, which would false-green an unconditional push.
    var pushIdx = src.search(/\n7\.\s*Push|## Step 7\b|Push to Figma/);
    assert.ok(pushIdx !== -1, "Step 7 push must exist");
    var pushBlock = src.slice(pushIdx, pushIdx + 700);

    var conditional =
      /--push/.test(pushBlock) ||
      /only if/i.test(pushBlock) ||
      /conditional/i.test(pushBlock) ||
      /skipped (otherwise|entirely)/i.test(pushBlock);

    assert.ok(
      conditional,
      "Step 7 push must be opt-in/conditional (mention --push, 'only if', 'conditional', or 'skipped otherwise')",
    );
  });

  it("--push flag is documented (replacing --share as the opt-in lever)", function () {
    assert.match(
      src,
      /--push/,
      "SKILL.md must document --push flag (opt-in Figma push)",
    );
  });

  it("--share flag is retired from the flags table", function () {
    // --share used to be the opt-in for the shareable deliverable; now that
    // behavior is the default, --share should no longer appear as a documented flag.
    // We look specifically at the Flags table section (between "## Flags" and the
    // next "##") so we don't accidentally match references to the old share.md ref.
    var flagsIdx = src.indexOf("## Flags");
    assert.ok(flagsIdx !== -1, "## Flags section must exist");
    var nextSection = src.indexOf("\n##", flagsIdx + 1);
    var flagsBlock =
      nextSection !== -1
        ? src.slice(flagsIdx, nextSection)
        : src.slice(flagsIdx, flagsIdx + 3000);

    assert.doesNotMatch(
      flagsBlock,
      /`--share`/,
      "--share must not appear as a documented flag (it is retired; behavior is now default)",
    );
  });

  // ─── Step 7.5 combined gate ──────────────────────────────────────────────────

  it("Step 7.5 is the single combined post-build gate offering push + audit", function () {
    // Anchor on the section HEADING (unique) — NOT the first "7.5" occurrence,
    // which in the old SKILL.md is inside the --no-prompt flag description.
    var gateIdx = src.indexOf("## Step 7.5");
    assert.ok(gateIdx !== -1, "## Step 7.5 section heading must exist");
    var nextH = src.indexOf("\n## ", gateIdx + 1);
    var gateBlock =
      nextH !== -1
        ? src.slice(gateIdx, nextH)
        : src.slice(gateIdx, gateIdx + 2000);

    // The combined gate offers push-to-Figma as a CHOICE (push is now deferred /
    // opt-in) AND audit. "push to Figma" as an offer phrase distinguishes the new
    // combined gate from the old audit-only post-push gate.
    assert.match(
      gateBlock,
      /push to figma/i,
      "Step 7.5 must offer 'push to Figma' as one of its choices",
    );
    assert.match(
      gateBlock,
      /audit/i,
      "Step 7.5 must offer audit as one of its choices",
    );
  });
});
