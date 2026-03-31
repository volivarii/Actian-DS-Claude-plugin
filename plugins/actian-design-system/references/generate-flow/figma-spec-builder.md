# Generate Flow — Figma Spec Builder

Transforms a screen list into a `figma-spec.json` for the JSON Spec Interpreter. This is the only reference the AI needs to produce Figma output for generate-flow.

## Purpose

The AI receives a screen list (from Step 3) and produces a `figma-spec.json` file. The fixed interpreter (`../../scripts/figma-interpreter.js`) reads this JSON and builds the Figma tree mechanically. The AI never writes Plugin API code.

## Rule

**AI produces JSON, never Plugin API code.** The interpreter handles all Figma API calls, font loading, variable binding, component importing, and auto-layout setup. The AI's job is to assemble a correct, complete spec that the interpreter can execute.

---

## Imports section

Every flow spec needs these three Meta Kit imports:

```json
{
  "flowScreen": { "key": "2ca7c756ad54e81219104d3a270ba8eb9eeffcf6", "method": "set" },
  "genLog":     { "key": "a9653f30925367e96dea90093d750bfe70849571", "method": "single" },
  "divider":    { "key": "f4d778e1cf9bb61a33712c791486f54bb1c095b7", "method": "single" }
}
```

Plus FM components as needed per screen. Add only what the screens actually use:

| Ref name | Registry key | Key | Method |
|----------|-------------|-----|--------|
| `fmAppHeader` | fm-app_header | `8fc9bcee610c7f8d22ebcc268467993f6dc99c87` | `set` |
| `fmButton` | fm-button | `368b62312ca941c80ea8eeed84a57d33bb470b09` | `set` |
| `fmTextInput` | fm-text-input-field | `355855c7b2e05b5b336167883b3c9ebbfbd881ad` | `set` |
| `fmDropdown` | fm-dropdown | `781f86dca2a37706771f3e2e580242d2693a722f` | `set` |
| `fmInputLabel` | fm-input-label | `a39aa1c7cb593f7d26b7659e4cbe4e419e00c766` | `set` |
| `fmSideNavBar` | fm-side-navigation-bar | `1e8673ccc2818b68f9faabb99757bfd44af2b592` | `set` |
| `fmSideNavItem` | fm-side-navigation-item | `d18a0a772ed4acd760c497cb93de796ff052a7b4` | `set` |
| `fmPageHeader` | fm-page-header | `ae1f8684a4a89aa74463d439e4e8c1e7a48137fe` | `set` |
| `fmTableCell` | fm-table-cell | `9267fecfadc4577563deb1425fa598d1f5af9144` | `set` |
| `fmCheckbox` | fm-checkbox | `965cf2c85659bbde891f6f086bbd02d50d445d58` | `set` |
| `fmRadioButton` | fm-radio-button | `1569353eb82fd5f6cb8da979f1048cd1b323e8c4` | `set` |
| `fmToggle` | fm-toggle | `fe9e82118d1df75a8aea732eb7f9169ccaa21878` | `set` |
| `fmSearchInput` | fm-search-input-field | `443e232d5454f06dbd5bc06c2cacf21e80a20e4a` | `set` |
| `fmDateInput` | fm-date-input | `69d6329ea2d5ac3515b6ebb04ad6c1bd72e4890e` | `set` |
| `fmTextArea` | fm-text-area | `bba14eea66edb3871ea389afeb4e1a07585e5733` | `set` |
| `fmAlert` | fm-alert | `fe30f37740688350762bd2b1be426d9d1588b7d9` | `set` |
| `fmDialog` | fm-dialog | `0cc53eca9c90cccb8cbc57864ea110378414fd2b` | `single` |
| `fmBanner` | fm-banner | `d7f323e492b456a2c56f81f3dc892eb24de11a6e` | `single` |
| `fmStepper` | fm-stepper | `d0a21b5288571cc7690c6c9289d18cd298035c53` | `set` |
| `fmBadge` | fm-badge | `2410b87c83d33d3bcb2a6ac7aa2168a53a4eb3d8` | `set` |
| `fmTag` | fm-tag | `c7239d9355ddf557f36f4d159153619672ab81ef` | `set` |
| `fmChip` | fm-chip | `0861d937682e66d39f57fe52ca83d526e634ff66` | `set` |
| `fmTab` | fm-tab | `cfbd732ff4f4e6620b333c60f1ac7fe5116a93aa` | `set` |
| `fmTabs` | fm-tabs | `860eadef9ba29cf20a3da3ca9d014718e3f6cabb` | `single` |
| `fmToast` | fm-toast | `6140b137ce98ebfeeb7fc7e426f6d09de1cc18d0` | `set` |
| `fmEmptyState` | fm-empty-state | `cf44b9c0b5623a394d90f320f98250dc77378268` | `set` |
| `fmPlaceholder` | fm-placeholder | `e49a9de0573cf527736e8173f722f230fa957fb8` | `set` |
| `fmIconButtons` | fm-icon-buttons | `f868aabb0aa2c52f00610c09da8dce3bccc79dc4` | `set` |
| `fmSpinner` | fm-spinner | `52927648847b15a51d314cf06ca1c0f19f398b4d` | `single` |
| `fmMultiSelectDropdown` | fm-multi-select-dropdown | `876bfa32334594915085ebea82f1f887b3fecb09` | `set` |
| `fmProgressBar` | fm-progress-bar | `12abe66d36a63ef385a17e2553a1312560a0f106` | `set` |
| `flowCoverCard` | flow-cover-card | `eaebde6bd07d2f19f3f9c00a9587240cb085a90d` | `single` |

Use `method: "set"` for component sets (have variants), `method: "single"` for standalone components.

Full registry: `../../docs/fm-components-registry.json` (FM Kit), `../../docs/meta-kit/meta-kit-registry.json` (Meta Kit).

---

## Top-level spec structure

```json
{
  "meta": {
    "skill": "generate-flow",
    "targetNodeId": "<PAGE_OR_SECTION_ID>",
    "wrapperName": "generate-flow: Feature Name"
  },
  "fonts": ["Inter:Regular", "Inter:Medium", "Inter:Semi Bold", "Inter:Bold"],
  "imports": { ... },
  "tree": [ ... ]
}
```

- `meta.targetNodeId` -- the Figma page or section ID where the flow lands
- `meta.appendToId` -- (optional) existing wrapper frame ID for appending screens in split calls
- `meta.wrapperName` -- displayed as the top-level frame name in Figma
- `fonts` -- every font family:style pair used by TEXT nodes (the interpreter loads these before building)
- `tree` -- array of top-level children appended to the wrapper frame

The interpreter creates the wrapper frame automatically: `HORIZONTAL`, `itemSpacing: 32`, `fills: []` (transparent).

---

## Screen structure mapping

### Flow wrapper (auto-created by interpreter)

The interpreter builds this from `meta`:

- FRAME horizontal, spacing 32, fills [] (transparent)
- All `tree` items are appended as direct children

You do NOT define the wrapper in the tree. The tree contains the wrapper's children.

### Generation Log (first tree child)

```json
{
  "type": "INSTANCE",
  "ref": "genLog",
  "name": "Generation Log",
  "props": {
    "Skill": "generate-flow",
    "Prompt": "Create a flow for managing glossary terms in Studio",
    "Date": "2026-03-31T14:30:00Z",
    "Duration": "2m 15s",
    "Model": "claude-opus-4-6",
    "Plugin": "1.18.1"
  }
}
```

All 6 props are required. Truncate Prompt to 200 characters.

### Cover card (second tree child)

Use the `flowCoverCard` Meta Kit component:

```json
{
  "type": "INSTANCE",
  "ref": "flowCoverCard",
  "name": "Cover: Feature Name",
  "props": {
    "Feature": "Glossary Term Management",
    "Flow": "Happy path: Create new term",
    "User": "Data Steward"
  }
}
```

If `flowCoverCard` is not in imports (missing from Meta Kit), fall back to a FRAME:

```json
{
  "type": "FRAME",
  "name": "Cover: Feature Name",
  "layout": { "mode": "VERTICAL", "spacing": 16, "padding": [32, 32, 32, 32] },
  "fills": ["#1A1D23"],
  "cornerRadius": 12,
  "sizing": { "horizontal": "HUG", "vertical": "HUG" },
  "children": [
    { "type": "TEXT", "name": "Feature", "content": "Glossary Term Management", "size": 24, "font": "Inter:Semi Bold", "color": "#FFFFFF" },
    { "type": "TEXT", "name": "Flow", "content": "Flow: Happy path", "size": 14, "color": "#9CA3AF" },
    { "type": "TEXT", "name": "User", "content": "User: Data Steward", "size": 14, "color": "#9CA3AF" }
  ]
}
```

### Each screen (tree children after cover)

Each screen is a flowScreen instance, detached so children can be appended into its Content Area:

```json
{
  "type": "INSTANCE",
  "ref": "flowScreen",
  "variant": "Size=Standard",
  "name": "Screen 1: Dashboard",
  "detach": true,
  "children": [
    { "comment": "App Header" },
    { "comment": "Body frame: sidebar + content" }
  ]
}
```

The detached flowScreen has a child named `Content` where the interpreter appends children. The screen structure inside is:

1. **App Header** -- INSTANCE of fmAppHeader with correct Type variant
2. **Body** -- FRAME horizontal containing sidebar + content area

#### App Header

```json
{
  "type": "INSTANCE",
  "ref": "fmAppHeader",
  "variant": "Type=Studio",
  "name": "App Header"
}
```

Set `Type` to match the app context: `Studio`, `Explorer`, `Admin`, or `Actian`. Never leave as default.

#### Body frame

```json
{
  "type": "FRAME",
  "name": "Body",
  "layout": { "mode": "HORIZONTAL", "spacing": 0 },
  "fills": [],
  "sizing": { "horizontal": "FILL", "vertical": "FILL" },
  "children": [
    { "comment": "Sidebar" },
    { "comment": "Content area" }
  ]
}
```

#### Sidebar

```json
{
  "type": "FRAME",
  "name": "Sidebar",
  "layout": { "mode": "VERTICAL", "spacing": 0 },
  "fills": ["#1E2028"],
  "sizing": { "horizontal": "HUG", "vertical": "FILL" },
  "children": [
    {
      "type": "INSTANCE",
      "ref": "fmSideNavItem",
      "variant": "State=On",
      "name": "Nav: Glossary",
      "props": { "Label": "Glossary" }
    },
    {
      "type": "INSTANCE",
      "ref": "fmSideNavItem",
      "variant": "State=Placeholder",
      "name": "Nav: Placeholder 1"
    },
    {
      "type": "INSTANCE",
      "ref": "fmSideNavItem",
      "variant": "State=Placeholder",
      "name": "Nav: Placeholder 2"
    },
    {
      "type": "INSTANCE",
      "ref": "fmSideNavItem",
      "variant": "State=Placeholder",
      "name": "Nav: Placeholder 3"
    }
  ]
}
```

#### Content area

```json
{
  "type": "FRAME",
  "name": "Content Area",
  "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [0, 0, 0, 0] },
  "fills": ["#FFFFFF"],
  "sizing": { "horizontal": "FILL", "vertical": "FILL" },
  "children": [
    { "comment": "Page header" },
    { "comment": "Content body" }
  ]
}
```

---

## Feature focus rules

FM flows spotlight the feature. Everything unrelated to the feature gets placeholder treatment.

### Sidebar

- **Active item** (the feature's page): `State=On`, real label via `props: { "Label": "Glossary" }`
- **All other items**: `State=Placeholder` -- no label prop needed, the component renders a grey bar
- Typically 1 active + 3-4 placeholder items

### Table rows

- **Feature-relevant rows**: use `fmTableCell` with `Type=Text` and real data content (set text via findOne pattern after detach, or use a FRAME with TEXT children)
- **Non-feature rows**: use `fmTableCell` with `Type=Placeholder`
- **Header row**: use `fmTableCell` with `Type=Header` for column labels

### Tabs

- **Active tab** (feature section): `State=On`, set text to real label
- **Other tabs**: `State=Placeholder` -- grey bar, no text needed

### Content areas

- **Feature sections**: real FM components with contextual text and correct variants
- **Non-feature sections**: use `fmPlaceholder` with appropriate Type variant (`Label+1line`, `Label+3lines`, etc.)

### Form inputs

- **Feature-relevant inputs**: correct variant (`Type=Placeholder` for empty, `Type=Default` for filled), real `Input Text` prop
- **Non-feature inputs**: use `fmPlaceholder` with `Type=Label+1line`

### Text properties

Set ALL text properties on every instance. Never leave FM defaults like "Label", "Caption", "Text", "Nav Item":

```json
{
  "type": "INSTANCE",
  "ref": "fmButton",
  "variant": "Type=Primary, Size=md, Shape=Regular, State=Default",
  "props": { "Label": "Create Term" }
}
```

If a text prop is not needed, set it to empty string in props. Do not omit it and leave the default visible.

---

## Property format reference

These formats MUST match what the interpreter expects.

### sizing

```json
{ "horizontal": "FILL", "vertical": "HUG" }
```

Values: `"FILL"`, `"HUG"`, or a number (fixed px). Applied AFTER appendChild by the interpreter.

Optional constraints: `"minWidth"`, `"maxWidth"`, `"minHeight"`, `"maxHeight"` (numbers).

### layout

```json
{ "mode": "VERTICAL", "spacing": 16, "padding": [24, 24, 24, 24] }
```

- `mode`: `"VERTICAL"`, `"HORIZONTAL"`, or `"NONE"`
- `spacing`: number (px) for itemSpacing
- `counterAxisSpacing`: number (for wrap layouts)
- `wrap`: `true` for `layoutWrap: 'WRAP'`
- `padding`: `[top, right, bottom, left]` array (4 numbers)
- `primaryAxisAlign`: `"MIN"`, `"CENTER"`, `"MAX"`, `"SPACE_BETWEEN"`
- `counterAxisAlign`: `"MIN"`, `"CENTER"`, `"MAX"`, `"BASELINE"`

### fills

```json
["#FFFFFF"]
```

Array of hex strings. Empty array `[]` = transparent. Gradients:

```json
[{ "type": "LINEAR", "stops": [{ "color": "#FF0000", "position": 0 }, { "color": "#0000FF", "position": 1 }], "angle": 90 }]
```

### stroke

```json
{ "color": "#E0E0E0", "weight": 1, "align": "INSIDE" }
```

- `align`: `"INSIDE"`, `"OUTSIDE"`, `"CENTER"`
- `sides`: `{ "top": true, "right": false, "bottom": true, "left": false }` -- set `false` to zero out individual sides

### cornerRadius

Number for uniform: `8`. Object for individual: `{ "topLeft": 8, "topRight": 8, "bottomRight": 0, "bottomLeft": 0 }`.

### TEXT node

```json
{
  "type": "TEXT",
  "name": "Page Title",
  "content": "Glossary Terms",
  "font": "Inter:Semi Bold",
  "size": 20,
  "color": "#1A1D23",
  "width": 400,
  "textAlign": { "horizontal": "LEFT", "vertical": "TOP" },
  "lineHeight": 28,
  "letterSpacing": -0.2
}
```

- `font`: `"Family:Style"` format (required if not Inter Regular)
- `bold`: `true` shorthand overrides style to Bold
- `textAlign.horizontal`: `"LEFT"`, `"CENTER"`, `"RIGHT"`, `"JUSTIFIED"`
- `textAlign.vertical`: `"TOP"`, `"CENTER"`, `"BOTTOM"`
- `width`: fixed width in px (text wraps, height auto-resizes)

### INSTANCE node

```json
{
  "type": "INSTANCE",
  "ref": "fmButton",
  "variant": "Type=Primary, Size=md, Shape=Regular, State=Default",
  "name": "Button: Create Term",
  "props": { "Label": "Create Term" },
  "detach": false,
  "children": []
}
```

- `ref`: must match a key in `imports`
- `variant`: exact Figma variant string (e.g., `"Size=Standard"`, `"Type=Primary, Size=md"`)
- `props`: component property overrides by prefix name
- `detach`: `true` to convert instance to editable frame (required for flowScreen)
- `children`: appended into the node named `Content` inside the instance (or the instance root if no Content child)

### DIVIDER node

```json
{ "type": "DIVIDER", "name": "Section divider" }
```

Uses the `divider` import automatically. No ref needed.

---

## Complete example -- 3-screen glossary flow

A cover card + 2 screens + generation log for "Create Glossary Term" in Studio.

```json
{
  "meta": {
    "skill": "generate-flow",
    "targetNodeId": "123:456",
    "wrapperName": "generate-flow: Glossary Term Management"
  },
  "fonts": [
    "Inter:Regular",
    "Inter:Medium",
    "Inter:Semi Bold"
  ],
  "imports": {
    "flowScreen":  { "key": "2ca7c756ad54e81219104d3a270ba8eb9eeffcf6", "method": "set" },
    "genLog":      { "key": "a9653f30925367e96dea90093d750bfe70849571", "method": "single" },
    "divider":     { "key": "f4d778e1cf9bb61a33712c791486f54bb1c095b7", "method": "single" },
    "flowCoverCard": { "key": "eaebde6bd07d2f19f3f9c00a9587240cb085a90d", "method": "single" },
    "fmAppHeader":   { "key": "8fc9bcee610c7f8d22ebcc268467993f6dc99c87", "method": "set" },
    "fmSideNavItem": { "key": "d18a0a772ed4acd760c497cb93de796ff052a7b4", "method": "set" },
    "fmPageHeader":  { "key": "ae1f8684a4a89aa74463d439e4e8c1e7a48137fe", "method": "set" },
    "fmButton":      { "key": "368b62312ca941c80ea8eeed84a57d33bb470b09", "method": "set" },
    "fmTextInput":   { "key": "355855c7b2e05b5b336167883b3c9ebbfbd881ad", "method": "set" },
    "fmInputLabel":  { "key": "a39aa1c7cb593f7d26b7659e4cbe4e419e00c766", "method": "set" },
    "fmTableCell":   { "key": "9267fecfadc4577563deb1425fa598d1f5af9144", "method": "set" },
    "fmPlaceholder": { "key": "e49a9de0573cf527736e8173f722f230fa957fb8", "method": "set" }
  },
  "tree": [
    {
      "type": "INSTANCE",
      "ref": "genLog",
      "name": "Generation Log",
      "props": {
        "Skill": "generate-flow",
        "Prompt": "Create a flow for managing glossary terms in Studio",
        "Date": "2026-03-31T14:30:00Z",
        "Duration": "2m 15s",
        "Model": "claude-opus-4-6",
        "Plugin": "1.18.1"
      }
    },
    {
      "type": "INSTANCE",
      "ref": "flowCoverCard",
      "name": "Cover: Glossary Term Management",
      "props": {
        "Feature": "Glossary Term Management",
        "Flow": "Happy path: Create new term",
        "User": "Data Steward"
      }
    },
    {
      "type": "INSTANCE",
      "ref": "flowScreen",
      "variant": "Size=Standard",
      "name": "Screen 1: Glossary list",
      "detach": true,
      "children": [
        {
          "type": "INSTANCE",
          "ref": "fmAppHeader",
          "variant": "Type=Studio",
          "name": "App Header"
        },
        {
          "type": "FRAME",
          "name": "Body",
          "layout": { "mode": "HORIZONTAL", "spacing": 0 },
          "fills": [],
          "sizing": { "horizontal": "FILL", "vertical": "FILL" },
          "children": [
            {
              "type": "FRAME",
              "name": "Sidebar",
              "layout": { "mode": "VERTICAL", "spacing": 0 },
              "fills": ["#1E2028"],
              "sizing": { "horizontal": "HUG", "vertical": "FILL" },
              "children": [
                {
                  "type": "INSTANCE",
                  "ref": "fmSideNavItem",
                  "variant": "State=On",
                  "name": "Nav: Glossary",
                  "props": { "Label": "Glossary" }
                },
                {
                  "type": "INSTANCE",
                  "ref": "fmSideNavItem",
                  "variant": "State=Placeholder",
                  "name": "Nav: Placeholder 1"
                },
                {
                  "type": "INSTANCE",
                  "ref": "fmSideNavItem",
                  "variant": "State=Placeholder",
                  "name": "Nav: Placeholder 2"
                },
                {
                  "type": "INSTANCE",
                  "ref": "fmSideNavItem",
                  "variant": "State=Placeholder",
                  "name": "Nav: Placeholder 3"
                }
              ]
            },
            {
              "type": "FRAME",
              "name": "Content Area",
              "layout": { "mode": "VERTICAL", "spacing": 0, "padding": [32, 32, 32, 32] },
              "fills": ["#FFFFFF"],
              "sizing": { "horizontal": "FILL", "vertical": "FILL" },
              "children": [
                {
                  "type": "INSTANCE",
                  "ref": "fmPageHeader",
                  "variant": "Type=Title + Actions",
                  "name": "Page Header",
                  "props": { "Title": "Glossary Terms" }
                },
                {
                  "type": "FRAME",
                  "name": "Table: Glossary terms",
                  "layout": { "mode": "VERTICAL", "spacing": 0 },
                  "fills": [],
                  "sizing": { "horizontal": "FILL", "vertical": "HUG" },
                  "children": [
                    {
                      "type": "FRAME",
                      "name": "Header row",
                      "layout": { "mode": "HORIZONTAL", "spacing": 0 },
                      "fills": [],
                      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
                      "children": [
                        { "type": "INSTANCE", "ref": "fmTableCell", "variant": "Type=Header", "name": "Col: Term", "sizing": { "horizontal": "FILL", "vertical": "HUG" } },
                        { "type": "INSTANCE", "ref": "fmTableCell", "variant": "Type=Header", "name": "Col: Definition", "sizing": { "horizontal": "FILL", "vertical": "HUG" } },
                        { "type": "INSTANCE", "ref": "fmTableCell", "variant": "Type=Header", "name": "Col: Status", "sizing": { "horizontal": "FILL", "vertical": "HUG" } }
                      ]
                    },
                    {
                      "type": "FRAME",
                      "name": "Data row 1",
                      "layout": { "mode": "HORIZONTAL", "spacing": 0 },
                      "fills": [],
                      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
                      "children": [
                        { "type": "INSTANCE", "ref": "fmTableCell", "variant": "Type=Text", "name": "Cell: Customer ID", "sizing": { "horizontal": "FILL", "vertical": "HUG" } },
                        { "type": "INSTANCE", "ref": "fmTableCell", "variant": "Type=Text", "name": "Cell: Unique identifier", "sizing": { "horizontal": "FILL", "vertical": "HUG" } },
                        { "type": "INSTANCE", "ref": "fmTableCell", "variant": "Type=Pill", "name": "Cell: Approved", "sizing": { "horizontal": "FILL", "vertical": "HUG" } }
                      ]
                    },
                    {
                      "type": "FRAME",
                      "name": "Data row 2 (placeholder)",
                      "layout": { "mode": "HORIZONTAL", "spacing": 0 },
                      "fills": [],
                      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
                      "children": [
                        { "type": "INSTANCE", "ref": "fmTableCell", "variant": "Type=Placeholder", "name": "Cell: Placeholder", "sizing": { "horizontal": "FILL", "vertical": "HUG" } },
                        { "type": "INSTANCE", "ref": "fmTableCell", "variant": "Type=Placeholder", "name": "Cell: Placeholder", "sizing": { "horizontal": "FILL", "vertical": "HUG" } },
                        { "type": "INSTANCE", "ref": "fmTableCell", "variant": "Type=Placeholder", "name": "Cell: Placeholder", "sizing": { "horizontal": "FILL", "vertical": "HUG" } }
                      ]
                    },
                    {
                      "type": "FRAME",
                      "name": "Data row 3 (placeholder)",
                      "layout": { "mode": "HORIZONTAL", "spacing": 0 },
                      "fills": [],
                      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
                      "children": [
                        { "type": "INSTANCE", "ref": "fmTableCell", "variant": "Type=Placeholder", "name": "Cell: Placeholder", "sizing": { "horizontal": "FILL", "vertical": "HUG" } },
                        { "type": "INSTANCE", "ref": "fmTableCell", "variant": "Type=Placeholder", "name": "Cell: Placeholder", "sizing": { "horizontal": "FILL", "vertical": "HUG" } },
                        { "type": "INSTANCE", "ref": "fmTableCell", "variant": "Type=Placeholder", "name": "Cell: Placeholder", "sizing": { "horizontal": "FILL", "vertical": "HUG" } }
                      ]
                    }
                  ]
                },
                {
                  "type": "INSTANCE",
                  "ref": "fmButton",
                  "variant": "Type=Primary, Size=md, Shape=Regular, State=Default",
                  "name": "Button: Create Term",
                  "props": { "Label": "Create Term" }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "INSTANCE",
      "ref": "flowScreen",
      "variant": "Size=Standard",
      "name": "Screen 2: Create term form",
      "detach": true,
      "children": [
        {
          "type": "INSTANCE",
          "ref": "fmAppHeader",
          "variant": "Type=Studio",
          "name": "App Header"
        },
        {
          "type": "FRAME",
          "name": "Body",
          "layout": { "mode": "HORIZONTAL", "spacing": 0 },
          "fills": [],
          "sizing": { "horizontal": "FILL", "vertical": "FILL" },
          "children": [
            {
              "type": "FRAME",
              "name": "Sidebar",
              "layout": { "mode": "VERTICAL", "spacing": 0 },
              "fills": ["#1E2028"],
              "sizing": { "horizontal": "HUG", "vertical": "FILL" },
              "children": [
                {
                  "type": "INSTANCE",
                  "ref": "fmSideNavItem",
                  "variant": "State=On",
                  "name": "Nav: Glossary",
                  "props": { "Label": "Glossary" }
                },
                {
                  "type": "INSTANCE",
                  "ref": "fmSideNavItem",
                  "variant": "State=Placeholder",
                  "name": "Nav: Placeholder 1"
                },
                {
                  "type": "INSTANCE",
                  "ref": "fmSideNavItem",
                  "variant": "State=Placeholder",
                  "name": "Nav: Placeholder 2"
                }
              ]
            },
            {
              "type": "FRAME",
              "name": "Content Area",
              "layout": { "mode": "VERTICAL", "spacing": 24, "padding": [32, 32, 32, 32] },
              "fills": ["#FFFFFF"],
              "sizing": { "horizontal": "FILL", "vertical": "FILL" },
              "children": [
                {
                  "type": "INSTANCE",
                  "ref": "fmPageHeader",
                  "variant": "Type=Title only",
                  "name": "Page Header",
                  "props": { "Title": "Create Glossary Term" }
                },
                {
                  "type": "FRAME",
                  "name": "Form: Term details",
                  "layout": { "mode": "VERTICAL", "spacing": 20 },
                  "fills": [],
                  "sizing": { "horizontal": "HUG", "vertical": "HUG" },
                  "width": 480,
                  "children": [
                    {
                      "type": "FRAME",
                      "name": "Field: Term name",
                      "layout": { "mode": "VERTICAL", "spacing": 4 },
                      "fills": [],
                      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
                      "children": [
                        {
                          "type": "INSTANCE",
                          "ref": "fmInputLabel",
                          "variant": "Disabled=No, Type=Text",
                          "name": "Label: Term name",
                          "props": { "Label Text": "Term Name", "Caption Text": "" }
                        },
                        {
                          "type": "INSTANCE",
                          "ref": "fmTextInput",
                          "variant": "Type=Placeholder",
                          "name": "Input: Term name",
                          "props": { "Input Text": "Enter term name" },
                          "sizing": { "horizontal": "FILL", "vertical": "HUG" }
                        }
                      ]
                    },
                    {
                      "type": "FRAME",
                      "name": "Field: Definition",
                      "layout": { "mode": "VERTICAL", "spacing": 4 },
                      "fills": [],
                      "sizing": { "horizontal": "FILL", "vertical": "HUG" },
                      "children": [
                        {
                          "type": "INSTANCE",
                          "ref": "fmInputLabel",
                          "variant": "Disabled=No, Type=Text",
                          "name": "Label: Definition",
                          "props": { "Label Text": "Definition", "Caption Text": "" }
                        },
                        {
                          "type": "INSTANCE",
                          "ref": "fmTextInput",
                          "variant": "Type=Placeholder",
                          "name": "Input: Definition",
                          "props": { "Input Text": "Enter definition" },
                          "sizing": { "horizontal": "FILL", "vertical": "HUG" }
                        }
                      ]
                    },
                    {
                      "type": "INSTANCE",
                      "ref": "fmPlaceholder",
                      "variant": "Type=Label+3lines",
                      "name": "Placeholder: Additional fields"
                    }
                  ]
                },
                {
                  "type": "FRAME",
                  "name": "Action Footer",
                  "layout": { "mode": "HORIZONTAL", "spacing": 12, "primaryAxisAlign": "MAX" },
                  "fills": [],
                  "sizing": { "horizontal": "FILL", "vertical": "HUG" },
                  "children": [
                    {
                      "type": "INSTANCE",
                      "ref": "fmButton",
                      "variant": "Type=Secondary, Size=md, Shape=Regular, State=Default",
                      "name": "Button: Cancel",
                      "props": { "Label": "Cancel" }
                    },
                    {
                      "type": "INSTANCE",
                      "ref": "fmButton",
                      "variant": "Type=Primary, Size=md, Shape=Regular, State=Default",
                      "name": "Button: Save",
                      "props": { "Label": "Save Term" }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Splitting large flows

If the spec exceeds ~20KB or has 6+ screens:

1. First call: `meta.targetNodeId` set, tree contains genLog + cover + screens 1-5
2. Second call: `meta.appendToId` set to the wrapper ID returned by call 1, tree contains screens 6-N

The interpreter appends to the existing wrapper when `appendToId` is present.

---

## Validation

Run the validator before submitting:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-spec.js path/to/figma-spec.json
```

Common errors caught:
- Missing `ref` on INSTANCE nodes
- `ref` not found in imports
- Invalid layout mode, sizing value, or hex color
- Missing `meta.targetNodeId`
- TEXT node without content
- FRAME layout padding not a 4-element array

---

## Checklist before submitting spec

- [ ] Every INSTANCE has a `ref` that exists in `imports`
- [ ] Every import has the correct `method` (`set` for component sets, `single` for standalone)
- [ ] `meta.targetNodeId` is set to the correct page/section
- [ ] Generation Log has all 6 props filled
- [ ] App Header variant matches app context on every screen
- [ ] Sidebar has exactly 1 `State=On` item with real label, rest are `State=Placeholder`
- [ ] All text props on FM instances are set (no "Label", "Caption", "Text" defaults)
- [ ] Feature focus: real content for feature elements, Placeholder variants for everything else
- [ ] Form containers are max 480px for simple inputs
- [ ] Every FRAME has a `layout` with `mode` set (prevents frame collapse)
- [ ] Every child that should stretch has `sizing: { "horizontal": "FILL" }` or `{ "vertical": "FILL" }`
- [ ] Fonts array includes every family:style pair used by TEXT nodes
