---
name: generate-flow
description: Generate one or more lo-fi screens — single screen or multi-screen flow — from a feature idea, user story, or single-screen prompt. Also handles refine (URL + instruction), iterate (URL only), branch (URL + new variant), prototype wiring, and hifi conversion. Pushes to Figma.
argument-hint: "[feature description or Figma URL] [prose instruction] [--hifi --audit --variants N --ref <url> --breakpoints tablet,mobile --from <url> --branch <name> --states empty,error --no-prompt]"
---

# Generate Fat Marker Flow

Build one or more lo-fi screens (n≥1, single-screen output is first-class) and push to Figma. FM components, Inter font, FM palette.

> **Always pass `skillNames: "figma-use"` on every `mcp__claude_ai_Figma__use_figma` invocation.** This is mandatory per Figma's official contract — the `figma-use` skill carries the load-bearing Plugin API rules (atomic-on-error, color 0–1 range, HUG-after-append, font preload, await-all-promises, page-context-reset, return-all-IDs, explicit `variable.scopes`). Skipping it produces hard-to-debug failures.
> (Source: https://help.figma.com/hc/en-us/articles/39287396773399)

## Input shapes

The skill accepts three shapes; detection happens before the pipeline runs.

| Shape | Pattern | Example |
|-------|---------|---------|
| **Prompt** | Feature description, no URL | `/generate-flow create a data product` |
| **Refine** | Figma URL + prose instruction | `/generate-flow <url> "rename the primary CTA to 'Publish'"` |
| **Iterate / Branch** | `--from <url>` (no instruction) | `/generate-flow --from <url> --branch v2` |

Refine activates when ALL of: a Figma URL is provided, prose instruction is provided alongside, AND the URL resolves to a `pushedNodes[]` entry (or the wrapper `pageNodeId`) in `.last-push.json`. See **Refine shape** below for the full detection + behavior spec.

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
| `--no-prompt` | boolean | false | Skip the interactive pre-gen gate (Step 0.5) AND post-push audit gate (Step 7.5). Use defaults for any unset flags. See `references/ds-rules/interactive-gates.md`. Refine path is unaffected (already explicit). |

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

## Step 0 — Parse args + classify input shape

Parse args. Note which flags are explicitly passed:
- `--no-prompt` — parsed via `scripts/lib/parse-no-prompt.js`. Suppresses Step 0.5 + Step 7.5.
- `--hifi`, `--audit`, `--variants <N>`, `--ref <url>`, `--breakpoints <list>`, `--states <list>` — note presence; missing flags are subject to gates unless `--no-prompt` is set.
- `--from <url>`, `--branch <name>` — special cases. Not gated. Detected by companion or absent by default.

Classify input shape (Prompt / Refine / Iterate per the table above). **Refine and Iterate paths skip Step 0.5 entirely** — URL + prose (refine) or `--from <url>` (iterate) are already explicit intent.

## Step 0.5 — Pre-gen gate (interactive, greenfield-only)

**Skipped if:** input is Refine or Iterate shape, OR all of `--hifi`, `--variants`, `--ref`, `--breakpoints`, `--states` are explicitly passed, OR `--no-prompt` is set.

**Pre-flight prose detection** (run before showing the gate; suppresses gate questions for any flag whose value can be confidently inferred from prose):
- "ship-ready", "production", "make it real" → infer `--hifi`
- "alternatives", "show me variants", "different angles" → infer `--variants 3`
- Trailing Figma URLs after the feature prompt → infer `--ref <urls>`
- "responsive", "tablet", "mobile" → infer `--breakpoints` accordingly
- "with empty state", "add error state", "loading state" → infer `--states <list>`

After pre-flight inference, if any of the 5 gateable flags are STILL missing, present this prompt verbatim:

```
Configure generation for <feature>:

Output:        lo-fi (default) | hi-fi
Variants:      1 (default) | 2 | 3
References:    none (default) | <paste Figma URL(s) or image URL(s)>
Breakpoints:   desktop (default) | + tablet | + mobile | all
State coverage: none (default) | empty | error | loading | populated | all

Reply: enter for all defaults, or specify any subset.
Examples:
  hifi 3
  ref:https://figma.com/design/abc/foo?node-id=1-2
  hifi tablet,mobile
  3 ref:https://stripe.com/screen.png
  empty,error
  hifi 3 empty,error
```

Parser:
- Empty / "enter" → all defaults
- `hifi` token → `--hifi`
- Bare integer 1-3 → `--variants <N>`
- `ref:<url>` (repeatable, space-separated) → `--ref <url1>,<url2>,...`
- One of `tablet`, `mobile`, `tablet,mobile`, `all` (without `ref:` prefix) → `--breakpoints <list>` (`all` = `tablet,mobile,desktop`)
- One or more of `empty`, `error`, `loading`, `populated` (comma-separated, no `ref:` prefix) → `--states <list>`
- Invalid token → re-prompt with: "Unknown token `foo`. Valid: hifi, 1-3, ref:<url>, tablet, mobile, all, empty, error, loading, populated."
- 3 retries → abort with: "Aborting. Run again with `--no-prompt` to use defaults, or pass flags directly."

Once resolved, proceed to the pipeline.

## Refine shape

Refine is a shape the skill detects, not a flag. When detected (v1.56.0+), it runs a targeted edit through the engine in `scripts/lib/resolve-unit.js`, `scripts/lib/snapshot-store.js`, and `scripts/lib/derive-scope.js`, with the validator running scope-filtered (B-refine.1). It skips the standard 3-gate pipeline AND the Step 0.5 pre-gen gate, and pushes only the affected screen frames.

### Detection (all must match)

1. A Figma URL is present in the input
2. Prose instruction is present alongside (not just whitespace, not only flags)
3. The URL resolves to a `pushedNodes[]` entry (single-screen refine) or the wrapper `pageNodeId` (whole-flow refine) in `.last-push.json`

If any condition fails, fall back per the table below.

| Failure | Resolver `reason` | Behavior |
|---------|-------------------|----------|
| URL provided, no prose instruction | n/a | Iterate mode (`--from <url>` semantics) |
| Prose provided, no URL | n/a | Standard generate from prompt |
| URL parses but `fileKey` doesn't match the local manifest | `file mismatch` | Treat as new generation; warn: "no prior push found, treating as new flow." |
| URL parses and file matches, but `nodeId` is not in `pushedNodes` and not the wrapper `pageNodeId` (designer copied a child or random node) | `node not in pushedNodes` | **Loud error:** "URL points to a nested element or wrapper. Copy the screen frame URL and retry." Do not silently fall through. |
| URL matches a `pushedNodes` entry but the manifest pre-dates v1.56.0 (no `screenId` field) | `manifest pre-dates screenId` | Treat as new generation; warn: "manifest is from an older plugin version; treating as new flow. Re-push once to enable surgical refines." |
| URL parses but the resolver string is malformed | `unparseable URL` | Treat as new generation; warn the designer the URL was unrecognized. |
| Manifest file unreadable / missing | `manifest unreadable` | Treat as new generation; warn: "no prior push manifest found at this location, treating as new flow." |
| Snapshot sidecar (`flow-data.snapshot.json`) missing or corrupt | n/a | Treat as new generation; warn: "no usable snapshot found, treating as new flow." |
| `derive-scope.js` returns `null` (AI's edit produced no actual data difference) | n/a | Abort: "no changes detected; nothing to push." Don't push or rewrite manifest. |
| Refine instruction the data model can't represent (e.g., "add a 3D shader") | n/a | Return error; suggest alternative or `/create-component`. |
| Refine instruction conflicts with glossary | n/a | Validator flags; companion presents conflict and asks. |
| Refine on a hifi unit | n/a | Re-route through `/generate-flow` refine on the underlying lo-fi data model (hifi is downstream); explain to designer. |

### Behavior (v1.56.0+)

> **Designer note:** Refine recreates affected screen frames (delete + re-push at the
> original wrapper position). Manual edits inside those frames are lost. Out-of-scope
> screen frames are preserved untouched — byte-identical layer trees before and after.
> If you need to keep manual edits inside a frame, don't refine it; copy the frame to a
> new wrapper first.

1. **Resolve URL.** Run `scripts/lib/resolve-unit.js` `resolveByUrl(url, manifestPath)`.
   The manifest path is inferred from the URL's enclosing project flow directory
   (typically `{project_working_directory}/flows/<feature>/.last-push.json`).
   - `kind === "miss"` → fall through per the failure table; emit the message tied to `reason`.
   - `kind === "single-unit"` → proceed with single-screen refine; `screenId` + `figmaNodeId` are returned.
   - `kind === "full"` → proceed; designer pasted the wrapper URL → whole-flow refine.

2. **Load snapshot.** Read `flow-data.snapshot.json` from the same manifest dir via
   `scripts/lib/snapshot-store.js` `read()`. If `null` → fall through to greenfield with the
   documented warning ("no usable snapshot found, treating as new flow").

3. **Apply edit inline.** AI reads prose + snapshot in context. Mutate the targeted screen
   object(s) in memory, then write the result as the new `flow-data.json`.
   No screen-generator agents — refine is a targeted edit, not parallel generation.

   **C-vision (v1.57.0+) note:** the snapshot's `meta.references[]` carries cached
   fingerprints from the prior push. Step 4.5 logic applies in refine: reuse fingerprints
   whose URL is unchanged in the new flow-data; re-analyze (via `get_screenshot` →
   vision-extract) only when a ref URL changed. The targeted edit may also add or remove
   refs entirely, in which case re-analysis follows the standard step 4.5 flow.

4. **Derive scope.** Run `scripts/lib/derive-scope.js` `deriveScope(snapshot, newData)`.
   - Returns a scope tag (`single-unit:<id>` | `multi-unit:[…]` | `full`) → continue.
   - Returns `null` → abort with `"no changes detected; nothing to push."` Don't push or rewrite manifest.

5. **Validate.** Run validator with the derived scope:
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-flow-data.js" \
     {project_working_directory}/flows/<feature>/flow-data.json \
     --scope <scope-tag>
   ```
   Findings filtered to changed screens. P0s → patch in place per existing 3-strike protocol;
   warnings → proceed.

6. **Push surgically.** For each changed screen id (in original wrapper order):
   a. Look up Figma node id: `pushedNodes` entry where `screenId === <id>` → `id`.
   b. Note the frame's position index within the wrapper. Recreation must restore the same
      index, or refine reshuffles unrelated screens.
   c. `use_figma`: delete that frame.
   d. `use_figma`: recreate frame from the new screen data (same per-screen push pattern as
      the greenfield Step 6 of the standard push sequence) and insert at the recorded position.

   Skip wrapper / Cover Card / Research card / Tier Summary recreation — those persist.
   Update GenLog metadata fields (Date, Duration, Plugin Version) via `setProperties` on the
   existing GenLog instance. Emit the Scope text node sibling per existing Step 3b — the
   runtime scope variable from §4 flows directly here.

7. **Rewrite manifest + snapshot.** Update `.last-push.json`: refresh entries for changed
   screens (new Figma node ids, new tier/justification if changed), preserve untouched
   entries verbatim, refresh `sourceHash` / `pushedAt` / `componentKeys` / hash fields.
   Then call `scripts/lib/snapshot-store.js` `write(manifestDir, newFlowData)` as the last step.

## Pipeline (3 gates, then build + push uninterrupted) — for prompt + greenfield generation

1. Read `references/context/app-context.md` → determine app (Studio/Explorer/Administration)
2. **Gate 1 — Research** (present verbatim, see below)
3. **Gate 2 — Research findings** (mandatory when research opted-in, see below)
4. **Gate 3 — Screen list + detail level** (single gate, both choices, see below)
4.5. **Vision analysis on `meta.references[]`** (C-vision, v1.57.0+) — when `--ref <url>` was provided and `meta.references[]` is non-empty, run the vision pipeline before building flow-data. Skip entirely when `meta.references` is missing or empty (C-vision is opt-in).

   ```bash
   # Load the canonical RECIPE_IDS for vision-prompt parameterization:
   source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
   "$NODE_BIN" -e 'console.log(require("'${CLAUDE_PLUGIN_ROOT}'/scripts/recipes/fingerprint-schema.js").RECIPE_IDS.join(", "))'
   ```

   For each entry in `meta.references[]`:

   1. **Cache check** (refine path): if `meta.references[i].fingerprint` already exists AND the snapshot's prior URL for this index matches the current URL → reuse the cached fingerprint. Skip to the next ref. (B-refine.2's `flow-data.snapshot.json` preserves the prior `meta.references[]` shape.)
   2. Otherwise, call `mcp__claude_ai_Figma__get_screenshot` with the ref URL → image bytes.
   3. Run the vision-extraction prompt below on the screenshot, parameterized with the RECIPE_IDS list from the bash command above.
   4. Validate the output via `scripts/recipes/fingerprint-schema.js` `validateFingerprint`. If invalid: retry once with a "your previous output was invalid; emit STRICT JSON" reminder. If still invalid: drop the invalid fields, persist the rest. (Empty fingerprint objects are valid.)
   5. Persist on `meta.references[i].fingerprint`, including `extracted_at` as the current ISO timestamp.

   **Vision-extraction prompt template:**

   ```
   Analyze the attached screenshot and extract a structural fingerprint as STRICT JSON.

   Output ONLY this JSON object — no prose, no markdown fences:

   {
     "density": "high" | "medium" | "low",
     "hierarchy_depth": <integer 1-8>,
     "primary_components": [<lowercase strings, e.g., "toolbar", "table", "filter-chips">],
     "layout_archetype": <one of: <COPY THE RECIPE_IDS LIST FROM THE BASH OUTPUT HERE>>
   }

   Definitions:
   - density: information density of the layout. high = packed (many rows/columns/data points per screen). medium = balanced. low = generous whitespace, hero-style.
   - hierarchy_depth: levels of visual nesting from top-level container to leaf content. A page with sidebar + main + table-with-rows = depth 4.
   - primary_components: 3-7 dominant UI elements. Use generic noun phrases (e.g., "command palette", "filter chips"), not implementation names.
   - layout_archetype: closest match from the provided recipe ID list. If the screenshot does not clearly match any, OMIT the field entirely. Do not guess.
   ```

   **Failure-mode dispatch:**

   | Mode | Behavior |
   |------|----------|
   | `get_screenshot` MCP fails (auth, missing node, file deleted) | Per-ref warning to designer; mark this fingerprint as missing; continue with remaining refs. |
   | Vision returns malformed JSON | Retry once with strict-JSON reminder. If still invalid, soft-fail this ref. |
   | Vision returns `layout_archetype` not in `RECIPE_IDS` | Drop that field, keep density/depth/components. |
   | All refs fail | Loud abort: "Could not extract fingerprints from any reference. Drop `--ref` or fix the URLs and retry." |
   | Some refs fail | Proceed with successful subset. Surface a list of which URLs failed and why. |
   | `kind === "image"` URL provided | Loud error per Sprint A v1: "Image URLs not yet supported. Screenshot into a Figma frame first." Abort. |

   **Pass through to screen-generators:** the persisted `meta.references[]` (with fingerprints attached) flows into screen-generator agents' input as the "Reference fingerprints" block (see `agents/screen-generator.md`). Sequential mode reads them inline; parallel mode includes them in each batch's dispatch payload.

5. Build `flow-data.json`
   - **Tier classification (REQUIRED — runs in BOTH modes before generating screen content):** Read `agents/screen-generator.md` Step 0 and apply the classifier per-screen. Every screen object in the output MUST carry the 5 tier fields (`tier`, `confidence`, `matchedRecipe`, `composition`, `justification`) populated according to the per-tier field rules in that section. Then read `agents/screen-generator.md` "Tier-aware generation rules" section and apply the rules matching each screen's tier when authoring its content. **Parallel and sequential modes both apply the classifier — sequential does NOT skip Step 0.**
   - Read `recipes/flow/_index.json` — if an archetype matches the screen, use its skeleton. Recipes are accelerators, not constraints.
   - **Parallel mode (6+ screens):** Dispatch `screen-generator` agents in batches of 2-3. **When `meta.references[]` has fingerprints attached (C-vision step 4.5)**, copy the full `meta.references[]` array into each batch's dispatch prompt as a "Reference fingerprints" input block — see `agents/screen-generator.md`. Without this, the agent will report empty fingerprints even though step 4.5 persisted them. Merge with:
     ```bash
     source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
     "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/transformers/merge-partials.js" \
       --type flow --partials-dir {project_working_directory}/flows/.partial \
       --output {project_working_directory}/flows/flow-data.json
     ```
     Sequential mode (<6 screens): build flow-data.json directly — but FIRST classify each screen per the agent's Step 0 (above). When `meta.references[]` has fingerprints, the AI reads them inline from the in-memory flow-data when picking recipes.
6. **Validate flow data** — run the validation script before pushing:
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-flow-data.js" \
     {project_working_directory}/flows/flow-data.json
   ```
   - Exit 1 (P0s found): fix all banned placeholder text before pushing. Common P0s: `"Page Title"`, `"Button label"`, `"Description text"`, `"Label"`, `"Nav Item"`.
   - Exit 2 (P1s only): report terminology or token warnings to user, proceed with push.
   - Exit 0: clean, proceed.

   **Refine runs — pass `--scope`:** when this run is a refine (URL + prose, modifying one or more existing screens rather than full regenerate), pass the affected screen ids via `--scope`. Validator findings will then exclude unchanged screens, so designers don't see noise about pre-existing issues on screens they didn't touch.

   ```bash
   # Single-screen refine
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-flow-data.js" \
     {project_working_directory}/flows/flow-data.json \
     --scope single-unit:notification-preferences-2

   # Multi-screen refine
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-flow-data.js" \
     {project_working_directory}/flows/flow-data.json \
     --scope multi-unit:[notification-preferences-1,notification-preferences-3]
   ```

   Scope is a runtime flag, not a data field — flow-data.json itself does not carry scope. Set `meta.mode = "refine"` on the artifact when applicable (that's the artifact-level signal).

**On validation failure (exit 1 / error findings):**

- Open `flow-data.json` with the Edit tool.
- For each `placeholder-text` finding: replace the placeholder string at the indicated path with the real content (typically derivable from `screens[N].name` or the user prompt).
- For each `missing-required-override` finding: add the missing prop to the INSTANCE node's `props` object with a real value.
- For each `unknown-component` finding: correct the `ref` slug (the validator suggests near matches via Levenshtein when applicable).
- For each `hardcoded-color` finding: replace the hex/rgb/`{r,g,b}` literal at the indicated path with a `var(--zen-…)` or `var(--fm-…)` token reference. **Never push hardcoded colors** — see `vendor/tokens/tokens.json` for the available token names.
- **Do NOT re-dispatch screen-generator agents.** Patch in-place with Edit, then re-run the validator.
- **Retry cap:** if the same finding kind on the same path persists across 3 consecutive validator runs, stop and surface the validator output to the user. Do not loop further.

For warning-level findings (`default-true-boolean-unset`, `unresolved-token`, `terminology-issue`, `unmuted-chrome`): exit 2, push proceeds. Findings surface in the GenLog text node.

**`unmuted-chrome` warning recovery (FM focus principle):** When the validator flags `fmNavItem` or `fmTab` instances as unmuted chrome on a non-chrome-feature screen, replace the variant with `State=Placeholder` (or use `fmPlaceholder` directly) for all instances except the canonical active marker (the one whose label matches `meta._glossary.sidebarActive`). This honors the rule that non-feature chrome is ALWAYS placeholder — see `references/ds-rules/quality-tiers.md`.

**`intent-mismatch` recovery (hifi tier only):** When the validator flags `intent-mismatch` findings on hifi-converted data, either change the variant to match the expected variant for the effective intent (e.g., `Type=Critical primary` for `destructive-action` on a DS button), OR change the `intent` field at the responsible node to reflect the actual screen role. For sibling-rule warnings ("destructive-action container ambiguous" or "missing Critical primary"), restructure the button group: exactly one Critical primary action button, with Tertiary or Secondary cancel/dismiss siblings.

7. Push to Figma (see Push section below)
7.5. **Post-push gate** (interactive — see Step 7.5 below) — runs the audit if `--audit` is set OR designer opts in via gate.
8. Preview (opt-in):
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-preview.js" flow-data.json --type flow -o {project_working_directory}/flows/[feature]-flow.html
   BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/renderers/ensure-server.sh "{project_working_directory}" 8765)
   ```
9. Parity check (opt-in) → `references/figma/parity-check.md` + `references/ds-rules/quality-checklist.md`. Manifest includes `sourceHash` (of flow-data.json), `componentKeys` (from push), and `tokenHash` (of tokens file).

---

## Step 7.5 — Post-push audit gate (interactive)

**Skipped if:** `--audit` is explicitly passed (audit runs automatically), OR `--no-prompt` is set, OR refine/iterate path (designer-driven, no extra prompts).

After push completes successfully and the result is reported to the designer, present this prompt verbatim:

```
Flow pushed. Audit it now?

  no (default) — finished, no further action
  yes          — runs /design-audit on the pushed result; reports findings

Reply: enter for no, or "yes".
```

Parser:
- Empty / "no" / "skip" → done; exit cleanly
- "yes" / "audit" → invoke `/design-audit <pushed-url>` per row 10 of companion intent table
- Invalid → re-prompt
- 3 retries → abort with: "Aborting. Run again with `--no-prompt` to skip, or pass `--audit` to auto-run."

When `--audit` is set explicitly, skip this gate and run the audit pipeline immediately after push (existing behavior preserved).

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

**FM focus principle (all tiers):** Non-feature chrome is ALWAYS placeholder. The tier controls how detailed the **feature-relevant** content is. See `references/ds-rules/quality-tiers.md` for concrete per-tier rules (Draft uses fmPlaceholder, Standard uses full contextual content, Production adds all states).

## Step 3.5 — Build flow glossary

After the screen list is approved, build a `_glossary` object and set it on `meta._glossary`. This ensures all screen-generators use identical terminology.

**Build from:**
1. Feature description → extract the primary entity name (e.g., "Data Product", "Dataset", "Scanner")
2. App context (from Gate 1) → verify the entity name matches `references/context/app-context.md` terminology (e.g., "Data product" not "dataset" when curated)
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

**Entity properties lookup:** After building the glossary, slugify the entity name (lowercase, replace spaces with hyphens) and look it up in `vendor/app-context/app-context.json` → `entities[slug]`. If found, set `_glossary.entityProperties` to the entity's `properties` array. Screen-generators use these for form field labels, table column headers, and detail page content instead of generic placeholders.

Example: entity "Data Product" → slug "data-product" → `entities["data-product"].properties` → `["name", "description", "status", "input ports", "output ports", "datasets", "contacts", "attachments"]`

If the flow doesn't center on a single entity (e.g., a dashboard or settings page), set entity fields to the most prominent noun in the feature description. Set verb fields to the most common actions visible in the screen list.

Set `meta._glossary` before dispatching screen-generators or building flow-data directly.

---

## Push to Figma

Read `references/figma/figma-push-patterns.md` for component keys and patterns. Push from `flow-data.json` using small `use_figma` calls. Always pass `skillNames: "figma-use"`.

**Push sequence:**

1. Navigate to target page + create wrapper frame
2. GenLog — import by key `a9653f30925367e96dea90093d750bfe70849571`, `setProperties` with `"Skill#3:0"`, `"Prompt#3:1"`, `"Date#3:2"`, `"Duration#3:3"`, `"Model#3:4"`, `"Plugin Version#3:5"`. **Read the Plugin Version from `plugin.json` at run time — never hardcode a number, and never copy a version printed anywhere in these docs (they go stale).** Get the live value with:
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
   "$NODE_BIN" -e 'process.stdout.write("v"+require(process.env.CLAUDE_PLUGIN_ROOT+"/.claude-plugin/plugin.json").version)'
   ```
   Use that exact output (e.g. `v1.98.1`) for `"Plugin Version#3:5"`.
3. Tier Summary (if any screen has a `tier` field) — call `buildTierSummary(screens)` from `scripts/lib/shared-constants.js`. If it returns a TEXT node spec (not null), push the TEXT node into the wrapper as a sibling of the GenLog instance, immediately following it. Skip when `buildTierSummary` returns null (none of the screens are tiered).
3b. **Scope tag (B-refine.1, v1.55.0+)** — when this run was scoped (`--scope single-unit:<id>` or `multi-unit:[…]`), push an additional TEXT node sibling immediately after Tier Summary with content `"Scope: <scope-tag>"` (e.g., `"Scope: single-unit:notification-preferences-2"`). Use the same TEXT styling as Tier Summary. Skip when scope is `"full"` (the default; producing no annotation matches v1.54.x behavior). The skill holds scope in its own runtime state — passed to the validator via `--scope` and to this push step in parallel.
4. Research card (if opted-in) — import Research Frame `e671618f2b4c6ea406a995fdc3012ac54eadfe56`, `setProperties` with `"Title#48:10"`, `"Source#48:11"`, detach, inject findings into Content slot. **Must contain the exact same content as the chat findings** — same competitors, patterns, recommendations, source URLs. Card is the persistent record of what informed the design.
5. Cover Card — import `eaebde6bd07d2f19f3f9c00a9587240cb085a90d`, `setProperties` with `"Feature#46:8"`, `"Flow#46:9"`, `"User#46:10"` — NEVER leave defaults
6. For each screen:
   a. Import components (header, sidebar, content components)
   b. Create screen frame — width **1440 fixed**, VERTICAL auto-layout, **height HUGS content** (`primaryAxisSizingMode = 'AUTO'`). 960 is a *minimum* (set a min-height), NOT a fixed cap. **Never fix the height at 960 with `clipsContent`** — tall screens (long forms, multi-section pages) MUST grow downward, never crop. If you need a viewport reference, add a non-clipping 960 guide, but the frame itself hugs.
   c. App chrome — **set EVERY chrome component's props from the screen data; never leave a default placeholder.** `"Page Title"`, `"Description text"`, `"Button label"`, `"Nav Item"` are P0 blockers (see `references/figma/figma-push-patterns.md` → "NEVER leave default property values"; prop keys + defaults for every chrome component are listed there). Chrome is NOT covered by the content emitter — you must `setProperties` it explicitly:
      - **App header** (`fm-app-header`) — variant `Type=` the screen's app (Admin / Explorer / Studio / Actian, from `meta.app`); set the product/app name via the nested `findOne` (per push-patterns).
      - **Page header** (`fm-page-header`) — `setProperties`: `"Title#979:22"` ← `screen.pageHeader.title`, `"Subtitle#979:23"` ← `screen.pageHeader.subtitle`. Variant `Type=Title + Subtitle`, or `Type=Title + Actions` when `screen.pageHeader.actions[]` is non-empty — then push one `fm-button` per action with `"Label#1411:32"` ← the action label (NEVER "Button label"). Give the page-header band ≈24px top + horizontal padding so the title is not flush against the app header (this is the "no header margin" fix).
      - **Sidebar** — for each `screen.navItems[i]`, set the side-nav item `"Label#1463:4"` ← the nav label; the item matching `screen.activeNavItem` (or `meta._glossary.sidebarActive`) gets variant `State=On`, all others `State=Placeholder` (focus principle — `references/ds-rules/quality-tiers.md`).
   d. Content area with `paddingTop: 24, paddingLeft: 24, paddingRight: 24, paddingBottom: 24` — content NEVER flush against tab bar. Populate from `screen.content[]`. Capture the content-area frame's id from its creation call's returned `createdNodeIds[0]` — that id is `<contentFrameId>` below.

   **Content push (deterministic, v1.98+) — preferred:** instead of hand-walking `content[]`, emit the whole content tree as one atomic Plugin-API script. Capture the JSON for `screen.content[]` into `$CONTENT_JSON`, then:
   ```bash
   printf '%s' "$CONTENT_JSON" | (
     source "$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh" &&
     "$NODE_BIN" "$CLAUDE_PLUGIN_ROOT/scripts/renderers/html-renderers/render-node-figma.js" \
       --parent-id "<contentFrameId>"
   )
   ```
   Capture stdout (Plugin-API JS) and pass it **verbatim** into ONE `mcp__claude_ai_Figma__use_figma` call (`skillNames: "figma-use"`). On exit 1, read the `{ ok:false, errors }` JSON on stderr, fix the offending `content[]` node, and re-run the emitter — never hand-edit the emitted JS. This guarantees the Figma content is mechanically identical to the HTML preview produced by the twin `render-node.js`.

   **Fallback (parallel-change, MIGRATIONS Rule 1):** the hand-walk in sub-step **d** above stays valid if the emitter can't yet handle a node; it remains documented until cutover completes.

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

After FM push completes, delegate to `/convert-to-hifi`. Pass the pushed flow's Figma URL — the skill reads the FM frame, maps to DS Kit using `references/convert-to-hifi/fm-to-ds-map.json`, applies layout polish, and pushes a sibling frame named `[Flow name] — HiFi`. Generation card carries `mode: "hifi"`.

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
- **Copy:** All visible text follows `vendor/content/dist/global.md` (cross-cutting voice/tone) + per-component `vendor/components/dist/guidelines/<slug>.json` `domains.content` (component-specific copy) — sentence case for all UI text, verb + object button labels ("Create data product"), no banned words — apply the full avoid-list in `vendor/content/dist/words-to-avoid.json` (do not inline a subset), placeholder text models input (never repeats the field label), empty states include a headline + body + CTA

## References

- `references/figma/figma-push-patterns.md` — component keys, push patterns, Plugin API templates
- `references/generate-flow/research-guide.md` — competitor research, reference analysis
- `references/ds-rules/quality-tiers.md` — Draft / Standard / Production concrete rules
- `references/context/app-context.md` — app inference, entity model, terminology
- `references/context/ux-patterns.md` — SaaS UX pattern library by flow type
- `references/ds-rules/layout-patterns.md` — canonical page layouts
- `references/figma/parity-check.md` — post-push parity check
- `references/ds-rules/quality-checklist.md` — cleanup pass checklist
- `references/figma/prototype-reference.md` — interactive HTML prototype (opt-in)
- `references/figma/prototype-wiring.md` — Figma prototype wiring (opt-in)
- `recipes/flow/_index.json` — archetype recipe catalog
