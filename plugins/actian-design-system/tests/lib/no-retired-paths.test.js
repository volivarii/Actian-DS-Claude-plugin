"use strict";

// Regression guard for retired path/identifier patterns. Two retirement
// waves are guarded here — see each PATTERNS block below for what and why.
//
// The vendor/ tree mirrors upstream, so it's exempt — vendor cleanup happens
// on its own downstream cadence after the source-repo retirement merges.
// This test, CLAUDE.md, and release-notes are exempt because they reference
// the retired strings descriptively.

const test = require("node:test");
const assert = require("node:assert/strict");
const { execSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const PLUGIN_ROOT = path.resolve(__dirname, "..", "..");

// git pathspec excludes — vendor (mirrors upstream), this test, descriptive
// docs, and release notes. Keep this list narrow; anything else MUST migrate.
const PATHSPEC_EXCLUDES = [
  ":(exclude)vendor",
  ":(exclude)tests/lib/no-retired-paths.test.js",
  ":(exclude)CLAUDE.md",
  ":(exclude)release-notes",
];

function liveReferencesTo(pattern) {
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
  return stdout.trim().split("\n").filter(Boolean);
}

function guardPatterns(label, patterns) {
  test(label, async (t) => {
    for (const pattern of patterns) {
      await t.test(`no live references to "${pattern}"`, () => {
        const hits = liveReferencesTo(pattern);
        assert.deepEqual(
          hits,
          [],
          `Retired path "${pattern}" still referenced in:\n  ${hits.join("\n  ")}`,
        );
      });
    }
  });
}

// Phase 5 — retire the transitional guideline layer. The retirement is dated
// 2026-05-15. The substitutes are:
//
//   vendor/components/src/guidelines/<x>.json  →  vendor/components/dist/guidelines/<x>.json
//   vendor/content/dist/content.md             →  vendor/content/dist/global.md
//                                                  (+ per-component domains.content in the guideline doc)
guardPatterns(
  "Phase 5 — retired transitional-layer paths must not appear in live code",
  ["vendor/components/src/guidelines/", "vendor/content/dist/content.md"],
);

// Group C (commit 2fb25ccd) — retire the slug→html anatomy-tree renderer
// (renderAnatomy()/renderNode()/tokenDecls) and its supply surface. It is
// superseded by appearance-render.js's captured-appearance renderer
// (Phase 1B): the default: seam now either renders an appearance doc via
// renderAppearanceComponent or falls straight to gracefulChip() — no
// anatomy-render.js / legacy-map fallback exists in between. Path b
// (resolveRootTokenStyle / token-injection, via anatomy-render.js) was a
// separate, unrelated mechanism at the time of Group C; it is retired on its
// own schedule by the Task A3 guard below (narrower on purpose, see that
// guard's own comment for why it doesn't use guardPatterns()/liveReferencesTo
// here).
guardPatterns(
  "Group C — retired slug→html anatomy path must not reappear in live code",
  [
    "window.__dsAnatomyMap",
    "setAnatomyMap(",
    "_serverAnatomyMap",
    "buildDsAnatomyMap(",
  ],
);

// Task A3 (branch feat/retire-tag-default-path-b): retire the path-b
// sidecar-reading chain that anatomy-render.js orchestrated (loadTokenBindings,
// pickBinding, resolveTokenDecls, resolveRootTokenStyle). Task A2 already
// stopped ds-anatomy-map.js's buildDsVariantStyleMap from calling
// resolveRootTokenStyle, so these four had no remaining production caller.
//
// This guard checks anatomy-render.js's own source text rather than using
// guardPatterns()/liveReferencesTo() above: two sibling test files
// (ds-token-bindings.test.js, ds-token-join-deliverable.test.js) still
// reference these identifiers and are retired in the next task, so a
// whole-tree git-grep guard would false-positive here. Scoping to "is the
// function definition gone from the one file that used to define it" is the
// exact claim this task makes.
const RETIRED_PATH_B_FNS = [
  "resolveRootTokenStyle",
  "loadTokenBindings",
  "resolveTokenDecls",
  "pickBinding",
];

test("Task A3: path-b sidecar readers are gone from anatomy-render.js", () => {
  const src = fs.readFileSync(
    path.resolve(PLUGIN_ROOT, "scripts", "renderers", "anatomy-render.js"),
    "utf8",
  );
  RETIRED_PATH_B_FNS.forEach((id) => {
    assert.equal(
      src.indexOf(`function ${id}`),
      -1,
      `${id} still defined in anatomy-render.js`,
    );
  });
});
