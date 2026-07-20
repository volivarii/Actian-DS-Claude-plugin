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

## [Unreleased]

### Changed
- **The plugin now renders DS components with the renderer vendored from knowledge, and keeps no copy of its own** (renderer-relocation phase 2). Nine files and ~4,900 lines are deleted; every consumer reaches the renderer through the new `scripts/lib/renderer.js` accessor, which is the only file that knows the renderer is vendored. That keeps `no-bare-vendor-paths` satisfied by construction rather than by allowlisting a dozen call sites. There is deliberately **no drift-guard**, because there is deliberately no copy to guard: the accessor requires the vendored modules directly, the same way `scripts/lib/paths.js` requires `vendor/clients/resolve-paths.js`. A guard test enforces the absence instead.
  **This closes the two-renderer divergence.** Tag colours and checkbox state were fixed in knowledge's gallery at phase 1b and stayed broken in the plugin's own `generate-flow` output; they now render correctly here too.
  Three silent-injection traps had to be handled, all the same shape: a vendored module resolves a fact source through a relative `lib/paths` walk that cannot resolve from the vendored layout, inside a `try`/`catch`, so it degrades to empty rather than failing. Icons via `setIcons`; the anatomy loader bound in the accessor so call sites are correct by default rather than by discipline; and `appearance-render`'s independent icon lookup, which had no module-level seam at all (measured: 2 of 51 anatomy-tier components lost their glyph). Each is covered by a mutation-verified test.
  Also fixed, and worth calling out: the golden fixtures encoded the very bug phase 1b fixed. `Selected=Yes` is not a real Figma axis, so `checkboxOn`/`toggleOn`/`radioOn` only ever rendered checked because of the old renderer's buggy branch. Regenerating would have baked an *unchecked* render into a fixture named `checkboxOn`. The fixtures were pointed at the real `Selection` axis instead, after which 5 of 7 goldens matched byte-identically.


### Added
- **The vendor snapshot can now exclude heavy sub-paths declared by the substrate.** ([#252](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/252)) `vendor-snapshot-core.js` reads an optional `vendor-exclude.json` from the knowledge repo root and skips those repo-relative paths when copying, even when their top-level directory is included. The substrate declares `components/render/src` (the 15 MB self-contained render seeds, a capture intermediate) so only the ~1 MB deduplicated render dist reaches the plugin, not the seeds.
- **Generalized the canonical-render capture from Button to the full 35-slug render set.**
  `plugins/actian-design-system/scripts/render/capture-seed.js` gained `captureMatrix(slug)`, a
  registry-driven generalization of the Button-only capture: it builds each slug's variant matrix from
  the registry (via `variantMatrix`, from the slice-1 bootstrap) instead of a hand-picked list, and
  derives its `@dsCard` group from the component's own registry category. `captureButtonMatrix()` is now
  `captureMatrix("button")`. A new `RENDER_SLUGS` constant enumerates the 35 slugs the HTML renderer
  supports, and a `--all <destDir>` CLI mode captures every one of them into a destination directory in
  one pass (skipping and reporting any slug that throws), replacing the single-slug-only bootstrap CLI.
- **Seeded the canonical component render for the knowledge substrate (North Star slice 1).** ([#250](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/250)) A new
  one-time bootstrap, `plugins/actian-design-system/scripts/render/capture-seed.js`, captures the
  plugin's hand-authored Button render as a single self-contained, token-bound `@dsCard` document (the
  full Intent x Emphasis variant matrix plus a disabled state) and writes it to
  `actian-ds-knowledge/components/render/src/button.html`. This is the seed for the substrate-owned
  canonical render library that all consumers (this plugin, the Claude Design bundle, docs) will read
  from; slice 2 replaces the capture with a real derive-from-facts in the knowledge repo. See
  `actian-ds-knowledge/docs/superpowers/plans/2026-07-16-canonical-component-chain-slice1.md`.
- **The HTML renderer now reports its own fidelity, and a CI gate holds the line.** The DS coverage
  report gained a **blank-box count** (the empty grey placeholder boxes a generated flow actually shows
  a reader: **136** today, across 25 of the 37 non-override slugs) and a **renderability verdict** read
  from the anatomy doc itself. `tests/renderers/blank-box-budget.test.js` ratchets that count downward
  and fails on a regression.

  This exists because the tier table was measuring the wrong thing. `quality.ratio` is computed upstream
  as `nodesNormalized / nodesTotal`, which scores whether the **Figma component was drawn with
  auto-layout**. That is a hygiene score, not a fidelity score, and it is wrong in both directions:
  `spinner` scores 0.83 and renders as five grey boxes, while `notification-dropdown` scores 0.50 with an
  empty `degraded[]` list yet has 9 of its 9 instances unresolved. 13 anatomy-tier slugs are not actually
  renderable. **No render behavior changed:** the report now tells the truth, and the anatomy floor is
  retired by attrition as real leaves land, rather than by flipping a gate, which would demote 17 slugs to
  chips before their replacements exist.

### Fixed
- **Adapted to the 2026-07 Figma form-control rework** (knowledge sync #378), which is what has kept
  every vendor-refresh PR red since 2026-07-07. The DS renamed the selection axis on the form
  controls, and the Fat Marker to DS map still targeted the old values:
  - `fmCheckbox`: `Selected=[No,Yes]` became `Selection=[Unchecked,Indeterminate,Checked]`.
  - `fmRadioButton`: `Selected=[No,Yes]` became `Selection=[Unselected,Selected]`; the `Format` axis
    and the `Show Helper text` property were deleted upstream, so both are dropped here (FM's
    `Show Label` no longer has a DS counterpart).
  - `fmToggle` is untouched: its rename is still sitting in unmerged knowledge PR #382.
- **Tag Status "Success" golden re-baselined.** Not an icon problem: the new vendor resolves more
  values to tokens, so the renderer now emits `var(--zen-color-success-25, #f0ffec)` where it used to
  emit the raw `#f0ffec`. That is the values-first pivot working as intended, so the golden was stale.

### Changed
- Two brittle tests now assert data-derived invariants instead of frozen snapshots, per the durable
  lesson from the render-fidelity pivot:
  - The appearance-coverage check asserted `>= 56` slugs, a magic number snapshotted from whatever the
    substrate held that day. It broke at 55 when the Figma rework left `radio-button`'s root without an
    appearance, reporting a "coverage regression" for what may be a correct model of a radio row. It
    now asserts a **ratio** of the anatomy set actually supplied. Per-slug correctness is still checked
    in the loop, which is where a real regression shows up.
  - The end-to-end icon-resolution test hardcoded the slug `misuse-outline`, which the Figma icon
    rework deleted. That test is about the resolution *mechanism*, not about any one glyph, so it now
    picks a slug **from** the vendored icon set.

### Known broken upstream (recorded, not hidden)
- **`calendar` and `search` are RESOLVED — the fix was the namespace, not a Figma rename.** An earlier
  version of this note said the icons were lost and needed renaming upstream. They were not deleted at
  all: the registry was **one flat slug-keyed map**, so the `calendar` GLYPH lost its slug to the
  Calendar COMPONENT and simply vanished (so did `search`, to the Search component). Renaming in Figma
  would only have postponed it — `link`, `table`, `settings` are all words an icon and a component can
  reasonably both want. Knowledge gave icons **their own namespace** (knowledge #418/#420/#421), both
  glyphs are back, and `renderIcon("calendar")` resolves: `input-date` has its calendar affordance
  again. Recorded here because the earlier diagnosis in this file was **wrong**, and a changelog that
  quietly drops a bad call is worse than one that corrects it.

- **Tag Status "Success" renders no icon either, and its golden now records that too.**
  Same defect, same anatomy: the glyph is `checkmark-outline`, which the 2026-07 Figma icon rework
  **deleted**. Verified genuinely gone, not merely shadowed — unlike `calendar` and `search`, which
  were eaten by a slug collision and came **back** once knowledge gave icons their own namespace
  (knowledge #418), **no** component owns `checkmark-outline`, and tag-status’s anatomy instance
  resolves to `slug: undefined`. **The DS ships Tag Status pointing at an icon that does not exist.**

  Same call as "Fail" below: given an icon set without the glyph, an empty box is the correct output,
  so the golden says so rather than asserting a stale expectation. Deliberately NOT papered over with
  a curated icon override, which would mask the defect while pretending to fix it. **When the glyph is
  restored in Figma this golden fails again** — which is the point: re-baseline it with the icon and
  delete the note.

- **Tag Status "Fail" renders no icon, and its golden now records that.** The glyph is
  `misuse-outline`, which the 2026-07 Figma icon rework **deleted**. This is not a renderer bug:
  given an icon set without that glyph, an empty box is the correct output, so the golden says so
  rather than asserting a stale expectation.

  The defect is real and must be fixed, it is just not ours to fix here. **Tag Status ships in the DS
  today pointing at an icon that does not exist.** `misuse-outline` is one of six glyphs the rework
  dropped that are **not** on the design team's own "REMOVED" note, so they look like collateral:
  `expand`, `maximize`, `minimize`, `misuse-outline`, `tools`, `view-table`.

  Deliberately NOT worked around with a curated icon override: that would be a new file to maintain
  that shadows Figma, and it would mask the defect while pretending to fix it. The signal lives
  upstream where the fix lives (knowledge now detects and names ghost components, and every sync PR
  lists them), and the fixture carries a comment naming the glyph. When it is restored in Figma this
  golden fails, which is the point: re-baseline it with the icon and delete the note.

## [2026.7.23] - 2026-07-06

### Fixed
- tag-default washout: per-variant colors now render from the appearance layer with a value fallback, replacing the retired path-b token-injection that emitted unresolved bare `var(--token)`.

### Removed
- Retired the path-b token-injection chain (resolveRootTokenStyle et al.) and the vendored harvest token-bindings sidecars; tag-default now renders via the unified appearance path (bespoke pill kept, colors re-sourced).

## [2026.7.22] - 2026-07-06

### Added
- **Layout spacing tokens theme too (P2 consumer, layout half).** When the
  vendored anatomy carries a `layout.gapToken` / `layout.paddingTokens` (knowledge
  #357), `flexStyle` now emits `gap:var(--zen-spacing-xs, 8px)` and per-side
  `padding:var(--zen-spacing-sm, 8px) …` instead of the bare value — the value
  stays the fallback, the name themes. Uses the same `tokenized` helper as the
  color emit (now exported from `appearance-style.js`), so a bare token name is
  never emitted into a CSS value. Total-tolerant: no layout token → value-only,
  byte-identical to before (goldens/real-data green), so it's a no-op until the
  knowledge variable-id export is populated. Completes the P2 name-layer consumer
  surface: appearance colors (2026.7.20) + layout spacing now both theme.

## [2026.7.20] - 2026-07-06

### Added
- **Token names ride the appearance render (P2 consumer half).** When the
  vendored anatomy carries the published `--zen-*` custom property a color slot
  is bound to (knowledge P2, its #356), the appearance renderer now emits
  `var(<token>, <value>)` at its single emit point (`appearance-style.js`)
  instead of the bare value: the value stays the fallback (fidelity, no washout
  if a name is unpublished downstream), the name enables theming. Covers
  `background`, `border` color, and `text` color, plus resolved icon-glyph
  color, per variant (the top-level `backgroundToken` now flows through
  `resolveNodeAppearance` alongside the nested `border`/`text` tokens).
  Total-tolerant: a slot with no token, a null token, or an unsafe token name
  degrades to value-only (byte-identical to the previous values-only emit), so
  with today's token-less vendored data rendering is unchanged — the var()
  wrapping switches on automatically once the knowledge-side variable-id export
  is populated and a real sync carries the names. Corner-radius token binding
  is not emitted (deferred upstream until the REST bind shape is verified). The
  runtime emit gate now enforces two invariants on real rendered output: every
  emitted `var()` carries a value fallback (no bare `var(--name)` washout), and
  every emitted `--zen-*` name resolves in the vendored `tokens.css`.

## [2026.7.18] - 2026-07-06

### Fixed
- **Ref-collision in the registry key maps is now deterministic.** Two
  registry slugs can derive the same camelCase ref (`chip` and `fm-chip`
  both become `fmChip` because ref derivation strips the kit prefix), and
  the winner used to be whichever entry the registry emitted last. The
  knowledge sync's move to canonically sorted keys (its #355) flipped that
  order and silently re-pointed `fmChip` from the single chip component to
  the `fm-chip` set, breaking Figma push for FM chips on the vendor PR.
  Collision resolution is now order-independent: a plain slug beats a
  prefix-stripped one, then sorted-first wins; applies to both the key maps
  and the ref→slug maps.
- **Nightly vendor refreshes self-heal the authoring table.** The
  vendor-snapshot workflow now regenerates the
  `ds-components-authoring.md` vocabulary table (introduced with its drift
  gate in 2026.7.17) inside the same auto-merge PR, so a knowledge-side
  component or variant-axis rename can no longer leave the nightly vendor PR
  stuck red waiting for a manual regen. Same self-healing class as the
  doc-counts guard.

## [2026.7.17] - 2026-07-05

### Added
- **Per-variant icon glyphs (consumer half).** The appearance renderer now
  honors the `slug` field on anatomy variant deltas (knowledge #354): when a
  variant swaps the component an instance references (a per-status tag icon),
  the matching delta's slug wins over the node's base slug, so a Success tag
  renders its own check glyph instead of Fail's x-circle. Total-tolerant in
  either landing order: without slug deltas in the vendored data, rendering is
  byte-identical to today; a swapped slug missing from the icon set renders
  the neutral placeholder, never the wrong glyph. Closes the F2 known
  limitation once the knowledge capture lands and vendors.

### Fixed
- **`ds-components-authoring.md` vocabulary table regenerated and gated.** The
  hand-maintained table had drifted badly (16 built slugs still marked as chip
  fallbacks, the retired `input` slug listed as the text field, `text-input`
  missing, stale variant axes), mis-steering hi-fi screen generation. The
  table is now generated from the vendored registry + `BUILT_SLUGS`
  (`node scripts/renderers/render-authoring-table.js`, statuses:
  BUILT / appearance / chip per the real render tiers, verbatim registry axis
  names), a sync gate test fails on any future drift, and the text-field
  authoring section moved to `text-input` with an explicit
  never-author-`input` note.

## [2026.7.16] - 2026-07-05

### Fixed
- **Body text no longer renders blue in the ds-base fallback styles.** 36
  remaining pre-rename `var(--zen-color-text-primary)` call sites in
  `ds-base.css` were written when text-primary meant black body text; since the
  token's meaning flipped to interactive blue (`#0f5fdc`), those sites rendered
  blue, mostly masked by the 1B inline appearance values. Each site was
  verified against the captured appearance values in the vendored anatomy docs
  (the resolved Figma colors): 33 body-text sites (labels, titles, table text,
  banner messages, stepper titles including the active state, selected
  interactive tag, active segment, calendar text) now bind
  `--zen-color-text-default` (black), the input field description binds
  `--zen-color-text-tertiary` (its exact captured value `#50505d`), and the
  tooltip bubble background binds `--zen-color-bg-reverse` instead of a text
  token. The five genuinely interactive sites (secondary button label, avatar
  initials, breadcrumb link, active tab, steward source link) keep
  `text-primary`. Completes the migration started in 2026.7.15 / PR #226.

## [2026.7.15] - 2026-07-05

### Changed
- **Migrated off the retired `--zen-color-text-link-*` tokens.** Knowledge #341
  deletes the text-link family; `--zen-color-text-primary` is now the
  interactive-text token (same resolved value, `#0f5fdc`). The five
  `var(--zen-color-text-link-default)` call sites in `ds-base.css` (secondary
  button, selected item, breadcrumb link, active tab, steward source link) and
  the brief renderer's token-pill color now use
  `var(--zen-color-text-primary)`; the contrast-lint pair and token-pill test
  follow. In the three binding-gated chrome sections (page-header, breadcrumbs,
  tabs), body text moved from the pre-rename `text-primary` to `text-default`
  (black, matching the Figma measurement), and the binding-conformance gate
  accepts old and new names during the vendor transition. Remaining body-text
  `text-primary` call sites in other sections migrate in a follow-up.

## [2026.7.13] - 2026-07-05

### Added
- **Real icon glyphs in generated flows/previews (F2).** The appearance renderer
  resolves anatomy icon instances against the vendored 142-icon set, so DS component
  icons render their real SVG glyph instead of a neutral placeholder box. Slug-only,
  default-variant glyph until per-variant capture lands upstream. (#224)

### Removed
- **Legacy slug-to-prerendered-HTML anatomy fallback.** Retired (Group C); the
  appearance-doc renderer with graceful chip fallback is now the only
  anatomy-derived render path. The tag-default token-injection path is unchanged.
  (#224)

## [2026.7.12] - 2026-07-04

### Added
- **Unified appearance renderer (Phase 1B).** DS components that fall through the
  instance render seam now draw their fill, border, radius, and text from Figma's
  captured resolved appearance (values-only), so generated components render their
  real colors instead of washing out. Renders per-instance so a component's variant
  selects the right colors. Includes a values-only emit gate, a CSS-coverage guard,
  non-default-variant real-data coverage, and the fidelity harness wired to render
  appearance slugs. ([#223](https://github.com/volivarii/Actian-DS-Claude-plugin/pull/223))

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
