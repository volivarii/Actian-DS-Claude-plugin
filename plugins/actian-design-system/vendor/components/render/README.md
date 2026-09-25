# `components/render/`: the canonical render + the Claude Design bundle

`renderer/` is the fact-driven renderer itself (see `renderer/README.md`). This file
documents the other half: `scripts/render/build-bundle.js`, which projects the derived
gallery into a directory of self-contained `@dsCard` HTML files ready to push to a
[Claude Design](https://claude.ai/design) project via the `DesignSync` tool.

## Building the bundle

```
node scripts/render/build-bundle.js --out <dir>
```

Writes one self-contained HTML file per rendered component (grouped by DS category,
e.g. `Action/button.html`), plus three foundations cards (`Colors/palette.html`,
`Type/type.html`, `Spacing/spacing.html`), plus `styles.css` at the root: the fonts and
`render.css`, the same two stylesheets every card inlines. Output is gitignored
(`components/render/dist/bundle/`); build on demand, not committed.

## The `.prompt.md` sibling: usage notes reach Claude Design's own generation, not just a human reader

Every card that has a guideline doc also gets a `<slug>.prompt.md` file written next to
`<slug>.html` (e.g. `Action/button.prompt.md`), as raw markdown. Content comes from
`scripts/render/derive-usage-notes.js`, which is already fed by the real guideline
domains (`components/dist/guidelines/<slug>.json`); nothing new to author. This is the
only place the note ships: the card's own HTML is a clean component render with no
usage prose baked into the body. An earlier version of this pipeline also embedded the
note as a visible `<section class="ds-usage">` inside the card; that was removed because
it duplicated what Claude Design's own "Add usage notes" panel already surfaces to a
human, and cluttered what should be a clean preview of the component.

This was confirmed empirically, not from Claude Design documentation (none is public):
the dogfood project already had two hand-pasted `.prompt.md` files (`button`, `calendar`)
from an earlier session's manual use of Claude Design's "Add usage notes" UI affordance,
and their content matched this generator's own output shape. The delivery path is
therefore a normal `DesignSync write_files` call, same as the `.html` cards, with no
manual paste required. `derive-usage-notes.js`'s own header comment used to claim this
delivery was impossible; that was wrong and has been corrected in place.

Because the filename is `.prompt.md`, not `.notes.md` or `.readme.md`, treat this as
grounding for Claude Design's *own* AI-driven composition (steering it to use each
component per Actian's real "when to use" / "when not to use" / style rules), not only
documentation for a human browsing the project.

## What Claude Design's index reads: the marker and the root stylesheet

`buildBundle(outDir)` returns `{ written, assets }`. `written` is the flat list of
relative paths written (what `write_files` needs). `assets` is one entry per `.html`
card, `{name, path, group, subtitle}`, for `DesignSync`'s legacy `register_assets` call.

Each card's first line is its marker, and it carries the card's name and subtitle:
`<!-- @dsCard group="Action" name="Buttons" subtitle="..." -->`. `name` comes from the
guideline doc's `component` field, which names a family: when several rendered
components share one (`card`, `card-for-grouped-content` and `card-for-perimeter` all
read "Cards"), each takes a humanized slug instead (`Card For Perimeter`), as does a
component with no guideline doc (`account-dropdown` -> `Account Dropdown`). `subtitle`
is the usage note's first sentence, capped to a short label, and is left out when there
is no note. Both are derived, not separately authored.

Checked against the dogfood project on 2026-09-24, first with a probe card and a probe
stylesheet, then with this bundle, read back from the compiled `_ds_manifest.json`:

- The index keeps a marker's `name`, `subtitle` and `viewport`. A card whose marker has
  only a group is listed by its file name. `register_assets` changed nothing on this
  project, whose manifest is `"source": "spa"`, so the marker is the path that works.
- A stylesheet at the project root is recorded in `globalCssPaths`, its custom
  properties become the system's `tokens` (typed, e.g. `color`, `spacing`) and its
  `@font-face` rules its `fonts`. Before `styles.css` the index held no tokens and no
  fonts, although every card carries both inline. `styles.css` declares 231 tokens in
  `:root, [data-theme="actian"]` and 46 each in a `studio` and an `explorer` override
  block. The index lists the 231, then each override again with a `scope` naming its
  theme block, and records Studio and Explorer as `themes`. Its fonts are Roboto (400,
  500, 700) and Inter (400, 500, 600).
- The same read showed a gap in the tokens themselves: `--zen-font-family-brand` named
  `AllRpungGothic` (a misspelling of AllRoundGothic, hard-coded in the derive) and
  `--zen-font-family-mono` named Roboto Mono, neither with a `@font-face` in the render
  dist, so the index marked both `no-face`. The brand token has since been set to
  Roboto, the apps' font, which the render dist embeds; mono stays Roboto Mono, still
  without a face.

## Pushing to Claude Design

Via the `DesignSync` tool: `list_files` -> `finalize_plan` -> `write_files`.
Incrementally: write only the paths that changed, never delete or overwrite
`templates/`, `_ds_manifest.json` or `_adherence.oxlintrc.json` (a
Claude-Design-managed adherence-lint scaffold, currently empty). The index in
`_ds_manifest.json` is not rebuilt by the push: Claude Design compiles it in its
"Check design system" step, which runs as a chat turn inside the project, so a push is
followed by that turn and then a read of the manifest. `npm run bundle:reconcile`
compares the live listing with what this script produces and with
`bundle-external.json`. The live reference instance is the "Actian Product Design
System (dogfood)" project.
