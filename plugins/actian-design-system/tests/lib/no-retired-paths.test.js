"use strict";

// Regression guard for Phase 5 — retire the transitional guideline layer.
//
// Two retired path patterns must not appear in any live plugin code or prose
// AFTER PR-A lands. The retirement is dated 2026-05-15. The substitutes are:
//
//   vendor/components/src/guidelines/<x>.json  →  vendor/components/dist/guidelines/<x>.json
//   vendor/content/dist/content.md             →  vendor/content/dist/global.md
//                                                  (+ per-component domains.content in the guideline doc)
//
// The vendor/ tree mirrors upstream, so it's exempt — vendor cleanup happens
// via PR-C (vendor-snapshot.yml) after PR-B (knowledge retirement) merges.
// This test, CLAUDE.md, and release-notes are exempt because they reference
// the retired strings descriptively.

const test = require("node:test");
const assert = require("node:assert/strict");
const { execSync } = require("node:child_process");
const path = require("node:path");

const PLUGIN_ROOT = path.resolve(__dirname, "..", "..");

const RETIRED_PATTERNS = [
  "vendor/components/src/guidelines/",
  "vendor/content/dist/content.md",
];

// git pathspec excludes — vendor (mirrors upstream), this test, descriptive
// docs, and release notes. Keep this list narrow; anything else MUST migrate.
const PATHSPEC_EXCLUDES = [
  ":(exclude)vendor",
  ":(exclude)tests/lib/no-retired-paths.test.js",
  ":(exclude)CLAUDE.md",
  ":(exclude)release-notes",
];

test("Phase 5 — retired transitional-layer paths must not appear in live code", async (t) => {
  for (const pattern of RETIRED_PATTERNS) {
    await t.test(`no live references to "${pattern}"`, () => {
      const args = [
        "git",
        "grep",
        "-l",
        "--fixed-strings",
        JSON.stringify(pattern),
        "--",
        ...PATHSPEC_EXCLUDES.map((e) => JSON.stringify(e)),
      ].join(" ");

      let stdout = "";
      try {
        stdout = execSync(args, {
          cwd: PLUGIN_ROOT,
          encoding: "utf8",
        });
      } catch (err) {
        // git grep exits 1 when nothing matches — the desired state.
        if (err.status === 1) {
          stdout = "";
        } else {
          throw err;
        }
      }
      const hits = stdout.trim().split("\n").filter(Boolean);
      assert.deepEqual(
        hits,
        [],
        `Retired path "${pattern}" still referenced in:\n  ${hits.join("\n  ")}`,
      );
    });
  }
});
