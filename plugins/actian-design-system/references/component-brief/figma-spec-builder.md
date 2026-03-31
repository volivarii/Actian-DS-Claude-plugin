# Component Brief — Figma Spec Builder

Transforms `brief-data.json` into `figma-spec.json` for the JSON Spec Interpreter. This file replaces the micro-task checklist architecture in `figma-renderer.md` with a declarative JSON tree that the interpreter builds directly.

## Purpose

The AI reads `brief-data.json` and produces a `figma-spec.json` file. The interpreter (`scripts/figma-interpreter.js`) consumes that JSON and builds the entire Figma node tree — frames, text, instances, dividers — without the AI writing any Plugin API code.

## Rule

**AI produces JSON data only, never Plugin API code.** The interpreter handles all `figma.*` calls, font loading, variable binding, and child appending. The AI's job is to map data model fields to the correct spec tree structure.

---

## Imports

Every component brief spec MUST declare these imports. Paste this block into `spec.imports`:

```json
{
  "briefCard": { "key": "3dbb732730af0754210cde7af35e5236a2502843", "method": "set" },
  "doDontPair": { "key": "28edfacf13e50706586172bd48f8a3ad84d7c263", "method": "set" },
  "colorSwatch": { "key": "da3369932f710386b76ca91a40ebd48d94e3f2e0", "method": "set" },
  "contrastBadge": { "key": "941756541adc6ce21e32e848c2039c64fece0fcf", "method": "set" },
  "pointerBadge": { "key": "7e066fc21d9a2bbbcd1149113787cf59140162d4", "method": "set" },
  "dimAnnotation": { "key": "49bf6a1b210a403ba145a3fdee9b1994eb54069a", "method": "set" },
  "a11yCard": { "key": "b4779a13f4097d682413a669eaaf9ead1b49f115", "method": "set" },
  "codeBlock": { "key": "1bf10eee1751a46da5f90a9671be6c9abf0073b7", "method": "single" },
  "genLog": { "key": "a9653f30925367e96dea90093d750bfe70849571", "method": "single" },
  "divider": { "key": "f4d778e1cf9bb61a33712c791486f54bb1c095b7", "method": "single" }
}
```

- `"set"` = `importComponentSetByKeyAsync` (has variants, use `spec.variant` to pick one)
- `"single"` = `importComponentByKeyAsync` (standalone component, no variants)

---

## Fonts

Every brief spec MUST declare all fonts used:

```json
{
  "fonts": [
    "Inter:Regular",
    "Inter:Semi Bold",
    "Inter:Bold",
    "Inter:Medium",
    "Fira Code:Regular",
    "Roboto:Regular"
  ]
}
```

---

## Spec Envelope

Top-level structure of `figma-spec.json`:

```json
{
  "meta": {
    "skill": "component-brief",
    "component": "Text Input",
    "targetNodeId": "12070:77587",
    "wrapperName": "Component Spec: Text Input"
  },
  "fonts": [ "Inter:Regular", "Inter:Semi Bold", ... ],
  "imports": { ... },
  "tree": [ ... ]
}
```

For Call 2 (append mode), replace `targetNodeId` and `wrapperName` with:

```json
{
  "meta": {
    "skill": "component-brief",
    "component": "Text Input",
    "appendToId": "<wrapper node ID from Call 1>"
  }
}
```

---

## Card-by-Card Mapping

### Card 0 — Generation Log

**Data source:** `meta`

The Generation Log is an INSTANCE of the `genLog` import (single component, no variant).

```json
{
  "type": "INSTANCE",
  "ref": "genLog",
  "name": "Generation Log",
  "props": {
    "Skill": "component-brief",
    "Prompt": "component-brief Text Input",
    "Date": "2026-03-29T13:00:00Z",
    "Duration": "1m 42s",
    "Model": "claude-opus-4-6",
    "Plugin Version": "v1.18.1"
  },
  "sizing": { "horizontal": "HUG", "vertical": "HUG" }
}
```

**Mapping:**
| Data field | Prop |
|-----------|------|
| `meta.skill` | Skill |
| `"component-brief " + meta.component` | Prompt |
| `meta.generatedAt` | Date |
| `meta.duration` | Duration |
| `meta.model` | Model |
| `"v" + meta.pluginVersion` | Plugin Version |

---

### Card 1 — Page Header

**Data source:** `card1_header`

Uses the Brief Card **Page Header** variant. Set props before detach. No children needed — the component itself IS the card.

```json
{
  "type": "INSTANCE",
  "ref": "briefCard",
  "name": "Page header",
  "variant": "Mode=DS, Type=Page Header",
  "props": {
    "Component Name": "Text Input",
    "Description": "Form field for single-line text entry with floating label, validation states, and helper text."
  },
  "detach": true,
  "sizing": { "horizontal": "HUG", "vertical": "HUG" }
}
```

**Mapping:**
| Data field | Prop |
|-----------|------|
| `card1_header.name` | Component Name |
| `card1_header.description` | Description |

---

### Cards 2-9 — Standard Shell Pattern

All remaining cards share this pattern:

1. INSTANCE of `briefCard` with variant `"Mode=DS, Type=Standard"`
2. Set `Title` and `Subtitle` props
3. `detach: true` to convert to editable frame
4. Children are appended into the `"Content"` slot (the interpreter finds it automatically)

```json
{
  "type": "INSTANCE",
  "ref": "briefCard",
  "name": "Design tokens",
  "variant": "Mode=DS, Type=Standard",
  "props": {
    "Title": "Design tokens",
    "Subtitle": "Color, sizing, spacing, and typography tokens"
  },
  "detach": true,
  "children": [
    { "...card content nodes..." }
  ],
  "sizing": { "horizontal": "HUG", "vertical": "HUG" }
}
```

The interpreter's INSTANCE builder: sets props, detaches, then appends `children` into the first child named `"Content"`.

---

### Card 2 — Actual Component

**Data source:** `card2_component`

**Title:** `"Actual component"` | **Subtitle:** `"Live component across all states and theme modes"`

Children of the Content slot:

1. **Section title** — TEXT node "Variant matrix"
2. **Variant matrix** — one FRAME per `variantMatrix` row, each containing one FRAME per column with a component instance + label

The component instances in the variant matrix are created by the CALLER before spec generation — the interpreter cannot import local components by node ID. Instead, use placeholder FRAME nodes with a `data-variant` annotation, and the caller patches them post-build.

**Dynamic expansion:** For each row in `card2_component.variantMatrix`, emit one FRAME. For each column in `row.columns`, emit one child FRAME containing a label TEXT.

```json
{
  "type": "FRAME",
  "name": "Row: Standard",
  "layout": { "mode": "HORIZONTAL", "spacing": 24, "padding": [0, 0, 0, 0] },
  "fills": [],
  "children": [
    {
      "type": "FRAME",
      "name": "Default",
      "layout": { "mode": "VERTICAL", "spacing": 8, "padding": [0, 0, 0, 0] },
      "fills": [],
      "children": [
        {
          "type": "TEXT",
          "content": "Default",
          "font": "Inter:Medium",
          "size": 12,
          "color": "#888888"
        }
      ],
      "sizing": { "horizontal": "HUG", "vertical": "HUG" }
    }
  ],
  "sizing": { "horizontal": "FILL", "vertical": "HUG" }
}
```

3. **DIVIDER**
4. **Section title** — TEXT node "Theme comparison"
5. **Theme row** — FRAME with 3 theme preview FRAMEs (Actian, Studio, Explorer), each containing swatch instances:

```json
{
  "type": "FRAME",
  "name": "Theme: Actian",
  "layout": { "mode": "VERTICAL", "spacing": 8, "padding": [16, 16, 16, 16] },
  "fills": ["#FFFFFF"],
  "cornerRadius": 8,
  "children": [
    {
      "type": "TEXT",
      "content": "Actian",
      "font": "Inter:Semi Bold",
      "size": 14,
      "color": "#1A1A2E"
    },
    {
      "type": "FRAME",
      "name": "Swatches",
      "layout": { "mode": "HORIZONTAL", "spacing": 12, "padding": [0, 0, 0, 0] },
      "fills": [],
      "children": [
        {
          "type": "INSTANCE",
          "ref": "colorSwatch",
          "variant": "Size=Small",
          "fills": ["#0550DC"],
          "sizing": { "horizontal": "HUG", "vertical": "HUG" }
        },
        {
          "type": "TEXT",
          "content": "theme-primary",
          "font": "Inter:Regular",
          "size": 11,
          "color": "#595968"
        }
      ],
      "sizing": { "horizontal": "HUG", "vertical": "HUG" }
    }
  ],
  "sizing": { "horizontal": "HUG", "vertical": "HUG" }
}
```

**Swatch expansion:** For each entry in `themeComparison[theme].swatches`, emit one `INSTANCE colorSwatch` + one `TEXT` with the token name.

---

### Card 3 — Anatomy

**Data source:** `card3_anatomy`

**Title:** `"Anatomy"` | **Subtitle:** `"Component structure, dimensions, interactive states, and part-level token mapping"`

This is the most complex card. It has 4 sub-sections separated by DIVIDERs.

#### Sub-section 1: Structure

- Section title TEXT "Structure"
- Diagram FRAME (`layout.mode: "NONE"` for free positioning, `fills: ["#F9FAFB"]`, `cornerRadius: 12`)
- Inside the diagram: one `INSTANCE pointerBadge` per `parts[]` entry, plus VECTOR leader lines

```json
{
  "type": "INSTANCE",
  "ref": "pointerBadge",
  "name": "Badge A",
  "variant": "Direction=Left",
  "props": { "Label": "A" },
  "sizing": { "horizontal": "HUG", "vertical": "HUG" }
}
```

For each `parts[i]`:
| Data field | Spec |
|-----------|------|
| `parts[i].letter` | `props.Label` |
| `parts[i].name` | Legend text |
| `parts[i].description` | Description list text |
| `parts[i].figmaLayerName` | Used at runtime to position badge (caller reads absoluteBoundingBox) |

Leader lines use VECTOR type:
```json
{
  "type": "VECTOR",
  "name": "Leader A",
  "paths": ["M 0 10 L 50 10"],
  "stroke": { "color": "#E91E8C", "weight": 1 },
  "fills": []
}
```

Legend row below diagram:
```json
{
  "type": "FRAME",
  "name": "Legend",
  "layout": { "mode": "HORIZONTAL", "spacing": 20, "padding": [0, 0, 0, 0] },
  "fills": [],
  "children": [
    { "type": "TEXT", "content": "A — Container", "font": "Inter:Regular", "size": 12, "color": "#595968" }
  ],
  "sizing": { "horizontal": "FILL", "vertical": "HUG" }
}
```

#### Sub-section 2: Specs

- DIVIDER
- Section title TEXT "Specs"
- FRAME with `layout.mode: "NONE"` for free positioning
- One `INSTANCE dimAnnotation` per `specs[]` entry

```json
{
  "type": "INSTANCE",
  "ref": "dimAnnotation",
  "name": "Spec: field height",
  "variant": "Orientation=Vertical",
  "props": { "Value": "48px" },
  "sizing": { "horizontal": "HUG", "vertical": "HUG" }
}
```

| Data field | Spec |
|-----------|------|
| `specs[i].label` | `props.Value` |
| `specs[i].orientation` | `"Orientation=Horizontal"` or `"Orientation=Vertical"` |
| `specs[i].target` | Label text below annotation |

#### Sub-section 3: States

- DIVIDER
- Section title TEXT "States"
- Horizontal FRAME, one column per `states[]` entry

```json
{
  "type": "FRAME",
  "name": "State: Default",
  "layout": { "mode": "VERTICAL", "spacing": 8, "padding": [0, 0, 0, 0] },
  "fills": [],
  "children": [
    { "type": "TEXT", "content": "Default", "font": "Inter:Medium", "size": 12, "color": "#888888" }
  ],
  "sizing": { "horizontal": "HUG", "vertical": "HUG" }
}
```

#### Sub-section 4: Parts Reference Table

- DIVIDER
- Section title TEXT "Parts reference"
- Table FRAME: header row + one data row per `partsTable[]` entry

Table structure (applies to all tables in the spec):
```json
{
  "type": "FRAME",
  "name": "Parts reference table",
  "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [0, 0, 0, 0] },
  "fills": [],
  "children": [
    {
      "type": "FRAME",
      "name": "Header",
      "layout": { "mode": "HORIZONTAL", "spacing": 0, "padding": [8, 12, 8, 12] },
      "fills": ["#F5F5FA"],
      "children": [
        { "type": "TEXT", "content": "Part", "font": "Inter:Bold", "size": 12, "color": "#595968", "width": 60 },
        { "type": "TEXT", "content": "Element", "font": "Inter:Bold", "size": 12, "color": "#595968", "width": 140 },
        { "type": "TEXT", "content": "Token", "font": "Inter:Bold", "size": 12, "color": "#595968", "width": 240 },
        { "type": "TEXT", "content": "Notes", "font": "Inter:Bold", "size": 12, "color": "#595968", "width": 300 }
      ],
      "sizing": { "horizontal": "FILL", "vertical": "HUG" }
    },
    {
      "type": "FRAME",
      "name": "Row: A",
      "layout": { "mode": "HORIZONTAL", "spacing": 0, "padding": [8, 12, 8, 12] },
      "fills": [],
      "children": [
        { "type": "TEXT", "content": "A", "font": "Inter:Regular", "size": 14, "color": "#1A1A2E", "width": 60 },
        { "type": "TEXT", "content": "Container", "font": "Inter:Regular", "size": 14, "color": "#1A1A2E", "width": 140 },
        { "type": "TEXT", "content": "--zen-radius-xs, --zen-spacing-sm", "font": "Fira Code:Regular", "size": 12, "color": "#1A1A2E", "width": 240 },
        { "type": "TEXT", "content": "4px border-radius, 12px padding, 48px height", "font": "Inter:Regular", "size": 14, "color": "#595968", "width": 300 }
      ],
      "sizing": { "horizontal": "FILL", "vertical": "HUG" }
    }
  ],
  "sizing": { "horizontal": "FILL", "vertical": "HUG" }
}
```

**Dynamic expansion:** One data row FRAME per `partsTable[i]`.

---

### Card 4 — Design Tokens

**Data source:** `card4_tokens`

**Title:** `"Design tokens"` | **Subtitle:** `"Color, sizing, spacing, and typography tokens"`

#### Sub-section 1: Color tokens table

Headers are derived from the first row's `columns[].header` values. The row label is `state`.

Each cell contains a `colorSwatch` INSTANCE (Size=Small) filled with `hex`, plus a TEXT node with the `token` name:

```json
{
  "type": "FRAME",
  "name": "Cell: border-default",
  "layout": { "mode": "HORIZONTAL", "spacing": 6, "padding": [0, 0, 0, 0] },
  "fills": [],
  "children": [
    {
      "type": "INSTANCE",
      "ref": "colorSwatch",
      "variant": "Size=Small",
      "fills": ["#C5C8CF"],
      "sizing": { "horizontal": "HUG", "vertical": "HUG" }
    },
    {
      "type": "TEXT",
      "content": "border-default",
      "font": "Fira Code:Regular",
      "size": 11,
      "color": "#595968"
    }
  ],
  "sizing": { "horizontal": "HUG", "vertical": "HUG" }
}
```

**Dynamic expansion:**
- Table headers: `["Variant / State"]` + `colorTokens[0].columns.map(c => c.header)`
- One row per `colorTokens[i]`, label = `colorTokens[i].state`
- One swatch cell per `colorTokens[i].columns[j]`

#### Sub-section 2: Sizing and spacing

- DIVIDER
- Section title "Sizing & spacing"
- Table with headers: `["Property", "Token", "Value"]`
- One row per `sizingTokens[i]`

#### Sub-section 3: Typography

- DIVIDER
- Section title "Typography"
- One specimen FRAME per `typography[i]`, showing the element name + styled text at the documented font

---

### Card 5 — Component API

**Data source:** `card5_api`

**Title:** `"Component API"` | **Subtitle:** `"Properties, types, defaults, and allowed values"`

Single table with headers: `["", "Property", "Type", "Default", "Values", "Notes"]`

Column widths: `[50, 140, 100, 120, 200, 350]`

First column contains a REQ or OPT badge:

```json
{
  "type": "FRAME",
  "name": "REQ badge",
  "layout": { "mode": "HORIZONTAL", "spacing": 0, "padding": [2, 6, 2, 6] },
  "fills": ["#FEF3F2"],
  "cornerRadius": 4,
  "children": [
    {
      "type": "TEXT",
      "content": "REQ",
      "font": "Inter:Bold",
      "size": 10,
      "color": "#C10C0D",
      "textCase": "UPPER"
    }
  ],
  "sizing": { "horizontal": "HUG", "vertical": "HUG" }
}
```

OPT badge: `fills: ["#F5F5FA"]`, text color `"#888888"`, content `"OPT"`.

Property names use monospace: `font: "Fira Code:Regular"`. Type values use purple: `color: "#C792EA"`. Default values use green: `color: "#C3E88D"`.

**Dynamic expansion:** One row per `props[i]`. Badge type = `props[i].required ? "REQ" : "OPT"`.

---

### Card 6 — Usage Guidelines

**Data source:** `card6_usage`

**Title:** `"Usage guidelines"` | **Subtitle:** `"When and how to use {card1_header.name}"`

Children:

1. Section title "When to use"
2. One TEXT per `whenToUse[i]` with green `"+"` prefix (color `"#047800"`)
3. DIVIDER
4. Section title "When NOT to use"
5. One TEXT per `whenNotToUse[i]` with red `"−"` prefix (color `"#C10C0D"`)
6. DIVIDER
7. One `INSTANCE doDontPair` per `doDont[i]`

```json
{
  "type": "INSTANCE",
  "ref": "doDontPair",
  "name": "Do-Dont: visible label",
  "variant": "Mode=DS",
  "props": {
    "Do Label": "Always show a visible label",
    "Do Example": "Every input needs a persistent label above the field.",
    "Don't Label": "Placeholder-only labels",
    "Don't Example": "Placeholder text disappears on focus, leaving no context."
  },
  "sizing": { "horizontal": "FILL", "vertical": "HUG" }
}
```

**Mapping per pair:**
| Data field | Prop |
|-----------|------|
| `doDont[i].doLabel` | Do Label |
| `doDont[i].doDetail` | Do Example |
| `doDont[i].dontLabel` | Don't Label |
| `doDont[i].dontDetail` | Don't Example |

---

### Card 7 — Content Guidelines

**Data source:** `card7_content`

**Title:** `"Content guidelines"` | **Subtitle:** `"Label copy rules for {card1_header.name}"`

For each `rules[i]`:
1. Section title TEXT with `rules[i].title`
2. Body TEXT with `rules[i].description`
3. INSTANCE `doDontPair` with `Do Label = rules[i].do`, `Don't Label = rules[i].dont`
4. DIVIDER (between rules, not after the last)

If `terminology.length > 0`, append:
5. Section title "Terminology"
6. Table with headers `["Term", "When to use"]`, one row per `terminology[i]`

---

### Card 8 — Accessibility

**Data source:** `card8_accessibility`

**Title:** `"Accessibility"` | **Subtitle:** `"WCAG 2.1 AA requirements, keyboard navigation, ARIA patterns, and contrast ratios"`

#### Sub-section 1: Requirements (2x3 grid)

Section title "Requirements", then a wrapping FRAME:

```json
{
  "type": "FRAME",
  "name": "Requirements grid",
  "layout": { "mode": "HORIZONTAL", "spacing": 16, "counterAxisSpacing": 16, "wrap": true, "padding": [0, 0, 0, 0] },
  "fills": [],
  "children": [ "...one INSTANCE a11yCard per requirement..." ],
  "sizing": { "horizontal": "FILL", "vertical": "HUG" }
}
```

Each requirement:

```json
{
  "type": "INSTANCE",
  "ref": "a11yCard",
  "name": "Role & semantics",
  "variant": "Mode=DS",
  "props": {
    "Title": "Role & semantics",
    "Body": "Use native HTML <input> element with type attribute...",
    "Icon Color": "red"
  },
  "detach": true,
  "children": [
    {
      "type": "INSTANCE",
      "ref": "codeBlock",
      "name": "Code: role-semantics",
      "detach": true,
      "children": []
    }
  ],
  "sizing": { "horizontal": "FILL", "vertical": "HUG" }
}
```

After detaching the a11yCard, the interpreter finds the "Content" slot and appends the code block. The code block is also detached so we can apply textRanges for syntax coloring.

**Code block with syntax coloring:**

The AI pre-computes the plain text and textRanges from `requirements[i].code.tokens`:

```json
{
  "type": "INSTANCE",
  "ref": "codeBlock",
  "name": "Code: role-semantics",
  "detach": true,
  "children": [
    {
      "type": "TEXT",
      "name": "Code",
      "content": "<label for=\"name\">Name</label>",
      "font": "Fira Code:Regular",
      "size": 12,
      "color": "#BABED8",
      "textRanges": [
        { "start": 0, "end": 6, "color": "#FF5370" },
        { "start": 6, "end": 10, "color": "#FFCB6B" },
        { "start": 10, "end": 12, "color": "#BABED8" },
        { "start": 12, "end": 16, "color": "#C3E88D" },
        { "start": 16, "end": 18, "color": "#BABED8" },
        { "start": 18, "end": 22, "color": "#BABED8" },
        { "start": 22, "end": 30, "color": "#FF5370" }
      ]
    }
  ]
}
```

**textRange computation from tokens:**

```
offset = 0
for each token in code.tokens:
  if token.type == "newline": offset += 1, continue
  range = { start: offset, end: offset + token.text.length, color: TOKEN_COLORS[token.type] }
  offset += token.text.length
```

Token color map (same as data-schema.md):

| Token type | Hex |
|-----------|-----|
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

**Mapping per requirement:**
| Data field | Spec |
|-----------|------|
| `requirements[i].title` | `props.Title` and `name` |
| `requirements[i].body` | `props.Body` |
| `requirements[i].icon` | `props["Icon Color"]` |
| `requirements[i].code.tokens` | Pre-compute → `textRanges` |

#### Sub-section 2: ARIA specification table

- DIVIDER
- Section title "ARIA specification"
- Table with headers: `["Element", "Role", "Label", "Focus Order", "Keyboard", "Announcement"]`
- One row per `ariaTable[i]`

#### Sub-section 3: Contrast ratios table

- DIVIDER
- Section title "Contrast ratios"
- Table with headers: `["Element", "Foreground", "Background", "Ratio", "WCAG AA"]`
- Foreground and Background cells contain a `colorSwatch` INSTANCE + hex text (same pattern as Card 4)
- WCAG AA column contains a `contrastBadge` INSTANCE:

```json
{
  "type": "INSTANCE",
  "ref": "contrastBadge",
  "variant": "Status=Pass",
  "sizing": { "horizontal": "HUG", "vertical": "HUG" }
}
```

Variant values: `"Status=Pass"`, `"Status=Fail"`, `"Status=Exempt"` — mapped directly from `contrastTable[i].wcag`.

---

### Card 9 — Code Specification

**Data source:** `card9_code`

**Title:** `"Code specification"` | **Subtitle:** `"CSS custom properties for {card1_header.name}"`

Single child: a detached `codeBlock` INSTANCE with syntax-colored text.

```json
{
  "type": "INSTANCE",
  "ref": "codeBlock",
  "name": "CSS Code Block",
  "props": {
    "Show Header": true,
    "Header Text": "CSS"
  },
  "detach": true,
  "children": [
    {
      "type": "TEXT",
      "name": "Code",
      "content": ".zen-text-input {\n  height: var(--zen-size-3xl);\n  /* 48px */\n}",
      "font": "Fira Code:Regular",
      "size": 12,
      "color": "#BABED8",
      "textRanges": [
        { "start": 0, "end": 16, "color": "#FF79C6" },
        { "start": 16, "end": 19, "color": "#BABED8" },
        { "start": 19, "end": 27, "color": "#82AAFF" },
        { "start": 27, "end": 29, "color": "#BABED8" },
        { "start": 29, "end": 50, "color": "#C3E88D" },
        { "start": 50, "end": 52, "color": "#BABED8" },
        { "start": 52, "end": 62, "color": "#676E95" },
        { "start": 62, "end": 64, "color": "#BABED8" }
      ]
    }
  ],
  "sizing": { "horizontal": "FILL", "vertical": "HUG" }
}
```

The AI pre-computes `content` and `textRanges` from `card9_code.tokens` using the same offset algorithm as Card 8.

**Mapping:**
| Data field | Spec |
|-----------|------|
| `card9_code.language.toUpperCase()` | `props["Header Text"]` |
| `card9_code.tokens` → flatten to string | `children[0].content` |
| `card9_code.tokens` → compute ranges | `children[0].textRanges` |

---

## Shared Building Blocks

### Section Title

Reusable TEXT pattern for sub-section headings:

```json
{
  "type": "TEXT",
  "content": "Color tokens",
  "font": "Inter:Semi Bold",
  "size": 16,
  "color": "#1A1A2E"
}
```

### Divider

```json
{ "type": "DIVIDER" }
```

The interpreter resolves this to the imported `divider` component. No props needed.

### Bullet Row (When to use / When NOT to use)

```json
{
  "type": "FRAME",
  "name": "Bullet: single-line text entry",
  "layout": { "mode": "HORIZONTAL", "spacing": 8, "padding": [0, 0, 0, 0] },
  "fills": [],
  "children": [
    { "type": "TEXT", "content": "+", "font": "Inter:Bold", "size": 14, "color": "#047800" },
    { "type": "TEXT", "content": "Single-line text entry (names, emails, search queries)", "font": "Inter:Regular", "size": 14, "color": "#1A1A2E" }
  ],
  "sizing": { "horizontal": "FILL", "vertical": "HUG" }
}
```

For "When NOT to use", change prefix to `"−"` and color to `"#C10C0D"`.

---

## Call Splitting Strategy

The spec is split into two `use_figma` calls to stay within the 20KB payload limit.

### Call 1: Generation Log + Cards 1-5

```json
{
  "meta": {
    "skill": "component-brief",
    "component": "Text Input",
    "targetNodeId": "12070:77587",
    "wrapperName": "Component Spec: Text Input"
  },
  "fonts": [ "Inter:Regular", "Inter:Semi Bold", "Inter:Bold", "Inter:Medium", "Fira Code:Regular" ],
  "imports": { "...all imports..." },
  "tree": [
    { "...Card 0 (GenLog)..." },
    { "...Card 1 (Page Header)..." },
    { "...Card 2 (Actual Component)..." },
    { "...Card 3 (Anatomy)..." },
    { "...Card 4 (Design Tokens)..." },
    { "...Card 5 (Component API)..." }
  ]
}
```

The interpreter creates a fresh wrapper FRAME, positions it relative to `targetNodeId`, and returns `{ wrapperId: "..." }`.

### Call 2: Cards 6-9

```json
{
  "meta": {
    "skill": "component-brief",
    "component": "Text Input",
    "appendToId": "<wrapperId from Call 1>"
  },
  "fonts": [ "Inter:Regular", "Inter:Semi Bold", "Inter:Bold", "Fira Code:Regular" ],
  "imports": { "...all imports..." },
  "tree": [
    { "...Card 6 (Usage Guidelines)..." },
    { "...Card 7 (Content Guidelines)..." },
    { "...Card 8 (Accessibility)..." },
    { "...Card 9 (Code Specification)..." }
  ]
}
```

The interpreter finds the existing wrapper by `appendToId` and appends the new tree nodes as additional children.

---

## Complete Example — Card 1

Full spec tree node for Card 1 (Page Header), ready to paste:

```json
{
  "type": "INSTANCE",
  "ref": "briefCard",
  "name": "Page header",
  "variant": "Mode=DS, Type=Page Header",
  "props": {
    "Component Name": "Text Input",
    "Description": "Form field for single-line text entry with floating label, validation states, and helper text."
  },
  "detach": true,
  "sizing": { "horizontal": "HUG", "vertical": "HUG" }
}
```

This maps directly from:
```json
// brief-data.json
{
  "card1_header": {
    "name": "Text Input",
    "description": "Form field for single-line text entry with floating label, validation states, and helper text."
  }
}
```

---

## Property Format Reference

These formats MUST match what the interpreter expects:

| Property | Format | Example |
|----------|--------|---------|
| `sizing` | `{ horizontal, vertical }` — values: `"FILL"`, `"HUG"`, or number (px) | `{ "horizontal": "FILL", "vertical": "HUG" }` |
| `layout` | `{ mode, spacing, padding: [t,r,b,l] }` | `{ "mode": "VERTICAL", "spacing": 12, "padding": [16, 16, 16, 16] }` |
| `fills` | Array of `"#hex"` strings or gradient objects. Empty `[]` = transparent. | `["#F5F5FA"]` |
| `textAlign` | `{ horizontal, vertical }` | `{ "horizontal": "LEFT", "vertical": "TOP" }` |
| `font` | `"Family:Style"` string | `"Inter:Semi Bold"` |
| `cornerRadius` | Number or `{ topLeft, topRight, bottomRight, bottomLeft }` | `8` |
| `stroke` | `{ color, weight, align }` | `{ "color": "#E2E7F0", "weight": 1, "align": "INSIDE" }` |
| `effects` | Array of `{ type, color, opacity, offset, radius, spread }` | `[{ "type": "DROP_SHADOW", "color": "#000000", "opacity": 0.1, "offset": { "x": 0, "y": 2 }, "radius": 4 }]` |
| `textRanges` | Array of `{ start, end, color }` for syntax coloring | `[{ "start": 0, "end": 16, "color": "#FF79C6" }]` |
| `props` | Key-value pairs matching component property names (prefix before `#`) | `{ "Title": "Anatomy", "Subtitle": "..." }` |
| `variant` | Full variant name string | `"Mode=DS, Type=Standard"` |
| `detach` | Boolean — converts instance to editable frame | `true` |

---

## Validation

Run `node scripts/validate-spec.js path/to/figma-spec.json` before passing to the interpreter. It checks:

- All `type` values are valid node types
- All INSTANCE `ref` values exist in `imports`
- All `fills` are valid hex or gradient format
- Padding arrays have exactly 4 values
- TEXT nodes have `"Family:Style"` font format
- `sizing` values are `"FILL"`, `"HUG"`, or number
