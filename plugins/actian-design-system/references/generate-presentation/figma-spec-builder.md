# Generate Presentation — Figma Spec Builder

The `slide-to-spec.js` script builds the Figma spec. The AI provides slide type + title + content per slide. The script handles slide frames, gradients, variable bindings, and positioning.

## How it works

1. AI writes `slide-data.json` with meta + slides
2. Script runs: `node ${CLAUDE_PLUGIN_ROOT}/scripts/slide-to-spec.js slide-data.json --target-node-id "<id>"`
3. Script outputs array of figma-spec.json objects (auto-split under 12KB, variables included)
4. AI reads interpreter + assembles use_figma calls from output

## Input schema

```json
{
  "meta": {
    "title": "Q1 Design System Progress",
    "targetNodeId": "0:1",
    "prompt": "Create a presentation about DS adoption",
    "duration": "1m 42s"
  },
  "slides": [
    { "type": "cover", "name": "Slide 1: Cover", "topic": "Design System", "title": "Q1 Progress", "subtitle": "Coverage and roadmap", "date": "March 2026", "creators": "DS Team" },
    { "type": "body-full", "name": "Slide 2: Adoption", "title": "Adoption grew 3x", "content": [...] },
    { "type": "body-text-visual", "name": "Slide 3: Handoff", "title": "Handoff time -40%", "body": "Text...", "visualContent": [...] },
    { "type": "section", "name": "Slide 4: Roadmap", "topic": "Next Steps", "title": "Roadmap" },
    { "type": "back-cover", "name": "Slide 5: Back", "title": "Thank you" }
  ]
}
```

### meta

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Deck title — used for wrapper name and cover card |
| `targetNodeId` | Yes | Figma node ID |
| `prompt` | No | Original prompt for Generation Log |
| `duration` | No | Generation duration |

### Slide types

| Type | Fields | What the script builds |
|------|--------|----------------------|
| `cover` | `topic`, `title`, `subtitle`, `date`, `creators` | Dark gradient (1920×1080), absolute-positioned text |
| `section` | `topic`, `title` | Light gradient, centered topic + title |
| `body-full` | `title`, `content[]` | White slide, title + grey content area wrapping AI content |
| `body-text-visual` | `title`, `body` or `textContent[]`, `visualContent[]` | Two-column: text left (549px), visual right (fill) |
| `back-cover` | `title` | Dark gradient, large closing text |

All slides are 1920×1080. Script handles dimensions, gradients, variable bindings, and fonts (Roboto).

### Content nodes (for body-full and body-text-visual)

Same spec node types as generate-flow:

- **FRAME**: `{ "type": "FRAME", "name": "...", "layout": {...}, "fills": [...], "children": [...] }`
- **TEXT**: `{ "type": "TEXT", "content": "...", "font": "Roboto:Bold", "size": 56, "color": "#12131F" }`
- **RECT**: `{ "type": "RECT", "width": 600, "height": 24, "fills": ["#4A6470"], "cornerRadius": 2 }`
- **DIVIDER**: `{ "type": "DIVIDER" }`

### Variable binding (theme-aware colors)

Content nodes can bind to DS Kit variables for theme support:

```json
{
  "type": "TEXT", "content": "44", "font": "Roboto:Bold", "size": 56,
  "color": "#0550DC",
  "variables": { "fills.0.color": "brandPrimary" }
}
```

Available variable ref names:

| Ref | Purpose | Fallback hex |
|-----|---------|-------------|
| `brandPrimary` | Accent, stat values | #0550DC |
| `bgDefault` | Body slide background | #FFFFFF |
| `bgGrey2` | Content areas, section dividers | #F5F5FA |
| `textPrimary` | Headings | #000000 |
| `textSecondary` | Body text, subtitles | #3F3F4A |
| `textReverse` | Cover/back cover text | #FFFFFF |
| `borderDefault` | Card borders | #F5F5FA |
| `cat1Strong` — `cat5Strong` | Chart category colors | #4A6470, #00699F, #007E7B, #7900CB, #C4004C |

Always provide both hex fallback and variable binding.

---

## Chart patterns

Build charts from spec primitives. The script wraps body-full content in a grey content area automatically.

### Bar chart row
```json
{ "type": "FRAME", "name": "Bar row: Studio",
  "layout": { "mode": "HORIZONTAL", "spacing": 12, "counterAxisAlign": "CENTER" },
  "sizing": { "horizontal": "FILL", "vertical": "HUG" }, "fills": [],
  "children": [
    { "type": "TEXT", "content": "Studio", "font": "Roboto:Regular", "size": 14, "color": "#12131F", "sizing": { "horizontal": 120, "vertical": "HUG" } },
    { "type": "RECT", "name": "Bar", "width": 700, "height": 24, "fills": ["#4A6470"], "cornerRadius": 2, "variables": { "fills.0.color": "cat1Strong" } },
    { "type": "TEXT", "content": "87%", "font": "Roboto:Medium", "size": 14, "color": "#12131F" }
  ] }
```

### Stat card
```json
{ "type": "FRAME", "name": "Stat: Components",
  "layout": { "mode": "VERTICAL", "spacing": 4, "padding": [24,24,24,24] },
  "sizing": { "horizontal": "FILL", "vertical": "HUG" },
  "fills": ["#FFFFFF"], "cornerRadius": 8,
  "stroke": { "color": "#F5F5FA", "weight": 1, "align": "INSIDE" },
  "variables": { "fills.0.color": "bgDefault", "strokes.0.color": "borderDefault" },
  "children": [
    { "type": "TEXT", "content": "Components shipped", "font": "Roboto:Regular", "size": 14, "color": "#595968", "textCase": "UPPER" },
    { "type": "TEXT", "content": "44", "font": "Roboto:Bold", "size": 56, "color": "#0550DC", "variables": { "fills.0.color": "brandPrimary" } },
    { "type": "TEXT", "content": "+12 from Q4", "font": "Roboto:Regular", "size": 16, "color": "#3F3F4A", "variables": { "fills.0.color": "textSecondary" } }
  ] }
```

### Data table row
```json
{ "type": "FRAME", "name": "Data row",
  "layout": { "mode": "HORIZONTAL", "spacing": 0, "padding": [10,12,10,12] },
  "sizing": { "horizontal": "FILL", "vertical": "HUG" },
  "fills": ["#FFFFFF"],
  "stroke": { "color": "#F5F5FA", "weight": 1, "align": "INSIDE", "sides": { "top": false, "bottom": true, "left": false, "right": false } },
  "children": [
    { "type": "TEXT", "content": "Button", "font": "Roboto:Regular", "size": 14, "color": "#12131F", "sizing": { "horizontal": "FILL", "vertical": "HUG" } },
    { "type": "TEXT", "content": "Complete", "font": "Roboto:Regular", "size": 14, "color": "#047800", "sizing": { "horizontal": 120, "vertical": "HUG" } }
  ] }
```

### Property formats

- **sizing**: `{ "horizontal": "FILL"|"HUG"|number, "vertical": "FILL"|"HUG"|number }`
- **layout**: `{ "mode": "VERTICAL"|"HORIZONTAL", "spacing": 16, "padding": [t,r,b,l] }`
- **fills**: `["#FFFFFF"]` or `[]` or `[{ "type": "LINEAR", "stops": [...], "angle": 80 }]`
- **stroke**: `{ "color": "#E0E0E0", "weight": 1, "align": "INSIDE" }`
- **variables**: `{ "fills.0.color": "refName" }` — always pair with hex fallback
