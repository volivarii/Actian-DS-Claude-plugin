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

## Section ids — write plain markdown, no anchors

Every `##` and `###` heading automatically becomes an index section. Its **id (slug) is derived from the heading text** — the leading number is dropped, the rest is lowercased and hyphenated (`## 5. Focus & Keyboard` → `focus-keyboard`). You never write `{#anchor}`s by hand — that is the job of `scripts/accessibility/derive-a11y-index.js`.

**One caveat:** the per-category accessibility defaults in `components/src/categories/*.md` reference these slugs by name (e.g. `{ ref: focus-keyboard }`). If you **rename a heading**, its slug changes and those references can orphan. The `a11y-section-ids` test guards against this — but if it flags an orphaned ref after a rename, coordinate with whoever maintains the category files so the reference is updated too. Renumbering or reordering sections is always safe; only the heading *text* affects slugs.

## This file is a merged baseline

The current `accessibility.md` is the designer-authored v1.3.0 guidelines **plus** per-component WCAG criteria, screen-reader expectations, and the AI Output section that were merged back from the previous version. **Author the next version starting from this file** — don't re-import a fresh export, or that merged detail will be lost.

## Standard

The guidelines target **WCAG 2.1 AA**. Keep the version marker (`**Version:**`) and `**Last updated:**` lines at the top current when you make a substantive revision.

## What you don't need to do

- Don't edit `accessibility/dist/a11y-index.json` — it's auto-generated. CI will revert manual edits and push back the regenerated version.
- Don't add `{#anchor}`s to headings — slugs are derived automatically.
- Don't install Node or run any script locally.

## More info

- Derive script: [`scripts/accessibility/derive-a11y-index.js`](../scripts/accessibility/derive-a11y-index.js)
- Workflow: [`.github/workflows/accessibility-derive.yml`](../.github/workflows/accessibility-derive.yml)
- Consumers: the design plugin (vendors this file + the index) and the docs site (renders the Accessibility page from it).
