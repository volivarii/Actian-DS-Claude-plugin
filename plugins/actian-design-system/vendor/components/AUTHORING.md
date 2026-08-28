# Components — Authoring guide

> Audience: Actian DS designers maintaining the DS Kit Figma file.
> A separate authoring guide for per-component-guideline JSONs lives at
> `components/src/guidelines/AUTHORING.md` (pre-existing, unrelated to
> this file).

## Component categories + status (page-section convention)

The DS Kit Figma file groups component pages under category headers in
the Pages panel using a naming convention. Sync reads this convention into:

- `components/dist/registries/dskit.json` — per-component `category` and
  `status` fields
- `components/dist/categories.json` — derived category → member map

Both are consumed by the plugin, future docs site, and other federation
consumers.

### Conventions (sync depends on these — please don't break them)

**Top-level markers** — pages named `<emoji> <ALL CAPS>` (e.g.,
`🧱 COMPONENTS`, `💎 FOUNDATIONS`, `🎨 BRAND ASSETS`). Sync uses
`name.includes('COMPONENTS')` to gate which pages count as components.

**Category headers**: Title Case, no leading whitespace, no emoji.
Current headers:

- Action
- Form (input & selection)
- Navigation
- Data Display
- Feedback
- Overlays

**Member pages**: 5-space leading whitespace, plain name, no emoji.

The indent is load-bearing twice over. It is the publish gate, and it is now
the only difference between a member page and a category header. A member
page that loses its 5 spaces silently becomes a new category and captures
every member page below it, so keep the indent when renaming.

A component whose frames sit directly on a category-header page, with no
dedicated member page of its own, is excluded from the sync and surfaced
as a warning in the sync PR changelog. The member-page convention is the
publish gate: a component is published by giving it its own member page
under the right category header.

**Separators** — pages named with only `-` characters (`---`, `----`).

### Status emojis (DS Kit vocabulary)

Status is authored **on the component**, as a leading emoji on the component
or component-set name (`✍️ Badge`, `⛔️ Popover`). Sync strips the emoji from
the shipped `name` and writes the meaning into `status`. Pages carry no
status: one component, one status, set where the component lives.

| Emoji | Meaning | Sync `status` value |
|---|---|---|
| ✅ | Curated / healthy | field omitted (implicit) |
| ✍️ | In progress | `"in-progress"` |
| ⛔️ | Deprecated | `"deprecated"` |
| ⚠️ | Needs attention | `"warn"` |

Only these four are read, and the sync **fails** on any other emoji in a
component name rather than shipping it. A component called `🟢 Modal` stops
that night's sync with an error and produces no PR, because `name` is the
display name the docs site and the plugin render and `✍️ Badge` reached both
for weeks before anyone noticed. Use one of the four above, or no emoji at
all. If a new status is genuinely needed, add it to `COMPONENT_STATUS_MAP` in
`scripts/transformers/component-status-emoji.js` in the same change.

The colour-vs-monochrome form of the same emoji does not matter (`⚠` and
`⚠️` both read as `warn`), and the space after it is optional.

A variant-property value is not a status: a `Dev status` axis is a variant
axis like any other, never reaches the `status` field, and adds a dimension
to the component's variant matrix. Status belongs on the component name.

**Divergence from foundations:** the foundations status-emoji parser at
`scripts/foundations/foundations-parser/status-emoji.js` uses
`🚧 → "in-progress"`, `❌ → "deprecated"`, `⚠️ → "proposed"`. The two
domains use different emoji vocabulary; this is intentional. Component
pages use `✍️ / ⛔️ / ⚠️` per the DS Kit's existing convention.

### Multi-component pages

A page can host multiple components. All components on a page inherit the
page's `category` and `group`; sync keys that lookup by page clean-name, not
by component name. `status` does not come from the page, so components
sharing a page can each carry their own.

### Adding a new category

1. Add the page inside `🧱 COMPONENTS` in the correct position
   (Title Case, no emoji, no leading whitespace).
2. Add the new name to `KNOWN_CATEGORIES` in
   `scripts/transformers/transform-categories.js` in the same PR as
   the Figma change. Bump knowledge-repo version.
3. Move member pages under it.

### Renaming a category

Sync detects renames as drift and warns (warn-only initially). Update
`KNOWN_CATEGORIES` in the same PR as the Figma rename.

### Icon pages and self-hosting / churned pages (page-level overrides)

Some pages do not encode their category via the positional convention: the
icons live on a self-hosting page whose name has churned (`Icons` ->
`DS Icons` -> `DS Icons: replacement`), and a WIP page can be pulled above its
category header. These are handled by
`components/src/category-page-overrides.json`:

- `overrides`: page clean-name (status emoji stripped) -> canonical category.
  Example: `"DS Icons": "Icons"`. Applied first in `inferCategoryMap`, so it
  wins regardless of the page's section or order.
- `exclude`: page clean-names whose components are dropped from the sync
  entirely (staging / not-ready). Example: `"DS Icons: replacement"`.

When you rename an icon (or other overridden) page in Figma, update the matching
key here in the same change. The config is self-retiring: once Figma encodes the
category natively, delete the entry and a re-sync restores it.

### Mass category-loss is a hard sync failure

If a category with 10 or more members drops to zero between syncs (typically a
page rename that the override config does not yet cover), the sync fails loud
(exit 2, no PR) rather than shipping a category-gutted registry or an empty
`icons.json`. Fix the page category or add the page to
`category-page-overrides.json` and re-run. An intentional category removal is
acknowledged with the `SYNC_ALLOW_CATEGORY_LOSS` env var (comma-separated
category names). That env var only clears the registry-root guard; the
`deriveIcons` icon tripwire has no env hatch, so an intentional removal of the
`Icons` category also requires emptying `components/src/icons-svg.json` (which
drops the icon skip-count to zero, so the tripwire passes).

### Why this isn't Figma's native Page Sections feature

Figma's native Pages-panel section dividers are an Enterprise-tier
feature, unavailable on the team's current plan. The naming convention
above is the workaround. If the team upgrades, this convention can be
replaced with native SECTION_DIVIDER node parsing.

### Detecting drift

The sync changelog (committed by the `sync-from-figma` workflow on each
nightly run) includes a `Component category drift` subsection when any
of the following are detected:

- `UNKNOWN_CATEGORY`: a header was found that isn't in `KNOWN_CATEGORIES`
- `MISSING_KNOWN_CATEGORY`: a header in `KNOWN_CATEGORIES` was not found
- `MEMBER_WITHOUT_CATEGORY`: a member page appeared with no preceding
  header

These are **warn-only** as of v0.3.4. A future iteration may elevate
`UNKNOWN_CATEGORY` to a `breaking` verdict that gates sync PRs.
