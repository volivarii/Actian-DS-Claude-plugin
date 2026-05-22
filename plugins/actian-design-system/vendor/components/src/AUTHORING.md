# Authoring per-component guidelines

Each component's guidelines live in a directory under `components/src/<slug>/`,
with **one file per domain**. Every domain is optional — author what exists,
leave the rest.

```
components/src/<slug>/
  _meta.yml      (required)  metadata + the per-domain status matrix
  content.md     (optional)  Content guidelines — UX writing
  usage.md       (optional)  Usage guidelines — when to use, variant selection
  design.md      (optional)  Design guidelines — anatomy, layout, visual rules
  behavior.md    (optional)  Behavior / accessibility / implementation
  tokens.yml     (optional)  Component-specific token bindings
```

The deriver (`scripts/components/derive-guidelines.js`, `npm run derive:guidelines`)
merges every directory into `components/dist/guidelines/<slug>.json`, plus a
`guidelines.bundle.json` roll-up and a `coverage.md` matrix.

## `_meta.yml`

Required. Declares the component name and the status of every domain. The
deriver uses `domains` as the source of truth — it decides which domain files
to expect.

```yaml
component: Button            # human-readable name (required)
category: action             # category slug — joins to category-defaults
section: COMPONENTS          # optional — Figma section
related: [link, icon]        # optional — related component slugs (for 'See also' nav)
examples:                    # optional — canonical references
  - label: "Primary button (default)"
    figmaNode: "302:5142"
  - label: "Button group composition"
    figmaNode: "302:5189"
lastReviewed: 2026-05-15     # optional — date you last reviewed this guidance (YYYY-MM-DD)
domains:
  content:  { status: approved, owner: content-team, updatedAt: 2026-05-10 }
  usage:    { status: draft, owner: design, updatedAt: 2026-05-12 }
  design:   { status: inherited }
  behavior: { status: inherited }
  tokens:   { status: not-started }
```

### Domain status

| status        | meaning                                                        | source file |
|---------------|----------------------------------------------------------------|-------------|
| `approved`    | team-signed-off                                                | must exist  |
| `draft`       | authored, not yet reviewed                                     | must exist  |
| `inherited`   | intentionally not component-specific — consumers resolve the body from this component's category-defaults | must NOT exist |
| `not-started` | declared but empty — a visible documentation-debt marker       | must NOT exist |

A domain omitted from `domains` is omitted from the derived object entirely.
`inherited` is the right answer for most Behavior and Design domains — it means
"the category default is correct here," not "this is missing." It is only valid
where category-defaults actually carry the domain (Behavior → motion + a11y,
Design → anatomy + variant axes); Usage and Tokens have no category-level
default, so they use `not-started` until authored.

### Optional metadata

Three optional fields surface discovery + freshness signals. All are
forward-compatible — absent fields generate no warnings; the convention is to
fill them as you author, not retroactively backfill.

| Field | Type | Purpose |
|---|---|---|
| `related` | list of component slugs | Powers "See also" nav on the docs site + cross-component context in the plugin's component-brief. Each entry must match `^[a-z][a-z0-9-]*$`. |
| `examples` | list of `{ label, figmaNode \| url }` | Canonical references. Plugin's component-brief deep-links to these; docs site renders them as an "Examples" section. Each entry needs a `label` plus at least one of `figmaNode` (Figma node id, `<page>:<id>` form) or `url` (absolute URL). |
| `lastReviewed` | ISO date (YYYY-MM-DD) | When a domain owner last sanity-checked this component's guidance. Surfaced in `coverage.md` as a staleness signal. Bump it when you edit any domain file for the component. |

All three pass through verbatim to the derived
`components/dist/guidelines/<slug>.json` under `meta.*` — no consumer-side
resolution is required.

## Domain markdown files (`content.md`, `usage.md`, `design.md`, `behavior.md`)

Plain markdown. Frontmatter is optional. The deriver keeps the verbatim body
(for LLM consumers) and also parses it into a structured `sections[]`
projection that the docs site and the plugin both consume.

### The three rules

These are the contract — everything below is detail.

1. **What you write is what renders.** Within a section, the docs site
   preserves authored source order. Bullets stay bullets, prose stays prose,
   tables stay tables, and they appear in the order you wrote them. The
   renderer never reorders blocks within a section.
2. **Callouts are opt-in.** Bare paragraphs render as plain prose. To turn a
   paragraph into a Callout, prefix it with `>` (a markdown blockquote). If
   you didn't ask for visual emphasis, you don't get it.
3. **Two reserved table shapes.** A two-column table with the right headers
   becomes a `<DoDont>` or `<TermList>` component. Anything else renders as a
   plain table — including a 2-column table whose headers don't match the
   reserved vocabulary.

### Structural projection

| Markdown you write                                  | Structured shape          | Docs-site render |
|-----------------------------------------------------|---------------------------|------------------|
| `## Heading`                                        | opens a section           | `### Heading`    |
| `### Subheading`                                    | one reserved subsection level | `#### Subheading` |
| `#### …` and deeper                                 | `{ note }` flattened into the current section | `<Callout>` |
| A bullet list                                       | `{ bullets: [...] }`      | one `<ul>` |
| A standalone paragraph                              | `{ prose }`               | bare `<p>` |
| A blockquote (`>` …)                                | `{ note }`                | `<Callout variant="note">` |
| A reserved 2-column table (see below)               | `{ do, dont }` or `{ term, rule }` | `<DoDont>` or `<TermList>` |
| Any other table                                     | `{ table: { headers, rows } }` | plain markdown table |
| A fenced code block                                 | `{ example }`             | `**Example:**` + code |
| `<Media role="parts" layout="grid" />`              | `{ media: { role, layout } }` | `<Media>` component — captured imagery |

### Reserved table vocabularies

A 2-column table classifies as `<DoDont>` if its **headers** (case-insensitive,
whitespace ignored) match one column from each set:

| Do side                                                        | Don't side                                  |
|----------------------------------------------------------------|---------------------------------------------|
| `Do`, `Dos`, `Use`, `Recommended`, `Recommended labels`, `Good` | `Don't`, `Donts`, `Do not`, `Avoid`, `Not recommended`, `Bad` |

A 2-column table classifies as `<TermList>` if its headers match `Term` (or
`Term or term pair`, `Term pair`, `Terms`) on the left and `Usage` (or `Rule`,
`Definition`, `Guidance`) on the right.

Any other table — including 2-column tables outside these vocabularies — keeps
its headers and renders as a plain markdown table. This is deliberate: don't
force a `<DoDont>` on a table that isn't really do/don't.

### Adjacent runs collapse into one component

If you write three rows of `| Do | Don't |` in one table, they render as one
`<DoDont pairs={[…]}>`, not three separate ones. Same for terminology rows
and consecutive bullet items. **Different** shapes adjacent to each other
emit as separate blocks, preserving order — e.g. a `<DoDont>` followed by a
paragraph followed by another `<DoDont>` keeps all three exactly where you
put them.

### Worked example

```markdown
## Stepper labels

When used as part of a stepper, use these labels consistently:

- **Back** for the previous step.
- **Next** for intermediate steps.
- **Submit** for the final step.

> Do not mix **Continue** and **Next**, or **Finish** and **Submit**, within
> the same stepper.

| Recommended labels | Avoid |
|---|---|
| Continue (in a stepper) | Next (outside a stepper) |
| Save                    | Done                     |
```

Renders as (in order):

1. A bare paragraph (`{prose}`).
2. A bulleted list (`{bullets}`, one `<ul>`).
3. A `<Callout variant="note">` (`{note}`, opt-in via the `>` blockquote).
4. A `<DoDont pairs={[…]}>` (the `Recommended labels | Avoid` headers match
   the reserved vocabulary).

### Things to know

- **You don't have to think about the projection.** Write normal markdown.
  The verbatim body is retained for LLM consumers, so the structured view is
  a convenience, not a constraint.
- **Legacy JSON still works.** Older derived JSON may carry bare strings
  (instead of `{bullets}`) or `{note}` for paragraphs (instead of `{prose}`).
  The consumers handle both; the parser only emits the new shapes going
  forward.
- **One reserved nesting level only.** `####` and deeper headings flatten as
  `{ note }` into the current section — if you need real nested structure,
  break the parent into two `##` sections.

### The `<Media>` directive

`<Media />` places CI-captured component imagery at a specific point inside a
domain markdown file. Drop it anywhere inside a section body; the docs renderer
swaps it for the matching image set at build time.

```markdown
<Media role="parts" layout="grid" />
```

**`role` (required)** — identifies which sub-section of the Figma "Design
guidelines" page the imagery comes from. Accepted values:

| Role         | Figma sub-section it maps to                  |
|--------------|-----------------------------------------------|
| `parts`      | Anatomy / parts breakdown                     |
| `variations` | Variant axes and states                       |
| `spacing`    | Spacing and sizing rules                      |
| `behavior`   | Interaction and motion                        |
| `layout`     | Layout and composition                        |

**`layout` (optional)** — controls how multiple images in the same role are
arranged. Accepted values:

| Value    | Arrangement                         |
|----------|-------------------------------------|
| `stack`  | Images stacked vertically           |
| `grid`   | Images in an N-up grid              |
| `inline` | Images placed in the text flow      |

Roles that only ever produce a single image ignore `layout`. When omitted,
the renderer defaults the arrangement to `stack`.

**What to reference, and what not to.** Authors write a `role` — never a file
path. CI owns the image files and keeps them current after every Figma sync;
there are no paths to maintain.

**Auto-append fallback.** If a domain file does not place a `<Media>` tag for
a role that has captured imagery, the docs renderer appends that imagery at
the end of the relevant section automatically. Imagery always surfaces — the
`<Media>` directive is only needed when you want to control placement.

**Captions.** Not currently rendered. Caption support is deferred.

**Example** — positioning anatomy imagery inside `design.md`:

```markdown
## Anatomy

A button is built from a container, an optional icon, and a label.

<Media role="parts" layout="grid" />

The container clips overflow and defines the minimum tap target.
```

The `<Media role="parts" layout="grid" />` line is replaced with the captured
anatomy imagery; the following sentence renders immediately after it.

## Design guidelines — canonical sections

A `design.md` file's `## ` headings should map to one of five canonical section
names. The docs site renders each canonical section as **one merged page
section**, pairing the authored prose with an automatically-added structured
component (parts list, variant table, or motion patterns) and the role-matched
captured imagery. The five canonical headings are:

| Canonical heading  | Accepted aliases (case-insensitive)                          |
|--------------------|--------------------------------------------------------------|
| `Anatomy`          | `anatomy`, `parts`                                           |
| `Variants`         | `variants`, `variations`                                     |
| `Spacing & size`   | `spacing & size`, `spacing`, `spacing and size`, `sizing`    |
| `Behavior`         | `behavior`, `motion`                                         |
| `Layout`           | `layout`                                                     |

A `## ` heading that matches none of the five still renders — as an extra
section appended after the five canonical ones — but also emits a build warning,
so a typo surfaces in CI rather than silently producing a stray section.

### What you write vs. what the docs site adds

**Authors write prose only.** Under each canonical heading, write explanatory
sentences, bullets, callouts, and `<Media>` tags as you normally would. The
structured component for that section — the numbered anatomy diagram, the variant
axis table, the motion-pattern list — is assembled automatically by the docs site
from the derived JSON. Do not hand-write that structure in the markdown.

### Media roles per canonical section

Each canonical section is paired with one media role. Use the matching role when
you want to control image placement with `<Media role="…" />`; omitting the tag
lets the auto-append fallback place the imagery at the end of the section.

| Canonical section  | `<Media>` role  |
|--------------------|-----------------|
| Anatomy            | `parts`         |
| Variants           | `variations`    |
| Spacing & size     | `spacing`       |
| Behavior           | `behavior`      |
| Layout             | `layout`        |

See the `<Media>` directive section above for the full `role` / `layout` API.

For a friendly, example-led walkthrough of writing `design.md` from scratch, see
[`EDITING-GUIDE.md`](./EDITING-GUIDE.md).

## `tokens.yml`

Component-specific token bindings — references into `tokens/tokens.json`, never
embedded values:

```yaml
bindings:
  - { token: button-height-md, context: Minimum height }
  - { token: corner-radius-full, context: Corner rounding }
```

## Slug naming

The `<slug>` of a component directory (`components/src/<slug>/`) becomes the
key of its derived guideline (`components/dist/guidelines/<slug>.json`, and the
`components.guidelineDoc.byKey` collection). Consumers — the docs site and the
plugin — look guidelines up by this slug.

**The slug should match the component's key in the Figma-synced registries**
(`components/dist/registries/dskit.json`). Today they diverge: guideline slugs
were authored independently of the registry keys, so `checkbox` (guideline) has
to be reconciled with `checkbox-with-label` (registry), `text-input` with
`input`, `tag` with `tag-default`, and so on. One divergence is not a naming
choice at all — `toglge` is a misspelling in the registry itself (a Figma
component-name typo carried through the sync); it will only be fixed by
correcting the Figma name and re-syncing.

As an **interim** bridge, `paths-manifest.json` carries a `registryAliases`
block mapping registry key → guideline slug. It is a stopgap, not a pattern to
grow:

- When authoring a **new** component guideline, name the directory after the
  registry key — do not add a new alias.
- Two current guidelines have no registry component at all (`combo-box`,
  `multi-select`) — they cannot be aliased and will not surface in the plugin
  until the components exist in the registry under a matching key.

**Follow-up (open):** converge guideline slugs with registry keys (and fix the
`toglge` typo at the Figma source) so the `registryAliases` block can be
deleted. Until then, every divergence is a line in that block and a row that
needs reconciling. `tests/manifest.test.js` validates that every alias key is a
real registry key and every value is a real guideline slug — a corrected key
that orphans an alias will fail CI rather than silently break lookup.

## Schemas

- `schemas/guideline-meta.json` — `_meta.yml`
- `schemas/guideline-tokens.json` — `tokens.yml`
- `schemas/guideline-component.json` — the derived per-component object

Add a `# yaml-language-server: $schema=...` comment at the top of your YAML
files for editor validation.
