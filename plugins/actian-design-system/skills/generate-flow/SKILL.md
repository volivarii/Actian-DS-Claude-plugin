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

Build first, explain after. There are exactly 2 gates where you pause:
1. **Step 2** — research opt-in (skip if user already said "with research" or "no research")
2. **Step 3** — screen list approval → then build and push to Figma

After screen list approval (gate 2), build flow-data.json with structured `content[]` nodes and push to Figma — all in one uninterrupted sequence. No "ok", no narration, no intermediate pauses.

**HTML preview is opt-in.** Only generate HTML if the user says "preview" at gate 2 or in the original prompt. The default path is: screen list → build → push.

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

Present the list and ask:

> Does this work, or would you like to adjust?
> - **approve** or scope down ("just 1 & 2")
> - **"preview"** — generate HTML preview with annotations before pushing
> - **"push [Figma URL]"** — approve and push directly to Figma

## Step 4 — Build flow-data.json and push to Figma

**This entire step — reading references, building JSON, running the script, and pushing — happens in one uninterrupted sequence after the screen list is approved. No pauses, no narration, no intermediate confirmations.**

1. Read `../../references/generate-flow/figma-spec-builder.md` — template list + content node reference
2. Build `flow-data.json` with structured `content[]` nodes:
   - `meta`: feature, flow, user, app, targetNodeId, prompt, duration, model, pluginVersion, skill
   - `meta.research` (if research was done): `{ title, source, competitors, patterns, recommendation, sources }`
   - `screens[]`: one per screen, each with: name, template, activeNavItem, navItems, pageHeader, contentSpacing, `content[]`
3. Write `content[]` per screen using **structured spec nodes** (FRAME, TEXT, INSTANCE, DIVIDER) — see figma-spec-builder.md for the full node reference
4. Write to: `{project_working_directory}/components/flows/flow-data.json`
5. Run: `node ${CLAUDE_PLUGIN_ROOT}/scripts/flow-to-figma.js flow-data.json --target-node-id "<nodeId>"` — do NOT add `2>&1` (stderr has info lines that would corrupt the JSON)
6. Script outputs a JSON array of `{ callIndex, code, description }` on stdout. Parse stdout directly — do not write to intermediate files or use custom parsers.
7. For each call, pass `code` to `use_figma`:
   - Call 1: use as-is (creates wrapper + section)
   - Call 2+: replace `__WRAPPER_ID__` in code with the `wrapperId` from call 1's response
8. After all calls: parity check (Step 5)

**There is no HTML step in the default path.** The structured nodes go directly to flow-to-figma.js → Figma.

**Feature focus principle (FM flows — mandatory):**
Spotlight the feature being demonstrated. Only elements directly relevant to the feature should be detailed — everything else must use placeholder/muted variants. The script handles sidebar placeholders automatically from `navItems` count.

**Key rules (P0 — violations block push):**
- FM first — check `../../docs/fm-components.md` + `../../docs/fm-components-registry.json` for available components and their boolean properties
- **Button boolean properties:** Buttons expose `"👁 Leading Icon"` and `"👁 Trailing Icon"` (eye emoji prefix) as boolean toggles. Set both to `false` by default on every button instance. Only set to `true` when the design explicitly needs icons.
- **Push-apart layouts:** Use `primaryAxisAlignItems: "SPACE_BETWEEN"` for elements on opposite sides of a row — never create Spacer frames
- **No hardcoded hex** in content[] nodes — use FM variable names from `../../references/fm-css-reference.md` where possible
- Forms: inputs 480px max-width, extended elements full-width
- All text must be contextual, not generic ("Schedule Refresh" not "Submit")

### HTML preview (opt-in)

**Trigger:** User says "preview" at the screen list gate, or includes "preview" in the original prompt.

If triggered, generate the HTML preview BEFORE pushing to Figma:

1. Read `../../references/generate-flow/html-reference.md` and `../../scripts/html-renderers/flow-renderer.js`
2. Build HTML file from the same `flow-data.json` — the renderer uses `content[]` via `renderContentNode()`, or `contentHtml` if present
3. Write to: `{project_working_directory}/components/flows/[feature-name]-flow.html`
4. Start server: `BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh "{project_working_directory}" 8765)`
5. Present preview URL and options:

> Preview: `{URL}`
>
> Review the flow, then reply:
> - **"push"** — send to Figma
> - **"push and wire"** — push + wire prototype connections
> - **"apply annotations"** — click Annotate in the preview, then say "apply annotations" here
> - **feedback** — describe changes, I'll fix and re-preview

6. On feedback: fix flow-data.json, regenerate HTML, re-serve, re-present.
7. On "push": proceed to the push step above.

### Interactive prototype (opt-in)

**Trigger:** "prototype" at gate or keywords in original prompt. Skip if "quick"/"draft".

1. Read `../../references/prototype-reference.md`
2. Read `../../templates/flow-prototype-wrapper.html`
3. Build prototype from flow-data.json
4. Save to: `{project_working_directory}/components/flows/[feature-name]-prototype.html`

## Step 5 — Wire prototype (opt-in)

Wire Figma prototype connections so the pushed flow is playable in Presentation mode.

**Triggers:**
- "push and wire" at the screen list gate or preview gate — runs after push
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
5. Write `.last-push.json` manifest — include `notes` array from any `note`-type annotations if preview was used

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
