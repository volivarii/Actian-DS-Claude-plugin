# Meta Kit Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 6 MVP Meta Kit Figma components + 2 builder functions + variable/component key catalogs, creating the foundation for consistent AI-generated design system output.

**Architecture:** Create a new Figma file ("Meta Kit") in project 62158719, build 6 components using `use_figma`, publish as a team library, then extract component keys and DS2026 variable keys into catalog files in the plugin repo. Write 2 builder JS functions in a shared reference file. This plan produces the raw materials; a follow-up plan (Skill Migration) wires them into the 4 output skills.

**Tech Stack:** Figma Plugin API via `use_figma` MCP tool, Figma REST API via `get_variable_defs`, Figma library publishing.

**Prerequisite skill:** @figma:figma-use — MUST be loaded before every `use_figma` call.

**Design specs:** Full component specifications are in `plugins/actian-design-system/docs/meta-kit-design-document.md` (iteration 2, sections 2-3). Architectural decisions are in `plugins/actian-design-system/docs/meta-kit-design-doc.md` (iteration 3). Both should be read before starting.

---

## File Structure

### New files (plugin repo)

| File | Responsibility |
|------|---------------|
| `plugins/actian-design-system/docs/meta-kit-components.md` | Component catalog: name, key, variant axes, text properties, usage notes |
| `plugins/actian-design-system/docs/meta-kit-variables.md` | Variable catalog: variable name, key, default value (Actian theme), purpose |
| `plugins/actian-design-system/references/meta-kit-builders.md` | JS builder functions: `buildSpecTable`, `buildStateGrid`, helpers (`setProp`, `importVar`, `bindFill`, `bindStroke`) |

### Modified files (plugin repo)

| File | Change |
|------|--------|
| `plugins/actian-design-system/references/figma-output.md` | Add Meta Kit import pattern, variable binding pattern, reference to builders |
| `plugins/actian-design-system/CLAUDE.md` | Add Meta Kit section to File Organization table |
| `plugins/actian-design-system/scripts/sync-from-upstream.sh` | Add meta-kit sync target (future, not in this plan) |

### New Figma file

| File | Location |
|------|----------|
| Meta Kit | Figma project 62158719 (same project as DS2026 and Page Mockups) |

### Figma file page structure (Phase 1 subset)

```
Meta Kit
  |-- Page: Core
  |     Generation Log
  |     Card Divider
  |
  |-- Page: Brief Components
  |     Brief Card (DS Standard, DS Page Header, FM Standard, FM Page Header)
  |     Code Block
  |     Do-Don't Pair (DS, FM)
  |
  |-- Page: Flow Components
  |     Flow Screen (Standard, Compact)
  |
  |-- Page: Examples
  |     (empty — populated after skills use the components)
```

---

## Task 1: Create the Meta Kit Figma file and build the Generation Log component

**Files:**
- Create: Meta Kit Figma file (via `use_figma` — `create_new_file` or manual)
- Create: Generation Log component on "Core" page

This is the highest-impact component — used by every skill, every output. Currently 30-50 lines of inline JS per invocation.

- [ ] **Step 1: Create the Meta Kit Figma file**

If `create_new_file` MCP tool is available, use it to create a new file in project 62158719 named "Meta Kit". Otherwise, create it manually in Figma and note the file key.

Record the file key — all subsequent `use_figma` calls use it.

- [ ] **Step 2: Create the "Core" page**

```js
// use_figma: Create Core page
const page = figma.createPage();
page.name = "Core";
```

- [ ] **Step 3: Build the Generation Log component**

Use `use_figma` with the `figma-use` skill loaded. Build the component per the spec in `meta-kit-design-document.md` section 2, Component 1.

Spec summary:
- Component set with a single variant (no axes needed — just one component)
- **Size:** 280px wide, height hugs
- **Layout:** Vertical auto-layout, 4px item spacing, 16px vertical / 20px horizontal padding
- **Fill:** `#2D3648`
- **Corner radius:** 12px
- **Text children (7 fields):**
  1. "GENERATED" — Inter 10px Regular, `#A0ABC0`
  2. "Skill: component-brief" — Inter 12px Regular, `#CBD2E0` (text property: `Skill`)
  3. "Prompt: User prompt here" — Inter 12px Regular, `#CBD2E0` (text property: `Prompt`)
  4. "2026-03-26T10:00:00Z" — Inter 12px Regular, `#CBD2E0` (text property: `Date`)
  5. "Duration: 2m 34s" — Inter 12px Regular, `#CBD2E0` (text property: `Duration`)
  6. "claude-opus-4-6" — Inter 12px Regular, `#CBD2E0` (text property: `Model`)
  7. "v1.11.0" — Inter 12px Regular, `#CBD2E0` (text property: `Plugin Version`)

All text fields except "GENERATED" should be exposed as component text properties.

**Note:** Each field is a single text node. The label prefix (e.g., "Skill:") is part of the text property value, not a separate styled range. This is a simplification from the design doc's label/value split — acceptable for the MVP since the visual difference is minor and consumers set the full string.

Load fonts first: `await figma.loadFontAsync({ family: "Inter", style: "Regular" })`

- [ ] **Step 4: Set the component description**

```js
component.description = "Generation metadata card. First element in every AI-generated output. Shows skill name, prompt, timestamp, duration, model, and plugin version.";
```

- [ ] **Step 5: Take a screenshot and verify**

Use `get_screenshot` on the component node. Verify:
- Dark background, 12px corner radius
- 7 text lines visible
- "GENERATED" label at top in muted color
- Width is 280px

- [ ] **Step 6: Commit a note**

No code to commit yet (this is a Figma-only task). Record the component's node ID for the catalog.

---

## Task 2: Build the Card Divider component

**Files:**
- Modify: Meta Kit Figma file, "Core" page

Trivial component — 1px line, fills parent width. Used dozens of times per brief.

- [ ] **Step 1: Build the Card Divider component**

```js
// use_figma: Build Card Divider
const component = figma.createComponent();
component.name = "Meta / Utility / Card Divider";
component.description = "Horizontal divider line between card sections. Fills parent width.";
component.resize(400, 1);
component.layoutMode = "HORIZONTAL";
component.primaryAxisSizingMode = "FIXED";
component.counterAxisSizingMode = "FIXED";
component.fills = [{ type: 'SOLID', color: { r: 0.929, g: 0.941, b: 0.969 } }]; // #EDF0F7
// Move to Core page
```

**Note:** Default width is 400px. When used inside auto-layout parents, consumers must set `instance.layoutSizingHorizontal = 'FILL'` to fill the parent width. Document this in the component catalog.

- [ ] **Step 2: Verify with screenshot**

Should show a thin horizontal line.

---

## Task 3: Build the Brief Card component set (4 variants)

**Files:**
- Modify: Meta Kit Figma file, new "Brief Components" page

The most frequently used component — 8 instances per DS brief. Has 4 variants:
- DS Standard (1200px, grey header + white content)
- DS Page Header (1200px, white, large title + Actian logo)
- FM Standard (820px, grey header + white content)
- FM Page Header (820px, dark, 48px title)

- [ ] **Step 1: Create the "Brief Components" page**

```js
const page = figma.createPage();
page.name = "Brief Components";
```

- [ ] **Step 2: Build DS Standard variant**

Per spec in `meta-kit-design-document.md` Component 2:
- **Size:** 1200px wide, height hugs
- **Structure:** Vertical auto-layout
  - Header frame: `#F5F5FA` fill, 80px padding, vertical auto-layout
    - Title text: Inter 48px Bold, `#12131F` (text property: `Title`)
    - Subtitle text: Inter 24px Regular, `#000000` (text property: `Subtitle`)
  - Content frame: white fill, 80px padding, vertical auto-layout, 24px item spacing
    - (empty — Claude fills this via use_figma)
- **Corner radius:** 16px
- **Border:** 1px `#D9DCE1` stroke

- [ ] **Step 3: Build DS Page Header variant**

- **Size:** 1200px wide, height hugs
- **Structure:** Vertical auto-layout, 80px padding
  - Title row: horizontal auto-layout, space-between
    - Title text: Inter 72px Bold, `#12131F` (text property: `Component Name`)
    - Logo placeholder: 64x60 frame (Actian Pyramid will be nested later)
  - Body text: Inter 32px Regular, `#12131F`, max-width 1062px (text property: `Description`)
- **Fill:** white
- **Corner radius:** 16px
- **Border:** 1px `#D9DCE1` stroke

- [ ] **Step 4: Build FM Standard variant**

Same structure as DS Standard but:
- **Width:** 820px
- **Header padding:** 48px
- **Title:** Inter 28px Bold
- **Subtitle:** Inter 14px Regular

- [ ] **Step 5: Build FM Page Header variant**

- **Width:** 820px, min-height 320px
- **Fill:** `#2D3648` (dark)
- **Padding:** 48px
- Source label: Inter 11px 600 uppercase, `#A0ABC0`, 0.5px letter-spacing (text property: `Source`)
- Title: Inter 48px Bold, white (text property: `Component Name`)
- Subtitle: Inter 16px Regular, `#CBD2E0` (text property: `Description`)

- [ ] **Step 6: Combine into component set**

Group all 4 variants into a component set with axes:
- **Mode:** DS, FM
- **Type:** Standard, Page Header

Use `figma.combineAsVariants([dsStandard, dsPageHeader, fmStandard, fmPageHeader], page)` to create the component set. Name each variant before combining:
```js
dsStandard.name = "Mode=DS, Type=Standard";
dsPageHeader.name = "Mode=DS, Type=Page Header";
fmStandard.name = "Mode=FM, Type=Standard";
fmPageHeader.name = "Mode=FM, Type=Page Header";
const componentSet = figma.combineAsVariants([dsStandard, dsPageHeader, fmStandard, fmPageHeader], page);
componentSet.name = "Meta / Chrome / Brief Card";
```

- [ ] **Step 7: Set descriptions and verify**

Set component description. Take screenshot of all 4 variants. Verify dimensions, colors, text hierarchy.

---

## Task 4: Build Code Block and Do-Don't Pair components

**Files:**
- Modify: Meta Kit Figma file, "Brief Components" page

Two content components that are used across skills (briefs + presentations).

- [ ] **Step 1: Build Code Block component**

Per spec in `meta-kit-design-document.md` Component 6:
- **Size:** Width fills parent, height hugs
- **Fill:** `#1E1E2E`
- **Corner radius:** 12px
- **Padding:** 32px all sides
- **Layout:** Vertical auto-layout
- **Children:**
  - Optional header bar (toggleable via boolean property `Show Header`):
    - Background: `#15151E`, padding 12px 32px
    - Text: Inter 12px 500, `#A6ACCD` (text property: `Header Text`)
  - Code text: Fira Code 13px Regular, `#A6ACCD`, line-height 1.7 (text property: `Code`)
- **Description:** "Dark code block for CSS, HTML, ARIA code examples. Used in component-brief Card 9 and presentation code slides."

Note: Load Fira Code font. If unavailable, fall back to Roboto Mono.

- [ ] **Step 2: Build Do-Don't Pair component set**

Per spec in `meta-kit-design-document.md` Component 7:
- Component set with variant axis: **Mode** (DS, FM)
- **Structure:** Horizontal auto-layout, 24px gap, fills parent
  - Do card: Vertical auto-layout
    - Green bar: 4px height, fills width, `#047800` (DS) or `#22C55E` (FM)
    - Label: Inter 13px 600, `#047800`/`#22C55E` (text property: `Do Label`)
    - Example frame: `#FAFAFA` (DS) or `#FAFFF5` (FM) bg, 16-20px padding, 8px radius
      - Example text: Inter 16px Regular, `#2D3648` (text property: `Do Example`)
  - Don't card: same structure but red
    - Red bar: `#C10C0D` (DS) or `#EF4444` (FM)
    - Label color: same red (text property: `Don't Label`)
    - Example bg: `#FAFAFA` (DS) or `#FFF5F5` (FM) (text property: `Don't Example`)

- [ ] **Step 3: Verify both components**

Screenshot both. Verify:
- Code block: dark background, rounded, monospace text visible
- Do-Don't: green and red bars, side-by-side layout, example text areas

---

## Task 5: Build Flow Screen component

**Files:**
- Modify: Meta Kit Figma file, new "Flow Components" page

Compound component that composes FM App_header + FM Side navigation bar + content area.

- [ ] **Step 1: Create the "Flow Components" page**

- [ ] **Step 2: Research FM Kit component keys**

Read `plugins/actian-design-system/docs/fm-components.md` to find the component keys for:
- FM App_header
- FM Side navigation bar

These will be imported as nested instances.

- [ ] **Step 3: Build Standard variant (1440x960)**

Per spec in `meta-kit-design-document.md` Component 5:
- **Size:** 1440x960 fixed
- **Layout:** Vertical auto-layout, no padding, no spacing
- **Children:**
  1. FM App_header instance (imported via `getComponentByKeyAsync`) — 1440px wide, 70px height
  2. Horizontal frame (fills remaining):
     - FM Side navigation bar instance — 260px wide, fill height
     - Content area frame — fill width, fill height, `#F5F5FA` background, 24px padding, vertical auto-layout
- **Fill:** white
- **Corner radius:** 0 (screens have no corner radius)

Name the content area frame "Content Area" — skills will find it by name to add content.

- [ ] **Step 4: Build Compact variant (1440x700)**

Same structure, different height.

- [ ] **Step 5: Combine into component set**

Variant axis: **Size** (Standard, Compact)
Name: `Meta / Chrome / Flow Screen`

- [ ] **Step 6: Verify**

Screenshot. Verify:
- App header bar at top (70px, dark)
- Sidebar at left (260px)
- Content area fills remaining space (light grey background)

---

## Task 6: Publish the Meta Kit library

**Files:**
- Modify: Meta Kit Figma file (publish action)

- [ ] **Step 1: Review all components**

Take screenshots of each page. Verify all 6 components are complete:
1. Generation Log (Core page)
2. Card Divider (Core page)
3. Brief Card — 4 variants (Brief Components page)
4. Code Block (Brief Components page)
5. Do-Don't Pair — 2 variants (Brief Components page)
6. Flow Screen — 2 variants (Flow Components page)

- [ ] **Step 2: Publish as team library**

In Figma: File → Publish Library. Include all pages except Examples.

Note: The user must do this step manually in Figma. Tell them:
**"Please publish the Meta Kit file as a team library in Figma. Go to the Meta Kit file → click the book icon (Libraries) → Publish."**

- [ ] **Step 3: Verify library is accessible**

After publishing, use `search_design_system` to search for "Meta" or "Generation Log" — the components should appear.

---

## Task 7: Extract component keys and create the component catalog

**Files:**
- Create: `plugins/actian-design-system/docs/meta-kit-components.md`

After publishing, extract the component keys needed for `getComponentByKeyAsync()`.

- [ ] **Step 1: Get component keys via search_design_system or get_design_context**

For each component, use `search_design_system` with the component name to find its key. Record:
- Component name
- Component key (the string used with `getComponentByKeyAsync`)
- Variant axes and values
- Text property names
- Boolean property names

- [ ] **Step 2: Write the component catalog**

```markdown
# Meta Kit Component Catalog

Components from the Meta Kit Figma library. Import via `figma.teamLibrary.getComponentByKeyAsync(key)`.

## How to use

```js
// Import a component
const comp = await figma.teamLibrary.getComponentByKeyAsync("COMPONENT_KEY");
const instance = comp.createInstance();

// Set text properties (use prefix matching — keys include internal IDs)
function setProp(inst, prefix, value) {
  const key = Object.keys(inst.componentProperties).find(k => k.startsWith(prefix));
  if (key) inst.setProperties({ [key]: value });
}

setProp(instance, "Title", "Anatomy");
setProp(instance, "Subtitle", "Component structure and dimensions");
```

## Core

### Generation Log
- **Key:** `KEY_HERE`
- **Text properties:** Skill, Prompt, Date, Duration, Model, Plugin Version
- **Usage:** First element in every output. Import once per generation.

### Card Divider
- **Key:** `KEY_HERE`
- **Usage:** Between sections inside Brief Cards. Import N times per card.

## Brief Components

### Brief Card
- **Key:** `KEY_HERE`
- **Variant axes:** Mode (DS, FM), Type (Standard, Page Header)
- **Text properties:**
  - Standard: Title, Subtitle
  - Page Header: Component Name, Description, Source (FM only)
- **Usage:** Card shell for all spec cards. Import 8-9 times per brief.

### Code Block
- **Key:** `KEY_HERE`
- **Boolean properties:** Show Header
- **Text properties:** Header Text, Code
- **Usage:** Card 9 (Code Specification), presentation code slides.

### Do-Don't Pair
- **Key:** `KEY_HERE`
- **Variant axes:** Mode (DS, FM)
- **Text properties:** Do Label, Don't Label, Do Example, Don't Example
- **Usage:** Cards 6-7, presentation best-practice slides.

## Flow Components

### Flow Screen
- **Key:** `KEY_HERE`
- **Variant axes:** Size (Standard 1440x960, Compact 1440x700)
- **Internal structure:** FM App_header (top) + FM Side nav (left) + Content Area (fill)
- **Usage:** Every flow screen. Find "Content Area" child by name to add content.
```

- [ ] **Step 3: Commit the catalog**

```bash
git add plugins/actian-design-system/docs/meta-kit-components.md
git commit -m "docs: add Meta Kit component catalog with keys"
```

---

## Task 8: Extract DS2026 variable keys and create the variable catalog

**Files:**
- Create: `plugins/actian-design-system/docs/meta-kit-variables.md`

Extract variable keys from the DS2026 library for the ~15-20 most-used scaffolding colors.

- [ ] **Step 1: Get variable definitions from DS2026**

Use `get_variable_defs` MCP tool with fileKey `l8biHxfarNi1I2RMvVxVOK` to get all variable collections and their keys.

Filter for the "Color" collection and extract keys for these variables:
- `background-bg-default` (#FFFFFF)
- `background-bg-grey-1` (#FBFBFF)
- `background-bg-grey-2` (#F5F5FA)
- `border-default` (#E4E4F0)
- `text-primary` (#000000)
- `text-secondary` (#3F3F4A)
- `text-tertiary` (#595968)
- `text-placeholder` (#8A8A9A)
- `theme-primary` (#0550DC)
- `status-success-primary` (#047800)
- `status-error-primary` (#C10C0D)
- `interactive-enabled-inverse` (#FFFFFF)
- `interactive-disabled-primary` (#9898A7)
- `icon-default` (#12131F)
- `icon-secondary` (#595968)

- [ ] **Step 2: Write the variable catalog**

```markdown
# Meta Kit Variable Keys

DS2026 Figma variables for use with `figma.variables.importVariableByKeyAsync(key)`.
Bind to generated scaffolding frames via `setBoundVariableForPaint()`.

## Usage pattern

```js
// Import variables at the start of each use_figma call
const vars = {};
async function importVar(name, key) {
  vars[name] = await figma.variables.importVariableByKeyAsync(key);
}
await importVar('bgDefault', 'KEY_HERE');
await importVar('bgGrey2', 'KEY_HERE');
await importVar('borderDefault', 'KEY_HERE');
// ... import all needed variables

// Bind to a node
function bindFill(node, variable) {
  const fills = JSON.parse(JSON.stringify(node.fills));
  fills[0] = figma.variables.setBoundVariableForPaint(fills[0], 'color', variable);
  node.fills = fills;
}

function bindStroke(node, variable) {
  const strokes = JSON.parse(JSON.stringify(node.strokes));
  strokes[0] = figma.variables.setBoundVariableForPaint(strokes[0], 'color', variable);
  node.strokes = strokes;
}
```

## Color Variables

| Variable | Key | Default (Actian) | Purpose |
|----------|-----|------------------|---------|
| background-bg-default | `KEY` | #FFFFFF | Card backgrounds, content areas |
| background-bg-grey-1 | `KEY` | #FBFBFF | Subtle backgrounds |
| background-bg-grey-2 | `KEY` | #F5F5FA | Table headers, section backgrounds |
| border-default | `KEY` | #E4E4F0 | Card borders, table row dividers |
| text-primary | `KEY` | #000000 | Headings, primary content |
| text-secondary | `KEY` | #3F3F4A | Body text, subtitles |
| text-tertiary | `KEY` | #595968 | Muted labels, captions |
| theme-primary | `KEY` | #0550DC | Brand accents, links, primary actions |
| status-success-primary | `KEY` | #047800 | Pass badges, Do labels |
| status-error-primary | `KEY` | #C10C0D | Error indicators, Don't labels |
| interactive-enabled-inverse | `KEY` | #FFFFFF | Text on dark/colored backgrounds |
| text-placeholder | `KEY` | #8A8A9A | Placeholder text in inputs |
| interactive-disabled-primary | `KEY` | #9898A7 | Disabled elements |
| icon-default | `KEY` | #12131F | Default icon color |
| icon-secondary | `KEY` | #595968 | Secondary icon color |

## Last verified
2026-03-26 — Variable keys are stable across publishes. Re-verify quarterly.
```

- [ ] **Step 3: Commit the variable catalog**

```bash
git add plugins/actian-design-system/docs/meta-kit-variables.md
git commit -m "docs: add DS2026 variable key catalog for Meta Kit"
```

---

## Task 9: Write builder functions

**Files:**
- Create: `plugins/actian-design-system/references/meta-kit-builders.md`

Two builders for the MVP: `buildSpecTable` and `buildStateGrid`. Plus helper functions used by all builders.

- [ ] **Step 1: Write the builder reference file**

The file must contain complete, copy-paste-ready JS functions. Skills copy these into `use_figma` calls.

Include:
1. **Helpers section:** `setProp()`, `importVar()`, `bindFill()`, `bindStroke()`, `hexToRgb()` (fallback for FM)
2. **`buildSpecTable(parent, headers, rows, options)`** — per spec in `meta-kit-design-document.md` Builder 1
3. **`buildStateGrid(parent, states)`** — per spec in `meta-kit-design-document.md` Builder 3

Each function must include:
- Full function signature with JSDoc parameter descriptions
- Complete implementation (no pseudocode or "...")
- Token values used (as comments)
- Font loading (await figma.loadFontAsync)
- Example usage showing a real call

The `buildSpecTable` function must:
- Create a vertical auto-layout frame (the table)
- First child: horizontal header row with grey background (#F5F5FA), Inter 13px 600 text
- Subsequent children: data rows with Inter 14px 400 text, 1px bottom border (#F0F0F5)
- Support `columnWidths` parameter for fixed column sizing
- Support `showSwatches` option for inline color dots in token tables
- Return the table frame

The `buildStateGrid` function must:
- Parameter type: `states: Array<{ label: string, content: FrameNode | InstanceNode }>`
- Create a horizontal auto-layout frame, 48px gap between columns
- For each state: vertical frame with:
  - Label text: Inter 12px 500, `#888888`
  - 10px gap between label and content
  - Content node (appended from the `content` parameter)
- Return the grid frame

- [ ] **Step 2: Verify the file is well-formed**

Read it back and check all code blocks are closed, all functions are complete.

- [ ] **Step 3: Commit**

```bash
git add plugins/actian-design-system/references/meta-kit-builders.md
git commit -m "docs: add Meta Kit builder functions (buildSpecTable, buildStateGrid)"
```

---

## Task 10: Update figma-output.md and CLAUDE.md with Meta Kit references

**Files:**
- Modify: `plugins/actian-design-system/references/figma-output.md`
- Modify: `plugins/actian-design-system/CLAUDE.md`

- [ ] **Step 1: Update figma-output.md**

Add a new section after the generation metadata frame section:

```markdown
## Meta Kit components

For shared visual elements (card chrome, code blocks, do/don't pairs, generation cards), import Meta Kit library components instead of building inline. See `../../docs/meta-kit-components.md` for component keys and properties.

### Import pattern

```js
const comp = await figma.teamLibrary.getComponentByKeyAsync("COMPONENT_KEY");
const instance = comp.createInstance();

// Set text properties (use prefix matching)
function setProp(inst, prefix, value) {
  const key = Object.keys(inst.componentProperties).find(k => k.startsWith(prefix));
  if (key) inst.setProperties({ [key]: value });
}
setProp(instance, "Title", "Design tokens");
```

## Variable binding (DS2026 output)

For DS2026 output, bind scaffolding colors to Figma variables instead of using hex. This enables theme switching on generated output. See `../../docs/meta-kit-variables.md` for variable keys.

[include the importVar/bindFill/bindStroke pattern from the variable catalog]

For FM output, continue using hex values (FM Kit does not publish variables for theme switching).

## Builder functions

For dynamic content (tables, grids, charts), use the builder functions in `../../references/meta-kit-builders.md`. Copy the function into your `use_figma` call and invoke it.
```

- [ ] **Step 2: Update CLAUDE.md File Organization table**

Add rows for the new Meta Kit files:

```markdown
| `docs/meta-kit-components.md` | Hand-authored (this repo) | Meta Kit component keys and properties |
| `docs/meta-kit-variables.md` | Hand-authored (this repo) | DS2026 variable keys for scaffolding binding |
| `references/meta-kit-builders.md` | Hand-authored (this repo) | Shared JS builder functions for tables, grids |
```

- [ ] **Step 3: Commit**

```bash
git add plugins/actian-design-system/references/figma-output.md plugins/actian-design-system/CLAUDE.md
git commit -m "docs: add Meta Kit references to figma-output.md and CLAUDE.md"
```

---

## Task 11: Validation — generate a test component brief card

**Files:**
- No file changes — this is a verification task

- [ ] **Step 1: Test Generation Log import**

Write a `use_figma` call that:
1. Imports the Generation Log component by key (from `meta-kit-components.md`)
2. Sets all 6 text properties
3. Takes a screenshot

Verify the generation card renders correctly with the set properties.

- [ ] **Step 2: Test Brief Card import + content**

Write a `use_figma` call that:
1. Imports a Brief Card (Mode=DS, Type=Standard) by key
2. Sets Title and Subtitle
3. Copies the `buildSpecTable` function from `meta-kit-builders.md` into the `use_figma` code block
4. Inside the content area, calls `buildSpecTable` with 3 columns and 5 rows
5. Takes a screenshot

Verify the card renders with correct chrome, header text, and a properly styled table.

- [ ] **Step 3: Test variable binding**

Write a `use_figma` call that:
1. Imports a DS2026 variable (e.g., `background-bg-grey-2`) by key
2. Creates a rectangle
3. Binds the variable to the rectangle's fill
4. Takes a screenshot

Verify the rectangle shows the correct color AND that it responds to theme switching.

- [ ] **Step 4: Report results**

If all 3 tests pass, the Meta Kit foundation is validated.
If any test fails, document the failure and fix before proceeding to the Skill Migration plan.

---

## Verification checklist

After all tasks are complete:

- [ ] Meta Kit Figma file exists in project 62158719 with 4 pages
- [ ] 6 components are published: Generation Log, Card Divider, Brief Card (4 variants), Code Block, Do-Don't Pair (2 variants), Flow Screen (2 variants)
- [ ] `meta-kit-components.md` exists with all 6 component keys filled in
- [ ] `meta-kit-variables.md` exists with ~12-15 DS2026 variable keys filled in
- [ ] `meta-kit-builders.md` exists with complete `buildSpecTable` and `buildStateGrid` functions
- [ ] `figma-output.md` references Meta Kit import pattern, variable binding pattern, and builder functions
- [ ] `CLAUDE.md` File Organization table includes the 3 new Meta Kit files
- [ ] Test: Generation Log imports and renders correctly with set properties
- [ ] Test: Brief Card imports with table content inside
- [ ] Test: Variable binding works on a scaffolding frame
