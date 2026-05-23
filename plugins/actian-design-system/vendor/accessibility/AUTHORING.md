# Accessibility authoring guide

This guide is for the UX team. It explains how to update `accessibility.md` so the design plugin and the docs site automatically pick up your changes.

## What you edit

**One file:** `accessibility/accessibility.md` in `volivarii/actian-ds-knowledge` (this repo).

Edit it directly on GitHub:
1. Open [accessibility.md](./accessibility.md) on GitHub.
2. Click the pencil icon at the top right.
3. Make your changes.
4. Scroll to the bottom, click **Commit changes**, choose **Create a new branch**, and create the PR.

You can also edit it in any Markdown editor (Typora, iA Writer, Obsidian, etc.) and paste the result back into the GitHub web editor.

## What happens after you commit

When you open or update a PR that touches `accessibility.md`:
1. The **Derive a11y-index** workflow regenerates `accessibility/dist/a11y-index.json` — a slug-keyed index of every section, used by the plugin to attach the right accessibility guidance to each component.
2. It commits the regenerated index back to your branch (`chore(accessibility): regenerate a11y-index.json + bump patch`) and bumps the patch version.

You don't need to install Node, run any script, or touch the JSON. The PR shows your MD changes and the auto-generated index side by side.

## How the file is structured

`accessibility.md` has three kinds of content, all authored as plain markdown:

- **Numbered top-level sections** (`## 1. Principles`, `## 2. Color & Contrast`, …) — the cross-cutting rules.
- **Component sub-sections** under `## 11. Components` (`### Buttons`, `### Forms`, …) — per-component guidance. Each ends with a `**WCAG criteria:**` line listing the relevant success criteria; the derive step harvests those into the index.
- **The Designer Handoff Checklist** (`## 12.`) — the pre-handoff review checklist.

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
- Anchors must be unique in this file. (Two headings under different parents currently re-use `{#color-contrast}` and `{#motion}` — that's intentional dedup, not a precedent.)
- **Never rename or remove an anchor** without coordinating with consumers. The per-category accessibility defaults in `components/src/categories/*.md` reference these slugs (e.g. `{ ref: focus-keyboard }`); the `categories-derive` test catches orphans, but coordinate first to spare a broken PR.

**Adding a new section:** pick a kebab-case anchor, e.g. `### Carousels {#carousels}`. The slug becomes the contract.

**Renumbering or reordering sections** is always safe — only changing the anchor would shift a slug.

## This file is a merged baseline

The current `accessibility.md` is the designer-authored v1.3.0 guidelines **plus** per-component WCAG criteria, screen-reader expectations, and the AI Output section that were merged back from the previous version. **Author the next version starting from this file** — don't re-import a fresh export, or that merged detail will be lost.

## Standard

The guidelines target **WCAG 2.1 AA**. Keep the version marker (`**Version:**`) and `**Last updated:**` lines at the top current when you make a substantive revision.

## What you don't need to do

- Don't edit `accessibility/dist/a11y-index.json` — it's auto-generated. CI will revert manual edits and push back the regenerated version.
- Don't install Node or run any script locally.

## More info

- Derive script: [`scripts/accessibility/derive-a11y-index.js`](../scripts/accessibility/derive-a11y-index.js)
- Workflow: [`.github/workflows/accessibility-derive.yml`](../.github/workflows/accessibility-derive.yml)
- Consumers: the design plugin (vendors this file + the index) and the docs site (renders the Accessibility page from it).
