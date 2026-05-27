# Content guidelines — authoring guide

> **This directory holds global / cross-cutting content guidelines only.** Component-scoped copy lives per-component at `components/src/<slug>/content.md` — see `components/src/AUTHORING.md` for that workflow. The section-structure guidance below applies to every content file regardless of bucket.

## Three sub-buckets

Files in `content/src/` are organized into three sub-buckets. Pick a bucket by asking:

1. **Is the file a strict grammar / voice / style rule?** (e.g., "use sentence case", "avoid 'please'", "abbreviate predictably in tight grids") → `writing/`
2. **Is the file a universal UX pattern with copy guidance?** (e.g., forms, empty states, notifications, onboarding, wizards) → `patterns/`
3. **Is the file copy guidance specific to an Actian product surface?** (e.g., lineage views, preview panels, related-content surfaces) → `product/`

When unsure: prefer `patterns/`. Re-classify later if a file accumulates Actian-specific content — `git mv` is cheap.

Meta files (overview, format spec, index, this guide) stay at `content/src/` root.

This directory holds the **source of truth** for Actian Data Intelligence global UI-copy guidance. Designers and writers edit files here directly; plugin skills and AI agents read them at runtime.

## How to edit

1. Open the relevant `.md` file in this directory (`content/src/`).
2. Edit content. Follow the section structure described below.
3. Submit a PR. CI validates the manifest + runs smoke tests.
4. Files under `content/src/*.md` are owned by `@<content-author-handle>` via `CODEOWNERS` — your approval is sufficient to merge PRs touching only this directory.

Changes propagate to the plugin on the next `vendor-snapshot.yml` run (nightly + on plugin release).

## File naming

- One file per UI component or topic area.
- Lowercase, hyphens for spaces: `data-tables.md`, `empty-and-system-states.md`.
- No leading numbers or prefixes — file names are the canonical slug used by the plugin's lookup.

## Section structure

Every component file follows this pattern:

```markdown
# {Component name}

{One-sentence description of the component and its purpose.}

---

## When to use

- Bullet points describing the appropriate contexts for the component.
- Cross-reference related components with `[link](filename-without-extension)`.

## Style

- Sentence case rules.
- Verb / object / label formulas.
- Punctuation, capitalization, length constraints.

## Behavior

- Focus management, loading states, async behavior.
- Keyboard interaction expectations.
- Modal/dialog return-focus rules.

## Do / Don't

| Do | Don't |
|---|---|
| Create report | Report |
| Delete dataset | Delete |
```

Optional sections (when applicable):

- **Terminology** — term pairs with rationale (used for Buttons, Modals, Validation messages).
- **Examples** — concrete copy examples in a table.

The `global-guidelines.md` and `content-index.md` files are exceptions — they follow their own structure (voice/tone master + AI query guide respectively).

## Adding a new file

1. Pick the right sub-bucket (`writing/`, `patterns/`, or `product/`) using the [decision tree at the top of this guide](#three-sub-buckets). Meta files (overview, format spec, index) stay at the `content/src/` root.
2. Drop a new `.md` file into `content/src/<bucket>/` following the naming + structure conventions above.
3. Add the slug to `content-index.md` so the deriver picks it up.
4. The `content.section` collection in `paths-manifest.json` covers it automatically — no manifest edit needed.
5. The `validate-manifest.yml` CI workflow confirms it on PR.
6. The plugin's nightly `vendor-snapshot` pulls it into the plugin's `vendor/` tree.

## Routing patterns into component pages (`relatedComponents` / `relatedCategories`)

Files in `patterns/` and `product/` can OPT IN to also appearing inside specific per-component pages. Add either field (or both) to the frontmatter:

```yaml
---
title: "Empty and system states"
nav_order: 21
relatedComponents: [empty-state, error-state, maintenance-state]
---
```

```yaml
---
title: "Forms"
nav_order: 14
relatedComponents: [text-input, checkbox, dropdown-select]
relatedCategories: [form-input-selection]   # shorthand for every component in the category
---
```

When you add either field, `scripts/components/derive-guidelines.js` automatically splices the pattern's sections into each related component's `domains.content.sections[]`, with a `source: "pattern:<this-slug>"` marker. The docs site + plugin `/component-brief` then surface the pattern content on every relevant component page — zero extra authoring per component.

What this means in practice:
- A pattern with NO `relatedComponents`/`relatedCategories` stays **global-only** (current default — unchanged behavior).
- A pattern with related slugs appears BOTH in `content/dist/global.md` (its current docs `/content` location) AND inside each related component page.
- Per-component authored content (in `components/src/<slug>/content.md`) is **preserved untouched** and appears **first**; pattern sections follow as broader context.
- Components that have only pattern-sourced content get a synthesized guideline doc (status `synthesized`). The coverage dashboard still flags them as authoring gaps — pattern fan-out does not hide which components lack per-component copy.
- Referenced slugs are CI-gated: an unknown component slug or category slug fails the build with a pointer to the offending pattern file.

When ordering multiple patterns into one component (e.g. `text-input` inherits from `forms` AND `validation-messages`), pattern order follows `content-index.md` order. Adjusting the sidebar order in `content-index.md` reorders the component-page sections too.

## What lives elsewhere

- **`content/dist/global.md`** — CI-generated by `scripts/content/derive-content.js`. Global topics only (the transitional full-concat `content.md` was retired in Phase 5, knowledge v0.11.0; component-scoped content lives per-component in `components/dist/guidelines/<slug>.json` `domains.content`). Never edit `dist/` — edit the source files and let CI regenerate.
- **`components/src/<slug>/content.md`** — per-component content guidelines (a different domain — see `components/src/AUTHORING.md`).
- **`foundations/src/foundations.md`** — primitives, tokens, scales (Design system lead's domain).
- **`tokens/`** — DTCG W3C-format design tokens.
- **`accessibility/src/NN-<slug>.md`** — WCAG 2.1 AA guidance, per-section files.
- **`app-context/app-context.json`** — per-app patterns, persona, terminology.

## Style basis

All guidelines follow IBM Style conventions and use sentence case throughout. The `global-guidelines.md` file is the master reference for voice, tone, and words to avoid.

## Related

- `format-spec.md` — defines the markdown source structure and Figma/Word output mapping (used by `/generate-presentation` skill).
- `content-index.md` — master AI query guide. Plugin skills query this to route content questions to the right section file.
