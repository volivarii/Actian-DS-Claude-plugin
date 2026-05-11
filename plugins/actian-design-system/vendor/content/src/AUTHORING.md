# Content guidelines — authoring guide

This directory holds the **source of truth** for Actian Data Intelligence UI copy. Designers and writers edit files here directly; plugin skills and AI agents read them at runtime.

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

1. Drop a new `.md` file into `content/src/` following the naming + structure conventions above.
2. The `content.section` collection in `paths-manifest.json` picks it up automatically — no manifest edit needed.
3. The `validate-manifest.yml` CI workflow confirms it on PR.
4. The plugin's nightly `vendor-snapshot` pulls it into the plugin's `vendor/` tree.

## What lives elsewhere

- **`content/content.md`** — consolidated summary index. Currently hand-maintained; will be auto-generated from `content/src/*.md` in a later phase. Don't edit it; edit the per-component files instead.
- **`foundations/src/foundations.md`** — primitives, tokens, scales (Kristina's domain).
- **`tokens/`** — DTCG W3C-format design tokens.
- **`accessibility/accessibility.md`** — WCAG 2.2 AA guidance.
- **`app-context/app-context.json`** — per-app patterns, persona, terminology.

## Style basis

All guidelines follow IBM Style conventions and use sentence case throughout. The `global-guidelines.md` file is the master reference for voice, tone, and words to avoid.

## Related

- `format-spec.md` — defines the markdown source structure and Figma/Word output mapping (used by `/generate-presentation` skill).
- `content-index.md` — master AI query guide. Plugin skills query this to route content questions to the right section file.
