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

#### Step 1: Extract page structure

For each library (DS2026, FM Kit, Meta Kit), call `use_figma` to retrieve the page tree with component set counts:

```js
const pages = figma.root.children.map(p => ({
  name: p.name,
  id: p.id,
  componentSets: p.findAll(n => n.type === 'COMPONENT_SET').length
}));
return JSON.stringify(pages, null, 2);
```

This gives you the page list and lets you plan chunking for Step 2.

#### Step 2: Extract component sets

For each library, call `use_figma` to extract all component sets with their variant axes, text overrides, and keys:

```js
const sets = figma.root.findAll(n => n.type === 'COMPONENT_SET');
return JSON.stringify(sets.map(cs => ({
  name: cs.name,
  key: cs.key,
  nodeId: cs.id,
  page: cs.parent?.parent?.name || cs.parent?.name || 'unknown',
  description: cs.description || '',
  variantAxes: Object.entries(cs.variantGroupProperties || {}).map(([axis, prop]) => ({
    axis,
    values: prop.values
  })),
  componentPropertyDefinitions: Object.entries(cs.componentPropertyDefinitions || {})
    .filter(([_, def]) => def.type === 'TEXT')
    .map(([name]) => name),
  variants: cs.children.map(v => ({ name: v.name, key: v.key })),
})), null, 2);
```

**Chunking strategy:** If a library has many component sets and the JSON response exceeds 20KB, split extraction by page:

```js
// Extract one page at a time
const page = figma.root.children.find(p => p.name === 'Button');
const sets = page.findAll(n => n.type === 'COMPONENT_SET');
return JSON.stringify(sets.map(cs => ({
  name: cs.name,
  key: cs.key,
  nodeId: cs.id,
  page: cs.parent?.parent?.name || cs.parent?.name || 'unknown',
  description: cs.description || '',
  variantAxes: Object.entries(cs.variantGroupProperties || {}).map(([axis, prop]) => ({
    axis,
    values: prop.values
  })),
  componentPropertyDefinitions: Object.entries(cs.componentPropertyDefinitions || {})
    .filter(([_, def]) => def.type === 'TEXT')
    .map(([name]) => name),
  variants: cs.children.map(v => ({ name: v.name, key: v.key })),
})), null, 2);
```

Use the page counts from Step 1 to decide whether to extract all-at-once or page-by-page. DS2026 (77 component sets) will almost certainly need chunking. FM Kit (29) and Meta Kit (6) may fit in a single call.

#### Step 3: Format output

Transform the extracted JSON into Markdown matching these exact formats:

**DS2026 format** (`docs/ds2026-components.md`):

```markdown
# Actian Design System 2026 — Component Reference

Auto-generated from Figma MCP on YYYY-MM-DD.
77 component sets, NNN individual components.

Source: [Actian Design System v1.1.0](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK)

---

## Pages

- Cover
- Table of contents
[... page list with component set counts ...]

---

## Button

### Button
Primary trigger for a specific action...

- Variants: **Type:** `Primary` · `Secondary` · ... | **Size:** `Default` · `Small` | **State:** `Default` · `Hovered` · ...
- Text overrides: `Label`
- Node: `7206:2643` | Key: `5a6d10d26bef3cc83955bf32a318c6b4682f25d3`
```

**FM Kit format** (`docs/fm-components.md`):

```markdown
# FM Kit — Component Reference

Auto-generated from Figma MCP on YYYY-MM-DD.
29 component sets.

Source: [FM Kit](https://www.figma.com/design/X2JSEUyLvxyNCx22ucOexn)

---

### FM App_header
Top-level application header bar...

- Variants: **Type:** `Admin` · `Explorer` · `Studio` · `Actian`
- Node: `67:1858` | Key: `8fc9bcee610c7f8d22ebcc268467993f6dc99c87`
```

**Meta Kit format** (`docs/meta-kit/components.md`): Same structure as FM Kit, adapted for Meta Kit component names.

Formatting rules:
- Group components by page using `## Page Name` headings
- Each component set gets a `### Component Name` heading
- Description on the line after the heading (if available)
- Variant axes formatted as: `**Axis:** \`Value1\` · \`Value2\` · \`Value3\``
- Multiple axes separated by ` | `
- Text overrides listed only if `componentPropertyDefinitions` returned any TEXT entries
- Node ID and Key on the last bullet

#### Step 4: Write files

Write the formatted Markdown to:
- `docs/ds2026-components.md`
- `docs/fm-components.md`
- `docs/meta-kit/components.md`

#### Error handling

- If a library file is inaccessible (e.g., no edit permission for FM Kit), log a warning and skip that library. The skill must not fail entirely if one library is unavailable.
- If a single page extraction fails, log the page name and continue with remaining pages.
- After writing, report the total component set count per library and flag any libraries that were skipped.

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
