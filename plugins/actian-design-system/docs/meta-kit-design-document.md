# Meta Kit Design Document

Comprehensive architecture for a reusable Figma component library that serves as the building-block layer for all AI-generated design system documentation.

**Date:** 2026-03-26
**Author:** Claude (architectural research for Vincent Olivari)
**Status:** Design proposal — ready for review

---

## 1. Complete Element Inventory

Every visual building block extracted from the 4 skill files, their HTML templates, and the shared references.

### 1A. Structural Chrome (Card Shells)

| Element | Skills | Dimensions | Structure | Proposed Solution |
|---------|--------|------------|-----------|-------------------|
| **DS Brief Card (standard)** | component-brief | 1200px wide, hug height | Fixed chrome: grey header (title + subtitle) + white content area. Content varies. | **Component** with text props for title/subtitle, slot for content |
| **DS Brief Card (page header)** | component-brief | 1200px wide, hug height | White card with 72px title + Actian logo SVG + body paragraphs | **Component** with text props |
| **FM Brief Card (standard)** | component-brief | 820px wide, hug height | Light header + white content area | **Component** with text props |
| **FM Brief Card (dark page header)** | component-brief | 820px wide, min 320px | Dark (#2D3648) card with source label, 48px title, subtitle | **Component** with text props |
| **Presentation Slide (Cover)** | generate-presentation | 1920x1080 fixed | Blue gradient bg, geometric pattern, title/subtitle/date/creators | **Component** with text props + geometric overlay |
| **Presentation Slide (Body Full)** | generate-presentation | 1920x1080 fixed | White bg, 56px title, grey content area (1761x829) | **Component** with text prop for title, slot for content |
| **Presentation Slide (Text+Visual)** | generate-presentation | 1920x1080 fixed | White bg, title, 2-column: text left (549px) + visual right (1155px) | **Component** with text props |
| **Presentation Slide (Section)** | generate-presentation | 1920x1080 fixed | Light gradient, topic + 130px title | **Component** with text props |
| **Presentation Slide (Back Cover)** | generate-presentation | 1920x1080 fixed | Blue gradient, "Thank you", pyramid | **Component** — static with minimal text swap |
| **Flow Cover Card** | generate-flow | ~1440px wide, hug height | Dark (#1A202C) card: feature name, flow name, user role | **Component** with 3 text props |
| **Flow Screen Frame** | generate-flow | 1440x960 or 1440x700 | Standard screen: app header (70px) + sidebar (260px) + content area | **Component** with variant (Standard/Compact) |
| **Generation Log Card** | ALL 4 skills | 280px wide, hug height | Dark (#2D3648) rounded card with 7 metadata fields | **Component** with 6 text props |

### 1B. Content Elements (Inside Cards)

| Element | Skills | Structure | Proposed Solution |
|---------|--------|-----------|-------------------|
| **Spec Table** | component-brief, generate-presentation | Header row (grey bg, 13px bold) + N data rows (14px). Variable columns/rows. | **Hybrid** — component for header row style, builder for row count |
| **Color Swatch (inline)** | component-brief | 12px dot + token code text. Fixed structure, variable color/text. | **Component** with fill + text props |
| **Typography Specimen** | component-brief | Rendered text at documented style + token details alongside | **Builder** — too variable in rendered font size/style |
| **Code Block** | component-brief, generate-presentation | Dark bg (#1E1E2E), rounded, padded, monospace text. Variable content. | **Component** for the shell, builder fills text content |
| **Do/Don't Pair (DS)** | component-brief | Two side-by-side cards: green bar + "Do" / red bar + "Don't". Example content varies. | **Component** with variant (Do/Don't) + text props |
| **Do/Don't Pair (FM)** | component-brief | Similar but with tinted backgrounds (#FAFFF5 / #FFF5F5) | **Component** variant axis for DS/FM mode |
| **Accessibility Card** | component-brief | Card with colored icon square, title, body text, optional code block | **Component** with variant (icon color) + text props + boolean for code block |
| **Contrast Badge** | component-brief | Inline "Pass" (green) or "Exempt" (red-brown) badge | **Component** with variant (Pass/Exempt) |
| **Anatomy Box** | component-brief | Dashed border container with label + pointer badges (A,B,C) + legend | **Hybrid** — component for the chrome, builder places badges |
| **Pointer Badge** | component-brief | 20px circle, dark bg, white letter (A, B, C...) | **Component** with text prop for letter |
| **Dimension Annotation** | component-brief | Pink (#E91E8C) bracket lines with px measurement label | **Component** with text prop for value, variant (horizontal/vertical) |
| **State Grid** | component-brief | Flex row of state columns (label + rendered component). Variable columns. | **Builder** — column count varies per component |
| **Theme Card** | component-brief | Card with theme label, rendered component area, color swatches | **Component** with text prop for theme name, slot for content |
| **Variant Matrix** | component-brief | Table: type rows x state columns with rendered instances | **Builder** — rows and columns both variable |
| **Section Title** | component-brief | Bold 24px text with optional divider above | **Text style** (not a component — just a Figma text style) |
| **Section Subtitle** | component-brief | Bold 18px text | **Text style** |
| **Section Body** | component-brief | Regular 16px, secondary color, max-width fill | **Text style** |
| **Card Divider** | component-brief | 1px horizontal line, #EDF0F7 | **Component** (simple line, fill parent width) |
| **Prop Name/Type/Default** | component-brief | Monospace styled text (Fira Code) in purple/green/black | **Text styles** for each role |
| **Stat Card** | generate-presentation | Large metric number + context label + optional delta indicator | **Component** with text props |
| **Bar Chart Bar** | generate-presentation | Colored rectangle, width = percentage, category token fill | **Builder** — variable bar count |
| **Donut Chart** | generate-presentation | Conic-gradient circle, max 5 segments with legend | **Builder** — variable segment count |
| **Progress Bar** | generate-presentation | Track + fill bar + optional threshold marker | **Component** with numeric prop for % |
| **Timeline** | generate-presentation | Horizontal dot+line sequence with milestone labels | **Builder** — variable milestone count |
| **Before/After Card** | generate-presentation | Two stat cards with arrow between | **Component** composed of 2 stat cards |
| **Research Frame** | generate-flow | Dark card with research findings, same styling as flow cover | **Component** with text props |
| **Screen Label** | generate-flow | 12px #888 text above each screen frame | **Text style** |
| **Form Container** | generate-flow | 480px max-width, left-aligned, vertical auto-layout | **Component** (wrapper with correct constraints) |
| **Action Footer** | generate-flow | Sticky bottom bar, primary right / secondary left | **Component** with instance swap slots for buttons |
| **Geometric Pattern Overlay** | generate-presentation | 3 diagonal semi-transparent shapes on cover/section slides | **Component** with variant (Dark/Light) |

### 1C. Shared Utility Elements

| Element | Skills | Structure | Proposed Solution |
|---------|--------|-----------|-------------------|
| **hexToRgb helper** | ALL (use_figma) | JS utility function | **Builder function** (copied into every use_figma call) |
| **addGenText helper** | ALL (use_figma) | JS function to add text to generation card | **Builder function** |
| **Actian Pyramid Logo** | component-brief, generate-presentation | SVG: blue triangle with white inner + blue core | **Component** (vector node in Figma) |
| **Actian Pyramid (white/transparent)** | generate-presentation | Simplified triangle for slide corners | **Component** variant of the logo |

---

## 2. Meta Kit Component Specs

### Naming Convention

All components follow: `Meta / [Category] / [Name]`

Categories:
- `Chrome` — structural shells (cards, slides, screen frames)
- `Content` — visual elements inside cards (tables, code blocks, badges)
- `Data Viz` — charts and data visualization elements
- `Utility` — helpers (dividers, logos, annotations)

### Component 1: Meta / Chrome / Generation Log

**Replaces:** 30-50 lines of inline JS in every `use_figma` call across all 4 skills.

| Property | Type | Details |
|----------|------|---------|
| Skill | Text | "component-brief", "generate-flow", etc. |
| Prompt | Text | User prompt, truncated to 200 chars |
| Date | Text | ISO 8601 date+time |
| Duration | Text | "2m 34s" |
| Model | Text | "claude-opus-4-6" |
| Plugin Version | Text | "v1.10.0" |

**Size:** 280px wide, height hugs content
**Layout:** Vertical auto-layout, 4px item spacing, 16px/20px padding
**Fill:** `#2D3648` (--fm-base-800)
**Corner radius:** 8px (use_figma spec) / 12px (HTML spec) -- standardize to 12px
**Text:** "GENERATED" label 10px #A0ABC0; field labels 12px #A0ABC0 bold; field values 12px #CBD2E0
**Font:** Inter

### Component 2: Meta / Chrome / Brief Card

**Replaces:** Card shell construction in component-brief (both DS and FM modes).

| Variant Axis | Values |
|-------------|--------|
| Mode | DS, FM |
| Type | Page Header, Standard |

| Property | Type | Details |
|----------|------|---------|
| Title | Text | Card title (e.g., "Anatomy", "Design tokens") |
| Subtitle | Text | Card subtitle/description |
| Component Name | Text | For page header variant only |

**DS Standard:** 1200px wide, grey header (#F5F5FA, 80px padding, 48px/24px titles), white content (80px padding), 16px corner radius
**DS Page Header:** 1200px wide, white, 80px padding, 72px title + Actian logo
**FM Standard:** 820px wide, #F5F5FA header (48px padding, 28px/14px titles), white content (48px padding), 16px corner radius
**FM Page Header:** 820px wide, dark (#2D3648), 48px padding, 48px title

### Component 3: Meta / Chrome / Slide Frame

**Replaces:** Slide frame construction in generate-presentation.

| Variant Axis | Values |
|-------------|--------|
| Type | Cover, Body Full, Body Text+Visual, Section, Back Cover |

| Property | Type | Details |
|----------|------|---------|
| Title | Text | Slide title |
| Subtitle | Text | Subtitle (Cover, Section) |
| Topic | Text | Topic label (Cover, Section) |
| Date | Text | Cover only |
| Creators | Text | Cover only |

**Size:** 1920x1080 fixed for all variants
**Cover/Back Cover fill:** Linear gradient from #090952 to #1414B8
**Section fill:** Linear gradient from #EEEEFD to #CBDAFF
**Body fill:** #FFFFFF
**Font:** Roboto

### Component 4: Meta / Chrome / Flow Cover Card

**Replaces:** Cover card construction in generate-flow.

| Property | Type | Details |
|----------|------|---------|
| Feature | Text | Feature name |
| Flow | Text | "Flow: [Sub-flow name]" |
| User | Text | "User: [Role]" |

**Size:** Width matches screen frames (1440px), height hugs
**Fill:** `#1A202C` (--fm-base-900)
**Font:** Inter
**Corner radius:** 12px

### Component 5: Meta / Chrome / Flow Screen

**Replaces:** Screen frame scaffolding in generate-flow.

| Variant Axis | Values |
|-------------|--------|
| Size | Standard (1440x960), Compact (1440x700) |

Internally composed of:
- FM App_header instance (70px, imported from FM Kit library)
- Horizontal frame containing:
  - FM Side navigation bar instance (260px, imported from FM Kit library)
  - Content area frame (fill remaining, #F5F5FA background)

The component imports real FM Kit library instances for the header and sidebar. The content area is an empty auto-layout frame that Claude fills via `use_figma`.

**Note:** The FM App_header and FM Side navigation bar remain FM Kit library components, not Meta Kit components. The Meta Kit component just composes them.

### Component 6: Meta / Content / Code Block

**Replaces:** Code block construction in component-brief (Card 9) and generate-presentation.

| Property | Type | Details |
|----------|------|---------|
| Show Header | Boolean | Optional filename/language header bar |
| Header Text | Text | e.g., "button.css" or "CSS" |

**Size:** Width fills parent, height hugs content
**Fill:** `#1E1E2E`
**Corner radius:** 12px
**Padding:** 32px all sides
**Font:** Fira Code (component-brief) or Roboto Mono, 13px, line-height 1.7
**Text color:** `#A6ACCD` (base), with syntax highlighting applied by the builder

**Why component + builder:** The shell is always the same (dark bg, rounded, padded). The text content varies wildly (CSS, HTML, ARIA examples, key mappings). Claude imports the component for the shell, then sets the text content via `use_figma` text node manipulation.

### Component 7: Meta / Content / Do-Don't Pair

**Replaces:** Do/Don't construction in component-brief (Cards 6, 7) and generate-presentation.

| Variant Axis | Values |
|-------------|--------|
| Mode | DS, FM |

| Property | Type | Details |
|----------|------|---------|
| Do Label | Text | "Do -- [description]" |
| Don't Label | Text | "Don't -- [description]" |
| Do Example | Text | Good example text |
| Don't Example | Text | Bad example text |

**DS Mode:**
- Bar: 4px height, green (#047800) / red (#C10C0D)
- Label: Inter 13px 600, green/red
- Example: 16px, #FAFAFA bg, 8px radius, 16-20px padding

**FM Mode:**
- Bar: 4px height, green (#22C55E) / red (#EF4444)
- Label: Inter 13px 600, green/red
- Example: 24px padding, green-tint (#FAFFF5) / red-tint (#FFF5F5) bg

### Component 8: Meta / Content / Accessibility Card

**Replaces:** A11y card construction in component-brief (Card 8).

| Variant Axis | Values |
|-------------|--------|
| Icon Color | Red, Blue, Green, Grey, Orange |
| Has Code Block | True, False |

| Property | Type | Details |
|----------|------|---------|
| Title | Text | e.g., "Role & semantics" |
| Body | Text | Plain-text requirement description |
| Code | Text | Code example (shown in dark block when Has Code Block = True) |

**Size:** Fill parent width (in a 2-column grid)
**Fill:** #FAFAFA
**Border:** 1px #E4E4F0, 12px radius
**Padding:** 24px
**Icon:** 36px square, 8px radius, tinted background matching variant

### Component 9: Meta / Content / Color Swatch

**Replaces:** Inline swatch dots in component-brief (Card 4 color token tables).

| Property | Type | Details |
|----------|------|---------|
| Color | Fill | The swatch color (applied to the dot) |
| Token Name | Text | e.g., "theme-primary" |

**Size:** Inline (auto width, 20px height)
**Dot:** 12px square, 3px radius, 1px border rgba(0,0,0,0.08)
**Text:** Fira Code 12px, `#0550DC` (code color)
**Layout:** Horizontal, 4px gap

### Component 10: Meta / Content / Contrast Badge

**Replaces:** Pass/Exempt badges in component-brief (Card 8).

| Variant Axis | Values |
|-------------|--------|
| Status | Pass, Exempt |

**Pass:** Green check + "Pass" text, Inter 12px 600 #047800
**Exempt:** "Exempt" text, Inter 12px 600 #9C2000

### Component 11: Meta / Content / Pointer Badge

**Replaces:** Lettered anatomy callout badges in component-brief (Card 3).

| Property | Type | Details |
|----------|------|---------|
| Letter | Text | A, B, C, D, etc. |

**Size:** 20px circle
**Fill:** `#1A1A1A`
**Text:** White, Inter 11px 500, centered

### Component 12: Meta / Content / Dimension Annotation

**Replaces:** Pink measurement brackets in component-brief (Card 3 Specs).

| Variant Axis | Values |
|-------------|--------|
| Direction | Horizontal, Vertical |

| Property | Type | Details |
|----------|------|---------|
| Value | Text | e.g., "40px", "16px" |

**Color:** `#E91E8C` (hot pink) for all lines and text
**Line:** 1px stroke
**Text:** Inter 11px 500
**Structure:** Bracket shape (two end caps + connecting line) with centered label

### Component 13: Meta / Content / Theme Card

**Replaces:** Theme comparison cards in component-brief (Card 2).

| Variant Axis | Values |
|-------------|--------|
| Theme | Actian, Studio, Explorer |

| Property | Type | Details |
|----------|------|---------|
| Swatch 1 Label | Text | e.g., "Primary" |
| Swatch 2 Label | Text | e.g., "Selected" |

**Size:** 1/3 parent width (flex: 1)
**Fill:** #FAFAFA
**Border:** 1px #E4E4F0, 12px radius
**Padding:** 24px 32px
**Label:** Inter 13px 600, #3F3F4A, 0.3px letter-spacing

Swatch colors are set dynamically per theme (Actian: #0550DC/#0029A9, Studio: #0283BE/#0079B6, Explorer: #049B98/#00908E).

### Component 14: Meta / Content / Stat Card

**Replaces:** Hero stat numbers in generate-presentation.

| Property | Type | Details |
|----------|------|---------|
| Value | Text | e.g., "40%", "2.3M", "98.5" |
| Label | Text | e.g., "Adoption rate" |
| Context | Text | e.g., "vs. 28% last quarter" |
| Show Delta | Boolean | Show up/down arrow indicator |
| Delta Positive | Boolean | Green (up) vs red (down) |

**Size:** Hug content, min 200px wide
**Fill:** White
**Border:** 1px #E4E4F0, 12px radius
**Value:** Roboto 48px 500 #12131F
**Label:** Roboto 16px 400 #717D96
**Context:** Roboto 14px 400 #475467

### Component 15: Meta / Utility / Card Divider

**Replaces:** `<div class="card-divider">` in every card template.

**Size:** Fill parent width, 1px height
**Fill:** `#EDF0F7`

### Component 16: Meta / Utility / Actian Pyramid

**Replaces:** Inline SVG in page header card and slide frames.

| Variant Axis | Values |
|-------------|--------|
| Style | Color (blue), White, Transparent |

**Size:** 64x60 (card) or 80x68 (slide)
**Structure:** Vector node — three nested triangles

### Component 17: Meta / Utility / Geometric Overlay

**Replaces:** 3-div CSS geometric pattern on presentation slides.

| Variant Axis | Values |
|-------------|--------|
| Background | Dark (white shapes on blue), Light (dark shapes on light) |

**Size:** Fill parent (1920x1080)
**Structure:** 3 rotated rectangles with semi-transparent fills
**Dark:** rgba(255,255,255,0.04/0.06/0.08)
**Light:** rgba(0,0,100,0.03)

### Component 18: Meta / Chrome / Research Frame

**Replaces:** Optional research summary card in generate-flow.

| Property | Type | Details |
|----------|------|---------|
| Title | Text | "Research: [Feature]" |

**Size:** 1440px wide, height hugs
**Fill:** `#1A202C` (--fm-base-900)
**Text:** White (#FFFFFF) headings, #CBD2E0 body, #A0ABC0 dividers
**Font:** Inter (page header title style for headings, 14px body)

---

## 3. Builder Function Specs

These are JS patterns (not Figma components) used in `use_figma` calls when the structure is too dynamic for a component.

### Builder 1: `buildSpecTable(parent, headers, rows, options)`

**What it constructs:** A data table with header row and N data rows.

```
Parameters:
  parent: FrameNode        — parent auto-layout frame to append into
  headers: string[]        — column header labels
  rows: string[][]         — 2D array of cell content
  options: {
    columnWidths?: number[]   — fixed widths per column (default: equal distribution)
    mode?: 'ds' | 'fm'        — DS2026 or FM styling
    showSwatches?: boolean    — render color swatches in cells (for token tables)
    swatchColumns?: number[]  — which columns contain swatch data (hex + name pairs)
  }

Token values used:
  Header bg: #F5F5FA (--zen-color-background-bg-grey-2)
  Header text: #3F3F4A (--zen-color-text-secondary), Inter 13px 600
  Cell text: Inter 14px 400, #2D3648
  Row border: #F0F0F5, 1px
  Cell padding: 12px vertical, 16px horizontal
```

**Pattern:** Creates a vertical auto-layout frame. First child is the header row (horizontal auto-layout, grey fill). Subsequent children are data rows (horizontal auto-layout, bottom border). Each cell is a fixed-width frame containing a text node.

### Builder 2: `buildVariantMatrix(parent, types, states, instanceFactory)`

**What it constructs:** A grid showing component instances across type x state combinations.

```
Parameters:
  parent: FrameNode
  types: string[]              — row labels (e.g., ["Primary", "Secondary", "Tertiary"])
  states: string[]             — column labels (e.g., ["Enabled", "Hovered", "Focused", "Disabled"])
  instanceFactory: (type, state) => InstanceNode  — function that creates the correct instance

Token values used:
  Header bg: #F5F5FA
  Header text: #888888, Inter 11px 600, uppercase, 0.5px letter-spacing
  Row label: Inter 12px 500, #3F3F4A
  Cell padding: 14px vertical, 12px horizontal
  Row border: #F0F0F5, 1px
```

### Builder 3: `buildStateGrid(parent, states)`

**What it constructs:** A horizontal row of state columns, each with a label and content area.

```
Parameters:
  parent: FrameNode
  states: Array<{ label: string, content: FrameNode | InstanceNode }>

Token values used:
  Label: Inter 12px 500, #888888
  Gap between columns: 48px
  Gap between label and content: 10px
```

### Builder 4: `buildBarChart(parent, data, options)`

**What it constructs:** A horizontal bar chart for presentations.

```
Parameters:
  parent: FrameNode
  data: Array<{ label: string, value: number, category?: number }>
  options: {
    maxValue?: number          — scale denominator (default: max of values)
    barHeight?: number         — default 32px
    showValues?: boolean       — show value label at end of bar
    width?: number             — chart width (default: fill parent)
  }

Token values used:
  Bar fills: category-N-strong tokens (#0550DC, #0283BE, #049B98, #E54D2E, #8E4EC6, etc.)
  Label text: Roboto 14px 400, #475467
  Value text: Roboto 14px 500, #12131F
  Axis line: #E4E4F0, 1px
```

### Builder 5: `buildDonutChart(parent, segments, options)`

**What it constructs:** A donut/ring chart with up to 5 segments and a legend.

```
Parameters:
  parent: FrameNode
  segments: Array<{ label: string, value: number, category?: number }>
  options: {
    size?: number              — diameter (default: 200px)
    innerRatio?: number        — hole size ratio (default: 0.6)
    showLegend?: boolean       — show legend alongside (default: true)
  }

Token values used:
  Segment fills: category-N-strong tokens
  Legend text: Roboto 14px 400, #475467
  Center text (total): Roboto 24px 500, #12131F
```

### Builder 6: `buildTimeline(parent, milestones)`

**What it constructs:** A horizontal timeline with dots, connecting lines, and labels.

```
Parameters:
  parent: FrameNode
  milestones: Array<{ label: string, sublabel?: string, status?: 'complete' | 'current' | 'upcoming' }>

Token values used:
  Complete dot: #047800 (--zen-color-status-success-primary)
  Current dot: #0550DC (--zen-color-theme-primary)
  Upcoming dot: #CBD2E0 (--fm-base-400)
  Line: #E2E7F0, 2px
  Label: Roboto 14px 500, #12131F
  Sublabel: Roboto 12px 400, #475467
```

### Builder 7: `buildSyntaxHighlightedText(parent, code, language)`

**What it constructs:** Syntax-highlighted text inside a code block component.

```
Parameters:
  parent: FrameNode          — the Code Block component's text container
  code: string               — raw code string
  language: 'css' | 'html' | 'js' | 'aria'  — determines highlighting rules

Token values used (Catppuccin Mocha palette):
  Base text: #A6ACCD
  Comments: #676E95
  Keywords: #C792EA
  Properties: #82AAFF
  Strings: #C3E88D
  Values: #F78C6C
  Selectors: #FFCB6B
  Tags: #89DDFF
  Punctuation: #89DDFF

Note: Figma text doesn't support per-character coloring in a single text node
without styled ranges. The builder creates separate text nodes per line or
uses setRangeFills() for inline color spans.
```

### Builder 8: `buildFormContainer(parent, options)`

**What it constructs:** A properly constrained form container per the 480px max-width rule.

```
Parameters:
  parent: FrameNode
  options: {
    maxWidth?: number         — default 480px
    alignment?: 'left' | 'center'  — default 'left'
  }

Returns: FrameNode (the container to add form fields into)
```

---

## 4. Scenario Walkthroughs

### Scenario A: "Create a component brief for the DatePicker component"

**Step 1: Research** — Claude reads the DatePicker from DS2026 library, gets screenshot, reads templates.

**Step 2: Build generation log**
```
Import: Meta / Chrome / Generation Log (by component key)
Set text properties: Skill="component-brief", Date=now, etc.
```
One `use_figma` call, ~15 lines instead of ~50.

**Step 3: Build Card 1 (Page Header)**
```
Import: Meta / Chrome / Brief Card (Mode=DS, Type=Page Header)
Set text: Component Name="DatePicker", description paragraphs
```
The Actian Pyramid logo is already nested inside the component. No SVG construction needed.

**Step 4: Build Card 3 (Anatomy)**
```
Import: Meta / Chrome / Brief Card (Mode=DS, Type=Standard)
Set text: Title="Anatomy", Subtitle="Component structure, dimensions..."

Inside the content slot:
  - Section title: "Structure" (text style, not component)
  - Import: Meta / Content / Pointer Badge x N (set Letter=A, B, C...)
  - Position badges over the DatePicker instance (absolute overlay)
  - Anatomy legend: text nodes listing A=Calendar trigger, B=Input field, etc.

  - Import: Meta / Utility / Card Divider

  - Section title: "Specs"
  - Import DatePicker instances at each size
  - Import: Meta / Content / Dimension Annotation (Direction=Vertical, Value="40px")
  - Import: Meta / Content / Dimension Annotation (Direction=Horizontal, Value="12px")
  - Position annotations adjacent to the instances

  - Import: Meta / Utility / Card Divider

  - Section title: "States"
  - Call: buildStateGrid(contentFrame, [
      { label: "Default", content: datePickerDefault },
      { label: "Focused", content: datePickerFocused },
      { label: "Open", content: datePickerOpen },
      { label: "Error", content: datePickerError },
      { label: "Disabled", content: datePickerDisabled }
    ])

  - Import: Meta / Utility / Card Divider

  - Section title: "Parts reference"
  - Call: buildSpecTable(contentFrame,
      ["Part", "Element", "Token", "Notes"],
      [["A", "Input field", "border-default, radius-sm", "Standard text input"],
       ["B", "Calendar trigger", "icon-default, size-md", "16px icon button"],
       ...],
      { columnWidths: [48, 150, 250, 300] }
    )
```

**Step 5: Build Card 4 (Design Tokens)**
```
Import: Meta / Chrome / Brief Card (Mode=DS, Type=Standard)
Set text: Title="Design tokens"

Inside content:
  - Call: buildSpecTable(contentFrame,
      ["Variant . State", "Background", "Text / Icon"],
      rows with swatch data,
      { showSwatches: true, swatchColumns: [1, 2] }
    )
  The builder uses Meta / Content / Color Swatch components for cells
  in the designated swatch columns.

  - Import: Meta / Utility / Card Divider

  - Call: buildSpecTable for sizing/spacing (3 columns, no swatches)

  - Import: Meta / Utility / Card Divider

  - Typography specimen: builder creates a frame with actual rendered text + anatomy props
```

**Step 6: Build Card 7 (Content Guidelines)**
```
Import: Meta / Chrome / Brief Card (Mode=DS, Type=Standard)
Set text: Title="Content guidelines"

Inside content, for each rule:
  - Section title text
  - Section body text
  - Import: Meta / Content / Do-Don't Pair (Mode=DS)
  - Set text: Do Label, Don't Label, Do Example, Don't Example
  - Import: Meta / Utility / Card Divider
```

**Step 7: Build Card 8 (Accessibility)**
```
Import: Meta / Chrome / Brief Card (Mode=DS, Type=Standard)

Inside content:
  - For each requirement:
    Import: Meta / Content / Accessibility Card (Icon Color=Red/Blue/Green/Grey/Orange, Has Code Block=True/False)
    Set text: Title, Body, Code
  - Arrange in 2-column grid (auto-layout wrap)

  - Import: Meta / Utility / Card Divider

  - Call: buildSpecTable for contrast ratios
    Cells include: Meta / Content / Color Swatch + Meta / Content / Contrast Badge
```

**Step 8: Build Card 9 (Code Specification)**
```
Import: Meta / Chrome / Brief Card (Mode=DS, Type=Standard)
Set text: Title="Code specification"

Inside content:
  - Import: Meta / Content / Code Block (Show Header=False)
  - Call: buildSyntaxHighlightedText(codeBlock, cssContent, 'css')
```

**Net result:** Each card is 20-40 lines of `use_figma` code instead of 80-120. The structural chrome is always pixel-perfect because it comes from the component. Only content varies.

### Scenario B: "Generate a flow for the data product creation wizard"

**Step 1: Build generation log**
```
Import: Meta / Chrome / Generation Log
Set properties.
```

**Step 2: Build flow cover card**
```
Import: Meta / Chrome / Flow Cover Card
Set text: Feature="Data Product Creation", Flow="Flow: Happy path", User="User: Data Steward"
```

**Step 3: Build each screen (x8)**
```
For each screen:
  Import: Meta / Chrome / Flow Screen (Size=Standard)
  // This arrives with FM App_header and FM Side navigation bar already composed

  // Set contextual text on the sidebar and header via component overrides
  // Then fill the content area:
  const contentArea = screen.findOne(n => n.name === "Content Area");

  // Add FM Kit components for the screen content:
  Import FM Page Header, FM Text input field, FM Button, FM Table Cell, etc.
  // Arrange in the content area auto-layout
```

**Step 4: Wrap in horizontal row**
```
const flowRow = figma.createFrame();
flowRow.layoutMode = "HORIZONTAL";
flowRow.itemSpacing = 32;
flowRow.appendChild(genLog);
flowRow.appendChild(coverCard);
screens.forEach(s => flowRow.appendChild(s));
```

**Net result:** Screen scaffolding drops from ~40 lines per screen to ~5 lines (import + set overrides). The header/sidebar structure is guaranteed consistent across all screens.

### Scenario C: "Create a presentation about our Q1 accessibility audit results"

**Step 1: Build generation log** — same as always.

**Step 2: Build Cover slide**
```
Import: Meta / Chrome / Slide Frame (Type=Cover)
Set text: Title="Q1 Accessibility Audit", Subtitle="WCAG 2.1 AA compliance results", Date="March 2026", Creators="Design Systems Team"
// Geometric overlay is nested inside the component already
```

**Step 3: Build Body slides with data**
```
Import: Meta / Chrome / Slide Frame (Type=Body Full)
Set text: Title="Component compliance grew to 94%"

Inside the content area:
  Call: buildBarChart(contentArea, [
    { label: "Forms", value: 98, category: 1 },
    { label: "Navigation", value: 95, category: 2 },
    { label: "Data Display", value: 92, category: 3 },
    { label: "Feedback", value: 88, category: 4 }
  ])
```

**Step 4: Build slides with tables**
```
Import: Meta / Chrome / Slide Frame (Type=Body Full)

Inside content area:
  Call: buildSpecTable(contentArea,
    ["Component", "Contrast", "Keyboard", "Focus", "ARIA", "Status"],
    [...audit rows...],
    { mode: 'ds' }
  )
```

**Step 5: Build slides with do/don't**
```
Import: Meta / Chrome / Slide Frame (Type=Body Text+Visual)
Set text in text column.

In visual column:
  Import: Meta / Content / Do-Don't Pair (Mode=DS)
  Set examples with before/after accessibility improvements.
```

**Key insight:** The same Do-Don't Pair component used in component-brief Card 7 is reused here in the presentation. Same table builder used for Card 4 token tables is reused for the audit data table. **Consistency is mechanical.**

### Scenario D: "Create an FM Alert component with success, error, warning, info variants"

**Step 1: Build generation log**
```
Import: Meta / Chrome / Generation Log
Set: Skill="create-component"
```

**Step 2: Build the component set** — this is create-component specific, uses standard Figma Plugin API to create component sets with variants. The Meta Kit is minimally involved here.

**Step 3: Generation metadata card** — the Generation Log component is the only Meta Kit element needed. The actual component creation uses the FM token reference and standard Figma component creation patterns.

**Net result:** create-component uses only the Generation Log from Meta Kit. Its primary output is the component itself, not documentation frames.

---

## 5. File Organization

### Figma File Structure

```
Figma Project 62158719/
  |-- Actian Design System 2026 (l8biHxfarNi1I2RMvVxVOK)  -- production DS
  |-- Page Mockups (X2JSEUyLvxyNCx22ucOexn)                -- FM Kit
  |-- Meta Kit (NEW FILE)                                   -- this library
       |-- Page: Chrome
       |     Components: Generation Log, Brief Card, Slide Frame,
       |                 Flow Cover Card, Flow Screen, Research Frame
       |-- Page: Content
       |     Components: Code Block, Do-Don't Pair, Accessibility Card,
       |                 Color Swatch, Contrast Badge, Pointer Badge,
       |                 Dimension Annotation, Theme Card, Stat Card
       |-- Page: Data Viz
       |     (No components — data viz is builder-only)
       |-- Page: Utility
       |     Components: Card Divider, Actian Pyramid, Geometric Overlay
       |-- Page: Examples
       |     Assembled examples showing components in context
```

### Plugin Repo Files

```
plugins/actian-design-system/
  |-- docs/
  |     |-- meta-kit-components.md          -- NEW: component catalog (like fm-components.md)
  |     |     Contains: component name, key, node ID, variant axes,
  |     |     text properties, usage notes for every Meta Kit component
  |     |-- meta-kit-design-document.md     -- THIS FILE: architecture reference
  |
  |-- references/
  |     |-- meta-kit-builders.md            -- NEW: builder function library
  |     |     Contains: every builder function with full JS code,
  |     |     parameter docs, token values, usage examples
  |     |-- figma-output.md                 -- UPDATED: add Meta Kit import pattern
  |
  |-- scripts/
  |     |-- sync-from-upstream.sh           -- UPDATED: add Meta Kit sync target
```

### How Component Keys Get Into the Plugin

**Option A (recommended): Sync script**

Extend `sync-from-upstream.sh` to also pull Meta Kit components. The Assembler's `sync-all.js` already reads component keys from Figma. Add a new target:

```bash
# In sync-from-upstream.sh
sync_meta_kit() {
  curl -s "https://raw.githubusercontent.com/volivarii/Actian-DS-Assembler/main/registry/meta-kit-registry.json" \
    -o docs/meta-kit-components.md
}
```

**Option B: Manual catalog**

Since Meta Kit is small (~18 components), maintain `meta-kit-components.md` by hand. After publishing the Figma library, copy each component's key from the Figma REST API response or from Inspect panel.

**Recommendation:** Start with Option B for speed, migrate to Option A when the Assembler supports multiple registries.

### How Skills Reference Meta Kit

Each skill file (SKILL.md) gets a new section:

```markdown
### Meta Kit Components

Import these components from the Meta Kit library instead of building inline:

| Component | Key | Usage |
|-----------|-----|-------|
| Generation Log | `abc123...` | First element in every output |
| Brief Card (DS Standard) | `def456...` | Card shell for Cards 2-9 |
| ...
```

The `references/figma-output.md` file gets updated with the general import pattern:

```js
// Meta Kit import pattern
const metaComponent = await figma.teamLibrary.getComponentByKeyAsync("COMPONENT_KEY");
const instance = metaComponent.createInstance();
// Set text properties
const titleProp = Object.keys(instance.componentProperties).find(k => k.startsWith("Title"));
instance.setProperties({ [titleProp]: "Anatomy" });
```

### How Builder Functions Are Referenced

`references/meta-kit-builders.md` contains the full JS source for every builder function. Skills reference them like:

```markdown
> **Builder functions:** Copy builder functions from `../../references/meta-kit-builders.md`
> into your `use_figma` calls as needed. Available builders: buildSpecTable, buildVariantMatrix,
> buildStateGrid, buildBarChart, buildDonutChart, buildTimeline, buildSyntaxHighlightedText.
```

---

## 6. Self-Reinforcing Loop Design

### The Feedback Mechanism

```
                    +-------------------+
                    |  Golden Reference |
                    |  (approved output |
                    |   in Figma)       |
                    +--------+----------+
                             |
              screenshots +  | component keys
              get_design_   |
              context        |
                             v
+----------+     +----------+----------+     +----------+
|  User    |---->|  Claude + Meta Kit  |---->|  Output  |
|  Prompt  |     |  (skill + builders  |     |  (Figma) |
+----------+     |   + components)     |     +-----+----+
                 +---------------------+           |
                             ^                     |
                             |   user approval     |
                             +---------------------+
```

### Step 1: Output Becomes Reference

When a user approves a generated output (component brief, flow, presentation), it becomes a golden reference:

1. **In Figma:** The approved output stays in the project file. It can be screenshotted via `get_screenshot` and analyzed via `get_design_context` by future skill invocations.

2. **In the plugin:** The generation log embedded in the output records exactly which skill, prompt, model, and version produced it. This is traceable.

### Step 2: Approved Component Briefs Inform Future Component Creation

When `component-brief` produces an approved spec for (say) DatePicker:

1. The brief cards contain anatomy, token mappings, variant axes, and accessibility requirements.
2. When `create-component` is later asked to build the DatePicker in Figma, it can:
   - Read the approved brief's HTML file from `components/date-picker/date-picker-spec.html`
   - Extract variant axes, token values, and layout from the structured data
   - Build the component to match the spec exactly

**Mechanism:** Add to `create-component/SKILL.md`:
```markdown
### Check for existing brief
Before creating, check `components/[slug]/[slug]-spec.html`.
If a brief exists, use it as the primary source for variants,
tokens, anatomy, and constraints. This ensures the built component
matches the approved specification.
```

### Step 3: Approved Flows Become Pattern Libraries

When `generate-flow` produces an approved flow:

1. The screen layouts, component arrangements, and interaction patterns are captured in Figma.
2. Future `generate-flow` calls for similar features can reference these patterns.

**Mechanism:** A `patterns/` directory in the plugin:
```
patterns/
  wizard-flow.md         — screen sequence for multi-step wizards
  crud-table-flow.md     — list > detail > edit > confirm
  access-request-flow.md — request > review > approve/deny
```

Each pattern file documents:
- Screen sequence (names and what each shows)
- Common FM components used
- Layout conventions (form width, action footer placement)
- Edge cases (empty state, error state, loading state)

These are hand-curated from approved flows. Claude reads them during Step 2 of generate-flow.

### Step 4: Comparison and Verification

After generating output, Claude can compare against golden references:

```markdown
### Verification step (after generation)
1. Take get_screenshot of the new output
2. If a golden reference exists for this component/feature:
   - Take get_screenshot of the golden reference
   - Compare: are card dimensions consistent? Are token colors matching?
   - Flag any visual discrepancies
3. If no golden reference exists, this output becomes the candidate
```

**Where golden references live:**

- **In Figma:** A dedicated page in the Meta Kit file called "Golden References" containing approved instances of each card type, slide type, and screen type.
- **In the plugin:** `references/golden-references.md` listing the Figma node IDs of each golden reference for quick `get_screenshot` access.

### Step 5: The Loop Closes

```
Build Meta Kit components
  -> Use them in skill outputs
    -> User approves outputs
      -> Approved outputs inform patterns
        -> Patterns improve future outputs
          -> Patterns reveal missing Meta Kit components
            -> Build new Meta Kit components
```

The Meta Kit library grows organically based on what the skills actually need. New patterns discovered in approved flows get codified as components or builders.

---

## 7. Implementation Priority

### Phase 1: Foundation (Build First)

These unlock the most value with the least effort. Every skill uses them.

| Priority | Component | Impact | Effort |
|----------|-----------|--------|--------|
| P0 | **Generation Log** | Used by all 4 skills, every output | Low — simple component |
| P0 | **Card Divider** | Used dozens of times per brief | Trivial |
| P0 | **Brief Card (DS Standard)** | Used 8 times per DS brief | Medium — 2 variants |
| P0 | **Code Block** | Used by component-brief + presentation | Low — shell only |
| P0 | **Do-Don't Pair** | Used by 2 cards + presentations | Low |
| P0 | **buildSpecTable** | Used 6+ times per brief, every presentation with data | Medium — most complex builder |

**Deliverable:** After Phase 1, `component-brief` can use Meta Kit for all card shells and the most common content elements. Code per card drops ~60%.

### Phase 2: Component Brief Full Coverage

| Priority | Component | Impact | Effort |
|----------|-----------|--------|--------|
| P1 | **Pointer Badge** | Anatomy card | Trivial |
| P1 | **Dimension Annotation** | Anatomy card specs | Low |
| P1 | **Color Swatch** | Token tables | Low |
| P1 | **Contrast Badge** | Accessibility card | Trivial |
| P1 | **Accessibility Card** | Accessibility card | Low |
| P1 | **Theme Card** | Actual component card | Low |
| P1 | **Actian Pyramid** | Page header + slides | Low |
| P1 | **buildVariantMatrix** | Actual component card | Medium |
| P1 | **buildStateGrid** | Anatomy card | Low |

**Deliverable:** After Phase 2, the entire component-brief skill uses Meta Kit. Visual consistency across briefs is guaranteed.

### Phase 3: Presentation + Flow Coverage

| Priority | Component | Impact | Effort |
|----------|-----------|--------|--------|
| P2 | **Slide Frame (5 variants)** | All presentations | Medium-High |
| P2 | **Geometric Overlay** | Cover/section slides | Medium |
| P2 | **Stat Card** | Presentations with metrics | Low |
| P2 | **Flow Cover Card** | All flows | Low |
| P2 | **Flow Screen** | All flows | Medium (composes FM Kit) |
| P2 | **Research Frame** | Optional flow element | Low |
| P2 | **buildBarChart** | Presentations with data | Medium |
| P2 | **buildDonutChart** | Presentations with data | Medium |
| P2 | **buildTimeline** | Presentations with timelines | Low |

**Deliverable:** After Phase 3, all 4 skills use Meta Kit. Cross-skill consistency is complete.

### Phase 4: Self-Reinforcing Loop

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| P3 | Golden References page in Meta Kit file | Quality baseline | Low |
| P3 | Pattern docs from approved flows | Future flow quality | Medium |
| P3 | Brief-to-component pipeline | Spec-to-build accuracy | Medium |
| P3 | Comparison/verification step | Automated QA | Medium |
| P3 | Sync script for Meta Kit registry | Maintenance automation | Low |

**Deliverable:** After Phase 4, the system improves itself over time.

---

## 5 (continued). Dynamic Elements — The Hard Problem

### The Challenge

Tables are the most common visual element across all skills, and they have variable rows and columns. A Figma component cannot have "N rows." This is the fundamental tension between components (fixed structure) and builders (dynamic structure).

### Solution: Component Chrome + Builder Content

The pattern is: **use a component for the wrapper, use a builder for the rows.**

#### Approach for Spec Tables

1. **Table Header Row Component** (`Meta / Content / Table Header Cell`)
   - Text property for column header label
   - Fixed height (36px)
   - Grey background (#F5F5FA)
   - Inter 13px 600
   - Width: fill parent

2. **Table Data Cell Component** (`Meta / Content / Table Cell`)
   - Variant: Plain Text, Code, Swatch
   - Text property for content
   - Fixed height: hug
   - Inter 14px 400
   - Width: fill parent
   - Bottom border: 1px #F0F0F5

3. **The builder (`buildSpecTable`) does:**
   ```
   1. Create a vertical auto-layout frame (the table)
   2. Create a horizontal auto-layout frame (header row)
   3. For each header: import Table Header Cell, set text, set width
   4. For each data row:
      a. Create horizontal auto-layout frame
      b. For each cell: import Table Cell (variant based on content type), set text, set width
      c. Append row to table
   5. Return the table frame
   ```

4. **Why not just build cells inline?** Because the Table Header Cell and Table Cell components carry their own styling (font, color, padding, background). If the design team updates the table style in Meta Kit, all generated tables update on re-generation. Without components, every builder would need code updates.

#### How FM Table Cell Relates

The existing FM Table Cell component (key: `9267fecfadc4577563deb1425fa598d1f5af9144`) has variants: Header, Text, Pill, Placeholder. This works for flow screens where tables show data.

The Meta Kit's table cells are different — they're for documentation tables (token references, property lists, contrast ratios). Different typography (Inter vs. the wireframe style), different sizing, different purpose. They coexist:

- **FM Table Cell** — used inside flow screens (lo-fi wireframe tables)
- **Meta / Content / Table Header Cell** + **Table Cell** — used in spec cards and presentation slides (documentation tables)

#### Nested Auto-Layout for Growable Tables

Figma auto-layout frames grow when children are added. The pattern:

```
Table (vertical auto-layout, width: fill parent, height: hug)
  |-- Header Row (horizontal auto-layout, width: fill, height: hug)
  |     |-- Cell 1 (width: fixed 200px, height: hug)
  |     |-- Cell 2 (width: fill, height: hug)
  |     |-- Cell 3 (width: fixed 120px, height: hug)
  |-- Data Row 1 (horizontal auto-layout, width: fill, height: hug)
  |     |-- Cell 1...
  |-- Data Row 2...
  |-- Data Row N...
```

The table frame's height grows automatically as rows are added. Each row's height grows if cell content wraps. Column widths are set once on the header row cells and matched on data row cells.

This is stable up to ~50 rows before Figma performance becomes a concern. For very large tables (100+ rows), truncate with a "and N more rows..." label.

---

## Summary

The Meta Kit is 18 Figma components and 8 builder functions that replace thousands of lines of inline frame construction across 4 skills. The components handle fixed chrome (card shells, slide frames, badges, code blocks). The builders handle dynamic content (tables, charts, grids). Together they guarantee visual consistency and reduce generation code by ~60%.

The implementation is phased: Phase 1 (foundation) covers the generation log, card shells, code blocks, and table builder — the elements used most often. Phase 2 completes component-brief coverage. Phase 3 extends to presentations and flows. Phase 4 closes the self-reinforcing loop where approved outputs improve future outputs.

The Meta Kit lives in its own Figma file in project 62158719, published as a team library. Component keys flow into the plugin via a catalog doc. Skills import components by key and set text properties, then use builder functions for dynamic content areas.
