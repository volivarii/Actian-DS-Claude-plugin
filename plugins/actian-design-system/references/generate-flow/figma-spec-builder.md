# Generate Flow — Figma Spec Builder

The `flow-to-spec.js` script builds the Figma spec. The AI provides creative content per screen. The script handles all chrome (App Header, Sidebar, Content Area) deterministically.

## How it works

1. AI writes `flow-data.json` with meta + screens (content only)
2. Script runs: `node ${CLAUDE_PLUGIN_ROOT}/scripts/flow-to-spec.js flow-data.json --target-node-id "<id>"`
3. Script outputs array of figma-spec.json objects (auto-split under 33KB per call)
4. AI reads interpreter + assembles use_figma calls from output

## Input schema (what the AI provides)

```json
{
  "meta": {
    "feature": "Glossary Term Management",
    "flow": "Happy path: Create new term",
    "user": "Data Steward",
    "app": "Studio",
    "targetNodeId": "123:456",
    "prompt": "Create a flow for managing glossary terms",
    "duration": "2m 15s"
  },
  "screens": [
    {
      "name": "Screen 1: Glossary List",
      "chrome": "standard",
      "size": "standard",
      "activeNavItem": "Glossary",
      "navItems": 4,
      "pageHeader": { "title": "Glossary Terms", "actions": ["Create Term"] },
      "content": [ ...spec nodes... ]
    }
  ]
}
```

### meta (required)

| Field | Required | Description |
|-------|----------|-------------|
| `feature` | Yes | Feature name — used for cover card and wrapper name |
| `flow` | No | Flow description for cover card |
| `user` | No | User role for cover card |
| `app` | Yes | `Studio`, `Explorer`, `Administration`, or `Actian` — sets App Header variant |
| `targetNodeId` | Yes | Figma node ID (can also pass via `--target-node-id` CLI flag) |
| `prompt` | No | Original prompt for Generation Log |
| `duration` | No | Generation duration for Generation Log |

### screen (per screen)

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `name` | Yes | — | Screen name (e.g., "Screen 1: Dashboard") |
| `chrome` | No | `standard` | `standard` (header + sidebar + content), `no-sidebar` (header + content), `none` (full screen) |
| `size` | No | `standard` | `standard` (1440×960) or `compact` (1440×700) |
| `activeNavItem` | No | `Home` | Label for the active sidebar nav item (chrome: standard only) |
| `navItems` | No | `4` | Number of sidebar nav items (1 active + rest placeholder) |
| `pageHeader` | No | — | `{ title, subtitle?, actions[]? }` — script builds fmPageHeader instance |
| `content` | Yes | — | Array of spec nodes (FRAME, TEXT, INSTANCE, DIVIDER) — the creative content |

### Chrome modes

```
standard     → App Header + Sidebar (260px) + Content Area (1180×890)
no-sidebar   → App Header + Content Area (1440×890)
none         → Full screen (1440×960), no header, no sidebar
```

Screens in one flow can mix chrome modes.

## Content nodes (what goes in `content[]`)

The AI has full creative freedom inside content. Valid node types:

### FRAME
```json
{ "type": "FRAME", "name": "Metrics Row", "layout": { "mode": "HORIZONTAL", "spacing": 16 },
  "fills": ["#FFFFFF"], "cornerRadius": 8, "sizing": { "horizontal": "FILL", "vertical": "HUG" },
  "children": [...] }
```

### TEXT
```json
{ "type": "TEXT", "content": "Dashboard", "font": "Inter:Semi Bold", "size": 20,
  "color": "#1A1D23", "width": 400 }
```

### INSTANCE (FM component)
```json
{ "type": "INSTANCE", "ref": "fmButton",
  "variant": "Type=Primary, Size=md, Shape=Regular, State=Default",
  "name": "Button: Create", "props": { "Label": "Create Term" } }
```

Use `ref` names from the FM component table below. The script auto-resolves import keys.

### DIVIDER
```json
{ "type": "DIVIDER" }
```

### Property formats

- **sizing**: `{ "horizontal": "FILL"|"HUG"|number, "vertical": "FILL"|"HUG"|number }`
- **layout**: `{ "mode": "VERTICAL"|"HORIZONTAL", "spacing": 16, "padding": [t,r,b,l] }`
- **fills**: `["#FFFFFF"]` or `[]` (transparent)
- **stroke**: `{ "color": "#E0E0E0", "weight": 1, "align": "INSIDE" }`
- **cornerRadius**: `8` or `{ "topLeft": 8, "topRight": 8, "bottomRight": 0, "bottomLeft": 0 }`

## FM component ref names

| Ref | Component | Common variants |
|-----|-----------|----------------|
| `fmButton` | Button | `Type=Primary\|Secondary\|Outline\|Destructive, Size=md\|sm` |
| `fmTextInput` | Text input | `Type=Empty\|Placeholder\|Default\|Disabled` |
| `fmDropdown` | Dropdown | `Type=Placeholder\|Open\|Filled\|Disabled` |
| `fmInputLabel` | Input label | `Disabled=No\|Yes, Type=Text\|Placeholder` |
| `fmSearchInput` | Search input | `Type=Empty\|Placeholder\|Filled` |
| `fmTextArea` | Text area | `Content=None\|Placeholder\|Filled` |
| `fmDateInput` | Date input | `State=Default\|Open\|Placeholder` |
| `fmTableCell` | Table cell | `Type=Header\|Text\|Pill\|Placeholder` |
| `fmTab` | Tab | `State=On\|Off\|Placeholder` |
| `fmTag` | Tag | `Style=Filled\|Outline\|Light` |
| `fmChip` | Chip | `Outline=False\|True` |
| `fmCheckbox` | Checkbox | `State=Off\|On, Style=Default\|Disabled` |
| `fmRadioButton` | Radio button | `State=On\|Off, Style=Default\|Disabled` |
| `fmToggle` | Toggle | `State=Off\|On, Style=Default\|Disabled` |
| `fmAlert` | Alert | `Type=Success\|Error\|Warning` |
| `fmBanner` | Banner | (single component) |
| `fmDialog` | Dialog | (single component) |
| `fmEmptyState` | Empty state | `Type=Default\|Compact` |
| `fmPlaceholder` | Placeholder | `Type=Label+1line\|Label+3lines\|Label+6lines\|Label+avatars\|metric` |
| `fmBadge` | Badge | `Size=Small\|Medium\|Large, Type=Icon\|Number` |
| `fmStepper` | Stepper | `State=Active\|Complete\|Upcoming` |
| `fmToast` | Toast | `Style=Standard\|Outline` |
| `fmIconButtons` | Icon buttons | `Type=Primary\|Secondary\|Outline, State=Default\|Disabled` |
| `fmSpinner` | Spinner | (single component) |
| `fmProgressBar` | Progress bar | `Completion=10%\|20%\|...\|100%` |

Set ALL text properties on every instance. Never leave FM defaults like "Label", "Caption", "Text":
```json
{ "type": "INSTANCE", "ref": "fmButton", "variant": "Type=Primary, Size=md, Shape=Regular, State=Default",
  "props": { "Label": "Create Term" } }
```

---

## Feature focus rules

FM flows spotlight the feature. Everything unrelated uses placeholder treatment.

- **Sidebar**: 1 active item (`activeNavItem`) + placeholder items (handled by script)
- **Tables**: `fmTableCell` with `Type=Text` for feature rows, `Type=Placeholder` for others, `Type=Header` for headers
- **Tabs**: `fmTab` with `State=On` for active, `State=Placeholder` for others
- **Content**: real FM components for feature sections, `fmPlaceholder` for non-feature areas
- **Forms**: correct variant for feature inputs (`Type=Placeholder`/`Type=Default`), `fmPlaceholder` for non-feature
- **Text**: all contextual — "Schedule Refresh" not "Submit", "Glossary Terms" not "Items"
