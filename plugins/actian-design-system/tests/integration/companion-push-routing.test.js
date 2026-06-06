"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("node:fs");
var path = require("node:path");

var SKILL = path.resolve(__dirname, "../../skills/companion/SKILL.md");

/**
 * companion-push-routing.test.js
 *
 * Asserts the companion router's HTML-first / opt-in-push contract introduced
 * in the generate-flow HTML-first simplification (v1.101.0+):
 *
 * 1. Plain greenfield generate rows (rows 1 + 2) produce an HTML deliverable
 *    ONLY — no Figma push implied.
 * 2. Explicit-Figma-prose requests ("push to figma" / "in figma") route with
 *    --push (row 2a).
 * 3. hifi / audit rows imply push (row 3 / rows 8+10) — not broken.
 * 4. Refine / iterate / branch rows (5, 6, 7) still always push (explicit
 *    Figma path — not broken by the opt-in model).
 * 5. The companion description line carries "HTML-first" framing.
 *
 * Matchers are keyed on text actually written into companion/SKILL.md — they
 * will fail loudly if that text is removed, and pass as long as the contract
 * is maintained.
 */

describe("companion push-routing contract (HTML-first / opt-in push)", function () {
  var src = fs.readFileSync(SKILL, "utf8");

  // ─── Greenfield rows produce HTML only, no push ──────────────────────────────

  it("row 1 (single-screen generate) routes to HTML deliverable only — no Figma push", function () {
    // We look for the row-1 entry in the routing table.  It must contain
    // "HTML deliverable only" or "no Figma push" language (not just invoke
    // /generate-flow without any push caveat).
    var row1Match = src.match(/\|\s*1\s*\|[^\n]+\|/);
    assert.ok(
      row1Match,
      "companion/SKILL.md must contain a routing table row numbered 1",
    );
    var row1 = row1Match[0];
    var hasNoPush =
      /HTML deliverable only/i.test(row1) ||
      /no Figma push/i.test(row1) ||
      /no push/i.test(row1);
    assert.ok(
      hasNoPush,
      "Row 1 must state HTML deliverable only / no Figma push. Got: " + row1,
    );
  });

  it("row 2 (multi-screen generate) routes to HTML deliverable only — no Figma push", function () {
    // Row 2 must also carry the HTML-only / no-push annotation.
    // We use a multi-line match that extracts the row starting with | 2 |
    // (but not 2a or 20 etc.).
    var lines = src.split("\n");
    var row2Line = lines.find(function (l) {
      return /^\|\s*2\s*\|/.test(l);
    });
    assert.ok(
      row2Line,
      "companion/SKILL.md must contain a routing table row numbered 2 (exact)",
    );
    var hasNoPush =
      /HTML deliverable only/i.test(row2Line) ||
      /no Figma push/i.test(row2Line) ||
      /no push/i.test(row2Line);
    assert.ok(
      hasNoPush,
      "Row 2 must state HTML deliverable only / no Figma push. Got: " +
        row2Line,
    );
  });

  // ─── Explicit-Figma-prose routes with --push (row 2a) ───────────────────────

  it("explicit-Figma-prose row routes with --push (opt-in Figma push)", function () {
    // Row 2a must exist and must include --push in the Routes-to column.
    var lines = src.split("\n");
    var row2aLine = lines.find(function (l) {
      return /^\|\s*2a\s*\|/.test(l);
    });
    assert.ok(
      row2aLine,
      "companion/SKILL.md must contain routing row 2a for explicit-Figma-prose",
    );
    assert.ok(
      row2aLine.includes("--push"),
      "Row 2a must route with --push. Got: " + row2aLine,
    );
  });

  it("row 2a covers 'push to figma' / 'in figma' prose triggers", function () {
    var lines = src.split("\n");
    var row2aLine = lines.find(function (l) {
      return /^\|\s*2a\s*\|/.test(l);
    });
    assert.ok(row2aLine, "row 2a must exist");
    var hasFigmaProse =
      /push to figma/i.test(row2aLine) || /"in figma"/i.test(row2aLine);
    assert.ok(
      hasFigmaProse,
      "Row 2a must call out 'push to figma' and/or '\"in figma\"' as triggers. Got: " +
        row2aLine,
    );
  });

  // ─── hifi / audit rows still imply push ─────────────────────────────────────

  it("row 3 (hifi + audit) still implies push via --hifi/--audit", function () {
    var lines = src.split("\n");
    var row3Line = lines.find(function (l) {
      return /^\|\s*3\s*\|/.test(l);
    });
    assert.ok(
      row3Line,
      "companion/SKILL.md must contain routing table row numbered 3",
    );
    var hasHifiAudit = /--hifi/.test(row3Line) && /--audit/.test(row3Line);
    assert.ok(
      hasHifiAudit,
      "Row 3 must still route with --hifi and --audit. Got: " + row3Line,
    );
  });

  it("hifi/audit imply-push annotation is present in the routing table", function () {
    // The --hifi/--audit row must carry a note that these flags imply push,
    // so the designer + companion both understand why no --push flag is needed.
    var hasImplyPush =
      /--hifi.*imply.*push|--audit.*imply.*push/i.test(src) ||
      /hifi.*audit.*imply push/i.test(src) ||
      /imply push/i.test(src);
    assert.ok(
      hasImplyPush,
      "companion/SKILL.md must note that --hifi/--audit imply push",
    );
  });

  // ─── Refine / iterate / branch rows still always push ───────────────────────

  it("row 5 (refine) notes it always pushes (explicit Figma path)", function () {
    var lines = src.split("\n");
    var row5Line = lines.find(function (l) {
      return /^\|\s*5\s*\|/.test(l);
    });
    assert.ok(row5Line, "row 5 must exist");
    var alwaysPushes =
      /always push/i.test(row5Line) ||
      /explicit Figma path/i.test(row5Line) ||
      /always pushes/i.test(row5Line);
    assert.ok(
      alwaysPushes,
      "Row 5 (refine) must note it always pushes / explicit Figma path. Got: " +
        row5Line,
    );
  });

  it("row 6 (iterate) notes it always pushes (explicit Figma path)", function () {
    var lines = src.split("\n");
    var row6Line = lines.find(function (l) {
      return /^\|\s*6\s*\|/.test(l);
    });
    assert.ok(row6Line, "row 6 must exist");
    var alwaysPushes =
      /always push/i.test(row6Line) ||
      /explicit Figma path/i.test(row6Line) ||
      /always pushes/i.test(row6Line);
    assert.ok(
      alwaysPushes,
      "Row 6 (iterate) must note it always pushes / explicit Figma path. Got: " +
        row6Line,
    );
  });

  it("row 7 (branch) notes it always pushes (explicit Figma path)", function () {
    var lines = src.split("\n");
    var row7Line = lines.find(function (l) {
      return /^\|\s*7\s*\|/.test(l);
    });
    assert.ok(row7Line, "row 7 must exist");
    var alwaysPushes =
      /always push/i.test(row7Line) ||
      /explicit Figma path/i.test(row7Line) ||
      /always pushes/i.test(row7Line);
    assert.ok(
      alwaysPushes,
      "Row 7 (branch) must note it always pushes / explicit Figma path. Got: " +
        row7Line,
    );
  });

  // ─── Description line carries HTML-first framing ────────────────────────────

  it("companion description line carries 'HTML-first' framing", function () {
    // The frontmatter description must include "HTML-first" so any surface
    // that shows the skill description reflects the new default behavior.
    var descMatch = src.match(/^description:\s*(.+)$/m);
    assert.ok(
      descMatch,
      "companion/SKILL.md must have a description: frontmatter field",
    );
    var desc = descMatch[1];
    assert.ok(
      /HTML.first/i.test(desc),
      "description must contain 'HTML-first'. Got: " + desc,
    );
  });

  it("companion description says 'pushes to Figma on request' (not unconditional)", function () {
    var descMatch = src.match(/^description:\s*(.+)$/m);
    assert.ok(descMatch, "description: field must exist");
    var desc = descMatch[1];
    // Must NOT say "Pushes to Figma" without a qualifier like "on request"
    var unconditional =
      /pushes to figma(?! on request)/i.test(desc) &&
      !/on request/i.test(desc);
    assert.ok(
      !unconditional,
      "description must not imply unconditional Figma push. Got: " + desc,
    );
    var hasOnRequest =
      /pushes to Figma on request/i.test(desc) ||
      /HTML.first/i.test(desc) ||
      !/push/i.test(desc); // no push mention at all is also fine
    assert.ok(
      hasOnRequest,
      "description must frame push as optional/on-request. Got: " + desc,
    );
  });
});
