# Studio chrome + Steward — Figma anatomy (authoring oracle)

Source of truth: **Figma** "Actian Design System v2.0.0" (`l8biHxfarNi1I2RMvVxVOK`), the Studio mockup
(`14797:9152` → `Studio dashboard` frames). Captured via `get_design_context` on the real DS-Kit
component instances. The production screenshots lag this — **Figma wins on any conflict.** Authoring
rule: realize this intent as clean, semantic, **responsive**, token-bound BEM; map Figma var names
to our vendored `--zen-*` names (table at the bottom).

## Screen geometry (Studio dashboard, 1440×960)
- **Global header**: `1440 × 64` (top, full width).
- **Side nav**: `240 × ~896` (left, below header; full height).
- **Page header**: starts at `x=264` (240 sidebar + 24 gap), height ~60–108.
- **Content area**: `x=264`, below the page header.
- **Steward "Drawer, side panel"** instance = `550 × 897` → the docked width is **550px**; overlay ~**420px**.

## Global header (node 14797:9220) — exact intent
Container: `display:flex; align-items:center; justify-content:space-between; padding:0 24px;`
`background: --zen-color-bg-default (white); border-bottom:1px solid --zen-border-default (#dadada);` height 64.

- **Left — logo** (~121×32): the zeenea **studio** logo (blue mark + "zeenea studio" wordmark). (We keep our existing logo treatment / `ds-header__logo`.)
- **Center — context + search** (absolutely centered, gap 16px):
  - **Context dropdown** (~128px): a stacked label — micro "Catalog" (top, `--zen-font-size-xs` 11px) + value "Default" in **`--zen-color-primary-500`** (studio azure `#0283be`), medium weight — with an `arrow-down` (chevron). 
  - **Search** (568px): a left scope dropdown ("Default ▾", 128px) + a search input (440px) with a magnifier (`search`/`SVG_SEARCH`) + placeholder "Search items" in `--zen-color-text-secondary` (#636363). Border `--zen-border-default`, radius `--zen-border-radius-sm` (6px). + a trailing tooltip `info` icon (16px).
- **Right — action cluster** (gap 8px, vertical dividers between): **"What's new"** (text label) · divider · **notification** bell (32px round button, 20px icon) · divider · **app switcher** grid (32px round, 20px icon) · divider · **avatar** (32px round, `background:--zen-color-turquoise-50 (#d0efed)`, initials).
  - **There is NO dedicated AI/sparkle trigger in the Figma header.** Do not invent one — the Steward is shown in its open state for the demo; its trigger is out of scope here.

Tokens: bg `--zen-color-bg-default`; border `--zen-border-default`; text `--zen-color-text-default` / `--zen-color-text-secondary`; primary `--zen-color-primary-500`; avatar `--zen-color-turquoise-50`; spacing 8/16; radius-full / radius-sm; font md(14)/xs(11), weight regular(400)/medium(500), lineheight md(20)/xs(14).
Icons needed: `search` (have, `SVG_SEARCH`), bell/notification (**hardcode `SVG_BELL` inline**), apps-grid (**hardcode `SVG_APPS` inline**), `stars`/`ai` for What's-new optional. Precedent for inline SVG: the existing `SVG_SEARCH`.

## Side nav (node 14797:9221) — exact intent
Container: `display:flex; flex-direction:column; justify-content:space-between; padding:16px; width:240px;`
`background:--zen-color-bg-default; border-right:1px solid --zen-border-default;`

- **Top group** (gap 4px): nav items, each `height:32px; display:flex; align-items:center; gap:8px; padding:4px 8px;` = `icon(16px) + label(14px, --zen-color-text-default)`:
  - **Dashboard** (`dashboard`), **Catalog** (`directory`), **Topics** (`more`* ), then a **divider** (`--zen-border-default`, 1px, 4px vertical pad), then **Import** (`download`) with a trailing **chevron-up** expand toggle (24px round) and indented sub-items (`padding-left:32px`, no icon): "Select a connection", "Select a file"; then **New item** (`add`).
- **Bottom group** (justify-between pushes it down): **Access request** (`user-single`* ), **Catalog design** (`edit`* ), **Analytics** (`dashboard`* ), a **divider**, then a **collapse** button (24px round, `chevron-left`) bottom-right.
- **Active item**: marked with `--zen-color-primary-500` (text + icon) — our `resolveActive` drives `is-active`.

`*` icon fallback: Figma uses `book-bookmark` / `data-access-request` / `catalog-design` / `analytics`
which are NOT in our curated 37-glyph set — fall back to the nearest vendored glyph (noted above);
adding the exact glyphs to the curated K2 set is a follow-up.

## Steward (node 16269:15466 + Drawer 550×897 + the 4 product screenshots)
A panel (overlay ~420px / drawer 550px full-height). Already partly built (v1.106.0). The re-model adds:
- **Header**: sparkle (`ai`) + **"Data Steward"** title · **"New chat ▾"** · controls **settings** (`settings`), **expand** (hardcode `SVG_EXPAND` diagonal-arrows), **close** (`close`).
- **States**: **Welcome** (greeting "Welcome Vincent! I'm your Data Steward Agent. I can help you explore your catalog, generate and improve descriptions, query items by ownership or properties, and update metadata…") · **Generating** (shimmer, have) · **Answered** (insight + source + confidence + actions, have).
- **Footer — task input**: "Give Steward a task" input + a **context chip** ("Looking at: <type> <name>", e.g. Dataset /why_not/table) + a **Plan** button (primary).
- **Sizes**: Default (overlay ~420px) / **Drawer** (`ds-steward--drawer`, full-height ~550px).

## Figma → vendored token name map (the implementer applies this)
| Figma var | our vendored var |
|---|---|
| `--color-bg-default` / `--background/color-background-default` | `--zen-color-bg-default` |
| `--border-default` | `--zen-border-default` |
| `--color-text-default` | `--zen-color-text-primary` (black text) |
| `--color-text-secondary` | `--zen-color-text-secondary` |
| `--primary/500` | `--zen-color-primary-500` (themed; studio azure #0283be) |
| `--turquoise/50` | `--zen-color-turquoise-50` (#d0efed) — if absent, use `--zen-color-bg-selected` |
| `--spacing/spacing-{2xs,xs,md,xl}` | `--zen-spacing-{2xs,xs,md,…}` (4/8/16/32) |
| `--border-radius-{sm,full}` | `--zen-border-radius-{sm,full}` |
| `--font-size-{md,xs}` · `--font-weight-{regular,medium}` · `--font-lineheight-{md,xs}` · `--font-letterspacing-2` | same `--zen-font-*` names |

Verify each maps to a real vendored token before use (token coverage gate); fall back to the nearest
real token + a one-line documented note if a Figma var has no vendored equivalent.
