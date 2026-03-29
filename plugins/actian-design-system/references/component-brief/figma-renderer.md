# Brief Figma Renderer — Micro-Task Architecture

The skill assembles a **micro-task checklist** for each `use_figma` call. Every `□` item is mandatory — skipping any is a P0 bug. The AI translates each line to current Plugin API code using loaded Figma MCP skills.

**Principle:** Constrain WHAT to build (data model + checklist), let AI decide HOW (current Figma API).

## Prerequisites

Before any `use_figma` call, the skill must:
1. Read `brief-data.json` (generated in Step 1.5)
2. Read this file (call templates + component keys)

## Component keys

| Component | Key | Import method |
|-----------|-----|---------------|
| Brief Card | `3dbb732730af0754210cde7af35e5236a2502843` | `importComponentSetByKeyAsync` |
| Do-Don't Pair | `28edfacf13e50706586172bd48f8a3ad84d7c263` | `importComponentSetByKeyAsync` |
| Color Swatch | `da3369932f710386b76ca91a40ebd48d94e3f2e0` | `importComponentSetByKeyAsync` |
| Contrast Badge | `941756541adc6ce21e32e848c2039c64fece0fcf` | `importComponentSetByKeyAsync` |
| Pointer Badge | `7e066fc21d9a2bbbcd1149113787cf59140162d4` | `importComponentSetByKeyAsync` |
| Dimension Annotation | `49bf6a1b210a403ba145a3fdee9b1994eb54069a` | `importComponentSetByKeyAsync` |
| Accessibility Card | `b4779a13f4097d682413a669eaaf9ead1b49f115` | `importComponentSetByKeyAsync` |
| Code Block | `1bf10eee1751a46da5f90a9671be6c9abf0073b7` | `importComponentByKeyAsync` |
| Generation Log | `a9653f30925367e96dea90093d750bfe70849571` | `importComponentByKeyAsync` |
| Card Divider | `f4d778e1cf9bb61a33712c791486f54bb1c095b7` | `importComponentByKeyAsync` |

## How the skill assembles each call

For each of the 10 calls:

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

## Call 3: Card 3a — Anatomy: Structure + Specs

**Static structure:**
- Brief Card Standard shell (only created here, reused in Call 4)
- Structure sub-section: real component instance + Pointer Badge per part + legend
- Specs sub-section: real component instance + Dimension Annotation per measurement

**Checklist template:**

```
MICRO-TASKS — complete ALL (skipping any is a P0 bug):

CARD SHELL:
□ Import Brief Card Standard, setProp Title="Anatomy", Subtitle="Component structure, dimensions, interactive states, and part-level token mapping"
□ Detach → card frame, find "Content" child
□ Append card to wrapper (ID: ${wrapperNodeId})

STRUCTURE SUB-SECTION:
□ Add section title text "Structure" (Inter Semi Bold 16px)
□ Create anatomy diagram frame (auto-layout, VERTICAL, fills=[])
□ Get local component, create real instance for default state
□ Import Pointer Badge (key: 7e066fc21d9a2bbbcd1149113787cf59140162d4)
${card3_anatomy.parts.map(p =>
  `□ Pointer Badge "${p.letter}": Direction=Left variant, setProp Label="${p.letter}", position near ${p.name}`
).join('\n')}
□ Add legend row (horizontal auto-layout, 20px gap):
${card3_anatomy.parts.map(p =>
  `  □ "${p.letter} — ${p.name}"`
).join('\n')}
□ Add parts description list:
${card3_anatomy.parts.map(p =>
  `  □ "${p.letter} · ${p.name.toUpperCase()}" → "${p.description}"`
).join('\n')}

□ Add Card Divider (key: f4d778e1cf9bb61a33712c791486f54bb1c095b7)

SPECS SUB-SECTION:
□ Add section title text "Specs"
□ Create specs diagram frame
□ Get local component, create real instance
□ Import Dimension Annotation (key: 49bf6a1b210a403ba145a3fdee9b1994eb54069a)
${card3_anatomy.specs.map(s =>
  `□ Dimension Annotation: Orientation=${s.orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}, setProp Value="${s.label}", position near "${s.target}"`
).join('\n')}

SIZING:
□ card.layoutSizingVertical = 'HUG'
□ All sub-frames: layoutSizingHorizontal = 'FILL', layoutSizingVertical = 'HUG'
```

---

## Call 4: Card 3b — Anatomy: States + Parts table

**Static structure:**
- Find existing Anatomy card (appended in Call 3)
- States sub-section: horizontal grid of real component instances per state
- Parts reference table via text rows

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

## Call 5: Card 4 — Design tokens

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

## Call 6: Card 5 — Component API

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

## Call 7: Cards 6 + 7 — Usage + Content guidelines

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

## Call 8: Card 8a — Accessibility: Requirements

**Static structure:**
- Brief Card Standard shell
- 6 a11y requirement cards in 2x3 grid (using Accessibility Card component or equivalent)
- Each card: icon color square + title + body + code block

**Checklist template:**

```
MICRO-TASKS — complete ALL (skipping any is a P0 bug):

CARD SHELL:
□ Import Brief Card Standard, setProp Title="Accessibility", Subtitle="WCAG 2.1 AA requirements, keyboard navigation, ARIA patterns, and contrast ratios"
□ Detach → card frame, find "Content" child
□ Append card to wrapper (ID: ${wrapperNodeId})

REQUIREMENTS (2x3 grid):
□ Add section title "Requirements"
□ Create 2-column grid frame (auto-layout HORIZONTAL with wrap, or nested rows of 2)

${card8_accessibility.requirements.map((req, i) =>
  `REQUIREMENT ${i+1}: "${req.title}"
□ Create card frame (280px width, #F9FAFB bg, 16px radius, 24px padding)
□ Icon: 36x36 rectangle, cornerRadius=8, fill=${req.icon === 'red' ? '#FEE2E2' : req.icon === 'blue' ? '#DBEAFE' : req.icon === 'green' ? '#DCFCE7' : req.icon === 'orange' ? '#FEF3C7' : '#F3F4F6'}
□ Title: "${req.title}" (Inter Semi Bold 14px, #101828)
□ Body: "${req.body}" (Inter Regular 13px, #475467)
□ Code block: dark bg #1E1E2E, 12px padding, 8px radius, monospace 12px
□ Code tokens (apply syntax colors via setRangeFills):
${req.code.tokens.filter(t => t.type !== 'newline').map(t =>
    `  □ "${t.text}" → ${t.type} color`
  ).join('\n')}`
).join('\n\n')}

SIZING:
□ card.layoutSizingVertical = 'HUG'
```

---

## Call 9: Card 8b — ARIA table + Contrast table

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

## Call 10: Card 9 — Code specification

**Static structure:**
- Brief Card Standard shell
- Code Block component with syntax coloring via setRangeFills

**Checklist template:**

The skill pre-computes character offsets by walking `card9_code.tokens`:

```
MICRO-TASKS — complete ALL (skipping any is a P0 bug):

CARD SHELL:
□ Import Brief Card Standard, setProp Title="Code specification", Subtitle="CSS custom properties for ${card1_header.name}"
□ Detach → card frame, find "Content" child
□ Append card to wrapper (ID: ${wrapperNodeId})

CODE BLOCK:
□ Import Code Block (key: 1bf10eee1751a46da5f90a9671be6c9abf0073b7)
□ setProp Show Header = true
□ setProp Header Text = "${card9_code.language.toUpperCase()}"
□ setProp Code = "${plainText}" (all tokens concatenated, newlines as \n — ${plainText.length} chars total)
□ Detach instance to access text node for syntax coloring

SYNTAX COLORING (mandatory — setRangeFills on the "Code" text node):
${syntaxRanges.map(r =>
  `□ Chars ${r.start}-${r.end}: ${r.type} "${r.hex}" — "${r.text.slice(0, 30)}${r.text.length > 30 ? '...' : ''}"`
).join('\n')}

SIZING:
□ card.layoutSizingVertical = 'HUG'
□ codeFrame.layoutSizingHorizontal = 'FILL'
```

The skill computes `syntaxRanges` by walking `card9_code.tokens`:
```
offset = 0
for each token:
  if token.type === 'newline': offset += 1, continue
  syntaxRanges.push({ start: offset, end: offset + token.text.length, type: token.type, hex: colorMap[token.type], text: token.text })
  offset += token.text.length
```

---

## Parity validation

After all 10 calls complete, verify these counts from the data model:

| Check | Expected | Source |
|-------|----------|--------|
| Wrapper children | 10 (gen log + 9 cards) | Fixed |
| Card 2 variant instances | `variantMatrix.flatMap(r => r.columns).length` | `card2_component` |
| Card 3 Pointer Badges | `parts.length` | `card3_anatomy` |
| Card 3 Dimension Annotations | `specs.length` | `card3_anatomy` |
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
