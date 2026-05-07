---
name: component-brief
description: Generate a structured brief for a DS component with cards (variants, tokens, API, usage, a11y). Accepts Figma URL or component name.
argument-hint: "[Figma URL or component name] [generate N,N,N] [research all|<list>]"
---

# Component Brief

Generate a structured component brief with HTML spec page and Figma output. Pipeline: research → data model → present options → push.

## Mode detection

| Signal | Mode |
|--------|------|
| "FM", "Fat Marker", "wireframe", "lo-fi" | Fat Marker |
| "DS Kit", "design system", "hi-fi", Figma URL from DS Kit, default with URL | Actian DS |
| Component in FM catalog, no DS Kit signals | Fat Marker |
| Ambiguous | Ask: "Fat Marker (lo-fi) or Actian DS (hi-fi)?" |

Keywords: `"preview"` → HTML; `"playground"` → explorer.

## Step 1 — Research (ONE parallel batch)

Parse URL (`fileKey` + `nodeId` per `../../references/figma/figma-output.md`). ONE message: (1) classify-node via `use_figma` (see figma-output.md — returns node type, name, children), (2) `docs/component-guidelines/<slug>.json`, (3) `references/component-brief/data-schema.md`. Then: route based on node type — if PAGE, pick the COMPONENT_SET child from the classification response; if COMPONENT_SET, use directly. Call `get_design_context` on the resolved target. Fallback: `get_screenshot`.

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
       card_component, card_anatomy, card_tokens, card_usage, card_content,
       card_motion, card_accessibility keys (no schema migration in v1.67.0).
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

1. Parse the research scope from the response (default `["card_usage", "card_content", "card_accessibility"]` for `research all`).
2. Dispatch the `brief-researcher` agent with:
   - Component name + slug
   - Scoped cards (intersect requested research with research-applicable cards: card_usage, card_content, card_accessibility)
   - Existing context inlined: `component-guidelines/<slug>.json`, `docs/foundations.md` (relevant excerpts), `docs/content-guidelines.md`, `docs/accessibility-guidelines.md`
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
  guidelinesJson,         // parsed docs/component-guidelines/<slug>.json
  selectedCards           // ["card_header", "card_tokens", ...]
}
```

**Stub guideline branch (v1.64.0+).** If `guidelinesJson._stub === true` (file generated by `scripts/foundations/generate-guideline-stubs.js`), `resolveSection` short-circuits ALL cards to Phase B with a `fallback: true` + `fallbackReason: /stub/` marker — stubs have no Figma-extracted curated content to transcribe. When this branch fires, set `meta._stubGuideline = true` in the data model so the HTML preview renders a "Guidance pending curation" footer cue, signaling to designers that the brief is structural-only (registry-derived) and the design-system team owes a curated guideline for this component. Covered components have hand-curated guidelines and never trigger this branch.

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

**`meta._stubGuideline` (v1.64.0+).** Set to `true` if `ctx.guidelinesJson._stub === true`; absent otherwise. The HTML preview renderer uses this to display a "Guidance pending curation" footer cue, signaling that the brief is structural-only.

Write: `{project_working_directory}/components/[name]/[name]-brief-data.json`

**Critical — avoid truncation:** Each card's data must be complete. Common truncation traps (Phase B cards):
- `card_component.variantMatrix` — include ALL variant rows
- `card_tokens.colorTokens` — include ALL token bindings for the component
- `card_accessibility.requirements` — must have exactly 6 items (2 per column × 3 rows)

**Inline validation after writing:** Check the file you just wrote:
- Every selected card key exists and is non-empty
- Every selected card object has `cardTitle` AND `cardSubtitle` populated
- Every selected card has `_source: "figma" | "generated"` (NEW — sub-project B)
- Cards with `_source: "figma"` must have non-empty content unless `_fallback: true` (NEW)
- No `card_api`, `card_code`, `card_states` keys (regression guards for retired cards)
- No `"..."`, `"etc"`, or `"and more"` in any value (truncation signals)
- All token names use `--zen-` prefix (DS Kit) or `--fm-` prefix (FM)
- No hardcoded hex values in token fields
- `card_accessibility.requirements` has exactly 6 items (if card 7 selected)
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
4. **Section 1 supercard — create EXACTLY ONCE (replaces former Cards 2/3/4).** Use Pattern 1 with variant `"Mode=DS, Type=Standard"`. Card title: `"Anatomy, variation, tokens & specs"`. Card subtitle: `"Structural breakdown, variants, token bindings, and dimension specs"` (both overridable from data model `card.cardTitle` / `card.cardSubtitle` if set). Inside the contentSlot, build four nested sub-frames per Pattern 1d: Anatomy / Variation / Tokens / Specs. Each sub-frame gets a 16px Semibold heading; if the corresponding source card (`card_anatomy` / `card_component` / `card_tokens` / `card_anatomy` for Specs) has `_source: "generated"` AND `_authored !== true`, append a small DRAFT tag next to the heading. Specs sub-frame is included whenever the target component has autolayout (Pattern 14 auto-extracts spacings); skip the sub-frame only when the component has no autolayout AND `card_anatomy.specs` is empty. **Anatomy sub-frame uses Pattern 9** from `push-patterns.md` (the badge+leader-line algorithm). **The Anatomy parts table and the three Tokens tables (Sizing / Color grid / Typography) use Pattern 3 + Pattern 4 from `push-patterns.md`**, including the `appendTokenTagCell` helper for token-name cells (canonical path; v1.70.4+ HUG guards apply). The `renderTable` strict tool (`references/component-brief/render-table-tool.md`) is available but experimental until smoke-verified — do NOT use it as the sole renderer for these tables yet. **Specs sub-frame uses Pattern 14** (Specs Redline — gutter ordinate lane in v1.70.0+, inline fallback for N=1). Do NOT render either Anatomy or Specs as a plain text table — that is the v1.67.0 → v1.67.x regression Phase 1 fixes. Pattern 9 (v1.70.0+) renders the Enabled/Default state and drops state-only parts (focus ring, hover surface) with footnoted rows in the parts table — cross-DS convention from Carbon, Material 3, Polaris.
5. For each remaining card in the data model (Section 2 Usage, Section 3 Content, Section 4 Motion if present, Section 5 Accessibility — skip `card_header`, `card_component`, `card_anatomy`, `card_tokens`):
   a. Create card shell (Pattern 1). Read `card.cardTitle` and `card.cardSubtitle` from the data model — pass them straight to `setProperties` as `Title#140:0` and `Subtitle#140:1`. Do NOT hardcode card titles. **Default-leak detection (post-v1.66.0):** the Meta Kit Card Header now defaults to the generic placeholders `"Card title"` / `"Subtitle text"`. If a pushed card displays either string verbatim, `setProperties` silently failed (wrong property ID, wrong nested instance, or unresolved Card Header lookup) — fix the push call rather than ignoring the leak.
   b. Populate content: translate data model fields to Plugin API calls using component-brief/push-patterns.md
   c. Accessibility card (`card_accessibility`): use the simplified Pattern 6 — render `requirements` as a vertical bulleted list with bold-title + plain-body rows (one row per requirement, no per-card frames, no embedded code blocks). This replaces the 2×3 a11y-card grid retired in v1.66.3. Then render the Contrast table and ARIA table after the requirements list. Use Contrast Badge `setProperties` and A11y Spec Row `setProperties` for the table rows.
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

`references/component-brief/`: `data-schema.md` (JSON schema, 9 DS + 5 FM cards), `figma-rules.md` (pitfalls), `playground.md` (explorer), `render-table-tool.md` (experimental renderTable strict tool — see status banner; canonical table rendering remains Pattern 3 + 4 in push-patterns.md until smoke-verified). `references/component-brief/push-patterns.md` (Figma push). `references/ds-rules/quality-tiers.md` (tiers).
