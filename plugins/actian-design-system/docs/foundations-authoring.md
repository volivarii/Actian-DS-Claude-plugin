# Foundations authoring guide

This guide is for the UX team. It explains how to update `foundations.md` so that the design plugin automatically picks up your changes.

## What you edit

**One file:** `plugins/actian-design-system/docs/foundations.md`.

Edit it directly on GitHub:
1. Open [docs/foundations.md](./foundations.md) on GitHub.
2. Click the pencil icon at the top right.
3. Make your changes.
4. Scroll to the bottom, click **Commit changes**, choose **Create a new branch**, and create the PR.

You can also edit it in any Markdown editor (Typora, iA Writer, Obsidian, etc.) and paste the result back into the GitHub web editor.

## What happens after you commit

When you open or update a PR that touches `foundations.md`:
1. CI runs a parser script.
2. It regenerates 8 JSON files in `docs/generated/foundations/` automatically.
3. It commits the JSON changes back to your branch with the message `chore(foundations): regenerate JSONs from foundations.md`.
4. It posts a comment on the PR summarizing what changed in plain language (e.g., "3 token values changed in `color.json`: blue-500, blue-600, blue-700").

You don't need to install Node, run any script, or touch the JSON files. The PR appears with both your MD changes and the auto-generated JSON changes side by side.

## Adding a token

Find the right table in `foundations.md` (e.g., section `2.1 Color — Global Tokens`). Insert a new row. The columns vary per table — match what's already there.

Example, adding a new color token:

| Token | Value | Status |
|-------|-------|--------|
| `--zen-color-blue-500` | `#0078A8` | ✅ |
| `--zen-color-blue-600` | `#005C82` | ✅ |
| `--zen-color-blue-650` | `#004A6C` | ⚠️ |   <-- new row

## Marking token status

Use these status emojis in the **Status** column:

| Emoji | Meaning |
|---|---|
| ✅ | Current — in production. Default; nothing extra emitted in JSON. |
| ⚠️ | Proposed — designed but not implemented yet. JSON gets `"status": "proposed"`. |
| ❌ | Deprecated — should be retired. JSON gets `"status": "deprecated"`. |
| 🚧 | In progress — being worked on. JSON gets `"status": "in-progress"`. |

If you write text after the emoji (e.g., `⚠️ pending review`), the parser keeps that text as `status_note` in the JSON.

If you add an emoji not in the list above, it'll be preserved as text but won't trigger a structured `status` field. Coordinate with engineering to add it to the parser's recognized list.

## Section numbering

The numbers at the start of each H2/H3 heading (`## 2.1`, `### 2.2`) are how the parser knows which JSON file each section feeds. **You can change the heading text after the number freely.** But if you renumber sections (e.g., move what was `2.1` to `2.7`), please coordinate with engineering — they'll need to update the parser map at `scripts/foundations/foundations.parser.json`.

If you add a brand new section with a number not yet in the parser map, the parser will skip it with a warning. Engineering then adds the mapping, after which the section starts producing JSON.

## What the 8 generated JSONs cover

| Section in MD | Output JSON | Notes |
|---|---|---|
| 1. Color Primitives | `color.json:primitives` | All shade tables across palettes |
| 2.1 — 2.2, 2.5, 2.10 | `color.json:global / text / focus / background` | Color token tables |
| 2.3 | `borders.json` | Border tokens |
| 2.4, 3.6 | `breakpoint-grid-structure.json` | Breakpoints + rules |
| 2.6, 3.4 | `elevation.json` | Elevation tokens + rules |
| 2.7, 2.11, 3.3 | `spacing.json` | Spacing + size + rules |
| 2.8, 3.2, 4.3 | `typography.json` | Typography + rules + placeholder |
| 2.9, 3.5 | `interaction-motion.json` | Motion + brightness filter |
| 2.12 | `icons.json` | Icon color tokens |
| 3.1, 4.1 | `color.json:rules / focus_ring_rules` | Color usage + focus ring rules |
| 4.2 | `borders.json:rules` | Border usage rules |

Sections 5 (Handoff Protocol) and 6 (Related Guidelines) are intentionally not parsed — they're process docs / pointers, not foundation data.

## When something goes wrong

- **PR comment says JSON didn't change but you expected it to:** the parser may not be reading your section. Check the heading numbering. If it's a new section, ping engineering to add a parser map entry.
- **Auto-commit didn't appear:** the workflow only runs when `foundations.md` (or the parser scripts) change in the PR. If you only changed something else, no regeneration is triggered.
- **CI failed:** open the workflow run from the PR's checks tab. The parser logs warnings for unmapped sections — these are non-fatal. A real error stops the run.

## What you don't need to do

- Don't edit any JSON file in `docs/generated/foundations/`. They're auto-generated. CI will revert your edits and push back the regenerated version.
- Don't edit `scripts/foundations/foundations.parser.json` unless you understand the parser map.
- Don't install Node or run any script locally.

## More info

- Engineering reference: [`scripts/foundations/foundations.parser.json`](../scripts/foundations/foundations.parser.json) — section number → JSON target mapping
- Parser source: [`scripts/foundations/derive-foundations.js`](../scripts/foundations/derive-foundations.js)
- Spec: [`docs/superpowers/specs/2026-05-01-md-as-sot-foundations-design.md`](../../../docs/superpowers/specs/2026-05-01-md-as-sot-foundations-design.md)
