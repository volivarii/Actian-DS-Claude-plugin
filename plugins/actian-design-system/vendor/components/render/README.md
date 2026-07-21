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
`Type/type.html`, `Spacing/spacing.html`). Output is gitignored
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

## `buildBundle()`'s return shape, and the `register_assets` name/subtitle enrichment

`buildBundle(outDir)` returns `{ written, assets }`. `written` is the flat list of
relative paths written (what `write_files` needs). `assets` is one entry per `.html`
card, `{name, path, group, subtitle}`, for `DesignSync`'s `register_assets` call.

The `@dsCard`-marker auto-compile that builds `_ds_manifest.json` only carries
`{path, group}` per card, so a card shows up in Claude Design's Design System pane
labeled by its bare slug. `register_assets` (marked "legacy" in the `DesignSync` tool
description, since the marker auto-compile supersedes it for registration, but it is
still live and is the only path that carries a name/subtitle) is how a card gets a
human-readable name and a one-line subtitle instead. `name` comes from the guideline
doc's `component` field (falling back to a humanized slug, e.g. `account-dropdown` ->
`Account Dropdown`, for the few rendered components with no guideline doc); `subtitle`
is the usage note's first sentence, capped to a short label. Both are derived, not
separately authored: nothing new to keep in sync as guideline content changes.

## Pushing to Claude Design

Via the `DesignSync` tool: `list_files` -> `finalize_plan` -> `write_files` ->
`register_assets` (assets, using `buildBundle()`'s returned metadata). Incrementally:
write only the paths that changed, never delete or overwrite `templates/`,
`_ds_manifest.json` (Claude Design compiles this itself from each card's `@dsCard`
marker, then layers `register_assets` metadata on top), or `_adherence.oxlintrc.json`
(a Claude-Design-managed adherence-lint scaffold, currently empty; relevant once a real
component/token registry exists to populate it). The live reference instance is the
"Actian Product Design System (dogfood)" project.
