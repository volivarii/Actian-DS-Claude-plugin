# generate-flow: interactive gates

This file holds the generate-flow interactive gates, presented verbatim: Gate 1
(research opt-in), Gate 2 (research findings), Gate 3 (screen list, detail
level, and generation config), and Step 7.5 (the combined post-build gate
offering push and audit). It also holds two non-gate sections: the Screen list
contract (Step 5.0) and the Look (after the final render). `skills/generate-flow/SKILL.md`
points here from its Gates section; read each gate at the moment it is due, not before.

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

**Frame by use case (S2).** Resolve the app's use cases: `source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh" && "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/lib/app-context/resolve-patterns.js" --app <app>` returns a `useCases` array of `{audience, jobs, patterns}`. If the app has **one** use case, frame the screen list around its `jobs` + `audience`. If it has **multiple** (Studio has 2), pick by prompt keywords: `import|wizard|engineer|connect|pipeline|ingest` → the data-engineer use case; `catalog|governance|steward|curate|lineage|glossary|quality` → the steward use case; when the prompt names no audience keyword from either list, take `useCases[0]` and state it on its own line when presenting the screen list: `Use case: steward (say "engineer use case" to switch).` This is the one rule for when the use-case line is stated; `SKILL.md` states it the same way in one clause. Carry the chosen use case forward to Step 3.5 as `--use-case <audience word>` (steward, engineer, ...): the brief and every slice then hold that one use case. Orient the screen names, empty states, and primary CTAs around its `jobs`.

Present a numbered screen list, then copy verbatim:

```
Does this work, or would you like to adjust?

**Screens:** approve all, scope down ("just 1 & 2"), or describe changes

**Detail level:**
- **draft** — feature area only, minimal content, placeholder chrome
- **standard** — feature fully detailed, contextual labels and data (default)
- **production** — all states, edge cases, loading, empty, error

**Config (defaults shown; only answer to change):**
- Output:        **DS-native** (themed, share-ready; default) | `--lofi` (same tree, focus-aware gray skin) | `--fm` (FatMarker authoring, for a lo-fi Figma push)
- Variants:      1 (default) | 2 | 3
- References:    none (default) | <paste Figma URL(s)>
- Breakpoints:   desktop (default) | + tablet | + mobile | all
- State coverage: none (default) | empty | error | loading | populated | all

**Actions:**
- **"approve"** — standard detail, all config defaults, build the HTML deliverable
- **"approve draft"** or **"approve production"** — specify detail level
- **"approve hifi 3 empty,error"** — approve + set config inline (hi-fi = DS-native HTML; add `--push` for one-step whole-tree Figma artifact)
- **"push [Figma URL]"** — approve standard + push directly to Figma
```

Parse the response for screen approval, detail level, AND config tokens (`hifi`, `lofi`, `fm`, bare `1-3`, `ref:<url>`, `tablet`/`mobile`/`all`, `empty`/`error`/`loading`/`populated`); `lofi` sets `meta.skin: "lofi"`, `fm` means FatMarker authoring instead of DS-native, and `fm` wins over `lofi`/`hifi`. Default detail to **Standard**; default config to all-defaults. Invalid config token → re-prompt: "Unknown token `foo`. Valid: hifi, lofi, fm, 1-3, ref:<url>, tablet, mobile, all, empty, error, loading, populated." 3 retries → abort with: "Aborting. Run again with `--no-prompt` to use defaults, or pass flags directly." Full config grammar: `references/ds-rules/interactive-gates.md`.

**FM focus principle (all tiers):** Non-feature chrome is ALWAYS placeholder. The tier controls how detailed the **feature-relevant** content is. See `references/ds-rules/quality-tiers.md` for concrete per-tier rules (Draft uses fmPlaceholder, Standard uses full contextual content, Production adds all states).

## Screen list (Step 5.0, gated or not)

Each entry routes by what it declares; a declared pattern outranks the name:

- `pattern`: the slug of the app pattern that covers the screen, from the `patterns` array `resolve-patterns.js --app <app>` prints (the call that gives the use cases above). Declare one whenever a pattern's `description` fits the screen; a pattern with a `pageRecipe` makes the screen compose from the captured product page. Leave it out only when no pattern fits: `prepare-flow.js` then matches the name and says on stderr when it fell back to a keyword archetype. A screen that declares a `layer` and no pattern takes neither path: it gets no page skeleton and prints nothing, because a toast or a dialog composes from its kind alone.
- `layer`: `{ "kind": "panel" | "drawer" | "modal" | "toast", "over": <n> }` when the screen is a surface over screen n of this list (a side panel, a drawer, a dialog, a confirmation toast). The base renders unchanged underneath, so the layered screen carries only its body. The base must not itself be a layer.

`prepare-flow.js` exits 1 on a slug the app lacks or a malformed `layer`, naming the screen: fix the list and run it again.

A steward describing catalog items from a side panel:

```json
{ "screens": [
  { "name": "Catalog, no description", "template": "studio", "pattern": "faceted-browse" },
  { "name": "Several items selected", "template": "studio", "pattern": "faceted-browse" },
  { "name": "Describe items", "template": "studio", "pattern": "right-sliding-drawer", "layer": { "kind": "drawer", "over": 2 } },
  { "name": "Descriptions saved", "template": "studio", "layer": { "kind": "toast", "over": 2 } }
] }
```

## Look (after the final render)

Runs after SKILL.md Step 6.5 on every run that renders: push or not, `--no-prompt` or not.

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/look.js" {project_working_directory}/flows/flow-data.json \
  --brief {project_working_directory}/flows/.brief.json -o {project_working_directory}/flows/look/
```

Each `look: wrote <png> and <html> against <capture>` line is one screen composed from a captured product page. Read the render PNG and the capture PNG it names, then write three lines for that screen in the final message: the largest differences **in structure**, largest first (a region missing or extra, regions out of order, the wrong kind of surface, a list too sparse to read as real). The capture is a reference for page structure, never for appearance: the render draws the design system's Figma components on purpose and the product may still show older ones, so colour, type, spacing and component styling are never a difference, and neither is a region the flow adds or changes on purpose (its `adds`, or what the prompt asked for). `look: no screen composes from a capture with a screenshot` means there is nothing to compare: say so in one line. When only some screens pair, name the screens that paired and the others in one line: a screen pairs only when its page recipe carries a product screenshot, and today only the Catalog page does. Exit 1 means no brief, or a screen's render failed: report the stderr line and finish. Exit 2 means Chrome is missing: say so in one line and finish. The Look never fails the run, and it is never a pixel diff.

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

