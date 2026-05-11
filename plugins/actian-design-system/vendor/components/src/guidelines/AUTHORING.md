# Component guidelines authoring guide

This directory contains 85 per-component guideline files (44 hand-curated + 41 auto-generated stubs as of 2026-05-10). Stubs are placeholders that CI creates whenever a new DS Kit component lands in Figma — they keep coverage at 100% structural so consumers can rely on the shape, even before content is written.

## How to spot a stub

Every stub carries `"_stub": true` plus a `"_stubGeneratedAt"` ISO timestamp at the top of the JSON. The `_index.json` file in this directory mirrors that flag (`"_stub": true` on the matching entry).

## Curating a stub (the "stub-flip" ritual)

When you fill out a stub's content (frames, examples, behavior, etc.):

1. **Edit the per-component JSON** — fill in `frames_found`, `content_guidelines`, `design_guidelines`, `examples`, `screenshots`, `behavior`, etc. Move items out of `frames_missing` as you cover them.
2. **Remove the `_stub: true` flag** AND the `_stubGeneratedAt` field at the top of the file.
3. **Update `_index.json`** — find the matching entry (by `slug`) and set `"_stub": false`. Update the `has_*` booleans to reflect what you now cover. (CI will not flip these for you.)
4. **Open a PR.** No CI hook validates that the per-file `_stub` and the index `_stub` agree, so a CI consistency check is a worthwhile follow-up (see Phase E parking lot in the restructure spec).

## How CI stubs work

`scripts/foundations/generate-guideline-stubs.js` runs as part of `sync-from-figma.yml`. On each sync, it:
- Reads the latest registry from `components/dist/registries/dskit.json`
- For each `importMethod: "set"` slug not already on disk and not denylisted (logos, grids, etc.) and not already a hand-curated file, writes a stub
- Appends the stub's index entry to `_index.json`

Stub creation is **idempotent and additive only** — never overwrites an existing file. Once you flip `_stub: false`, the next sync run skips that file.

## Engineering reference

- `scripts/foundations/generate-guideline-stubs.js` — stub generator
- `scripts/sync/sync-from-figma.js` — sync orchestrator that invokes stub generation
