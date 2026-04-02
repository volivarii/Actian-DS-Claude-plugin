---
name: generate-flow
description: This skill should be used when the user wants to create a flow, wireframe, or mockup from a feature idea or user story, asks how a user would accomplish a task, wants to mock up an experience, provides a user story and wants it visualized as a multi-screen flow, or wants to wire prototype connections on an existing Figma flow to make it playable.
argument-hint: "[feature description or Figma URL]"
---

# Generate Fat Marker Flow

Generate a low-fidelity user flow using Fat Marker components and push it to Figma.

> **Workflow A — Fat Marker (lo-fi).** Uses FM components, Inter font, and the FM palette. NOT DS Kit tokens.
> **Shared rules apply:** Content guidelines, accessibility (WCAG 2.1 AA), quality checklist, generation log — per CLAUDE.md.

**When NOT to use:** For a *presentation deck* → `generate-presentation`. To *compare* flows → `compare-flows`. To *audit* → `design-audit`.

## Quality tiers

| Signal | Tier | Effect |
|--------|------|--------|
| "quick", "draft" | Draft | Happy path only (3-5 screens), minimal overrides |
| No qualifier | Standard | Happy path + error/empty states, full FM overrides |
| "production", "final" | Production | All paths + loading + edge cases, variable binding |

**Rendering philosophy:** FM flows use feature-focused rendering — spotlight the feature, placeholder everything else. Future hi-fi (DS Kit) flows will require pixel-perfect detail on every element.

## DO NOT — hard rules

- **DO NOT ask questions** except at the gates below. No "what kind of dashboard?", no "which output format?", no "which sub-flows?"
- **DO NOT add intermediate confirmation gates.** Never say "ok, let me now..." and wait. Never ask "should I proceed?" between steps. The only pauses are the gates listed below.
- **DO NOT dump JSON, code, or file contents in chat.** Write files silently. The user sees tool call summaries — don't repeat file contents as text output.
- **DO NOT use TaskCreate or TodoWrite.** Just execute.
- **DO NOT read CLAUDE.md repeatedly.** Read it once or not at all.
- **DO NOT spend multiple tool calls parsing research output.** Summarize what you have and move on.
- **DO NOT use bash/python/grep to read files.** Use the Read tool.

## Execution Model

Build first, explain after. There are exactly 3 gates where you pause:
1. **Step 2** — research opt-in (skip if user already said "with research" or "no research")
2. **Step 3** — screen list approval (user can say "just screen 1" or similar to scope down)
3. **Step 4 preview gate** — HTML preview with push/feedback options

Between gates, DO NOT stop. After screen list approval (gate 2), read references, build HTML, start server, and present the preview gate — all in one uninterrupted sequence. No "ok", no "let me read the renderer", no "writing the file now". The user should not see anything between approving the screen list and seeing the preview URL.

### Speed rules

- ONE parallel batch for research — do not re-read research output more than once
- If a Figma call fails, skip and proceed
- If a reference file is missing, skip and proceed

## Step 1 — Understand the request

Determine from the user's request:
- **Feature name**, **User role**, **App context** (Studio/Explorer/Administration)
- **Number of sub-flows** (happy path + error + alternate role)
- **References provided?** — See `../../references/generate-flow/research-guide.md` for accepted formats
- **Prototype requested?** — keywords: "prototype", "interactive", "playable", "clickable", "test it"
- **Figma URL provided?** — Extract `fileKey` and `nodeId` per `../../references/figma-output.md` § "Figma URL Parsing". Convert dashes to colons. Pass explicitly to MCP calls. Never rely on "current selection".

### App context inference

Read `../../references/app-context.md` for the full inference table, entity model, terminology, and app-specific chrome patterns. Quick reference:

| Signal | App context |
|--------|-------------|
| "steward", "govern", "curate", "lineage", "glossary admin", "metadata", "catalog management" | **Studio** |
| "browse", "discover", "search", "marketplace", "consume", "request access", "data product" | **Explorer** |
| "users", "permissions", "connections", "connectors", "settings", "configuration", "system" | **Administration** |
| "admin" (ambiguous) | Ask: "Administration app (users, connections, settings) or Studio (governance, catalog)?" |
| No signal / "user" (generic) | **Studio** (default) |

### Detail view pattern

| Pattern | When to use |
|---------|-------------|
| **Full detail page** | Complex records with tabs, actions, metadata |
| **Side panel** | Quick preview without losing list context |
| **Expanded row** | Simple records with 2-3 extra fields |

Default to full detail page unless prompt implies staying on the list.

## Step 2 — Research (opt-in)

If the user's prompt already answers (e.g., "no research", provides references), skip the question. Otherwise ask:

> "Should I research UX patterns for this?
> - **Yes** — I'll research competitor and best-in-class SaaS patterns
> - **No, here are references:** — share URLs, screenshots, or files
> - **No, just build it** — I'll use Actian conventions only"

Research has three layers (run in a single parallel batch):

**Layer 1 — Actian context (always, even if user says "no research"):**
- Read `../../references/app-context.md` — identify app (Studio/Explorer/Administration), relevant entities, terminology, established UI patterns
- Read `../../docs/component-guidelines/<relevant>.json` if the flow involves known components

**Layer 2 — UX pattern matching (on "yes" or "references"):**
- Read `../../references/ux-patterns.md` — match the flow to a pattern family (discovery, creation, config, visualization, governance) and pull applicable patterns
- Run competitor research per `../../references/generate-flow/research-guide.md` — WebSearch for how best-in-class SaaS apps (Notion, Linear, Stripe, Atlan, Collibra) handle this specific flow type

**Layer 3 — Cross-cutting principles (always):**
- Apply from `../../references/ux-patterns.md` § "Cross-Cutting Principles": progressive disclosure, empty states with CTAs, trust signals on data assets, form progressive field disclosure

- **Yes** → dispatch `flow-researcher` agent for Layer 2 (runs in background while you do Layer 1 + 3), then merge results and present screen list
- **References** → Layer 1 + analyze references per research guide + Layer 3, then screen list
- **No** → Layer 1 + Layer 3 only, then present screen list in the same response

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

## Step 4 — Generate HTML and present preview (ONE ATOMIC STEP)

**This entire step — reading references, building JSON, writing HTML, starting server, and presenting the preview gate — happens in one uninterrupted sequence. Do NOT pause, narrate progress, or wait for confirmation at any point during this step. The next time you stop and wait for the user is the preview gate at the end.**

The AI writes only the content area per screen — screen chrome (app header, sidebar, page header) is rendered client-side by `flow-renderer.js`.

**What to read (in parallel where possible):**
- `../../references/generate-flow/html-reference.md` — FM component classes and styling rules
- `../../scripts/html-renderers/flow-renderer.js` — client-side renderer (embed in HTML)
- `../../references/fm-css-reference.md` — exact FM variable values

**What to build:**
1. `flow-data.json` with:
   - `meta`: skill, feature, app, prompt, date, duration, model, pluginVersion
   - `meta.research` (if research was done): `{ title, source, competitors, patterns, recommendation, sources }`
   - `flows[]`: one per sub-flow, each with name, user, screens[]
   - Per screen: name, type (standard/compact), appHeader, sidebar (activeItem + items count), pageHeader (title, subtitle, actions), contentHtml
2. `contentHtml` per screen — feature-relevant tables, forms, dialogs, empty states
3. CSS for any `fm-custom-*` elements
4. Assembled HTML file: flow CSS + `<div id="flow-container"></div>` + embedded JSON as `<script type="application/json" id="spec-data">` + renderer JS + annotation layer
5. Write to: `{project_working_directory}/components/flows/[feature-name]-flow.html`

**Then immediately** start server and present the preview gate (Step 4.5 below). No pause between writing and serving.

**Feature focus principle (FM flows — mandatory):**
Spotlight the feature being demonstrated. Only elements directly relevant to the feature should be detailed — everything else must use placeholder/muted variants. The renderer handles sidebar placeholders automatically from `sidebar.items` count.

**Key rules:**
- One row per flow — never split across rows
- FM first — check `../../docs/fm-components.md` before custom elements
- Custom elements: prefix `fm-custom-`, use `--fm-*` vars, keep lo-fi
- Screen sizes: Standard 1440x960px, Compact 1440x700px
- Forms: inputs 480px max-width, extended elements full-width
- Styles: exact FM values only, no custom colors
- All text must be contextual, not generic ("Schedule Refresh" not "Submit")

After writing the HTML file, **dispatch `flow-consistency` agent** in background. Do NOT wait for it — proceed to the preview gate immediately. If the agent returns findings after you've already presented the gate, do NOT apply fixes automatically. Instead, mention the findings briefly when the user responds — let them decide whether to fix before pushing. Never re-edit the HTML and re-present the gate unprompted.

### Preview gate (end of Step 4 — BLOCKING)

Start server and present the gate in the same response as the HTML write:

1. Start server: `BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh "{project_working_directory}" 8765)`
2. Present preview URL and ALL options — do not omit any:

> Preview: `{URL}`
>
> Review the flow, then reply:
> - **"push"** / **"push 1,3"** — send to Figma
> - **"push and wire"** — push + wire prototype connections (playable in Figma Presentation mode)
> - **"prototype"** — generate interactive HTML prototype (click through screens locally)
> - **"apply annotations"** — click Annotate in the preview toolbar to mark issues visually on specific elements, then say **"apply annotations"** here
> - **feedback** — describe changes in text, I'll fix and re-preview

3. Wait for response. On feedback: fix HTML, re-serve, re-present.
4. On "push and wire": run Step 5 (push) then Step 5.5 (wire).
5. On "apply annotations": read `.annotations.json` from the project directory, apply `change` annotations per `../../references/annotation-reference.md`, carry `note` annotations forward to `.last-push.json` notes array for the Figma push step, re-serve and re-present gate.

**Skip preview:** If the user says "push" at the screen list gate (Step 3) or provides a Figma URL with "push" in the same message, skip HTML generation entirely and go straight to Step 5 (Figma output). The flow-to-figma.js script can build from the screen list directly — it doesn't require an HTML preview first.

## Step 4.6 — Interactive prototype (opt-in)

**Trigger:** "prototype" at gate or keywords in original prompt. Skip if "quick"/"draft".

1. Read `../../references/prototype-reference.md`
2. Read `../../templates/flow-prototype-wrapper.html`
3. Copy screen HTML into Alpine.js shell with click-to-navigate, form validation
4. Save to: `{project_working_directory}/components/flows/[feature-name]-prototype.html`
5. Re-present gate with both URLs

## Step 5 — Output to Figma (flow-to-figma.js)

**Do NOT write freehand Figma code.** Use the `flow-to-figma.js` script — it builds correct screen chrome from templates and generates Figma plugin code via the shared codegen.

1. Read `../../references/generate-flow/figma-spec-builder.md` — template list + content node reference
2. Ensure `flow-data.json` exists in the project directory (written in Step 4)
3. Run: `node ${CLAUDE_PLUGIN_ROOT}/scripts/flow-to-figma.js flow-data.json --target-node-id "<nodeId>"`
4. Script outputs JSON array of `{ callIndex, code, description }` objects to stdout
5. For each call, pass `code` to `use_figma`:
   - Call 1: use as-is (creates wrapper + section)
   - Call 2+: replace `__WRAPPER_ID__` in code with the `wrapperId` from call 1's response
6. After all calls: parity validation (screen count vs Figma frame count)

## Step 5.5 — Wire prototype (opt-in)

Wire Figma prototype connections so the pushed flow is playable in Presentation mode.

**Triggers:**
- "push and wire" at the preview gate (Step 4.5) — runs after Step 5 push
- "wire" after push — runs on already-pushed frames
- Production tier — auto-applies linear frame-to-frame wiring (no smart analysis)

**For new flows (fast path):**
Screen IDs, names, order, and button labels are already known from Steps 3-5. Skip analysis and build the wiring plan directly.

**For existing flows (Figma URL provided):**
If the user provides a Figma URL with wiring keywords ("wire", "make interactive", "connect screens"), run the full analysis path: `get_metadata` → **dispatch `wiring-analyzer` agent** with the metadata XML → agent returns structured wiring plan JSON → present plan → execute.

**Procedure:**
1. Read `../../references/prototype-wiring.md` for the analysis algorithm and code patterns
2. Build the wiring plan — fast path: build directly from known context. Analysis path: dispatch `wiring-analyzer` agent with `get_metadata` output.
3. Present wiring plan for approval (see reference for format)
4. On "wire": execute via single `use_figma` call assembling the code patterns
5. On "wire linear": frame-to-frame only, skip button and overlay wiring
6. On feedback: adjust plan and re-present
7. Post-wiring report with connection summary

## Step 6 — Parity check

Per `../../references/parity-check.md`:
1. `get_screenshot` of each pushed screen
2. **Dispatch `parity-analyzer` agent** with screenshots + expected screen content from Step 3 screen list
3. Merge findings with your own visual check
4. Report findings, fix P0s
5. Write `.last-push.json` manifest — include `notes` array from any `note`-type annotations carried forward from Step 4.5

## Step 7 — Cleanup pass

Run `../../references/quality-checklist.md` — Universal + Generate Flow sections.

## Additional Resources

### Reference Files

Detailed content in `references/generate-flow/`:
- **`figma-spec-builder.md`** — Screen list → figma-spec.json mapping (primary Figma output path)
- **`html-reference.md`** — HTML template structure, FM components, screen rules, Figma output procedure
- **`research-guide.md`** — Competitor research, reference analysis, research frame format

Shared references:
- **`../../scripts/figma-codegen.js`** — Shared Figma code generation library (generates Plugin API code from node trees)
- **`../../scripts/flow-to-figma.js`** — Flow-specific: reads flow-data.json, applies templates, generates Figma plugin JS via codegen
- **`../../scripts/templates.json`** — Template definitions (admin, studio, explorer, no-sidebar, bare, mobile, tablet, compact, custom)
- **`../../references/app-context.md`** — Actian product context: 3 apps, entity model, terminology, UI patterns
- **`../../references/ux-patterns.md`** — SaaS UX pattern library by flow type (discovery, creation, config, visualization, governance)
- **`../../references/prototype-wiring.md`** — Smart Figma prototype wiring: analysis algorithm, code patterns, wiring plan format
