# Sync Phases — Implementation Reference

Full extraction procedures for each phase of `/sync-design-system`. Read this file for the phase you are executing — do not load all phases at once.

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

---

## Phase 1 — Components

Extract component sets, variant axes, properties, and keys from DS2026, FM Kit, and Meta Kit libraries.

### Step 1: Extract page structure

For each library, call `use_figma` to retrieve the page tree with component set counts:

```js
const pages = figma.root.children.map(p => ({
  name: p.name,
  id: p.id,
  componentSets: p.findAll(n => n.type === 'COMPONENT_SET').length
}));
return JSON.stringify(pages, null, 2);
```

### Step 2: Extract component sets

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
// ... same mapping as above
```

Use page counts from Step 1 to decide: DS2026 (77 sets) needs chunking. FM Kit (29) and Meta Kit (6) may fit in one call.

### Step 3: Format output

**DS2026 format** (`docs/ds2026-components.md`):

```markdown
# Actian Design System 2026 — Component Reference

Auto-generated from Figma MCP on YYYY-MM-DD.
77 component sets, NNN individual components.

Source: [Actian Design System v1.1.0](https://www.figma.com/design/l8biHxfarNi1I2RMvVxVOK)

---

## Button

### Button
Primary trigger for a specific action...

- Variants: **Type:** `Primary` · `Secondary` · ... | **Size:** `Default` · `Small` | **State:** `Default` · `Hovered` · ...
- Text overrides: `Label`
- Node: `7206:2643` | Key: `5a6d10d26bef3cc83955bf32a318c6b4682f25d3`
```

**FM Kit format** (`docs/fm-components.md`): Same structure, adapted for FM Kit names.
**Meta Kit format** (`docs/meta-kit/components.md`): Same structure, adapted for Meta Kit names.

Formatting rules:
- Group components by page using `## Page Name` headings
- Each component set gets a `### Component Name` heading
- Variant axes: `**Axis:** \`Value1\` · \`Value2\``; multiple axes separated by ` | `
- Text overrides listed only if TEXT entries exist
- Node ID and Key on the last bullet

### Error handling

- If a library is inaccessible, log a warning and skip it
- If a single page extraction fails, log the page name and continue
- After writing, report total component set count per library

---

## Phase 2 — Variables

Extract all DS2026 variables with keys, types, scopes, and resolved per-mode values across 3 themes.

### Step 1: Extract raw variables

Call `use_figma` on DS2026 (`l8biHxfarNi1I2RMvVxVOK`):

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

Expected: Spacing (6), Color (86, 3 modes), Border (12), Size (7), Breakpoint (4) = 115 total.

**Chunking:** Color collection (86 vars x 3 modes) exceeds 20KB. Split:
1. First call: Spacing + Border + Size + Breakpoint
2. Second call: Color collection with alias resolution

### Step 2: Resolve aliases

Color variables use `VARIABLE_ALIAS` references. Resolve each alias chain:

```js
async function resolveValue(value, modeId) {
  if (value && value.type === 'VARIABLE_ALIAS') {
    const aliasVar = await figma.variables.getVariableByIdAsync(value.id);
    const aliasValue = aliasVar.valuesByMode[modeId];
    return resolveValue(aliasValue, modeId);
  }
  return value;
}
```

### Step 3: Convert RGBA to hex

```js
function rgbaToHex(rgba) {
  const r = Math.round(rgba.r * 255);
  const g = Math.round(rgba.g * 255);
  const b = Math.round(rgba.b * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}
```

If `a < 1`, append alpha as two hex digits. For `a === 1`, use 6-digit hex.

### Step 4: Format output

Write `docs/meta-kit/variables.md` with ALL 115 variables by collection:

```markdown
# Meta Kit Variable Keys

## Color Variables

| Variable | Key | Actian | Studio | Explorer | Purpose |
|----------|-----|--------|--------|----------|---------|
| background-bg-default | `805af...` | #FFFFFF | #FFFFFF | #FFFFFF | Card backgrounds |

## Spacing Variables

| Variable | Key | Value | Purpose |
|----------|-----|-------|---------|
```

Formatting: color table has per-mode columns; non-color has single Value column. Sort alphabetically within sections.

### Error handling

- Circular/missing alias → use `"UNRESOLVED"` as hex
- Collection extraction failure → log and continue
- After writing, report counts and flag unresolved aliases

---

## Phase 3 — Styles

Extract text styles and effect styles from DS2026.

### Step 1: Extract text styles

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

Expected: 12 text styles, all Roboto.

### Step 2: Extract effect styles

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

Expected: 5 effect styles (shadow-xs through shadow-xl), each with 2 DROP_SHADOW effects.

### Step 3: Format text styles output

Write `docs/meta-kit/text-styles.md`:

```markdown
# Meta Kit — Text Styles

| Style | Key | Font | Weight | Size | Line Height | Letter Spacing |
|-------|-----|------|--------|------|-------------|----------------|
```

Formatting: `lineHeight` as `Npx` or `Auto`, `letterSpacing` as `Npx` or `N%`. Sort by fontSize descending.

### Step 4: Format effect styles output

Write `docs/meta-kit/effect-styles.md`:

Summary table: `TYPE(x,y,blur,spread,rgba(...))` notation, multiple effects joined with ` + `.
Detail sub-tables: one row per effect per style.
Convert RGBA floats to CSS `rgba(R,G,B,A)`. Sort xs → xl.

### Error handling

- Empty arrays → log warning, continue
- Report total counts after writing

---

## Phase 4 — Token files

Transform Phase 2 variable data into 3 output formats. No Figma MCP calls — transforms already-extracted data.

### Token naming convention

- Prefix: `--zen-color-` / `--zen-spacing-` / `--zen-border-` / `--zen-size-` / `--zen-breakpoint-`
- Path separator: `/` → `-` (e.g., `Status/success-primary` → `--zen-color-status-success-primary`)
- Case: lowercase

### Step 1: token-reference.md

```markdown
# Token Reference — Actian Design System 2026

## Color Tokens

| Token | CSS Variable | Actian | Studio | Explorer |
|-------|-------------|--------|--------|----------|

## Spacing Tokens

| Token | CSS Variable | Value |
|-------|-------------|-------|
```

Color table has per-mode columns. Non-color has single Value. Sort alphabetically.

### Step 2: tokens.css

```css
:root, [data-theme="actian"] {
  --zen-color-theme-primary: #0550DC;
}
[data-theme="studio"] {
  --zen-color-theme-primary: #7B2FBE;
}
[data-theme="explorer"] {
  --zen-color-theme-primary: #00875A;
}
:root {
  --zen-spacing-2xs: 4px;
}
```

Studio/Explorer blocks only include tokens that differ from Actian. Non-color tokens under plain `:root`. Add `px` suffix to non-color values. Sort alphabetically within blocks.

### Step 3: actian-ds.tokens.json

W3C DTCG format:

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "$metadata": { "source": "Actian Design System 2026", "extractedOn": "YYYY-MM-DD", "figmaFileKey": "l8biHxfarNi1I2RMvVxVOK" },
  "color": {
    "theme": {
      "primary": {
        "$type": "color",
        "$value": "#0550DC",
        "$extensions": {
          "com.figma": { "variableKey": "a256...", "collection": "Color", "scopes": ["ALL_FILLS"] },
          "modes": { "actian": "#0550DC", "studio": "#7B2FBE", "explorer": "#00875A" }
        }
      }
    }
  }
}
```

`$type`: `"color"` for color, `"dimension"` for others. `$value`: Actian mode. `$extensions.modes` only for color. Sort keys alphabetically.

### Error handling

- Missing Phase 2 data → abort with error message
- `UNRESOLVED` values → carry through with CSS comment and `$status` field

---

## Phase 5 — Component guidelines

Extract per-component design and content guidelines from DS2026 guideline pages.

### Single-component mode

When user specifies a name (e.g., "sync Button"):
1. Match name against page list
2. Extract guideline frames for that page only
3. Update only that component's JSON
4. Update `_index.json`
5. Typically 2-4 MCP calls

### Step 1: Discover component pages

```js
const pages = figma.root.children;
const componentPages = pages.filter(p => p.name.trim().startsWith('  ')); // indented = component pages
return JSON.stringify(componentPages.map(p => ({
  name: p.name.trim(),
  id: p.id,
  childCount: p.children.length
})), null, 2);
```

Expected: ~44 component pages.

### Step 2: Find guideline frames per page

```js
const page = figma.root.children.find(p => p.id === 'PAGE_ID');
return JSON.stringify(page.children.map(c => ({
  name: c.name,
  id: c.id,
  type: c.type
})), null, 2);
```

Batch 3-4 pages per call.

### Step 3: Extract text content

Call `get_design_context` with `excludeScreenshot: true` per guideline frame. Extract:
- Content guidelines: Do/Don't pairs, writing rules, label recommendations
- Design guidelines: Spacing rules, variant usage, when-to-use guidance
- Behavior demo: Interaction descriptions
- Screenshots of use cases: Context descriptions (skip images)

### Step 4: Transform to JSON

Match existing `docs/component-guidelines/*.json` schema. Read 1-2 existing files first. Each JSON includes: `name`, `extractedOn`, `sourcePageId`, `contentGuidelines`, `designGuidelines`, `behaviorNotes`, `useCases`.

Output `_index.json` with per-component extraction status and date.

### Rate limit strategy

~44 pages x ~3 frames = ~132 `get_design_context` calls. Strategy:
- Use `use_figma` for frame discovery (batch = ~15 calls)
- Skip "Components" frames (already in Phase 1)
- Support incremental sync via `_index.json`
- If rate limit reached, save progress with `"status": "partial"`

### Error handling

- No guideline frames → empty arrays + `"status": "no-guidelines"`
- Frame extraction fails → `"status": "error"` in index, continue
- Report totals and errors after completion

---

## Phase 6 — Foundations + Content + Accessibility

### Foundation pages

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

### Step 1: Extract foundation page content

For each page (except Accessibility and Content guidelines):
1. List top-level frames via `use_figma`
2. Extract via `get_design_context` with `excludeScreenshot: true`
3. Transform to JSON → `docs/foundations/*.json`

### Step 2: Extract content guidelines

Page `7397:3249` (2 children). Extract both frames, transform to Markdown, write to `docs/content-guidelines.md`.

### Step 3: Extract accessibility guidelines

Page `12685:19373` (23 children, all named "Design guidelines"). Differentiate by heading text within each frame. Group by topic, write to `docs/accessibility-guidelines.md` + `docs/foundations/accessibility.json`.

### Rate limit strategy

~56 calls for Phase 6. Combined with Phase 5: ~188 total (near Pro limit of 200).
Priority order: Content guidelines → Accessibility → Color → Typography → Spacing → rest.
Track progress in `docs/foundations/_index.json`. Support resumption.

### Error handling

- Inaccessible page → `"status": "error"`, empty sections, continue
- Accessibility ambiguity fallback → number sections, flag for manual review
- Report per-page status after completion

---

## Phase 7 — Validation

Diff local files against current Figma state without overwriting.

### Step 1: Diff

```bash
git diff --stat docs/ tokens/
```

Count new, modified, and deleted files.

### Step 2: Sync report

Present structured Markdown report: files changed, summary counts, warnings.

### Step 3: Approval gate

Present report and ask for approval. **Do NOT commit automatically.**
If user requests reverts: `git checkout -- <file>`, re-diff, re-present.

### Step 4: Post-approval

```bash
git add docs/ tokens/
git commit -m "sync: update design system data from Figma (YYYY-MM-DD)"
```

Do NOT push. User pushes when ready.

### Error handling

- No changes → report "up to date", skip approval
- Uncommitted changes before sync → warn user to commit/stash first
