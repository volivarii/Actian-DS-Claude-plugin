---
name: generate-flow
description: Generate one or more lo-fi screens — single screen or multi-screen flow — from a feature idea, user story, or single-screen prompt. Also handles refine (URL + instruction), iterate (URL only), branch (URL + new variant), prototype wiring, and hifi conversion. HTML-first; Figma push is opt-in.
argument-hint: "[feature description or Figma URL] [prose instruction] [--hifi --audit --variants N --ref <url> --breakpoints tablet,mobile --from <url> --branch <name> --states empty,error --push --no-push --no-prompt]"
---

# Generate Fat Marker Flow

Build one or more lo-fi screens (n≥1, single-screen output is first-class). HTML-first: the deliverable is one encapsulated, offline `flows/[feature].html` (two-view — clickable Prototype + all-screens Overview). Figma push is **opt-in**. FM components, Inter font, FM palette.

> **Always pass `skillNames: "figma-use"` on every `mcp__claude_ai_Figma__use_figma` invocation.** This is mandatory per Figma's official contract — the `figma-use` skill carries the load-bearing Plugin API rules (atomic-on-error, color 0–1 range, HUG-after-append, font preload, await-all-promises, page-context-reset, return-all-IDs, explicit `variable.scopes`). Skipping it produces hard-to-debug failures.
> (Source: https://help.figma.com/hc/en-us/articles/39287396773399)

## Input shapes

The skill accepts three shapes; detection happens before the pipeline runs.

| Shape                | Pattern                         | Example                                                      |
| -------------------- | ------------------------------- | ------------------------------------------------------------ |
| **Prompt**           | Feature description, no URL     | `/generate-flow create a data product`                       |
| **Refine**           | Figma URL + prose instruction   | `/generate-flow <url> "rename the primary CTA to 'Publish'"` |
| **Iterate / Branch** | `--from <url>` (no instruction) | `/generate-flow --from <url> --branch v2`                    |

Refine activates when ALL of: a Figma URL is provided, prose instruction is provided alongside, AND the URL resolves to a `pushedNodes[]` entry (or the wrapper `pageNodeId`) in `.last-push.json`. See **Refine shape** below for the full detection + behavior spec.

## Flags

| Flag                   | Type        | Default | Behavior                                                                                                                                                                                                                                                                                               |
| ---------------------- | ----------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--hifi`               | bool        | off     | After lo-fi push, runs hifi conversion on the result. Preserves prototype wiring. **Implies a Figma push** (produces a DS-Kit Figma artifact).                                                                                                                                                         |
| `--audit`              | bool        | off     | After lo-fi (or hifi if `--hifi`) push, runs `/design-audit` on the result. Reports findings; does not auto-fix unless paired with `--audit --fix all`. **Implies a Figma push.**                                                                                                                      |
| `--variants <n>`       | int         | 1       | Generates n parallel structurally-distinct takes (different recipe selection or composition). Range 2–5. n>5 → refuse with clear error. Lays out side-by-side. Provenance tracked in `.last-push.json`.                                                                                                |
| `--ref <url[,url]>`    | URL list    | none    | **v1: Figma URLs only.** Reference frames whose structural fingerprint biases recipe selection. Multi-URL = blended influence. For external references (Linear, Stripe, etc.), screenshot into a Figma frame first and pass that URL. Image-URL support targeted for v2 alongside the vision pipeline. |
| `--breakpoints <list>` | string list | none    | Comma-separated: `tablet`, `mobile`, `custom-Npx`. Generates additional variants per breakpoint. Lo-fi level = structural decisions only (collapse, stack).                                                                                                                                            |
| `--from <url>`         | URL         | none    | URL-type detected. **Figma URL** → iterate on existing flow (preserves data model, re-rolls recipes). **Jira/Confluence/Google doc URL** → spec input (extracts user story, acceptance criteria). **Image URL** → primary visual reference.                                                            |
| `--branch <name>`      | string      | none    | Requires `--from <url>`. Forks the flow into a sibling frame named `[original] — <name>`. Provenance in `.last-push.json` so `/compare-flows` works between branches.                                                                                                                                  |
| `--states <list>`      | string list | none    | State coverage: `empty`, `error`, `loading`, `no-permission`, `populated`, `partial-data`. Generates each as additional screens or variants.                                                                                                                                                           |
| `--push`               | bool        | off     | Opt in to a Figma push. Default greenfield is **HTML only, no push** — `--push` (or prose "push to figma", or `--hifi`/`--audit`, or accepting the Step 7.5 gate) opts in. Parsed via `scripts/lib/parse-push.js`. See `references/generate-flow/push-opt-in.md`.                                      |
| `--no-push`            | bool        | off     | Absolute veto. Overrides every push trigger (`--push`, prose intent, `--hifi`/`--audit`, and the gate). Wins ties when both `--push` and `--no-push` are present.                                                                                                                                      |
| `--no-prompt`          | boolean     | false   | Skip the interactive gates (the Step 3 config questions AND the Step 7.5 combined post-build gate). Use defaults for any unset flags. See `references/ds-rules/interactive-gates.md`. Refine path is unaffected (already explicit).                                                                    |

### Flag interaction matrix

| Combination                         | Behavior                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `--hifi --audit`                    | lo-fi → hifi → audit chain (both imply push); audit operates on hifi output                                  |
| `--variants 3 --hifi`               | 3 lo-fi variants → all converted to hifi; `--audit` runs per variant if also set                             |
| `--from <url> --variants 3`         | 3 alternative iterations on the existing flow                                                                |
| `--from <url> --branch X`           | Single fork named X. `--variants` is ignored when `--branch` is set.                                         |
| `--breakpoints tablet --variants 3` | 3 variants × 2 breakpoints (desktop + tablet) = 6 outputs. Hard cap: 9 outputs total.                        |
| `--ref <url> --states empty,error`  | Reference biases base layout; states inherit the same reference treatment.                                   |
| `--states X` without `--from`       | Generates flow + states from prompt (greenfield).                                                            |
| `--push --no-push`                  | `--no-push` wins — no push (the HTML deliverable still renders).                                             |
| `--hifi --no-push`                  | Implication vetoed — warn the designer that hifi/audit cannot run without a push; offer to drop `--no-push`. |

## Step 0 — Parse args + classify input shape

Parse args. Note which flags are explicitly passed:

- `--push` / `--no-push` — parsed via `scripts/lib/parse-push.js` → `parsePush(argv)` → `{ push, explicit }`. `--no-push` wins ties. Resolves whether Step 7 push runs (see **Push opt-in** below).
- `--no-prompt` — parsed via `scripts/lib/parse-no-prompt.js`. Suppresses the Step 3 config questions + the Step 7.5 gate.
- `--hifi`, `--audit`, `--variants <N>`, `--ref <url>`, `--breakpoints <list>`, `--states <list>` — note presence; missing flags are subject to gates unless `--no-prompt` is set. `--hifi`/`--audit` additionally imply a push.
- `--from <url>`, `--branch <name>` — special cases. Not gated. Detected by companion or absent by default.

Classify input shape (Prompt / Refine / Iterate per the table above). **Refine and Iterate paths skip Gate 3 entirely** — URL + prose (refine) or `--from <url>` (iterate) are already explicit intent.

## Push opt-in (resolve before Step 7)

The default greenfield run is **HTML only — no push**. A Figma push happens **only if** one of these resolves push to true:

- `--push` flag set.
- Prose intent in the prompt: "push to figma", "in figma", "as a figma file".
- `--hifi` or `--audit` set (they produce Figma artifacts → imply push).
- The designer accepts push at the Step 7.5 combined gate.

**`--no-push` overrides all of the above** (wins ties with `--push`).

**Explicit-Figma exemption:** refine / iterate / branch on an existing Figma URL **always push** — the designer is already editing a Figma artifact, so push is unconditional regardless of the opt-in default. (`--no-push` still vetoes as a power-user override.)

**REQUIRED:** read `references/generate-flow/push-opt-in.md` for the full trigger table, the `--no-push` veto rules, and the verbatim Step 7.5 combined gate prompt.

## Refine shape

Refine activates when ALL of: a Figma URL is provided, a prose instruction is
provided alongside, AND the URL resolves to a `pushedNodes[]` entry (or the
wrapper `pageNodeId`) in `.last-push.json`. Refine edits the existing
`flow-data.json` in place and re-pushes — it does not regenerate. Refine is on
the explicit-Figma path, so it **always pushes** (unless `--no-push`).

**REQUIRED:** before running a Refine, read
`references/generate-flow/refine.md` for the full detection rules and the
step-by-step behavior.

## Pipeline (3 gates, then build + render; push opt-in) — for prompt + greenfield generation

1. Read `references/context/app-context.md` → determine app (Studio/Explorer/Administration)
2. **Gate 1 — Research** (present verbatim, see below)
3. **Gate 2 — Research findings** (mandatory when research opted-in, see below)
4. **Gate 3 — Screen list + detail + config** (single merged gate — screen approval, detail level, AND generation config; see below). Prose pre-inference runs first.
   4.5. **Vision analysis on `meta.references[]`** (C-vision, v1.57.0+, opt-in) — when `--ref <url>` was provided and `meta.references[]` is non-empty, extract a structural fingerprint per reference before building flow-data; skip entirely when empty. **REQUIRED:** read `references/generate-flow/vision-refs.md` for the per-ref loop, the vision-extraction prompt template, and failure-mode handling.

5.0. **Skeleton — render the encapsulated deliverable immediately.** As soon as the screen list is approved (Gate 3), render the structure to the canonical artifact so the user sees it instantly instead of an empty panel:

- Write the ordered screen list to `{project_working_directory}/flows/screen-list.json` as `{ "meta": {…}, "screens": [{ "name": "<screen name>", "template": "<template>" }, …] }` (one entry per approved screen, in final order; carry the known `meta`).
- **Parallel mode (6+):** merge the screen list into `flow-data.json` (pending stubs) via the incremental merge against the (empty) partials dir, then render `--type flow-share`:
  ```bash
  source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
  "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/transformers/merge-partials.js" \
    --type flow --incremental \
    --screen-list {project_working_directory}/flows/screen-list.json \
    --partials-dir {project_working_directory}/flows/.partial \
    --output {project_working_directory}/flows/flow-data.json
  "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-preview.js" \
    {project_working_directory}/flows/flow-data.json --type flow-share \
    -o {project_working_directory}/flows/[feature].html
  ```
- **Sequential mode (<6):** author `flow-data.json` with one `{ "name": …, "template": …, "status": "pending" }` stub per screen (the skeleton), then run the same `assemble-preview.js … --type flow-share` render to `flows/[feature].html`.
- Tell the user: `Preview ready (skeleton) → {project_working_directory}/flows/[feature].html — open it in the browser (CLI/IDE) or it updates live in the Cowork panel.` **Fail-open:** any skeleton/render error is skipped — proceed to the build (no regression).

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
   - **Progress (chat) + live streaming:** this is the longest silent phase — keep the user informed AND populate the deliverable as screens land. Print one line per screen as it lands (parallel batches: as each batch's partials merge; sequential: as each screen object is authored): `✓ <N>/<M> <screen name>`. Lead with `Building <feature> — <M> screens` before the first. **After each `✓` line, re-emit the `--type flow-share` deliverable to `flows/[feature].html`** so the panel/browser fills in live — parallel: re-run the `merge-partials.js --incremental` + `assemble-preview.js … --type flow-share` pair from Step 5.0 (present partials become ready, the rest stay shimmer); sequential: replace that screen's pending stub with its real content (drop `status`) in `flow-data.json`, then re-run `assemble-preview.js … --type flow-share -o {project_working_directory}/flows/[feature].html`. Every streaming render is fail-open (a render error never blocks the build).
6. **Validate flow data** — run the validation script before rendering the final deliverable / pushing:

   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-flow-data.js" \
     {project_working_directory}/flows/flow-data.json
   ```

   - Exit 1 (P0s found): fix all banned placeholder text before pushing. Common P0s: `"Page Title"`, `"Button label"`, `"Description text"`, `"Label"`, `"Nav Item"`.
   - Exit 2 (P1s only): report terminology or token warnings to user, proceed.
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

For warning-level findings (`default-true-boolean-unset`, `unresolved-token`, `terminology-issue`, `unmuted-chrome`): exit 2, proceeds. Findings surface in the GenLog text node (and in the deliverable when pushed).

**`unmuted-chrome` warning recovery (FM focus principle):** When the validator flags `fmNavItem` or `fmTab` instances as unmuted chrome on a non-chrome-feature screen, replace the variant with `State=Placeholder` (or use `fmPlaceholder` directly) for all instances except the canonical active marker (the one whose label matches `meta._glossary.sidebarActive`). This honors the rule that non-feature chrome is ALWAYS placeholder — see `references/ds-rules/quality-tiers.md`.

**`intent-mismatch` recovery (hifi tier only):** When the validator flags `intent-mismatch` findings on hifi-converted data, either change the variant to match the expected variant for the effective intent (e.g., `Type=Critical primary` for `destructive-action` on a DS button), OR change the `intent` field at the responsible node to reflect the actual screen role. For sibling-rule warnings ("destructive-action container ambiguous" or "missing Critical primary"), restructure the button group: exactly one Critical primary action button, with Tertiary or Secondary cancel/dismiss siblings.

6.5. **Final render — the canonical encapsulated deliverable.** Validation passed, so every screen is now `ready`. Render the FINAL two-view deliverable (Prototype + Overview), self-contained and offline. This is the artifact you share; it is also the live preview's final state. No `--refresh`, no annotation inlining — annotations are **opt-in** (server-only via `ensure-server.sh`), structurally absent from the flow-share file:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-preview.js" \
  {project_working_directory}/flows/flow-data.json --type flow-share \
  -o {project_working_directory}/flows/[feature].html
```

Tell the user: `Your flow is ready → {project_working_directory}/flows/[feature].html`. **If the render fails, surface the error and continue** — for the HTML-only default this is the deliverable, so a failure is worth reporting; for a push run it is an aid, never a gate. (The render reads only `flow-data.json`; it has no dependency on the push.)

7. **Push to Figma — OPT-IN (only if push resolved).** Skipped otherwise (HTML-only default). Push runs when **`--push`**, prose "push to figma", `--hifi`/`--audit`, the explicit-Figma exemption (refine/iterate/branch), or acceptance at the Step 7.5 gate resolved push to true — and `--no-push` did not veto. See the **Push to Figma** section below and `references/generate-flow/push-opt-in.md`.
   - **Progress (chat):** print `Pushing <N>/<M> to Figma…` as each screen frame is pushed, so the push phase is never silent.
     7.5. **Combined post-build gate** (interactive — see Step 7.5 below) — single prompt offering push + audit. Skipped when `--no-prompt` is set, or for refine/iterate paths.
8. Annotations (opt-in) — the flow-share deliverable is annotation-free. To inspect annotations, re-serve the work dir via `ensure-server.sh`:
   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
   BASE_URL=$(${CLAUDE_PLUGIN_ROOT}/scripts/renderers/ensure-server.sh "{project_working_directory}" 8765)
   ```
9. Parity check (opt-in, push runs only) → `references/figma/parity-check.md` + `references/ds-rules/quality-checklist.md`. Manifest includes `sourceHash` (of flow-data.json), `componentKeys` (from push), and `tokenHash` (of tokens file).

---

## Step 7.5 — Combined post-build gate (interactive)

**Skipped if:** `--no-prompt` is set, OR refine/iterate/branch path (designer-driven, push already happened — at most offer audit per the reference).

After the `flows/[feature].html` deliverable is rendered (Step 6.5), present a **single combined gate** offering both push-to-Figma and audit. `--push` already resolved → skip the push offer (still offer audit unless `--audit` also set). `--audit` set → audit auto-runs (and implies push); skip that offer.

**REQUIRED:** present the verbatim combined gate prompt from
`references/generate-flow/push-opt-in.md` ("Combined post-build gate") and use
its parser. The choices it offers are: `done` (default — keep the HTML),
`push` (push to Figma), and `push + audit` (push to Figma, then audit the
pushed result). Audit always implies a push — `/design-audit` operates on a
Figma URL, not local HTML; typing "audit" is treated as "push + audit".

When `--audit` is set explicitly, skip this gate and run the push + audit pipeline immediately after the final render (existing behavior preserved).

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

## Gate 3 — Screen list + detail + config (SINGLE merged gate)

This single gate covers screen approval, detail level, AND generation config (the config questions folded in from the old pre-gen step). **Skipped if:** input is Refine or Iterate shape, OR all gateable config flags (`--hifi`, `--variants`, `--ref`, `--breakpoints`, `--states`) are explicitly passed, OR `--no-prompt` is set.

**Pre-flight prose inference** (run FIRST, before showing the gate; suppresses any config question whose value is confidently inferable from prose):

- "ship-ready", "production", "make it real" → infer `--hifi`
- "alternatives", "show me variants", "different angles" → infer `--variants 3`
- Trailing Figma URLs after the feature prompt → infer `--ref <urls>`
- "responsive", "tablet", "mobile" → infer `--breakpoints` accordingly
- "with empty state", "add error state", "loading state" → infer `--states <list>`

Present a numbered screen list, then copy verbatim:

```
Does this work, or would you like to adjust?

**Screens:** approve all, scope down ("just 1 & 2"), or describe changes

**Detail level:**
- **draft** — feature area only, minimal content, placeholder chrome
- **standard** — feature fully detailed, contextual labels and data (default)
- **production** — all states, edge cases, loading, empty, error

**Config (defaults shown; only answer to change):**
- Output:        lo-fi (default) | hi-fi
- Variants:      1 (default) | 2 | 3
- References:    none (default) | <paste Figma URL(s)>
- Breakpoints:   desktop (default) | + tablet | + mobile | all
- State coverage: none (default) | empty | error | loading | populated | all

**Actions:**
- **"approve"** — standard detail, all config defaults, build the HTML deliverable
- **"approve draft"** or **"approve production"** — specify detail level
- **"approve hifi 3 empty,error"** — approve + set config inline (hifi implies a Figma push)
- **"push [Figma URL]"** — approve standard + push directly to Figma
```

Parse the response for screen approval, detail level, AND config tokens (`hifi`, bare `1-3`, `ref:<url>`, `tablet`/`mobile`/`all`, `empty`/`error`/`loading`/`populated`). Default detail to **Standard**; default config to all-defaults. Invalid config token → re-prompt: "Unknown token `foo`. Valid: hifi, 1-3, ref:<url>, tablet, mobile, all, empty, error, loading, populated." 3 retries → abort with: "Aborting. Run again with `--no-prompt` to use defaults, or pass flags directly." Full config grammar: `references/ds-rules/interactive-gates.md`.

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
    "entityProperties": [
      "name",
      "description",
      "status",
      "input ports",
      "output ports",
      "datasets",
      "contacts",
      "attachments"
    ]
  }
}
```

**Entity properties lookup:** After building the glossary, slugify the entity name (lowercase, replace spaces with hyphens) and look it up in `vendor/app-context/app-context.json` → `entities[slug]`. If found, set `_glossary.entityProperties` to the entity's `properties` array. Screen-generators use these for form field labels, table column headers, and detail page content instead of generic placeholders.

Example: entity "Data Product" → slug "data-product" → `entities["data-product"].properties` → `["name", "description", "status", "input ports", "output ports", "datasets", "contacts", "attachments"]`

If the flow doesn't center on a single entity (e.g., a dashboard or settings page), set entity fields to the most prominent noun in the feature description. Set verb fields to the most common actions visible in the screen list.

Set `meta._glossary` before dispatching screen-generators or building flow-data directly.

---

## Push to Figma

Push is **opt-in** — only run this section when push resolved to true (see **Push opt-in** above). Read `references/figma/figma-push-patterns.md` for component keys and patterns. Push from `flow-data.json` using small `use_figma` calls. Always pass `skillNames: "figma-use"`.

**REQUIRED:** read `references/generate-flow/push-sequence.md` for the full push
sequence (wrapper + GenLog → tier/scope annotations → research/cover cards →
per-screen frame + chrome `setProperties` + the deterministic content emitter →
designer report) and the push rules.

### HiFi conversion (if --hifi flag)

After FM push completes, delegate to `/convert-to-hifi`. Pass the pushed flow's Figma URL — the skill reads the FM frame, maps to DS Kit using `references/convert-to-hifi/fm-to-ds-map.json`, applies layout polish, and pushes a sibling frame named `[Flow name] — HiFi`. Generation card carries `mode: "hifi"`. (`--hifi` implies a push — see Push opt-in.)

### Audit pass (if --audit flag)

After lo-fi push (or hifi push when `--hifi` is also set), invoke `/design-audit <pushed-url>`. Audit reports findings without modifying the design. To auto-fix, the designer follows up with `/design-audit <url> --fix all` or `--fix N`. (`--audit` implies a push.)

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
- `references/generate-flow/push-opt-in.md` — Figma push opt-in model, triggers, `--no-push` veto, combined gate prompt
- `references/generate-flow/refine.md` — refine detection + behavior (explicit-Figma path)
- `references/generate-flow/vision-refs.md` — `--ref` vision fingerprinting loop
- `references/generate-flow/push-sequence.md` — full Figma push sequence + rules
- `references/generate-flow/share.md` — flow-share two-view deliverable internals
- `references/generate-flow/research-guide.md` — competitor research, reference analysis
- `references/ds-rules/interactive-gates.md` — gate conventions, `--no-prompt`, config grammar
- `references/ds-rules/quality-tiers.md` — Draft / Standard / Production concrete rules
- `references/context/app-context.md` — app inference, entity model, terminology
- `references/context/ux-patterns.md` — SaaS UX pattern library by flow type
- `references/ds-rules/layout-patterns.md` — canonical page layouts
- `references/figma/parity-check.md` — post-push parity check
- `references/ds-rules/quality-checklist.md` — cleanup pass checklist
- `references/figma/prototype-reference.md` — interactive HTML prototype (opt-in)
- `references/figma/prototype-wiring.md` — Figma prototype wiring (opt-in)
- `recipes/flow/_index.json` — archetype recipe catalog
