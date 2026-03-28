---
name: generate-flow
description: Use when the user wants to create a flow, wireframe, or mockup from a feature idea or user story, asks how a user would accomplish a task, wants to mock up an experience, or provides a user story and wants it visualized as a multi-screen flow.
argument-hint: "[feature description or Figma URL]"
---

# Generate Fat Marker Flow

> **Workflow A — Fat Marker (lo-fi).** This skill uses FM components, Inter font, and the simplified Fat Marker palette. NOT DS2026 tokens. See CLAUDE.md "Workflow A" for rules.
> **Shared rules apply:** Content guidelines, accessibility guidelines (WCAG 2.1 AA), quality & hygiene checklist, and generation log format — all per CLAUDE.md.

Generate a low-fidelity user flow using Fat Marker components and push it to Figma.

**When NOT to use:** If the user wants a *presentation deck* → use `generate-presentation`. If the user wants to *compare* two existing flows → use `compare-flows`. If the user wants to *audit* a flow → use `design-audit`.

> **Mode: Implement with review gates.** Build first, explain after. Move fast — infer details and make reasonable decisions instead of asking for every detail. However, pause at these structured gates: (1) Step 1 if critical context is genuinely missing, (2) Step 2 research opt-in — always ask, (3) Step 3 screen list confirmation, and (4) Step 4.5 HTML preview before Figma push. Between gates, do not pause or ask questions. The cleanup pass (Step 7) handles polish.

### Quality tier detection

| Signal | Tier | Effect |
|--------|------|--------|
| "quick", "rough", "draft" | Draft | Happy path only (3-5 screens), minimal text overrides |
| No qualifier (default) | Standard | Happy path + error/empty states, full FM component overrides |
| "production", "final" | Production | All paths + loading states + edge cases, variable binding |

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
- **References provided?** — If yes, analyze them first (see above). If a reference is *mentioned* but not attached (e.g., "inspired by this reference" with no URL/image), ask the user to provide it before proceeding.
- **Prototype requested?** — Check if the user's prompt includes "prototype", "interactive", "playable", "clickable", or "test it". If yes, generate the prototype automatically after Step 4 (no need to offer at the gate).

### App context inference guide

| Signal in prompt | App context | Why |
|---|---|---|
| "admin", "configure", "manage users", "permissions", "rules", "settings" | **Admin** | System configuration and governance |
| "developer", "pipeline", "integration", "transform", "build", "deploy" | **Studio** | Data engineering and building |
| "analyst", "browse", "search", "explore", "preview", "discover", "request access" | **Explorer** | Data consumption and discovery |
| "user" (generic), "profile", "notifications" | **Admin** (default) | Cross-product features default to Admin |

For **multi-role flows** (e.g., "requester and approver"), each role maps to its own app context: a requester browsing data = Explorer, an approver managing access = Admin. Each sub-flow gets its own App_header variant.

Infer as much as possible. Only ask if critical context is genuinely missing — e.g., the user said "create a flow" with no feature described, or the app context could be any of the three and it materially changes the UI.

### Detail view pattern

When a flow includes viewing a record's details from a list, commit to one pattern:

| Pattern | When to use | Screen structure |
|---|---|---|
| **Full detail page** | Complex records with tabs, actions, metadata | New screen with FM Page Header (Title + Subtitle), FM Tabs for sections |
| **Side panel** | Quick preview without losing list context | Same screen, content area split: table (left) + detail panel (right) |
| **Expanded row** | Simple records with 2-3 extra fields | Same screen, selected row expands inline |

Default to **full detail page** unless the prompt implies staying on the list.

**Output type: `use_figma`** (Plugin API) — builds directly in Figma via MCP.

## Step 2 — Research (opt-in)

If the user's prompt already indicates their research preference (e.g., "no research", "just build it", or provides reference URLs/files), treat that as the answer and skip the question. Otherwise, ask:

> "Should I research competitor patterns for this flow?
> - **Yes** — I'll look at how other SaaS products handle this
> - **No, here are references:** — share Figma URLs, screenshots, or websites and I'll use those instead
> - **No, just build it** — I'll use Actian DS guidelines and conventions only"

**Wait for the user's response** (unless already answered in the prompt). Then:

- **Yes** → run competitor research (see below)
- **References provided** → analyze the provided material (see "Accepted reference formats" above), skip competitor research
- **No** → skip to Step 3, note that no research was done

### Competitor research (when opted in)

Research how other products solve the same problem. This grounds the flow in real-world patterns rather than guessing.

**What to research:**
1. **Direct competitors** — How do similar data platforms handle this feature?
   - Common enterprise SaaS competitors: Collibra, Alation, Atlan, data.world, Informatica, OneTrust, BigID, Monte Carlo, Soda, Great Expectations
   - General SaaS patterns: Linear, Notion, Figma, Stripe Dashboard
2. **UX pattern libraries** — Check established patterns for the interaction type:
   - Forms/wizards: multi-step vs single-page, progressive disclosure
   - Tables/lists: filtering, sorting, bulk actions, inline editing
   - Access/permissions: request flows, approval chains, role pickers
   - Empty states: onboarding, zero-data, error recovery

**How to research:**
- Use `WebSearch` to find screenshots, case studies, or documentation of competitor flows
- Use `WebFetch` on product pages, help docs, or blog posts that show the UX

**Output:**
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

### Research frame (included by default when research was done)

When research was conducted (competitor research or reference analysis), **always include** the research summary as the first screen in the HTML output, before the flow screens. This ensures the research context is preserved alongside the wireframes.

**Format:** A dark-background card (same style as flow cover cards) containing:
- Title: "Research: [Feature]"
- Competitor findings (bulleted)
- Common patterns (bulleted)
- Recommendation summary
- Sources list

**Styling:** Use `--fm-base-900` background, `--fm-base-white` text, `--fm-base-400` for dividers. Same width as flow screens (1440px), height auto. Typography: `fm-page-header__title` for section headings, 14px Inter for body.

**Skip only if:** The user explicitly says "no research card" or "skip the research frame".

## Step 3 — Plan the screen list

Output a numbered screen list for the user to review BEFORE generating:

```
### Flow: [Feature] — [Sub-flow name]
**User:** [Role] | **App:** [Context]

1. [Screen name] — [What it shows]
2. [Screen name] — [What it shows]
3. ...
```

### Screen templates by flow type

**Action flows** (create, edit, submit, configure):
- Starting state (list or empty state)
- Action trigger (button click, menu selection)
- Form or input state
- Confirmation / success state
- Error state (validation, failure)

**Viewing/dashboard flows** (browse, monitor, review):
- Populated view (the main content — table, dashboard, detail page)
- Empty state (no data yet)
- Error state (data load failure)
- Optionally: filtered/searched view, drill-down/detail view

**Multi-role flows** (requester + approver, viewer + editor):
- One sub-flow per role, each with its own cover card and App_header variant
- Each sub-flow follows its own template (action or viewing)

If any screen requires elements not in the FM library (e.g., charts, visualizations, custom controls), note them in the screen list so the user can review before generation:
```
3. Dashboard — Overview metrics
   ⚡ Custom: bar chart (category breakdown), sparkline (trend)
```

Wait for user approval before proceeding.

## Step 4 — Generate the HTML

Create a single HTML file at `{project_working_directory}/components/flows/[feature-name]-flow.html` (absolute path based on user's project directory, never relative to the plugin). Read `flow-html-reference.md` for the complete HTML template structure, FM component inventory, custom element rules, flow structure, screen dimensions, forms layout, and styling rules.

**Key rules:**
- **One row per flow** — never split across rows
- **FM first** — check `../../docs/fm-components.md` before custom elements
- **Custom elements** — prefix `fm-custom-`, use `--fm-*` vars, keep lo-fi
- **Screen sizes**: Standard 1440x960px, Compact 1440x700px
- **Forms**: inputs 480px max-width, extended elements full-width
- **Styles**: read `../../references/fm-css-reference.md` — copy exact values

### Content quality — contextual text, not generic

Every text element must be specific to the feature domain. Generic text is a bug.

| Element | Generic (wrong) | Contextual (right) |
|---|---|---|
| Page header | "Page Title", "New Item" | "Schedule Data Refresh", "Create Connection" |
| Button label | "Submit", "Save", "Button" | "Schedule Refresh", "Test Connection", "Approve Request" |
| Nav items | "Item 1", "Item 2", "Page 1" | "Datasets", "Schedules", "Connections", "Settings" |
| Empty state | "No items found" | "No scheduled refreshes yet — set up automatic data refreshes" |
| Toast | "Success", "Done" | "Connection saved successfully" |
| Input placeholder | "Enter text", "Type here" | "e.g., db.example.com", "Select a dataset" |
| Table headers | "Column 1", "Name" | "Dataset", "Frequency", "Next Refresh", "Status" |
| Dropdown options | "Option 1", "Option 2" | "Every hour", "Every day at 6:00 AM", "Every Monday" |

## Step 4.5 — Preview gate (BLOCKING)

After generating the HTML, serve it and present the preview URL. **Do NOT proceed to Figma output until the user approves.**

1. Start local server: `BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh "{project_working_directory}" 8765)`
2. Present:
   > "Preview: `http://localhost:8765/components/flows/[feature-name]-flow.html`
   >
   > Review the screens and reply:
   > - **"push"** — send all screens to Figma
   > - **"push 1,3,5"** — send only those screens to Figma
   > - **"prototype"** — generate interactive prototype first
   > - **"apply annotations"** — paste annotation JSON from the browser, I'll fix and re-preview
   > - **feedback** — I'll fix the HTML and re-preview"

3. **Wait for the user's response.** Do not proceed.

4. On feedback: fix the HTML, re-save, re-serve, present the updated preview URL again. Repeat until approved.

5. On approval: proceed to Step 5 with approved screens.

This gate costs zero `use_figma` calls. HTML iteration is fast and free — Figma output is expensive and hard to undo.

## Step 4.6 — Generate interactive prototype (opt-in)

**Trigger:** The user says "prototype" at the preview gate, or included "prototype"/"interactive"/"playable"/"clickable"/"test it" in their original prompt.

**Skip if:** The user said "quick"/"draft"/"just the flow", or went straight to "push".

1. Read `../../references/prototype-reference.md` for generation rules
2. Read `../../templates/flow-prototype-wrapper.html` for the base template
3. For each screen in the static HTML:
   - Copy the inner HTML of the `.screen` div
   - Wrap in `<section x-show="screen === N" class="proto-screen">`
   - Add Alpine directives to interactive elements (buttons → `@click`, inputs → `x-model`, submit → `:disabled`)
4. Fill the `screens` array in `x-data` with the screen list
5. Save to: `{project_working_directory}/components/flows/[feature-name]-prototype.html`
6. Re-present the gate with both URLs:
   > "Static: `http://localhost:8765/components/flows/[name]-flow.html`
   > Prototype: `http://localhost:8765/components/flows/[name]-prototype.html`
   >
   > Click through the prototype to test the flow, then:
   > - **"push"** — send to Figma
   > - **"push 1,3,5"** — send selected screens
   > - **feedback** — I'll fix and re-preview"

## Step 5 — Output to Figma

Read `flow-html-reference.md` § "Figma output" for the complete `use_figma` procedure, including screen scaffolding (Meta Kit Flow Screen), code rules, and token references. Follow `../../references/figma-output.md` for shared patterns.

**Key rules:**
- Import `Meta / Chrome / Flow Screen` for screen scaffolding — do not build manually
- Import library components — never recreate as raw frames
- Auto-layout on every frame, descriptive layer names, contextual text
- One row per flow in a horizontal wrapper

## Step 6 — Parity check

After all `use_figma` calls complete, run the post-push parity check procedure in `../../references/parity-check.md`:

1. `get_screenshot` of each pushed screen
2. Present screenshots alongside the HTML preview URL
3. Run automated checklist (element count, clipping, empty text)
4. Report findings and offer to fix P0 issues
5. Write `.last-push.json` manifest to `{project_working_directory}/components/flows/.last-push.json`

After parity check completes, ask: "Review in Figma and reply: **'looks good'**, **'fix [specific issue]'**, or run `/refine` later for corrections."

## Step 7 — Cleanup pass

Run through the checklist in `../../references/quality-checklist.md` — check the **Universal** section plus the **Generate Flow** section for this skill. Fix issues inline before presenting to the user.

If a fix requires adding a missing screen (e.g., empty state), add it. If a fix is ambiguous or would change the user's intent, note it for the review step instead of fixing silently.
