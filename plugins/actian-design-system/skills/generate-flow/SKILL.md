---
name: generate-flow
description: Generate one or more lo-fi screens — single screen or multi-screen flow — from a feature idea, user story, or single-screen prompt. Also handles refine (URL + instruction), iterate (URL only), branch (URL + new variant), prototype wiring, and hifi conversion. Pushes to Figma.
argument-hint: "[feature description or Figma URL] [prose instruction] [--hifi --audit --variants N --ref <url> --breakpoints tablet,mobile --from <url> --branch <name> --states empty,error]"
---

# Generate Fat Marker Flow

Build one or more lo-fi screens (n≥1, single-screen output is first-class) and push to Figma. FM components, Inter font, FM palette.

## Input shapes

The skill accepts three shapes; detection happens before the pipeline runs.

| Shape | Pattern | Example |
|-------|---------|---------|
| **Prompt** | Feature description, no URL | `/generate-flow create a data product` |
| **Refine** | Figma URL + prose instruction | `/generate-flow <url> "rename the primary CTA to 'Publish'"` |
| **Iterate / Branch** | `--from <url>` (no instruction) | `/generate-flow --from <url> --branch v2` |

Refine activates when ALL of: a Figma URL is provided, prose instruction is provided alongside, AND the URL resolves to a unit in `.last-push.json`'s unitMap. See **Refine shape** below for the full detection + behavior spec.

## Flags

| Flag | Type | Default | Behavior |
|------|------|---------|----------|
| `--hifi` | bool | off | After lo-fi push, runs hifi conversion on the result. Preserves prototype wiring. |
| `--audit` | bool | off | After lo-fi (or hifi if `--hifi`) push, runs `/design-audit` on the result. Reports findings; does not auto-fix unless paired with `--audit --fix all`. |
| `--variants <n>` | int | 1 | Generates n parallel structurally-distinct takes (different recipe selection or composition). Range 2–5. n>5 → refuse with clear error. Lays out side-by-side. Provenance tracked in `.last-push.json`. |
| `--ref <url[,url]>` | URL list | none | **v1: Figma URLs only.** Reference frames whose structural fingerprint biases recipe selection. Multi-URL = blended influence. For external references (Linear, Stripe, etc.), screenshot into a Figma frame first and pass that URL. Image-URL support targeted for v2 alongside the vision pipeline. |
| `--breakpoints <list>` | string list | none | Comma-separated: `tablet`, `mobile`, `custom-Npx`. Generates additional variants per breakpoint. Lo-fi level = structural decisions only (collapse, stack). |
| `--from <url>` | URL | none | URL-type detected. **Figma URL** → iterate on existing flow (preserves data model, re-rolls recipes). **Jira/Confluence/Google doc URL** → spec input (extracts user story, acceptance criteria). **Image URL** → primary visual reference. |
| `--branch <name>` | string | none | Requires `--from <url>`. Forks the flow into a sibling frame named `[original] — <name>`. Provenance in `.last-push.json` so `/compare-flows` works between branches. |
| `--states <list>` | string list | none | State coverage: `empty`, `error`, `loading`, `no-permission`, `populated`, `partial-data`. Generates each as additional screens or variants. |

### Flag interaction matrix

| Combination | Behavior |
|-------------|----------|
| `--hifi --audit` | lo-fi → hifi → audit chain; audit operates on hifi output |
| `--variants 3 --hifi` | 3 lo-fi variants → all converted to hifi; `--audit` runs per variant if also set |
| `--from <url> --variants 3` | 3 alternative iterations on the existing flow |
| `--from <url> --branch X` | Single fork named X. `--variants` is ignored when `--branch` is set. |
| `--breakpoints tablet --variants 3` | 3 variants × 2 breakpoints (desktop + tablet) = 6 outputs. Hard cap: 9 outputs total. |
| `--ref <url> --states empty,error` | Reference biases base layout; states inherit the same reference treatment. |
| `--states X` without `--from` | Generates flow + states from prompt (greenfield). |

## Refine shape

Refine is a shape the skill detects, not a flag. When detected, it skips the standard 3-gate pipeline and runs a targeted edit on a previously-pushed unit.

### Detection (all must match)

1. A Figma URL is present in the input
2. Prose instruction is present alongside (not just whitespace, not only flags)
3. The URL resolves to a unit in `.last-push.json`'s `unitMap` (or one of its descendants)

If any condition fails, fall back per the table below.

| Failure | Fallback |
|---------|----------|
| URL provided, no prose instruction | Iterate mode (`--from <url>` semantics) |
| Prose provided, no URL | Standard generate from prompt |
| URL provided + prose, but URL not in any `.last-push.json` unitMap | Treat as new generation; warn: "no prior push found, treating as new flow" |
| Multiple matching units (nested) | Pick most-specific (deepest matching unitMap entry) |
| Refine instruction the data model can't represent (e.g., "add a 3D shader") | Return error; suggest alternative or `/create-component` |
| Refine instruction conflicts with glossary | Validator flags; companion presents conflict and asks |
| Refine on a hifi unit | Re-route through `/generate-flow` refine on the underlying lo-fi data model (hifi is downstream); explain to designer |

### Behavior

1. Parse Figma URL → extract `fileKey` + `nodeId`
2. Locate the relevant `.last-push.json` (under `components/flows/`, `components/briefs/`, etc.)
3. Look up the unit in `unitMap` matching `nodeId` or its nearest ancestor
4. Load the cached data-model snapshot for that unit
5. Apply the prose instruction to that unit's data model — AI-driven targeted edit
6. Run `validate-flow-data.js` on the modified unit (existing pipeline, scoped to the unit)
7. Push only the affected unit using incremental `--call N` (existing primitive)
8. Re-run parity check on that unit only
9. Skip approval gates for low-stakes refines (single-screen, single-card) — engine work in §7.6 of the surface-redesign spec; until landed, gates fire as today

## Pipeline (3 gates, then build + push uninterrupted) — for prompt + greenfield generation

1. Read `references/app-context.md` → determine app (Studio/Explorer/Administration)
2. **Gate 1 — Research** (present verbatim, see below)
3. **Gate 2 — Research findings** (mandatory when research opted-in, see below)
4. **Gate 3 — Screen list + detail level** (single gate, both choices, see below)
5. Build `flow-data.json`
   - **Tier classification (REQUIRED — runs in BOTH modes before generating screen content):** Read `agents/screen-generator.md` Step 0 and apply the classifier per-screen. Every screen object in the output MUST carry the 5 tier fields (`tier`, `confidence`, `matchedRecipe`, `composition`, `justification`) populated according to the per-tier field rules in that section. Then read `agents/screen-generator.md` "Tier-aware generation rules" section and apply the rules matching each screen's tier when authoring its content. **Parallel and sequential modes both apply the classifier — sequential does NOT skip Step 0.**
   - Read `recipes/flow/_index.json` — if an archetype matches the screen, use its skeleton. Recipes are accelerators, not constraints.
   - **Parallel mode (6+ screens):** Dispatch `screen-generator` agents in batches of 2-3, merge with:
     ```bash
     source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
     "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/merge-partials.js" \
       --type flow --partials-dir {project_working_directory}/components/flows/.partial \
       --output {project_working_directory}/components/flows/flow-data.json
     ```
     Sequential mode (<6 screens): build flow-data.json directly — but FIRST classify each screen per the agent's Step 0 (above).
6. **Validate flow data** — run the validation script before pushing:
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validate-flow-data.js" \
     {project_working_directory}/components/flows/flow-data.json
   ```
   - Exit 1 (P0s found): fix all banned placeholder text before pushing. Common P0s: `"Page Title"`, `"Button label"`, `"Description text"`, `"Label"`, `"Nav Item"`.
   - Exit 2 (P1s only): report terminology or token warnings to user, proceed with push.
   - Exit 0: clean, proceed.

**On validation failure (exit 1 / error findings):**

- Open `flow-data.json` with the Edit tool.
- For each `placeholder-text` finding: replace the placeholder string at the indicated path with the real content (typically derivable from `screens[N].name` or the user prompt).
- For each `missing-required-override` finding: add the missing prop to the INSTANCE node's `props` object with a real value.
- For each `unknown-component` finding: correct the `ref` slug (the validator suggests near matches via Levenshtein when applicable).
- **Do NOT re-dispatch screen-generator agents.** Patch in-place with Edit, then re-run the validator.
- **Retry cap:** if the same finding kind on the same path persists across 3 consecutive validator runs, stop and surface the validator output to the user. Do not loop further.

For warning-level findings (`default-true-boolean-unset`, `unresolved-token`, `terminology-issue`): exit 2, push proceeds. Findings surface in the GenLog text node.
7. Push to Figma (see Push section below)
8. Preview (opt-in):
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/resolve-node.sh"
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/assemble-preview.js" flow-data.json --type flow -o {project_working_directory}/components/flows/[feature]-flow.html
   BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/ensure-server.sh "{project_working_directory}" 8765)
   ```
9. Parity check (opt-in) → `references/parity-check.md` + `references/quality-checklist.md`. Manifest includes `sourceHash` (of flow-data.json), `componentKeys` (from push), and `tokenHash` (of tokens file).

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

## Step 3.5 — Build flow glossary

After the screen list is approved, build a `_glossary` object and set it on `meta._glossary`. This ensures all screen-generators use identical terminology.

**Build from:**
1. Feature description → extract the primary entity name (e.g., "Data Product", "Dataset", "Scanner")
2. App context (from Gate 1) → verify the entity name matches `references/app-context.md` terminology (e.g., "Data product" not "dataset" when curated)
3. Approved screen list → extract page titles and CTA labels already visible in screen names

**Glossary fields:**

```json
{
  "_glossary": {
    "entity": "Data Product",
    "entityPlural": "Data Products",
    "entityLower": "data product",
    "entityPluralLower": "data products",
    "createVerb": "Create",
    "editVerb": "Edit",
    "deleteVerb": "Delete",
    "primaryCTA": "Create data product",
    "pageTitle": "Data Products",
    "sidebarActive": "Catalog",
    "app": "Studio",
    "entityProperties": ["name", "description", "status", "input ports", "output ports", "datasets", "contacts", "attachments"]
  }
}
```

**Entity properties lookup:** After building the glossary, slugify the entity name (lowercase, replace spaces with hyphens) and look it up in `docs/app-context.json` → `entities[slug]`. If found, set `_glossary.entityProperties` to the entity's `properties` array. Screen-generators use these for form field labels, table column headers, and detail page content instead of generic placeholders.

Example: entity "Data Product" → slug "data-product" → `entities["data-product"].properties` → `["name", "description", "status", "input ports", "output ports", "datasets", "contacts", "attachments"]`

If the flow doesn't center on a single entity (e.g., a dashboard or settings page), set entity fields to the most prominent noun in the feature description. Set verb fields to the most common actions visible in the screen list.

Set `meta._glossary` before dispatching screen-generators or building flow-data directly.

---

## Push to Figma

Read `references/figma-push-patterns.md` for component keys and patterns. Push from `flow-data.json` using small `use_figma` calls. Always pass `skillNames: "figma-use"`.

**Push sequence:**

1. Navigate to target page + create wrapper frame
2. GenLog — import by key `a9653f30925367e96dea90093d750bfe70849571`, `setProperties` with `"Skill#3:0"`, `"Prompt#3:1"`, `"Date#3:2"`, `"Duration#3:3"`, `"Model#3:4"`, `"Plugin Version#3:5"`. **Plugin Version = `v1.52.0`** (read from plugin.json, never hardcode)
3. Tier Summary (if any screen has a `tier` field) — call `buildTierSummary(screens)` from `scripts/shared-constants.js`. If it returns a TEXT node spec (not null), push the TEXT node into the wrapper as a sibling of the GenLog instance, immediately following it. Skip when `buildTierSummary` returns null (none of the screens are tiered).
4. Research card (if opted-in) — import Research Frame `e671618f2b4c6ea406a995fdc3012ac54eadfe56`, `setProperties` with `"Title#48:10"`, `"Source#48:11"`, detach, inject findings into Content slot. **Must contain the exact same content as the chat findings** — same competitors, patterns, recommendations, source URLs. Card is the persistent record of what informed the design.
5. Cover Card — import `eaebde6bd07d2f19f3f9c00a9587240cb085a90d`, `setProperties` with `"Feature#46:8"`, `"Flow#46:9"`, `"User#46:10"` — NEVER leave defaults
6. For each screen:
   a. Import components (header, sidebar, content components)
   b. Create screen frame (1440×960, auto-layout)
   c. App chrome (header, sidebar with nav items, page header)
   d. Content area with `paddingTop: 24, paddingLeft: 24, paddingRight: 24, paddingBottom: 24` — content NEVER flush against tab bar. Populate from `screen.content[]`.
   e. Append to wrapper
7. Report results to the designer:
   - Count of pushed screens
   - Tier breakdown (when any screen has a `tier` field):

     ```
     Generated <N> screens for <feature>:
       ✓ <count> recognized — <recipe names, comma-separated>
       ~ <count> adapted — <composition or matchedRecipe names>
       ! <count> improvised — <screen names>

     Confidence: avg <avg-confidence to 2 decimals>
     ```

   - If any screen is tier-3 (improvised), append:

     ```
     Review tier-3 justifications? [yes / skip]
       yes → print full justification text per tier-3 screen
       skip → proceed
     ```

   - If any screen is tier-2 deviation (adapted with `matchedRecipe` set, `composition` null), include those names in the `~ adapted` line and offer to surface their justifications under a separate `show-deviations` option.

   This summary is informational, not a gate. The designer decides whether to act on it.

**Push rules:**
- Each `use_figma` call creates 1-3 nodes max
- Return IDs from every call
- If a call fails, skip and continue
- Do NOT run `flow-to-figma.js` or read `.js` files

### HiFi conversion (if --hifi flag)

After FM push completes, delegate to `/convert-to-hifi`. Pass the pushed flow's Figma URL — the skill reads the FM frame, maps to DS Kit using `docs/fm-to-ds-map.json`, applies layout polish, and pushes a sibling frame named `[Flow name] — HiFi`. Generation card carries `mode: "hifi"`.

If `--audit` is also set, run `/design-audit` on the hifi frame after conversion completes (see Flag interaction matrix).

### Audit pass (if --audit flag)

After lo-fi push (or hifi push when `--hifi` is also set), invoke `/design-audit <pushed-url>`. Audit reports findings without modifying the design. To auto-fix, the designer follows up with `/design-audit <url> --fix all` or `--fix N`.

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
