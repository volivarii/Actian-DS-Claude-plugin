# Accessibility authoring guide

This guide is for the UX team. It explains how to update the accessibility guidelines so the design plugin and the docs site automatically pick up your changes.

## What you edit

**A directory of per-section files:** `accessibility/src/` in `volivarii/actian-ds-knowledge` (this repo). Each numbered top-level section of the WCAG 2.1 AA guidance lives in its own file:

```
accessibility/src/
├── 00-intro.md                       — version, last-updated, target standard
├── 01-principles.md
├── 02-color-contrast.md
├── 03-typography.md
├── 04-motion.md
├── 05-focus-keyboard.md
├── 06-aria-labels.md
├── 07-reading-order-landmarks.md
├── 08-touch-pointer.md
├── 09-error-prevention.md
├── 10-session-timeout-warnings.md
├── 11-components.md                  — per-component H3 entries + WCAG criteria
└── 12-designer-handoff-checklist.md
```

The numeric `NN-` prefix encodes section order. CI walks the directory in alphabetical order, so renaming or renumbering files reorders the derived index.

Edit a file directly on GitHub:
1. Open the file in `accessibility/src/` on GitHub.
2. Click the pencil icon at the top right.
3. Make your changes.
4. Scroll to the bottom, click **Commit changes**, choose **Create a new branch**, and create the PR.

You can also edit any file in any Markdown editor (Typora, iA Writer, Obsidian, etc.) and paste the result back into the GitHub web editor.

## What happens after you commit

When you open or update a PR that touches `accessibility/src/**`:
1. The **Derive a11y-index** workflow concatenates the per-section files (sorted by name) and regenerates `accessibility/dist/a11y-index.json` — a slug-keyed index of every section, used by the plugin to attach the right accessibility guidance to each component.
2. It commits the regenerated index back to your branch (`chore(accessibility): regenerate a11y-index.json + bump patch`) and bumps the patch version.

You don't need to install Node, run any script, or touch the JSON. The PR shows your MD changes and the auto-generated index side by side.

## How the files are structured

Each section file has its own H2 (`## N. <Title> {#anchor}`) at the top and may contain H3 sub-sections. Three kinds of content, all authored as plain markdown:

- **Numbered top-level sections** (`## 1. Principles`, `## 2. Color & Contrast`, …) — one per file `01-…md` through `10-…md`. Cross-cutting rules.
- **Component sub-sections** under `11-components.md` (`### Buttons`, `### Forms`, …) — per-component guidance. Each ends with a `**WCAG criteria:**` line listing the relevant success criteria; the derive step harvests those into the index.
- **The Designer Handoff Checklist** (`12-designer-handoff-checklist.md`) — the pre-handoff review checklist.

## Section ids — explicit `{#anchor}` per heading

Every `##` and `###` heading carries an **explicit `{#kebab-slug}` anchor**, appended at the end of the heading line:

```markdown
## 5. Focus & Keyboard {#focus-keyboard}
### Buttons {#buttons}
```

The anchor is the **stable cross-consumer reference** used by the plugin, the docs site, MCP, and category-default refs (`{ ref: focus-keyboard }`). The heading TEXT may change freely; the anchor must remain stable.

Why explicit anchors and not auto-derived from heading text:
- Renames stop breaking consumers — change `## 5. Focus & Keyboard` to `## 5. Keyboard & Focus` and the anchor (and every consumer) keeps working.
- The contract is visible in source — no hidden mapping in a derive script.

**Rules:**
- Every new H2 (`##`) and H3 (`###`) must end with ` {#some-slug}`.
- Slug characters: lowercase a–z, digits, and `-`. No uppercase, no `_`, no spaces.
- Anchors must be globally unique across `accessibility/src/**`. (Two H3 headings under `12-designer-handoff-checklist.md` currently re-use `{#color-contrast}` and `{#motion}` to deep-link back to their topic sections — that's intentional dedup, allowlisted in `tests/a11y-anchor-uniqueness.test.js`, not a precedent.)
- **Never rename or remove an anchor** without coordinating with consumers. The per-category accessibility defaults in `components/src/categories/*.md` reference these slugs (e.g. `{ ref: focus-keyboard }`); the `categories-derive` test catches orphans, but coordinate first to spare a broken PR.

**Adding a new section:** create a new file `accessibility/src/NN-<slug>.md` with a kebab-case anchor on each heading. Pick a `NN-` prefix that places the file in the desired section order.

**Renumbering or reordering** is safe via filename prefix changes — only changing the `{#anchor}` would shift the consumer slug.

## This file is a merged baseline

The current `accessibility/src/*` was carved out of the designer-authored v1.3.0 guidelines **plus** per-component WCAG criteria, screen-reader expectations, and the AI Output section that were merged back from the previous version. **Author the next version starting from these files** — don't re-import a fresh export, or that merged detail will be lost.

## Standard

The guidelines target **WCAG 2.1 AA**. Keep the version marker (`**Version:**`) and `**Last updated:**` lines in `00-intro.md` current when you make a substantive revision.

## What you don't need to do

- Don't edit `accessibility/dist/a11y-index.json` — it's auto-generated. CI will revert manual edits and push back the regenerated version.
- Don't install Node or run any script locally.

## More info

- Derive script: [`scripts/accessibility/derive-a11y-index.js`](../scripts/accessibility/derive-a11y-index.js)
- Workflow: [`.github/workflows/accessibility-derive.yml`](../.github/workflows/accessibility-derive.yml)
- Consumers: the design plugin (vendors these files + the index) and the docs site (renders the Accessibility page from them).
