# Vendored third-party assets

These files are inlined into self-contained deliverables (`assemble-preview.js`
`--type flow-share`) so the output opens offline from `file://` with no CDN.

## alpinejs-3.14.9.min.js

- **What:** Alpine.js v3.14.9 production build (`dist/cdn.min.js`).
- **Why vendored:** the shareable flow prototype needs Alpine for nav + the
  Prototype/Overview view toggle, with zero external requests. It is inlined by
  `assemble-preview.js --type flow-share` (the `INLINE_ALPINE` read path), which
  is added in a following task — this asset is pre-positioned for it.
- **License:** MIT (© Caleb Porzio and contributors).
- **Source:** https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/cdn.min.js
- **Pinned:** to update — change the version in the filename AND the
  `INLINE_ALPINE` read path in `scripts/renderers/assemble-preview.js`, then
  re-download:
  ```bash
  curl -fsSL https://cdn.jsdelivr.net/npm/alpinejs@<version>/dist/cdn.min.js \
    -o templates/vendor/alpinejs-<version>.min.js
  ```
