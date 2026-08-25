---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: type-picker-grid
label: Type picker grid
apps:
  - studio
tags:
  - grid
  - picker
  - create
  - types
  - selection
when: >-
  Use when creation begins by choosing a type from a grid of equally weighted options,
  grouped by family and filtered by a segmented control. Do not use a dropdown: the grid
  exists because the options carry an icon and a colour that make them recognisable.
components:
  - radio-card
  - segmented-control
  - search
  - text-input
  - action-bar
  - page-header
---
A full page, not an overlay. A required Name field over an information banner explaining that a key is
generated from it, then an Item type section: a segmented control filtering All Types / Glossary Types /
Physical & Logical Types, a search input, and grids of selectable tiles grouped under family headings.
Each tile is a radio control, a two-letter colour-coded type badge and the type name, truncated when
long. A persistent action bar at the foot of the page carries a single Confirm, disabled until a name
and a type are both chosen.

Corrected 2026-08-18 against the running product, where this record was wrong twice. It named `modal`:
creation is a full page at `/new-item`, carrying the app sidebar and a pinned action bar, with no overlay
involved. And it named `card-for-items`: the tiles are radio cards, verified by comparing the page
against `card-for-items`' own `default.webp`, which is a badge, a title, a catalog chip and body prose,
and is nothing like a type tile.

The `sticky-footer` to `action-bar` rename this record was waiting on landed alongside the registry on
2026-08-24 (#526), so it now names `action-bar`.
