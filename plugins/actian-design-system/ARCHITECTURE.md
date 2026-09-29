# Actian Design System Plugin — Architecture

This document is the canonical map of the plugin. If you're onboarding,
debugging, or adding a new artifact, start here.

The test suite is not in this directory: it lives at `tests/` at the repository
root, next to `plugins/`, so an installed plugin does not carry it (see section 3).

---

## 1. Top-down map

| Directory | Purpose |
|---|---|
| `.claude-plugin/` | Plugin manifest (`plugin.json`) — name, version, marketplace metadata. |
| `commands/` | (none currently — slash commands are co-located with skills) |
| `vendor/` | Vendored snapshot of `volivarii/actian-ds-knowledge`: design docs (`foundations/`, `content/`, `accessibility/`), merged per-component multi-domain guideline docs (`components/dist/guidelines/`, resolved via `PATHS.components.guidelineDoc.byKey`; the scraped `components/src/guidelines/` layer was retired in Phase 5, knowledge v0.11.0), component registries (`components/dist/registries/`), tokens (`tokens/`), app context (`app-context/`). Refreshed nightly via `vendor-snapshot.yml`. Treat as read-only: edits belong upstream. |
| `hooks/` | `hooks.json` — PreToolUse/PostToolUse hooks wired to the shell guards in `scripts/hooks/`. |
| `release-notes/` | Per-version markdown release notes (gitignored). |
| `schemas/` | JSON Schemas (`flow-data.schema.json`, `proposal-data.schema.json`, `proposal-evaluation.schema.json`). |
| `scripts/` | Node + shell scripts in purpose buckets (see section 3). |
| `skills/` | One subdir per user-facing skill, each with a `SKILL.md`. |
| `templates/` | `proposal-document.html`, the proposal document's page. |
| `../../tests/` | The test suite, at the repository root (moved out of the plugin on 2026-09-22, plugin #415). `npm test` runs from the repository root. |
| `vendored.json` | Pinned knowledge-repo SHA + sync metadata for the current vendor snapshot. |

---

## 2. Skill → artifacts

Each row is a user-facing skill (slash command). Use this table to find every file related to a skill.

| Skill | SKILL.md | Beside the card | Scripts the card runs | Schemas | Templates |
|---|---|---|---|---|---|
| `/actian-ux` | `skills/actian-ux/SKILL.md` | (none) | (none) | (none) | (none) |
| `/actian-ux-proposal` | `skills/actian-ux-proposal/SKILL.md` | (none) | `scripts/renderers/assemble-preview.js --type proposal`, `scripts/renderers/assemble-intent.js`, `scripts/validation/validate-proposal.js`, `scripts/validation/check-handover.js intent` | `schemas/proposal-data.schema.json` | `templates/proposal-document.html` |
| `/actian-ux-prototype` | `skills/actian-ux-prototype/SKILL.md` | `prototype-files.md` (the screen list, the brief, the four author files, every `check-direct` finding), `figma-screen.md` (the screen JSON the push takes) | `scripts/lib/app-context/prepare-flow.js --direct`, `scripts/renderers/assemble-direct.js`, `scripts/validation/check-direct.js`, `scripts/renderers/look-direct.js`, `scripts/renderers/figma-screen.js`, `scripts/validation/check-handover.js specs` | `schemas/flow-data.schema.json` (a screen JSON is one `screens[]` entry) | (none) |
| `/actian-ux-audit` | `skills/actian-ux-audit/SKILL.md` | `figma-api-traps.md`, `evidence-and-fixes.md` | `scripts/lib/a11y/resolve-a11y.js`, `scripts/validation/check-handover.js specs` | (none) | (none) |

The prototype's direct route runs on six scripts: `scripts/lib/app-record.js` (the app's header and side navigation as the vendored app record writes them, read by the brief, the frame and `check-direct.js`), `scripts/lib/app-context/direct-brief.js` (the `direct` block of the brief `prepare-flow.js` writes: every vendored file the author needs, by absolute path), `scripts/renderers/assemble-direct.js` with `scripts/renderers/direct-shell.js` (the four author files into one self-contained page: the app frame through the flow renderer, icons, layer docking, the step strip and its runtime), `scripts/validation/check-direct.js` (the findings `prototype-files.md` lists) and `scripts/renderers/look-direct.js` (a screenshot of every step at two widths, exit 2 when no browser answers).

The handover to engineering has two scripts: `scripts/renderers/assemble-intent.js` (the PM's `intent.md` from the proposal data, the same source as the proposal document) and `scripts/validation/check-handover.js` (`intent.md` and `specs.md` against the knowledge's templates in `app-context/src/handover/`). Until the knowledge ships those templates, both print `template not vendored yet` and exit 2.

Behind `assemble-preview.js --type proposal` sit `scripts/renderers/assemble-proposal.js` (the document) and `scripts/renderers/proposal-breadboard.js` (the terrain, one inline SVG the assembler computes from `breadboard.places[]` and `breadboard.connections[]`; no script, no external load, legible in greyscale).

The retired skills (`/generate-presentation`, `/convert-to-hifi`, `/compare-flows`, `/component-brief`, `/create-component`) are recorded in `MIGRATIONS.md` and the CHANGELOG; git history holds their code (`git log --diff-filter=D`).

> **`/sync-design-system` was decommissioned in Federation Phase 1.5 (v1.79.0).** DS knowledge now lives in [`volivarii/actian-ds-knowledge`](https://github.com/volivarii/actian-ds-knowledge) and is vendored into `plugins/actian-design-system/vendor/` via the `vendor-snapshot.yml` workflow (nightly cron + manual). The knowledge repo's CI runs the Figma sync.

---

## 3. Directory conventions

### Skill files

- A file a card needs sits beside it in `skills/<name>/`. The knowledge carries the detail, so no doc restates it.

### `scripts/` subdirs

- `hooks/` — PreToolUse / PostToolUse shell guards (one `.sh` each). Wired in `hooks/hooks.json`. New PreToolUse guards go here.
- `vendor/` — Vendor-snapshot tooling. `vendor-snapshot.js` is a thin entry (plugin config + CLI shell + the component-mirror `postVendorHook`) over `vendor-snapshot-core.js` — a byte-identical copy of the substrate's canonical `vendor/clients/vendor-snapshot.js`, drift-guarded by `tests/vendor/vendor-snapshot-core-drift.test.js`. It pulls a pinned snapshot from `volivarii/actian-ds-knowledge` into `vendor/`. New vendor-pipeline code goes here.
- `validation/`: the checks the cards run (`check-direct.js`, `check-handover.js`, `validate-proposal.js`), the hand-rolled `validate-schema.js`, and `component-property-rules.js`. New validators go here.
- `fidelity/`: `render-leaf.js` (headless-Chrome screenshot via `screenshotArgs`, which `look-direct.js` uses) and `resolve-binaries.js` (system Chrome via `CHROME_BIN`).
- `quality/`: `run-suite.sh`, the test runner `npm test` calls; it fails a run that crashed on load or ran nothing.
- `renderers/`: HTML output. `assemble-direct.js` with `direct-shell.js` (the prototype page), `look-direct.js` (its screenshots), `assemble-preview.js --type proposal` over `assemble-proposal.js` and its `proposal-breadboard.js` terrain (inline SVG computed at assembly time, so the document stays offline and scriptless), `assemble-intent.js`, the local preview server, and `render-component-reference.js` (called post-vendor-pull to regenerate `*-components.md` mirrors). The `html-renderers/` adapters include `flow-renderer.js` (draws the app frame the prototype's content sits in), `render-node.js` (HTML structural renderer) and its deterministic Figma twin `render-node-figma.js` (emits a `use_figma`-ready Plugin-API script from the same `content[]` spec; pinned by `tests/renderers/twin-parity-emit.test.js`). `figma-screen.js` is the push command in front of it: one screen JSON in, the screen tree with tokens resolved in the app's theme, Plugin-API script out. A node carrying `library:"ds"` renders through `ds-html-map.js` and `ds-base.css` (styles bound to `--zen-*` tokens); gated by `token-resolution` and `golden-snapshot`. See `html-renderers/SEAM.md`.
> **Removed in Federation Phase 1.5 (v1.79.0):** `sync/`, `foundations/` — moved to `volivarii/actian-ds-knowledge` CI.
- `lib/`: shared utilities (paths, the renderer loader, the app record, the terminology checks, constants, screen ids, the version bumper, the Node binary resolver). New shared utilities go here.
  - `lib/app-context/`: `prepare-flow.js` (the prototype's brief from the screen list: each step's declared pattern, its components and its capture, the flow's step ids, layers and exits, the rail and header from `lib/app-record.js`; `--direct` is accepted and changes nothing) and `direct-brief.js` (the brief's `direct` block).
  - `lib/a11y/` — `scripts/lib/a11y/resolve-a11y.js` resolves per-component accessibility rulesets (WCAG criteria + prose rules) from `graph.json` + `accessibility.bundle.json`: for a component slug it unions the component's own a11y section (its graph `a11y_ref` edge) with its category's cross-cutting sections. Exposes a `resolveA11y(slugs, opts)` function (injection seam: `opts.graph`/`opts.bundle`) + a `--slugs <slug,slug,...>` CLI. Consumed by the `actian-ux-audit` skill's Accessibility check.

### `tests/` subdirs (at the repository root)

The suite lives at `<repo>/tests/`, not under the plugin: a plugin install copies every tracked file under `plugins/actian-design-system/`, and 2.3 MB of tests (352 tracked files) shipped to every user for nothing until 2026-09-22 (plugin #415). Tests reach the plugin through `path.resolve(__dirname, "..", "..", "plugins", "actian-design-system")` and `require("../../plugins/actian-design-system/scripts/...")`; `npm test` runs from the repository root, where `package.json` now lives; `scripts/quality/run-suite.sh` climbs out of the plugin to find the tree.

Tests mirror `scripts/` 1:1 — open `scripts/<bucket>/foo.js`, the test lives at `tests/<bucket>/foo.test.js`. Plus a cross-cutting `integration/` bucket for tests that exercise multiple scripts/skills.

- `validation/`, `renderers/`, `lib/`, `fidelity/`, `vendor/`: unit tests for the corresponding `scripts/<bucket>/` modules.
- `integration/`: cross-cutting tests not bound to a single script: the kept tools load, the cards' contracts, schema shape, path-validation across the whole tree, CSS-staleness checks, brief-flow end-to-end, etc. New tests that span ≥2 buckets go here. Two vendor-path guards live in `tests/integration/`: `no-bare-vendor-paths.test.js` (code must use `PATHS`, not literals) + `vendor-paths-resolve.test.js` (every `vendor/…` reference in prose/code, in skills and scripts, plus the plugin's own docs: `CLAUDE.md`, `ARCHITECTURE.md`, `README.md`, `docs/`, must resolve). See CLAUDE.md "Knowledge access".
- `fixtures/` — shared test fixtures (unchanged location; tests reach via `__dirname/../fixtures/...`).
- `helpers/` — shared test helpers.
- Golden snapshot files live beside their tests, in `renderers/__goldens__/`.

No `tests/hooks/` — shell guards aren't unit-tested.

---

## 4. How to add a new skill

1. `mkdir skills/<name>`; create `skills/<name>/SKILL.md` (use an existing skill as a template).
2. If the card needs a file of its own, put it beside the card in `skills/<name>/`.
3. If it has structured data outputs, add a JSON Schema to `schemas/<name>-data.schema.json`.
4. If it has HTML/JSON templates, add files under `templates/`.
5. Add tests under `tests/` at the repository root (cross-cutting ones in `tests/integration/`).
6. Update this `ARCHITECTURE.md` Section 2 with the new row.
7. Bump version in `.claude-plugin/plugin.json` (calendar `YYYY.MM.PATCH`, see CLAUDE.md "Versioning").
