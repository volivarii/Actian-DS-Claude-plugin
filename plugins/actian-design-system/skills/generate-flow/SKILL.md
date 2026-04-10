---
name: generate-flow
description: Generate a multi-screen lo-fi flow from a feature idea or user story, and push to Figma. Also handles prototype wiring on existing flows.
argument-hint: "[feature description or Figma URL] [--hifi]"
---

# Generate Fat Marker Flow

Build a lo-fi user flow and push to Figma. FM components, Inter font, FM palette.

## Pipeline (3 gates — after gate 3, build and push uninterrupted)

1. Read app-context.md → determine app (Studio/Explorer/Administration)
2. **Research gate** — present verbatim unless user said "no research"
3. **Research findings gate** — present findings verbatim (mandatory when research opted-in)
4. **Screen list + detail level gate** — screens AND detail tier in ONE response
6. Build flow-data.json with content[] nodes (reference `examples/flow-data-example.json` for expected structure)
   - **Recipe acceleration**: Before building each screen's `content[]`, read `recipes/flow/_index.json`. If an archetype matches the screen's purpose, read that recipe file and use its skeleton as a starting point — fill `{{placeholders}}` with domain content, add/remove rows and sections as needed. If no recipe fits or the screen needs a novel layout, build `content[]` from scratch. Recipes are accelerators, not constraints — deviate freely when the design calls for it.
   - **Parallel mode (6+ screens):** Dispatch `screen-generator` agents in parallel, splitting screens into batches of 2-3. Each agent receives: batch index, screen details (name, template, content description), feature context, meta object, output path to `.partial/`. After all complete, merge:
     ```bash
     source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
     "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/merge-partials.js" \
       --type flow --partials-dir {project_working_directory}/components/flows/.partial \
       --output {project_working_directory}/components/flows/flow-data.json
     ```
     Sequential mode (<6 screens): build flow-data.json directly as today.
   - **Default text scan (MANDATORY before push):** After writing flow-data.json, scan it for these BANNED strings. If ANY are found, fix them before proceeding:
     - `"Page Title"` → replace with the actual page name (e.g., "POS Transaction Records", "Customer 360")
     - `"Description text"` → replace with a real subtitle (e.g., "Daily transaction data from all POS terminals")
     - `"Button label"` → replace with the action verb (e.g., "Edit", "Publish", "Share", "Actions")
     - `"Label"` (as a standalone section header) → replace with the section name (e.g., "Glossary terms", "Quality status")
     - `"Nav Item"` → replace with a real nav label
     - `"Tag"` → replace with a real tag value
     - `"Header"` (as a standalone text) → replace with actual heading
     This is a P0 blocker — do NOT push if any banned default text remains in the data model.
7. Push to Figma — read `references/figma-push-patterns.md` for component keys and patterns. Read your `flow-data.json` and push incrementally using small `use_figma` calls. Always pass `skillNames: "figma-use"` to every call.

   **Push sequence** (each step is one small `use_figma` call, ~200-800 bytes):
   1. Navigate to target page + create wrapper frame (use "Create wrapper frame" pattern from push-patterns.md)
   2. Create Generation Log instance (import genLog by key, create instance, set props from meta, append to wrapper)
   3. If research was opted-in: create Research Frame card (see "Research card in Figma output" section below)
   4. Create Cover Card instance (import flowCoverCard by key, set props from meta, append to wrapper)
   5. For each screen in `flow-data.json`:
      a. Import needed components for this screen (batch: header, sidebar items, content components)
      b. Create screen frame with auto-layout, set dimensions (1440×960)
      c. Create app chrome (header instance, sidebar with nav items, page header) using imported instances
      d. Create content area, populate from `screen.content[]` nodes — translate each node to Plugin API calls
      e. Append completed screen to wrapper
   6. After all screens pushed, report to user with count

   **Rules:**
   - Each `use_figma` call creates 1-3 nodes max — keep calls small
   - Return IDs from every call — use them in subsequent calls to append children
   - If a call fails, skip that element and continue
   - Do NOT run `flow-to-figma.js` — push directly from your data model
   - Do NOT read any `.js` files, manifests, or scaffolds
### HiFi conversion (if --hifi flag)

After the FM flow push completes:

1. Run `scripts/transform-to-hifi.js` on the in-memory `flow-data.json`
2. Report mapped/unmapped component counts to user
3. Handle unmapped nodes creatively using `docs/dskit.json` component descriptions
4. Apply DS layout polish: spacing tokens, typography scale, proper padding
5. Push hifi frame as sibling of FM frame, named `[Flow name] — HiFi`
6. Add generation card with `mode: "hifi"`

References: `docs/fm-to-ds-map.json`, `docs/dskit.json`, `scripts/transform-to-hifi.js`

8. Preview (opt-in):
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/assemble-preview.js" flow-data.json --type flow -o {project_working_directory}/components/flows/[feature]-flow.html
   BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh "{project_working_directory}" 8765)
   ```
9. Parity check (parity-check.md) → Cleanup (quality-checklist.md)

## Research gate

**MANDATORY** unless prompt contains "no research", "skip research", "just build it", or provides references. Reading context files is NOT presenting this gate. Copy verbatim:

```
Should I research UX patterns for this?
- **Yes** — I'll research competitor and best-in-class SaaS patterns
- **No, here are references:** — share URLs, screenshots, or files
- **No, just build it** — I'll use Actian conventions only
```

**Yes** → dispatch `flow-researcher` agent (Layer 2), merge with Layer 1+3, then **present findings before the screen list**. **References** → Layer 1 + analyze + Layer 3. **No** → Layer 1+3 only, screen list in same response. Layers: see research-guide.md.

## Research findings gate (mandatory when research opted-in)

When the user opts in to research, you MUST present the findings BEFORE proposing the screen list. Do NOT internalize the research and jump to screens. Present verbatim:

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

**Sources:** [list all URLs used in research as clickable links]
```

**ALWAYS include source URLs** — link to the actual pages, docs, or screenshots you found. The user needs to verify findings and may want to explore further.

Wait for acknowledgment, then proceed to the screen list gate. The user needs this context to evaluate whether the proposed screens make sense.

### Research card in Figma output

When research was opted-in, push a **Research Frame** card (`e671618f2b4c6ea406a995fdc3012ac54eadfe56`) as the second element in the wrapper (after GenLog, before Cover Card). Detach, resize to 1440px wide, and inject findings into the Content slot.

```js
const comp = await figma.importComponentByKeyAsync("e671618f2b4c6ea406a995fdc3012ac54eadfe56");
const inst = comp.createInstance();
inst.setProperties({
  "Title#48:10": "Research: [Feature]",
  "Source#48:11": "Sources: [Product A docs], [Product B blog], [Product C help]"
});
const card = inst.detachInstance();

// Inject findings into Content slot
const content = card.findOne(n => n.name === "Content");
if (content) {
  const ph = content.findOne(n => n.type === "TEXT");
  if (ph) ph.remove();
  // Add findings as text nodes — competitors, patterns, recommendations
}

wrapper.appendChild(card);
```

Skip this card only if user says "no research card" or "skip the research frame".

## Screen list + detail level gate (SINGLE gate — both choices in one response)

Present a numbered screen list, then ALWAYS include (copy verbatim):

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

Parse the user's response for both screen approval AND detail level. If no detail level specified, default to **Standard**.

**The FM focus principle applies at ALL tiers:**
- Non-feature chrome (sidebar items, header nav, unrelated content) is ALWAYS placeholder — muted text, generic labels, greyed-out variants
- Only elements relevant to the feature being designed get real content
- The tier controls how detailed the **feature-relevant** content is:

| Tier | Feature area | Non-feature chrome |
|------|-------------|-------------------|
| **Draft** | Key layout + minimal overrides | Placeholder |
| **Standard** | Full overrides, contextual labels, realistic data | Placeholder |
| **Production** | All states, edge cases, loading, empty, error | Contextual but secondary |

## Examples

Button — icons hidden: `{ "type": "INSTANCE", "ref": "fmButton", "variant": "Type=Primary, Size=md, Shape=Regular, State=Default", "props": { "Label": "Save changes", "👁 Leading Icon": false, "👁 Trailing Icon": false } }`

Text input — nested label, no separate fmInputLabel: `{ "type": "INSTANCE", "ref": "fmTextInput", "variant": "Type=Default", "name": "Input: Platform name", "props": { "Input Text": "Actian Data Intelligence", "Label Text": "Platform name", "Caption Text": "Displayed in the header", "Show label": true, "Caption": true, "Required": false } }`

Push-apart row — SPACE_BETWEEN, no Spacer: `{ "type": "FRAME", "name": "Header Row", "layout": { "mode": "HORIZONTAL", "primaryAxisAlignItems": "SPACE_BETWEEN" }, "sizing": { "horizontal": "FILL", "vertical": "HUG" }, "children": [...] }`

## Key rules

- **ZERO default text (P0):** Every component instance MUST have real contextual content. "Page Title", "Description text", "Button label", "Nav Item", "Tag" are P0 bugs. Use `setProperties` for every text property — no exceptions. The page header, action buttons, tabs, sidebar items, and all content must reflect the actual feature being designed.
- **Content area spacing:** The content area inside each screen MUST have `paddingTop: 24` (or the value matching the layout pattern). Content should never start flush against the tab bar or page header.
- **Button booleans:** Set `"👁 Leading Icon": false, "👁 Trailing Icon": false` on every button by default
- **SPACE_BETWEEN:** Use `primaryAxisAlignItems: "SPACE_BETWEEN"` for opposite-side layouts — never Spacer frames
- **Feature focus:** Spotlight the feature, placeholder everything else; build sidebar from navItems in flow-data.json
- **Small direct calls:** Write direct Figma Plugin API code using patterns from `references/figma-push-patterns.md`. Keep each use_figma call under 2KB.
- **No contentHtml:** Use structured content[] nodes (FRAME, TEXT, INSTANCE, DIVIDER) only

## References

- `references/figma-push-patterns.md` — component keys, push patterns, and Plugin API call templates
- `references/generate-flow/research-guide.md` — competitor research, reference analysis
- `references/quality-tiers.md` — Draft / Standard / Production tier definitions
- `references/app-context.md` — app inference, entity model, terminology
- `references/ux-patterns.md` — SaaS UX pattern library by flow type
- `references/layout-patterns.md` — canonical page layouts (dashboard, detail, table, form, graph, overlay)
- `references/parity-check.md` — post-push parity check procedure
- `references/quality-checklist.md` — cleanup pass checklist
- `references/prototype-reference.md` — interactive HTML prototype (opt-in)
- `references/prototype-wiring.md` — Figma prototype wiring (opt-in, "push and wire")
- `recipes/flow/_index.json` — archetype recipe catalog (table-list, form-create, detail-view, dashboard, browse-search, overlay)
