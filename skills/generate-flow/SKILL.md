---
name: generate-flow
description: Generate a Fat Marker wireframe flow from a user story and push to Figma. Use when user asks to create a flow, wireframe, or mockup for a feature.
argument-hint: "[feature description or Figma URL]"
---

# Generate Fat Marker Flow

> **Workflow A — Fat Marker (lo-fi).** This skill uses FM components, Inter font, and the simplified Fat Marker palette. NOT DS2026 tokens. See CLAUDE.md "Workflow A" for rules.
> **Content guidelines:** All UI copy must follow `references/content-guidelines.md` (in the skills directory). Read it before writing any screen copy.
> **Accessibility guidelines:** All flows must follow `references/accessibility-guidelines.md` (in the skills directory) — ensure keyboard navigation, focus order, ARIA landmarks, form labels, error states, and touch targets are designed. WCAG 2.1 AA.

Generate a low-fidelity user flow using Fat Marker components and push it to Figma.

## Input

The user describes a feature or user goal, and optionally provides reference material. Examples:
- "A user needs to request access to a data asset"
- "Admin creates a new governance policy"
- "Explorer browses the catalog and views item details"
- "Here are 3 competitor screenshots — build a flow inspired by these"

### Accepted reference formats

The user may provide reference screens alongside their request. Accept all of these:

| Format | How to handle |
|---|---|
| **Figma URL** (frame, page, or section) | Fetch with `get_design_context` + `get_screenshot` to analyze layout, components, and flow structure |
| **Image file path** (screenshot, photo) | Read the image with the `Read` tool to view it. Describe what you see — layout, components, flow steps, copy. |
| **Pasted image** (inline in chat) | Analyze directly. Describe layout, components, flow steps, and any UX patterns visible. |
| **Website URL** | Fetch with `WebFetch` to understand the page structure, or `WebSearch` for screenshots/reviews of the product |
| **PDF** (spec, wireframe, slide deck) | Read with the `Read` tool (specify pages if large). Extract screen layouts, flow structure, requirements. |

### How to use references

References inform the flow — they are not templates to copy verbatim. For each reference:

1. **Describe what you see** — layout structure, key components, flow steps, interaction patterns
2. **Extract what's useful** — patterns to adopt, information architecture, UX conventions
3. **Note what to avoid** — patterns that conflict with Actian conventions or FM component constraints
4. **Map to FM components** — which Fat Marker components can replicate what the reference shows

Include a "Reference analysis" section in your output (after competitor research, before the screen list):

```
### Reference analysis

**[Reference 1 — source name or filename]:**
- Layout: [what you observed — e.g., "sidebar + main content, tabbed detail view"]
- Key patterns: [what to adopt — e.g., "inline status badges in table rows, bulk action bar"]
- FM mapping: [how to recreate — e.g., "FM Table Cell (Pill variant) for status, FM Banner for bulk actions"]
- Skip: [what doesn't apply — e.g., "custom illustration style — use FM Empty State instead"]

**[Reference 2 — ...]:**
- ...
```

If no references are provided, skip this section and proceed normally.

If the user provides a Figma URL as **target** (where to put the output), use that file. Otherwise ask where to put the output.

## Step 1 — Understand the request

Before generating anything, clarify:
- **Feature name** (e.g., "Access Request", "Policy Creation")
- **User role** (Administrator, Data Steward, Explorer, or All roles)
- **App context** (Admin, Studio, or Explorer — determines the FM App_header variant)
- **Number of sub-flows** (e.g., happy path + error path + alternate role)
- **References provided?** — If yes, analyze them first (see above). If no, proceed to research.

If any of these are unclear, ask the user. Do not guess.

## Step 2 — Competitor & pattern research

Before designing, research how other products solve the same problem. This grounds the flow in real-world patterns rather than guessing.

### What to research
1. **Direct competitors** — How do similar data platforms handle this feature?
   - For data catalog features: Collibra, Alation, Atlan, data.world, Informatica
   - For governance/policy: Collibra, OneTrust, BigID
   - For data quality: Monte Carlo, Soda, Great Expectations
   - For general SaaS patterns: Linear, Notion, Figma, Stripe Dashboard
2. **UX pattern libraries** — Check established patterns for the interaction type:
   - Forms/wizards: multi-step vs single-page, progressive disclosure
   - Tables/lists: filtering, sorting, bulk actions, inline editing
   - Access/permissions: request flows, approval chains, role pickers
   - Empty states: onboarding, zero-data, error recovery

### How to research
- Use `WebSearch` to find screenshots, case studies, or documentation of competitor flows
- Use `WebFetch` on product pages, help docs, or blog posts that show the UX
- If the user shares competitor URLs or screenshots, analyze those first

### Output
Present findings as a brief summary before the screen list:

```
### Competitor & pattern research: [Feature]

**How others handle this:**
- [Product A]: [approach — e.g., "single-page form with inline validation, 4 fields"]
- [Product B]: [approach — e.g., "multi-step wizard, 3 steps, preview before submit"]
- [Product C]: [approach — e.g., "modal dialog with dropdown + text area"]

**Common patterns:**
- [Pattern observation — e.g., "All three use a confirmation step before the action takes effect"]
- [Pattern observation — e.g., "Approval flows always show the requester's context alongside the request"]

**Recommendation for our flow:**
- [What to adopt and why]
- [What to do differently and why]
```

If the user says "skip research" or the feature is highly specific to Actian, skip this step and note that no competitor research was done.

## Step 3 — Plan the screen list

Output a numbered screen list for the user to review BEFORE generating:

```
### Flow: [Feature] — [Sub-flow name]
**User:** [Role] | **App:** [Context]

1. [Screen name] — [What it shows]
2. [Screen name] — [What it shows]
3. ...
```

Include at minimum:
- Starting state (list/empty/dashboard)
- Action trigger (button click, menu selection)
- Form or input state (if applicable)
- Confirmation / success state
- Error state (if applicable)

Wait for user approval before proceeding.

## Step 4 — Generate the HTML

Create a single HTML file at `components/flows/[feature-name]-flow.html` using these Fat Marker components:

### Required components per screen
- **FM App_header** — top bar with logo, product label (Admin/Studio/Explorer), avatar
- **FM Side navigation bar** — left sidebar with placeholder items + one active item
- **FM Page Header** — title (+ optional subtitle) at top of content area

### Available components (use as needed)
Refer to `components/FATMARKER-COMPONENT-CATALOG.md` for the full inventory. Key ones:
- FM Button (Primary/Secondary/Outline)
- FM Text input field, FM Text Area, FM Dropdown, FM Search input field
- FM Input Label (with required asterisk where needed)
- FM Table Cell (Header/Text/Pill/Placeholder)
- FM Badge, FM Tag, FM Chip
- FM Checkbox, FM Radio button, FM Toggle
- FM Alert (Success/Error/Info/Warning)
- FM Banner (for persistent page-level notices)
- FM Toast (for brief confirmations)
- FM Dialog (for modal confirmations)
- FM Empty State (for zero-data screens)
- FM Placeholder (for non-essential content areas)
- FM Menu (for dropdown action menus)
- FM Tabs (for tabbed content)

### Flow structure in HTML
```html
<div class="flow-row">
  <!-- Dark cover card -->
  <div class="flow-cover">
    <div class="flow-cover__feature">[Feature]</div>
    <div class="flow-cover__flow">Flow: [Sub-flow]</div>
    <div class="flow-cover__user">User: [Role]</div>
  </div>
  <!-- Screens left to right -->
  <div class="screen"> ... </div>
  <div class="screen"> ... </div>
</div>
```

### Screen dimensions
- Standard: 1440x960px
- Compact (no sidebar): 1440x700px
- Always include FM App_header (70px) + FM Sidebar (260px) + content area

### Forms layout (from Design Consistency handoff)
- Simple form inputs (text, dropdown, textarea, radio, checkbox): constrain container to **480px max-width**, left-aligned in content area
- Extended elements (selectable rows, tiles, tables): **full-width** within the content area
- Multi-column layouts: forms stay **fluid** inside their containers
- Action footer: sticky bottom, primary actions right, secondary left

### Styling rules
- Use the FM CSS Reference below — do not deviate from these exact values
- Include the Figma capture script: `<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>`
- Load Inter font from Google Fonts
- Use screen labels above each frame (12px, #888)

### Fat Marker CSS Reference

**Copy these exact styles into every generated flow HTML. Do NOT approximate — use these exact hex values, font sizes, paddings, and border-radii.**

```css
/* ── FM Token Palette (from Figma FM library) ──────────────── */
:root {
  --fm-base-900:   #1A202C;
  --fm-base-800:   #2D3648;   /* Primary button fill, nav text */
  --fm-base-700:   #4A5468;
  --fm-base-600:   #717D96;
  --fm-base-500:   #A0ABC0;
  --fm-base-400:   #CBD2E0;   /* Borders, disabled fills */
  --fm-base-300:   #E2E7F0;
  --fm-base-200:   #EDF0F7;   /* Active nav bg, hover, dividers */
  --fm-base-100:   #F5F5FA;
  --fm-base-white: #FFFFFF;
  --fm-brand:      #0550DC;
  --fm-brand-dark: #0029A9;
  --fm-brand-light:#EDF6FF;
  --fm-text-primary:  #101828;
  --fm-text-secondary:#2D3648;
  --fm-text-tertiary: #475467;
  --fm-text-error:    #D92D20;
  --fm-text-light:    #6D6D6D;
  --fm-text-success:  #047800;
  --fm-border:     #CBD2E0;
  --fm-bg-grey:    #F5F5FA;
  --fm-placeholder: #A0ABC0;
  --fm-shadow-default: 0px 2px 8px 0px rgba(0,0,0,0.13);
  --fm-radius:     6px;
}

/* ── FM App Header (WHITE bg, all variants) ────────────────── */
.fm-app-header {
  width: 100%; height: 70px;
  background: var(--fm-base-white);
  border-bottom: 2px solid var(--fm-base-400);
  display: flex; align-items: center;
  padding: 16px 28px; gap: 12px;
}
.fm-app-header__logo {
  display: flex; align-items: center; gap: 12px;
  mix-blend-mode: luminosity; flex-shrink: 0;
}
.fm-app-header__logo-icon {
  width: 30px; height: 25px;
  background: var(--fm-base-400); border-radius: 2px;
}
.fm-app-header__brand-text {
  display: flex; flex-direction: column; line-height: 1.2;
}
.fm-app-header__brand-line1 {
  font-size: 11px; font-weight: 400;
  color: var(--fm-base-700); letter-spacing: 0.2px;
}
.fm-app-header__brand-line2 {
  font-size: 13px; font-weight: 700; color: var(--fm-base-900);
}
.fm-app-header__spacer { flex: 1; }
.fm-app-header__icon-btn {
  width: 24px; height: 24px;
  background: var(--fm-base-300); border-radius: 4px;
}
.fm-app-header__avatar {
  width: 36px; height: 36px;
  background: var(--fm-base-400); border-radius: 50%;
}

/* ── FM Side Navigation Bar ────────────────────────────────── */
.fm-sidebar {
  width: 260px; background: var(--fm-base-white);
  padding: 28px 16px 8px 16px;
  display: flex; flex-direction: column; flex-shrink: 0;
}
.fm-sidebar__section {
  display: flex; flex-direction: column; gap: 4px; flex: 1;
}
.fm-sidebar__section--bottom {
  flex: 0; border-top: 1px solid var(--fm-base-200);
  padding-top: 16px; margin-top: auto;
}
.fm-sidebar__item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 8px 12px 16px; border-radius: 8px;
  font-size: 14px; font-weight: 400; color: var(--fm-base-800);
  letter-spacing: -0.14px; line-height: 1.5;
}
.fm-sidebar__item--active {
  background: var(--fm-base-200); font-weight: 600;
}
.fm-sidebar__icon {
  width: 20px; height: 20px;
  border: 1.5px solid var(--fm-base-500); border-radius: 4px;
  flex-shrink: 0;
}
.fm-sidebar__chevron {
  width: 20px; height: 20px; margin-left: auto;
  color: var(--fm-base-500); display: flex;
  align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}

/* ── FM Button ─────────────────────────────────────────────── */
.fm-button {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 10px; padding: 12px 16px; border-radius: 6px;
  font-family: 'Inter', sans-serif; font-weight: 600;
  font-size: 16px; line-height: 22px; letter-spacing: -0.32px;
  cursor: pointer; border: none; white-space: nowrap; height: 48px;
}
.fm-button--primary { background: var(--fm-base-800); color: white; }
.fm-button--secondary { background: white; color: var(--fm-base-800); }
.fm-button--outline {
  background: transparent; color: var(--fm-base-800);
  border: 2px solid var(--fm-base-800);
}
.fm-button--text {
  background: transparent; color: var(--fm-brand);
  padding: 10px 4px; border: none; height: auto;
}
.fm-button--disabled { background: var(--fm-base-400); color: white; cursor: not-allowed; }
.fm-button--sm {
  padding: 8px 16px; font-size: 14px;
  letter-spacing: -0.28px; height: auto;
}

/* ── FM Page Header ────────────────────────────────────────── */
.fm-page-header__title {
  font-weight: 600; font-size: 24px; line-height: 34.32px;
  color: var(--fm-text-primary);
}
.fm-page-header__subtitle {
  font-weight: 400; font-size: 14px; line-height: 22.88px;
  color: var(--fm-text-tertiary); margin-top: 4px;
}

/* ── FM Input Label ────────────────────────────────────────── */
.fm-input-label { display: flex; gap: 4px; align-items: baseline; }
.fm-input-label__text {
  font-weight: 500; font-size: 14px; line-height: 16px;
  color: #1A202C;
}
.fm-input-label__required {
  font-weight: 700; font-size: 12px; color: #D92D20;
}

/* ── FM Text Input ─────────────────────────────────────────── */
.fm-text-input {
  width: 100%; height: 40px;
  border: 1px solid var(--fm-border); border-radius: 6px;
  padding: 8px 12px; font-family: 'Inter', sans-serif;
  font-size: 14px; letter-spacing: -0.28px; line-height: 22px;
  color: #1A202C; background: white;
}
.fm-text-input::placeholder { color: var(--fm-placeholder); }

/* ── FM Alert ──────────────────────────────────────────────── */
.fm-alert {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 12px 16px; height: 48px; border-radius: 6px;
  box-shadow: 0px 2px 8px rgba(0,0,0,0.2);
}
.fm-alert--success { background: #EDF0F7; }
.fm-alert--error { background: #FCF3F3; }
.fm-alert--info { background: #EDF0F7; }
.fm-alert__text { font-size: 16px; line-height: 22px; color: #1A202C; }

/* ── FM Tag ────────────────────────────────────────────────── */
.fm-tag {
  display: inline-flex; align-items: center;
  padding: 2px 10px; border-radius: 9999px;
  font-size: 12px; font-weight: 500; line-height: 20px;
}
```

### FM App Header HTML structure
```html
<div class="fm-app-header">
  <div class="fm-app-header__logo">
    <div class="fm-app-header__logo-icon"></div>
    <div class="fm-app-header__brand-text">
      <span class="fm-app-header__brand-line1">Actian Data Intelligence</span>
      <span class="fm-app-header__brand-line2">Studio</span>
      <!-- Use "Administration" for Admin, "Explorer" for Explorer -->
    </div>
  </div>
  <div class="fm-app-header__spacer"></div>
  <div class="fm-app-header__icon-btn"></div>
  <div class="fm-app-header__icon-btn"></div>
  <div class="fm-app-header__avatar"></div>
</div>
```

### FM Sidebar HTML structure
```html
<div class="fm-sidebar">
  <div class="fm-sidebar__section">
    <div class="fm-sidebar__item fm-sidebar__item--active">
      <div class="fm-sidebar__icon"></div>
      <span>Active Item</span>
      <div class="fm-sidebar__chevron">›</div>
    </div>
    <div class="fm-sidebar__item">
      <div class="fm-sidebar__icon"></div>
      <span>Nav Item</span>
      <div class="fm-sidebar__chevron">›</div>
    </div>
  </div>
  <div class="fm-sidebar__section fm-sidebar__section--bottom">
    <div class="fm-sidebar__item">
      <div class="fm-sidebar__icon"></div>
      <span>Settings</span>
      <div class="fm-sidebar__chevron">›</div>
    </div>
  </div>
</div>
```

## Step 5 — Capture to Figma

1. Ensure the local HTTP server is running on port 8765 (or start one)
2. Call `generate_figma_design` with `outputMode: "existingFile"` and the target file key/node
3. Open the HTML file with the capture hash URL
4. Poll until capture completes
5. Share the Figma link with the user

## Step 6 — Review

After capture, get a screenshot of the result and show it to the user. Ask if they want adjustments before considering it done.

---

## Real Components Mode (opt-in)

When the user says **"use real components"**, **"assemble in Figma"**, or **"use native components"**, switch from HTML generation to layout spec JSON output.

### How it works

Instead of generating HTML, output a JSON layout spec file that the [Actian DS Assembler](https://github.com/volivarii/Actian-DS-Assembler) Figma plugin can consume.

1. Generate a layout spec JSON using the schema below
2. Reference components by their exact registry names (FM-prefixed for wireframes)
3. Use auto-layout frames with `"hug"` / `"fill"` sizing — avoid hardcoded pixel positions
4. Save as `spec.json` in the project root and serve on localhost:8765 using `python3 serve.py 8765`
5. Tell the user: "Open the Actian DS Assembler plugin in Figma and click Assemble"

### Layout spec schema

Two node types: **frames** (layout containers) and **instances** (component references).

**Frame node:**
```json
{
  "type": "frame",
  "name": "Content Area",
  "layout": "vertical",
  "spacing": 16,
  "padding": { "top": 24, "right": 24, "bottom": 24, "left": 24 },
  "fill": "--zen-color-background-bg-default",
  "width": "fill",
  "height": "hug",
  "align": "min",
  "counterAlign": "min",
  "children": []
}
```

**Instance node:**
```json
{
  "component": "FM Button",
  "props": { "Type": "Primary" },
  "text": { "Label": "Save" },
  "width": "fill"
}
```

- `width` / `height`: number (fixed px), `"hug"`, or `"fill"`
- `align`: `"min"` | `"center"` | `"max"` | `"space-between"` (primary axis)
- `counterAlign`: `"min"` | `"center"` | `"max"` (counter axis)
- `fill`: `--zen-*` token name or hex value
- `component`: exact name from the registry (see list below)

### FM Kit component names (use exactly)

**Layout:** `FM App_header`, `FM Side navigation bar`, `FM Side navigation item`, `FM Tabs`, `FM Tab`, `FM Sidepanel`, `FM Menu`, `FM Menu item`

**Inputs:** `FM Text input field`, `FM Text Area`, `FM Search input field`, `FM Dropdown`, `FM Multi-select dropdown`, `FM Date input`, `FM Checkbox`, `FM Radio button`, `FM Toggle`, `FM Slider`

**Actions:** `FM Button`, `FM Icon Buttons`

**Data:** `FM Table Cell`, `FM Table example`, `FM Badge`, `FM Tag`, `FM Chip`

**Feedback:** `FM Alert`, `FM Banner`, `FM Toast`, `FM Dialog`, `FM Empty State`, `FM Progress bar`, `FM Spinner`, `FM Tooltip`

**Other:** `FM Placeholder`, `FM User`, `FM Cursor`

### Full screen example

```json
{
  "version": "1.0",
  "name": "Settings Page",
  "type": "frame",
  "layout": "vertical",
  "width": 1440,
  "height": 900,
  "children": [
    { "component": "FM App_header", "width": "fill" },
    {
      "type": "frame",
      "layout": "horizontal",
      "width": "fill",
      "height": "fill",
      "children": [
        { "component": "FM Side navigation bar", "height": "fill" },
        {
          "type": "frame",
          "name": "Content",
          "layout": "vertical",
          "spacing": 16,
          "padding": { "top": 24, "right": 24, "bottom": 24, "left": 24 },
          "width": "fill",
          "children": [
            { "component": "FM Text input field", "width": "fill" },
            {
              "type": "frame",
              "layout": "horizontal",
              "spacing": 8,
              "children": [
                { "component": "FM Button", "props": { "Type": "Primary" } },
                { "component": "FM Button", "props": { "Type": "Secondary" } }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Fallback

If the user hasn't set up the Figma plugin, fall back to the standard HTML workflow (Steps 4–6 above).
