# Foundations authoring guide

This guide is for the UX team. It explains how to update the foundations source so the design plugin automatically picks up your changes.

## What you edit

**A directory of per-section files:** `foundations/src/` in `volivarii/actian-ds-knowledge` (this repo). Each top-level section of the Foundation lives in its own file:

```
foundations/src/
├── _order.json                       — section order (canonical sequence as JSON array)
├── intro.md                          — title, doctrine, version, last-updated
├── table-of-contents.md
├── color-primitives.md               — § 1 (palettes, OKLCH shade formula)
├── tokens.md                         — § 2 (all token sections 2.1–2.11, including motion patterns)
├── design-guidelines.md              — § 3 (color/typography/spacing/elevation usage rules)
├── handoff-protocol.md               — § 4
└── related-guidelines.md             — § 5 (sibling pointers)
```

Section order is encoded in `_order.json` — a JSON array of slugs in canonical sequence. CI reads the manifest to determine concat order; the filename slug (the part before `.md`) is the section identity used in cross-references. Adding a new section means creating `<slug>.md` and appending the slug to `_order.json`; reordering is a one-line edit to the array.

CI hard-errors if `_order.json` and the on-disk file set drift (slug in manifest without a file, or file without a manifest entry).

Edit a file directly on GitHub:
1. Open the file in `foundations/src/` on GitHub.
2. Click the pencil icon at the top right.
3. Make your changes.
4. Scroll to the bottom, click **Commit changes**, choose **Create a new branch**, and create the PR.

You can also edit any file in any Markdown editor (Typora, iA Writer, Obsidian, etc.) and paste the result back into the GitHub web editor.

## What happens after you commit

When you open or update a PR that touches `foundations/src/**`:
1. CI runs the schema-less hierarchical parser against the concatenated per-section content.
2. It regenerates the `foundations/dist/` tree automatically (Pattern H — one JSON per leaf section, `_index.json` per directory, a `foundations.bundle.json` roll-up, plus a verbatim `.md` copy at `foundations/dist/foundations.md`).
3. It commits the regenerated tree back to your branch with the message `chore(foundations): regenerate JSONs from foundations/src/`. Note: `foundations/dist/foundations.md` is a SYNTHESIZED concatenation of the per-section files (joined with `\n\n---\n\n`) — convenient for Stripe-style `.md` URL access, but not byte-identical to any single src file.
4. It posts a comment on the PR summarizing what changed in plain language (e.g., "3 token values changed in `tokens/color-global-tokens/semantic-aliases.json`").

You don't need to install Node, run any script, or touch the JSON files. The PR appears with both your MD changes and the auto-generated JSON changes side by side.

You can rename, reorder, or restructure sections freely — the parser tracks MD structure and uses `_order.json` for canonical sequence. The output tree adapts. (Renaming a section slug also requires updating any cross-substrate references; the Tier 2 editor's safe-slug-rename will handle that in v2.)

## Adding a token

Find the right table in `foundations/src/tokens.md` (e.g., section `2.1 Color — Global Tokens`). Insert a new row. The columns vary per table — match what's already there.

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

## Adding a motion pattern

Motion patterns live in `foundations/src/tokens.md` under section `2.9 — Motion` and are written as **bold paragraphs** followed by a phase table:

```markdown
**Drawer (open/close)** {#drawer-open-close}

| Phase | Duration | Easing | Behavior |
|-------|----------|--------|----------|
| Open  | `duration-slow` | `ease-entrance` | Slides in from the right |
| Close | `duration-base` | `ease-exit`     | Slides out to the right |
```

The `{#kebab-slug}` after the bold name is the **stable consumer-facing slug**. Plugin code, category refs (`{ ref: drawer-open-close }`), and any downstream consumer addresses the pattern by that anchor — the bold name itself may be re-worded freely.

**Rules:**
- Every motion pattern bold-paragraph must end with ` {#kebab-slug}`.
- Slug characters: lowercase a–z, digits, and `-`.
- Slug must be unique within the motion section.
- **Leave a blank line** between the bold-paragraph (with anchor) and the table that follows. Without the blank line, marked merges them into one paragraph and the parser misreads it.
- **Don't anchor `**Logic & Accessibility**` subsection labels** — they're a structural marker, not an addressable pattern.

**Adding a new pattern:** append a new bold + anchor + phase-table block under the Component Motion Guide. The slug becomes the contract; downstream `{ ref: <slug> }` references in `components/src/categories/*.md` resolve automatically.

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

- **PR comment says JSON didn't change but you expected it to:** the parser walks heading structure — make sure your section is under an H2/H3 inside the in-scope top-level sections (Handoff Protocol and Related Guidelines are skipped on purpose).
- **Auto-commit didn't appear:** the workflow only runs when something under `foundations/src/` (or the parser scripts) change in the PR. If you only changed something else, no regeneration is triggered.
- **CI failed:** open the workflow run from the PR's checks tab. The parser logs warnings for unmapped sections — these are non-fatal. A real error stops the run.

## What you don't need to do

- Don't edit any JSON file in `foundations/dist/` (including `_index.json` files). They're auto-generated from `foundations/src/**`. CI will revert your edits and push back the regenerated version.
- Don't edit `foundations/dist/foundations.md` — it's a CI-synthesized concatenation of the per-section src/ files (with `\n\n---\n\n` joiners).
- Don't install Node or run any script locally.

## More info

- Parser source: [`scripts/foundations/derive-foundations.js`](../../scripts/foundations/derive-foundations.js) — hierarchical Pattern H derive
- AST helpers: [`scripts/foundations/foundations-parser/`](../../scripts/foundations/foundations-parser/)
- Output layout reference: [`foundations/dist/README.md`](../dist/README.md)
