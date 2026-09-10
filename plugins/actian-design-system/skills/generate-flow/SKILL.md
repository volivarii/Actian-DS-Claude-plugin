---
name: generate-flow
description: Generate one or more lo-fi screens — single screen or multi-screen flow — from a feature idea, user story, or single-screen prompt. Also handles refine (URL + instruction), iterate (URL only), branch (URL + new variant), prototype wiring, and hifi conversion. HTML-first; Figma push is opt-in.
argument-hint: "[feature description or Figma URL] [prose instruction] [--hifi --audit --variants N --ref <url> --breakpoints tablet,mobile --from <url> --branch <name> --states empty,error --push --no-push --no-prompt]"
---

# Generate Fat Marker Flow

<!-- plugin-root:begin -->
## Where the plugin lives

Bare `references/`, `vendor/`, `agents/`, `recipes/`, `templates/` and `scripts/` paths in this file are relative to the plugin root: the directory holding `.claude-plugin/plugin.json`, the parent of the `skills/` directory named in the base directory above. They are never relative to the project working directory. Every command in this file expects `CLAUDE_PLUGIN_ROOT` to name that root. In Cowork, bash runs inside a VM where the plugin is mounted under `/sessions/<vm>/mnt/.remote-plugins/<plugin id>/`, so set the variable once per shell before anything else:
The line is idempotent: when a later bash call finds the variable empty, run the line again before the command.

```bash
{ [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json" ]; } || export CLAUDE_PLUGIN_ROOT="$(for d in ${CLAUDE_REMOTE_PLUGINS_ROOT:-/sessions/*/mnt/.remote-plugins}/*/; do grep -qs '"name": *"actian-design-system"' "${d}.claude-plugin/plugin.json" && printf '%s' "${d%/}" && break; done)"; [ -n "$CLAUDE_PLUGIN_ROOT" ] || echo "plugin root not found: export CLAUDE_PLUGIN_ROOT=<the directory holding .claude-plugin/plugin.json>" >&2
```
<!-- plugin-root:end -->

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

| Flag                   | Type        | Default | Behavior                                                                                                                                                                                                        |
| ---------------------- | ----------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--hifi`               | bool        | off     | DS-native authoring: screens built against the DS vocabulary (`references/generate-flow/ds-components-authoring.md`) and rendered as themed hi-fi HTML (the deliverable). Combines with `--push` for a DS whole-tree Figma push (see push-sequence.md step 6 DS-screen path); incompatible with `--audit` (audit needs a lo-fi pushed frame, not DS-native). To audit a DS-native frame: push lo-fi with `--push`, then run `--hifi --push` on the same brief, then `/design-audit` the result.                        |
| `--audit`              | bool        | off     | After a lo-fi push, runs `/design-audit` on the pushed Figma frame and reports findings (auto-fix needs `--audit --fix all`). Implies a Figma push, so it does not combine with `--hifi`. Passed together with `--hifi`, the skill warns, keeps `--hifi` (the HTML deliverable; `--push` still applies), and drops `--audit`.                                                                                                             |
| `--variants <n>`       | int         | 1       | Generates n parallel structurally-distinct takes (different recipe selection or composition), laid out side-by-side. Range 2-5; refuse above 5. Ignored when `--branch` is set. Provenance tracked in `.last-push.json`.                                                                              |
| `--ref <url[,url]>`    | URL list    | none    | v1: Figma URLs only. Biases recipe selection toward the reference frame's structural fingerprint (multi-URL blends). Screenshot external references (Linear, Stripe, etc.) into a Figma frame first. `--states` screens inherit the same reference treatment as the base layout.                                                                                                   |
| `--breakpoints <list>` | string list | none    | Comma-separated: `tablet`, `mobile`, `custom-Npx`. Each breakpoint adds a variant alongside the desktop base (collapse/stack decisions only); combined with `--variants`, outputs multiply (3 variants with one breakpoint give 6), hard-capped at 9 total.                                                                                                          |
| `--from <url>`         | URL         | none    | URL-type detected: Figma URL iterates on the existing flow (preserves data model, re-rolls recipes); Jira/Confluence/Google doc URL is spec input (user story, acceptance criteria); image URL is a primary visual reference.                                                                          |
| `--branch <name>`      | string      | none    | Requires `--from <url>`. Forks the flow into a sibling frame named `[original] — <name>`; provenance in `.last-push.json` so `/compare-flows` works between branches.                                                                                                                                   |
| `--states <list>`      | string list | none    | State coverage: `empty`, `error`, `loading`, `no-permission`, `populated`, `partial-data`. Generates each as additional screens or variants.                                                                                                                                                            |
| `--push`               | bool        | off     | Opt in to a Figma push. Default greenfield is HTML only, no push — `--push` (or prose "push to figma", `--audit`, or accepting the Step 7.5 gate) opts in. Parsed via `scripts/lib/parse-push.js`. See `references/generate-flow/push-opt-in.md`.                                                     |
| `--no-push`            | bool        | off     | Absolute veto. Overrides every push trigger (`--push`, prose intent, `--audit`, the gate) and wins ties when both `--push` and `--no-push` are present.                                                                                                                                                 |
| `--no-prompt`          | bool        | false   | Skips the interactive gates (the Gate 3 config questions and the Step 7.5 combined post-build gate), using defaults for unset flags. See `references/ds-rules/interactive-gates.md`. Refine path is unaffected (already explicit).                                                                    |

## Step 0 — Parse args + classify input shape

Parse args. Note which flags are explicitly passed:

- `--push` / `--no-push`: parsed via `require("scripts/lib/parse-push.js")(argv)` → `{ push, explicit }`. `--no-push` wins ties. Resolves whether Step 7 push runs (see **Push opt-in** below).
- `--no-prompt`: parsed via `scripts/lib/parse-no-prompt.js`. Suppresses the Gate 3 config questions + the Step 7.5 gate.
- `--hifi`, `--audit`, `--variants <N>`, `--ref <url>`, `--breakpoints <list>`, `--states <list>` — note presence; missing flags are subject to gates unless `--no-prompt` is set. `--audit` additionally implies a push; `--hifi` does NOT imply a push (it controls authoring mode, not push destination).
- `--from <url>`, `--branch <name>` — special cases. Not gated. Detected by companion or absent by default.

Classify input shape (Prompt / Refine / Iterate per the table above). **Refine and Iterate paths skip Gate 3 entirely** — URL + prose (refine) or `--from <url>` (iterate) are already explicit intent.

## Push opt-in

Push is opt-in and resolved before Step 7; the detection rules and the `--push` / `--no-push` precedence are in `references/generate-flow/push-opt-in.md`; the push sequence itself is in `references/generate-flow/figma-push.md` (read it only when push resolved to true).

## Refine shape

A Figma URL plus a prose instruction on a flow this plugin pushed is a refine; detection and behaviour are in `references/generate-flow/refine.md`, and the push half in `references/generate-flow/figma-push.md`.

## Pipeline (3 gates, then build + render; push opt-in) — for prompt + greenfield generation

1. Read `references/context/app-context.md` → determine app (Studio/Explorer/Administration). Disambiguate the app against the per-app keyword lists in `vendor/app-context/dist/app-context.json` → `apps[*].signals` (e.g. `studio`: steward/govern/curate/lineage…; `explorer`: browse/discover/marketplace…). An explicit app in the prompt ("in Studio") always wins.

   **Announce the app (S2).** State one line: `Generating for **<App>**`. Add the parenthesis `(inferred, say "use Explorer" to switch)` only when the app was inferred, never when the prompt named it, then continue without waiting. Accept an override only if it matches a known app (`scripts/lib/app-context/resolve-patterns.js` / `resolve-chrome.js` list the apps). **Hard-ask** which app *only* when signals match **zero** apps, or **two or more** apps with equal strength. This keeps the HTML-first "no new mandatory gate" rule: it's an announcement with an escape hatch, not a gate.

2. **Gate 1 — Research** (present verbatim, see below)
3. **Gate 2 — Research findings** (mandatory when research opted-in, see below)
4. **Gate 3 — Screen list + detail + config** (single merged gate — screen approval, detail level, AND generation config; see below). Prose pre-inference runs first.
   4.5. **Vision analysis on `meta.references[]`** (C-vision, v1.57.0+, opt-in) — when `--ref <url>` was provided and `meta.references[]` is non-empty, extract a structural fingerprint per reference before building flow-data; skip entirely when empty. **REQUIRED:** read `references/generate-flow/vision-refs.md` for the per-ref loop, the vision-extraction prompt template, and failure-mode handling.

5.0. **Skeleton — render the encapsulated deliverable immediately.** As soon as the screen list is approved (Gate 3), render the structure to the canonical artifact so the user sees it instantly instead of an empty panel:

- Write the ordered screen list to `{project_working_directory}/flows/screen-list.json` as `{ "meta": {…}, "screens": [{ "name": "<screen name>", "template": "<template>" }, …] }` (one entry per approved screen, in final order; carry the known `meta`). `template` is one of `studio`, `explorer`, `admin` (alias `administration`), `no-sidebar`, `bare`, `compact`, `mobile`, `tablet`, `custom` (the chrome vocabulary in `scripts/renderers/html-renderers/ds-screen-tree.js`); any other value, such as an archetype name like `browse-search`, falls back to the legacy `appHeader`/`sidebar` fields and a screen carrying neither renders no chrome.
- **Every screen count:** merge the screen list into `flow-data.json` (pending stubs) via the incremental merge against the (empty) partials dir, then render `--type flow-share`:
  ```bash
  source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
  "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/transformers/merge-partials.js" \
    --type flow --partials-dir {project_working_directory}/flows/.partial \
    --output {project_working_directory}/flows/flow-data.json \
    --incremental --screen-list {project_working_directory}/flows/screen-list.json
  "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-preview.js" \
    {project_working_directory}/flows/flow-data.json --type flow-share \
    -o {project_working_directory}/flows/[feature].html
  ```
- Tell the user: `Preview ready (skeleton) → {project_working_directory}/flows/[feature].html — open it in the browser (CLI/IDE) or it updates live in the Cowork panel.` **Fail-open:** any skeleton/render error is skipped — proceed to the build (no regression).

5. Build `flow-data.json`
   - **Tier classification (REQUIRED for every screen):** the `screen-generator` agent applies the classifier per screen via its own Step 0. Every screen object in its output MUST carry the 5 tier fields (`tier`, `confidence`, `matchedRecipe`, `composition`, `justification`) populated according to the per-tier field rules in that section, and its "Tier-aware generation rules" section governs how each screen's content is authored.
   - **Authoring (every screen count):** dispatch `screen-generator` in batches of at most 3 screens, in parallel, each with: the brief path `{project_working_directory}/flows/.brief.json`, its screen numbers and names, `_index`, the output path `{project_working_directory}/flows/.partial/screens-<a>-<b>.json`, `meta`, and `meta.references[]` when fingerprints exist (see `references/generate-flow/vision-refs.md`). The agent reads the brief and `references/generate-flow/html-reference.md` (plus `references/generate-flow/ds-components-authoring.md` under `--hifi`), nothing else; the agent uses each screen's `archetype.skeleton` or `pageRecipe.skeleton` from the brief as the starting point. Merge as each batch lands:
     ```bash
     source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
     "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/transformers/merge-partials.js" \
       --type flow --partials-dir {project_working_directory}/flows/.partial \
       --output {project_working_directory}/flows/flow-data.json \
       --incremental --screen-list {project_working_directory}/flows/screen-list.json
     ```
     The main agent prepares, merges, validates and renders; it does not author screen content.
   - **Progress (chat) + live streaming:** this is the longest silent phase — keep the user informed AND populate the deliverable as screens land. Print one line per screen as it lands, as each batch's partials merge: `✓ <N>/<M> <screen name>`. Lead with `Building <feature> — <M> screens` before the first. **After each `✓` line, re-emit the `--type flow-share` deliverable to `flows/[feature].html`** so the panel/browser fills in live — re-run the `merge-partials.js --incremental` + `assemble-preview.js … --type flow-share` pair from Step 5.0 (present partials become ready, the rest stay shimmer). Every streaming render is fail-open (a render error never blocks the build).
6. **Validate flow data** — run the validation script before rendering the final deliverable / pushing:

   ```bash
   source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-flow-data.js" \
     {project_working_directory}/flows/flow-data.json \
     --write-ids
   ```

   - Exit 1 (P0s found): fix all banned placeholder text before pushing. Common P0s: `"Page Title"`, `"Button label"`, `"Description text"`, `"Label"`, `"Nav Item"`.
   - Exit 2 (P1s only): report terminology or token warnings to user, proceed.
   - Exit 0: clean, proceed.

   **Refine runs — pass `--scope`:** when this run is a refine (URL + prose, modifying one or more existing screens rather than full regenerate), pass the affected screen ids via `--scope`. Validator findings will then exclude unchanged screens, so designers don't see noise about pre-existing issues on screens they didn't touch.

   ```bash
   # Single-screen refine
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-flow-data.js" \
     {project_working_directory}/flows/flow-data.json \
     --scope single-unit:notification-preferences-2 \
     --write-ids

   # Multi-screen refine
   "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/validation/validate-flow-data.js" \
     {project_working_directory}/flows/flow-data.json \
     --scope multi-unit:[notification-preferences-1,notification-preferences-3] \
     --write-ids
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

7. **Push to Figma — OPT-IN (only if push resolved).** Skipped otherwise (HTML-only default). Push runs when **`--push`**, prose "push to figma", `--audit`, the explicit-Figma exemption (refine/iterate/branch), or acceptance at the Step 7.5 gate resolved push to true — and `--no-push` did not veto. (`--hifi` alone does NOT trigger a push — it selects DS-native authoring mode.) See the **Push to Figma** section below and `references/generate-flow/push-opt-in.md`.
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

Presented verbatim from `references/generate-flow/gates.md` after the final render: done (default), push to Figma, or push to Figma + audit. Read it at that moment, not before.

## Gates

The three interactive gates are presented verbatim from `references/generate-flow/gates.md`: Gate 1 (research; default when the user gives no answer or `--no-prompt` is set: "No, just build it", say so in one line), Gate 2 (findings, only when research was opted in), Gate 3 (screen list + detail + config; the use case line defaults to `useCases[0]` and is stated only when the app was inferred). Read `gates.md` at the moment each gate is due, not before.

## Step 3.5 — Build flow glossary

After Gate 3, run once (the app from Pipeline step 1, the entity slug resolved in the Pipeline's entity step, the screen list written at Step 5.0):

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/lib/app-context/prepare-flow.js" \
  --app <app> --entity <slug> \
  --screen-list {project_working_directory}/flows/screen-list.json \
  -o {project_working_directory}/flows/.brief.json
```

Omit `--entity` when the feature has no primary entity. Copy `brief.glossary` into `meta._glossary` of `flow-data.json` as is (chrome, patterns, useCases, entityProperties, relationships, entityPatterns, entityComponents); the chrome is the authoritative shell every screen shares, do not add, remove, rename or reorder sidebar items unless the prompt asks to restructure the app. Then set `meta._glossary.useCases` to a one-element array holding the use case chosen at Gate 3 (the brief carries every use case of the app; the gate is where the choice is made). Read `brief.join` before trusting an empty entity answer: `present: false` means the vendored snapshot predates the edge. On refine or iterate of an existing flow keep the existing `meta._glossary.chrome` and `chromeJustification`. The brief is the only app-context input the author agent reads.

---

## Push to Figma

Only when push resolved to true: read `references/generate-flow/figma-push.md` and follow its sequence (DS-native authoring under `--hifi`, the audit pass under `--audit`, parity, wiring).

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
- `references/generate-flow/html-reference.md`: HTML template structure, FM component table, content node spec
- `references/generate-flow/ds-components-authoring.md`: DS Kit component vocabulary for `--hifi` DS-native authoring
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
