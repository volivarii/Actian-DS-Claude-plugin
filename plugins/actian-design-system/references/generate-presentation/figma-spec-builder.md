# Generate Presentation -- Figma Spec Builder

Transforms a slide outline into `figma-spec.json` for the JSON Spec Interpreter. This document is the single reference for mapping presentation content to the declarative JSON tree that the interpreter builds in Figma.

## Purpose

The AI reads the approved slide outline (from Step 2) and produces a `figma-spec.json` file. The interpreter (`scripts/figma-interpreter.js`) consumes that JSON and builds the entire Figma slide deck -- frames, text, shapes, instances -- without the AI writing any Plugin API code.

## Rule

**AI produces JSON data only, never Plugin API code.** The interpreter handles all `figma.*` calls, font loading, variable binding, gradient construction, and child appending. The AI's job is to map slide content to the correct spec tree structure.

---

## Imports

Every presentation spec MUST declare at minimum the generation log. Add Meta Kit components as needed per deck.

### Required imports (always present)

```json
{
  "genLog": { "key": "a9653f30925367e96dea90093d750bfe70849571", "method": "single" }
}
```

### Optional imports (add per deck as needed)

```json
{
  "doDontPair": { "key": "28edfacf13e50706586172bd48f8a3ad84d7c263", "method": "set" },
  "codeBlock": { "key": "1bf10eee1751a46da5f90a9671be6c9abf0073b7", "method": "single" },
  "divider": { "key": "f4d778e1cf9bb61a33712c791486f54bb1c095b7", "method": "single" }
}
```

- `"single"` = `importComponentByKeyAsync` (standalone component, no variants)
- `"set"` = `importComponentSetByKeyAsync` (has variants, use `spec.variant` to pick one)

Look up additional component keys in `../../docs/meta-kit/components.md` (Meta Kit), `../../docs/dskit-components.md` (DS Kit), or `../../docs/fm-components.md` (FM Kit).

---

## Fonts

Every presentation spec MUST declare all Roboto weights used:

```json
{
  "fonts": [
    "Roboto:Regular",
    "Roboto:Bold",
    "Roboto:Medium"
  ]
}
```

DS Kit uses Roboto. Always include all three weights -- slides mix regular body, bold headings, and medium labels.

---

## Spec Envelope

Top-level structure for a presentation `figma-spec.json`:

```json
{
  "meta": {
    "skill": "generate-presentation",
    "component": "Q1 Design System Progress",
    "targetNodeId": "0:1",
    "wrapperName": "Presentation: Q1 Design System Progress"
  },
  "fonts": ["Roboto:Regular", "Roboto:Bold", "Roboto:Medium"],
  "imports": {
    "genLog": { "key": "a9653f30925367e96dea90093d750bfe70849571", "method": "single" }
  },
  "variables": {
    "brandPrimary": { "key": "a256595115f6048a1e1c843e3099a79a5c259288" },
    "bgDefault": { "key": "805afec875092b89deebe685e17992963d603974" },
    "bgGrey2": { "key": "2d7f893d1d1f5807dfc84b7b6e057eff8fd2ae31" },
    "bgReverse": { "key": "3d35091ed8a67f9cf4dc1e55e32a4bac7ac07a79" },
    "textPrimary": { "key": "cb3cf6a8b661f3a2ff12835120957f3278d329d0" },
    "textSecondary": { "key": "54d9d36f7653380d99e9aadbad21e14f9dcdb295" },
    "textReverse": { "key": "d5b2b08fd5bab41595edb892bf4707cb94bae50a" },
    "borderDefault": { "key": "290c868621027b488cbc3b262619959bec52765f" }
  },
  "styles": {},
  "tree": [
    { "type": "INSTANCE", "...": "genLog" },
    { "type": "FRAME", "name": "Slide 1: Cover", "...": "..." },
    { "type": "FRAME", "name": "Slide 2: ...", "...": "..." }
  ]
}
```

For continuation calls (call splitting), replace `targetNodeId` and `wrapperName` with `appendToId`:

```json
{
  "meta": {
    "skill": "generate-presentation",
    "component": "Q1 Design System Progress",
    "appendToId": "<wrapper node ID from Call 1>"
  }
}
```

---

## Variable Binding

Presentations use DS Kit tokens for theme-aware colors. Declare variables in the top-level `variables` section, then reference them by ref name in node-level `variables` bindings.

### Core presentation variables

| Ref name | Variable path | Key | Actian hex | Purpose |
|----------|--------------|-----|------------|---------|
| `brandPrimary` | Brand/primary | `a256595115f6048a1e1c843e3099a79a5c259288` | #0550DC | Cover/back cover gradient stops, accent elements |
| `bgDefault` | Background (bg)/default | `805afec875092b89deebe685e17992963d603974` | #FFFFFF | Body slide background |
| `bgGrey2` | Background (bg)/grey 2 | `2d7f893d1d1f5807dfc84b7b6e057eff8fd2ae31` | #F5F5FA | Section divider background, content areas |
| `bgReverse` | Background (bg)/reverse | `3d35091ed8a67f9cf4dc1e55e32a4bac7ac07a79` | #12131F | Dark gradient base |
| `textPrimary` | Text/primary | `cb3cf6a8b661f3a2ff12835120957f3278d329d0` | #000000 | Body headings, section divider text |
| `textSecondary` | Text/secondary | `54d9d36f7653380d99e9aadbad21e14f9dcdb295` | #3F3F4A | Body text, subtitles |
| `textReverse` | Text/reverse | `d5b2b08fd5bab41595edb892bf4707cb94bae50a` | #FFFFFF | Cover/back cover text |
| `borderDefault` | Border/default | `290c868621027b488cbc3b262619959bec52765f` | #F5F5FA | Content area borders |

### Chart category variables (add as needed)

| Ref name | Variable path | Key | Hex |
|----------|--------------|-----|-----|
| `cat1Strong` | Category/1-strong | `a6da1a364e8613bd146667f77efa03ee7ea39305` | #4A6470 |
| `cat2Strong` | Category/2-strong | `c2c0376490a69426cedfdcb1ab2a6d531b626fdf` | #00699F |
| `cat3Strong` | Category/3-strong | `9997cab3913a4dfbcb8729e5a11bd21f14f16b86` | #007E7B |
| `cat4Strong` | Category/4-strong | `2b5d7f13d3765cb54d6b7ffdcd36b6ed3543823f` | #7900CB |
| `cat5Strong` | Category/5-strong | `8d43f11cdb9916465065f37576bb8d903706dcfc` | #C4004C |

### Binding in nodes

```json
{
  "type": "FRAME",
  "name": "Body slide",
  "fills": ["#FFFFFF"],
  "variables": {
    "fills.0.color": "bgDefault"
  },
  "children": [
    {
      "type": "TEXT",
      "content": "Heading",
      "color": "#000000",
      "variables": { "fills.0.color": "textPrimary" }
    }
  ]
}
```

The hex values in `fills` and `color` are fallbacks. Variable binding overrides them at runtime when the variable resolves. Always provide both.

---

## Slide Type Mapping

Every slide is a fixed-size FRAME: **1920 x 1080 px**. The wrapper frame uses horizontal auto-layout with 40px spacing to arrange slides side by side.

### Generation Log (always first in tree)

```json
{
  "type": "INSTANCE",
  "name": "Generation log",
  "ref": "genLog",
  "props": {
    "Skill": "generate-presentation",
    "Prompt": "Create a presentation about Q1 progress...",
    "Date": "2026-03-31T14:30:00Z",
    "Duration": "2m 15s",
    "Model": "claude-opus-4-6",
    "Plugin": "v1.18.1"
  }
}
```

### Cover slide

Dark gradient background with title, subtitle, topic label, date, and creators.

```json
{
  "type": "FRAME",
  "name": "Slide 1: Cover",
  "width": 1920,
  "height": 1080,
  "layout": { "mode": "NONE" },
  "clipsContent": true,
  "fills": [{
    "type": "LINEAR",
    "stops": [
      { "color": "#090952", "position": 0 },
      { "color": "#1414B8", "position": 1 }
    ],
    "angle": 80
  }],
  "children": [
    {
      "type": "TEXT",
      "name": "Topic",
      "content": "Design System",
      "font": "Roboto:Medium",
      "size": 40,
      "color": "#FFFFFF",
      "width": 1760,
      "variables": { "fills.0.color": "textReverse" }
    },
    {
      "type": "TEXT",
      "name": "Title",
      "content": "Q1 Progress Report",
      "font": "Roboto:Medium",
      "size": 130,
      "color": "#FFFFFF",
      "width": 1760,
      "lineHeight": { "value": 102, "unit": "PERCENT" },
      "variables": { "fills.0.color": "textReverse" }
    },
    {
      "type": "TEXT",
      "name": "Subtitle",
      "content": "Component coverage, adoption metrics, and roadmap",
      "font": "Roboto:Regular",
      "size": 60,
      "color": "#FFFFFF",
      "opacity": 0.8,
      "width": 1760,
      "lineHeight": { "value": 102, "unit": "PERCENT" }
    },
    {
      "type": "TEXT",
      "name": "Date",
      "content": "March 2026",
      "font": "Roboto:Regular",
      "size": 32,
      "color": "#FFFFFF",
      "variables": { "fills.0.color": "textReverse" }
    },
    {
      "type": "TEXT",
      "name": "Creators",
      "content": "Design Systems Team",
      "font": "Roboto:Regular",
      "size": 32,
      "color": "#FFFFFF",
      "variables": { "fills.0.color": "textReverse" }
    }
  ]
}
```

**Positioning note:** Cover slides use `layout.mode: "NONE"` (absolute positioning). Position child nodes by setting `x` and `y` properties if the interpreter supports them, or rely on the interpreter's default stacking. Match the HTML template positions: topic at (80, 88), title at (69, 166), subtitle at (69, 341), date at (80, 931), creators at (80, 980).

### Body (Text + Visual)

Two-column layout: heading + body text on the left, visual content on the right.

```json
{
  "type": "FRAME",
  "name": "Slide 3: Component Adoption",
  "width": 1920,
  "height": 1080,
  "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [0, 0, 0, 0] },
  "clipsContent": true,
  "fills": ["#FFFFFF"],
  "variables": { "fills.0.color": "bgDefault" },
  "children": [
    {
      "type": "TEXT",
      "name": "Slide title",
      "content": "Component adoption grew 3x in Q1",
      "font": "Roboto:Regular",
      "size": 56,
      "color": "#12131F",
      "width": 1760,
      "lineHeight": { "value": 103, "unit": "PERCENT" },
      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
      "variables": { "fills.0.color": "textPrimary" }
    },
    {
      "type": "FRAME",
      "name": "Content columns",
      "layout": { "mode": "HORIZONTAL", "spacing": 56, "padding": [0, 0, 0, 0] },
      "sizing": { "horizontal": "FILL", "vertical": "FILL" },
      "fills": [],
      "children": [
        {
          "type": "FRAME",
          "name": "Text column",
          "layout": { "mode": "VERTICAL", "spacing": 16, "padding": [0, 0, 0, 0] },
          "sizing": { "horizontal": 549, "vertical": "FILL" },
          "fills": [],
          "children": [
            {
              "type": "TEXT",
              "name": "Body",
              "content": "Teams using DS Kit components reduced design-to-dev handoff time by 40%. The biggest gains came from form components and data tables.",
              "font": "Roboto:Regular",
              "size": 24,
              "color": "#12131F",
              "width": 549,
              "lineHeight": { "value": 130, "unit": "PERCENT" },
              "variables": { "fills.0.color": "textPrimary" }
            }
          ]
        },
        {
          "type": "FRAME",
          "name": "Visual area",
          "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [24, 24, 24, 24], "primaryAxisAlign": "CENTER", "counterAxisAlign": "CENTER" },
          "sizing": { "horizontal": "FILL", "vertical": "FILL" },
          "fills": ["#F5F5FA"],
          "cornerRadius": 4,
          "variables": { "fills.0.color": "bgGrey2" },
          "children": [
            { "type": "TEXT", "name": "Visual placeholder", "content": "Chart or screenshot here", "font": "Roboto:Regular", "size": 18, "color": "#595968" }
          ]
        }
      ]
    }
  ]
}
```

### Body (Full content)

Full-width content area for charts, tables, screenshots, or diagrams.

```json
{
  "type": "FRAME",
  "name": "Slide 4: Token Coverage",
  "width": 1920,
  "height": 1080,
  "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [64, 80, 64, 80] },
  "clipsContent": true,
  "fills": ["#FFFFFF"],
  "variables": { "fills.0.color": "bgDefault" },
  "children": [
    {
      "type": "TEXT",
      "name": "Slide title",
      "content": "Token usage reached 100% across all product screens",
      "font": "Roboto:Regular",
      "size": 56,
      "color": "#12131F",
      "lineHeight": { "value": 103, "unit": "PERCENT" },
      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
      "variables": { "fills.0.color": "textPrimary" }
    },
    {
      "type": "FRAME",
      "name": "Content area",
      "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [24, 24, 24, 24], "primaryAxisAlign": "CENTER", "counterAxisAlign": "CENTER" },
      "sizing": { "horizontal": "FILL", "vertical": "FILL" },
      "fills": ["#F5F5FA"],
      "cornerRadius": 4,
      "variables": { "fills.0.color": "bgGrey2" },
      "children": []
    }
  ]
}
```

Place chart or table nodes inside the `Content area` children array. See "Charts as Spec Nodes" below.

### Section divider

Light gradient background with topic and title centered vertically.

```json
{
  "type": "FRAME",
  "name": "Slide 5: Section -- Roadmap",
  "width": 1920,
  "height": 1080,
  "layout": { "mode": "NONE" },
  "clipsContent": true,
  "fills": [{
    "type": "LINEAR",
    "stops": [
      { "color": "#EEEEFD", "position": 0 },
      { "color": "#CBDAFF", "position": 1 }
    ],
    "angle": 80
  }],
  "children": [
    {
      "type": "TEXT",
      "name": "Topic",
      "content": "Next Steps",
      "font": "Roboto:Regular",
      "size": 60,
      "color": "#12131F",
      "width": 1760,
      "lineHeight": { "value": 102, "unit": "PERCENT" },
      "variables": { "fills.0.color": "textPrimary" }
    },
    {
      "type": "TEXT",
      "name": "Title",
      "content": "Roadmap",
      "font": "Roboto:Medium",
      "size": 130,
      "color": "#12131F",
      "width": 1760,
      "lineHeight": { "value": 102, "unit": "PERCENT" },
      "variables": { "fills.0.color": "textPrimary" }
    }
  ]
}
```

### Back cover

Same dark gradient as cover. Closing text and optional pyramid placeholder.

```json
{
  "type": "FRAME",
  "name": "Slide 8: Back cover",
  "width": 1920,
  "height": 1080,
  "layout": { "mode": "NONE" },
  "clipsContent": true,
  "fills": [{
    "type": "LINEAR",
    "stops": [
      { "color": "#090952", "position": 0 },
      { "color": "#1414B8", "position": 1 }
    ],
    "angle": 80
  }],
  "children": [
    {
      "type": "TEXT",
      "name": "Closing text",
      "content": "Thank you",
      "font": "Roboto:Medium",
      "size": 152,
      "color": "#FFFFFF",
      "width": 1760,
      "lineHeight": { "value": 102, "unit": "PERCENT" },
      "variables": { "fills.0.color": "textReverse" }
    }
  ]
}
```

---

## Charts as Spec Nodes

Build charts from basic spec primitives. No JavaScript chart libraries.

### Bar charts

Horizontal bars using FRAME + RECT children with TEXT labels.

```json
{
  "type": "FRAME",
  "name": "Bar chart: Adoption by team",
  "layout": { "mode": "VERTICAL", "spacing": 8, "padding": [0, 0, 0, 0] },
  "sizing": { "horizontal": "FILL", "vertical": "HUG" },
  "fills": [],
  "children": [
    {
      "type": "FRAME",
      "name": "Bar row: Studio",
      "layout": { "mode": "HORIZONTAL", "spacing": 12, "padding": [0, 0, 0, 0], "counterAxisAlign": "CENTER" },
      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
      "fills": [],
      "children": [
        { "type": "TEXT", "name": "Label", "content": "Studio", "font": "Roboto:Regular", "size": 16, "color": "#12131F", "sizing": { "horizontal": 120, "vertical": "HUG" } },
        { "type": "RECT", "name": "Bar", "width": 600, "height": 24, "fills": ["#4A6470"], "cornerRadius": 2, "variables": { "fills.0.color": "cat1Strong" } },
        { "type": "TEXT", "name": "Value", "content": "87%", "font": "Roboto:Medium", "size": 16, "color": "#12131F" }
      ]
    },
    {
      "type": "FRAME",
      "name": "Bar row: Explorer",
      "layout": { "mode": "HORIZONTAL", "spacing": 12, "padding": [0, 0, 0, 0], "counterAxisAlign": "CENTER" },
      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
      "fills": [],
      "children": [
        { "type": "TEXT", "name": "Label", "content": "Explorer", "font": "Roboto:Regular", "size": 16, "color": "#12131F", "sizing": { "horizontal": 120, "vertical": "HUG" } },
        { "type": "RECT", "name": "Bar", "width": 480, "height": 24, "fills": ["#00699F"], "cornerRadius": 2, "variables": { "fills.0.color": "cat2Strong" } },
        { "type": "TEXT", "name": "Value", "content": "72%", "font": "Roboto:Medium", "size": 16, "color": "#12131F" }
      ]
    }
  ]
}
```

Scale bar widths proportionally to values. Max bar width should fill the available content area (~900px for full-width, ~600px for two-column visual area).

### Data tables

Horizontal auto-layout rows with header + data rows.

```json
{
  "type": "FRAME",
  "name": "Table: Component status",
  "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [0, 0, 0, 0] },
  "sizing": { "horizontal": "FILL", "vertical": "HUG" },
  "fills": [],
  "children": [
    {
      "type": "FRAME",
      "name": "Header row",
      "layout": { "mode": "HORIZONTAL", "spacing": 0, "padding": [8, 12, 8, 12] },
      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
      "fills": ["#F5F5FA"],
      "variables": { "fills.0.color": "bgGrey2" },
      "children": [
        { "type": "TEXT", "name": "Col: Component", "content": "COMPONENT", "font": "Roboto:Medium", "size": 11, "color": "#717D96", "textCase": "UPPER", "sizing": { "horizontal": "FILL", "vertical": "HUG" } },
        { "type": "TEXT", "name": "Col: Status", "content": "STATUS", "font": "Roboto:Medium", "size": 11, "color": "#717D96", "textCase": "UPPER", "sizing": { "horizontal": 120, "vertical": "HUG" } },
        { "type": "TEXT", "name": "Col: Coverage", "content": "COVERAGE", "font": "Roboto:Medium", "size": 11, "color": "#717D96", "textCase": "UPPER", "sizing": { "horizontal": 120, "vertical": "HUG" } }
      ]
    },
    {
      "type": "FRAME",
      "name": "Data row: Button",
      "layout": { "mode": "HORIZONTAL", "spacing": 0, "padding": [10, 12, 10, 12] },
      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
      "fills": ["#FFFFFF"],
      "stroke": { "color": "#F5F5FA", "weight": 1, "align": "INSIDE", "sides": { "top": false, "right": false, "bottom": true, "left": false } },
      "children": [
        { "type": "TEXT", "name": "Cell: Component", "content": "Button", "font": "Roboto:Regular", "size": 14, "color": "#12131F", "sizing": { "horizontal": "FILL", "vertical": "HUG" } },
        { "type": "TEXT", "name": "Cell: Status", "content": "Complete", "font": "Roboto:Regular", "size": 14, "color": "#047800", "sizing": { "horizontal": 120, "vertical": "HUG" } },
        { "type": "TEXT", "name": "Cell: Coverage", "content": "100%", "font": "Roboto:Regular", "size": 14, "color": "#12131F", "sizing": { "horizontal": 120, "vertical": "HUG" } }
      ]
    }
  ]
}
```

### Stat cards

Use Meta Kit Stat Card component if available. Otherwise, build from primitives:

```json
{
  "type": "FRAME",
  "name": "Stat card: Components",
  "layout": { "mode": "VERTICAL", "spacing": 4, "padding": [24, 24, 24, 24] },
  "sizing": { "horizontal": "FILL", "vertical": "HUG" },
  "fills": ["#FFFFFF"],
  "cornerRadius": 8,
  "stroke": { "color": "#F5F5FA", "weight": 1, "align": "INSIDE" },
  "variables": { "fills.0.color": "bgDefault", "strokes.0.color": "borderDefault" },
  "children": [
    { "type": "TEXT", "name": "Metric label", "content": "Components shipped", "font": "Roboto:Regular", "size": 14, "color": "#595968", "textCase": "UPPER" },
    { "type": "TEXT", "name": "Metric value", "content": "44", "font": "Roboto:Bold", "size": 56, "color": "#0550DC", "variables": { "fills.0.color": "brandPrimary" } },
    { "type": "TEXT", "name": "Metric context", "content": "+12 from last quarter", "font": "Roboto:Regular", "size": 16, "color": "#3F3F4A", "variables": { "fills.0.color": "textSecondary" } }
  ]
}
```

### Complex charts

For charts that cannot be faithfully represented with rectangles and text (donut, complex line charts), use a placeholder frame:

```json
{
  "type": "FRAME",
  "name": "Chart: Token adoption by category (donut)",
  "layout": { "mode": "VERTICAL", "spacing": 8, "padding": [24, 24, 24, 24], "primaryAxisAlign": "CENTER", "counterAxisAlign": "CENTER" },
  "sizing": { "horizontal": "FILL", "vertical": "FILL" },
  "fills": ["#F5F5FA"],
  "cornerRadius": 4,
  "variables": { "fills.0.color": "bgGrey2" },
  "children": [
    { "type": "TEXT", "name": "Placeholder label", "content": "Chart: Token adoption by category (donut)", "font": "Roboto:Regular", "size": 18, "color": "#717D96" }
  ]
}
```

---

## Call Splitting

One `use_figma` call per 3-4 slides. Keep each call under 50KB of JSON. Typical split for a 10-slide deck:

| Call | Slides | Content |
|------|--------|---------|
| 1 | genLog + slides 1-4 | Cover + first body slides |
| 2 | slides 5-8 | Section divider + body slides |
| 3 | slides 9-10 | Final body + back cover |

### First call -- creates the wrapper

```json
{
  "meta": {
    "skill": "generate-presentation",
    "component": "Q1 Progress",
    "targetNodeId": "0:1",
    "wrapperName": "Presentation: Q1 Progress"
  },
  "fonts": ["Roboto:Regular", "Roboto:Bold", "Roboto:Medium"],
  "imports": { "genLog": { "key": "a9653f30925367e96dea90093d750bfe70849571", "method": "single" } },
  "variables": { "...": "all variables needed for slides 1-4" },
  "tree": [
    { "type": "INSTANCE", "name": "Generation log", "ref": "genLog", "props": { "...": "..." } },
    { "type": "FRAME", "name": "Slide 1: Cover", "...": "..." },
    { "type": "FRAME", "name": "Slide 2: ...", "...": "..." },
    { "type": "FRAME", "name": "Slide 3: ...", "...": "..." },
    { "type": "FRAME", "name": "Slide 4: ...", "...": "..." }
  ]
}
```

### Subsequent calls -- append to existing wrapper

```json
{
  "meta": {
    "skill": "generate-presentation",
    "component": "Q1 Progress",
    "appendToId": "<wrapperId from call 1>"
  },
  "fonts": ["Roboto:Regular", "Roboto:Bold", "Roboto:Medium"],
  "imports": {},
  "variables": { "...": "variables for slides 5-8" },
  "tree": [
    { "type": "FRAME", "name": "Slide 5: ...", "...": "..." },
    { "type": "FRAME", "name": "Slide 6: ...", "...": "..." },
    { "type": "FRAME", "name": "Slide 7: ...", "...": "..." },
    { "type": "FRAME", "name": "Slide 8: ...", "...": "..." }
  ]
}
```

Each call can declare its own `fonts`, `imports`, `variables`, and `styles` -- they are loaded fresh per call. Only the wrapper frame persists.

---

## Wrapper Frame Layout

The interpreter creates a horizontal wrapper frame that holds the generation log and all slides. The wrapper uses:

```json
{
  "layout": { "mode": "HORIZONTAL", "spacing": 40, "padding": [0, 0, 0, 0] },
  "fills": []
}
```

Slides sit side by side with 40px gaps, matching the HTML preview layout.

---

## Complete Example -- 4-Slide Deck

A minimal deck: cover + 2 body slides + back cover.

```json
{
  "meta": {
    "skill": "generate-presentation",
    "component": "DS Adoption Update",
    "targetNodeId": "0:1",
    "wrapperName": "Presentation: DS Adoption Update"
  },
  "fonts": ["Roboto:Regular", "Roboto:Bold", "Roboto:Medium"],
  "imports": {
    "genLog": { "key": "a9653f30925367e96dea90093d750bfe70849571", "method": "single" }
  },
  "variables": {
    "brandPrimary": { "key": "a256595115f6048a1e1c843e3099a79a5c259288" },
    "bgDefault": { "key": "805afec875092b89deebe685e17992963d603974" },
    "bgGrey2": { "key": "2d7f893d1d1f5807dfc84b7b6e057eff8fd2ae31" },
    "textPrimary": { "key": "cb3cf6a8b661f3a2ff12835120957f3278d329d0" },
    "textSecondary": { "key": "54d9d36f7653380d99e9aadbad21e14f9dcdb295" },
    "textReverse": { "key": "d5b2b08fd5bab41595edb892bf4707cb94bae50a" },
    "borderDefault": { "key": "290c868621027b488cbc3b262619959bec52765f" },
    "cat1Strong": { "key": "a6da1a364e8613bd146667f77efa03ee7ea39305" },
    "cat2Strong": { "key": "c2c0376490a69426cedfdcb1ab2a6d531b626fdf" },
    "cat3Strong": { "key": "9997cab3913a4dfbcb8729e5a11bd21f14f16b86" }
  },
  "styles": {},
  "tree": [
    {
      "type": "INSTANCE",
      "name": "Generation log",
      "ref": "genLog",
      "props": {
        "Skill": "generate-presentation",
        "Prompt": "Create a presentation about DS adoption metrics for Q1",
        "Date": "2026-03-31T14:30:00Z",
        "Duration": "1m 42s",
        "Model": "claude-opus-4-6",
        "Plugin": "v1.18.1"
      }
    },
    {
      "type": "FRAME",
      "name": "Slide 1: Cover",
      "width": 1920,
      "height": 1080,
      "layout": { "mode": "NONE" },
      "clipsContent": true,
      "fills": [{
        "type": "LINEAR",
        "stops": [
          { "color": "#090952", "position": 0 },
          { "color": "#1414B8", "position": 1 }
        ],
        "angle": 80
      }],
      "children": [
        {
          "type": "TEXT",
          "name": "Topic",
          "content": "Design System 2026",
          "font": "Roboto:Medium",
          "size": 40,
          "color": "#FFFFFF",
          "variables": { "fills.0.color": "textReverse" }
        },
        {
          "type": "TEXT",
          "name": "Title",
          "content": "DS Adoption Update",
          "font": "Roboto:Medium",
          "size": 130,
          "color": "#FFFFFF",
          "width": 1760,
          "lineHeight": { "value": 102, "unit": "PERCENT" },
          "variables": { "fills.0.color": "textReverse" }
        },
        {
          "type": "TEXT",
          "name": "Subtitle",
          "content": "Q1 metrics, team impact, and next steps",
          "font": "Roboto:Regular",
          "size": 60,
          "color": "#FFFFFF",
          "opacity": 0.8,
          "width": 1760,
          "lineHeight": { "value": 102, "unit": "PERCENT" }
        },
        {
          "type": "TEXT",
          "name": "Date",
          "content": "March 2026",
          "font": "Roboto:Regular",
          "size": 32,
          "color": "#FFFFFF",
          "variables": { "fills.0.color": "textReverse" }
        },
        {
          "type": "TEXT",
          "name": "Creators",
          "content": "Design Systems Team",
          "font": "Roboto:Regular",
          "size": 32,
          "color": "#FFFFFF",
          "variables": { "fills.0.color": "textReverse" }
        }
      ]
    },
    {
      "type": "FRAME",
      "name": "Slide 2: Adoption grew 3x across all products",
      "width": 1920,
      "height": 1080,
      "layout": { "mode": "VERTICAL", "spacing": 24, "padding": [64, 80, 64, 80] },
      "clipsContent": true,
      "fills": ["#FFFFFF"],
      "variables": { "fills.0.color": "bgDefault" },
      "children": [
        {
          "type": "TEXT",
          "name": "Slide title",
          "content": "Adoption grew 3x across all products",
          "font": "Roboto:Regular",
          "size": 56,
          "color": "#12131F",
          "lineHeight": { "value": 103, "unit": "PERCENT" },
          "sizing": { "horizontal": "FILL", "vertical": "HUG" },
          "variables": { "fills.0.color": "textPrimary" }
        },
        {
          "type": "FRAME",
          "name": "Stat cards row",
          "layout": { "mode": "HORIZONTAL", "spacing": 24, "padding": [0, 0, 0, 0] },
          "sizing": { "horizontal": "FILL", "vertical": "HUG" },
          "fills": [],
          "children": [
            {
              "type": "FRAME",
              "name": "Stat card: Components",
              "layout": { "mode": "VERTICAL", "spacing": 4, "padding": [24, 24, 24, 24] },
              "sizing": { "horizontal": "FILL", "vertical": "HUG" },
              "fills": ["#FFFFFF"],
              "cornerRadius": 8,
              "stroke": { "color": "#F5F5FA", "weight": 1, "align": "INSIDE" },
              "variables": { "fills.0.color": "bgDefault", "strokes.0.color": "borderDefault" },
              "children": [
                { "type": "TEXT", "name": "Metric label", "content": "Components shipped", "font": "Roboto:Regular", "size": 14, "color": "#595968", "textCase": "UPPER" },
                { "type": "TEXT", "name": "Metric value", "content": "44", "font": "Roboto:Bold", "size": 56, "color": "#0550DC", "variables": { "fills.0.color": "brandPrimary" } },
                { "type": "TEXT", "name": "Metric context", "content": "+12 from last quarter", "font": "Roboto:Regular", "size": 16, "color": "#3F3F4A", "variables": { "fills.0.color": "textSecondary" } }
              ]
            },
            {
              "type": "FRAME",
              "name": "Stat card: Screens",
              "layout": { "mode": "VERTICAL", "spacing": 4, "padding": [24, 24, 24, 24] },
              "sizing": { "horizontal": "FILL", "vertical": "HUG" },
              "fills": ["#FFFFFF"],
              "cornerRadius": 8,
              "stroke": { "color": "#F5F5FA", "weight": 1, "align": "INSIDE" },
              "variables": { "fills.0.color": "bgDefault", "strokes.0.color": "borderDefault" },
              "children": [
                { "type": "TEXT", "name": "Metric label", "content": "Screens migrated", "font": "Roboto:Regular", "size": 14, "color": "#595968", "textCase": "UPPER" },
                { "type": "TEXT", "name": "Metric value", "content": "128", "font": "Roboto:Bold", "size": 56, "color": "#0550DC", "variables": { "fills.0.color": "brandPrimary" } },
                { "type": "TEXT", "name": "Metric context", "content": "78% of total", "font": "Roboto:Regular", "size": 16, "color": "#3F3F4A", "variables": { "fills.0.color": "textSecondary" } }
              ]
            },
            {
              "type": "FRAME",
              "name": "Stat card: Tokens",
              "layout": { "mode": "VERTICAL", "spacing": 4, "padding": [24, 24, 24, 24] },
              "sizing": { "horizontal": "FILL", "vertical": "HUG" },
              "fills": ["#FFFFFF"],
              "cornerRadius": 8,
              "stroke": { "color": "#F5F5FA", "weight": 1, "align": "INSIDE" },
              "variables": { "fills.0.color": "bgDefault", "strokes.0.color": "borderDefault" },
              "children": [
                { "type": "TEXT", "name": "Metric label", "content": "Token adoption", "font": "Roboto:Regular", "size": 14, "color": "#595968", "textCase": "UPPER" },
                { "type": "TEXT", "name": "Metric value", "content": "100%", "font": "Roboto:Bold", "size": 56, "color": "#0550DC", "variables": { "fills.0.color": "brandPrimary" } },
                { "type": "TEXT", "name": "Metric context", "content": "Zero hardcoded values", "font": "Roboto:Regular", "size": 16, "color": "#3F3F4A", "variables": { "fills.0.color": "textSecondary" } }
              ]
            }
          ]
        },
        {
          "type": "FRAME",
          "name": "Bar chart: Adoption by product",
          "layout": { "mode": "VERTICAL", "spacing": 8, "padding": [24, 24, 24, 24] },
          "sizing": { "horizontal": "FILL", "vertical": "FILL" },
          "fills": ["#F5F5FA"],
          "cornerRadius": 4,
          "variables": { "fills.0.color": "bgGrey2" },
          "children": [
            {
              "type": "TEXT",
              "name": "Chart title",
              "content": "Component adoption by product",
              "font": "Roboto:Medium",
              "size": 16,
              "color": "#12131F",
              "sizing": { "horizontal": "FILL", "vertical": "HUG" }
            },
            {
              "type": "FRAME",
              "name": "Bar row: Studio",
              "layout": { "mode": "HORIZONTAL", "spacing": 12, "padding": [4, 0, 4, 0], "counterAxisAlign": "CENTER" },
              "sizing": { "horizontal": "FILL", "vertical": "HUG" },
              "fills": [],
              "children": [
                { "type": "TEXT", "name": "Label", "content": "Studio", "font": "Roboto:Regular", "size": 14, "color": "#12131F", "sizing": { "horizontal": 120, "vertical": "HUG" } },
                { "type": "RECT", "name": "Bar", "width": 700, "height": 24, "fills": ["#4A6470"], "cornerRadius": 2, "variables": { "fills.0.color": "cat1Strong" } },
                { "type": "TEXT", "name": "Value", "content": "87%", "font": "Roboto:Medium", "size": 14, "color": "#12131F" }
              ]
            },
            {
              "type": "FRAME",
              "name": "Bar row: Explorer",
              "layout": { "mode": "HORIZONTAL", "spacing": 12, "padding": [4, 0, 4, 0], "counterAxisAlign": "CENTER" },
              "sizing": { "horizontal": "FILL", "vertical": "HUG" },
              "fills": [],
              "children": [
                { "type": "TEXT", "name": "Label", "content": "Explorer", "font": "Roboto:Regular", "size": 14, "color": "#12131F", "sizing": { "horizontal": 120, "vertical": "HUG" } },
                { "type": "RECT", "name": "Bar", "width": 580, "height": 24, "fills": ["#00699F"], "cornerRadius": 2, "variables": { "fills.0.color": "cat2Strong" } },
                { "type": "TEXT", "name": "Value", "content": "72%", "font": "Roboto:Medium", "size": 14, "color": "#12131F" }
              ]
            },
            {
              "type": "FRAME",
              "name": "Bar row: Platform",
              "layout": { "mode": "HORIZONTAL", "spacing": 12, "padding": [4, 0, 4, 0], "counterAxisAlign": "CENTER" },
              "sizing": { "horizontal": "FILL", "vertical": "HUG" },
              "fills": [],
              "children": [
                { "type": "TEXT", "name": "Label", "content": "Platform", "font": "Roboto:Regular", "size": 14, "color": "#12131F", "sizing": { "horizontal": 120, "vertical": "HUG" } },
                { "type": "RECT", "name": "Bar", "width": 500, "height": 24, "fills": ["#007E7B"], "cornerRadius": 2, "variables": { "fills.0.color": "cat3Strong" } },
                { "type": "TEXT", "name": "Value", "content": "62%", "font": "Roboto:Medium", "size": 14, "color": "#12131F" }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "FRAME",
      "name": "Slide 3: Teams reduced handoff time by 40%",
      "width": 1920,
      "height": 1080,
      "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [64, 80, 64, 80] },
      "clipsContent": true,
      "fills": ["#FFFFFF"],
      "variables": { "fills.0.color": "bgDefault" },
      "children": [
        {
          "type": "TEXT",
          "name": "Slide title",
          "content": "Teams reduced handoff time by 40%",
          "font": "Roboto:Regular",
          "size": 56,
          "color": "#12131F",
          "lineHeight": { "value": 103, "unit": "PERCENT" },
          "sizing": { "horizontal": "FILL", "vertical": "HUG" },
          "variables": { "fills.0.color": "textPrimary" }
        },
        {
          "type": "FRAME",
          "name": "Content columns",
          "layout": { "mode": "HORIZONTAL", "spacing": 56, "padding": [24, 0, 0, 0] },
          "sizing": { "horizontal": "FILL", "vertical": "FILL" },
          "fills": [],
          "children": [
            {
              "type": "FRAME",
              "name": "Text column",
              "layout": { "mode": "VERTICAL", "spacing": 16, "padding": [0, 0, 0, 0] },
              "sizing": { "horizontal": 549, "vertical": "FILL" },
              "fills": [],
              "children": [
                {
                  "type": "TEXT",
                  "name": "Body",
                  "content": "The biggest efficiency gains came from standardized form components and data tables. Teams no longer spend time debating spacing, states, or token mappings.\n\nKey wins:\n- Form inputs: 480px max-width standard eliminated layout debates\n- Data tables: consistent row heights and cell padding\n- Action footers: sticky bottom with 1600px max-width",
                  "font": "Roboto:Regular",
                  "size": 24,
                  "color": "#12131F",
                  "width": 549,
                  "lineHeight": { "value": 150, "unit": "PERCENT" },
                  "variables": { "fills.0.color": "textPrimary" }
                }
              ]
            },
            {
              "type": "FRAME",
              "name": "Visual area",
              "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [24, 24, 24, 24], "primaryAxisAlign": "CENTER", "counterAxisAlign": "CENTER" },
              "sizing": { "horizontal": "FILL", "vertical": "FILL" },
              "fills": ["#F5F5FA"],
              "cornerRadius": 4,
              "variables": { "fills.0.color": "bgGrey2" },
              "children": [
                { "type": "TEXT", "name": "Visual placeholder", "content": "Screenshot: Before/after handoff workflow", "font": "Roboto:Regular", "size": 18, "color": "#717D96" }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "FRAME",
      "name": "Slide 4: Back cover",
      "width": 1920,
      "height": 1080,
      "layout": { "mode": "NONE" },
      "clipsContent": true,
      "fills": [{
        "type": "LINEAR",
        "stops": [
          { "color": "#090952", "position": 0 },
          { "color": "#1414B8", "position": 1 }
        ],
        "angle": 80
      }],
      "children": [
        {
          "type": "TEXT",
          "name": "Closing text",
          "content": "Thank you",
          "font": "Roboto:Medium",
          "size": 152,
          "color": "#FFFFFF",
          "width": 1760,
          "lineHeight": { "value": 102, "unit": "PERCENT" },
          "variables": { "fills.0.color": "textReverse" }
        }
      ]
    }
  ]
}
```

---

## Property Format Summary

Quick reference for property formats that must match the interpreter exactly. See `../../references/figma-spec-schema.md` for the complete schema.

| Property | Format | Example |
|----------|--------|---------|
| `sizing` | `{ horizontal, vertical }` -- `"FILL"`, `"HUG"`, or number (px) | `{ "horizontal": "FILL", "vertical": "HUG" }` |
| `layout` | `{ mode, spacing, padding: [t,r,b,l] }` | `{ "mode": "VERTICAL", "spacing": 16, "padding": [64, 80, 64, 80] }` |
| `fills` (solid) | Array of hex strings | `["#FFFFFF"]` |
| `fills` (gradient) | Array of gradient objects | `[{ "type": "LINEAR", "stops": [...], "angle": 80 }]` |
| `fills` (transparent) | Empty array | `[]` |
| `stroke` | Object with color, weight, align, sides | `{ "color": "#E0E0E0", "weight": 1, "align": "INSIDE" }` |
| `cornerRadius` | Number (uniform) or object (per-corner) | `8` or `{ "topLeft": 8, ... }` |
| `lineHeight` | Number (px), `"AUTO"`, or `{ value, unit }` | `{ "value": 130, "unit": "PERCENT" }` |
| `opacity` | Number 0-1 | `0.8` |
| `width` / `height` | Number (px) -- fixed dimensions on the FRAME itself | `1920` |
| `variables` | Object mapping field paths to variable ref names | `{ "fills.0.color": "bgDefault" }` |

### Common mistakes

- `fills` as a string instead of array -- always `["#FFFFFF"]` not `"#FFFFFF"`
- `padding` as an object -- always `[top, right, bottom, left]` array
- Missing font in `fonts` array -- list every `"Family:Style"` used anywhere in the spec
- Gradient `type` using Figma constants -- use `"LINEAR"` not `"GRADIENT_LINEAR"`
- Colors in 0-1 range -- always use hex strings, the interpreter converts internally
