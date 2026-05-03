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
| `docs/` | Source-of-truth design docs. `foundations.md`, `content-guidelines.md`, `accessibility-guidelines.md`, plus `component-guidelines/` (per-component MDs) and `generated/` (auto-derived JSON registries). |
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
| `tokens/` | DTCG design tokens (`actian-ds.tokens.json`). |

---

## 2. Skill → artifacts

Each row is a user-facing skill (slash command). Use this table to find every file related to a skill.

| Skill | SKILL.md | Agents | Recipes | Templates | Schemas | References (skill-specific) | Cross-cutting refs used |
|---|---|---|---|---|---|---|---|
| `/component-brief` | `skills/component-brief/SKILL.md` | `agents/{card-generator,brief-researcher,brief-data-validator,parity-analyzer}.md` | `recipes/brief/` | (none) | `schemas/brief-data.schema.json` | `references/component-brief/` | `references/figma/{figma-output,figma-push-patterns,parity-check}.md`, `references/ds-rules/quality-tiers.md` |
| `/generate-flow` | `skills/generate-flow/SKILL.md` | `agents/{screen-generator,flow-consistency,flow-researcher,wiring-analyzer,parity-analyzer}.md` | `recipes/flow/` | `templates/flow-*.html` | (none) | `references/generate-flow/` | `references/figma/*`, `references/ds-rules/{layout-patterns,quality-checklist,quality-tiers}.md`, `references/context/{app-context,ux-patterns}.md` |
| `/generate-presentation` | `skills/generate-presentation/SKILL.md` | `agents/{slide-generator,parity-analyzer}.md` | `recipes/presentation/` | `templates/presentation-*.html` | (none) | `references/generate-presentation/` | `references/figma/{figma-push-patterns,parity-check,figma-output}.md`, `references/ds-rules/{quality-checklist,quality-tiers}.md`, `references/context/app-context.md` |
| `/create-component` | `skills/create-component/SKILL.md` | (none) | (none) | (none) | (none) | `references/create-component/` | `references/figma/{figma-output,figma-push-patterns,parity-check}.md`, `references/ds-rules/{fm-css-reference,quality-checklist,quality-tiers}.md` |
| `/design-audit` | `skills/design-audit/SKILL.md` | `agents/parity-analyzer.md` | (none) | (none) | (none) | `references/design-audit/` | `references/figma/{figma-output,parity-check}.md`, `references/ds-rules/quality-checklist.md` |
| `/companion` | `skills/companion/SKILL.md` | (none) | (none) | (none) | (none) | (none) | `references/figma/figma-output.md`, `references/context/{companion-context,ux-patterns}.md` |
| `/convert-to-hifi` | `skills/convert-to-hifi/SKILL.md` | (none) | (none) | (none) | (none) | (none) | `references/figma/{figma-output,figma-push-patterns}.md`, `references/ds-rules/component-instance-rules.md` |
| `/compare-flows` | `skills/compare-flows/SKILL.md` | (none) | (none) | (none) | (none) | (none) | `references/figma/figma-output.md`, `references/ds-rules/quality-checklist.md` |
| `/sync-design-system` | `skills/sync-design-system/SKILL.md` | (none) | (none) | (none) | (none) | (none) | `references/figma/figma-output.md` |

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

### `scripts/` and `tests/`

These will be filled in by PRs 2 and 3 of the reorg.

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
