# Actian Design System Plugin — Architecture

This document is the canonical map of the plugin. If you're onboarding,
debugging, or adding a new artifact, start here.

Structure conventions (`scripts/`, `tests/`) will be filled in as PRs 2
and 3 of the reorganization sprint land. The `references/` and skill
sections below are authoritative as of v1.62.1.

---

## 1. Top-down map

| Directory | Purpose |
|---|---|
| `.claude-plugin/` | Plugin manifest (`plugin.json`) — name, version, marketplace metadata. |
| `agents/` | Subagents dispatched by skills. One `.md` per agent. |
| `commands/` | (none currently — slash commands are co-located with skills) |
| `vendor/` | Vendored snapshot of `volivarii/actian-ds-knowledge` — design docs (`foundations/`, `content/`, `accessibility/`), merged per-component multi-domain guideline docs (`components/dist/guidelines/`, resolved via `PATHS.components.guidelineDoc.byKey`; the scraped `components/src/guidelines/` layer was retired in Phase 5, knowledge v0.11.0), component registries (`components/dist/registries/`), tokens (`tokens/`), app context (`app-context/`). Refreshed nightly via `vendor-snapshot.yml`. Treat as read-only — edits belong upstream. (The FM↔DS map + presentation guide are no longer vendored — they were evicted to the plugin in Track E; the FM↔DS map now lives at `references/convert-to-hifi/fm-to-ds-map.json`.) |
| `examples/` | Reference outputs for skills (sample flows, briefs, presentations). |
| `evals/` | Eval suites for skills. |
| `hooks/` | `hooks.json` — PreToolUse/PostToolUse hooks wired to scripts under `scripts/` (will move to `scripts/hooks/` in PR-2). |
| `recipes/` | Per-skill JSON recipes (`brief/`, `flow/`, `presentation/`). |
| `references/` | Reference docs split into cross-cutting subdirs (`figma/`, `ds-rules/`, `context/`) and per-skill subdirs. |
| `release-notes/` | Per-version markdown release notes (gitignored). |
| `schemas/` | JSON Schemas (`brief-data.schema.json`, etc.). |
| `scripts/` | Node + shell scripts. PR-2 will reorganize into purpose buckets. |
| `skills/` | One subdir per user-facing skill, each with a `SKILL.md`. |
| `templates/` | Per-skill HTML/JSON templates. |
| `tests/` | Bun test suite. PR-3 will mirror `scripts/` structure. |
| `vendored.json` | Pinned knowledge-repo SHA + sync metadata for the current vendor snapshot. |

---

## 2. Skill → artifacts

Each row is a user-facing skill (slash command). Use this table to find every file related to a skill.

| Skill | SKILL.md | Agents | Recipes | Templates | Schemas | References (skill-specific) | Cross-cutting refs used |
|---|---|---|---|---|---|---|---|
| `/component-brief` | `skills/component-brief/SKILL.md` | `agents/{card-generator,brief-researcher,brief-data-validator,parity-analyzer}.md` | `recipes/brief/` | (none) | `schemas/brief-data.schema.json` | `references/component-brief/` | `references/figma/{figma-output,figma-push-patterns,parity-check}.md`, `references/ds-rules/quality-tiers.md` |
| `/generate-flow` | `skills/generate-flow/SKILL.md` | `agents/{screen-generator,flow-consistency,flow-researcher,wiring-analyzer,parity-analyzer}.md` | `recipes/flow/` | `templates/flow-*.html` (incl. `flow-prototype-wrapper.html` — two-view Prototype + Overview shell used by `--type flow-share`); `templates/vendor/alpinejs-3.14.9.min.js` (MIT, inlined into the deliverable) | (none) | `references/generate-flow/` | `references/figma/*`, `references/ds-rules/{layout-patterns,quality-checklist,quality-tiers}.md`, `references/context/{app-context,ux-patterns}.md` |
| `/generate-presentation` | `skills/generate-presentation/SKILL.md` | `agents/{slide-generator,parity-analyzer}.md` | `recipes/presentation/` | `templates/presentation-*.html` | (none) | `references/generate-presentation/` | `references/figma/{figma-push-patterns,parity-check,figma-output}.md`, `references/ds-rules/{quality-checklist,quality-tiers}.md`, `references/context/app-context.md` |
| `/create-component` | `skills/create-component/SKILL.md` | (none) | (none) | (none) | (none) | `references/create-component/` | `references/figma/{figma-output,figma-push-patterns,parity-check}.md`, `references/ds-rules/{fm-css-reference,quality-checklist,quality-tiers}.md` |
| `/design-audit` | `skills/design-audit/SKILL.md` | `agents/parity-analyzer.md` | (none) | (none) | (none) | `references/design-audit/` | `references/figma/{figma-output,parity-check}.md`, `references/ds-rules/quality-checklist.md` |
| `/companion` | `skills/companion/SKILL.md` | (none) | (none) | (none) | (none) | (none) | `references/figma/figma-output.md`, `references/context/{companion-context,ux-patterns}.md` |
| `/convert-to-hifi` | `skills/convert-to-hifi/SKILL.md` | (none) | (none) | (none) | (none) | (none) | `references/figma/{figma-output,figma-push-patterns}.md`, `references/ds-rules/component-instance-rules.md` |
| `/compare-flows` | `skills/compare-flows/SKILL.md` | (none) | (none) | (none) | (none) | (none) | `references/figma/figma-output.md`, `references/ds-rules/quality-checklist.md` |

> **`/sync-design-system` was decommissioned in Federation Phase 1.5 (v1.79.0).** DS knowledge now lives in [`volivarii/actian-ds-knowledge`](https://github.com/volivarii/actian-ds-knowledge) and is vendored into `plugins/actian-design-system/vendor/` via the `vendor-snapshot.yml` workflow (nightly cron + manual). The knowledge repo's CI runs the Figma sync.

---

## 3. Directory conventions

### `references/` subdirs

- `figma/` — Workflow docs about reading from / writing to Figma. Push patterns, screenshot rules, prototype wiring, parity checks. New "how to talk to Figma" docs go here.
- `ds-rules/` — Design system constraints. Component instance rules, layout grids, quality gates, FM-Kit CSS variables. New rules-of-the-system docs go here.
- `context/` — Knowledge bases consumed by multiple skills as background. Apps + entities + terminology, UX pattern catalogs. New "what does the user know" docs go here.
- `<skill-name>/` — Skill-specific reference docs. Schema docs, push patterns unique to that skill, playgrounds. One subdir per skill that has its own reference material.

### When to add a new skill subdir under `references/`

- Skill has ≥1 .md of skill-specific reference material → add `references/<skill-name>/`
- Skill only consumes cross-cutting docs → no subdir needed
- Don't preempt: only create the subdir when there's a file to put in it.

### `scripts/` subdirs

- `hooks/` — PreToolUse / PostToolUse shell guards (one `.sh` each). Wired in `hooks/hooks.json`. New PreToolUse guards go here.
- `vendor/` — Vendor-snapshot tooling. `vendor-snapshot.js` is a thin entry (plugin config + CLI shell + the component-mirror `postVendorHook`) over `vendor-snapshot-core.js` — a byte-identical copy of the substrate's canonical `vendor/clients/vendor-snapshot.js`, drift-guarded by `tests/vendor/vendor-snapshot-core-drift.test.js`. It pulls a pinned snapshot from `volivarii/actian-ds-knowledge` into `vendor/`. New vendor-pipeline code goes here.
- `validation/` — Pipeline validators (banned text, tokens, terminology, schema, avoid-word soft-check from `vendor/content/dist/words-to-avoid.json`). New validators go here.
- `renderers/` — HTML/preview output. `assemble-preview.js` (supports `--type flow-share` — the canonical generate-flow deliverable: a self-contained two-view `flows/[feature].html` offline file; and `--type flow` — an internal renderer used during pipeline preview, not the canonical output). Figma push is opt-in via `--push` / `--no-push` (default: no push). Also hosts the local preview server, the `html-renderers/` adapters, and `render-component-reference.js` (called post-vendor-pull to regenerate `*-components.md` mirrors). The `html-renderers/` adapters include `render-node.js` (HTML structural renderer) and its deterministic Figma twin `render-node-figma.js` (emits a `use_figma`-ready Plugin-API script from the same `content[]` spec; pinned by `tests/renderers/twin-parity-emit.test.js`). The INSTANCE seam in `render-node.js` dispatches two HTML tiers: lo-fi **fatmarker** (`fm-html-map.js`) and hi-fi **DS** (`ds-html-map.js` + `ds-base.css`, selected when a node carries `library:"ds"`; styles 100% bound to `--zen-*` tokens). Hi-fi is a mode of the `flow-share` deliverable (ds-base.css inlined via `FLOW_CSS`); gated by `token-resolution`, `ds-coverage`, and `golden-snapshot`. See `html-renderers/SEAM.md`.
- `transformers/` — Data shape transformations between source formats (Figma → flow-data, flow-data → hifi, recipe partials → final).
- `evals/` — Eval lane scripts (component-brief: grading-assertions, grade-locally, run-component-brief).

> **Removed in Federation Phase 1.5 (v1.79.0):** `sync/`, `foundations/`, `changelog/` — moved to `volivarii/actian-ds-knowledge` CI.
- `lib/` — Shared utilities used by 2+ scripts (constants, ID stamping, scope derivation, snapshot store, intent resolver, unit resolver, Node binary resolver). New shared utilities go here.
- `office/` — Python Office-document renderer (engine + mappers + dispatcher). Consumes the medium-agnostic data models (`slide-data.json` now; `brief-data`/`audit-data` later) and emits branded `.pptx`/`.docx`. Brand assets in `assets/office/`; reference docs in `references/office/`. Invoked opt-in from skills via `scripts/lib/resolve-python.sh` + `render-office.py`.

### `tests/` subdirs

Tests mirror `scripts/` 1:1 — open `scripts/<bucket>/foo.js`, the test lives at `tests/<bucket>/foo.test.js`. Plus a cross-cutting `integration/` bucket for tests that exercise multiple scripts/skills.

- `sync/`, `validation/`, `renderers/`, `transformers/`, `foundations/`, `changelog/`, `lib/` — unit tests for the corresponding `scripts/<bucket>/` modules.
- `integration/` — cross-cutting tests not bound to a single script: recipe shape contracts, schema/tier integration, path-validation across the whole tree, CSS-staleness checks, brief-flow end-to-end, etc. New tests that span ≥2 buckets go here. Two vendor-path guards live in `tests/integration/`: `no-bare-vendor-paths.test.js` (code must use `PATHS`, not literals) + `vendor-paths-resolve.test.js` (every `vendor/…` reference in prose/code — skills, references, agents, scripts, plus the plugin's own docs: `CLAUDE.md`, `ARCHITECTURE.md`, `README.md`, `docs/` — must resolve). See CLAUDE.md "Knowledge access".
- `fixtures/` — shared test fixtures (unchanged location; tests reach via `__dirname/../fixtures/...`).
- `snapshots/` — golden snapshot files (unchanged location).

No `tests/hooks/` — shell guards aren't unit-tested.

---

## 4. How to add a new skill

1. `mkdir skills/<name>`; create `skills/<name>/SKILL.md` (use an existing skill as a template).
2. If it needs an agent, add `agents/<agent-name>.md`.
3. If it needs reference docs, add `references/<name>/`.
4. If it has structured data outputs, add a JSON Schema to `schemas/<name>-data.schema.json`.
5. If it has recipes, add `recipes/<name>/`.
6. If it has HTML/JSON templates, add files under `templates/`.
7. Add tests under `tests/` (PR-3 will create the integration/ subdir for cross-cutting tests).
8. Update this `ARCHITECTURE.md` Section 2 with the new row.
9. Bump version in `.claude-plugin/plugin.json`.
