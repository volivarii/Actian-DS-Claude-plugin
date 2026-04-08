# Generate Flow — Figma Spec Builder

The `flow-to-figma.js` script builds Figma plugin code from flow-data.json. The AI provides creative content per screen and picks a template. The script handles chrome, auto-layout, and code generation.

## How it works

1. AI writes `flow-data.json` with meta + screens (template + content per screen)
2. Script runs with `--output-dir` to write each call as a separate file:
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/flow-to-figma.js flow-data.json \
     --target-node-id "<id>" \
     --output-dir {project_working_directory}/components/flows/.figma-calls
   ```
3. Script writes `manifest.json` + `call-N.js` files to the output directory
4. AI reads `manifest.json`, then reads each `call-N.js` file and passes it to `use_figma`
   - Each call is self-contained (interpreter runtime + JSON spec)
   - Wrapper ID auto-discovered via `setSharedPluginData` — no replacement needed

Legacy mode (without `--output-dir`): outputs JSON array to stdout. Use `--output-dir` for better handling of large calls.

## Templates

Each screen picks a template. The script builds chrome from the template; the AI provides `content[]`.

| Template | Size | Chrome | Use for |
|----------|------|--------|---------|
| `admin` | 1440x960 | Admin header + sidebar + content area | Administration app screens |
| `studio` | 1440x960 | Studio header + sidebar + content area | Studio app screens |
| `explorer` | 1440x960 | Explorer header + sidebar + content area | Explorer app screens |
| `no-sidebar` | 1440x960 | Header + full-width content | Settings, dashboards without nav |
| `bare` | 1440x960 | None — AI controls entire frame | Custom layouts |
| `mobile` | 390x844 | None | Mobile screens |
| `tablet` | 1024x768 | None | Tablet screens |
| `compact` | 1440x700 | None | Modals, overlays, panels |
| `custom` | AI specifies | None | Any custom size (set `width`+`height` on screen) |

Templates can be mixed within one flow. Screen 1 can be `admin`, Screen 2 can be `mobile`.

**Backward compatibility:** `chrome: "standard"` maps to the template matching `meta.app` (Administration→admin, Studio→studio, Explorer→explorer). `chrome: "no-sidebar"` → `no-sidebar`. `chrome: "none"` → `bare`.

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
      "template": "studio",
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
| `research` | No | Research findings object — if present, a Research Frame card is pushed before the cover card |
| `research.title` | No | Research card title (default: "UX Research") |
| `research.source` | No | Source attribution (e.g., "Competitor analysis — Okta, Datadog, Linear") |
| `research.competitors` | No | How competitors handle this — bullet points |
| `research.patterns` | No | Key patterns adopted — bullet points |
| `research.recommendation` | No | Summary recommendation paragraph |
| `research.sources` | No | Source list — URLs or product names |

### screen (per screen)

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `name` | Yes | — | Screen name (e.g., "Screen 1: Dashboard") |
| `template` | No | inferred from `meta.app` | Template name from table above. Controls chrome, size, layout. |
| `activeNavItem` | No | `Home` | Label for the active sidebar nav item (chrome templates only) |
| `navItems` | No | `4` | Number of sidebar nav items (1 active + rest placeholder, chrome templates only) |
| `pageHeader` | No | — | `{ title, subtitle?, actions[]? }` — script builds fmPageHeader instance (chrome templates only) |
| `contentSpacing` | No | `16` | Vertical spacing (px) between content items in Content Area. Use 0 for custom spacing, 24 for spacious layouts. |
| `content` | Yes | — | Array of spec nodes (FRAME, TEXT, INSTANCE, DIVIDER) — the creative content |
| `width` | No | from template | Override width (for `custom` template) |
| `height` | No | from template | Override height (for `custom` template) |

### Chrome behavior

```
admin/studio/explorer → App Header + Sidebar (260px) + Content Area (padded)
no-sidebar            → App Header + Content Area (full width, padded)
bare/mobile/tablet/compact/custom → No chrome — AI controls entire frame
```

Screens in one flow can mix templates. Screen 1 can be `admin`, Screen 2 can be `mobile`.

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
  - Use `"primaryAxisAlignItems": "SPACE_BETWEEN"` to push children apart (e.g., label left + badge right)
  - **Never use Spacer frames** — use `SPACE_BETWEEN` or `sizing: { horizontal: "FILL" }` on the expanding child instead
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

**Set ALL properties on every instance** — text, boolean, and nested properties. Never leave defaults like "Label", "Button", "Caption Text". Check `docs/fmkit.json` for each component's `properties` (with exact hash-suffixed names).

**Button example** — hide icons, set label:
```json
{ "type": "INSTANCE", "ref": "fmButton", "variant": "Type=Primary, Size=md, Shape=Regular, State=Default",
  "props": { "Label": "Save changes", "👁 Leading Icon": false, "👁 Trailing Icon": false } }
```

**Form input example** — text input with nested label properties (do NOT add a separate fmInputLabel):
```json
{ "type": "INSTANCE", "ref": "fmTextInput", "variant": "Type=Default",
  "name": "Input: Platform name",
  "props": { "Input Text": "Actian Data Intelligence", "Label Text": "Platform name", "Caption Text": "Displayed in the header across all applications", "Show label": true, "Caption": true, "Required": false } }
```

**Dropdown example** — same pattern, nested label props on parent:
```json
{ "type": "INSTANCE", "ref": "fmDropdown", "variant": "Type=Filled",
  "name": "Dropdown: Language",
  "props": { "Dropdown Text": "English (US)", "Label Text": "Language", "Caption Text": "Default language for the platform", "Show label": true } }
```

**Rules:**
- **Never create a separate `fmInputLabel`** next to an input that already contains one (fmTextInput, fmDropdown, fmSearchInput, fmTextArea all have nested labels)
- **Always hide button icons** by default (`"👁 Leading Icon": false, "👁 Trailing Icon": false`)
- **Set boolean properties** for visibility: `"Show label"`, `"Caption"`, `"Required"`, `"Disabled"`, `"Show Icon"`, `"Chevron"` — check the registry for each component

---

## Feature focus rules

FM flows spotlight the feature. Everything unrelated uses placeholder treatment.

- **Sidebar**: 1 active item (`activeNavItem`) + placeholder items (handled by script)
- **Tables**: `fmTableCell` with `Type=Text` for feature rows, `Type=Placeholder` for others, `Type=Header` for headers
- **Tabs**: `fmTab` with `State=On` for active, `State=Placeholder` for others
- **Content**: real FM components for feature sections, `fmPlaceholder` for non-feature areas
- **Forms**: correct variant for feature inputs (`Type=Placeholder`/`Type=Default`), `fmPlaceholder` for non-feature
- **Text**: all contextual — "Schedule Refresh" not "Submit", "Glossary Terms" not "Items"
- **De-emphasized content**: when content is visible but secondary (behind panels, modals, dialogs, in inactive tabs, split views), use realistic content at reduced `opacity` — don't replace with `fmPlaceholder`. The real content gives context for what's underneath.
