---
name: sync-design-system
description: Extract components, variables, styles, guidelines, and foundations from DS2026 and FM Kit Figma libraries directly via MCP tools. Replaces the Assembler-based sync pipeline. Produces static reference files (Markdown, JSON, CSS) consumed by all other skills. Triggers when the user asks to sync, refresh, or update design system data, tokens, or guidelines.
argument-hint: "[phase name, 'all', or 'validate']"
---

# Sync Design System from Figma

Extract design system data directly from Figma libraries via MCP tools, replacing the Assembler intermediary.

> **Mode: Extract + Transform.** Read-only on Figma. Writes static files to `docs/` and `tokens/`. Never modifies the Figma library.

## Why this skill exists

The previous sync pipeline required multiple hops and an intermediary repository:

```
Figma libraries --> Assembler (npm run sync) --> GitHub --> Plugin (scripts/sync-from-upstream.sh)
```

This meant every design system update had to flow through the DS Assembler npm scripts, get committed to the Assembler GitHub repo, and then be pulled into this plugin via `sync-from-upstream.sh`. Each hop introduced latency, potential drift, and a dependency on the Assembler repo being up-to-date.

Direct MCP extraction eliminates the intermediary entirely:

```
Figma libraries --> MCP tools --> Plugin (docs/ + tokens/)
```

Single-hop data flow. No intermediary repo. No waiting for Assembler sync. The skill reads directly from the Figma source of truth and writes static reference files that all other skills consume.

## Input

The user specifies what to sync:

- **Single phase:** "Sync components" / "Sync variables" / "Sync styles" / "Sync guidelines" / "Sync foundations"
- **All phases:** "Sync design system" or "Sync all"
- **Validate only:** "Validate sync" -- diffs current local files against Figma without overwriting

## Source libraries

| Library  | File key                         | What it contains                                                                                  |
|----------|----------------------------------|---------------------------------------------------------------------------------------------------|
| DS2026   | `l8biHxfarNi1I2RMvVxVOK`        | 77 components, 115 variables (3 themes), 12 text styles, 5 effect styles, guidelines, foundations |
| FM Kit   | `X2JSEUyLvxyNCx22ucOexn`        | 29 wireframe components                                                                          |
| Meta Kit | `osoeCLcrWqfoq8TvLQoyh0`        | 6 skill-output components                                                                        |

## Output files

| Phase | Output file                              | Description                                                        |
|-------|------------------------------------------|--------------------------------------------------------------------|
| 1     | `docs/ds2026-components.md`              | 77 DS2026 component sets with variant axes, properties, keys       |
| 1     | `docs/fm-components.md`                  | 29 FM Kit component sets                                           |
| 1     | `docs/meta-kit/components.md`            | Meta Kit component catalog                                         |
| 2     | `docs/meta-kit/variables.md`             | All DS2026 variables with keys, types, scopes, per-mode values     |
| 3     | `docs/meta-kit/text-styles.md`           | All text styles with font specs                                    |
| 3     | `docs/meta-kit/effect-styles.md`         | All effect styles with shadow params                               |
| 4     | `docs/token-reference.md`                | Human-readable token reference (3 themes)                          |
| 4     | `tokens/tokens.css`                      | CSS custom properties `--zen-*`                                    |
| 4     | `tokens/actian-ds.tokens.json`           | W3C DTCG format                                                    |
| 5     | `docs/component-guidelines/*.json`       | Per-component guidelines (44+)                                     |
| 6     | `docs/foundations/*.json`                | Foundation docs (11 pages)                                         |
| 6     | `docs/content-guidelines.md`            | Content guidelines (replaces hand-authored)                        |
| 6     | `docs/accessibility-guidelines.md`      | Accessibility guidelines (replaces hand-authored)                  |

## Extraction constraints

These constraints were confirmed during MCP investigation and must be respected by all phases:

- **20KB response limit:** `use_figma` returns at most ~20KB per call. Batch operations to stay within this limit; split large extractions across multiple calls.
- **VARIABLE_ALIAS resolution:** Color variables in DS2026 use `VARIABLE_ALIAS` references rather than storing final values directly. The skill must resolve alias chains to obtain the final RGBA/hex value for each mode.
- **`search_design_system` returns keys only:** It provides component keys and names but not variable values or style definitions. Use `use_figma` with `getLocalVariablesAsync()` to retrieve actual values.
- **Sequential `use_figma` only:** Never issue parallel `use_figma` calls. Each call must complete before the next begins.
- **Rate limits:** Figma MCP has daily limits -- Pro plans allow 200 calls/day, Enterprise plans 600 calls/day. Minimize redundant calls. Cache intermediate results within a session.
- **Frame node IDs required:** `get_design_context` requires frame-level node IDs, not page IDs. Use `get_metadata` first to discover frame node IDs within a page.
- **Accessibility page ambiguity:** The Accessibility page contains 23 frames all named "Design guidelines". Use page section headers and frame ordering to distinguish content.

## Phases

### Phase 1 -- Components

Extract component sets, variant axes, properties, and keys from DS2026, FM Kit, and Meta Kit libraries.

<!-- TODO: Implementation details -->

### Phase 2 -- Variables

Extract all DS2026 variables with keys, types, scopes, and resolved per-mode values across 3 themes.

<!-- TODO: Implementation details -->

### Phase 3 -- Styles

Extract text styles (font family, weight, size, line height, letter spacing) and effect styles (shadow parameters).

<!-- TODO: Implementation details -->

### Phase 4 -- Token files

Transform extracted variables and styles into token-reference.md, tokens.css, and actian-ds.tokens.json.

<!-- TODO: Implementation details -->

### Phase 5 -- Component guidelines

Extract per-component design and content guidelines from DS2026 guideline pages.

<!-- TODO: Implementation details -->

### Phase 6 -- Foundations + Content + Accessibility

Extract foundation docs (11 pages), content guidelines, and accessibility guidelines from DS2026.

<!-- TODO: Implementation details -->

### Phase 7 -- Validation

Diff local files against current Figma state. Report stale files, missing entries, and value mismatches without overwriting.

<!-- TODO: Implementation details -->

## What gets eliminated

This skill replaces the following pieces of the old pipeline:

- **Assembler repo as sync intermediary** -- no longer needed for data extraction; Figma is read directly.
- **`scripts/sync-from-upstream.sh`** -- deprecated (script remains in repo for reference but is no longer the primary sync path).
- **Two-hop data flow** -- eliminated in favor of single-hop Figma-to-plugin extraction.
- **Hand-authored `content-guidelines.md`** -- replaced by Figma-extracted content from DS2026 guideline pages.
- **Hand-authored `accessibility-guidelines.md`** -- replaced by Figma-extracted content from DS2026 accessibility page.
