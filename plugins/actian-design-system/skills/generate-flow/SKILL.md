---
name: generate-flow
description: Generate a multi-screen lo-fi flow from a feature idea or user story, and push to Figma. Also handles prototype wiring on existing flows.
argument-hint: "[feature description or Figma URL]"
---

# Generate Fat Marker Flow

Build a lo-fi user flow and push to Figma. FM components, Inter font, FM palette.

## Pipeline (two gates, no other pauses — after gate 2, build and push uninterrupted)

1. Read app-context.md → determine app (Studio/Explorer/Administration)
2. **Research gate** — present verbatim unless user said "no research"
3. **Screen list gate** — present with options verbatim
4. Build flow-data.json with content[] nodes (see figma-spec-builder.md, reference `examples/flow-data-example.json` for expected structure)
   - **Recipe acceleration**: Before building each screen's `content[]`, read `recipes/_index.json`. If an archetype matches the screen's purpose, read that recipe file and use its skeleton as a starting point — fill `{{placeholders}}` with domain content, add/remove rows and sections as needed. If no recipe fits or the screen needs a novel layout, build `content[]` from scratch. Recipes are accelerators, not constraints — deviate freely when the design calls for it.
5. Push:
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/flow-to-figma.js" flow-data.json --target-node-id "<nodeId>" --output-dir {project_working_directory}/components/flows/.figma-calls
   ```
   Read manifest.json → for each call: read `call-N.js` → `use_figma` (self-contained, no ID replacement needed)
6. Preview (opt-in):
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/assemble-preview.js" flow-data.json --type flow -o {project_working_directory}/components/flows/[feature]-flow.html
   BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh "{project_working_directory}" 8765)
   ```
7. Parity check (parity-check.md) → Cleanup (quality-checklist.md)

## Research gate

**MANDATORY** unless prompt contains "no research", "skip research", "just build it", or provides references. Reading context files is NOT presenting this gate. Copy verbatim:

```
Should I research UX patterns for this?
- **Yes** — I'll research competitor and best-in-class SaaS patterns
- **No, here are references:** — share URLs, screenshots, or files
- **No, just build it** — I'll use Actian conventions only
```

**Yes** → dispatch `flow-researcher` agent (Layer 2), merge with Layer 1+3, then screen list. **References** → Layer 1 + analyze + Layer 3. **No** → Layer 1+3 only, screen list in same response. Layers: see research-guide.md.

## Screen list gate

Present a numbered screen list, then ALWAYS include (copy verbatim):

```
Does this work, or would you like to adjust?
- **approve** or scope down ("just 1 & 2")
- **"preview"** — generate HTML preview before pushing
- **"push [Figma URL]"** — approve and push directly to Figma
```

## Examples

Button — icons hidden: `{ "type": "INSTANCE", "ref": "fmButton", "variant": "Type=Primary, Size=md, Shape=Regular, State=Default", "props": { "Label": "Save changes", "👁 Leading Icon": false, "👁 Trailing Icon": false } }`

Text input — nested label, no separate fmInputLabel: `{ "type": "INSTANCE", "ref": "fmTextInput", "variant": "Type=Default", "name": "Input: Platform name", "props": { "Input Text": "Actian Data Intelligence", "Label Text": "Platform name", "Caption Text": "Displayed in the header", "Show label": true, "Caption": true, "Required": false } }`

Push-apart row — SPACE_BETWEEN, no Spacer: `{ "type": "FRAME", "name": "Header Row", "layout": { "mode": "HORIZONTAL", "primaryAxisAlignItems": "SPACE_BETWEEN" }, "sizing": { "horizontal": "FILL", "vertical": "HUG" }, "children": [...] }`

## Key rules

- **Button booleans:** Set `"👁 Leading Icon": false, "👁 Trailing Icon": false` on every button by default
- **SPACE_BETWEEN:** Use `primaryAxisAlignItems: "SPACE_BETWEEN"` for opposite-side layouts — never Spacer frames
- **Feature focus:** Spotlight the feature, placeholder everything else; script handles sidebar from navItems
- **No freehand Figma code:** Script output IS the Figma code — pass it through, do not write custom screen-building code
- **No contentHtml:** Use structured content[] nodes (FRAME, TEXT, INSTANCE, DIVIDER) only

## References

- `references/generate-flow/figma-spec-builder.md` — templates, content node spec, FM component ref table
- `references/generate-flow/research-guide.md` — competitor research, reference analysis
- `references/quality-tiers.md` — Draft / Standard / Production tier definitions
- `references/app-context.md` — app inference, entity model, terminology
- `references/ux-patterns.md` — SaaS UX pattern library by flow type
- `references/layout-patterns.md` — canonical page layouts (dashboard, detail, table, form, graph, overlay)
- `references/parity-check.md` — post-push parity check procedure
- `references/quality-checklist.md` — cleanup pass checklist
- `references/prototype-reference.md` — interactive HTML prototype (opt-in)
- `references/prototype-wiring.md` — Figma prototype wiring (opt-in, "push and wire")
- `recipes/_index.json` — archetype recipe catalog (table-list, form-create, detail-view, dashboard, browse-search, overlay)
