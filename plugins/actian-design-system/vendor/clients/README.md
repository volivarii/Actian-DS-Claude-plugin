# clients/ — the substrate's reference reader

Single source of truth for the _generic_ consumption mechanics, so consumers
don't re-implement them (and drift). Travels into every consumer's `vendor/`
via `vendor-include.json`. See [`../CONSUMING.md`](../CONSUMING.md).

- **`resolve-paths.js`** — `buildPaths(vendorRoot)` → the dot-walked `PATHS`
  object from `<vendorRoot>/paths-manifest.json` (leaves = file paths,
  collections = `(slug)=>path` functions). **Adopt by IMPORTING the vendored
  copy** (`require('<vendor>/clients/resolve-paths.js').buildPaths(VENDOR)`) and
  layering your own overlays on the result. Single source, refreshed every
  vendor pull → zero drift. Safe to import-from-vendor (read-only runtime code).

- **`vendor-snapshot.js`** — `runSnapshot(config)` (range-resolve → fetch
  tarball → include-select → copy → write `vendored.json`). **Adopt by COPYING
  this core** into your repo (a build tool must not depend on the bundle it
  produces, and it bootstraps an empty `vendor/`); keep a drift-guard test
  comparing your copy to the vendored canonical.

  `config = { knowledgeRepo, vendorDir, vendoredJsonPath, excludeTopLevel, postVendorHook }`:
  - `knowledgeRepo` — `"owner/repo"` of the substrate.
  - `vendorDir` / `vendoredJsonPath` — absolute paths the snapshot writes.
  - `excludeTopLevel` — a `Set` of top-level names dropped in the legacy
    exclude-fallback (only used when a pinned snapshot predates
    `vendor-include.json`). **Pass it** — it also populates
    `vendored.json#excluded_entries`; omitting it leaves that field `[]`.
  - `postVendorHook` — optional `() => void`, run after a successful copy and
    before `[vendor] OK`. Throw to abort; set `process.exitCode` inside it for
    "warn-and-continue" semantics. (The plugin passes its component-mirror
    regeneration here.)

  Owns no CLI shell: `runSnapshot` **throws** on a fatal condition (no in-range
  tag / no resolvable SHA) and **returns** `{ resolvedVersion, resolvedRange,
sha }` on success. Your thin entry adds the `require.main` guard +
  `try/catch → "[vendor] FATAL" → process.exit` wrapper.

Promotes to a published npm package when the repo moves to the Actian org / OSS.
