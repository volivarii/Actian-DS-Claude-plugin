# DS Companion — Always-Loaded Context

Read this on every companion activation. For detailed info, read the full reference file listed in each section.

## Spacing Scale (only valid values)

| Token | Value | Use |
|-------|-------|-----|
| spacing-3xs | 4px | Icon gaps, tight internal padding |
| spacing-2xs | 8px | Related elements, compact groups |
| spacing-xs | 12px | Form field gaps |
| spacing-sm | 16px | Default content gap |
| spacing-md | 24px | Section padding |
| spacing-lg | 28px | Major group gap |
| spacing-xl | 32px | Page-level sections |

## Border Radius

| Token | Value |
|-------|-------|
| radius-xs | 2px |
| radius-sm | 4px |
| radius-md | 6px |
| radius-lg | 8px |
| radius-xl | 12px |
| radius-2xl | 16px |
| radius-round | 9999px |

## Border Width

| Token | Value |
|-------|-------|
| width-sm | 1px |
| width-md | 1.5px |
| width-lg | 2px |

## Key Color Tokens (Actian theme)

| Token | Hex | Use |
|-------|-----|-----|
| theme-primary | #0550DC | Primary actions, links, selected states |
| text-primary | #000000 | Body text, headings |
| text-secondary | #3F3F4A | Secondary labels |
| text-tertiary | #595968 | Captions, hints |
| text-error | #C12C11 | Error text |
| text-success | #047800 | Success text |
| background-bg-default | #FFFFFF | Page background |
| background-bg-grey-1 | #FBFBFF | Subtle background |
| background-bg-grey-2 | #F5F5FA | Content area background |
| border-default | #F5F5FA | Standard borders |
| border-strong | #DDDDE5 | Emphasized borders |
| status-success | #047800 | Success indicators |
| status-error | #C12C11 | Error indicators |
| status-warning | #D27B00 | Warning indicators |

**Theme overrides:** Studio `theme-primary` = `#0283BE`. Explorer `theme-primary` = `#049B98`. Most text/border tokens also differ — always use token names, never hardcode hex.

Full reference: `vendor/tokens/token-reference.md` | Source of truth: `vendor/tokens/tokens.json`

## FM Outputs (lo-fi wireframes)

FM outputs use `--fm-*` CSS variables, **NOT** `--zen-*` DS tokens. This is intentional — the "never hardcode" rule applies to DS Kit outputs only. FM palette is deliberately constrained.

See: `references/ds-rules/fm-css-reference.md`

## Content Rules

| Rule | Do | Don't |
|------|----|----- |
| Case | Sentence case for all UI text | Title Case, ALL CAPS |
| Buttons | Action verbs: "Save changes", "Create connection" | "OK", "Submit", "Yes" |
| Jargon | Write for user's mental model | Technical terms in UI copy |
| Errors | Say what happened + what to do | "An error occurred" |
| Empty states | Explain why empty + CTA for next step | Blank screen or "No data" |
| Truncation | Ellipsis (...), never mid-word | Cut text arbitrarily |
| Dates | Relative if recent ("2h ago"), absolute if older ("Jan 15, 2026") | Unix timestamps, ISO dates |
| Lists | Oxford comma, parallel structure | Mixed structures |
| Tone | Professional, clear, helpful | Cute, clever, apologetic |

Full guidelines: `vendor/content/content.md`

## Actian Apps

| App | Purpose | Users | Theme |
|-----|---------|-------|-------|
| **Studio** | Data integration, catalog, quality, lineage | Data engineers, stewards | Studio |
| **Explorer** | Data discovery, search, browse, access requests | Data consumers, analysts | Explorer |
| **Administration** | Users, connections, scanners, groups, settings | Admins | Actian |

## Key Terminology

| Term | Meaning |
|------|---------|
| Connection | External data source (Snowflake, Azure, PostgreSQL) |
| Scanner | Agent that inventories a connection's objects |
| Dataset | Table, view, or file discovered by a scanner |
| Field | Column within a dataset |
| Glossary term | Business definition attached to datasets/fields |
| Data product | Curated, governed dataset published for consumption |

Full context: `references/context/app-context.md`

## Component Inventory

| Library | Count | Font | Use |
|---------|-------|------|-----|
| DS Kit | 107 sets | Roboto | Full design system, all tokens, 3 themes |
| FM Kit | 44 components | Inter | Lo-fi wireframes, FM palette |
| Meta Kit | 25 components + 3 templates | Inter | Generation output, annotation markers |

Before building custom frames, check: `vendor/components/dist/dskit-components.md`, `vendor/components/dist/fm-components.md`, `vendor/components/src/guidelines/{name}.json`

**Common FM wireframe components:** fmButton, fmTextInput, fmDropdown, fmSearchInput, fmTableCell, fmCheckbox, fmRadioButton, fmToggle, fmAlert, fmBanner, fmDialog, fmEmptyState, fmPlaceholder, fmTab, fmStepper, fmBadge, fmTag, fmToast, fmPageHeader, fmAppHeader, fmNavItem

## Interactive Gates

`/generate-flow`, `/design-audit`, and `/convert-to-hifi` use interactive gates to surface options to designers without removing the `--flag` API. Companion appends `--no-prompt` when ALL relevant flags are extracted from prose; otherwise lets the downstream skill gate the designer. Convention: `references/ds-rules/interactive-gates.md`.

## Figma Output

All skills push to Figma using direct `use_figma` calls. No codegen scripts at push time.

| Skill | Push patterns reference | Data model |
|-------|----------------------|------------|
| component-brief | `references/component-brief/push-patterns.md` | brief-data.json |
| generate-flow | `references/figma/figma-push-patterns.md` | flow-data.json |
| generate-presentation | `references/figma/figma-push-patterns.md` | slide-data.json |
| create-component | `references/create-component/push-patterns.md` | component-spec.json |

## On-Demand References

| Topic | File |
|-------|------|
| Specific component rules | `vendor/components/src/guidelines/{name}.json` |
| Accessibility standards | `vendor/accessibility/accessibility.md` |
| Foundation (typography, color, etc.) | `vendor/foundations/{topic}.json` |
| FM CSS values (wireframes) | `references/ds-rules/fm-css-reference.md` |
| UX patterns by flow type | `references/context/ux-patterns.md` |
| Page layout patterns | `references/ds-rules/layout-patterns.md` |
| Token variable keys (Figma binding) | runtime via `figma.variables.getLocalVariableCollectionsAsync()` — see `references/figma/figma-output.md` § "Variable binding by name" |
| Quality tiers (Draft/Standard/Production) | `references/ds-rules/quality-tiers.md` |
