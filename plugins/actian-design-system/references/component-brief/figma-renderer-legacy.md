# Brief Figma Renderer — Micro-Task Architecture

The skill assembles a **micro-task checklist** for each `use_figma` call. Every `□` item is mandatory — skipping any is a P0 bug. The AI translates each line to current Plugin API code using loaded Figma MCP skills.

**Principle:** Constrain WHAT to build (data model + checklist), let AI decide HOW (current Figma API).

## HARD RULE — Meta Kit components are mandatory

**Every visual element that has a Meta Kit component MUST use that component.** Do NOT create raw frames as substitutes. This is the #1 cause of inconsistent Figma output.

| Instead of... | MUST use... |
|---------------|------------|
| 12x12 colored rectangle | **Color Swatch** (Size=Small) — import, set fill |
| Green/red text badge "Pass"/"Fail" | **Contrast Badge** (Status=Pass/Fail/Exempt) — import, select variant |
| Lettered circle "A", "B" with line | **Pointer Badge** (Direction=Left/Right/Up/Down) — import, set label, position with absoluteBoundingBox |
| Measurement line with value | **Dimension Annotation** (Orientation=H/V) — import, set value |
| A11y card with icon + title + body | **Accessibility Card** (Mode=DS/FM) — import, set all properties |
| Do/Don't side-by-side | **Do-Don't Pair** (Mode=DS/FM) — import, set labels and examples |
| Card wrapper with title + content | **Brief Card** (Mode=DS/FM, Type=Standard/Page Header) — import, set props, detach, append children |
| Dark code box | **Code Block** — import, set code text, detach, apply setRangeFills |
| Horizontal line between sections | **Card Divider** — import directly |
| Theme comparison swatch card | **Theme Card** (Theme=Actian/Studio/Explorer) — import, select variant |

**If you build a raw frame for ANY of these, it is a P0 bug.** Check the component keys table below and import the real component.

## Prerequisites

Before any `use_figma` call, the skill must:
1. Read `brief-data.json` (generated in Step 1.5)
2. Read this file (call templates + component keys)

## Component keys

| Component | Key | Import method | Usage |
|-----------|-----|---------------|-------|
| Brief Card | `3dbb732730af0754210cde7af35e5236a2502843` | `importComponentSetByKeyAsync` | Card wrapper (all 9 cards) |
| Do-Don't Pair | `28edfacf13e50706586172bd48f8a3ad84d7c263` | `importComponentSetByKeyAsync` | Cards 6, 7 |
| Color Swatch | `da3369932f710386b76ca91a40ebd48d94e3f2e0` | `importComponentSetByKeyAsync` | Card 4 (token swatches), Card 8 (contrast table), Card 2 (theme swatches) |
| Contrast Badge | `941756541adc6ce21e32e848c2039c64fece0fcf` | `importComponentSetByKeyAsync` | Card 8 (contrast table Pass/Exempt/Fail) |
| Pointer Badge | `7e066fc21d9a2bbbcd1149113787cf59140162d4` | `importComponentSetByKeyAsync` | Card 3 (anatomy structure badges A, B, C, D) |
| Dimension Annotation | `49bf6a1b210a403ba145a3fdee9b1994eb54069a` | `importComponentSetByKeyAsync` | Card 3 (specs measurements) |
| Accessibility Card | `b4779a13f4097d682413a669eaaf9ead1b49f115` | `importComponentSetByKeyAsync` | Card 8 (6 requirement cards in 2x3 grid) |
| Theme Card | (from Brief Card set — Theme=Actian/Studio/Explorer variants) | variant of Brief Card | Card 2 (theme comparison) |
| Code Block | `1bf10eee1751a46da5f90a9671be6c9abf0073b7` | `importComponentByKeyAsync` | Card 9, Card 8 (code snippets) |
| Generation Log | `a9653f30925367e96dea90093d750bfe70849571` | `importComponentByKeyAsync` | Card 1 (generation metadata) |
| Card Divider | `f4d778e1cf9bb61a33712c791486f54bb1c095b7` | `importComponentByKeyAsync` | Between sections within cards |

### Template keys (clone-and-fill)

Import → `createInstance()` → `detachInstance()` → fill slot text nodes by name.

| Template | Key | Slots | Usage |
|----------|-----|-------|-------|
| Table Header Row | `0754accfc4bc79ce9a68ff8fe7a108f1b41b9b2e` | `label` | Cards 4, 5, 8 (table headers) |
| Table Data Row | `3a1fae22dd85936f81565122888efd8a50e37180` | `label`, `value` | Cards 4, 5, 8 (table rows) |
| State Column | `4f782d1a8541b4474858767209f99dce1428784b` | `title` | Card 3 (one column per state) |
| Section Header | `f4fd576001f4f1f4606a4efb051d1e4492e378c4` | `title`, `subtitle` | All cards (section titles) |
| Swatch Row | `96647364b6cb5c55b7ced72106708daaa33afb7f` | `name`, `value`, `hex` | Card 4 (color token rows with dot) |
| A11y Spec Row | `92ed7bc88cf229782c4b42238aacba1d15f8fd06` | `element`, `role`, `label`, `focus-order`, `keyboard`, `announcement` | Card 8 (ARIA specification table) |

## How the skill assembles each call

For each of the 11 calls:

1. Read the **static call template** below — defines sections and Meta Kit components
2. Read **dynamic data** from `brief-data.json` — provides row counts, values, hex colors
3. **Merge:** expand each `${data}` placeholder into explicit `□` lines with actual values
4. Set `use_figma` `description` to: `"Complete ALL micro-tasks in the checklist comment. Every □ item is mandatory. Do NOT skip any."`
5. Set `use_figma` `code` to: the assembled checklist as a `/* */` comment block at the top, followed by minimal boilerplate (helpers, font loading). The AI writes the implementation code below the comment.
6. Always pass `skillNames: "figma-use"` (or `"figma-use,figma-generate-library"` for component building)

## Syntax token color map

Used when assembling Card 9 and Card 8 code block checklists:

| Token type | Hex color |
|-----------|-----------|
| `selector` | `#FF79C6` |
| `property` | `#82AAFF` |
| `value` | `#C3E88D` |
| `comment` | `#676E95` |
| `keyword` | `#C792EA` |
| `string` | `#C3E88D` |
| `punctuation` | `#BABED8` |
| `tag` | `#FF5370` |
| `attribute` | `#FFCB6B` |
| `function` | `#82AAFF` |
| `text` | `#BABED8` |

---

## Call 1: Wrapper + Generation Log + Card 1

**Static structure:**
- Navigate to target page
- Create wrapper frame
- Import Generation Log, set all 6 properties from `meta`
- Import Brief Card (Mode=DS, Type=Page Header), set name + description from `card1_header`

**Checklist template:**

```
MICRO-TASKS — complete ALL (skipping any is a P0 bug):

WRAPPER:
□ Navigate to target page via getNodeByIdAsync("${meta.nodeId}"), walk to PAGE, setCurrentPageAsync
□ Create wrapper frame: name="Component Spec: ${meta.component}", layoutMode=HORIZONTAL, itemSpacing=32, primaryAxisSizingMode=AUTO, counterAxisSizingMode=AUTO, fills=[]
□ Position wrapper: x = targetNode.x + targetNode.width + 200, y = targetNode.y

GENERATION LOG:
□ Import Generation Log (key: a9653f30925367e96dea90093d750bfe70849571)
□ setProp Skill = "${meta.skill}"
□ setProp Prompt = "component-brief ${meta.component}"
□ setProp Date = "${meta.generatedAt}"
□ setProp Duration = "${meta.duration}"
□ setProp Model = "${meta.model}"
□ setProp Plugin Version = "v${meta.pluginVersion}"
□ Append to wrapper

CARD 1 — Page header:
□ Import Brief Card (key: 3dbb732730af0754210cde7af35e5236a2502843)
□ Find variant "Mode=DS, Type=Page Header"
□ setProp Component Name = "${card1_header.name}"
□ setProp Description = "${card1_header.description}"
□ Detach instance, rename to "Page header"
□ Append to wrapper, set layoutSizingVertical = 'HUG'

RETURN: wrapper node ID (needed by all subsequent calls)
```

---

## Call 2: Card 2 — Actual component

**Static structure:**
- Brief Card Standard shell
- Variant matrix: one row per `variantMatrix` entry, one real component instance per column
- Theme comparison: 3 cards (Actian, Studio, Explorer) with instances + swatch dots

**Checklist template:**

```
MICRO-TASKS — complete ALL (skipping any is a P0 bug):

CARD SHELL:
□ Get wrapper by ID: ${wrapperNodeId}
□ Import Brief Card Standard (key: 3dbb732730af0754210cde7af35e5236a2502843, variant "Mode=DS, Type=Standard")
□ setProp Title = "Actual component"
□ setProp Subtitle = "Live component across all states and theme modes"
□ Detach → card frame, find "Content" child

VARIANT MATRIX:
□ Get local component set via getNodeByIdAsync("${meta.nodeId}")
${card2_component.variantMatrix.map(row =>
  `□ Row "${row.row}":\n` +
  row.columns.map(col =>
    `  □ Column "${col.label}": find variant "${col.variantName}", createInstance, add state label`
  ).join('\n')
).join('\n')}

THEME COMPARISON:
□ Actian: instance of variant "${themeComparison.actian.variantName}" + swatches: ${themeComparison.actian.swatches.map(s => s.token + ' ' + s.hex).join(', ')}
□ Studio: instance of variant "${themeComparison.studio.variantName}" + swatches: ${themeComparison.studio.swatches.map(s => s.token + ' ' + s.hex).join(', ')}
□ Explorer: instance of variant "${themeComparison.explorer.variantName}" + swatches: ${themeComparison.explorer.swatches.map(s => s.token + ' ' + s.hex).join(', ')}
□ Each swatch = 12x12 rectangle with cornerRadius 3, filled with hex color, + token name text

SIZING:
□ card.layoutSizingVertical = 'HUG'
□ All rows and columns: layoutSizingVertical = 'HUG'
□ Append card to wrapper
```

---

## Call 3: Card 3 — Anatomy: Extract part positions (Tier 1)

**Purpose:** Read the absolute positions of component parts so badges and annotations can be placed accurately in Calls 4-5. This is a read-then-build call — create an instance, read positions, then build the card structure.

**Checklist template:**

```
MICRO-TASKS — complete ALL (skipping any is a P0 bug):

CARD SHELL:
□ Import Brief Card Standard, setProp Title="Anatomy", Subtitle="Component structure, dimensions, interactive states, and part-level token mapping"
□ Detach → card frame, find "Content" child
□ Append card to wrapper (ID: ${wrapperNodeId})

EXTRACT PART POSITIONS:
□ Get local component set via getNodeByIdAsync("${meta.nodeId}")
□ Create instance of default variant
□ Append instance to a temporary frame inside Content (so it renders and has absoluteBoundingBox)
□ Read instance.absoluteBoundingBox → store as instanceBounds
□ For each part, find child by name and read position:
${card3_anatomy.parts.map(p =>
  `□ Find child "${p.figmaLayerName}" → read absoluteBoundingBox → store as part${p.letter}Bounds`
).join('\n')}

STRUCTURE SUB-SECTION (using extracted positions):
□ Add section title text "Structure" (Inter Semi Bold 16px)
□ Create anatomy diagram frame: layoutMode=NONE (free positioning), width=800, height=auto, fills=[{type:'SOLID', color:{r:0.976,g:0.98,b:0.984}}], cornerRadius=12, padding=48
□ Move the instance inside the diagram frame, center it horizontally

POINTER BADGES (positioned using absoluteBoundingBox):
□ Import Pointer Badge set (key: 7e066fc21d9a2bbbcd1149113787cf59140162d4)
${card3_anatomy.parts.map(p =>
  `□ Pointer Badge "${p.letter}":
  □ Find variant Direction=Left, createInstance, setProp Label="${p.letter}"
  □ Position: x = instanceBounds.x - 50 (left of component), y = part${p.letter}Bounds.y + part${p.letter}Bounds.height/2 - 10 (vertically centered on part)
  □ Draw vector leader line: figma.createVector() with vectorPaths M (badgeRightEdge) (badgeCenterY) L (part${p.letter}Bounds.x) (part${p.letter}CenterY)
  □ Leader stroke: 1px #E91E8C (pink), strokeWeight=1`
).join('\n')}

□ Add legend row below diagram (horizontal auto-layout, 20px gap):
${card3_anatomy.parts.map(p =>
  `  □ "${p.letter} — ${p.name}"`
).join('\n')}
□ Add parts description list:
${card3_anatomy.parts.map(p =>
  `  □ "${p.letter} · ${p.name.toUpperCase()}" → "${p.description}"`
).join('\n')}

SIZING:
□ card.layoutSizingVertical = 'HUG'
□ Diagram frame: fixed width, HUG height

RETURN: card node ID (needed by Calls 4-5)
```

**Key API patterns:**
- `absoluteBoundingBox` returns `{x, y, width, height}` in page coordinates
- Badges use `layoutPositioning = 'ABSOLUTE'` if inside auto-layout, or direct x/y if inside free frame
- Vector leader lines: `figma.createVector()` with `vectorPaths: [{ windingRule: 'NONE', data: 'M x1 y1 L x2 y2' }]`
- Set `strokes: [{type:'SOLID', color:{r:0.914,g:0.118,b:0.549}}]` for #E91E8C pink

---

## Call 4: Card 3 — Anatomy: Specs with Dimension Annotations

**Static structure:**
- Find existing Anatomy card (from Call 3)
- Specs sub-section: size comparison instances + Dimension Annotations positioned using absoluteBoundingBox

**Checklist template:**

```
MICRO-TASKS — complete ALL (skipping any is a P0 bug):

FIND CARD:
□ Find "Anatomy" card in wrapper (ID: ${wrapperNodeId}), find "Content" child

□ Add Card Divider (key: f4d778e1cf9bb61a33712c791486f54bb1c095b7)

SPECS SUB-SECTION:
□ Add section title text "Specs" (Inter Semi Bold 16px)
□ Create specs frame: layoutMode=NONE (free positioning), width=800, minHeight=200, fills=[], cornerRadius=0

SIZE COMPARISON (create instances, read positions, add annotations):
□ Get local component set via getNodeByIdAsync("${meta.nodeId}")
□ Import Dimension Annotation set (key: 49bf6a1b210a403ba145a3fdee9b1994eb54069a)

${card3_anatomy.specs.map((s, i) =>
  `SPEC ${i+1}: "${s.label}" (${s.target})
□ Create component instance for this measurement context
□ Read instance absoluteBoundingBox
□ Import Dimension Annotation (Orientation=${s.orientation === 'horizontal' ? 'Horizontal' : 'Vertical'})
□ setProp Value = "${s.label}"
□ Position annotation adjacent to the measured dimension:
  □ Vertical measurement: place annotation to the right of instance, y aligned with instance top/bottom
  □ Horizontal measurement: place annotation below instance, x aligned with measured edges
□ Add label text "${s.target}" below the annotation (Inter Regular 11px #888)`
).join('\n\n')}

SIZING:
□ specs frame: fixed width, HUG height
```

---

## Call 5: Card 3 — Anatomy: States + Parts table

**Static structure:**
- Find existing Anatomy card (from Call 3)
- States sub-section: horizontal grid of real component instances per state
- Parts reference table

**Checklist template:**

```
MICRO-TASKS — complete ALL (skipping any is a P0 bug):

FIND CARD:
□ Find "Anatomy" card in wrapper (ID: ${wrapperNodeId}), find "Content" child

□ Add Card Divider

STATES SUB-SECTION:
□ Add section title text "States"
□ Create horizontal state grid (auto-layout HORIZONTAL, itemSpacing=48)
□ Get local component set via getNodeByIdAsync("${meta.nodeId}")
${card3_anatomy.states.map(state =>
  `□ State column "${state}": create vertical frame, add label "${state}" (Inter Medium 12px #888), add real component instance for state variant`
).join('\n')}

□ Add Card Divider

PARTS REFERENCE TABLE:
□ Add section title text "Parts reference"
□ Build table — headers: ["Part", "Element", "Token", "Notes"]
${card3_anatomy.partsTable.map(r =>
  `□ Row: "${r.part}" | "${r.element}" | "${r.token}" | "${r.notes}"`
).join('\n')}

SIZING:
□ All sub-frames: layoutSizingHorizontal = 'FILL', layoutSizingVertical = 'HUG'
```

---

## Call 6: Card 4 — Design tokens

**Static structure:**
- Brief Card Standard shell
- Color tokens table with Color Swatch per cell
- Sizing & spacing table
- Typography specimens

**Checklist template:**

```
MICRO-TASKS — complete ALL (skipping any is a P0 bug):

CARD SHELL:
□ Import Brief Card Standard, setProp Title="Design tokens", Subtitle="Color, sizing, spacing, and typography tokens"
□ Detach → card frame, find "Content" child
□ Append card to wrapper (ID: ${wrapperNodeId})

COLOR TOKENS TABLE:
□ Add section title "Color tokens" (Inter Semi Bold 16px)
□ Build spec table — headers: ["Variant · State", ${colorTokens[0].columns.map(c => '"' + c.header + '"').join(', ')}]
□ Import Color Swatch (key: da3369932f710386b76ca91a40ebd48d94e3f2e0, Size=Small variant)
${card4_tokens.colorTokens.map(row =>
  `□ Row "${row.state}":` +
  row.columns.map(col =>
    ` Color Swatch fill=${col.hex} + "${col.token}"`
  ).join(' |')
).join('\n')}
□ Each Color Swatch: import component, find Size=Small, createInstance, set fill to hex color

□ Add Card Divider (key: f4d778e1cf9bb61a33712c791486f54bb1c095b7)

SIZING & SPACING TABLE:
□ Add section title "Sizing & spacing"
□ Build spec table — headers: ["Property", "Token", "Value"]
${card4_tokens.sizingTokens.map(r =>
  `□ Row: "${r.property}" | "${r.token}" | "${r.value}"`
).join('\n')}

□ Add Card Divider

TYPOGRAPHY:
□ Add section title "Typography"
${card4_tokens.typography.map(t =>
  `□ Specimen: "${t.element}" — ${t.token} · ${t.font} · ${t.tracking} tracking`
).join('\n')}

SIZING:
□ card.layoutSizingVertical = 'HUG'
□ All sub-frames: layoutSizingHorizontal = 'FILL', layoutSizingVertical = 'HUG'
```

---

## Call 7: Card 5 — Component API

**Static structure:**
- Brief Card Standard shell
- Single props table with REQ/OPT badges

**Checklist template:**

```
MICRO-TASKS — complete ALL (skipping any is a P0 bug):

CARD SHELL:
□ Import Brief Card Standard, setProp Title="Component API", Subtitle="Properties, types, defaults, and allowed values"
□ Detach → card frame, find "Content" child
□ Append card to wrapper (ID: ${wrapperNodeId})

PROPS TABLE:
□ Build spec table — headers: ["", "Property", "Type", "Default", "Values", "Notes"]
□ Column widths: [50, 140, 100, 120, 200, 350]
${card5_api.props.map(p =>
  `□ Row: ${p.required ? 'REQ badge (#FEF3F2 bg, #C10C0D text)' : 'OPT badge (#F5F5FA bg, #888 text)'} | "${p.name}" (monospace) | "${p.type}" (purple #C792EA) | "${p.default}" (green #C3E88D) | "${p.values}" | "${p.notes}"`
).join('\n')}
□ REQ/OPT badges: horizontal auto-layout frame, min-width 50px, 4px padding, bold 10px uppercase

SIZING:
□ card.layoutSizingVertical = 'HUG'
```

---

## Call 8: Cards 6 + 7 — Usage + Content guidelines

**Static structure:**
- Card 6: When to use list, When NOT to use list, Do/Don't pairs via Meta Kit component
- Card 7: Content rules with Do/Don't pairs, terminology table

**Checklist template:**

```
MICRO-TASKS — complete ALL (skipping any is a P0 bug):

CARD 6 — Usage guidelines:
□ Import Brief Card Standard, setProp Title="Usage guidelines", Subtitle="When and how to use ${card1_header.name}"
□ Detach → card frame, find "Content" child

When to use:
□ Add section title "When to use"
${card6_usage.whenToUse.map(item =>
  `□ Bullet: green "+" prefix + "${item}"`
).join('\n')}

□ Add Card Divider

When NOT to use:
□ Add section title "When NOT to use"
${card6_usage.whenNotToUse.map(item =>
  `□ Bullet: red "−" prefix + "${item}"`
).join('\n')}

□ Add Card Divider

Do/Don't pairs:
□ Import Do-Don't Pair (key: 28edfacf13e50706586172bd48f8a3ad84d7c263, variant Mode=DS)
${card6_usage.doDont.map(pair =>
  `□ Do-Don't Pair: Do Label="${pair.doLabel}", Do Example="${pair.doDetail}", Don't Label="${pair.dontLabel}", Don't Example="${pair.dontDetail}"`
).join('\n')}

□ Append Card 6 to wrapper, layoutSizingVertical = 'HUG'

CARD 7 — Content guidelines:
□ Import Brief Card Standard, setProp Title="Content guidelines", Subtitle="Label copy rules for ${card1_header.name}"
□ Detach → card frame, find "Content" child

${card7_content.rules.map(rule =>
  `RULE: "${rule.title}":\n□ Section title: "${rule.title}"\n□ Description: "${rule.description}"\n□ Do-Don't Pair: Do="${rule.do}", Don't="${rule.dont}"\n□ Add Card Divider`
).join('\n\n')}

${card7_content.terminology.length > 0 ?
  `TERMINOLOGY TABLE:\n□ Section title "Terminology"\n□ Build table — headers: ["Term", "When to use"]\n` +
  card7_content.terminology.map(t => `□ Row: "${t.term}" | "${t.use}"`).join('\n')
: ''}

□ Append Card 7 to wrapper, layoutSizingVertical = 'HUG'
```

---

## Call 9: Card 8a — Accessibility: Requirements

**Static structure:**
- Brief Card Standard shell
- 6 a11y requirement cards in 2x3 grid
- Each card: icon color square + title + body + syntax-colored code block

**CRITICAL:** Each requirement card has an inline code block that MUST have syntax coloring. The skill pre-computes `setRangeFills` calls for each card's code block, same as Call 11.

**Pre-computation (the skill does this before calling use_figma):**

For each requirement in `card8_accessibility.requirements`, compute the code block's plain text and syntax ranges:

```js
for (const req of card8_accessibility.requirements) {
  req._plainCode = req.code.tokens.map(t => t.type === 'newline' ? '\n' : t.text).join('');
  req._syntaxRanges = [];
  let offset = 0;
  for (const token of req.code.tokens) {
    if (token.type === 'newline') { offset += 1; continue; }
    req._syntaxRanges.push({
      start: offset,
      end: offset + token.text.length,
      hex: TOKEN_COLORS[token.type] || '#BABED8'
    });
    offset += token.text.length;
  }
  req._coloringCode = req._syntaxRanges.map(r =>
    `codeText.setRangeFills(${r.start}, ${r.end}, [{type:'SOLID',color:hexToRgb('${r.hex}')}]);`
  ).join('\n');
}
```

**Checklist template:**

```
MICRO-TASKS — complete ALL (skipping any is a P0 bug):

CARD SHELL:
□ Import Brief Card Standard, setProp Title="Accessibility", Subtitle="WCAG 2.1 AA requirements, keyboard navigation, ARIA patterns, and contrast ratios"
□ Detach → card frame, find "Content" child
□ Append card to wrapper (ID: ${wrapperNodeId})
□ Load fonts: Inter Regular, Inter Semi Bold, Fira Code Regular (or Source Code Pro / Roboto Mono fallback)

REQUIREMENTS (2x3 grid):
□ Add section title "Requirements"
□ Create 2-column grid frame (auto-layout HORIZONTAL with wrap, or nested rows of 2)

${card8_accessibility.requirements.map((req, i) =>
  `REQUIREMENT ${i+1}: "${req.title}"
□ Import Accessibility Card (key: b4779a13f4097d682413a669eaaf9ead1b49f115, variant Mode=DS)
□ DO NOT build raw frame — MUST use the Meta Kit component
□ setProp Title = "${req.title}"
□ setProp Body = "${req.body}"
□ setProp Icon Color = "${req.icon}" (sets the icon square fill)
□ Detach instance → find "Code" text node inside
□ Set code text characters to: "${req._plainCode}"
□ SYNTAX COLORING — MANDATORY (P0 if skipped):
${req._coloringCode}`
).join('\n\n')}

SIZING:
□ card.layoutSizingVertical = 'HUG'
□ All requirement cards: layoutSizingVertical = 'HUG'
□ Grid frame: layoutSizingHorizontal = 'FILL'
```

---

## Call 10: Card 8b — ARIA table + Contrast table

**Static structure:**
- Find existing Accessibility card (from Call 8)
- ARIA specification table
- Contrast ratios table with swatch dots + Pass/Fail badges

**Checklist template:**

```
MICRO-TASKS — complete ALL (skipping any is a P0 bug):

FIND CARD:
□ Find "Accessibility" card in wrapper (ID: ${wrapperNodeId}), find "Content" child

□ Add Card Divider

ARIA SPECIFICATION TABLE:
□ Add section title "ARIA specification"
□ Build spec table — headers: ["Element", "Role", "Label", "Focus Order", "Keyboard", "Announcement"]
${card8_accessibility.ariaTable.map(r =>
  `□ Row: "${r.element}" | "${r.role}" | "${r.label}" | "${r.focusOrder}" | "${r.keyboard}" | "${r.announcement}"`
).join('\n')}

□ Add Card Divider

CONTRAST RATIOS TABLE:
□ Add section title "Contrast ratios"
□ Build spec table — headers: ["Element", "Foreground", "Background", "Ratio", "WCAG AA"]
□ Import Color Swatch (key: da3369932f710386b76ca91a40ebd48d94e3f2e0, Size=Small) for swatch dots
${card8_accessibility.contrastTable.map(r =>
  `□ Row: "${r.element}" | swatch ${r.foreground} + "${r.foreground}" | swatch ${r.background} + "${r.background}" | "${r.ratio}" | ${r.wcag === 'Pass' ? 'green "Pass"' : r.wcag === 'Exempt' ? 'brown "Exempt"' : 'red "Fail"'}`
).join('\n')}

SIZING:
□ All sub-frames: layoutSizingHorizontal = 'FILL', layoutSizingVertical = 'HUG'
```

---

## Call 11: Card 9 — Code specification

**Static structure:**
- Brief Card Standard shell
- Code Block component with syntax coloring via setRangeFills

**CRITICAL:** The code text MUST have syntax coloring applied. A mono-color code block is a P0 bug. The AI must detach the Code Block instance, find the "Code" text node, then apply `setRangeFills` per token range.

**Checklist template:**

The skill pre-computes character offsets and the syntax coloring code before assembling the checklist.

**Pre-computation (the skill does this before calling use_figma):**

```js
// 1. Build plain text from tokens
const plainText = card9_code.tokens
  .map(t => t.type === 'newline' ? '\n' : t.text)
  .join('');

// 2. Build syntax ranges with offsets
const TOKEN_COLORS = {
  selector: '#FF79C6', property: '#82AAFF', value: '#C3E88D',
  comment: '#676E95', keyword: '#C792EA', string: '#C3E88D',
  punctuation: '#BABED8', tag: '#FF5370', attribute: '#FFCB6B',
  function: '#82AAFF', text: '#BABED8'
};

const syntaxRanges = [];
let offset = 0;
for (const token of card9_code.tokens) {
  if (token.type === 'newline') { offset += 1; continue; }
  syntaxRanges.push({
    start: offset,
    end: offset + token.text.length,
    hex: TOKEN_COLORS[token.type] || '#BABED8',
    preview: token.text.slice(0, 25)
  });
  offset += token.text.length;
}

// 3. Build the setRangeFills code string
const coloringCode = syntaxRanges.map(r =>
  `codeText.setRangeFills(${r.start}, ${r.end}, [{type:'SOLID',color:hexToRgb('${r.hex}')}]);`
).join('\n');
```

**Assembled checklist:**

```
MICRO-TASKS — complete ALL (skipping any is a P0 bug):

CARD SHELL:
□ Import Brief Card Standard, setProp Title="Code specification", Subtitle="CSS custom properties for ${card1_header.name}"
□ Detach → card frame, find "Content" child
□ Append card to wrapper (ID: ${wrapperNodeId})

CODE BLOCK SETUP:
□ Import Code Block (key: 1bf10eee1751a46da5f90a9671be6c9abf0073b7)
□ setProp Show Header = true
□ setProp Header Text = "${card9_code.language.toUpperCase()}"
□ setProp Code = [the full plain text — ${plainText.length} chars]
□ DETACH the Code Block instance: const codeFrame = codeInst.detachInstance()
□ FIND the Code text node: const codeText = codeFrame.findOne(n => n.type === 'TEXT' && n.name === 'Code')

SYNTAX COLORING — MANDATORY (P0 bug if skipped):
□ Load monospace font: await figma.loadFontAsync({ family: 'Fira Code', style: 'Regular' })
  (If Fira Code not available, try: 'Source Code Pro', 'Roboto Mono', 'Courier New')
□ Apply ALL of the following setRangeFills calls on codeText:

${coloringCode}

□ VERIFY: codeText should now have MULTI-COLOR fills (not mono-color)

SIZING:
□ content.appendChild(codeFrame)
□ codeFrame.layoutSizingHorizontal = 'FILL'
□ card.layoutSizingVertical = 'HUG'
```

**Why this works:** The skill pre-computes the exact `setRangeFills` calls with character offsets and hex colors, then pastes them as literal code lines in the checklist. The AI copies them verbatim into the `use_figma` code — no interpretation needed.

**hexToRgb helper (include in the use_figma code):**
```js
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}
```

---

## Parity validation

After all 11 calls complete, verify these counts from the data model:

| Check | Expected | Source |
|-------|----------|--------|
| Wrapper children | 10 (gen log + 9 cards) | Fixed |
| Card 2 variant instances | `variantMatrix.flatMap(r => r.columns).length` | `card2_component` |
| Card 3 Pointer Badges | `parts.length` badges + `parts.length` vector leader lines | `card3_anatomy` |
| Card 3 Dimension Annotations | `specs.length` (positioned via absoluteBoundingBox) | `card3_anatomy` |
| Card 3 state columns | `states.length` | `card3_anatomy` |
| Card 4 color table rows | `colorTokens.length` | `card4_tokens` |
| Card 4 swatch dots per row | `colorTokens[0].columns.length` | `card4_tokens` |
| Card 5 props rows | `props.length` | `card5_api` |
| Card 6 Do-Don't pairs | `doDont.length` | `card6_usage` |
| Card 7 content rules | `rules.length` | `card7_content` |
| Card 8 requirement cards | `requirements.length` (should be 6) | `card8_accessibility` |
| Card 8 ARIA rows | `ariaTable.length` | `card8_accessibility` |
| Card 8 contrast rows | `contrastTable.length` | `card8_accessibility` |
| Card 9 syntax coloring | Code text node has MULTI-COLOR fills | `card9_code` |
