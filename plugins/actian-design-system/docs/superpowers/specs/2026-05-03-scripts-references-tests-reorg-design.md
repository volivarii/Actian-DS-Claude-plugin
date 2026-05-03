# Scripts + References + Tests reorganization — Design

**Date:** 2026-05-03
**Status:** Approved (brainstorming complete; awaiting implementation plan)
**Branch (target):** `refactor/repo-organization` (3 PRs)
**Plugin version impact:** patch bumps — 1.62.1, 1.62.2, 1.62.3

## Goal

Reorganize `scripts/`, `references/`, and `tests/` so that file purpose is legible at a glance and adding new artifacts has an obvious home. Today the project has 32 flat files in `scripts/`, 15 flat .md files in `references/` (alongside 5 already-organized skill subdirs), and 38 flat files in `tests/`. Cryptic names like `intent-resolver.js`, `scope-aware-runner.js`, `fingerprint-schema.js` make the project hard to onboard onto. The user explicitly cited "easy maintenance and future updates/upgrades" as the driver.

This spec covers structural moves only. File renames, structural enforcement (tests), and reorg of other top-level dirs (`agents/`, `skills/`, etc.) are out of scope.

## Decisions established during brainstorming

1. **Organizational principle (C — hybrid):** type-at-root, purpose subdirs in `scripts/`, skill subdirs in `references/`. Plus a top-level `ARCHITECTURE.md` mapping skill → all artifact locations. Compatible with how Claude Code's plugin loader resolves `skills/`, `agents/`, `commands/`, `hooks/`.
2. **`scripts/` granularity (B — medium, 8 buckets):** `hooks/`, `sync/`, `validation/`, `renderers/`, `transformers/`, `foundations/`, `changelog/`, `lib/`. Renames deferred.
3. **`references/` (A — full split):** add 3 cross-cutting subdirs (`figma/`, `ds-rules/`, `context/`); preserve all existing skill subdirs even when thinly populated.
4. **Scope (B):** `scripts/` + `references/` + `tests/`. Other top-level dirs untouched.
5. **Maintenance mechanism (A+D):** `ARCHITECTURE.md` + a "Where things go" section in `CLAUDE.md`. No per-subdir READMEs, no structural enforcement tests.
6. **Sequencing (B):** three sequential PRs, smallest blast radius first.

## Final structure

### `scripts/` — 8 purpose buckets

```
scripts/
  hooks/         allow-internal-reads.sh, check-bare-node.sh, check-output-path.sh,
                 check-server-dir.sh, check-update.sh, execute-figma-call.sh
  sync/          sync-from-figma.js, sync-fm-to-ds-map.js, figma-rest.js,
                 sync-check.sh, fingerprint-schema.js
  validation/    validate-flow-data.js, validate-schema.js, component-property-rules.js
  renderers/     assemble-preview.js, preview-server.js, ensure-server.sh,
                 render-component-reference.js, html-renderers/
  transformers/  transform-to-hifi.js, fm-tree-to-flow-data.js, brief-sourcing.js,
                 merge-partials.js, transformers/, templates.json
  foundations/   derive-foundations.js, foundations.parser.json, foundations-parser/
  changelog/     changelog.js, changelog-classifier.js
  lib/           shared-constants.js, intent-resolver.js, resolve-unit.js, derive-scope.js,
                 scope-aware-runner.js, screen-id.js, snapshot-store.js, resolve-node.sh
```

### `references/` — 8 subdirs

```
references/
  figma/         figma-output, figma-push-patterns, parity-check, prototype-reference,
                 prototype-wiring, annotation-reference
  ds-rules/      component-instance-rules, library-gap-detection, layout-patterns,
                 fm-css-reference, quality-checklist, quality-tiers
  context/       app-context, companion-context, ux-patterns
  component-brief/         (4 files, unchanged)
  create-component/        (2 files, unchanged)
  design-audit/            (1 file, unchanged)
  generate-flow/           (2 files, unchanged)
  generate-presentation/   (2 files, unchanged)
```

### `tests/` — mirrors `scripts/` 1:1, plus `integration/`

```
tests/
  sync/          sync-from-figma.test.js, sync-fm-to-ds-map.test.js, figma-rest.test.js,
                 fingerprint-schema.test.js, sync-description-capture.test.js
  validation/    validate-flow-data.test.js, schema.test.js, component-property-rules.test.js
  renderers/     assemble-preview.test.js, flow-renderer.test.js, fm-html-map.test.js,
                 render-component-reference.test.js
  transformers/  transform-to-hifi.test.js, transform-registry.test.js,
                 transform-styles.test.js, fm-to-ds-map.test.js, brief-sourcing.test.js,
                 merge-partials.test.js
  foundations/   derive-foundations.test.js, derive-foundations.golden.test.js,
                 derive-scope.test.js
  changelog/     changelog.test.js, changelog-classifier.test.js
  lib/           intent-resolver.test.js, resolve-unit.test.js, scope-aware-runner.test.js,
                 screen-id.test.js, snapshot-store.test.js, shared-constants.test.js
  integration/   brief-recipes.test.js, brief-researcher-integration.test.js,
                 component-brief-flow.test.js, recipes.test.js, contract.test.js,
                 css-staleness.test.js, path-validation.test.js,
                 tier-integration.test.js, tier-schema.test.js
  fixtures/      (unchanged)
  snapshots/     (unchanged)
  package.json   (unchanged)
```

No `tests/hooks/` — shell guards aren't unit-tested.

## Maintenance artifacts

### `ARCHITECTURE.md` (new, plugin root)

Sections:
1. **Top-down map** — each top-level dir's purpose, one line each.
2. **Skill-to-artifacts table** — for each user-facing skill (`/component-brief`, `/generate-flow`, `/generate-presentation`, `/create-component`, `/design-audit`, `/companion`, `/convert-to-hifi`, `/compare-flows`), one row listing skill file, agents, scripts, references, recipes, tests, schemas. Onboarding becomes a single grep.
3. **Directory conventions** — what goes in each `scripts/<bucket>/` and `references/<bucket>/`. One sentence per bucket.
4. **How to add a new skill** — checklist of artifact locations.

### `CLAUDE.md` — new "Where things go" section (~30 lines)

- Pointer to `ARCHITECTURE.md` as source of truth.
- Decision rules: "shared utility used by ≥2 skills → `scripts/lib/`; bound to a specific concern → its bucket."
- "New skill? Copy the structure: `skills/<name>/SKILL.md`, `references/<name>/`, etc."

## PR sequence

| # | PR | Files moved | Ref updates | Risk |
|---|----|---|---|---|
| 1 | `refactor: references reorg + ARCHITECTURE.md scaffold + CLAUDE.md "where things go"` | 15 .md moves into 3 new subdirs, 1 new `ARCHITECTURE.md` | 17 ref updates across skills + CLAUDE.md | Pure docs — no code paths affected |
| 2 | `refactor: scripts reorg into 8 purpose buckets` | ~32 files into 8 subdirs (incl. `git mv` of existing `html-renderers/`, `transformers/`, `foundations-parser/`) | 9 internal refs incl. `hooks/hooks.json` (5 hook paths), skill imports, agent imports, schema refs | Hooks must update atomically; full test run required |
| 3 | `refactor: tests reorg to mirror scripts buckets` | ~38 test files into 7 subdirs + `integration/` | `tests/package.json` glob if any | Test discovery only — `bun test` should still pick everything up |

Each PR bumps version (patch — pure refactor) and updates `ARCHITECTURE.md`.

## Edge cases

1. **`shared-constants.js`** is imported by ~10 scripts. Moving to `lib/` means many `require('./shared-constants')` → `require('../lib/shared-constants')` updates. Mechanical but the bulk of PR 2's diff.
2. **`hooks/hooks.json`** has 5 hardcoded `scripts/check-*.sh` paths — must update atomically in PR 2.
3. **`scripts/templates.json`** lives under `transformers/` — it's data consumed by transformer code, not standalone.
4. **`fingerprint-schema.js`** placed in `sync/` (consumed by `sync-from-figma.js`). Open to relocating if other usage emerges.
5. **Cross-cutting test files** (`recipes.test.js`, `tier-*.test.js`, `contract.test.js`, `css-staleness.test.js`, `path-validation.test.js`, `brief-recipes.test.js`, `component-brief-flow.test.js`, `brief-researcher-integration.test.js`) → `tests/integration/`.
6. **`schema.test.js`** tests JSON schemas → `tests/validation/` (paired with `validate-schema.js`).
7. **`derive-foundations` triplet** — `derive-foundations.js` + `foundations.parser.json` + `foundations-parser/` co-locate under `scripts/foundations/`.

## Verification per PR

- **PR 1:** `bun test` — should pass identically; manually open 3-4 skill files to confirm references render. Visual diff: `git diff --stat`.
- **PR 2:** `bun test` — full suite. Manually exercise one PreToolUse hook (e.g., trigger `check-output-path.sh` by attempting an Edit on a non-project path). Confirm `/component-brief` runs end-to-end (smoke).
- **PR 3:** `bun test` — full suite. Confirm test discovery picks up all 38 files (compare pre/post test counts in CI output).

## Out of scope / explicitly deferred

- File renames (e.g., `intent-resolver.js` → clearer name) — deferred to a later pass once new locations have settled.
- Reorg of `agents/`, `skills/`, `templates/`, `recipes/`, `schemas/`, `evals/`, `examples/`, `release-notes/` — left as-is.
- Per-subdir `README.md` files — explicitly skipped (drift risk outweighs local-context value at this size).
- Structure-enforcement tests — explicitly skipped ("not really necessary at this point" per Vincent 2026-05-03).
- MD-as-SoT Wave 2, FM Kit alignment, anatomy card redesign — unrelated; tracked separately.

## Open questions (for the implementation-plan stage)

- Does the plugin's marketplace metadata (`plugin.json`, etc.) reference any specific `scripts/` or `references/` paths? If yes, add those to the PR-2 ref-update list.
- Are there any test-runner globs in `tests/package.json` or root config that need updating once `tests/` gains subdirs?
- Should ARCHITECTURE.md be authored before PR 1 (as a scaffold) and grow per PR, or written in full upfront and committed in PR 1? Lean: scaffold first, grow per PR — keeps it accurate.
