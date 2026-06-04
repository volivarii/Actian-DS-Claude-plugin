# Changelog

All notable changes to the Actian Design System plugin are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
in `plugins/actian-design-system/.claude-plugin/plugin.json`:
**MAJOR** = breaking, **MINOR** = features, **PATCH** = fixes.

Routine `vendor(knowledge): refresh to vX.Y.Z` commits are automated nightly
patch bumps that propagate a pinned snapshot from
[`volivarii/actian-ds-knowledge`](https://github.com/volivarii/actian-ds-knowledge);
they are not individually listed below unless they changed user-facing behavior.

This file was seeded at v1.97.0 from the commit history; entries before that
are summarized at the release level.

## [1.99.0] — 2026-06-04

### Added
- **generate-flow visual feedback (Tier A).** The HTML preview now renders
  **automatically and before** the Figma push (was opt-in and last), and the
  build + push phases stream `N/M` progress to the chat — so the run is never a
  silent wait and the visual lands before the slow push.
- **`assemble-preview.js --refresh <seconds>`** — injects a self-contained
  auto-reload (meta-refresh + JS fallback, no server) into the preview HTML.
  Off by default; deterministic. Seam for the staged "watch it build"
  follow-on + a Cowork auto-refresh spike.

## [1.98.2] — 2026-06-04

### Fixed
- **HTML preview render fidelity — prop-key drift in `fm-html-map.js`.** Several
  hand-written FM component renderers read prop keys that didn't match what the
  flow data ships, so they rendered **blank** in the HTML preview while the Figma
  push (which resolves keys at runtime) rendered them correctly — a twin
  divergence:
  - **`#id`-suffixed keys now resolve in HTML.** Added `normalizeProps()` which
    aliases `"Label#1411:32"` → `"Label"` (mirroring the emitter's
    `split('#')[0]` resolver), so e.g. buttons authored with suffixed keys no
    longer render label-less.
  - **`fmStepper`** now reads the `"Step number"` key and renders the step
    **Label** + active/upcoming/complete state (was an empty grey circle — the
    dominant break on wizard flows).
  - **`fmTableCell`** renders multi-column header/data rows authored as one
    instance with numbered `Label`…`Label 5` props (was showing only the node
    name).
  - Regression-guarded with new golden fixtures (stepper, suffixed-key button,
    multi-column row) — the coverage gate proves a renderer *exists*; these prove
    it renders real *content*.
- **generate-flow Figma push — two output bugs found in wider-audience testing:**
  - **GenLog version trap.** `SKILL.md` and `figma-push-patterns.md` told the AI
    to "read the version from `plugin.json`, never hardcode" — then printed the
    literal `v1.55.0`, which the AI copied verbatim. Replaced the stale literal
    with a run-time read command, so the generation card shows the real version.
  - **Screen-frame clipping.** The push created a fixed `1440×960` screen frame,
    so tall screens (long forms) clipped at 960px. The frame now hugs content
    height (960 as a minimum, not a cap) and never clips.
  - **Chrome props left as defaults.** The content emitter sets `screen.content[]`
    props deterministically, but app-header / page-header / sidebar (chrome) are
    pushed by prose — and the push step never mapped the screen data → the chrome
    component props, so headers showed "Page Title" / "Description text" /
    "Button label". Step 6c now spells out the data→prop mapping
    (`Title#979:22` ← `pageHeader.title`, action-button labels, nav labels,
    active-item state) + the page-header top margin. (Deterministic chrome
    emission — extending the twin emitter to whole-screen — is queued as the next
    stage.)

## [1.98.0] — 2026-06-04

### Added
- **Deterministic Figma content emitter (`render-node-figma.js`)** — the
  structural twin of the HTML `render-node.js`. One component-node spec
  (`content[]`: FRAME/TEXT/INSTANCE/RECT/ELLIPSE/DIVIDER) now drives BOTH the
  offline HTML preview and the Figma push, so they are mechanically identical
  by construction rather than by convention. The emitter validates the tree
  (runtime gate), resolves FM refs to component keys, and emits one atomic
  `use_figma` script (font-preload → build → append-into-parent →
  FILL-after-append → `{createdNodeIds, mutatedNodeIds}`).
- **Twin-parity golden gate** (`tests/renderers/twin-parity-emit.test.js`) +
  `form-create` / `table-list` fixtures, plus extension of the fm-coverage and
  token-resolution gates to the emitter.

### Changed
- **`/generate-flow` content push routes through the emitter** as the canonical
  path (parallel-change per MIGRATIONS Rule 1; the hand-walk remains the
  documented fallback during cutover).

## [1.97.0] — 2026-06-04

### Fixed
- **Wider-audience Phase 1 — doc-drift sweep.** Reconciled every advertised
  inventory count against ground truth (filesystem + vendored registries):
  - Skills **9 → 8**, agents **8 → 9** across `marketplace.json` and
    `plugin.json` (and added the missing `brief-researcher` to the marketplace
    agent list).
  - Recipes **23 / 25 → 24** (README banner / marketplace).
  - **WCAG 2.1 → 2.2 AA** across README, `marketplace.json`, `USAGE.md`,
    `llms.txt` (the substrate moved to 2.2 some releases ago).
  - Component counts corrected to the vendored registries: **DS Kit 318 / 80
    sets** (was 322 / 82 / 107), FM Kit 287 / 33, Meta Kit 28 / 11 — in README,
    `companion-context.md`, `llms.txt`, `figma-push-patterns.md`.
  - Guideline counts reframed from the obsolete "85 docs / 41 stubs" to the
    vendored reality: **44 per-component guideline docs** (36 components + 8
    registry-key aliases), all content-bearing in the current snapshot.
- Purged the live `sync-design-system` references that survived its v1.79.0
  decommission (marketplace skill list, `llms-overview.md`); kept the
  intentional historical tombstones.
- Rewrote README's stale project-structure tree (it described a pre-federation
  `docs/foundations.md` / `docs/generated/` layout that no longer exists; the
  DS substrate now lives under `vendor/`).

### Added
- **Count-guard regression test** (`tests/integration/doc-counts.test.js`):
  derives the canonical skills / agents / recipes / component / guideline
  counts from the source of truth and asserts every managed doc matches —
  inventory counts can no longer drift silently.
- **`claude plugin validate` CI gate** in `pr-checks.yml` (`--strict` for the
  marketplace manifest; non-strict for the plugin manifest).
- This `CHANGELOG.md`.

## [1.96.0] — 2026-06-03

### Fixed
- **Wider-audience Phase 0 — stop-the-bleeding hardening** for first-run
  robustness on fresh machines: repointed the hifi transformers off the
  non-existent `docs/generated/` onto the vendored registries; fixed
  `ensure-server.sh` cold-start node resolution; removed a dead `SessionStart`
  hook; broadened node resolution (nvm / Volta / asdf / fnm / Homebrew /
  system); env-precise README + point-of-use Figma-MCP guidance; corrected
  tester auto-update / cache-bust instructions.

## [1.95.0] — 2026-06-03

### Added
- Fat Marker HTML precision pass + tier-agnostic component-node seam, with
  three new quality gates (coverage, token-resolution, golden-snapshot).

## [1.94.0] — 2026-06-03

### Added
- Accessibility linked-criteria slice: sourced WCAG criteria surfaced in the
  component brief and companion.

## 1.93.x — 2026-06-02

### Changed
- Drift-proof vendored-path references (`vendor-paths-resolve` CI guard).
- Adopted the shared knowledge consumption client (resolver import + snapshot
  copy + drift guard).
- Track E evictions: plugin now owns `presentation-guide.md` and
  `fm-to-ds-map.json` under `references/`.
- Inclusion-based vendoring — dropped upstream tooling from `vendor/`.

## 1.90.0 – 1.91.0 — 2026-05-31

### Changed
- Consume the substrate directly: `bySlug` O(1) lookup + verbatim
  `categorySlug`; structured `words-to-avoid.json` with an avoid-word
  soft-check in flow validation.

## 1.89.0 — earlier

### Changed
- Refreshed knowledge to slug-only foundations/accessibility filenames with
  `_order.json`; symmetric `a11y_refs` / `motion_refs` consumer rename.

[1.97.0]: https://github.com/volivarii/Actian-DS-Claude-plugin/releases/tag/v1.97.0
[1.96.0]: https://github.com/volivarii/Actian-DS-Claude-plugin/releases/tag/v1.96.0
[1.95.0]: https://github.com/volivarii/Actian-DS-Claude-plugin/releases/tag/v1.95.0
[1.94.0]: https://github.com/volivarii/Actian-DS-Claude-plugin/releases/tag/v1.94.0
