---
name: component-brief
description: Generate a structured brief for a DS component with cards (variants, tokens, API, usage, a11y). Accepts Figma URL or component name.
argument-hint: "[Figma URL or component name] [generate N,N,N] [research all|<list>]"
---

# Component Brief

Generate a structured component brief with HTML spec page and Figma output. Pipeline: research → data model → present options → push.

> **Always pass `skillNames: "figma-use"` on every `mcp__claude_ai_Figma__use_figma` invocation.** This is mandatory per Figma's official contract — the `figma-use` skill carries the load-bearing Plugin API rules (atomic-on-error, color 0–1 range, HUG-after-append, font preload, await-all-promises, page-context-reset, return-all-IDs, explicit `variable.scopes`). Skipping it produces hard-to-debug failures.
> (Source: https://help.figma.com/hc/en-us/articles/39287396773399)

## Mode detection

| Signal | Mode |
|--------|------|
| "FM", "Fat Marker", "wireframe", "lo-fi" | Fat Marker |
| "DS Kit", "design system", "hi-fi", Figma URL from DS Kit, default with URL | Actian DS |
| Component in FM catalog, no DS Kit signals | Fat Marker |
| Ambiguous | Ask: "Fat Marker (lo-fi) or Actian DS (hi-fi)?" |

Keywords: `"preview"` → HTML; `"playground"` → explorer.

## Step 1 — Research (ONE parallel batch)

Parse URL (`fileKey` + `nodeId` per `../../references/figma/figma-output.md`). ONE message: (1) classify-node via `use_figma` (see figma-output.md — returns node type, name, children), (2) `vendor/components/dist/guidelines/<slug>.json` — the merged per-component guideline doc; knowledge ships registry-key alias copies (e.g. `dropdown-select-default.json` → `dropdown-select`), so look up by the registry slug directly; absent for components with no guideline doc, (3) `references/component-brief/data-schema.md`. Then: route based on node type — if PAGE, pick the COMPONENT_SET child from the classification response; if COMPONENT_SET, use directly. Call `get_design_context` on the resolved target. Fallback: `get_screenshot`.

## Step 1.5 — Present card selection

Before generating the data model, present the available cards and let the user choose. Present the card list for the detected mode:

**DS Kit mode (5 cards):**
```
Component brief for [Name] — 5 cards available:

| # | Section                    | Card                   | Content                                          |
|---|----------------------------|------------------------|--------------------------------------------------|
| 1 | Header                     | Header                 | Component name, description, metadata           |
| 2 | 1. Anatomy/var/tokens/specs | Section 1 (supercard) | Variation matrix, anatomy parts, token tables, dimension specs |
| 3 | 2. Usages                  | Usage                  | When to use, when not to use, do/don't pairs    |
| 4 | 3. Content                 | Content                | Copy guidelines, label patterns, terminology    |
| — | 4. Motion (auto)           | Motion                 | Added automatically when a motion pattern exists |
| 5 | 5. Accessibility           | Accessibility          | Keyboard, ARIA, contrast                        |

Section 4 (Motion) is auto-added (not user-selectable in this gate) when the component has a curated motion pattern.
Section 6 (Real platform examples) is deferred — not generated yet.

Cards: generate **all 5** or pick specific (e.g., "2,4").
       Card numbering matches the gate; the data model still uses card_header,
       variants, anatomy, tokens, usage, card_content,
       motion, accessibility keys (no schema migration in v1.67.0).
Research: cross-DS patterns can be researched before generating cards 3, 4, 5
          to surface insights, recommendations, and divergences from existing
          context. Skip by default (faster, lower token cost).
          Reply: "research all" / "research usage,content" / nothing to skip.
```

**FM mode (5 cards):**
```
Component brief for [Name] (Fat Marker) — 5 cards available:

| # | Card | Content |
|---|------|---------|
| 1 | Header | Component name, description, metadata |
| 2 | Component | FM library instances — all variants |
| 3 | Design guidelines | Spacing, sizing, layout rules |
| 4 | Content guidelines | Copy patterns, label rules |
| 5 | Anatomy | Structural breakdown |

Generate **all 5** or pick specific cards (e.g., "1,2,5").
```

If the user pre-specifies cards in the prompt (e.g., "brief Button cards 2,4,5"), skip this gate and generate only those cards. The research scope can also ride the prompt: "brief Button cards 2,4,5 research content" → 3 cards + research only on card_content.

Parser rules for the response:
- Empty (just enter) → all 5 cards, no research
- `"all"` → all 5 cards, no research
- `"2,4"` → cards 2/4 only, no research
- `"all research all"` → all 5 cards + research on cards 3/4/5
- `"all research usage,content"` → all 5 + research on cards 3+4 only
- `"2,4 research content"` → cards 2/4 + research only on card 4
- `"research all"` (no card list) → treats as `"all research all"`
- Invalid card number (e.g., 99) → re-prompt with "Card 99 doesn't exist. Valid: 1-5."
- Invalid research scope (e.g., `research foo`) → re-prompt with "Unknown research scope `foo`. Valid: all, usage, content, accessibility."
- Gate is re-enterable on parse failure (3 retry attempts then abort).

## Step 1.6 — Cross-DS research (opt-in)

If the Step 1.5 response opted in to research (e.g., `research all`, `research usage,content`):

1. Parse the research scope from the response (default `["usage", "card_content", "accessibility"]` for `research all`).
2. Dispatch the `brief-researcher` agent with:
   - Component name + slug
   - Scoped cards (intersect requested research with research-applicable cards: usage, card_content, accessibility)
   - Existing context inlined:
     - `vendor/components/dist/guidelines/<slug>.json` (the merged per-component guideline doc — `domains.content` is the authoritative component-specific copy guidance; omit when the component has no guideline doc)
     - `vendor/content/dist/global.md` (global / cross-cutting copy guidance — voice, tone, words to avoid, UX-pattern topics)
     - `vendor/content/dist/words-to-avoid.json` (structured avoid-list; each rule's `avoid[]` tokens — use this — do not inline a subset)
     - `vendor/components/dist/categories.json` (DS Kit category lookup — informational metadata for mis-categorization surfacing; see `agents/brief-researcher.md`)
     - `vendor/foundations/src/<slug>.md` (per-section; the brief recipe's `grounding` lists the relevant files)
     - `vendor/accessibility/src/<slug>.md` (per-section; the brief recipe's `grounding` lists the relevant files)
   - Output path: `{project_working_directory}/components/[name]/[name]-research-findings.json`
3. Wait for the agent's DONE / DONE_WITH_CONCERNS / ERROR signal.
4. On ERROR: ask the user "Research failed: <reason>. Continue without research? (yes/no)". On `yes`, proceed without `research-findings.json`. On `no`, abort.
5. On DONE / DONE_WITH_CONCERNS: load the findings JSON; pass to Phase B in Step 2.

If Step 1.5 did not opt in to research, skip Step 1.6 silently and proceed to Step 2.

## Step 2 — Resolve sources + two-pass generation

**Step 2.0 — Resolve sources.** For each selected card key, read its recipe (`recipes/brief/<file>` per `_index.json`). Use `scripts/transformers/brief-sourcing.js` `resolveSection(cardKey, ctx, recipe)` to route:
- `transcribe` recipes → bucket as Phase A
- `generate` recipes → bucket as Phase B

Build `ctx`:
```
ctx = {
  component, slug, fileKey, nodeId,
  nodeDescription,        // from dskit.json[slug].description (primary), MCP node.description (fallback)
  guidelinesJson,         // parsed vendor/components/dist/guidelines/<slug>.json (merged multi-domain guideline doc — domains.{content,usage,design,behavior,tokens}); null when no guideline doc exists for the component
  selectedCards,          // ["card_header", "tokens", ...]
  motionPatterns,         // parsed vendor/foundations/dist/tokens/motion.json#patterns (object keyed by short name)
  category,               // dskit.json[slug].categorySlug (substrate-canonical slug, = slugify(category); knowledge #189) — consumed verbatim
  categoryDefaults,       // category-defaults-loader.loadDefaultsForCategory(ctx.category) — null when unknown
  motionRefResolver       // category-defaults-loader.resolveMotionRef — function passed for category motion fallback
}
```

**Stub guideline branch (v1.64.0+, semantics updated v1.84.0).** `resolveSection` treats a guideline as a *stub* — via `brief-sourcing.isStubGuideline(ctx.guidelinesJson)` — when there is no guideline doc for the component (`ctx.guidelinesJson` is null) OR the doc's `domains.content.status` is not `approved`/`draft` (i.e. `inherited` / `not-started`). For a stub it short-circuits ALL cards to Phase B with a `fallback: true` + `fallbackReason: /stub/` marker — there is no curated content to transcribe. When this branch fires, set `meta._stubGuideline = true` in the data model so the HTML preview renders a "Guidance pending curation" footer cue, signaling to designers that the brief is structural-only (registry + category-defaults derived) and the design-system team owes a curated guideline for this component. Components with an authored `content` domain never trigger this branch. (Replaces the `_stub` boolean from the retired Figma-scraped guideline layer.)

**Category defaults (Phase 2c, v1.82.0+).** When `ctx.guidelinesJson` is
a stub OR generally for Phase B cards, `resolveSection` attaches
`ctx.categoryDefaults` to the result for `anatomy`,
`variants`, and `accessibility`. Pass it through to the
card-generator agent prompt as `categoryDefaults: <object>` so the
generator can adapt from the category baseline rather than improvise.
`motion` always resolves via the category fallback: the multi-domain
guideline doc carries no per-component motion pattern (`domains.behavior`
is status-only, typically `inherited`), so when
`categoryDefaults.motion` has a `patternRefs[0]`, `resolveSection`
returns a Phase A result with `fallback: true`, `fallbackReason:
"category-motion-default"` and the resolved pattern's content. The card is
emitted with `_source: "figma"`, `_fallback: true`, `_fallbackReason:
"category-motion-default"`.

Set `ctx.category` by reading the dskit registry's `categorySlug` field
directly (the substrate's canonical slug, = slugify(category); knowledge
#189 — no plugin-side re-derivation). Set `ctx.categoryDefaults` by calling
`category-defaults-loader.loadDefaultsForCategory(ctx.category)`. Set
`ctx.motionRefResolver` to `category-defaults-loader.resolveMotionRef`
so the Phase A motion fallback can resolve the slug.

**Linked WCAG criteria (v1.94.0+).** When the Accessibility card (`accessibility`)
is selected, attach the authoritative, substrate-sourced criteria to it. Run the
knowledge helper with the component slug:

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh" \
  && "$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/lib/knowledge/a11y.js" <slug>
```

Take the `component` and `inherited` arrays from the JSON output and set
`accessibility.linkedCriteria = { component, inherited }` on the card object. This
is deterministic and authoritative — do NOT let the Phase B generator invent it.
If the helper returns `resolved: false` (undocumented component, no category refs),
omit `linkedCriteria` entirely (the renderer then renders the card as before).
The generated `requirements` / Contrast / ARIA tables still render as practical
guidance below the linked criteria.

`accessibility.linkedCriteria` (optional) — `{ component: [{slug,title,wcag[],tier,note?,excerpt?}], inherited: [...] }`, sourced from `scripts/lib/knowledge/a11y.js`; omitted when unresolved. (No schema change — `validateBriefData` ignores unknown card fields.)

**Phase A — Transcription (sequential, inline).** For each Phase A card:
- If `resolveSection` returned `{ source: "figma", content }`: call `formatForBrief(cardKey, result, ctx)` and write directly into `brief-data.json`. Card object includes `_source: "figma"`.
- If `resolveSection` returned `{ source: null, fallback: true, fallbackReason }`: invoke yourself (the main agent) inline to generate the missing content using the recipe's `sections` + `qualityRules` as guidance. Stamp `_source: "generated"`, `_fallback: true`, `_fallbackReason`. Do NOT dispatch the card-generator agent for this — Phase A fallbacks are inline.

**Phase B — Generation (parallel).** Dispatch the `card-generator` agent on Phase B cards only. Agent prompt MUST include:
- Recipe data per card (with `grounding` array)
- **Inlined contents** of each grounding file as REQUIRED reference
- If research was opted in for any of these cards: inlined `research-findings.json` content scoped to those cards
- The reconciliation directive (already in the agent prompt) — existing context wins on conflicts

Output of Phase B is merged via `scripts/transformers/merge-partials.js` (existing). Every Phase B card has `_source: "generated"`. Cards with research applied also have `_research_applied: true` and a `research_insights` sub-section.

**Card title + subtitle (required) — preserved from prior Step 2:** Every card object MUST include `cardTitle` and `cardSubtitle`. Source from the recipe: `cardTitle` = recipe `title`, `cardSubtitle` = recipe `description` (abridge to one line if long). Both renderers (HTML + Figma push) consume these fields directly — never hardcode card titles.

**`meta` block — preserved from prior Step 2.** Same rules apply: source every field, never copy from examples. `meta.pluginVersion` from `plugin.json`, `meta.model` runtime, `meta.generatedAt` ISO 8601, `meta.duration` measured, `meta.component`/`meta.fileKey`/`meta.nodeId`/`meta.componentKey` from request + `figma-keys.json`.

**`meta._stubGuideline` (v1.64.0+, semantics updated v1.84.0).** Set to `true` when `brief-sourcing.isStubGuideline(ctx.guidelinesJson)` returns true — no guideline doc for the component, or its `content` domain is not `approved`/`draft`; absent otherwise. The HTML preview renderer uses this to display a "Guidance pending curation" footer cue, signaling that the brief is structural-only. Note: this footer-cue flag is broader than the `resolveSection` short-circuit above — the short-circuit fires only for a *present-but-stub* doc, whereas `_stubGuideline` is also `true` when there is no doc at all (in which case `card_header` still transcribes the Figma description normally; only the cue shows).

Write: `{project_working_directory}/components/[name]/[name]-brief-data.json`

**Critical — avoid truncation:** Each card's data must be complete. Common truncation traps (Phase B cards):
- `variants.variantMatrix` — include ALL variant rows
- `tokens.colorTokens` — include ALL token bindings for the component
- `accessibility.requirements` — must have exactly 6 items (2 per column × 3 rows)

**Inline validation after writing:** Check the file you just wrote:
- Every selected card key exists and is non-empty
- Every selected card object has `cardTitle` AND `cardSubtitle` populated
- Every selected card has `_source: "figma" | "generated"` (NEW — sub-project B)
- Cards with `_source: "figma"` must have non-empty content unless `_fallback: true` (NEW)
- No `card_api`, `card_code`, `card_states` keys (regression guards for retired cards)
- No `"..."`, `"etc"`, or `"and more"` in any value (truncation signals)
- All token names use `--zen-` prefix (DS Kit) or `--fm-` prefix (FM)
- No hardcoded hex values in token fields
- `accessibility.requirements` has exactly 6 items (if card 7 selected)
- `accessibility.linkedCriteria` (if present): each item has a non-empty title; no raw slug strings leak into rendered text.
- **Code values use ASCII operators only** — `=>` not `⇒` (U+21D2), `->` not `→`, `<=` not `≤`, `>=` not `≥`, `!==` not `≠`. Especially watch generated content.
- **`meta.pluginVersion` matches the project's `plugin.json` `version`** — read the file, do not transcribe from any example. If the value differs from the actual `plugin.json`, fix it before push.

If P0 issues found, fix them immediately before proceeding. The new `_source` and forbidden-key checks should be run via `validateBriefData()` from `scripts/validation/validate-schema.js`.

## Step 2.5 — Present push options (copy verbatim)

```
Brief ready (N cards). Reply:
- **"push [Figma URL]"** — send to Figma
- **"push N,N"** — send specific cards only
- **"preview"** — HTML preview with annotations
- **"playground"** — interactive state explorer
- **feedback** — edit the data model
```

"push" → Step 3. "preview"/"playground" → Step 2.75 then return. Feedback → edit data, re-present.

## Step 2.75 — Render HTML

```bash
source "${CLAUDE_PLUGIN_ROOT}/scripts/lib/resolve-node.sh"
"$NODE_BIN" "${CLAUDE_PLUGIN_ROOT}/scripts/renderers/assemble-preview.js" \
  {project_working_directory}/components/[name]/[name]-brief-data.json \
  --type brief -o {project_working_directory}/components/[name]/[name]-spec.html
```

## Step 3 — Push to Figma (direct calls)

Read your `brief-data.json` and push directly to Figma using small `use_figma` calls. Read `../../references/component-brief/push-patterns.md` for all patterns. Read `../../references/figma/figma-push-patterns.md` for core patterns (wrapper frame, hexToRgb, etc.). Always pass `skillNames: "figma-use"` to every call.

**Push sequence** (each step is one small `use_figma` call, ~200-2000 bytes; anatomy diagram ~4-6KB):

1. Create wrapper frame (Pattern 0 from component-brief/push-patterns.md — MUST be HORIZONTAL)
2. Create GenLog instance (Pattern 0b — import by key, set 6 meta props, append to wrapper)
3. **Card 1 — Page Header — create EXACTLY ONCE.** Use Pattern 1 with variant `"Mode=DS, Type=Page Header"`. **Set ALL three text properties** in a single `setProperties` call: `"Component Name#7:2"` = `card_header.name`, `"Description#7:3"` = `card_header.description`, `"Source#7:4"` = `"DS Kit"` (or appropriate library label). If you don't override these, Meta Kit's Page Header variant defaults leak through — you'll see "Button" / "The Button component is a surface-level element..." regardless of which component you're documenting (regression: see PR #23 follow-up). After creating + appending the Page Header, do NOT recreate it under any condition — proceed directly to Section 1.
4. **Section 1 supercard — create EXACTLY ONCE (replaces former Cards 2/3/4).** Use Pattern 1 with variant `"Mode=DS, Type=Standard"`. Card title: `"Anatomy, variation, tokens & specs"`. Card subtitle: `"Structural breakdown, variants, token bindings, and dimension specs"` (both overridable from data model `card.cardTitle` / `card.cardSubtitle` if set). Inside the contentSlot, build four nested sub-frames per Pattern 1d: Anatomy / Variation / Tokens / Specs. Each sub-frame gets a 16px Semibold heading; if the corresponding source card (`anatomy` / `variants` / `tokens` / `anatomy` for Specs) has `_source: "generated"` AND `_authored !== true`, append a small DRAFT tag next to the heading. Specs sub-frame is included whenever the target component has autolayout (Pattern 14 auto-extracts spacings); skip the sub-frame only when the component has no autolayout AND `anatomy.specs` is empty. **Anatomy sub-frame uses Pattern 9** from `push-patterns.md` (the badge+leader-line algorithm). **The Anatomy parts table and the three Tokens tables (Sizing / Color grid / Typography) MUST be rendered through the `renderTable` strict tool** — see `references/component-brief/render-table-tool.md`. **ALWAYS** invoke `render-figma.js` via the Bash CLI pattern; capture stdout; pass the captured JS **verbatim** into `mcp__claude_ai_Figma__use_figma`. **NEVER rename the `Table (renderTable)` frame** that the interpreter emits — do NOT add descriptive suffixes (`"— Sizing"`, `"Anatomy parts table (renderTable)"`, etc.) and do NOT replace the name. v1.73.0 measured 70% renaming rate which broke the A8 strict-equality gate; v1.73.1 makes this rule explicit. **NEVER** inline token-table or color-grid construction in `use_figma` — inlining reproduces the v1.70.x cell-squash regression that doc-layer patches cannot fix. Pattern 3 + Pattern 4 in `push-patterns.md` (with the `appendTokenTagCell` helper) remain alive per `MIGRATIONS.md` Rule 1 (parallel change) but are explicitly fallback documentation, not the canonical path. The v1.73.x eval lane A8 assertion measures invocation rate per fixture; ship gate is ≥80% on every per-measurement file (`--runs 5` × 2 fixtures = 10 grading.json files). **Specs sub-frame uses Pattern 14** (Specs Redline — gutter ordinate lane in v1.70.0+, inline fallback for N=1). Do NOT render either Anatomy or Specs as a plain text table — that is the v1.67.0 → v1.67.x regression Phase 1 fixes. Pattern 9 (v1.70.0+) renders the Enabled/Default state and drops state-only parts (focus ring, hover surface) with footnoted rows in the parts table — cross-DS convention from Carbon, Material 3, Polaris.
5. For each remaining card in the data model (Section 2 Usage, Section 3 Content, Section 4 Motion if present, Section 5 Accessibility — skip `card_header`, `variants`, `anatomy`, `tokens`):
   a. Create card shell (Pattern 1). Read `card.cardTitle` and `card.cardSubtitle` from the data model — pass them straight to `setProperties` as `Title#140:0` and `Subtitle#140:1`. Do NOT hardcode card titles. **Default-leak detection (post-v1.66.0):** the Meta Kit Card Header now defaults to the generic placeholders `"Card title"` / `"Subtitle text"`. If a pushed card displays either string verbatim, `setProperties` silently failed (wrong property ID, wrong nested instance, or unresolved Card Header lookup) — fix the push call rather than ignoring the leak.
   b. Populate content: translate data model fields to Plugin API calls using component-brief/push-patterns.md
   c. Accessibility card (`accessibility`): use the simplified Pattern 6 — render `requirements` as a vertical bulleted list with bold-title + plain-body rows (one row per requirement, no per-card frames, no embedded code blocks). This replaces the 2×3 a11y-card grid retired in v1.66.3. Then render the Contrast table and ARIA table after the requirements list. Use Contrast Badge `setProperties` and A11y Spec Row `setProperties` for the table rows.
   Additionally, before the requirements list, render the **Linked WCAG criteria** block when
   `accessibility.linkedCriteria` is present: a "Linked WCAG criteria" sub-heading,
   then two labeled groups — "This component" (`linkedCriteria.component`) and
   "Inherited from category" (`linkedCriteria.inherited`) — each a bulleted list of
   `{title} — WCAG {wcag joined}` (+ `note` if present; title alone when `wcag` is
   empty). Never render the raw `slug`. Omit the block (and either group) when empty.
6. After all cards pushed, report to user with count

**Rules:**
- Each `use_figma` call creates 1-3 nodes max — keep calls small
- Return IDs from every call — use them in subsequent calls to append children
- If a call fails, skip that element and continue
- Do NOT run `brief-to-figma.js` — push directly from your data model
- Do NOT read any `.js` files, manifests, or scaffolds
- Code blocks render as monochrome — single color `#BABED8`, no per-token coloring

### Pushing specific cards only

Read only the relevant card keys from `brief-data.json` and push those cards. Skip the rest.

### Incremental update

To fix a specific card: edit the data model, then re-push just that card using the same patterns. Use `figma.getNodeByIdAsync` to find and remove the old card frame before pushing the replacement.

## Step 4 — Parity check (opt-in)
Manifest includes `sourceHash` (of brief-data.json), `componentKeys` (from push), and `tokenHash` (of tokens file). See `references/figma/parity-check.md` for hash computation.

Only run if the user says "check parity", "screenshot check", or "verify output". Do NOT run automatically after push.

When triggered: per `../../references/figma/parity-check.md` — screenshot each card, dispatch `parity-analyzer`, fix P0s.

## Key rules

Write files silently (never dump in chat). Research → data model → gate runs uninterrupted. If a Figma call fails, skip and proceed.

## References

`references/component-brief/`: `data-schema.md` (JSON schema, 9 DS + 5 FM cards), `figma-rules.md` (pitfalls), `playground.md` (explorer), `render-table-tool.md` (REQUIRED — canonical path for every table-shaped surface; Pattern 3 + 4 in push-patterns.md are fallback documentation only per MIGRATIONS Rule 1). `references/component-brief/push-patterns.md` (Figma push). `references/ds-rules/quality-tiers.md` (tiers).
