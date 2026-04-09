# Brief Data Model Schema

Rigid JSON schema for component-brief output. Generated in Step 1.5, consumed by HTML and Figma renderers. This is the single source of truth — both renderers produce identical output from this data.

## File location

`{project}/components/[name]/[name]-brief-data.json`

## Top-level structure

```json
{
  "meta": { ... },
  "card1_header": { ... },
  "card2_component": { ... },
  "card3_anatomy": { ... },
  "card4_tokens": { ... },
  "card5_api": { ... },
  "card6_usage": { ... },
  "card7_content": { ... },
  "card8_accessibility": { ... },
  "card9_code": { ... }
}
```

## `meta` — Generation metadata

```json
{
  "component": "Text Input",
  "library": "dsKit",
  "fileKey": "fuWLltVXyBrbn6KfBAav12",
  "nodeId": "12070:77587",
  "componentKey": "abc123...",
  "generatedAt": "2026-03-29T13:00:00Z",
  "skill": "component-brief",
  "pluginVersion": "1.16.0",
  "model": "claude-opus-4-6",
  "duration": "1m 42s"
}
```

All fields required. `generatedAt` is ISO 8601. `duration` is measured from prompt to file write.

## `card1_header` — Page header

```json
{
  "name": "Text Input",
  "description": "Form field for single-line text entry with floating label, validation states, and helper text."
}
```

- `name`: component display name
- `description`: 1-3 sentences. Becomes `<p class="card-body">` in HTML, `Description` property in Figma Brief Card Page Header

## `card2_component` — Component

```json
{
  "variantAxes": [
    { "axis": "State", "values": ["Default", "Hovered", "Focused", "Active", "Filled", "Error", "Disabled", "Read-only"] },
    { "axis": "Type", "values": ["Standard", "Outlined"] }
  ],
  "variantMatrix": [
    {
      "row": "Standard",
      "columns": [
        { "variantName": "Type=Standard, State=Default", "label": "Default" },
        { "variantName": "Type=Standard, State=Hovered", "label": "Hovered" },
        { "variantName": "Type=Standard, State=Focused", "label": "Focused" },
        { "variantName": "Type=Standard, State=Error", "label": "Error" },
        { "variantName": "Type=Standard, State=Disabled", "label": "Disabled" }
      ]
    }
  ],
  "themeVariant": "State=Default"
}
```

- `variantAxes`: ALL variant axes from the component. Used for column/row headers.
- `variantMatrix`: rows = primary axis (often Type), columns = secondary axis (often State). `variantName` must match the Figma variant name string exactly (e.g., `"Type=Standard, State=Default"`) — used by Figma renderer to find the correct variant child.
- `variantMatrix` must include ALL variants shown in the HTML — never truncate.
- `themeVariant`: variant name to display in theme comparison (e.g., `"State=Default"`). The script renders 3 frames (Actian, Studio, Explorer) each containing a real component instance with the corresponding theme's variable mode.

## `card3_anatomy` — Anatomy

```json
{
  "parts": [
    { "letter": "A", "name": "Container", "description": "Border + border-radius + background fill", "figmaLayerName": "Container" },
    { "letter": "B", "name": "Floating label", "description": "Animates from placeholder position to top", "figmaLayerName": "Label" },
    { "letter": "C", "name": "Input value", "description": "User-entered text content", "figmaLayerName": "Input" },
    { "letter": "D", "name": "Helper text", "description": "Guidance or error message below the field", "figmaLayerName": "Helper text" }
  ],
  "states": ["Default", "Focused", "Error", "Disabled"],
  "partsTable": [
    { "part": "A", "element": "Container", "token": "--zen-radius-xs, --zen-spacing-sm", "notes": "4px border-radius, 12px padding, 48px height" },
    { "part": "B", "element": "Floating label", "token": "--zen-font-body-micro", "notes": "Roboto 400 11px/14px when floated" },
    { "part": "C", "element": "Input value", "token": "--zen-font-body-standard", "notes": "Roboto 400 14px/20px, 0.2px tracking" },
    { "part": "D", "element": "Helper text", "token": "--zen-font-body-subtle", "notes": "Roboto 400 12px/16px, 0.3px tracking" }
  ]
}
```

- `parts`: lettered callouts for the Structure section. `figmaLayerName` is the Figma layer name used to find the child via `findOne(n => n.name === layerName)` and read its `absoluteBoundingBox` for badge positioning. Figma renders as an `ANATOMY_DIAGRAM` node — badges with leader lines on 4 sides (top/right/bottom/left), assigned by closest-edge algorithm. HTML renders as a parts legend (no positioned diagram).
- `states`: list of state names for the States section. Figma renders real component instances (LOCAL_INSTANCE with variant switching) in a horizontal row. HTML renders state labels.
- `partsTable`: rows for the Specs table. Each row links back to a part letter. Columns: part letter, element name, token name, notes.

## `card4_tokens` — Design tokens

```json
{
  "colorTokens": [
    {
      "state": "Default",
      "columns": [
        { "header": "Border", "token": "border-default", "hex": "#C5C8CF" },
        { "header": "Label", "token": "text-placeholder", "hex": "#595968" },
        { "header": "Input text", "token": "text-primary", "hex": "#000000" },
        { "header": "Background", "token": "bg-default", "hex": "#FFFFFF" }
      ]
    },
    {
      "state": "Focused",
      "columns": [
        { "header": "Border", "token": "theme-primary", "hex": "#0550DC" },
        { "header": "Label", "token": "theme-primary", "hex": "#0550DC" },
        { "header": "Input text", "token": "text-primary", "hex": "#000000" },
        { "header": "Background", "token": "bg-default", "hex": "#FFFFFF" }
      ]
    }
  ],
  "sizingTokens": [
    { "property": "Field height", "token": "--zen-size-3xl", "value": "48px" },
    { "property": "Horizontal padding", "token": "--zen-spacing-sm", "value": "12px" }
  ],
  "typography": [
    { "element": "Input value", "token": "body-standard", "font": "Roboto Regular 14px/20px", "tracking": "0.2px" },
    { "element": "Floating label", "token": "body-micro", "font": "Roboto Regular 11px/14px", "tracking": "0.4px" }
  ]
}
```

- `colorTokens[].columns[]`: dynamic column count. First row's `header` values define the table header. HTML renders headers from first row. Figma uses `buildSpecTable` headers from first row.
- `hex` is required for swatch dot rendering (HTML `.swatch__dot` background, Figma Color Swatch fill).
- `sizingTokens` and `typography` are fixed-column tables.

## `card5_api` — Component API

```json
{
  "props": [
    { "required": true, "name": "type", "type": "enum", "default": "\"text\"", "values": "\"text\" | \"email\" | \"password\"", "notes": "HTML input type" },
    { "required": true, "name": "label", "type": "string", "default": "—", "values": "any string", "notes": "Visible label text" },
    { "required": false, "name": "disabled", "type": "boolean", "default": "false", "values": "true | false", "notes": "Disables interaction" }
  ]
}
```

- `required`: true = REQ badge (red), false = OPT badge (grey). Both renderers apply the same colors.
- All string values — no further interpretation needed.

## `card6_usage` — Usage guidelines

```json
{
  "whenToUse": [
    "Single-line text entry (names, emails, search queries)",
    "When the expected input is short (under ~80 characters)"
  ],
  "whenNotToUse": [
    "Multi-line content → use Textarea",
    "Structured data with known format → use specialized input (Date, Phone)"
  ],
  "doDont": [
    {
      "doLabel": "Always show a visible label",
      "doDetail": "Every input needs a persistent label above the field.",
      "dontLabel": "Placeholder-only labels",
      "dontDetail": "Placeholder text disappears on focus, leaving no context."
    }
  ]
}
```

- `whenToUse` / `whenNotToUse`: string arrays. HTML renders as green +/red − bullet rows. Figma renders as text nodes with colored prefix.
- `doDont`: array of pairs. HTML uses `.do-dont-row` divs. Figma uses `Meta / Content / Do-Don't Pair` component (Mode=DS) with `setProp` for all 4 text fields.

## `card7_content` — Content guidelines

```json
{
  "rules": [
    {
      "title": "Use sentence case for labels",
      "description": "Capitalize only the first word and proper nouns.",
      "do": "Email address",
      "dont": "Email Address",
      "doExample": "Email address",
      "dontExample": "Email Address"
    }
  ],
  "terminology": [
    { "term": "Field", "use": "Refer to the entire input component including label and helper" },
    { "term": "Input", "use": "Refer to just the text entry area" }
  ]
}
```

- `rules`: MUST include ALL content rules from the component's Figma page. Do not summarize or skip.
- `doExample`/`dontExample`: concrete example text shown in the Do/Don't example boxes. Optional — falls back to empty.
- HTML renders each rule as section-title + section-body + inline do-dont pair.
- Figma renders each rule as Section Header template + Do-Don't Pair component.
- `terminology`: optional table. Empty array = section omitted.

## `card8_accessibility` — Accessibility

```json
{
  "requirements": [
    {
      "title": "Role & semantics",
      "icon": "red",
      "body": "Use native HTML <input> element with type attribute. Every input must have a visible, persistent label linked via for/id.",
      "code": {
        "language": "html",
        "tokens": [
          { "type": "tag", "text": "<label" },
          { "type": "attribute", "text": " for" },
          { "type": "punctuation", "text": "=\"" },
          { "type": "string", "text": "name" },
          { "type": "punctuation", "text": "\">" },
          { "type": "text", "text": "Name" },
          { "type": "tag", "text": "</label>" }
        ]
      }
    }
  ],
  "contrastTable": [
    { "element": "Input value text", "foreground": "#000000", "background": "#FFFFFF", "ratio": "21:1", "wcag": "Pass" },
    { "element": "Disabled text", "foreground": "#9898A7", "background": "#F5F5FA", "ratio": "2.58:1", "wcag": "Exempt" }
  ],
  "ariaTable": [
    { "element": "Input field", "role": "textbox", "label": "aria-labelledby", "focusOrder": "1", "keyboard": "Tab to focus, type to enter", "announcement": "Name, edit text" }
  ]
}
```

- `requirements`: 6 cards in 2×3 grid. `icon` is one of: `red`, `blue`, `green`, `grey`, `orange`. HTML uses `.a11y-card__icon--{color}`. Figma uses Accessibility Card component.
- `code.tokens`: tokenized for syntax highlighting. HTML wraps each token in `<span class="{type}">`. Figma uses `setRangeFills` on text node character ranges.
- `contrastTable`: rows for WCAG contrast table. `wcag` is "Pass", "Fail", or "Exempt".
- `ariaTable`: ARIA specification rows for the structured a11y table (Phase 3 feature).

## `card9_code` — Code specification

```json
{
  "language": "css",
  "tokens": [
    { "type": "selector", "text": ".zen-text-input" },
    { "type": "punctuation", "text": " {" },
    { "type": "newline" },
    { "type": "property", "text": "  height" },
    { "type": "punctuation", "text": ": " },
    { "type": "value", "text": "var(--zen-size-3xl)" },
    { "type": "punctuation", "text": ";" },
    { "type": "newline" },
    { "type": "comment", "text": "  /* 48px */" },
    { "type": "newline" },
    { "type": "punctuation", "text": "}" }
  ]
}
```

- `tokens`: flat array of type+text pairs. `newline` tokens become literal `\n` in both outputs.

## Syntax token color map

Both renderers use this mapping for all tokenized code (Card 8 inline + Card 9 full):

| Token type | HTML class | Figma fill hex |
|-----------|-----------|---------------|
| `selector` | `.sel` | `#FF79C6` |
| `property` | `.prop` | `#82AAFF` |
| `value` | `.val` | `#C3E88D` |
| `comment` | `.cm` | `#676E95` |
| `keyword` | `.kw` | `#C792EA` |
| `string` | `.str` | `#C3E88D` |
| `punctuation` | `.punc` | `#BABED8` |
| `tag` | `.tag` | `#FF5370` |
| `attribute` | `.attr` | `#FFCB6B` |
| `function` | `.fn` | `#82AAFF` |
| `text` | (none) | `#BABED8` |
| `newline` | `\n` | — |

**Figma rendering note:** Code tokens in Cards 8 and 9 render as monochrome text (`#BABED8`) in Figma output. The HTML preview retains per-token syntax coloring via CSS classes.

## Rendering contract

- **Arrays** → iterate: one HTML row/element per item, one Figma clone per item
- **Strings** → replace: placeholder substitution (HTML), `fillSlots`/`setProp` (Figma)
- **Booleans** → conditional: REQ vs OPT badge styling
- **Empty arrays** → section omitted in both renderers
- **Tokenized code** → map: type → CSS class (HTML) or fill color (Figma)

---

## Fat Marker (FM) Mode — 5 Cards

FM mode uses a simpler 5-card schema. The `meta.library` field is `"fm"` — renderers check this to decide which card set to build.

### FM top-level structure

```json
{
  "meta": {
    "component": "FM Button",
    "library": "fm",
    "fileKey": "<from .figma-keys.json>",
    "nodeId": "...",
    "componentKey": "...",
    "generatedAt": "...",
    "skill": "component-brief",
    "pluginVersion": "1.17.0",
    "model": "claude-opus-4-6",
    "duration": "1m 10s"
  },
  "card1_header": { ... },
  "card2_component": { ... },
  "card3_design_guidelines": { ... },
  "card4_content_guidelines": { ... },
  "card5_anatomy": { ... }
}
```

### `card1_header` — Page header (dark card)

```json
{
  "source": "Fat Marker Wireframe Kit",
  "name": "FM Button",
  "description": "Action trigger with Primary, Secondary, and Outline types."
}
```

- `source`: kit identifier (always "Fat Marker Wireframe Kit" for FM)
- `name`: component display name with FM prefix
- `description`: one sentence

### `card2_component` — Actual component (Locked)

```json
{
  "gridColumns": 3,
  "variants": [
    { "variantName": "Type=Primary", "label": "Primary" },
    { "variantName": "Type=Secondary", "label": "Secondary" },
    { "variantName": "Type=Outline", "label": "Outline" }
  ]
}
```

- `gridColumns`: 2 or 3 depending on variant count
- `variants`: flat list (no matrix — FM components are simpler). `variantName` matches Figma variant name.

### `card3_design_guidelines` — Design guidelines

```json
{
  "sections": [
    { "title": "Behavior", "body": "Buttons trigger an immediate action when clicked. They should not be used for navigation — use links instead." },
    { "title": "Accessibility", "body": "All buttons must be focusable via Tab key. Provide aria-label when the button contains only an icon." },
    { "title": "Interaction patterns", "body": "Hover: border darkens. Focus: 2px outline. Active: slight background shift. Disabled: 50% opacity, no pointer events." }
  ]
}
```

- `sections`: array of title + body pairs. Narrative prose, not tables.
- Include Behavior, Accessibility, Interaction patterns, and optionally Responsive behavior.

### `card4_content_guidelines` — Content guidelines

```json
{
  "whenToUse": "Use buttons to trigger actions like submitting a form, opening a dialog, or confirming a destructive operation. Do not use buttons for navigation.",
  "doDont": [
    { "do": "Use short, action-oriented labels like \"Save\" or \"Submit\".", "dont": "Don't use vague labels like \"Click here\" or \"OK\"." },
    { "do": "Use sentence case for button labels.", "dont": "Don't use ALL CAPS or Title Case." }
  ]
}
```

- `whenToUse`: paragraph text (not bullet list like DS)
- `doDont`: array of do/don't pairs. Simpler than DS — no separate label/detail fields.

### `card5_anatomy` — Anatomy

```json
{
  "parts": [
    { "number": 1, "name": "Container", "description": "The outer boundary. Uses FM primary fill (#333333) for primary variant, FM stroke (#B0B0B0) border for secondary." },
    { "number": 2, "name": "Leading icon", "description": "Optional icon before the label. 16px size, inherits text color." },
    { "number": 3, "name": "Label", "description": "Action text. Uses FM primary text (#FFFFFF) on filled, FM text (#333333) on outlined variants." }
  ]
}
```

- `parts`: numbered (not lettered like DS). Each part has number, name, description.
- Used for: pointer badges in diagram, inline legend, and parts reference table.

### FM rendering notes

- FM uses **Inter** font (not Roboto)
- FM uses **hardcoded hex colors** (not --zen-* tokens) — #333333, #B0B0B0, #FFFFFF, etc.
- FM uses `fm-wrapper.html` for CSS framework (different from DS wrapper)
- FM cards are **820px wide** (DS cards are 960-1200px)
- FM page header is a **dark card** (#2D3648 background)
- FM anatomy uses **numbered badges** (1, 2, 3) not lettered (A, B, C)
- FM Do/Don't uses **2-column grid** with color-coded bars (green/red)
