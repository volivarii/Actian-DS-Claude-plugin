# `components/dist/` — AUTO-GENERATED, DO NOT EDIT

Contents of this directory are produced by CI from upstream Figma data + hand-curated guideline content. Hand edits here are reverted on the next sync run.

## What's here

| Subtree / file | Generator | Source |
|---|---|---|
| `registries/dskit.json` | `scripts/sync/sync-from-figma.js` | Figma DS Kit file (REST sync) |
| `registries/fmkit.json` | same | Figma FM Kit file |
| `registries/metakit.json` | same — **hybrid:** the `templates` block is hand-curated and preserved across syncs (`_meta.hybrid: true`, `_meta.hybrid_field: "templates"`) | Figma Meta Kit file + hand edits |
| `registries/meta-kit/styles.json` | same | Figma Meta Kit text + effect styles |
| `text-styles.md`, `effect-styles.md` | `scripts/styles-to-md.js` | `registries/meta-kit/styles.json` |

## What's NOT here (and why)

`dskit-components.md`, `fm-components.md`, `meta-kit/components.md` are **plugin-derived** views of the registries — they're written by the plugin's `render-component-reference.js` post-vendor-pull, not by knowledge-repo CI. They appear in the plugin's `vendor/components/dist/` directory after the nightly vendor-snapshot runs but never in this repo's working tree. See spec for rationale (Phase B sub-decision).

## To change a registry value

Edit upstream in the corresponding Figma file. The `sync-from-figma.yml` workflow runs nightly (07:00 UTC) and opens a PR with the diff. The `metakit.json.templates` block is the only hand-edit surface — change it directly in this file (CI preserves it across syncs).
