"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var path = require("node:path");

var SKILL = path.resolve(__dirname, "../../skills/generate-flow/SKILL.md");

/**
 * generate-flow-push-optin.test.js
 *
 * Asserts the OPT-IN PUSH contract introduced in the HTML-first simplification
 * (v1.101.0+):
 *
 * - Default greenfield = NO push.  SKILL.md must describe push as conditional /
 *   opt-in, not the unconditional default behavior.
 * - Three push triggers are documented: --push flag, prose intent
 *   ("push to figma" / "in figma"), and --hifi / --audit imply push.
 * - --no-push override is documented.
 * - Refine / iterate / branch on an existing Figma URL STILL pushes (explicit
 *   Figma-path exemption).
 * - SKILL.md carries a pointer to references/generate-flow/push-opt-in.md.
 *
 * Scope is deliberately non-overlapping with generate-flow-preview-ordering.test.js
 * which covers artifact shape, pipeline ordering, Step 7.5 combined gate,
 * --share retirement, and --push documentation at a coarse level.  This file
 * focuses on the TRIGGERS + the refine-exemption + the reference-pointer.
 *
 * NOTE: This test is intentionally RED until SKILL.md is rewritten in Task 4.1.
 * It must fail with assertion failures (contract not yet in SKILL.md), NOT with
 * syntax / setup errors.  A syntax/setup failure is a bug in THIS file; an
 * assertion failure is the expected pre-4.1 state.
 */

describe("generate-flow push opt-in contract", function () {
  var src = fs.readFileSync(SKILL, "utf8");

  // ─── Default is no-push ──────────────────────────────────────────────────────

  it("push is described as conditional / opt-in, not the unconditional default", function () {
    // The old pipeline always pushed to Figma.  The new pipeline must document
    // push as conditional.  We look for language that makes push explicit:
    // "opt-in", "only if", "conditional", or "--push" in the context of whether
    // a push happens at all.
    //
    // Key: "--push" token is ABSENT from the current SKILL.md, so this assertion
    // cleanly fails now and passes after the 4.1 rewrite.
    var hasPushOptIn =
      /opt.in.*push|push.*opt.in/i.test(src) ||
      /push.*only if/i.test(src) ||
      /conditional.*push|push.*conditional/i.test(src) ||
      src.includes("--push");

    assert.ok(
      hasPushOptIn,
      "SKILL.md must describe Figma push as opt-in / conditional " +
        "(mention --push, 'opt-in push', 'push only if', or 'conditional push')",
    );
  });

  it("default greenfield run does NOT unconditionally push (no-push-by-default language present)", function () {
    // Acceptable phrases: "no push", "HTML only", "HTML deliverable only",
    // "push is opt-in", "push is skipped", "does not push", or the --push flag
    // itself framing the default as absent.
    var hasNoPushDefault =
      /no push/i.test(src) ||
      /html.only/i.test(src) ||
      /html deliverable only/i.test(src) ||
      /push is opt.in/i.test(src) ||
      /push is skipped/i.test(src) ||
      /does not push/i.test(src) ||
      // A --push trigger description implies no-push is default
      src.includes("--push");

    assert.ok(
      hasNoPushDefault,
      "SKILL.md must document that the default greenfield run does not push to Figma " +
        "(phrase one of: 'no push', 'HTML only', 'push is opt-in', '--push', etc.)",
    );
  });

  // ─── Push triggers ───────────────────────────────────────────────────────────

  it("--push flag is documented as a push trigger", function () {
    // Keyed on the literal "--push" token which is ABSENT from current SKILL.md.
    assert.ok(
      src.includes("--push"),
      "SKILL.md must document --push as the opt-in flag for Figma push",
    );
  });

  it("prose intent trigger is documented ('push to figma' / 'in figma')", function () {
    // The prose trigger must be called out so designers and companion know about it.
    // Acceptable: "push to figma", "in figma", or "prose intent".
    var hasProseTrigger =
      /push to figma/i.test(src) ||
      /"in figma"/i.test(src) ||
      /prose intent/i.test(src);

    assert.ok(
      hasProseTrigger,
      "SKILL.md must document prose intent as a push trigger " +
        "('push to figma', '\"in figma\"', or 'prose intent')",
    );
  });

  it("--hifi and --audit imply push (documented as push triggers)", function () {
    // The implication triggers must be documented so the operator knows
    // that passing --hifi or --audit will cause a push.
    // We look for language linking --hifi / --audit to the push decision.
    var hasHifiAuditImplication =
      /--hifi.*push|push.*--hifi/i.test(src) ||
      /--audit.*push|push.*--audit/i.test(src) ||
      /hifi.*impl.*push|audit.*impl.*push/i.test(src) ||
      // Acceptable: a triggers table that lists both flags
      (/--hifi/.test(src) && /--audit/.test(src) && /trigger/i.test(src));

    assert.ok(
      hasHifiAuditImplication,
      "SKILL.md must document that --hifi and --audit imply a Figma push",
    );
  });

  // ─── --no-push override ──────────────────────────────────────────────────────

  it("--no-push override is documented", function () {
    assert.ok(
      src.includes("--no-push"),
      "SKILL.md must document the --no-push override flag",
    );
  });

  // ─── Refine / iterate / branch exemption ─────────────────────────────────────

  it("refine / iterate / branch on an existing Figma URL still pushes (explicit-Figma exemption)", function () {
    // The opt-in model has an exemption: when the designer is already working in
    // Figma (refine/iterate/branch + URL), push is unconditional.  SKILL.md must
    // document this so the opt-in model does not accidentally suppress those paths.
    //
    // Acceptable: "always push", "exemption", "explicit figma", "refine.*push",
    // "iterate.*push", "branch.*push" in the context of push behavior.
    var hasRefineExemption =
      /always push/i.test(src) ||
      /exemption/i.test(src) ||
      /explicit.figma.*push|push.*explicit.figma/i.test(src) ||
      /refine.*push.*always|always.*push.*refine/i.test(src) ||
      /iterate.*push.*always|always.*push.*iterate/i.test(src) ||
      // Acceptable compound: refine/iterate/branch described as still pushing
      (/refine/.test(src) && /iterate/.test(src) && /still push/i.test(src));

    assert.ok(
      hasRefineExemption,
      "SKILL.md must document that refine / iterate / branch on a Figma URL " +
        "still pushes (explicit-Figma exemption from the opt-in default). " +
        "Expected one of: 'always push', 'exemption', 'explicit figma', " +
        "'refine…push always', 'still push'",
    );
  });

  // ─── Reference pointer ───────────────────────────────────────────────────────

  it("SKILL.md points to references/generate-flow/push-opt-in.md", function () {
    // Keyed on a token ABSENT from current SKILL.md so this fails cleanly now
    // and passes after the 4.1 rewrite adds the pointer.
    assert.ok(
      src.includes("references/generate-flow/push-opt-in.md"),
      "SKILL.md must reference references/generate-flow/push-opt-in.md " +
        "(progressive-disclosure pointer for the push opt-in model)",
    );
  });
});
