---
name: generate-flow
description: Use this skill whenever the user wants to turn a feature idea or user story into lo-fi wireframe screens in Figma. Researches competitor patterns, plans a screen list, generates Fat Marker wireframes using FM Kit components, and pushes them to Figma via the DS Assembler plugin. Triggers when the user asks to create a flow, wireframe, or mockup, describes a feature and wants to see screens for it, asks how a user would accomplish a task, wants to mock up an experience, or provides a user story and wants it visualized as a multi-screen flow.
argument-hint: "[feature description or Figma URL]"
---

# Generate Fat Marker Flow

> **Workflow A — Fat Marker (lo-fi).** This skill uses FM components, Inter font, and the simplified Fat Marker palette. NOT DS2026 tokens. See CLAUDE.md "Workflow A" for rules.
> **Content guidelines:** All UI copy must follow `../../docs/content-guidelines.md`. Read it before writing any screen copy.
> **Accessibility guidelines:** All flows must follow `../../docs/accessibility-guidelines.md` — ensure keyboard navigation, focus order, ARIA landmarks, form labels, error states, and touch targets are designed. WCAG 2.1 AA.
> **Quality & hygiene:** Validate all output against CLAUDE.md Quality & Hygiene Checklist before marking complete.
> **Generation log:** Follow the Generation Log format in CLAUDE.md for all output files.

Generate a low-fidelity user flow using Fat Marker components and push it to Figma.

> **Mode: Implement with review gate.** Build first, explain after. Move fast — infer details and make reasonable decisions instead of asking for every detail. Two acceptable pauses: (1) Step 1 if critical context is genuinely missing (feature name, user role, app context), and (2) Step 3 to confirm the screen list before generating — regenerating wrong screens is expensive. The cleanup pass (Step 7) handles polish. Keep status updates to milestones only.

## Input

The user describes a feature or user goal, and optionally provides reference material. Examples:
- "A user needs to request access to a data asset"
- "Admin creates a new configuration rule"
- "User browses the directory and views item details"
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

Before generating anything, determine from the user's request:
- **Feature name** (e.g., "Approval Workflow", "Rule Configuration")
- **User role** (Administrator, Reviewer, Viewer, or All roles)
- **App context** (Admin, Studio, or Explorer — determines the FM App_header variant)
- **Number of sub-flows** (e.g., happy path + error path + alternate role)
- **References provided?** — If yes, analyze them first (see above). If no, proceed to research.

Infer as much as possible. Only ask if critical context is genuinely missing — e.g., the user said "create a flow" with no feature described, or the app context could be any of the three and it materially changes the UI.

**Output type defaults to Assembler spec.** Only use HTML capture if the user explicitly asks for it or doesn't have the assembler plugin.

## Step 2 — Competitor & pattern research

Before designing, research how other products solve the same problem. This grounds the flow in real-world patterns rather than guessing.

### What to research
1. **Direct competitors** — How do similar data platforms handle this feature?
   - Common enterprise SaaS competitors: Collibra, Alation, Atlan, data.world, Informatica, OneTrust, BigID, Monte Carlo, Soda, Great Expectations
   - General SaaS patterns: Linear, Notion, Figma, Stripe Dashboard
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

### Research frame (optional)

If the user requests it, include the research summary as an additional Figma frame at the start of the flow. This creates a permanent reference alongside the wireframes.

**Format:** A dark-background card (same style as flow cover cards) containing:
- Title: "Research: [Feature]"
- Competitor findings (bulleted)
- Common patterns (bulleted)
- Recommendation summary
- Sources list

**Styling:** Use `--fm-base-900` background, `--fm-base-white` text, `--fm-base-400` for dividers. Same width as flow screens (1440px), height auto. Typography: `fm-page-header__title` for section headings, 14px Inter for body.

**When to offer:** After completing research in Step 2, ask: "Want me to include the research summary as a frame in the flow?" — or include automatically if the user has previously requested it.

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

If any screen requires elements not in the FM library (e.g., charts, visualizations, custom controls), note them in the screen list so the user can review before generation:
```
3. Dashboard — Overview metrics
   ⚡ Custom: bar chart (category breakdown), sparkline (trend)
```

Wait for user approval before proceeding.

## Step 4 — Generate the HTML

Create a single HTML file at `components/flows/[feature-name]-flow.html` using these Fat Marker components:

### Required components per screen
- **FM App_header** — top bar with logo, product label (Admin/Studio/Explorer), avatar
- **FM Side navigation bar** — left sidebar with placeholder items + one active item
- **FM Page Header** — title (+ optional subtitle) at top of content area

### Available components (use as needed)
Refer to `../../docs/fm-components.md` for the full inventory. Key ones:
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

### Custom elements (when the library doesn't cover it)

The FM library doesn't have everything — charts, visualizations, custom controls, specialized layouts, etc. When no FM component fits, build a custom element inline.

**Rules:**
1. **FM first** — always check `../../docs/fm-components.md` before going custom. If an FM component can do the job (even approximately), use it.
2. **Follow FM conventions** — custom elements must use:
   - `--fm-*` CSS variables for all colors (no raw hex)
   - FM spacing scale (4, 8, 12, 16, 24, 28, 32px)
   - FM typography (Inter, same sizes/weights as FM components)
   - FM border radius (`var(--fm-radius)` / 6px) and border color (`var(--fm-border)`)
3. **Prefix with `fm-custom-`** — use class names like `fm-custom-chart`, `fm-custom-timeline`, `fm-custom-drag-zone` so they're visually distinct from library components
4. **Comment what it represents** — add a brief HTML comment above each custom element: `<!-- Custom: [what this is and why no FM component fits] -->`
5. **Keep it lo-fi** — these are wireframes. A chart is a labeled rectangle with axis lines, not a D3 visualization. A drag zone is a dashed-border area with a label. Match the fidelity level of FM components.

### Flow structure in HTML

**One row per flow.** Each flow (sub-flow) must be a single horizontal `flow-row` with all its screens side by side. Never split a flow across multiple rows. Use `flex-wrap: nowrap` to prevent wrapping. The same rule applies to assembler specs — all screens for a flow go in one horizontal wrapper frame.

```html
<div class="flow-row"> <!-- One row = one complete flow, all screens in a line -->
  <!-- Generation card (first element in the first flow-row only) -->
  <!-- See CLAUDE.md Generation Metadata for the .gen-card HTML -->

  <!-- Dark cover card -->
  <div class="flow-cover">
    <div class="flow-cover__feature">[Feature]</div>
    <div class="flow-cover__flow">Flow: [Sub-flow]</div>
    <div class="flow-cover__user">User: [Role]</div>
  </div>
  <!-- ALL screens for this flow, left to right -->
  <div class="screen"> ... </div>
  <div class="screen"> ... </div>
  <div class="screen"> ... </div>
  <!-- Do NOT close the flow-row and start a new one mid-flow -->
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
- Action footer: inside the **content area** (not the full screen), sticky bottom, primary actions right, secondary left. The footer sits alongside the sidebar, not spanning the entire screen width.

### Styling rules
- Use the FM CSS Reference below — do not deviate from these exact values
- Include the Figma capture script: `<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>`
- Load Inter font from Google Fonts
- Use screen labels above each frame (12px, #888)

### Fat Marker CSS Reference

Read `../../references/fm-css-reference.md` for the complete FM CSS token palette, component styles, and HTML structure templates. Copy those exact styles into every generated flow HTML — do not approximate values.

## Step 5 — Choose output mode

Three approaches are available. The first two can both import real library components with correct tokens.

| | Assembler | Plugin API (`use_figma`) | HTML capture |
|---|---|---|---|
| **Library components** | Yes — with Figma variables | Yes — via `getComponentByKeyAsync()` with Figma variables | No (flat vectors) |
| **Tokens on library instances** | Automatic | Automatic | CSS variables |
| **Tokens on scaffolding** | Resolved to Figma variables | Hex from Token Reference | CSS variables |
| **Text overrides** | Reliable (`textOverrides` key) | Needs layer name matching | N/A |
| **Editable in Figma** | Fully | Fully (real instances) | No (static frames) |
| **Speed** | Medium (user opens plugin) | Fast (direct in Figma) | Medium (serve + capture) |
| **Requires** | DS Assembler plugin | `use_figma` MCP tool | `generate_figma_design` MCP tool |

**Default:** Plugin API (Option B) for speed. Assembler (Option A) when you need Figma variable bindings on scaffolding or a reviewable JSON spec. HTML capture (Option C) as a last resort.

### Option A: Assembler (declarative, production)

Generates a JSON spec. The Assembler resolves all tokens to Figma variables — including scaffolding.

1. Generate a layout spec JSON — read `../../references/layout-spec-schema.md` for the schema
2. Reference components by their exact names from `../../docs/fm-components.md`
3. Use auto-layout frames with `"hug"` / `"fill"` sizing — avoid hardcoded pixel positions
4. Use `--fm-*` token names for fills (the Assembler resolves them to Figma variables)
5. For custom elements, use raw `"type": "frame"` nodes with `fill`, `stroke`, and `text` children
6. Save as `assembler-specs/spec.json`
7. Serve the project directory: `scripts/ensure-server.sh . 8765`
8. Tell the user: **"Open the Actian DS Assembler plugin in Figma and click Assemble"**

### Option B: Plugin API (`use_figma`)

Builds the flow directly in Figma via JavaScript. Imports published library components via `figma.teamLibrary.getComponentByKeyAsync()` — imported instances arrive with all their styles and Figma variables intact.

**Use when:**
- The user wants fast, direct creation (default)
- The user doesn't have the Assembler plugin
- Any complexity level — library imports work

**What has correct tokens automatically:** All imported FM Kit instances (FM App_header, FM Side navigation bar, FM Table Cell, FM Button, FM Tabs, FM Dropdown, etc.) bring their own bound Figma variables.

**What needs hex from the Token Reference:** Only custom scaffolding — wrapper frames, content area backgrounds, cover cards, generation log, custom text nodes.

**Rules for `use_figma` code:**

1. **Import library components** for all standard UI elements — never recreate FM components as raw frames
2. **Build each screen as a frame** with auto-layout — no absolute positioning
3. **Use token hex values** from the FM Token Reference below for scaffolding only:
   ```js
   frame.fills = [{ type: 'SOLID', color: hexToRgb('#F5F5FA') }]; // --fm-base-100
   ```
4. **Build standard screen structure**: FM App_header → horizontal frame → FM Side navigation bar + Content area
5. **Include a generation metadata frame** as the first element (see CLAUDE.md Generation Metadata)
6. **Set descriptive names** on every layer — no "Frame 1" or "Rectangle 2"
7. **Set text content contextually** on all instances (nav items, page headers, button labels) — no generic placeholder text
8. **One row per flow**: all screens for a sub-flow in a single horizontal wrapper frame

### Option C: HTML capture (fallback)

Generates flat vector frames via `generate_figma_design`. Use only when:
- The user says "use HTML" or "capture as HTML"
- Neither Assembler nor `use_figma` is available

Follow Step 4 (Generate the HTML) above, then capture via `../../references/figma-output.md`.

---

## FM Token Reference

Use these exact values when writing `use_figma` code. In assembler specs, use the token name. In HTML, use the `var(--fm-*)` CSS variable.

| Token | Hex | Usage |
|-------|-----|-------|
| `--fm-base-900` | `#1A202C` | Darkest background, cover cards |
| `--fm-base-800` | `#2D3648` | Primary button fill, nav text |
| `--fm-base-700` | `#4A5468` | Secondary text |
| `--fm-base-600` | `#717D96` | Muted text, labels |
| `--fm-base-500` | `#A0ABC0` | Placeholder text, icon borders |
| `--fm-base-400` | `#CBD2E0` | Borders, disabled fills, header border |
| `--fm-base-300` | `#E2E7F0` | Subtle borders |
| `--fm-base-200` | `#EDF0F7` | Active nav bg, hover, dividers |
| `--fm-base-100` | `#F5F5FA` | Light background, content bg |
| `--fm-base-white` | `#FFFFFF` | White, card/sidebar/header bg |
| `--fm-brand` | `#0550DC` | Brand blue, links |
| `--fm-text-primary` | `#101828` | Primary text, headings |
| `--fm-text-secondary` | `#2D3648` | Secondary text |
| `--fm-text-tertiary` | `#475467` | Tertiary text, subtitles |
| `--fm-text-error` | `#D92D20` | Error text, required markers |
| `--fm-text-success` | `#047800` | Success text |
| `--fm-border` | `#CBD2E0` | Default border color |
| `--fm-radius` | `6px` | Default border radius |

**Spacing scale:** 4, 8, 12, 16, 24, 28, 32px only.

For the full CSS reference (component styles + HTML structure templates), read `../../references/fm-css-reference.md`.

---

## Step 6 — Review

After capture or assembly, get a screenshot of the result and show it to the user. Ask if they want adjustments before considering it done.

## Step 7 — Cleanup pass

After generation is complete and before presenting to the user as done, run a focused cleanup sweep on the output. This is a mandatory self-review — do not skip it.

### Checklist

Work through each item. Fix issues inline, don't just flag them.

**Token compliance:**
- [ ] No arbitrary hex colors — use `--fm-*` CSS variables (HTML), token names (assembler), or hex from Token Reference with token comment (Plugin API)
- [ ] No hardcoded font sizes or weights — use FM text styles
- [ ] Spacing values match the FM scale (4, 8, 12, 16, 24, 28, 32px)

**Component consistency:**
- [ ] All FM component names match exactly: `FM Button`, `FM Text input field`, etc. — no abbreviations or renames
- [ ] Component variants use correct axis names and values from the FM catalog
- [ ] FM App_header, FM Side navigation bar, and FM Page Header present on every screen
- [ ] Custom elements use `fm-custom-` prefix and have an HTML comment explaining what they are
- [ ] Custom elements use `--fm-*` variables, FM spacing, FM typography — no raw hex or arbitrary values
- [ ] Custom elements match FM fidelity level (lo-fi wireframe shapes, not high-detail renders)
- [ ] FM components use `textOverrides` to set contextual labels (nav items, tabs, page headers) — no generic "Nav Item" or "Tab 1" text
- [ ] Generation metadata card included as first element (visible, not a comment)

**Forms layout (CLAUDE.md rules):**
- [ ] Simple form inputs constrained to 480px max-width container
- [ ] Extended elements (tables, selectable rows, tiles) are full-width
- [ ] Action footer: sticky bottom, primary right, secondary left

**Missing states:**
- [ ] Empty state screen included (or noted as out of scope)
- [ ] Error state for form submissions included
- [ ] Loading/progress state where async operations occur
- [ ] Confirmation/success state after primary action

**Content guidelines:**
- [ ] Button labels: action verbs, title case, no "Click here"
- [ ] Form labels: concise, no colons
- [ ] Error messages: explain what happened + how to fix
- [ ] Screen names follow convention: `[Persona] - [Page] - [State/Action]`

**Accessibility basics:**
- [ ] Interactive elements have visible focus indicators
- [ ] Form inputs have associated labels
- [ ] No text below 11px
- [ ] Color is not the only way to convey status (icons/text accompany color)

### How to apply fixes

- Fix issues directly in the HTML or spec JSON — do not create a separate report
- If a fix requires adding a missing screen (e.g., empty state), add it
- If a fix is ambiguous or would change the user's intent, note it for the review step instead of fixing silently
