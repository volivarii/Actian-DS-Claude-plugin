# Authoring category defaults

This directory holds **Phase 2 v2** per-category structural defaults for component briefs. One MD file per category captures the structural skeleton (anatomy, variant axes, motion + accessibility refs) that every component in the category inherits. The Actian DS plugin merges these into briefs for stub (uncurated) components so they ship with a meaningful baseline instead of empty cards.

This guide is for the **Design system lead** and **Content lead**. Engineers seeded the initial drafts; ongoing refinement is your job.

## One file per category

Six categories, one MD file each. Filenames match the `slug` in frontmatter.

| File | Figma category label |
|---|---|
| `action.md` | Action |
| `form-input-selection.md` | Form (input & selection) |
| `navigation.md` | Navigation |
| `data-display.md` | Data Display |
| `feedback.md` | Feedback |
| `overlays.md` | Overlays |

Membership lists are derived from `components/dist/categories.json` (auto-synced from the Figma Pages panel). If a member moves to a different category in Figma, the membership list reshuffles automatically — but you may want to update the rationale prose in the MD body.

## Required frontmatter schema

Every MD must start with YAML frontmatter. The contract is `schemas/category-defaults.json`; the parser in `scripts/categories/categories-parser.js` validates against it.

```yaml
---
_schema_version: 2
slug: <kebab-case, must match filename>
label: <Figma category label, human-readable>
authoring_status: engineer-seed | team-reviewed | team-authored
confidence:
  anatomy: low | medium | high
  variants: low | medium | high
  motion: low | medium | high
  a11y: low | medium | high
last_reviewed: YYYY-MM-DD

anatomy:
  - { name: <Title Case part name>, description: <one-sentence description> }
  - ... (minimum 2 entries)

variants:
  - { axis: <Title Case axis name>, values: [<value-1>, <value-2>, ...] }
  - ... (minimum 1 axis, each with min 2 values)

motion_refs:
  - { ref: <slug from foundations/dist/tokens/motion.json patterns>, note: <optional override> }
  - ... (minimum 1)

a11y_refs:
  - { ref: <slug from accessibility/dist/a11y-index.json sections>, note: <optional override> }
  - ... (3 to 8 entries)
---
```

After the closing `---`, the body is **freeform Markdown** — design rationale, cross-DS references, notes to future refining authors. It is NOT parsed; it carries the WHY.

## `authoring_status` state machine

Three states. Move forward as confidence grows.

| State | Meaning | Who flips |
|---|---|---|
| `engineer-seed` | AI-drafted initial pass; cross-DS lift only | Engineer (initial) |
| `team-reviewed` | Design-system lead has reviewed + accepted | Design-system lead |
| `team-authored` | Owned by the design-system lead end-to-end | Design-system lead |

There is no rollback path in code — a downgrade just means lowering individual `confidence` levels.

## `confidence` levels per card

Each of the four cards (`anatomy`, `variants`, `motion`, `a11y`) has its own confidence. Tools downstream may downweight low-confidence defaults — e.g. the plugin's brief skill MAY surface a "low confidence — verify with team" note when surfacing low-confidence content.

| Level | When to use |
|---|---|
| `low` | Speculative; category fit uncertain; expect this to change |
| `medium` | Cross-DS lift; reasonable starting point; team should validate |
| `high` | Refs an authoritative internal source (motion patterns, a11y sections) or the team has signed off |

## Cross-refs by slug

Motion and accessibility entries do **not** quote names directly — they reference upstream sources by slug. This protects against name drift.

**Motion**: slugs come from `foundations/dist/tokens/motion.json` → `patterns.<key>.slug`. Currently valid:

- `drawer-open-close`
- `accordion-expand-collapse`
- `success-toast`
- `anchor-motion`
- `layered-overlays-modals`
- `skeleton-loading`
- `staggered-entrance`
- `state-transitions`

**Accessibility**: slugs come from `accessibility/dist/a11y-index.json` → `sections[].slug`. Currently valid:

Top-level sections:
- `principles`
- `color-contrast`
- `typography`
- `motion`
- `focus-keyboard`
- `aria-labels`
- `reading-order-landmarks`
- `touch-pointer`
- `error-prevention`
- `session-timeout`
- `components`
- `designer-handoff-checklist`

Per-component sub-sections (under Components):
- `buttons`
- `navigation`
- `forms`
- `modals`
- `alerts-toasts-banners`
- `dropdowns-menus-popovers`
- `data-tables`
- `loading-patterns`
- `empty-states`
- `tabs`
- `icons`
- `tooltips`
- `truncation-overflow`
- `drag-drop`
- `ai-output`

Checklist sub-section:
- `states`

If a needed slug doesn't exist upstream, do one of:

1. Pick a closely-related slug + tighten via `note:`
2. Open a PR to `foundations/src/NN-<slug>.md` or `accessibility/src/NN-<slug>.md` adding the new pattern/section. The slug is then automatically derivable.

## Worked example

See `form-input-selection.md` for the canonical worked example. It shows:

- A 7-part anatomy with 2 optional parts
- 3 variant axes (State / Size / Label position)
- A single motion ref with a component-specific `note:`
- 6 accessibility refs, all real upstream slugs

## CI behavior

Two GitHub Actions workflows interact with this directory:

1. **`validate-schemas.yml`** — on every PR that touches a category MD, validates the YAML frontmatter against `schemas/category-defaults.json` via Ajv. Violations are surfaced inline on the PR diff via reviewdog (visible in the GitHub web UI Files-Changed view).

2. **`categories-derive.yml`** — on every PR that touches a category MD or the derive script, regenerates `components/dist/categories/<slug>-defaults.json` + `categories.bundle.json`, then auto-commits the dist back to the PR branch. The plugin reads the dist via vendor-snapshot.

You do not need a local toolchain — edit MD via the GitHub web UI, push, let CI do the rest.

## Schema validation in your editor

Add this VSCode setting (`.vscode/settings.json` at repo root) for live validation while editing:

```json
{
  "yaml.schemas": {
    "./schemas/category-defaults.json": "components/src/categories/*.md"
  }
}
```

(Requires the **YAML** VSCode extension by Red Hat.)

## Last reviewed

2026-05-12 — Phase 2 v2 ship (PR δ). Engineer-seed for all six categories.
