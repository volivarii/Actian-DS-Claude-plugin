---
name: generate-flow
description: This skill should be used when the user wants to create a flow, wireframe, or mockup from a feature idea or user story, asks how a user would accomplish a task, wants to mock up an experience, provides a user story and wants it visualized as a multi-screen flow, or wants to wire prototype connections on an existing Figma flow to make it playable.
argument-hint: "[feature description or Figma URL]"
---

# Generate Fat Marker Flow

Build a low-fidelity user flow and push it to Figma. Fat Marker components, Inter font, FM palette.

## Pipeline (follow this exactly)

```
Screen list → flow-data.json → flow-to-figma.js → use_figma
```

### Step 1 — Context + Screen list

1. Read `../../references/app-context.md` to identify the app (Studio/Explorer/Administration)
2. Read `../../references/generate-flow/figma-spec-builder.md` for templates and content node reference
3. Read `../../docs/fm-components-registry.json` for available FM components and their boolean properties
4. Present a numbered screen list:

```
### Flow: [Feature] — [Sub-flow]
**User:** [Role] | **App:** [Context]

1. [Screen] — [What it shows]
2. [Screen] — [What it shows]
```

5. Ask the user:
> Does this work, or would you like to adjust?
> - **approve** or scope down ("just 1 & 2")
> - **"preview"** — generate HTML preview before pushing
> - **"push [Figma URL]"** — approve and push directly

**Skip this gate** if the user already provided "skip gates", "just build it", or a direct push instruction.

### Step 2 — Build flow-data.json

Build the JSON file with structured `content[]` nodes (NOT `contentHtml`). Write to:
`{project_working_directory}/components/flows/flow-data.json`

See `../../references/generate-flow/figma-spec-builder.md` for the full schema. Key fields:
- `meta`: feature, flow, user, app, targetNodeId, prompt, duration, model, pluginVersion, skill
- `meta.research`: only if research was done
- `screens[]`: name, template, activeNavItem, navItems, pageHeader, contentSpacing, `content[]`

**Do NOT dump the JSON in chat.** Write it silently with the Write tool.

### Step 3 — Run the script (MANDATORY)

This is the critical step. The script converts flow-data.json into Figma Plugin API code.

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/flow-to-figma.js flow-data.json --target-node-id "<nodeId>"
```

- Do NOT add `2>&1` (stderr has info lines that would corrupt JSON output)
- Script outputs a JSON array of `{ callIndex, code, description }` on stdout
- If no `--target-node-id` was provided by the user, ask for a Figma URL before running

### Step 4 — Push to Figma

Pass each `code` string from the script output DIRECTLY to `use_figma`:
- Call 1: pass `code` as-is (creates wrapper + first section)
- Call 2+: replace `__WRAPPER_ID__` in `code` with the `wrapperId` from call 1's response

**Do NOT write custom Figma code.** The script output IS the Figma code. Do not modify it, do not write freehand `findVariant`/`setProp`/`createFrame` code.

### Step 5 — Parity check

Per `../../references/parity-check.md`: screenshot each pushed screen, check for clipping/empty text/missing children, fix P0s.

## Research (opt-in)

If the user wants research, ask before the screen list:
> Should I research UX patterns?
> - **Yes** — competitor and SaaS patterns
> - **No** — Actian conventions only

On yes: dispatch `flow-researcher` agent, merge results into screen list. Details in `../../references/generate-flow/research-guide.md`.

## HTML preview (opt-in)

Only when user says "preview". Details in `../../references/generate-flow/html-reference.md`.

1. Build HTML from flow-data.json using `../../scripts/html-renderers/flow-renderer.js`
2. Start server: `BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh "{project_working_directory}" 8765)`
3. Present URL with options: push / push and wire / apply annotations / feedback

## Prototype wiring (opt-in)

Only when user says "wire", "prototype", "interactive". Details in `../../references/prototype-wiring.md`.

## Key rules

- **FM first** — check `../../docs/fm-components.md` + registry for available components
- **Button booleans:** Set `"👁 Leading Icon": false` and `"👁 Trailing Icon": false` on every button unless icons are needed
- **Push-apart layouts:** Use `primaryAxisAlignItems: "SPACE_BETWEEN"` — never Spacer frames
- **No hardcoded hex** — use FM variable names from `../../references/fm-css-reference.md`
- **Contextual text** — "Schedule Refresh" not "Submit"
- **Feature focus** — spotlight the feature, placeholder everything else

## Quality tiers

| Signal | Tier | Effect |
|--------|------|--------|
| "quick", "draft" | Draft | Happy path only, 3-5 screens |
| No qualifier | Standard | Happy + error/empty states |
| "production" | Production | All paths + loading + edge cases |

## References

- `../../references/generate-flow/figma-spec-builder.md` — Templates, content node schema
- `../../references/generate-flow/html-reference.md` — HTML preview details
- `../../references/generate-flow/research-guide.md` — Research methodology
- `../../references/app-context.md` — App inference, entities, terminology
- `../../references/ux-patterns.md` — SaaS pattern library
- `../../references/prototype-wiring.md` — Figma prototype wiring
- `../../references/parity-check.md` — Post-push validation
- `../../references/quality-checklist.md` — Quality gates
