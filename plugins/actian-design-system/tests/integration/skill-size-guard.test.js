#!/usr/bin/env node
"use strict";

/**
 * skill-size-guard.test.js — Every skills/<name>/SKILL.md must stay under the
 * Anthropic 500-line "optimal performance" ceiling. The body is loaded in full
 * whenever the skill triggers, so detail belongs in references/ (progressive
 * disclosure), not inline. Fails loudly when a skill grows past the ceiling.
 * Run: node --test tests/integration/skill-size-guard.test.js
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
const SKILLS_DIR = path.join(PLUGIN_ROOT, "skills");
const MAX_LINES = 500;

// Count lines the way `wc -l` does (newline count), so the reported number
// matches what authors see in their editor and the documented ceiling. NOTE:
// `split("\n").length` would be wc -l + 1 on a newline-terminated file, which
// would false-positive a legitimately-499-line skill against the < 500 ceiling.
function lineCount(file) {
  return (fs.readFileSync(file, "utf8").match(/\n/g) || []).length;
}

describe("SKILL.md size ceiling (progressive disclosure)", () => {
  const dirs = fs
    .readdirSync(SKILLS_DIR)
    .filter((d) => fs.existsSync(path.join(SKILLS_DIR, d, "SKILL.md")));

  it("finds at least one skill with a SKILL.md", () => {
    assert.ok(dirs.length > 0, "found no skills with a SKILL.md");
  });

  for (const d of dirs) {
    it(`${d}/SKILL.md is under ${MAX_LINES} lines`, () => {
      const lines = lineCount(path.join(SKILLS_DIR, d, "SKILL.md"));
      assert.ok(
        lines < MAX_LINES,
        `${d}/SKILL.md is ${lines} lines (ceiling ${MAX_LINES}). ` +
          `Move detail to references/ via progressive disclosure.`,
      );
    });
  }
});
