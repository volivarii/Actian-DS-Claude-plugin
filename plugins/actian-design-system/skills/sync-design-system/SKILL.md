---
name: sync-design-system
description: Sync DS data from Figma — tokens, components, guidelines, foundations. Supports full sync, single-phase, or single-component.
disable-model-invocation: true
argument-hint: "[phase name, component name, 'all', or 'validate']"
---

# Sync Design System from Figma

Extract design system data directly from Figma libraries via MCP tools. Single-hop: Figma → Plugin (`docs/` + `tokens/`). Read-only on Figma, writes static files locally.

> **Primary purpose: Phase 2 (variables sync) + Phase 4 (token regen).** Phase 2 cannot run in CI because Figma's Variables REST API is gated to Enterprise plans, so this skill is the only path. Run when DS Kit variables change in Figma — typically monthly.
>
> **Phases 1 and 3 auto-sync nightly** via `.github/workflows/sync-from-figma.yml` (Sprint 1 v1.59.0). Use the manual phase paths below only as fallback if the workflow is broken or for local debugging. Phases 5 and 6 still run through this skill until Wave 2 (v1.60.0) ships.

## Input

| User says | Phases | Estimated calls |
|-----------|--------|-----------------|
| "Sync all" / "Sync design system" | 1-4 + 7 | ~10 |
| "Sync all with guidelines" | 1-5 + 7 | ~35 incremental / ~155 full |
| "Sync all with guidelines and foundations" | 1-7 | ~55 incremental / ~210 full |
| "Sync guidelines" | 5 only | ~25 incremental / ~147 full |
| "Sync foundations" | 6 only | ~15 incremental / ~56 full |
| "Sync Button" | 5 (single component) | ~5 |
| "Validate sync" | Diffs local vs Figma | 0 writes |

Append "full" to skip incremental cache. Rate limits: Pro = 200/day, Enterprise = 600.

## Source libraries

Read file keys from `../../.figma-keys.json` at the start of every sync run.

| Library | Config key | Contents |
|---------|-----------|----------|
| DS Kit | `dsKit` | 107 component sets, 115 variables (3 themes), 12 text styles, 5 effect styles, guidelines, foundations |
| FM Kit | `fmKit` | 44 component sets |
| Meta Kit | `metaKit` | 25 components + 3 templates |

## Phases

Read `sync-phases.md` for the implementation details of the phase you are executing.

| Phase | Name | MCP calls | Output |
|-------|------|-----------|--------|
| 1 | Components ⚙️ auto-handled | 1-3 incremental / ~10-20 full | `docs/dskit.json`, `docs/fmkit.json`, `docs/metakit.json` (auto-sync nightly via REST workflow; this skill writes the markdown mirrors as fallback) |
| 2 | Variables | 2 `use_figma` | `docs/meta-kit/variables.md` (Enterprise-gated REST — manual only) |
| 3 | Styles ⚙️ auto-handled | 2 `use_figma` | `docs/meta-kit/styles.json` (auto-sync nightly); `text-styles.md` + `effect-styles.md` are fallback markdown mirrors |
| 4 | Token files | 0 (transforms Phase 2) | `docs/token-reference.md`, `tokens/tokens.css`, `tokens/actian-ds.tokens.json` |
| 5 | Guidelines | ~5 + ~30 `get_design_context` incremental | `docs/component-guidelines/*.json` (Wave 2 candidate — still manual until v1.60.0) |
| 6 | Foundations | ~3 + ~15 `get_design_context` incremental | `docs/foundations/*.json`, `docs/content-guidelines.md`, `docs/accessibility-guidelines.md` (Wave 2 candidate) |
| 7 | Validation | 0 (git diff) | `release-notes/sync-YYYY-MM-DD.md` |

**Phase dependencies:** Phase 4 requires Phase 2 data. All other phases are independent.

## Extraction constraints

- 20KB response limit per `use_figma` — split large extractions
- VARIABLE_ALIAS: resolve alias chains to final RGBA/hex per mode
- Sequential `use_figma` only — never parallel
- `get_design_context` needs frame-level IDs — classify node first per `../../references/figma-output.md` (use_figma one-liner), or use `get_metadata` for bulk structure discovery
- Accessibility page: 23 frames all named "Design guidelines" — use heading text to differentiate
