# Vendored libraries — fidelity Gate 1

These are copied (not npm-installed) so the fidelity gate runs with **zero npm
dependencies and zero system-binary install** beyond a browser (Chrome, which is
needed for rendering regardless). The gate is dev/CI-only tooling — never invoked
by plugin end-users.

| File | Package | Version | License |
|---|---|---|---|
| `pixelmatch.js` | [pixelmatch](https://github.com/mapbox/pixelmatch) | 5.3.0 | ISC (`pixelmatch.LICENSE`) |
| `pngjs/` | [pngjs](https://github.com/pngjs/pngjs) | 7.0.0 | MIT (`pngjs/LICENSE`) |

- `pixelmatch.js` is the package's single `index.js` (a pure function over raw RGBA
  buffers — its only npm dep, pngjs, is used by its CLI, which we don't vendor).
- `pngjs/` is the package's `lib/` + `package.json` (entry `lib/png.js`); it has no
  external deps and decodes PNG via Node's built-in `zlib`.

To refresh: `npm pack pixelmatch@5 pngjs@7`, then re-copy `index.js` + `lib/`.
