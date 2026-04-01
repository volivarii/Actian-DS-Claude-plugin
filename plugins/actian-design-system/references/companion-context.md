# DS Companion — Always-Loaded Context

Read this file on every companion activation. It provides the DS knowledge needed for most interactions. For detailed information, read the full reference files listed in each section.

## Token Quick Reference

**Spacing scale (only valid values):** 4, 8, 12, 16, 24, 28, 32px
**Border radius:** radius-xs (2px), radius-sm (4px), radius-md (6px), radius-lg (8px), radius-xl (12px), radius-2xl (16px), radius-round (9999px)
**Border width:** width-sm (1px), width-md (1.5px), width-lg (2px)

**Key color tokens (Actian theme):**
- `theme-primary`: #0550DC — primary actions, links, selected states
- `text-primary`: #000000 — body text, headings
- `text-secondary`: #3F3F4A — secondary labels
- `text-tertiary`: #595968 — captions, hints
- `text-error`: #C12C11 — error text
- `text-success`: #047800 — success text
- `background-bg-default`: #FFFFFF — page background
- `background-bg-grey-1`: #FBFBFF — subtle background
- `background-bg-grey-2`: #F5F5FA — content area background
- `border-default`: #F5F5FA — standard borders
- `border-strong`: #DDDDE5 — emphasized borders
- `status-success`: #047800 — success indicators
- `status-error`: #C12C11 — error indicators
- `status-warning`: #D27B00 — warning indicators

**Theme differences:** Studio uses teal (`#0283BE`), Explorer uses green-teal (`#049B98`). Most text/border tokens differ across themes — always use token names, never hardcode hex.

**FM palette (lo-fi wireframes):** uses `--fm-*` CSS variables, NOT DS tokens. See `references/fm-css-reference.md`.

Full token reference: `docs/token-reference.md`
Token JSON (source of truth): `tokens/actian-ds.tokens.json`

## Content Guidelines Summary

- **Sentence case** for all UI text (headings, buttons, labels, tooltips)
- **Action verbs** for buttons: "Save changes" not "OK", "Create connection" not "Submit"
- **No jargon** in user-facing text — write for the user's mental model
- **Error messages:** say what happened + what to do. "Connection failed. Check your credentials and try again."
- **Empty states:** explain why empty + what to do next. Always include a CTA.
- **Truncation:** use ellipsis (...) for overflow, never cut mid-word
- **Dates:** relative for recent ("2 hours ago"), absolute for older ("Jan 15, 2026")
- **Lists:** Oxford comma, parallel structure
- **Tone:** professional, clear, helpful — not cute, clever, or apologetic

Full guidelines: `docs/content-guidelines.md`

## Actian Apps

Three apps, one platform:

| App | Purpose | Users | Theme |
|-----|---------|-------|-------|
| **Studio** | Data integration, catalog, quality, lineage | Data engineers, stewards | Studio theme |
| **Explorer** | Data discovery, search, browse, access requests | Data consumers, analysts | Explorer theme |
| **Administration** | Users, connections, scanners, groups, settings | Admins | Actian theme |

**Key terminology:**
- Connection = external data source (Snowflake, Azure, PostgreSQL)
- Scanner = agent that inventories a connection's objects
- Dataset = table, view, or file discovered by a scanner
- Field = column within a dataset
- Glossary term = business definition attached to datasets/fields
- Data product = curated, governed dataset published for consumption

Full context: `references/app-context.md`

## Component Inventory

**DS Kit:** 103 component sets (full design system, all tokens, 3 themes)
**FM Kit:** 40 components (lo-fi wireframes, Inter font, FM palette)
**Meta Kit:** Templates, generation log, cover cards, annotation markers

Before building custom frames, check if a component exists:
- DS Kit components: `docs/dskit-components.md`
- FM Kit components: `docs/fm-components.md`
- Per-component guidelines (44): `docs/component-guidelines/{name}.json`

**Common FM components for wireframes:**
fmButton, fmTextInput, fmDropdown, fmSearchInput, fmTableCell, fmCheckbox, fmRadioButton, fmToggle, fmAlert, fmBanner, fmDialog, fmEmptyState, fmPlaceholder, fmTab, fmStepper, fmBadge, fmTag, fmToast, fmPageHeader, fmAppHeader, fmSideNavItem

## Figma Output

All Figma writing uses `figma-codegen.js` (shared code generation library). Per-skill scripts:
- `flow-to-figma.js` — flows with templates (admin/studio/explorer/bare/mobile/etc.)
- `brief-to-figma.js` — component briefs (9 cards)
- `slide-to-figma.js` — presentations with variable bindings
- `figma-codegen.js` directly — component creation

## On-Demand References

Load these only when the specific topic requires them:

| Topic | File |
|-------|------|
| Specific component rules | `docs/component-guidelines/{name}.json` |
| Accessibility standards | `docs/accessibility-guidelines.md` |
| Foundation (typography, color, etc.) | `docs/foundations/{topic}.json` |
| FM CSS values (wireframes) | `references/fm-css-reference.md` |
| UX patterns by flow type | `references/ux-patterns.md` |
| Token variable keys (Figma binding) | `docs/meta-kit/variables.md` |
| Flow templates + content nodes | `references/generate-flow/figma-spec-builder.md` |
