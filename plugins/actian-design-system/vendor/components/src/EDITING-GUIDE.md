# Editor guide — writing component design guidelines

This is a short, practical guide for designers and editors who want to write the
design guidelines that appear on a component's Overview page in the docs site.
No engineering background required.

## What this is

Each component can have a `design.md` file that holds your guidance — prose
about how the component is built, how it behaves, and how it should be used
visually. The docs site combines that prose with automatically-generated diagrams
and imagery to produce the component's "Design guidelines" section.

You write words. The site builds the pictures.

## Where the file lives

```
components/src/<component-name>/design.md
```

For example, the Button component's file is at `components/src/button/design.md`.
If the file doesn't exist yet, create it — plain text, no special tooling needed.

## The five sections

Use these five `## ` headings — in whatever order suits your content. Only
include the ones you have guidance for; it's fine to leave out sections you
haven't written yet.

```markdown
## Anatomy
## Variants
## Spacing & size
## Behavior
## Layout
```

The docs site recognises common spelling variants too (e.g. `## Variations`
maps to Variants, `## Motion` maps to Behavior), but sticking to the canonical
headings above is safest. The complete list of accepted heading spellings is in
[`AUTHORING.md`](./AUTHORING.md).

If you use a heading the site doesn't recognise (a typo, say), it still appears —
after the five sections — and logs a build warning, so typos get caught.

## Write prose, not structure

Under each heading, write plain guidance sentences. The structured elements —
the numbered anatomy diagram, the variant axis table, the motion-pattern list —
are added by the docs site automatically. You don't need to build or maintain
those; just write the guidance that gives them context.

```markdown
## Anatomy

A button is built from a container, an optional leading icon, and a label.
The container clips overflow and defines the minimum tap target.
The label is always present — icon-only buttons must still carry an
accessible text label.
```

## Adding an image

Captured Figma imagery for each section is available and surfaces automatically
at the end of each section. If you want the image at a specific spot in your
prose, drop a `<Media>` tag:

```markdown
<Media role="parts" />
```

The `role` tells the site which image to place:

| Role          | Section        | What it shows                |
|---------------|----------------|------------------------------|
| `parts`       | Anatomy        | Anatomy / parts breakdown    |
| `variations`  | Variants       | Variant axes and states      |
| `spacing`     | Spacing & size | Spacing and sizing rules     |
| `behavior`    | Behavior       | Interaction and motion       |
| `layout`      | Layout         | Layout and composition       |

Each role belongs to the section named above — use the role that matches the
section you're writing in.

You can also pass a `layout` hint (`stack`, `grid`, `inline`) to control how
multiple images in the same role are arranged:

```markdown
<Media role="variations" layout="grid" />
```

If you don't place a `<Media>` tag at all, the image still appears — it's
just auto-appended to the bottom of its section.

## Turning it on

Open the component's `_meta.yml` file (in the same folder as `design.md`) and
find the `design` entry under `domains`. Change its status from `inherited` to
`draft`:

```yaml
domains:
  design: { status: draft, owner: design, updatedAt: 2026-05-21 }
```

`draft` means "authored, not yet team-reviewed." Change it to `approved` once
the team has signed off.

## A short worked example

```markdown
## Anatomy

A checkbox is made up of a control (the box itself), an optional label, and an
optional helper text.

<Media role="parts" layout="grid" />

The control and label are aligned on the text baseline. Helper text sits one
spacing unit below the label and shares its left edge.

## Variants

Checkboxes come in three states: unchecked, checked, and indeterminate.
Use indeterminate only for a parent checkbox that represents a partially
selected group — never as a standalone state.

## Behavior

The entire row (control + label) is the click/tap target. Keyboard users
toggle the checkbox with Space.
```

## Going further

For the full technical contract — reserved table vocabularies, `<Media>` API,
structural projection, slug naming — see [`AUTHORING.md`](./AUTHORING.md).
