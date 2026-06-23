---
title: "Related content panels"
nav_order: 30
# Pattern fan-out — surfaces that show contextually-related content. Jeff: edit/correct/extend.
relatedComponents: [drawer-side-panel]
---
# Related content panels

Related content panels surface assets or resources connected to the currently viewed item. They help users discover relevant datasets, reports, lineage connections, or documentation without leaving their current context.

***

## When to use

* On asset detail pages to surface downstream or upstream dependencies.

* To show related documentation, reports, or catalog entries.

* Do not use related content panels for primary navigation - they are supplementary.

## Style

* Panel heading describes the relationship type. For example, `Related datasets`, `Used in reports`.

* Each item in the panel shows the asset name as a link, plus one or two metadata attributes (type, owner, or last modified).

* If the panel is empty, show a brief empty state message. For example, `No related datasets found`.

## Do / Don't

| Do                         | Don't                         |
| -------------------------- | ----------------------------- |
| Related datasets           | Other items                   |
| No related datasets found. | (empty panel with no message) |
| Used in 3 reports          | Reports: 3                    |
