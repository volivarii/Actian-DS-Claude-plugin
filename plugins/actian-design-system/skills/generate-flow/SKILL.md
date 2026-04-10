---
name: generate-flow
description: Generate a multi-screen lo-fi flow from a feature idea or user story, and push to Figma. Also handles prototype wiring on existing flows.
argument-hint: "[feature description or Figma URL] [--hifi]"
---

# Generate Fat Marker Flow

Build a lo-fi user flow and push to Figma. FM components, Inter font, FM palette.

## Pipeline (3 gates, then build + push uninterrupted)

1. Read `references/app-context.md` → determine app (Studio/Explorer/Administration)
2. **Gate 1 — Research** (present verbatim, see below)
3. **Gate 2 — Research findings** (mandatory when research opted-in, see below)
4. **Gate 3 — Screen list + detail level** (single gate, both choices, see below)
5. Build `flow-data.json`
   - Read `recipes/flow/_index.json` — if an archetype matches the screen, use its skeleton. Recipes are accelerators, not constraints.
   - **Parallel mode (6+ screens):** Dispatch `screen-generator` agents in batches of 2-3, merge with:
     ```bash
     source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
     "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/merge-partials.js" \
       --type flow --partials-dir {project_working_directory}/components/flows/.partial \
       --output {project_working_directory}/components/flows/flow-data.json
     ```
     Sequential mode (<6 screens): build flow-data.json directly.
6. **Default text scan (P0 BLOCKER)** — scan flow-data.json for banned strings. Fix ALL before pushing:
   - `"Page Title"` → actual page name (e.g., "Customer 360 Data Product")
   - `"Description text"` → real subtitle (e.g., "Daily transaction data from all POS terminals")
   - `"Button label"` → action verb (e.g., "Edit", "Publish", "Share", "Actions")
   - `"Label"` (standalone) → section name (e.g., "Glossary terms", "Quality status")
   - `"Nav Item"` → real nav label
   - `"Tag"` → real tag value
   - `"Header"` (standalone) → actual heading
   - `"Feature Name"` → actual feature (e.g., "AI Steward", "Data Product Checkout")
   - `"Flow Description"` → real flow description
   - `"User Persona"` → target user (e.g., "Data Steward", "Business Analyst")
7. Push to Figma (see Push section below)
8. Preview (opt-in):
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/assemble-preview.js" flow-data.json --type flow -o {project_working_directory}/components/flows/[feature]-flow.html
   BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh "{project_working_directory}" 8765)
   ```
9. Parity check (opt-in) → `references/parity-check.md` + `references/quality-checklist.md`

---

## Gate 1 — Research

**MANDATORY** unless prompt contains "no research", "skip research", "just build it", or provides references. Copy verbatim:

```
Should I research UX patterns for this?
- **Yes** — I'll research competitor and best-in-class SaaS patterns
- **No, here are references:** — share URLs, screenshots, or files
- **No, just build it** — I'll use Actian conventions only
```

**Yes** → dispatch `flow-researcher` agent, then present findings (Gate 2). **References** → analyze + screen list. **No** → screen list directly. Layers: see `references/generate-flow/research-guide.md`.

## Gate 2 — Research findings (mandatory when opted-in)

Do NOT internalize the research. Present verbatim:

```
### Research findings: [Feature]

**How competitors handle this:**
- [Product A]: [approach — 1-2 sentences] — [source URL]
- [Product B]: [approach — 1-2 sentences] — [source URL]
- [Product C]: [approach — 1-2 sentences] — [source URL]

**Common patterns:**
- [Pattern 1]
- [Pattern 2]
- [Pattern 3]

**What I'll apply to our flow:**
- [Specific recommendation 1]
- [Specific recommendation 2]

**What I'll skip and why:**
- [Pattern that doesn't fit Actian conventions]

**Sources:** [all URLs as clickable links]
```

**ALWAYS include source URLs.** Wait for acknowledgment before proceeding to Gate 3.

## Gate 3 — Screen list + detail level (SINGLE gate)

Present a numbered screen list, then copy verbatim:

```
Does this work, or would you like to adjust?

**Screens:** approve all, scope down ("just 1 & 2"), or describe changes

**Detail level:**
- **draft** — feature area only, minimal content, placeholder chrome
- **standard** — feature fully detailed, contextual labels and data (default)
- **production** — all states, edge cases, loading, empty, error

**Actions:**
- **"approve"** — standard detail, build data model
- **"approve draft"** or **"approve production"** — specify detail level
- **"preview"** — generate HTML preview before pushing
- **"push [Figma URL]"** — approve standard + push directly to Figma
- **"push draft [URL]"** or **"push production [URL]"** — specify detail + push
```

Parse the user's response for both screen approval AND detail level. Default to **Standard**.

**FM focus principle (all tiers):** Non-feature chrome is ALWAYS placeholder. The tier controls how detailed the **feature-relevant** content is. See `references/quality-tiers.md` for concrete per-tier rules (Draft uses fmPlaceholder, Standard uses full contextual content, Production adds all states).

---

## Push to Figma

Read `references/figma-push-patterns.md` for component keys and patterns. Push from `flow-data.json` using small `use_figma` calls. Always pass `skillNames: "figma-use"`.

**Push sequence:**

1. Navigate to target page + create wrapper frame
2. GenLog — import by key `a9653f30925367e96dea90093d750bfe70849571`, `setProperties` with `"Skill#3:0"`, `"Prompt#3:1"`, `"Date#3:2"`, `"Duration#3:3"`, `"Model#3:4"`, `"Plugin Version#3:5"`. **Plugin Version = `v1.50.6`** (read from plugin.json, never hardcode)
3. Research card (if opted-in) — import Research Frame `e671618f2b4c6ea406a995fdc3012ac54eadfe56`, `setProperties` with `"Title#48:10"`, `"Source#48:11"`, detach, inject findings into Content slot. **Must contain the exact same content as the chat findings** — same competitors, patterns, recommendations, source URLs. Card is the persistent record of what informed the design.
4. Cover Card — import `eaebde6bd07d2f19f3f9c00a9587240cb085a90d`, `setProperties` with `"Feature#46:8"`, `"Flow#46:9"`, `"User#46:10"` — NEVER leave defaults
5. For each screen:
   a. Import components (header, sidebar, content components)
   b. Create screen frame (1440×960, auto-layout)
   c. App chrome (header, sidebar with nav items, page header)
   d. Content area with `paddingTop: 24, paddingLeft: 24, paddingRight: 24, paddingBottom: 24` — content NEVER flush against tab bar. Populate from `screen.content[]`.
   e. Append to wrapper
6. Report count to user

**Push rules:**
- Each `use_figma` call creates 1-3 nodes max
- Return IDs from every call
- If a call fails, skip and continue
- Do NOT run `flow-to-figma.js` or read `.js` files

### HiFi conversion (if --hifi flag)

After FM push completes:

1. Run `scripts/transform-to-hifi.js` on flow-data.json
2. Report mapped/unmapped counts
3. Handle unmapped creatively using `docs/dskit.json`
4. Apply DS layout polish: spacing tokens, typography scale, padding
5. Push hifi frame as sibling, named `[Flow name] — HiFi`
6. Add generation card with `mode: "hifi"`

References: `docs/fm-to-ds-map.json`, `docs/dskit.json`, `scripts/transform-to-hifi.js`

---

## Examples

Button — icons hidden: `{ "type": "INSTANCE", "ref": "fmButton", "variant": "Type=Primary, Size=md, Shape=Regular, State=Default", "props": { "Label": "Save changes", "👁 Leading Icon": false, "👁 Trailing Icon": false } }`

Text input — nested label: `{ "type": "INSTANCE", "ref": "fmTextInput", "variant": "Type=Default", "name": "Input: Platform name", "props": { "Input Text": "Actian Data Intelligence", "Label Text": "Platform name", "Caption Text": "Displayed in the header", "Show label": true, "Caption": true, "Required": false } }`

Push-apart row: `{ "type": "FRAME", "name": "Header Row", "layout": { "mode": "HORIZONTAL", "primaryAxisAlignItems": "SPACE_BETWEEN" }, "sizing": { "horizontal": "FILL", "vertical": "HUG" }, "children": [...] }`

## Key rules

- **Button booleans:** Set `"👁 Leading Icon": false, "👁 Trailing Icon": false` on every button by default
- **SPACE_BETWEEN:** Use `primaryAxisAlignItems: "SPACE_BETWEEN"` for opposite-side layouts — never Spacer frames
- **Feature focus:** Spotlight the feature, placeholder everything else; build sidebar from navItems in flow-data.json
- **Small direct calls:** Keep each `use_figma` call under 2KB
- **No contentHtml:** Use structured content[] nodes (FRAME, TEXT, INSTANCE, DIVIDER) only

## References

- `references/figma-push-patterns.md` — component keys, push patterns, Plugin API templates
- `references/generate-flow/research-guide.md` — competitor research, reference analysis
- `references/quality-tiers.md` — Draft / Standard / Production concrete rules
- `references/app-context.md` — app inference, entity model, terminology
- `references/ux-patterns.md` — SaaS UX pattern library by flow type
- `references/layout-patterns.md` — canonical page layouts
- `references/parity-check.md` — post-push parity check
- `references/quality-checklist.md` — cleanup pass checklist
- `references/prototype-reference.md` — interactive HTML prototype (opt-in)
- `references/prototype-wiring.md` — Figma prototype wiring (opt-in)
- `recipes/flow/_index.json` — archetype recipe catalog
