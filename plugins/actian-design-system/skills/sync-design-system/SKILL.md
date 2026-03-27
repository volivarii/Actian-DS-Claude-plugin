---
name: sync-design-system
description: Use when the user asks to sync, refresh, pull, import, or update design system data, tokens, components, guidelines, or foundations from Figma. Supports full sync, single-phase sync, or single-component granularity (e.g., 'sync Button').
argument-hint: "[phase name, component name, 'all', or 'validate']"
---

# Sync Design System from Figma

Extract design system data directly from Figma libraries via MCP tools. Single-hop: Figma → Plugin (`docs/` + `tokens/`).

> **Mode: Extract + Transform.** Read-only on Figma. Writes static files to `docs/` and `tokens/`. Never modifies the Figma library.

**When NOT to use:** If the user wants to *audit* a design → use `design-audit`. If the user wants to *create* a component → use `create-component`.

## Input

- **Single phase:** "Sync components" / "Sync variables" / "Sync styles" / "Sync guidelines" / "Sync foundations"
- **All phases:** "Sync design system" or "Sync all"
- **Validate only:** "Validate sync" — diffs local files against Figma without overwriting
- **Single component:** "Sync Button" — extracts only that component's guidelines (Phase 5)
- **Multiple components:** "Sync Button, Modal, and Table"

## Source libraries

| Library  | File key                  | Contents |
|----------|---------------------------|----------|
| DS2026   | `l8biHxfarNi1I2RMvVxVOK` | 77 components, 115 variables (3 themes), 12 text styles, 5 effect styles, guidelines, foundations |
| FM Kit   | `X2JSEUyLvxyNCx22ucOexn` | 29 wireframe components |
| Meta Kit | `osoeCLcrWqfoq8TvLQoyh0` | 6 skill-output components |

## Output files

| Phase | Output | Description |
|-------|--------|-------------|
| 1 | `docs/ds2026-components.md`, `docs/fm-components.md`, `docs/meta-kit/components.md` | Component catalogs with variant axes, properties, keys |
| 2 | `docs/meta-kit/variables.md` | 115 variables with keys, scopes, per-mode values |
| 3 | `docs/meta-kit/text-styles.md`, `docs/meta-kit/effect-styles.md` | Text + effect style specs |
| 4 | `docs/token-reference.md`, `tokens/tokens.css`, `tokens/actian-ds.tokens.json` | Token reference, CSS custom properties, W3C DTCG |
| 5 | `docs/component-guidelines/*.json` | Per-component guidelines (44+) |
| 6 | `docs/foundations/*.json`, `docs/content-guidelines.md`, `docs/accessibility-guidelines.md` | Foundation docs (11 pages) |
| 7 | `release-notes/sync-YYYY-MM-DD.md` | Semantic changelog + validation report + approval gate |

## Extraction constraints

- **20KB response limit:** `use_figma` returns ~20KB max. Split large extractions across calls.
- **VARIABLE_ALIAS resolution:** Color variables use alias chains. Resolve to final RGBA/hex per mode.
- **`search_design_system` returns keys only:** Use `use_figma` with `getLocalVariablesAsync()` for values.
- **Sequential `use_figma` only:** Never parallel. Each call must complete before the next.
- **Rate limits:** Pro = 200 calls/day, Enterprise = 600. Minimize redundant calls. Cache within session.
- **Frame node IDs required:** `get_design_context` needs frame-level IDs. Use `get_metadata` first.
- **Accessibility page ambiguity:** 23 frames all named "Design guidelines". Use heading text to differentiate.

## Phases

Read `sync-phases.md` for the implementation details of the phase you are executing. Only load the phase you need.

| Phase | Name | MCP calls | What it does |
|-------|------|-----------|--------------|
| 1 | Components | ~10-20 `use_figma` | Extract component sets from DS2026, FM Kit, Meta Kit |
| 2 | Variables | ~3-5 `use_figma` | Extract 115 variables with alias resolution |
| 3 | Styles | 2 `use_figma` | Extract 12 text styles + 5 effect styles |
| 4 | Token files | 0 (transforms Phase 2 data) | Generate token-reference.md, tokens.css, tokens.json |
| 5 | Guidelines | ~15 `use_figma` + ~132 `get_design_context` | Per-component content/design guidelines |
| 6 | Foundations | ~10 `use_figma` + ~56 `get_design_context` | Foundation pages + content/accessibility guidelines |
| 7 | Validation + Changelog | 0 (git diff) | Semantic changelog, diff report, approval gate, commit |

**Phase dependencies:** Phase 4 requires Phase 2 data. All other phases are independent.

## What this skill replaced

- Assembler repo as sync intermediary
- `scripts/sync-from-upstream.sh`
- Two-hop data flow (Figma → Assembler → Plugin)
- Hand-authored `content-guidelines.md` and `accessibility-guidelines.md`
