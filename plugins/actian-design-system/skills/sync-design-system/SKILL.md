---
name: sync-design-system
description: Use when the user asks to sync, refresh, pull, import, or update design system data, tokens, components, guidelines, or foundations from Figma. Supports full sync, single-phase sync, or single-component granularity (e.g., 'sync Button').
argument-hint: "[phase name, component name, 'all', or 'validate']"
---

<!-- This skill can be invoked directly (/sync-design-system) or via the DS companion. -->

# Sync Design System from Figma

Extract design system data directly from Figma libraries via MCP tools. Single-hop: Figma → Plugin (`docs/` + `tokens/`).

> **Mode: Extract + Transform.** Read-only on Figma. Writes static files to `docs/` and `tokens/`. Never modifies the Figma library.

**When NOT to use:** If the user wants to *audit* a design → use `design-audit`. If the user wants to *create* a component → use `create-component`.

## Input

- **Single phase:** "Sync components" / "Sync variables" / "Sync styles" / "Sync guidelines" / "Sync foundations"
- **All phases (tokens):** "Sync design system" or "Sync all" — runs Phases 1-4 only (~13 calls, safe for Pro)
- **All phases + guidelines:** "Sync all with guidelines" — adds Phase 5 (~60 incremental / ~147 full calls)
- **All phases + everything:** "Sync all with guidelines and foundations" — all 7 phases (~120 incremental / ~212 full)
- **Validate only:** "Validate sync" — diffs local files against Figma without overwriting
- **Single component:** "Sync Button" — extracts only that component's guidelines (Phase 5)
- **Multiple components:** "Sync Button, Modal, and Table"
- **Incremental components:** "Sync components" — Phase 1 defaults to incremental (manifest diff, extract only changed). Use "Sync components full" to force full rewrite.
- **Full force:** Append "full" to any command to skip incremental cache and force full re-extraction

## Source libraries

Read file keys from `../../.figma-keys.json` at the start of every sync run.

| Library  | Config key         | Contents |
|----------|-------------------|----------|
| DS Kit   | `dsKit`          | 77 components, 115 variables (3 themes), 12 text styles, 5 effect styles, guidelines, foundations |
| FM Kit   | `fmKit`           | 29 wireframe components |
| Meta Kit | `metaKit`         | 6 skill-output components |

## Output files

| Phase | Output | Description |
|-------|--------|-------------|
| 1 | `docs/dskit-components.md`, `docs/fm-components.md`, `docs/meta-kit/components.md`, `docs/dskit-components-registry.json`, `docs/fm-components-registry.json`, `docs/meta-kit/meta-kit-registry.json` | Component catalogs with variant axes, properties, keys |
| 2 | `docs/meta-kit/variables.md` | 115 variables with keys, scopes, per-mode values |
| 3 | `docs/meta-kit/text-styles.md`, `docs/meta-kit/effect-styles.md` | Text + effect style specs |
| 4 | `docs/token-reference.md`, `tokens/tokens.css`, `tokens/actian-ds.tokens.json`, `token-drift.json` (if drift detected) | Token reference, CSS custom properties, W3C DTCG |
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
| 1 | Components | 1-3 `use_figma` (incremental) or ~10-20 (full) | Extract component sets + standalone components + generate JSON registries. Incremental by default |
| 2 | Variables | 2 `use_figma` | Extract 115 variables with inline alias resolution (non-color + color) |
| 3 | Styles | 2 `use_figma` | Extract 12 text styles + 5 effect styles |
| 4 | Token files | 0 (transforms Phase 2 data) | Generate token-reference.md, tokens.css, tokens.json |
| 5 | Guidelines | ~5 `use_figma` + ~30 `get_design_context` (incremental) or ~147 (full) | Per-component content/design guidelines. Incremental by default |
| 6 | Foundations | ~3 `use_figma` + ~15 `get_design_context` (incremental) or ~56 (full) | Foundation pages + content/accessibility guidelines. Incremental by default |
| 7 | Validation + Changelog | 0 (git diff) | Semantic changelog, diff report, approval gate, commit |

**Phase dependencies:** Phase 4 requires Phase 2 data. All other phases are independent.

## Sync scope rules

Default "sync all" runs **Phases 1-4 only** (tokens, components, variables, styles) to stay within Pro rate limits. Guidelines and foundations are opt-in:

| User says | Phases | Estimated calls |
|-----------|--------|-----------------|
| "Sync all" / "Sync design system" | 1-4 + 7 | ~10 |
| "Sync all with guidelines" | 1-5 + 7 | ~35 (incremental) / ~155 (full) |
| "Sync all with guidelines and foundations" | 1-7 | ~55 (incremental) / ~210 (full) |
| "Sync guidelines" | 5 only | ~25 (incremental) / ~147 (full) |
| "Sync foundations" | 6 only | ~15 (incremental) / ~56 (full) |

**Rate limit safety:** Pro (200/day) fits all incremental scenarios comfortably. Full guidelines+foundations (~210 calls) requires Enterprise (600/day) or split across two sessions.

## What this skill replaced

- Assembler repo as sync intermediary
- scripts/sync-from-upstream.sh (deleted)
- Two-hop data flow (Figma → Assembler → Plugin)
- Hand-authored `content-guidelines.md` and `accessibility-guidelines.md`
