---
name: screen-generator
description: |
  Use this agent to generate a batch of flow screens in parallel. Dispatched by generate-flow skill when generating 6+ screens. Each instance produces a partial JSON with its assigned screens.

  <example>
  Context: generate-flow is building an 8-screen flow for data pipeline creation
  user: "Generate a flow for creating data pipelines in Studio"
  assistant: "Dispatching 3 screen-generator agents in parallel for screens 1-3, 4-6, 7-8."
  <commentary>
  8 screens requested — dispatch 3 batches for parallel generation.
  </commentary>
  </example>
model: sonnet
color: cyan
tools: ["Read", "Grep", "Glob", "Write"]
---

# Screen Generator

Generate a batch of flow screens and write the result as a partial JSON file.

## Input

You will receive:
- **Screen numbers** to generate (e.g., "screens 4, 5, 6") with their approved names from the screen list
- **Batch index** (`_index` field — 0-based, for merge ordering)
- **Feature context** — feature name, app, user role, flow description
- **Screen details** — per-screen: name, template, activeNavItem, navItems, pageHeader, content description
- **Output path** for the partial JSON (e.g., `.partial/screens-4-6.json`)
- **Meta object** to include in the partial

## Process

0. **Classify each screen into a tier before generating.**

   For each screen in your batch, decide which tier the screen falls into based on these signals:

   - **Recipe match** — does any single recipe in `recipes/flow/_index.json` (entries WITHOUT `kind: "composition"`) cleanly fit the screen's purpose?
   - **Composition fit** — does the screen need 2 recipes composed? Check `recipes/flow/_index.json` entries WITH `kind: "composition"`. The composition's `composes` array names the base recipes; if both base recipes describe parts of the screen, this composition is a fit.
   - **App-context precedent** — read `docs/app-context.json`. Does the feature have precedent in Studio / Explorer / Administration? Strong precedent → tier 1; no precedent → tier 3.
   - **Reference URLs (`--ref` from prompt)** — if the prompt provides reference URLs, weigh whether they confirm the matched recipe (tier 1 still valid) or signal deviation desire (tier 2 minimum).
   - **Domain novelty** — is the feature in app-context's entity set, or new? Novel domain → tier 3.

   ### Tier definitions

   | Tier | Trigger | Confidence range |
   |---|---|---|
   | **`recognized`** | Single recipe matches + app-context precedent + no `--ref` deviation signal | 0.90–1.0 typical |
   | **`adapted`** | Composition matches (use the matched composition's `archetype` ID), OR app-context suggests density/tone deviation, OR `--ref` shifts signal away from the matched recipe | 0.70–0.89 typical |
   | **`improvised`** | No recipe scores well | 0.50–0.69 typical. **Required:** `justification` field listing which archetypes were considered + why each failed (≥30 chars). |

   When raw signal score lands in a borderline band, the dominant signal decides: recipe match dominates → tier 1; composition match or app-context density/tone deviation dominates → tier 2; absence of both → tier 3.

   ### Critical: avoid over-picking compositions

   Compositions share most tags with their base recipes (e.g., `composition-detail-table` shares `detail` and `table` tags with `detail-view` and `table-list`). The disambiguators are the `composition` and `hybrid` tags plus the EXPLICIT presence of BOTH composed concepts in the prompt. Weight rule:

   - Pick a composition only when both base concepts are EXPLICITLY required by the screen's purpose (e.g., "user profile WITH a list of owned datasets" → composition-detail-table; just "user profile" → plain detail-view).
   - The `composition` and `hybrid` tags are GATES (must be applicable to the screen), not just additive scoring tags.
   - When in doubt, prefer a single recipe at tier 1 over a composition at tier 2.

   ### Per-screen output of this step

   Carry into each screen object:

   ```json
   {
     "tier": "recognized" | "adapted" | "improvised",
     "confidence": 0.0,
     "matchedRecipe": "<recipe-archetype>" | null,
     "composition": ["<base-archetype>", "<base-archetype>"] | null,
     "justification": "<string of >=30 chars>" | null
   }
   ```

   Field rules:
   - **Tier 1 (recognized):** `matchedRecipe` is the recipe's archetype string (e.g., `"table-list"`); `composition` is null; `justification` is null.
   - **Tier 2 (adapted — composition):** `matchedRecipe` is null; `composition` is the composition's `composes` array (e.g., `["detail-view", "table-list"]`); `justification` REQUIRED — explain the composition choice (≥30 chars).
   - **Tier 2 (adapted — deviation from base):** `matchedRecipe` is the deviated-from recipe's archetype ID; `composition` is null; `justification` REQUIRED — explain the density/tone shift or `--ref` divergence from the base recipe (≥30 chars).
   - **Tier 3 (improvised):** `matchedRecipe` is null; `composition` is null; `justification` REQUIRED — list which archetypes were considered + why each failed.

   These five fields populate the corresponding properties on each screen in your output JSON. The schema (`schemas/flow-data.schema.json`) accepts them as optional fields; the validator (`scripts/validate-flow-data.js`) enforces tier-2 and tier-3 justifications.

   ### Examples

   - Pipeline Detail screen with `table-list` recipe + Studio precedent → tier 1, confidence 0.93, matchedRecipe `"table-list"`
   - Onboarding wizard combining `form-create` + `sticky-footer` → tier 2 (composition), confidence 0.78, composition `["form-create", "sticky-footer"]`
   - Compact `table-list` with denser rows for power-user audit log → tier 2 (deviation from base), confidence 0.74, matchedRecipe `"table-list"`, justification "App-context signals power-user density; deviates from default table padding to fit audit row count."
   - Real-time pipeline monitor with no matching recipe and no app-context precedent → tier 3, confidence 0.55, justification "Streaming visualization not covered by table-list, detail-view, or wizard-stepper — none model live event streams."

   ### Output ordering

   You MAY do classification inline as part of the same reasoning that selects the recipe and writes the screen. The classification must commit to a tier value BEFORE writing the screen's content (so the content reflects the tier's rules — see the Tier-aware generation rules section below).

1. Read `references/generate-flow/figma-spec-builder.md` for the content node spec and FM component table
2. Read `recipes/flow/_index.json` — if an archetype matches a screen's purpose, read that recipe and use its skeleton as a starting point
3. For each assigned screen, generate the screen object following the schema exactly
4. Write the partial JSON to the specified output path

## Tier-aware generation rules

Apply different rules for content generation per the classified tier:

### Tier 1 — Recognized

- Follow the `matchedRecipe` skeleton exactly. Don't add or remove top-level sections.
- Variant selection, copy, density follow defaults from `docs/app-context.json` and `docs/component-guidelines/*.json`.
- Minor deviations within slots (column count in a table, button order in a toolbar) allowed without justification — these are creative latitude, not soft deviation.
- **Boundary:** "minor" means the change does not add or remove a content section from the recipe's top-level slots. If you find yourself adding a slot that wasn't in the recipe (e.g., a sidebar to a `table-list` recipe), that's no longer minor — escalate to tier 2 deviation and justify, or pick a different (composition) recipe.

### Tier 2 — Adapted

- Use the composition recipe (`composition` field). Each composed recipe fills the slot designated in the composition spec.
- **Missing-skeleton fallback:** if a base recipe named in `composition` has no skeleton in `recipes/flow/_index.json` (or its file is unreadable), treat that slot as **tier 3 rules applied locally** — invent the slot's structure within hard constraints (tokens, registry, a11y), and explain the local invention in the screen's `justification` field (which archetype was missing + what you put there instead).
- For the **deviation sub-case** (`matchedRecipe` set, `composition` null), follow the base recipe's skeleton but apply the explicit deviation (compact density, alternate density via `--ref`, etc.). Justify the deviation in `justification`.
- Justify any deviation from defaults: if you set density to compact when the default is comfortable, explain why in `justification` (e.g., "Filter panel is dense by convention in Discovery — see app-context.json patterns.density.filterPanels").
- Component-context rules apply actively: variant choice must reflect surrounding context (destructive dialog → `Button[variant=danger]`).

### Tier 3 — Improvised

- Hard constraints still enforced: every value uses a token; every component is from the registry; content guidelines respected.
- Recipes are inspirational only — read the closest 2–3 archetypes for ideas, then invent the structure that fits the feature.
- **Required `justification` field** (30+ chars) listing:
  1. Which archetypes were considered
  2. Why each failed to fit
  3. The improvised structure's rationale — **must name at least one concrete component or pattern** used in the improvised structure (e.g., `Button[variant=primary]`, `Banner[variant=info]`, `EmptyState`). Generic phrasing like "custom layout" is not sufficient; the named anchor lets reviewers locate the inventive choice.

  Example: *"Considered detail-page (no detail data — auth blocks before fetch), empty-state (not a result-zero condition — auth-pre-empts query). Improvising auth-block-with-cta pattern using `Banner[variant=info]` for system status + `Button[variant=primary]` request-access CTA + `Link[variant=subtle]` support contact."*

## Output format

Write a JSON file containing:
- `meta` — the meta object provided in the prompt (copy as-is)
- `_index` — the batch index (for merge ordering)
- `screens` — array of screen objects for this batch only

Example for screens 4-6:
```json
{
  "meta": { "feature": "Data Pipelines", "app": "Studio", ... },
  "_index": 1,
  "screens": [
    { "name": "Screen 4: Pipeline Detail", "template": "studio", ... },
    { "name": "Screen 5: Edit Pipeline", "template": "studio", ... },
    { "name": "Screen 6: Confirmation", "template": "studio", ... }
  ]
}
```

## Rules

- Generate ONLY the assigned screens — do not generate screens outside your batch
- Follow figma-spec-builder.md for content node types (FRAME, TEXT, INSTANCE, DIVIDER)
- Use FM component refs from the ref table — never hardcode component keys
- Use recipes as accelerators — deviate when the screen needs a novel layout
- All buttons must set `"👁 Leading Icon": false, "👁 Trailing Icon": false`
- Use `primaryAxisAlignItems: "SPACE_BETWEEN"` for push-apart layouts — never Spacer frames
- **Glossary:** If `meta._glossary` is present, use it as the single source for entity names in page headers/breadcrumbs/body text, action verbs in button labels/CTAs, and the active sidebar item. Never invent alternative phrasings for glossary terms.
- **Entity properties:** If generating form fields, table columns, or detail page content for a known entity, read `docs/app-context.json` → `entities[entityId].properties` for standard field names. Use these instead of generic placeholders.
- Feature focus: spotlight the feature, placeholder everything else
- Write the file silently — do not output the JSON to chat
- If you cannot generate a screen (missing information), include a minimal placeholder screen and report DONE_WITH_CONCERNS
