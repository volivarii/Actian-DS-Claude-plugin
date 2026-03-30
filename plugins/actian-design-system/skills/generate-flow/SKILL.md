---
name: generate-flow
description: This skill should be used when the user wants to create a flow, wireframe, or mockup from a feature idea or user story, asks how a user would accomplish a task, wants to mock up an experience, or provides a user story and wants it visualized as a multi-screen flow.
argument-hint: "[feature description or Figma URL]"
---

# Generate Fat Marker Flow

Generate a low-fidelity user flow using Fat Marker components and push it to Figma.

> **Workflow A — Fat Marker (lo-fi).** Uses FM components, Inter font, and the FM palette. NOT DS2026 tokens.
> **Shared rules apply:** Content guidelines, accessibility (WCAG 2.1 AA), quality checklist, generation log — per CLAUDE.md.

**When NOT to use:** For a *presentation deck* → `generate-presentation`. To *compare* flows → `compare-flows`. To *audit* → `design-audit`.

## Quality tiers

| Signal | Tier | Effect |
|--------|------|--------|
| "quick", "draft" | Draft | Happy path only (3-5 screens), minimal overrides |
| No qualifier | Standard | Happy path + error/empty states, full FM overrides |
| "production", "final" | Production | All paths + loading + edge cases, variable binding |

## Execution Model

Build first, explain after. Pause at structured gates only: (1) Step 1 if critical context missing, (2) Step 2 research opt-in, (3) Step 3 screen list, (4) Step 4.5 HTML preview. Between gates, do not ask questions.

### Speed rules

- No TaskCreate/TodoWrite — just execute
- ONE parallel batch for research
- Do NOT read CLAUDE.md repeatedly
- If a Figma call fails, skip and proceed

## Step 1 — Understand the request

Determine from the user's request:
- **Feature name**, **User role**, **App context** (Admin/Studio/Explorer)
- **Number of sub-flows** (happy path + error + alternate role)
- **References provided?** — See `../../references/generate-flow/research-guide.md` for accepted formats
- **Prototype requested?** — keywords: "prototype", "interactive", "playable", "clickable", "test it"

### App context inference

| Signal | App context |
|--------|-------------|
| "admin", "configure", "manage", "permissions", "settings" | **Admin** |
| "developer", "pipeline", "integration", "build", "deploy" | **Studio** |
| "analyst", "browse", "search", "explore", "discover" | **Explorer** |
| "user" (generic) | **Admin** (default) |

### Detail view pattern

| Pattern | When to use |
|---------|-------------|
| **Full detail page** | Complex records with tabs, actions, metadata |
| **Side panel** | Quick preview without losing list context |
| **Expanded row** | Simple records with 2-3 extra fields |

Default to full detail page unless prompt implies staying on the list.

## Step 2 — Research (opt-in)

If the user's prompt already answers (e.g., "no research", provides references), skip the question. Otherwise ask:

> "Should I research competitor patterns?
> - **Yes** — I'll look at how other SaaS products handle this
> - **No, here are references:** — share URLs, screenshots, or files
> - **No, just build it** — I'll use Actian conventions only"

- **Yes** → run competitor research per `../../references/generate-flow/research-guide.md`, then present screen list
- **References** → analyze per research guide, skip competitors, then screen list
- **No** → immediately present screen list in the same response

## Step 3 — Plan the screen list

Output a numbered screen list for review:

```
### Flow: [Feature] — [Sub-flow]
**User:** [Role] | **App:** [Context]

1. [Screen] — [What it shows]
2. [Screen] — [What it shows]
```

**Screen templates by flow type:**

- **Action flows** (create, edit, submit): starting state → trigger → form → confirmation → error
- **Viewing flows** (browse, monitor): populated view → empty state → error → detail
- **Multi-role flows**: one sub-flow per role, each with own cover card and App_header

Wait for user approval.

## Step 4 — Generate HTML

Create `{project_working_directory}/components/flows/[feature-name]-flow.html`. Read `../../references/generate-flow/html-reference.md` for the complete template structure, FM component inventory, custom element rules, and styling.

**Key rules:**
- One row per flow — never split across rows
- FM first — check `../../docs/fm-components.md` before custom elements
- Custom elements: prefix `fm-custom-`, use `--fm-*` vars, keep lo-fi
- Screen sizes: Standard 1440x960px, Compact 1440x700px
- Forms: inputs 480px max-width, extended elements full-width
- Styles: read `../../references/fm-css-reference.md` — exact values
- All text must be contextual, not generic ("Schedule Refresh" not "Submit")

## Step 4.5 — Preview gate (BLOCKING)

1. Start server: `BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh "{project_working_directory}" 8765)`
2. Present preview URL and options:
   - **"push"** / **"push 1,3,5"** — send to Figma
   - **"prototype"** — generate interactive prototype first
   - **"apply annotations"** — read browser annotations, fix and re-preview
   - **feedback** — fix and re-preview
3. Wait for response. On feedback: fix HTML, re-serve, re-present.

## Step 4.6 — Interactive prototype (opt-in)

**Trigger:** "prototype" at gate or keywords in original prompt. Skip if "quick"/"draft".

1. Read `../../references/prototype-reference.md`
2. Read `../../templates/flow-prototype-wrapper.html`
3. Copy screen HTML into Alpine.js shell with click-to-navigate, form validation
4. Save to: `{project_working_directory}/components/flows/[feature-name]-prototype.html`
5. Re-present gate with both URLs

## Step 5 — Output to Figma

Read `../../references/generate-flow/html-reference.md` § "Figma output" for the `use_figma` procedure. Follow `../../references/figma-output.md` for shared patterns.

- Import `Meta / Chrome / Flow Screen` — do not build manually
- Import library components — never recreate as raw frames
- Auto-layout on every frame, descriptive layer names, contextual text

## Step 6 — Parity check

Per `../../references/parity-check.md`: screenshot each screen, check for clipping/empty text, report findings, write `.last-push.json`.

## Step 7 — Cleanup pass

Run `../../references/quality-checklist.md` — Universal + Generate Flow sections.

## Additional Resources

### Reference Files

Detailed content in `references/generate-flow/`:
- **`html-reference.md`** — HTML template structure, FM components, screen rules, Figma output procedure
- **`research-guide.md`** — Competitor research, reference analysis, research frame format
