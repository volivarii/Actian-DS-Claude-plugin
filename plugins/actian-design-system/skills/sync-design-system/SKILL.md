---
name: sync-design-system
description: Extract components, variables, styles, guidelines, and foundations from DS2026 and FM Kit Figma libraries directly via MCP tools. Replaces the Assembler-based sync pipeline. Produces static reference files (Markdown, JSON, CSS) consumed by all other skills. Triggers when the user asks to sync, refresh, or update design system data, tokens, or guidelines. Supports component-level granularity for guidelines (e.g., 'sync Button').
argument-hint: "[phase name, component name, 'all', or 'validate']"
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
- **Single component guidelines:** "Sync Button" / "Sync guidelines for Text Input" — extracts only that component's guidelines (Phase 5 for one component)
- **Multiple components:** "Sync Button, Modal, and Table" — extracts guidelines for specified components only

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

## DS2026 component page structure

Each component page in the DS2026 library has consistently named top-level frames:

| Frame name | Present | Content type |
|---|---|---|
| `.local - page header with body` | Always | Component name, description |
| `Content guidelines` | Always | Copy rules, terminology, do/don't examples |
| `Components` | Always | Variant state grid |
| `ready made examples` | Always | Pre-built usage patterns |
| `Design guidelines` | Most | Visual rules, spacing, layout guidance |
| `Screenshots of use cases` | Some | Real product screenshots |
| `Behavior demo` | Some | Interaction/animation documentation |

### Internal frame structure

Each named frame follows the same pattern:
1. An `.local - section header` instance (title bar — skip during extraction)
2. A `Body` or `Guidelines` sub-frame containing the actual content:
   - Text nodes (headings, body text, rules)
   - Table structures (`.Row` frames with `Cell`/`Content` sub-frames)
   - Inline component instances (note variant names)
   - Do/don't pairs (check/cancel icon + text)

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

#### Step 1: Extract raw variables

Call `use_figma` on the DS2026 library (`l8biHxfarNi1I2RMvVxVOK`) to retrieve all variable collections and their variables:

```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();

const result = [];
for (const collection of collections) {
  const collVars = vars.filter(v => v.variableCollectionId === collection.id);
  result.push({
    collection: collection.name,
    modes: collection.modes.map(m => ({ name: m.name, modeId: m.modeId })),
    variables: collVars.map(v => ({
      name: v.name,
      key: v.key,
      resolvedType: v.resolvedType,
      scopes: v.scopes,
      description: v.description,
      valuesByMode: Object.fromEntries(
        collection.modes.map(m => [m.name, v.valuesByMode[m.modeId]])
      ),
    })),
  });
}
return JSON.stringify(result, null, 2);
```

Expected collections: Spacing (6 vars), Color (86 vars), Border (12 vars), Size (7 vars), Breakpoint (4 vars) -- 115 total. The Color collection has 3 modes (Actian, Studio, Explorer); all other collections have 1 mode ("Mode 1").

**Chunking strategy:** The Color collection (86 variables x 3 modes) will likely exceed the 20KB response limit. Split extraction across two calls:

1. **First call:** Extract Spacing + Border + Size + Breakpoint collections (small, single-mode -- fits in one call)
2. **Second call:** Extract the Color collection alone with alias resolution (Step 2)

To extract a single collection by name:

```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const target = collections.find(c => c.name === 'Color');
const vars = await figma.variables.getLocalVariablesAsync();
const collVars = vars.filter(v => v.variableCollectionId === target.id);
// ... same mapping as above, but only for `target`
```

#### Step 2: Resolve aliases

Color variables frequently use `VARIABLE_ALIAS` -- their raw values are `{ type: "VARIABLE_ALIAS", id: "VariableID:..." }` references to other variables rather than direct RGBA values. The skill must resolve each alias chain to obtain the final color value for every mode.

```js
// Resolve a VARIABLE_ALIAS to its final RGBA value
async function resolveValue(value, modeId) {
  if (value && value.type === 'VARIABLE_ALIAS') {
    const aliasVar = await figma.variables.getVariableByIdAsync(value.id);
    const aliasValue = aliasVar.valuesByMode[modeId];
    return resolveValue(aliasValue, modeId); // recursive for chained aliases
  }
  return value; // direct RGBA or FLOAT
}
```

Apply `resolveValue()` to every variable value in every mode before writing output. Non-color collections (Spacing, Border, Size, Breakpoint) use direct `FLOAT` values and do not need alias resolution.

#### Step 3: Convert RGBA to hex

Figma returns color values as `{ r, g, b, a }` with floats in the 0-1 range. Convert to hex strings:

```js
function rgbaToHex(rgba) {
  const r = Math.round(rgba.r * 255);
  const g = Math.round(rgba.g * 255);
  const b = Math.round(rgba.b * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}
```

If `a < 1`, append the alpha channel as two additional hex digits. For fully opaque colors (`a === 1`), use 6-digit hex.

#### Step 4: Format output

Write `docs/meta-kit/variables.md` with ALL 115 variables organized by collection. Use the Figma variable name path (e.g., `Status/success-primary`) as the Variable column.

```markdown
# Meta Kit Variable Keys

DS2026 Figma variables for use with `figma.variables.importVariableByKeyAsync(key)`.
Bind to generated scaffolding frames via `setBoundVariableForPaint()`.

All variables from **Actian Design System v1.1.0** library, extracted on YYYY-MM-DD.

## Usage pattern
[keep existing usage pattern section from current file]

## Color Variables

| Variable | Key | Actian | Studio | Explorer | Purpose |
|----------|-----|--------|--------|----------|---------|
| background-bg-default | `805af...` | #FFFFFF | #FFFFFF | #FFFFFF | Card backgrounds |
| theme-primary | `a256...` | #0550DC | #7B2FBE | #00875A | Brand accents, links |
[... all 86 color variables, resolved to hex ...]

## Spacing Variables

| Variable | Key | Value | Purpose |
|----------|-----|-------|---------|
| Spacing/2xs | `5a7e...` | 4 | Tight spacing |
[... all 6 spacing variables ...]

## Border Variables

| Variable | Key | Value | Purpose |
|----------|-----|-------|---------|
[... all 12 border variables ...]

## Size Variables

| Variable | Key | Value | Purpose |
|----------|-----|-------|---------|
[... all 7 size variables ...]

## Breakpoint Variables

| Variable | Key | Value | Purpose |
|----------|-----|-------|---------|
[... all 4 breakpoint variables ...]
```

Formatting rules:
- Color variables table has per-mode columns (Actian, Studio, Explorer) with resolved hex values
- Non-color variable tables have a single Value column (since they only have one mode)
- Use the Figma variable name path as the Variable column (e.g., `Status/success-primary`)
- Populate the Purpose column with a brief description derived from the variable's `description` field, or infer from the name where helpful (e.g., convert `Status/success-primary` to "Success state primary color")
- Sort variables alphabetically within each collection section

#### Error handling

- If alias resolution encounters a circular reference or a missing variable (deleted upstream), log a warning and use `"UNRESOLVED"` as the hex value in the output table.
- If a collection extraction call fails, log the collection name and continue with remaining collections. The skill must not fail entirely if one collection is inaccessible.
- After writing, report the total variable count per collection and flag any unresolved aliases.

### Phase 3 -- Styles

Extract text styles (font family, weight, size, line height, letter spacing) and effect styles (shadow parameters).

#### Step 1: Extract text styles

Call `use_figma` on the DS2026 library (`l8biHxfarNi1I2RMvVxVOK`) to retrieve all local text styles:

```js
const textStyles = await figma.getLocalTextStylesAsync();
return JSON.stringify(textStyles.map(s => ({
  name: s.name,
  key: s.key,
  fontFamily: s.fontName.family,
  fontStyle: s.fontName.style,
  fontSize: s.fontSize,
  lineHeight: s.lineHeight,
  letterSpacing: s.letterSpacing,
  textDecoration: s.textDecoration,
  textCase: s.textCase,
})), null, 2);
```

Expected: 12 text styles, all Roboto family (heading-display, heading-prominent, heading-default, heading-subtle, body-standard, body-subtle, body-micro, label-standard, label-subtle, label-micro, plus variants). Each style includes full font specs: family, style (weight mapping), fontSize, lineHeight, letterSpacing.

#### Step 2: Extract effect styles

Call `use_figma` on the DS2026 library to retrieve all local effect styles:

```js
const effectStyles = await figma.getLocalEffectStylesAsync();
return JSON.stringify(effectStyles.map(s => ({
  name: s.name,
  key: s.key,
  effects: s.effects.map(e => ({
    type: e.type,
    color: e.color,
    offset: e.offset,
    radius: e.radius,
    spread: e.spread,
    visible: e.visible,
  })),
})), null, 2);
```

Expected: 5 effect styles (shadow-xs, shadow-sm, shadow-md, shadow-lg, shadow-xl). Each style contains 2 `DROP_SHADOW` effects with RGBA color, offset `{x, y}`, blur radius, and spread.

#### Step 3: Format text styles output

Write `docs/meta-kit/text-styles.md` with all 12 text styles organized as a reference table:

```markdown
# Meta Kit — Text Styles

DS2026 text styles for binding via `figma.importStyleByKeyAsync(key)`.
Extracted from Actian Design System v1.1.0 on YYYY-MM-DD.

## Usage

\`\`\`js
const style = await figma.importStyleByKeyAsync("KEY");
textNode.textStyleId = style.id;
\`\`\`

## Styles

| Style | Key | Font | Weight | Size | Line Height | Letter Spacing |
|-------|-----|------|--------|------|-------------|----------------|
| heading-display | `a14c...` | Roboto | SemiBold | 24 | 28px | 0 |
| heading-prominent | `6fe7...` | Roboto | SemiBold | 18 | 26px | 0 |
[... all 12 styles ...]
```

Formatting rules:
- Use the style `name` as the Style column
- The `key` column shows the full Figma style key (for `importStyleByKeyAsync`)
- Map `fontName.style` to the Weight column (e.g., "Regular" → Regular, "SemiBold" → SemiBold)
- `lineHeight` may be `{ unit: "PIXELS", value: N }` or `{ unit: "AUTO" }` — render as `Npx` or `Auto`
- `letterSpacing` may be `{ unit: "PIXELS", value: N }` or `{ unit: "PERCENT", value: N }` — render as `Npx` or `N%`
- Sort styles by fontSize descending (largest heading first, smallest label last)

#### Step 4: Format effect styles output

Write `docs/meta-kit/effect-styles.md` with all 5 effect styles:

```markdown
# Meta Kit — Effect Styles

DS2026 effect styles for binding via `figma.importStyleByKeyAsync(key)`.
Extracted from Actian Design System v1.1.0 on YYYY-MM-DD.

## Usage

\`\`\`js
const style = await figma.importStyleByKeyAsync("KEY");
frame.effectStyleId = style.id;
\`\`\`

## Styles

| Style | Key | Effects |
|-------|-----|---------|
| shadow-xs | `e5e6...` | DROP_SHADOW(0,1,3,1,rgba(0,0,15,0.06)) + DROP_SHADOW(0,1,5,0,rgba(0,0,18,0.07)) |
| shadow-sm | `3bde...` | DROP_SHADOW(0,1,7,3,rgba(0,0,20,0.08)) + DROP_SHADOW(0,1,3,1,rgba(0,0,31,0.12)) |
[... all 5 styles ...]

### Shadow detail

For each style, expand full shadow parameters in a detail table:

#### shadow-xs
| # | Type | Color | X | Y | Blur | Spread |
|---|------|-------|---|---|------|--------|
| 1 | DROP_SHADOW | rgba(0,0,15,0.06) | 0 | 1 | 3 | 1 |
| 2 | DROP_SHADOW | rgba(0,0,18,0.07) | 0 | 1 | 5 | 0 |
[... repeat for each style ...]
```

Formatting rules:
- The summary table shows all effects for a style in a single compact line using `TYPE(x,y,blur,spread,rgba(...))` notation
- Multiple effects on the same style are joined with ` + `
- The detail section expands each style into its own sub-table with one row per effect
- Convert Figma RGBA floats (0-1 range) to CSS `rgba(R,G,B,A)` format: multiply `r`, `g`, `b` by 255 and round; keep `a` as a decimal (e.g., `0.06`)
- Sort styles by shadow intensity: xs → sm → md → lg → xl

#### Error handling

- If `getLocalTextStylesAsync()` returns an empty array, log a warning: "No text styles found — the library may have changed or access may be restricted." Continue with effect style extraction.
- If `getLocalEffectStylesAsync()` returns an empty array, log a warning: "No effect styles found — the library may have changed or access may be restricted." Continue with writing whatever was successfully extracted.
- After writing, report the total count of text styles and effect styles extracted, and flag any that returned empty.

### Phase 4 -- Token files

Transform extracted variables and styles into token-reference.md, tokens.css, and actian-ds.tokens.json.

This phase consumes the variable data extracted in Phase 2 (all 115 variables with resolved hex values and per-mode values). It does NOT call Figma MCP — it transforms already-extracted data into 3 output formats.

#### Token naming convention

Convert Figma variable path names to CSS custom property names:
- Prefix: `--zen-color-` for color variables, `--zen-spacing-` for spacing, `--zen-border-` for border, `--zen-size-` for size, `--zen-breakpoint-` for breakpoint
- Path separator: `/` → `-` (e.g., `Status/success-primary` → `--zen-color-status-success-primary`)
- Case: lowercase throughout

#### Step 1: Generate token-reference.md

From Phase 2 variable data, format a human-readable Markdown reference with 3-theme columns for color tokens:

```markdown
# Token Reference — Actian Design System 2026

Generated by /sync-design-system on YYYY-MM-DD.

## Color Tokens

| Token | CSS Variable | Actian | Studio | Explorer |
|-------|-------------|--------|--------|----------|
| theme-primary | `--zen-color-theme-primary` | #0550DC | #7B2FBE | #00875A |
| theme-selected | `--zen-color-theme-selected` | #0346B8 | #6A28A3 | #006D4A |
[... all 86 color tokens ...]

## Spacing Tokens

| Token | CSS Variable | Value |
|-------|-------------|-------|
| 2xs | `--zen-spacing-2xs` | 4 |
[... all 6 spacing tokens ...]

## Border Tokens

| Token | CSS Variable | Value |
|-------|-------------|-------|
[... all 12 border tokens ...]

## Size Tokens

| Token | CSS Variable | Value |
|-------|-------------|-------|
[... all 7 size tokens ...]

## Breakpoint Tokens

| Token | CSS Variable | Value |
|-------|-------------|-------|
[... all 4 breakpoint tokens ...]
```

Formatting rules:
- Color tokens table includes per-mode columns (Actian, Studio, Explorer) with resolved hex values
- Non-color tokens tables have a single Value column (only one mode)
- Sort tokens alphabetically within each section
- Token column uses the short name (last segment of the Figma path, e.g., `success-primary`)
- CSS Variable column uses the full `--zen-*` name

Write to `docs/token-reference.md`.

#### Step 2: Generate tokens.css

CSS custom properties with `--zen-*` prefix. Actian theme is the default (`:root`), with overrides for Studio and Explorer via `[data-theme]` attribute selectors:

```css
/* Generated by /sync-design-system — do not edit manually */
/* Actian Design System 2026 — extracted on YYYY-MM-DD */

/* === Color tokens === */
:root, [data-theme="actian"] {
  --zen-color-theme-primary: #0550DC;
  --zen-color-theme-selected: #0346B8;
  /* ... all 86 color variables with Actian mode values ... */
}

[data-theme="studio"] {
  --zen-color-theme-primary: #7B2FBE;
  --zen-color-theme-selected: #6A28A3;
  /* ... only color variables that differ from Actian ... */
}

[data-theme="explorer"] {
  --zen-color-theme-primary: #00875A;
  --zen-color-theme-selected: #006D4A;
  /* ... only color variables that differ from Actian ... */
}

/* === Spacing tokens === */
:root {
  --zen-spacing-2xs: 4px;
  /* ... all 6 spacing variables ... */
}

/* === Border tokens === */
:root {
  --zen-border-radius-sm: 4px;
  /* ... all 12 border variables ... */
}

/* === Size tokens === */
:root {
  --zen-size-xl: 40px;
  /* ... all 7 size variables ... */
}

/* === Breakpoint tokens === */
:root {
  --zen-breakpoint-sm: 640px;
  /* ... all 4 breakpoint variables ... */
}
```

Formatting rules:
- Group by collection with CSS comment section headers
- Actian is the default theme under `:root, [data-theme="actian"]`
- Studio and Explorer override blocks only include tokens whose values differ from Actian (to minimize CSS size)
- Non-color tokens go under plain `:root` (they have only one mode)
- Add `px` unit suffix to spacing, border, size, and breakpoint values (they are raw numbers from Figma)
- Color values stay as hex (no unit suffix)
- Sort properties alphabetically within each block

Write to `tokens/tokens.css`.

#### Step 3: Generate actian-ds.tokens.json

W3C Design Token Community Group (DTCG) format with Figma metadata in `$extensions`:

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "$metadata": {
    "source": "Actian Design System 2026",
    "extractedOn": "YYYY-MM-DD",
    "figmaFileKey": "l8biHxfarNi1I2RMvVxVOK"
  },
  "color": {
    "theme": {
      "primary": {
        "$type": "color",
        "$value": "#0550DC",
        "$description": "Brand accents, links",
        "$extensions": {
          "com.figma": {
            "variableKey": "a256...",
            "collection": "Color",
            "scopes": ["ALL_FILLS"]
          },
          "modes": {
            "actian": "#0550DC",
            "studio": "#7B2FBE",
            "explorer": "#00875A"
          }
        }
      }
    },
    "background": {
      "bg-default": {
        "$type": "color",
        "$value": "#FFFFFF",
        "$extensions": {
          "com.figma": { "variableKey": "...", "collection": "Color", "scopes": ["FRAME_FILL"] },
          "modes": { "actian": "#FFFFFF", "studio": "#FFFFFF", "explorer": "#FFFFFF" }
        }
      }
    }
  },
  "spacing": {
    "2xs": {
      "$type": "dimension",
      "$value": "4px",
      "$extensions": {
        "com.figma": { "variableKey": "...", "collection": "Spacing", "scopes": ["GAP"] }
      }
    }
  },
  "border": {
    "radius-sm": {
      "$type": "dimension",
      "$value": "4px",
      "$extensions": {
        "com.figma": { "variableKey": "...", "collection": "Border", "scopes": ["CORNER_RADIUS"] }
      }
    }
  },
  "size": { },
  "breakpoint": { }
}
```

Formatting rules:
- Top-level groups mirror Figma collection names: `color`, `spacing`, `border`, `size`, `breakpoint`
- Nested structure follows Figma variable path: `Status/success-primary` → `color.status.success-primary`
- `$type` is `"color"` for color variables, `"dimension"` for all others
- `$value` uses the Actian mode value (default theme)
- `$description` populated from the variable's `description` field (from Phase 2)
- `$extensions.com.figma` includes `variableKey`, `collection`, and `scopes` for programmatic consumption
- `$extensions.modes` includes per-mode values for color variables (omit for single-mode collections)
- Sort keys alphabetically at each nesting level

Write to `tokens/actian-ds.tokens.json`.

#### Error handling

- If Phase 2 data is missing or incomplete (e.g., the skill was run for Phase 4 only without Phase 2), log an error: "Phase 2 variable data required. Run Phase 2 first or use 'sync all'." and abort Phase 4.
- If any variable has an `UNRESOLVED` value from Phase 2, carry it through to all 3 outputs and add a comment/warning in the CSS file (`/* UNRESOLVED: variable-name */`) and a `$status: "unresolved"` field in the JSON.

### Phase 5 -- Component guidelines

Extract per-component design and content guidelines from DS2026 guideline pages.

#### Single-component mode

When the user specifies a component name (e.g., "sync Button"), skip the full page discovery and extract only that component:

1. Find the component page by matching the name against the page list
2. Extract guideline frames for that page only
3. Update only that component's JSON file
4. Update `_index.json` with the new extraction date for that component
5. Skip all other phases unless explicitly requested

This is the most MCP-efficient mode — typically 2-4 calls per component.

#### Step 1: Discover component pages

Use `use_figma` on the DS2026 library (`l8biHxfarNi1I2RMvVxVOK`) to list all pages and identify component pages. Component pages are located under the "COMPONENTS" section and are indented in Figma's page list:

```js
const pages = figma.root.children;
const componentPages = pages.filter(p => p.name.trim().startsWith('  ')); // indented = component pages
return JSON.stringify(componentPages.map(p => ({
  name: p.name.trim(),
  id: p.id,
  childCount: p.children.length
})), null, 2);
```

Expected: ~44 component pages (Button, Checkbox, Data table, Dialog, Dropdown, etc.).

#### Step 2: For each component page, find guideline frames

For each component page, list its top-level children to find guideline frames. Look for named frames: "Content guidelines", "Design guidelines", "Components", "ready made examples", "Screenshots of use cases", "Behavior demo":

```js
const page = figma.root.children.find(p => p.id === 'PAGE_ID');
return JSON.stringify(page.children.map(c => ({
  name: c.name,
  id: c.id,
  type: c.type
})), null, 2);
```

Batch multiple pages per `use_figma` call where possible to conserve rate limit budget. For example, list children of 3-4 pages in a single call.

#### Step 3: Extract text content

For each guideline frame found in Step 2, call `get_design_context` with the frame's node ID and `excludeScreenshot: true` (to save rate limit budget and reduce response size). Parse the React+Tailwind output to extract meaningful text content — headings, body text, bullet lists, and do/don't pairs.

```
get_design_context(fileKey: "l8biHxfarNi1I2RMvVxVOK", nodeId: "FRAME_NODE_ID")
```

Focus on extracting:
- **Content guidelines:** Do/Don't pairs, writing rules, label recommendations
- **Design guidelines:** Spacing rules, variant usage, when-to-use guidance
- **Behavior demo:** Interaction descriptions (hover, click, keyboard)
- **Screenshots of use cases:** Context descriptions (skip the actual images)

#### Step 4: Transform to JSON

Match the existing `docs/component-guidelines/*.json` format. Read 1-2 existing JSON files first to match the schema exactly:

```bash
ls docs/component-guidelines/
cat docs/component-guidelines/button.json  # reference schema
```

Output one JSON file per component (e.g., `button.json`, `checkbox.json`) plus `_index.json` listing all components with their extraction status and date.

Each component JSON should include:
- `name`: Component name
- `extractedOn`: ISO date
- `sourcePageId`: Figma page node ID
- `contentGuidelines`: Array of guideline entries (do/don't pairs, rules)
- `designGuidelines`: Array of design guidance entries
- `behaviorNotes`: Array of interaction descriptions
- `useCases`: Array of usage context descriptions

#### Rate limit strategy

With ~44 component pages x ~3 guideline frames each = ~132 `get_design_context` calls. This will exceed the daily Pro limit (200 calls/day) when combined with other phases. Strategy:

- Use `use_figma` for frame discovery (batch multiple pages per call = ~15 calls total)
- Use `get_design_context` only for guideline frames (skip "Components" frames which contain the actual component variants — those are already catalogued in Phase 1)
- Support incremental sync: track which components were extracted and their dates in `_index.json`. On subsequent runs, only re-extract components whose page has changed
- If rate limit is reached mid-extraction, save progress to `_index.json` with `"status": "partial"` and report which components remain. The user can resume in a later session

#### Error handling

- If a component page has no guideline frames (only "Components" frame), create the JSON file with empty guideline arrays and note `"status": "no-guidelines"` in the index
- If `get_design_context` fails for a specific frame, log the frame name and component, mark as `"status": "error"` in the index, and continue with remaining frames
- After completion, report: total components processed, guidelines extracted, errors encountered

### Phase 6 -- Foundations + Content + Accessibility

Extract foundation docs (11 pages), content guidelines, and accessibility guidelines from DS2026.

#### Foundation pages

11 foundation pages in DS2026 with their known node IDs:

| Page | Node ID | Expected children |
|------|---------|-------------------|
| Accessibility | `12685:19373` | 23 |
| Borders | `13321:12804` | — |
| Breakpoint/grid/structure | `12217:457` | — |
| Color | `12054:27511` | — |
| Content guidelines | `7397:3249` | 2 |
| Elevation | `12054:27514` | — |
| Icons | `7370:3775` | — |
| Interaction & motion | `12054:27512` | — |
| Spacing | `12054:27513` | — |
| Typography | `12054:26789` | — |
| Usage example | `12957:2843` | — |

#### Step 1: Extract foundation page content

For each foundation page (except Accessibility and Content guidelines, which are handled separately below):

1. List top-level frames via `use_figma`:

```js
const page = figma.root.children.find(p => p.id === 'PAGE_NODE_ID');
return JSON.stringify(page.children.map(c => ({
  name: c.name,
  id: c.id,
  type: c.type
})), null, 2);
```

2. Extract content from each frame via `get_design_context` (with `excludeScreenshot: true`):

```
get_design_context(fileKey: "l8biHxfarNi1I2RMvVxVOK", nodeId: "FRAME_NODE_ID")
```

3. Transform to JSON matching `docs/foundations/*.json` format. Read 1-2 existing JSON files first to match the schema. Each foundation JSON includes:
   - `name`: Foundation topic name
   - `extractedOn`: ISO date
   - `sourcePageId`: Figma page node ID
   - `sections`: Array of content sections with headings and body text

Output files: `docs/foundations/borders.json`, `docs/foundations/breakpoints.json`, `docs/foundations/color.json`, `docs/foundations/elevation.json`, `docs/foundations/icons.json`, `docs/foundations/interaction-motion.json`, `docs/foundations/spacing.json`, `docs/foundations/typography.json`, `docs/foundations/usage-example.json`.

#### Step 2: Extract content guidelines

Page: `7397:3249` (2 children).

1. List the 2 top-level frames via `use_figma`
2. Extract both frames via `get_design_context`
3. Transform into Markdown format — headings, body paragraphs, bullet lists, do/don't pairs
4. Write to `docs/content-guidelines.md`, replacing the existing hand-authored version

Add a header noting the source:

```markdown
# Content Guidelines — Actian Design System 2026

Extracted from DS2026 Figma library on YYYY-MM-DD.
Source: [Content guidelines page](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK?node-id=7397:3249)

---

[... extracted content ...]
```

#### Step 3: Extract accessibility guidelines

Page: `12685:19373` (23 children, all named "Design guidelines").

This page has a known ambiguity: all 23 frames share the same name. Differentiate by examining the content within each frame — specifically the section header text at the top of each frame.

1. List all 23 frames via `use_figma`:

```js
const page = figma.root.children.find(p => p.id === '12685:19373');
return JSON.stringify(page.children.map((c, i) => ({
  name: c.name,
  id: c.id,
  index: i,
  type: c.type
})), null, 2);
```

2. Extract each frame via `get_design_context`. Parse the response to identify the actual section topic from the heading text within each frame (e.g., "Color contrast", "Keyboard navigation", "Screen reader support", etc.)

3. Group extracted content by section topic. Transform into Markdown with proper heading hierarchy:

```markdown
# Accessibility Guidelines — Actian Design System 2026

Extracted from DS2026 Figma library on YYYY-MM-DD.
Source: [Accessibility page](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK?node-id=12685:19373)

---

## Color Contrast
[... content from frame N ...]

## Keyboard Navigation
[... content from frame M ...]

[... all 23 sections ...]
```

4. Write to `docs/accessibility-guidelines.md`, replacing the existing hand-authored version

Also write `docs/foundations/accessibility.json` with the structured JSON version for programmatic consumption.

#### Rate limit strategy

Foundation pages: 11 pages x ~3 frames average = ~33 `get_design_context` calls. The Accessibility page alone requires 23 calls. Combined total: ~56 calls for Phase 6.

Combined with Phase 5 (~132 calls), the total for Phases 5+6 is ~188 calls — near the daily Pro limit (200). Strategy:

- Run Phase 6 foundations first (fewer calls, higher value)
- Content guidelines (2 calls) and Accessibility (23 calls) are the highest priority within Phase 6
- If rate limit is approaching, prioritize: Content guidelines → Accessibility → Color → Typography → Spacing → remaining foundations
- Track extraction progress: write `docs/foundations/_index.json` with per-page status
- Support resumption: on re-run, skip pages already extracted (check `_index.json`)

#### Error handling

- If a foundation page is inaccessible or returns empty content, log the page name and continue. Write the JSON file with `"status": "error"` and an empty sections array
- For the Accessibility page, if frame content cannot be differentiated by heading, fall back to numbering sections as "Section 1", "Section 2", etc. and flag for manual review
- After completion, report: total foundation pages extracted, content guidelines status, accessibility guidelines status, any pages skipped or errored

### Phase 7 -- Validation

Diff local files against current Figma state. Report stale files, missing entries, and value mismatches without overwriting.

This phase runs after all extraction phases complete (or can be triggered standalone via "Validate sync"). It does NOT overwrite any files — it produces a report and waits for user approval before committing.

#### Step 1: Diff against previous

After all phases complete, run `git diff --stat docs/ tokens/` to summarize what changed:

```bash
git diff --stat docs/ tokens/
git diff --stat --cached docs/ tokens/  # also check staged changes
```

Also count specific changes:
- New files added (not previously tracked)
- Files modified (content changed)
- Files deleted (existed before but not regenerated)

#### Step 2: Present sync report

Output a structured Markdown report summarizing all changes across all phases:

```markdown
## Sync Report — YYYY-MM-DD

### Files changed

| File | Status | Changes |
|------|--------|---------|
| docs/ds2026-components.md | Updated | +3 components, -0 |
| docs/fm-components.md | Unchanged | — |
| docs/meta-kit/components.md | Updated | +1 component |
| docs/meta-kit/variables.md | Updated | +100 variables (was 15, now 115) |
| docs/meta-kit/text-styles.md | Created | 12 text styles |
| docs/meta-kit/effect-styles.md | Created | 5 effect styles |
| docs/token-reference.md | Updated | +12 new tokens |
| tokens/tokens.css | Updated | +12 new tokens, 3 value changes |
| tokens/actian-ds.tokens.json | Updated | +12 new tokens |
| docs/content-guidelines.md | Replaced | Hand-authored → Figma-extracted |
| docs/accessibility-guidelines.md | Replaced | Hand-authored → Figma-extracted |
| docs/component-guidelines/*.json | Updated | 44 components (3 new, 2 errors) |
| docs/foundations/*.json | Updated | 9 foundations extracted |

### Summary
- Components: 77 DS2026 + 29 FM + 6 Meta Kit = 112 total
- Variables: 115 (86 color + 29 non-color)
- Text styles: 12
- Effect styles: 5
- Component guidelines: 44 components
- Foundation pages: 9 extracted
- Content guidelines: Replaced
- Accessibility guidelines: Replaced

### Warnings
- ⚠ [any unresolved variable aliases from Phase 2]
- ⚠ [any component guideline extraction errors from Phase 5]
- ⚠ [any foundation pages that failed from Phase 6]
- ⚠ [any files that existed before but were not regenerated]
- ⚠ [any unexpected deletions or large diffs that may indicate a problem]
```

If running in validate-only mode (no extraction performed), compare existing local files against a fresh Figma extraction to identify stale data — but do not overwrite.

#### Step 3: Approval gate

Present the report and ask:

> "Review the changes above. Approve to commit, or specify which files to revert."

**Do NOT commit automatically.** Wait for explicit user approval. This is a dry-run + approval gate pattern.

If the user requests reverts:
- Run `git checkout -- <file>` for each file the user wants to revert
- Re-run the diff to confirm the reverts
- Present the updated report

#### Step 4: Post-approval

On user approval, stage and commit all changed files:

```bash
git add docs/ tokens/
git commit -m "sync: update design system data from Figma (YYYY-MM-DD)"
```

Do NOT push to remote. The user will push when ready.

After committing, output a final confirmation:

```markdown
### Committed
`sync: update design system data from Figma (YYYY-MM-DD)`

Changed files: [N] files, [+X] insertions, [-Y] deletions
```

#### Error handling

- If `git diff` shows no changes at all, report: "No changes detected. Local files are up to date with Figma." and skip the approval gate
- If uncommitted changes exist in `docs/` or `tokens/` before sync starts, warn the user: "Uncommitted changes detected in docs/ or tokens/. Commit or stash them before syncing to avoid merge conflicts."

## What gets eliminated

This skill replaces the following pieces of the old pipeline:

- **Assembler repo as sync intermediary** -- no longer needed for data extraction; Figma is read directly.
- **`scripts/sync-from-upstream.sh`** -- removed.
- **Two-hop data flow** -- eliminated in favor of single-hop Figma-to-plugin extraction.
- **Hand-authored `content-guidelines.md`** -- replaced by Figma-extracted content from DS2026 guideline pages.
- **Hand-authored `accessibility-guidelines.md`** -- replaced by Figma-extracted content from DS2026 accessibility page.
