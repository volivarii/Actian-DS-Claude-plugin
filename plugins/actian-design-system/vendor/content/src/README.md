# `content/src/` — global content guidelines

> **This directory holds global / cross-cutting content guidelines only.** Voice and tone, words to avoid, UX-pattern copy, Actian product-surface rules. **Component-scoped copy lives per-component** at `components/src/<slug>/content.md`.

## Three sub-buckets

| Bucket | Holds | Examples |
|---|---|---|
| `writing/` | Strict grammar / voice / style rules | voice-and-tone, words-to-avoid, capitalization, punctuation, plurals, numerical-formatting, grid-and-spacing |
| `patterns/` | Universal UX patterns with copy guidance | forms, icons, empty/system states, loading, notifications, onboarding, wizards, uploads, validation-messages |
| `product/` | Actian product-surface copy rules | lineage-specific-ui, object-preview-panels, related-content-panels |

Meta files (`global-guidelines.md`, `content-index.md`, `format-spec.md`, this README, `AUTHORING.md`) live at the root.

## Editing

See [`AUTHORING.md`](AUTHORING.md) for the full workflow: file naming, section structure, decision tree for "which bucket does my new file go in?", how to add files to `content-index.md`.

## Where does component-scoped copy live?

`components/src/<slug>/content.md`. Each component owns its own copy guidelines in its own per-component directory alongside design / behavior / tokens. See `components/src/AUTHORING.md`.

## How this is consumed

- **Plugin** reads via `paths-manifest.json` `content.section` collection + the derived `content/dist/global.md` + `content/dist/words-to-avoid.json` (`content.wordsToAvoid`). Manifest indirection means the sub-bucket move is transparent.
- **Docs site** reads via the same manifest, regenerated nightly + on PR.
- **External / future AI** reads via stable `.md` URLs (planned).
