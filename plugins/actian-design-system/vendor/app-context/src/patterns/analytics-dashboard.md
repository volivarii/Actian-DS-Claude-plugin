---
# yaml-language-server: $schema=../../../schemas/app-context-pattern.json
_schema_version: 1
slug: analytics-dashboard
label: Analytics dashboard
apps:
  - studio
tags:
  - dashboard
  - metrics
  - charts
  - monitor
  - adoption
when: >-
  Use for the aggregate view over a whole catalog: a grid of per-type completion cards
  beside a rail of charts. Do not use documentation-completion-dashboard, which scores
  individual items against criteria; this one answers how the catalog is doing, not which
  item is behind.
components:
  - card-for-perimeter
  - progress-bar-small
  - segmented-control
  - line-graph
  - page-header
---
Two columns. The main one is a grid of per-type completion cards, each a type badge, the type name, its
item count, a progress bar and a percentage, with `N/A` where the count is zero; below it a Custom
Analysis section whose empty state carries a Create an analysis button. The rail holds adoption rate as
two radial gauges (a large percentage inside the ring, a fraction and a role beneath), then adoption rate
evolution as a dual-axis time chart with a segmented control switching the series, then a numbered list
of most popular items with type badges.

Corrected 2026-08-18 against the running product. This record named `card-for-items`; the completion
cards are the `card-for-perimeter` shape, verified against that component's own `default.webp` capture,
and `card-for-perimeter` is a different component that the current sync does not retire. `line-graph` is left in place: the evolution chart is
line-shaped, so it is defensible. `bar-graph` was left beside it on 2026-08-18 because the page was not
read to its end and removing it would have been an assertion from absence. It leaves the list on
2026-08-31 for a different reason, which is not an assertion from absence: the component is deleted from
the Figma library, so nothing here can realise it whatever the page shows.

Known gap, and it is the reason the rail cannot be drawn today: **no radial gauge component exists in
either kit**, under `gauge`, `donut`, `radial`, `ring` or `circular`. A bar chart is now a second gap of
the same kind, since `bar-graph` was retired upstream with no replacement. The two adoption gauges lead this
page and the design system cannot express them.
