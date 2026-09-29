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

const PLUGIN_ROOT = path.resolve(__dirname, "..", "..", "plugins", "actian-design-system");
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
          `The knowledge carries the detail; keep the card short.`,
      );
    });
  }
});

// The skills are short cards: the knowledge carries the detail, and a card that
// grows back into a manual is the thing this simplification removed (124 KB of
// instructions against the thin kit's 8.7 KB, benchmark 2026-09).
const MAX_CARD_BYTES = 4000;
const MAX_SKILLS_BYTES = 24000;

function filesUnder(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? filesUnder(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );
}

describe("skill cards stay short", () => {
  const dirs = fs
    .readdirSync(SKILLS_DIR)
    .filter((d) => fs.existsSync(path.join(SKILLS_DIR, d, "SKILL.md")));
  for (const d of dirs) {
    it(`${d}/SKILL.md is under ${MAX_CARD_BYTES} bytes`, () => {
      const bytes = fs.statSync(path.join(SKILLS_DIR, d, "SKILL.md")).size;
      assert.ok(bytes < MAX_CARD_BYTES, `${d}/SKILL.md is ${bytes} bytes (ceiling ${MAX_CARD_BYTES})`);
    });
  }
  it(`everything under skills/ is under ${MAX_SKILLS_BYTES} bytes`, () => {
    const total = filesUnder(SKILLS_DIR).reduce((n, f) => n + fs.statSync(f).size, 0);
    assert.ok(total < MAX_SKILLS_BYTES, `skills/ holds ${total} bytes (ceiling ${MAX_SKILLS_BYTES})`);
  });
  it("the plugin ships no agents: the main session does the work", () => {
    assert.ok(!fs.existsSync(path.join(PLUGIN_ROOT, "agents")), "agents/ is back");
  });
});
