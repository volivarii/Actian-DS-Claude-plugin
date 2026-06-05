#!/usr/bin/env node
"use strict";

/**
 * generate-flow-disclosure.test.js — After the slim-down, every relocated topic
 * must stay REACHABLE: SKILL.md keeps an explicit pointer to the reference file,
 * and that file exists and is non-trivial. Guards against a future edit silently
 * deleting a pointer or emptying a target. Complements vendor-paths-resolve
 * (which only checks the path resolves).
 * Run: node --test tests/integration/generate-flow-disclosure.test.js
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
const SKILL = fs.readFileSync(
  path.join(PLUGIN_ROOT, "skills/generate-flow/SKILL.md"),
  "utf8",
);

const TOPICS = [
  "references/generate-flow/refine.md",
  "references/generate-flow/vision-refs.md",
  "references/generate-flow/push-sequence.md",
];

describe("generate-flow progressive disclosure reachability", () => {
  for (const rel of TOPICS) {
    it(`SKILL.md points to ${rel}`, () => {
      assert.ok(SKILL.includes(rel), `SKILL.md no longer references ${rel} — pointer lost`);
    });
    it(`${rel} exists and is non-trivial`, () => {
      const abs = path.join(PLUGIN_ROOT, rel);
      assert.ok(fs.existsSync(abs), `${rel} missing`);
      const lines = fs.readFileSync(abs, "utf8").split("\n").length;
      assert.ok(lines > 15, `${rel} is only ${lines} lines — likely empty stub`);
    });
  }
});
