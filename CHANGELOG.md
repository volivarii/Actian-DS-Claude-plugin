# Changelog

All notable changes to the Actian Design System plugin are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Since `2026.6.0` the plugin uses **calendar versioning** (`YYYY.MM.PATCH`) in
`plugins/actian-design-system/.claude-plugin/plugin.json`: same month bumps
**PATCH**, a new month resets to `YYYY.MM.0`. (Versions through `1.108.0` were
semver; `2026.6.0 > 1.108.0` numerically, so release ordering is preserved.)

Routine `vendor(knowledge): refresh to vX.Y.Z` commits are automated nightly
version bumps (PATCH within a month, or a `YYYY.MM.0` reset at a month boundary)
that propagate a pinned snapshot from
[`volivarii/actian-ds-knowledge`](https://github.com/volivarii/actian-ds-knowledge);
they are not individually listed below unless they changed user-facing behavior.

This file was seeded at v1.97.0 from the commit history; entries before that
are summarized at the release level.

## [2026.6.21] — 2026-06-29

### Added
- **Typed rendering in generated flows (S3c).** Entity properties carry a `type`
  through the flow glossary, and the screen-generator now renders it: `type:"enum"`
  columns become `fmTableCell Type=Pill` status badges (HTML `.fm-table-cell__pill`,
  token-bound, mirroring `.fm-badge`), and `type:"date"` values follow the content
  guideline's date format. Property labels are humanized from camelCase
  (`apiVersion` → "Api version"). New non-blocking advisory `enum-not-typed` flags an
  enum-bearing flow that renders no pill.

### Fixed
- The `properties-ungrounded` grounding check now tokenizes the rendered property
  **label**, not just the raw field name, so camelCase-named columns
  (`apiVersion` → "Api version") still ground and don't trip a spurious advisory.

## [2026.6.20] — 2026-06-28

### Added
- **Entity-property-grounded tables & forms (S3b).** Table column headers and form
  field labels are resolved from the entity's `properties` in `app-context.json`
  (`resolve-properties.js` → `meta._glossary`) instead of invented per screen. New
  non-blocking advisory `properties-ungrounded` flags a flow whose tables/forms reflect
  none of the entity's standard fields.

## [2026.6.19] — 2026-06-28

### Added
- **Relationship-grounded detail content (S3).** Detail-view screens draw their tab bar
  and related sub-lists from the entity's relationship graph (`resolve-relationships.js`),
  so a detail page reflects the entity's real connections. New non-blocking advisory
  `relationships-ungrounded`.

## [2026.6.17] — 2026-06-28

### Added
- **App-grounded authoring + pattern resolution (S2).** The target app is an explicit
  choice; flows resolve one of the app-scoped named UX patterns (`resolve-patterns.js`)
  into an idiomatic scaffold, with app-scope enforced (an app can't borrow another app's
  pattern). New non-blocking advisory `pattern-ungrounded`.

## [2026.6.14] — 2026-06-26

### Added
- **App-chrome grounding (S1).** Generated screens take their sidebar / header / nav from
  the structured `app-context.json` for the target app (`resolve-chrome.js`), eliminating
  generic or hallucinated navigation. New non-blocking advisories `chrome-divergence` /
  `chrome-drift` / `chrome-ungrounded` / `chrome-incoherent`.

## [2026.6.0] — 2026-06-13

### Changed

- **Versioning switched to calendar versioning** (`YYYY.MM.PATCH`). The plugin
  is an end-user tool whose version is a release counter, not an API contract,
  so month-granularity recency is the meaningful signal rather than a
  major/minor/patch semantic. Same month → PATCH+1; new month → `YYYY.MM.0`. CI
  auto-bump (`vendor-snapshot.yml`) and the manual `scripts/lib/bump-version.js`
  now share one `calendar` mode. Knowledge-repo versioning is unaffected (it
  stays semver — it's resolved through a version range). Prior plugin history
  through `1.108.0` was semver.

## [1.106.1] — 2026-06-10

### Added
- **Studio chrome + AI Steward, sourced from Figma intent.** The hi-fi DS chrome now reads as the
  real Studio app, authored from the Figma component frames (Figma is the source of truth; the
  shipping code is a reference only):
  - **global-header** → the real cluster: brand/app + context selector + global search + a right
    cluster (What's new · notifications · apps switcher · avatar). No invented AI trigger (Figma has none).
  - **side-nav** → grouped icon sidebar (groups, per-item icons, active state, collapse). The legacy
    comma `Items` prop still works (back-compat).
  - **chat-with-ai-steward** → header controls (New chat · settings · expand · close), a Welcome state,
    a task-input footer (Give Steward a task + context chip + Plan), and a `Drawer` size.
  - **Steward placement** — the renderer now wraps the Steward as an **overlay** (fixed, floats over
    content) or a **docked full-height column** (`mode:"docked"` → 3-column shell that reflows the main
    content), matching the Figma `size` Default/Drawer variants.
- Chrome-config wiring: `screen.header` (search/account/context) and `screen.sidebar.groups`
  (grouped icon nav) feed the upgraded leaves; `screen.steward` descriptor drives the overlay/docked Steward.
- Captured Figma anatomy reference (`references/generate-flow/studio-chrome-anatomy.md`) as the authoring oracle.

## [1.106.0] — 2026-06-10

### Added
- **`--hifi` = DS-native authoring.** `generate-flow --hifi` now composes screens directly
  against the DS component vocabulary (content INSTANCE nodes carry `library:"ds"` + `dsSlug`)
  and renders themed hi-fi HTML as the deliverable — no Figma round-trip. `--hifi` no longer
  implies a Figma push (push stays `--push`); the `transform-to-hifi` path survives only inside
  `/convert-to-hifi`. New vocabulary reference `references/generate-flow/ds-components-authoring.md`
  (the 69-slug surface, built-vs-chip status, per-leaf props), a DS-native branch in the
  screen-generator agent, and a Studio `search-results-ai` recipe.
- **AI feature foundations (demo Use Case 2).** Vendored the `chat-with-ai-steward` component
  guideline (Studio/Explorer AI surface — first authored `usage` doc) + curated `ai`/`stars`
  glyphs (knowledge v0.31.1, 37 icons). New `ux-patterns.md` §F "AI Surfaces" answer path; the
  AI a11y slice is now reachable via `a11y.js` (un-orphaned through `a11y_refs`).
- **Five new DS leaves** (19 built total): `table`, `modal`, `empty-state`, `alert-banner`, and
  the static `chat-with-ai-steward` panel (sparkle header, insight, source line, confidence
  badge, streaming shimmer). Each token-bound, oracle-checked, with a fidelity-ledger row
  depositing anatomy facts.
- **DS-node contract.** `flow-data.schema.json` declares `library`/`dsSlug` (decision #2:
  extend) + renderer-drift repairs; the validator hard-errors `unknown-ds-slug` and warns
  `ds-slug-unbuilt` (renders as a graceful chip). `BUILT_SLUGS` is exported with a switch-case
  sync gate.
- **page-header actions slot** on the DS chrome path — primary/secondary CTAs survive hi-fi
  (was dropped).
- **Embedded Roboto + Inter** woff2 subsets (base64 data URIs) in the flow deliverable — DS
  leaves render in the real `--zen-font-family-text` face while staying fully offline.

### Fixed
- **`meta.mode:"hifi"` promotion** — `/convert-to-hifi` outputs now render DS leaves in themed
  DS chrome instead of grey FM chrome (the assembler ignored `meta.mode`).
- **Render-path hardening** — `fillToCss` object-shaped colors no longer leak `[object Object]`;
  style-attribute values are escaped (injection); a malformed node degrades to a labeled chip
  instead of blanking the preview; DS nav active-item matching is case-insensitive (FM parity).
- **Critical-secondary button** renders its own outline variant instead of silently falling back
  to primary blue on destructive flows.
- Repointed a dead `figma-spec-builder.md` reference in the screen-generator agent.

### Decisions (recorded)
- #2 schema = extend (shipped). #3 fidelity gate = assisted-vision for now, pixel-diff
  (ImageMagick vs media oracle) as the PRIMARY gate fast-follow (fidelity README doctrine
  flipped). #1 bridge framing / Renderers-publish ask = OPEN. `--hifi` = DS-native authoring;
  AI carrier = chat-with-ai-steward (Studio/Explorer).

## [1.105.0] — 2026-06-10

### Added
- **Self-healing doc-count sync in the vendor pipeline** — a knowledge re-vendor
  that changes a registry component count (e.g. DS Kit 318→319 in v0.30.5) used
  to leave the human-facing inventory counts (README, llms.txt, marketplace.json,
  plugin.json, companion-context, figma-push-patterns) stale, failing the
  `doc-counts` guard and leaving the auto-merge vendor PR **stuck** with no
  self-healing path. The vendor-snapshot workflow now runs
  `scripts/vendor/sync-doc-counts.js` after each pull to rewrite those counts
  from the registries, and commits the result (the managed docs were added to
  the PR's `add-paths`), so count-changing refreshes merge cleanly.
  - The guard (`tests/integration/doc-counts.test.js`) and the fixer now share
    one source of truth — `scripts/lib/doc-counts.js` (`deriveCounts` +
    `buildChecks` + `fixContent` + `syncDocCounts`) — so they can never
    disagree. Vendor reads route through `PATHS`; fixer regexes are anchored and
    idempotent (a real-doc idempotency test guards against over-greedy
    rewrites). Run `node scripts/vendor/sync-doc-counts.js --check` to report
    drift, or without `--check` to fix it.

## [1.104.5] — 2026-06-10

### Added
- **Hi-fi DS render core** — the first DS-native render tier for `generate-flow`
  HTML output, gated entirely on `library: "ds"` so fat-marker (lo-fi) flows are
  untouched:
  - **Two new DS leaves — `toggle` and `radio-button`** (now 14 leaves total),
    hand-authored token-bound BEM markup modeled on the existing
    `checkbox-with-label` leaf. Each covers off / on / disabled states (toggle
    also right-aligned-with-helper; radio also card format). 8 goldens + DOM
    tests assert real rendered HTML (incl. hostile-label escaping).
  - **Phase-1 chrome + theming** — `flow-renderer.js` `screen()` now branches
    `library: "ds"` screens to real DS chrome leaves (global-header / side-nav /
    page-header) via an `appProfile` (app → `{theme, headerApp, navApp}`), sets
    `data-theme` (studio / explorer / actian) so per-app accent tokens recolor
    by inheritance, and adds a `.screen--hifi` surface class. Lo-fi screens
    render byte-identically to before (negative test asserts no DS chrome /
    theme / hifi class leaks onto a no-`library` screen).
  - **Assembler stamping** — `assemble-flow-share.js` propagates `meta.library`
    (or `meta._glossary.library` / `meta.hifi`) down to each screen's `library`
    field before render, never overriding a per-screen authored value.
  - **Capture-as-you-build ledger** — `tests/renderers/__fidelity__/` records
    per-leaf fidelity gates + substrate facts (anatomy + token bindings + known
    gaps) as build provenance for the eventual knowledge backfill.

Known follow-up (non-blocking): tier-wide a11y pass (semantic `role` /
`aria-checked` on checkbox + radio + toggle together; `href` / `aria-selected` /
`:focus-visible` on chrome) — tracked, deliberately not one-off'd here to keep
the leaf idiom uniform.

## [1.104.3] — 2026-06-08

### Fixed
- Flow HTML chrome contract drift — the screen-generator now emits richer,
  Figma-shaped data than the FM renderer consumed, producing broken output
  (surfaced by a `generate-flow` hi-fi test):
  - **Empty sidebar:** `navItems` (an array of `{label,state}`) was passed
    where `sidebar()` expected a numeric count, so the placeholder loop never
    ran and the nav rail rendered empty. It now renders real nav labels with
    the active item highlighted (On-state or `activeNavItem` match), keeping
    the legacy numeric-count shape working.
  - **`[object Object]` page-header button:** `pageHeader.actions` (now
    `[{label,variant}]`) was stringified whole; the renderer now reads
    `.label` (still accepts bare strings).
  - **`background:[object Object]` on frames/rects/ellipses:** Figma-shaped
    fills `[{type,color}]` are normalized to a CSS color string via a new
    `fillToCss` helper in `render-node.js` (string fills unchanged).
- These affect the lo-fi deliverable; the same chrome/fills path also feeds
  the planned DS-native hi-fi render, so the fixes are a prerequisite for it.

## [1.104.1] — 2026-06-08

### Added
- Hi-fi DS render tier grows 9 → 12: `page-header`, `breadcrumbs`, and `tabs`
  chrome leaves (`ds-html-map.js` + `ds-base.css`), 100% token-bound and grounded
  in K1's vendored `domains.tokens` bindings. Breadcrumb separators reuse the P1a
  `renderIcon` mechanism (rotated `chevron-left`).
- `ds-token-bindings.test.js` — binding-conformance gate making `domains.tokens`
  load-bearing for the three new leaves (every binding resolves + is used in CSS).

### Fixed
- `tabs` / `side-nav`: a non-matching `Active` prop now falls back to the first
  item instead of leaving zero items active. Shared `parseItems`/`resolveActive`
  helpers de-duplicate list parsing across the chrome leaves.

## [1.103.0] — 2026-06-06

### Added
- **Hi-fi DS render tier — 6 more components (catalog-browse vertical slice).**
  `tag-default`, `badge`, `search`, `card-for-items` (content) and
  `global-header`, `side-nav` (chrome) — token-bound (`ds-base.css`), grounded by
  measured Figma anatomy (`references/convert-to-hifi/anatomy/catalog-slice.json`).
  Proves the DS-native authoring path end-to-end: a real Studio Data Catalog
  screen composed from real DS components and rendered hi-fi offline.
- **`card-for-items` is DS-native-only** (no FM mapping). The `ds-coverage`
  orphan gate now validates renderer cases against the **authorable dskit
  surface** (~76, dskit minus icon/brand-asset categories) rather than the
  22-slug FM→DS conversion map — so DS-native-only components are legitimate. The
  conversion-coverage check still keys on `fm-to-ds-map.json`.

## [1.102.0] — 2026-06-06

### Added
- **Hi-fi DS HTML render tier (Phase 0: button, input, checkbox-with-label).**
  A second HTML render tier behind the existing INSTANCE seam: when a flow node
  carries `library:"ds"` (emitted by `transform-to-hifi.js`), `render-node.js`
  routes it to `ds-html-map.js`, which renders token-bound markup styled by
  `ds-base.css` (100% `--zen-*`, geometry measured once from the published Figma
  DS Kit). Hi-fi is a **mode of the `flow-share` deliverable** — `ds-base.css` is
  inlined via `FLOW_CSS` (inert for lo-fi) and the offline single-file contract is
  preserved; no new `--type`.
- **Three gates for the new tier:** `token-resolution` now covers ds-base.css +
  ds-html-map.js; new `ds-coverage` test asserts every DS slug reachable via
  FM→DS conversion (`fm-to-ds-map.json`) has a renderer case or is in a shrinking
  allowlist; frozen `golden-snapshot` `ds-*` baselines; plus an end-to-end offline
  assembly test.

  The DS render tier is **shared substrate**, fed by two paths: FM→DS conversion
  (today) and DS-native authoring against the broader authorable dskit (future) —
  it is not capped at the FM map's slugs. Infrastructure release — the user-facing
  `--hifi` wiring, the DS-native authoring feeder, and the remaining components
  follow. See `scripts/renderers/html-renderers/SEAM.md`.

## [1.101.0] — 2026-06-06

### Changed
- **generate-flow is now HTML-first.** The default deliverable is a single
  encapsulated, offline `flows/[feature].html` (two-view Prototype + Overview,
  rendered as `--type flow-share`) — the live preview *is* the deliverable. The
  Figma push is now **opt-in** rather than automatic and last.
- **Gates collapsed to ~3.** The old pre-gen config questions (Step 0.5) are
  folded into Gate 3; **Step 7.5** is a single combined post-build gate offering
  the Figma push **and** the design audit.

### Added
- **`--push` / `--no-push` flags** (`scripts/lib/parse-push.js`). A push is also
  triggered by explicit prose ("push to figma" / "in figma" / "as a figma
  file"), by `--hifi`/`--audit` (which imply a push), or by accepting the Step
  7.5 gate. `--no-push` wins ties. Refine/iterate/branch on an existing Figma
  URL always pushes.
- **`references/generate-flow/push-opt-in.md`** — the push-trigger reference.

### Removed
- **`--share` flag retired.** Its behavior — the shareable, offline two-view
  deliverable — is now the default, so the flag is no longer needed.

## [1.100.0] — 2026-06-05

### Added
- **Shareable flow deliverable (`--share`).** generate-flow can emit a
  self-contained, offline two-view HTML file (Prototype + Overview) for sharing
  with reviewers who don't use Figma
  (`scripts/renderers/assemble-flow-share.js`).

## [1.99.1] — 2026-06-04

### Added
- **Tier B — live-streaming flow preview.** generate-flow now streams the HTML
  preview as screens generate: a chrome-aware shimmer **skeleton at screen-list
  approval**, then each screen **fills in live** as it lands — in the Cowork
  inline panel (file-watch) and the CLI/IDE browser (`--refresh`).
- **New `status: "pending" | "ready"` screen field** (absent = ready;
  backward-compatible).
- **`merge-partials.js --incremental --screen-list`** skeleton-fill mode
  (parallel-mode streaming).
- **`assemble-preview.js` atomic writes** — temp + rename so a reload never
  catches a half-written file. Final render is clean (no `--refresh`).

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
