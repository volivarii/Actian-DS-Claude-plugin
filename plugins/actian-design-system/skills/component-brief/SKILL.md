---
name: component-brief
description: Use this skill whenever the user wants to formally document or specify a design system component. Produces a multi-card HTML spec page covering anatomy, design tokens, component API, usage guidelines, content guidelines, accessibility, and code specification. Supports both 9-card Actian DS (hi-fi) and 5-card Fat Marker (lo-fi) formats. Triggers when the user asks to document, brief, or spec a component, wants to know the variants/states/tokens for a component, asks for a spec page, or provides a Figma component URL and wants it turned into structured documentation for the team.
argument-hint: "[Figma URL or component name] [generate N,N,N]"
---

# Component Brief

Draft a structured component brief and generate an HTML spec page. Supports two modes matching the two design system layers.

> **Content guidelines:** All UI copy in briefs must follow `../../docs/content-guidelines.md`. Read it before writing Cards 6 (Usage guidelines) and 7 (Content guidelines).
> **Accessibility guidelines:** Card 8 (Accessibility) must follow `../../docs/accessibility-guidelines.md` — use the component-specific checklist matching the component type (P0/P1/P2), include WCAG criteria references, contrast ratio table, and keyboard interaction spec. All WCAG 2.1 AA.
> **Quality & hygiene:** Run through `../../references/quality-checklist.md` — check the **Universal** section plus the **Component Brief** section. Fix issues inline before presenting to the user.
> **Generation log:** Follow the Generation Log format in CLAUDE.md for all output files.

> **Mode: Spec.** Be thorough — document every variant, state, and edge case. Structure everything with consistent headings, tables, and numbered lists. Define before building; every decision needs a rationale. Cross-reference tokens, components, and guidelines by name. Include what's out of scope explicitly.

### Quality tier detection

| Signal in user prompt | Tier | Effect |
|----------------------|------|--------|
| "quick", "rough", "draft", "sketch" | Draft | Cards 1-5 only, simplified tables (5 rows max), no variant matrices |
| No qualifier (default) | Standard | All cards, full Meta Kit components, proper token tables |
| "production", "final", "publish-ready" | Production | Standard + variable binding on all scaffolding + golden reference comparison |
| Re-generation after feedback | Production | Auto-upgrade to production tier |

## Modes

Determine the mode from context:

| Signal | Mode |
|--------|------|
| User says "FM", "Fat Marker", "wireframe", "lo-fi" | **Fat Marker** |
| User says "DS2026", "design system", "hi-fi", "production" | **Actian DS** |
| Component exists in FM catalog (`FATMARKER-COMPONENT-CATALOG.md`) AND no DS2026 signals | **Fat Marker** |
| User provides a Figma URL from DS2026 files (`8Yu8wUtPTXsa3iV6R4TmnS`, `l8biHxfarNi1I2RMvVxVOK`, or `fuWLltVXyBrbn6KfBAav12`) | **Actian DS** |
| Figma file name contains "Design System", "DS2026", or "Actian" | **Actian DS** |
| **Default when a Figma URL is provided and no FM signals exist** | **Actian DS** |
| Ambiguous (no URL, no explicit mode) | Ask the user: "Fat Marker (lo-fi wireframe) or Actian DS (hi-fi production)?" |

## Input

The user describes a component or provides a Figma URL. Examples:
- "Draft a brief for the link component" + Figma URL
- "Document FM Alert"
- "We need a notification banner component"

## Execution Model — Run Autonomously

**This skill runs end-to-end without intermediate prompts.** Do NOT pause to ask questions, present drafts, or wait for confirmation between steps. The only acceptable pause is when the mode (FM vs DS) is genuinely ambiguous AND no signals resolve it.

Parse card selection from the user's initial input. If no selection is specified, default to **all cards**. Do not ask "which cards?" — just generate them.

### Speed rules

- **Do NOT use TaskCreate/TaskUpdate/TodoWrite.** No task tracking overhead — just execute.
- **ONE parallel batch for research.** Read all files in a single message with parallel tool calls. Never do serial rounds of research.
- **Do NOT read CLAUDE.md** — the relevant token mappings and rules are already in this skill file and in `../../docs/token-reference.md`.
- **Do NOT read `plugin.json`** — the plugin version for the generation log is: check `.claude-plugin/plugin.json` only once, at the very end, right before writing the file.
- **If a Figma call fails, skip it and proceed.** Do not retry or try alternative approaches — use the screenshot and existing docs instead.
- **Do NOT create directories with mkdir.** Use the Write tool directly — it creates parent directories automatically.

## Step 1 — Research (ONE parallel batch)

Issue ALL of these reads in a **single message** with parallel tool calls. Do not wait for results between reads.

**For Actian DS mode (9 cards), read these files in parallel:**
1. `get_screenshot` on the provided Figma node (for visual reference)
2. `../../docs/token-reference.md` (token values per theme)
3. `../../docs/content-guidelines.md` (for Cards 6-7)
4. `../../docs/accessibility-guidelines.md` (for Card 8)
5. `../../docs/component-guidelines/<slug>.json` — per-component guidelines from Figma (content guidelines, design guidelines, variants, examples). Use the component slug (e.g., `button.json`, `date-picker.json`). If the file doesn't exist, skip it.
6. All 9 card templates: `templates/ds-card-1-page-header.html` through `templates/ds-card-9-code-specification.html`
7. `templates/ds-wrapper.html`

**For Fat Marker mode (5 cards), read these files in parallel:**
1. `get_screenshot` on the provided Figma node
2. `../../docs/fm-components.md` (component variants)
3. `../../docs/content-guidelines.md`
4. `../../docs/component-guidelines/<slug>.json` — per-component guidelines (if available)
5. All 5 card templates: `templates/fm-card-1-page-header.html` through `templates/fm-card-5-anatomy.html`
6. `templates/fm-wrapper.html`

That's it. No additional research rounds. Proceed immediately to generation.

## Step 2 — Generate HTML (immediate)

Draft the brief content and generate the HTML in the same step. Do NOT draft as a separate step — go straight from research results to final HTML output.

**MANDATORY: Include the GENERATION LOG** comment block in `<head>` as specified in CLAUDE.md. Read `.claude-plugin/plugin.json` for the version right before writing the file.

### Card selection (parsed from input, never prompted)

Default is **All cards**.

**Actian DS cards:**

| # | Card | `data-name` | Template file |
|---|------|-------------|---------------|
| 1 | Page header | `"Page header"` | `templates/ds-card-1-page-header.html` |
| 2 | Actual component (Locked) | `"Actual component (Locked)"` | `templates/ds-card-2-actual-component.html` |
| 3 | Anatomy | `"Anatomy"` | `templates/ds-card-3-anatomy.html` |
| 4 | Design tokens | `"Design tokens"` | `templates/ds-card-4-design-tokens.html` |
| 5 | Component API | `"Component API"` | `templates/ds-card-5-component-api.html` |
| 6 | Usage guidelines | `"Usage guidelines"` | `templates/ds-card-6-usage-guidelines.html` |
| 7 | Content guidelines | `"Content guidelines"` | `templates/ds-card-7-content-guidelines.html` |
| 8 | Accessibility | `"Accessibility"` | `templates/ds-card-8-accessibility.html` |
| 9 | Code specification | `"Code specification"` | `templates/ds-card-9-code-specification.html` |

**Fat Marker cards:**

| # | Card | `data-name` | Template file |
|---|------|-------------|---------------|
| 1 | Page header | `"Page header"` | `templates/fm-card-1-page-header.html` |
| 2 | Actual component (Locked) | `"Actual component (Locked)"` | `templates/fm-card-2-actual-component.html` |
| 3 | Design guidelines | `"Design guidelines"` | `templates/fm-card-3-design-guidelines.html` |
| 4 | Content guidelines | `"Content guidelines"` | `templates/fm-card-4-content-guidelines.html` |
| 5 | Anatomy | `"Anatomy"` | `templates/fm-card-5-anatomy.html` |

**How the user selects:**

| Input | Result |
|-------|--------|
| "generate" or "all" or no selection | All cards (default) |
| "generate card 4" or "Design tokens" | Only that one card |
| "generate 2, 4, 9" or "Component, Tokens, Code" | Only those cards |
| "generate 1–5" or "first 5" | Range of cards |
| "skip 6 and 7" or "all except Content and Usage" | All minus excluded |

When generating a subset, only include the selected cards in the HTML `brief-row`. The CSS framework is always included regardless of selection.

### HTML generation (TEMPLATE-DRIVEN)

**CRITICAL: You MUST read the template files and use them as the structural foundation for every card.** Do not generate card HTML from memory or from the descriptions above — the templates are the single source of truth for layout, CSS classes, and structure.

### Assembly process

1. **Read the wrapper template:**
   - Actian DS: `templates/ds-wrapper.html`
   - Fat Marker: `templates/fm-wrapper.html`

2. **For each selected card, read its template file** from the table above.

3. **Replace all `{{PLACEHOLDER}}` markers** in each template with component-specific content. Each template contains HTML comments explaining what to put in each placeholder.

4. **Assemble the final HTML:**
   - Copy the wrapper template
   - Insert the filled card HTML fragments where `<!-- {{CARDS}} -->` appears
   - For Card 2 (Actual component), also inject `{{COMPONENT_SPECIFIC_CSS}}` into a `<style>` block inside the card — these are the CSS classes needed to render the actual component (e.g., `.btn`, `.link`, `.input`)

5. **Save to:** `components/[component-name]/[component-name]-spec.html`

### Rules

- **DO NOT** invent new card structures — use the template exactly as provided
- **DO NOT** change CSS class names, spacing values, font sizes, or colors from the template
- **DO** add component-specific CSS classes inside Card 2 for rendering the actual component
- **DO** add `data-name` attributes to every section div
- Each card auto-sizes to fit content — NEVER use fixed heights that clip or overflow
- For existing components, check `components/*/` for previously generated specs as additional reference

---

## Token Naming Convention

Read `../../references/token-naming.md` for the full `--zen-` prefix mapping table. Use these prefixed names everywhere: spec tables, anatomy callouts, code specification, CSS custom properties.

---

## Step 3 — Output to Figma (default: `use_figma`)

Read and follow the shared output procedure in `../../references/figma-output.md`. This step builds spec cards directly in Figma via Plugin API JavaScript — HTML is for local preview only.

### Card structure (Meta Kit)

Card shells are Meta Kit components — do not construct inline. Import `Meta / Chrome / Brief Card` and detach before adding content.

```js
// Import and configure card
const briefCardSet = await figma.importComponentSetByKeyAsync("3dbb732730af0754210cde7af35e5236a2502843");
const variant = briefCardSet.children.find(c => c.name === "Mode=DS, Type=Standard");
const instance = variant.createInstance();
setProp(instance, "Title", "Design tokens");
setProp(instance, "Subtitle", "Color, sizing, and typography tokens");
const card = instance.detachInstance();  // Detach to allow content insertion
card.name = "Design tokens";            // Rename to card title for readability
const content = card.findOne(n => n.name === "Content");
// Now append tables, text, and visual elements to `content`
```

**IMPORTANT — Frame naming:** After detaching each card, rename it to match its card title. This makes the Figma layer panel readable and cards easy to find. Use these exact names:

| Card | Frame name |
|------|-----------|
| 1 | `Page header` |
| 2 | `Components` |
| 3 | `Anatomy` |
| 4 | `Design tokens` |
| 5 | `Component API` |
| 6 | `Usage guidelines` |
| 7 | `Content guidelines` |
| 8 | `Accessibility` |
| 9 | `Code specification` |

Do NOT leave cards named `"Meta / Chrome / Brief Card"` — that is the source component name, not the output name.

For component keys, properties, and the `setProp` helper, see `../../docs/meta-kit/components.md`.
For builder functions (`buildSpecTable`, `buildStateGrid`), see `../../references/meta-kit/builders.md`.

### Variable binding (DS2026 mode)

Follow `../../references/figma-output.md` § "Token binding" for all style and variable binding. Before writing `use_figma` code, call `search_design_system` to discover the style keys you need:
- **DS2026**: bind color variables, text styles (`textStyleId`), and effect styles (`effectStyleId`)
- **FM**: bind published color styles (`fillStyleId`) and text styles (`textStyleId`)
- **Fallback**: hex only if the file isn't connected to the library

### Card children

Each card contains these element types. **Match the HTML templates** (`templates/ds-card-*.html`) — they define the sub-sections, tables, and visual elements for each card. The `use_figma` output must include the **same content sections and visual elements** as the HTML — omissions are bugs.

| Element | Structure | Where used |
|---------|-----------|------------|
| **Card title** | Text node, bold 24px (e.g., "Anatomy") | Every card header |
| **Subtitle** | Text node, regular 18px, secondary color | Every card header |
| **Section headings** | Text node, bold 16px, with a divider line above (1px `#E2E7F0` rectangle) | Sub-sections within cards |
| **Body text** | Text node, regular 14px, secondary color, max-width fill | Descriptions, explanations |
| **Tables** | Frame rows: header row (bold 12px, grey background `#F5F5FA`), data rows (regular 14px). Fixed column widths. | Cards 3, 4, 5, 8 |
| **Color swatch dots** | 12px × 12px rectangle, cornerRadius 3, filled with token hex, placed in a horizontal auto-layout frame next to the token name text. **Never omit — every color token needs a visible swatch.** | Cards 2, 4, 8 |
| **Pink dimension lines** | 1px rectangles filled `#E91E8C` forming brackets (vertical line + horizontal ticks), with 11px text labels in `#E91E8C`. **Never omit from Specs sub-section.** | Card 3 (Specs) |
| **REQ/OPT badges** | Small auto-layout frame: colored bg + bold 10px uppercase text. REQ = red bg `#FEF3F2` + text `#C10C0D`. OPT = grey bg `#F5F5FA` + text `#888888`. | Card 5 |
| **Typography specimens** | Actual styled text nodes rendered at the documented font size/weight/family | Card 4 |
| **Code blocks** | Frame with dark background (`#1E1E2E`), padding 16px, monospace text (12px) with syntax-colored segments | Cards 8, 9 |
| **Do/Don't pairs** | Two side-by-side frames: green header bar (`#047800`, 4px height) + Do label, red header bar (`#C10C0D`, 4px height) + Don't label | Cards 6, 7 |
| **Component instances** | Import real library instances via `getComponentByKeyAsync()` for variant matrices and anatomy | Cards 2, 3 |
| **Pass/Exempt badges** | Text node: Pass = green `#047800`, Exempt = brown `#9C2000`, bold 12px | Card 8 |

### Per-card content requirements — Figma output MUST match HTML

The HTML spec is the source of truth. The Figma output must contain **every sub-section, table, and visual element** present in the HTML. Omitting content that exists in the HTML is a P0 bug.

**Card 2 — Actual component:**
- [ ] Variant matrix table: one row per variant type (Standalone, Inline, With icon, etc.) — **include ALL rows the HTML has**, not just the first two
- [ ] Each row × every interactive state (Enabled, Focused, Hovered, Pressed, Disabled) = one cell with the actual component rendered
- [ ] Theme comparison section: 3 cards (Actian, Studio, Explorer), each showing:
  - Theme label
  - Component rendered in that theme's primary color
  - 12px color swatch dots with labels (Primary, Pressed, Disabled)

**Card 3 — Anatomy:** Must include ALL 4 sub-sections (not 3, not 2 — all 4):
1. **Structure** — Component with lettered pointer badges (A, B, C...) overlaying each part + legend text listing each badge
2. **Specs** — **MANDATORY, DO NOT SKIP.** Size variants rendered with pink (`#E91E8C`) dimension annotation lines:
   - Height bracket (vertical line with horizontal ticks at top/bottom, measurement text)
   - Gap/spacing indicators (horizontal bracket between elements)
   - Focus ring offset indicators
   - Build as: 1px rectangles filled `#E91E8C` for lines, text nodes in `#E91E8C` for measurements
3. **States** — Horizontal grid showing every interactive state as rendered component instances with state labels above
4. **Parts reference** — Table with columns: Part (letter), Element, Token, Notes — one row per anatomical part (A through F typically)

**Card 4 — Design tokens:** Must include ALL 3 sub-sections:
1. **Color tokens** table:
   - [ ] Columns: Variant·State | Fill/Text color columns (varies by component)
   - [ ] **12px swatch dots are MANDATORY** — for every color token in the table, create a 12px × 12px rectangle filled with the hex value, placed inline (horizontally) next to the token name text. Do NOT show token names as plain text without swatches.
   - Build swatches as: `figma.createRectangle()`, 12×12, cornerRadius 3, filled with the token hex
2. **Sizing & spacing** table: Property | Token | Value — include height, padding, gap, border-radius, focus-ring width, touch target
3. **Typography** section: render actual text specimens at the documented font size/weight/family, with token name and metrics below each specimen

**Card 5 — Component API:**
- [ ] Props table with columns: REQ/OPT | Property | Type | Default | Values | Notes
- [ ] **REQ/OPT badges are MANDATORY** — create small rectangles (auto-sized to text) with:
  - REQ: red fill (`#FEF3F2`), red text (`#C10C0D`), bold 10px uppercase
  - OPT: grey fill (`#F5F5FA`), grey text (`#888888`), semibold 10px uppercase
- [ ] Property names in monospace (Fira Code or similar)
- [ ] Type values in purple (`#C792EA`) monospace
- [ ] Default values in green (`#C3E88D`) monospace

**Card 6 — Usage guidelines:** "When to use" (green `+`), "When NOT to use" (red `−`), and Do/Don't pairs as side-by-side frames with green/red header bars.

**Card 7 — Content guidelines:** Content rules with inline Do/Don't pairs. Optional terminology table if the component has domain-specific terms.

**Card 8 — Accessibility:**
- [ ] 2×3 grid of a11y requirement cards (Role, Keyboard, Focus ring, Touch target, Disabled state, Color independence)
- [ ] Each card: colored icon square (36px, NOT emoji) + title + body + dark code block
- [ ] **Contrast ratio table with swatch dots** — columns: Variant | Foreground (12px swatch + hex) | Background (12px swatch + hex) | Ratio | WCAG AA badge
- [ ] Pass badges in green (`#047800`), Exempt badges in grey/brown (`#9C2000`)

**Card 9 — Code specification:** Full CSS in a dark code block (`#1E1E2E` background). Use `--zen-*` token names with fallback hex values. Include syntax highlighting via colored text segments (purple for keywords, green for strings, blue for properties).

### Layout

Cards are arranged in a single horizontal row (matching the HTML brief layout where all 9 cards sit side by side):

```js
// Outer wrapper — horizontal auto-layout, all cards in a row
const wrapper = figma.createFrame();
wrapper.name = "Component Spec: [Name]";
wrapper.layoutMode = "HORIZONTAL";
wrapper.itemSpacing = 32;
wrapper.primaryAxisSizingMode = "AUTO";
wrapper.counterAxisSizingMode = "AUTO";
wrapper.fills = [];
```

The generation metadata frame is prepended as the first child (see `figma-output.md`), followed by the 9 card frames in order.

### Execution steps

1. **Import `Meta / Chrome / Generation Log` component** (key: `a9653f30925367e96dea90093d750bfe70849571`), set all 6 text properties using `setProp()`, append as first child of the wrapper.
2. **Build each card as a separate `use_figma` call** to stay under the 20KB code limit. Each call creates one card frame and appends it to the appropriate row.
3. **Parity check** — before presenting to the user, verify each card against the HTML spec:
   - Card 2: count variant rows in Figma vs HTML — must match (e.g., 3 rows, not 2)
   - Card 3: confirm all 4 sub-sections exist (Structure, **Specs with pink lines**, States, Parts reference)
   - Card 4: confirm swatch dots are visible (not just text)
   - Card 5: confirm REQ/OPT badges are rendered (not just text)
   - Card 8: confirm contrast table has swatch dots and Pass/Exempt badges
   - If anything is missing, fix it before proceeding
4. **Take a screenshot** with `get_screenshot` after all cards are built and show the result to the user.
5. **Ask for adjustments** — "Here is the spec page in Figma. Want me to adjust anything?"

### Figma target

If the user provided a Figma URL, extract `fileKey` and `nodeId`:
- `figma.com/design/:fileKey/:fileName?node-id=:nodeId` → convert `-` to `:` in nodeId

Only ask for the target if the user hasn't provided one.

## Step 4 — Assembler path (optional)

If the user says "use Assembler", "create it in Figma with Assembler", or "build the component":

1. Generate a `component-spec.json` from the brief:
   - Component name from Card 1 (Page header)
   - Variants from Card 2 (Actual component) and Card 5 (Component API)
   - Internal layout from Card 3 (Anatomy)
   - Text properties from Card 5 text props (mark as `"isProperty": true`)
   - Library: `"fat-marker"` (if FM mode) or `"ds2026"` (if Actian DS mode)
   - Use nested component instances where appropriate (e.g., buttons, icons)

2. Save to `assembler-specs/component-spec.json`

3. Tell the user: **"Open DS Assembler → Create tab → enter component-spec.json → Create Component"**

4. After creation, remind the user to:
   - Review the component in Figma
   - Publish to library if it's a shared component
   - Run `sync-all.js` to update the registry
