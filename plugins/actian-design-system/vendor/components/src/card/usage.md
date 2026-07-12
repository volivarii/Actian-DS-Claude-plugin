---
title: "Cards usage guidelines"
---
This guideline covers the card family: card for items, card for grouped content, selectable cards, card for perimeter, view card, and [search result card](search-result-card).

## When to use

* Use a card grid for browseable items whose identity matters more than attribute comparison: data products, datasets, visualizations, glossary topics.

* Use a card when each item needs a recognizable face: name, type, a couple of metadata lines, and a click target to its detail page.

* Use a grouped-content card to frame a related block (a summary, a chart, a settings group) on a dashboard or detail page.

* Use cards as gateways to collections, for example topic cards on the Explorer home.

## When not to use

* Don't use cards for large sets of comparable records that users sort and filter: use a [table](table).

* Don't use a card for a lone block of text on a page: plain page content needs no frame.

* Don't put primary page actions inside a card: page-level actions belong in the [page header](page-header).

* Don't nest cards inside cards; use the grouped-content card's slot for inner content instead.

## Variant selection

* **Card for items:** clickable entities in a grid. Pick the type that matches the entity: **Catalog** for catalog assets, **Item** for generic items, **Glossary type** for glossary entries, **Topic** for curated groupings. Enable the AI-ready flag only when the platform has marked the asset AI ready.

* **Card for grouped content:** a container with an optional header and a free slot; use it to frame dashboard widgets or detail-page sections, not to represent an entity.

* **Selectable card:** options presented as rich cards at a decision point; selection follows [checkboxes](checkbox) (several) or [radio buttons](radio-button) (exactly one).

* **Card for perimeter:** perimeter definitions in Explorer; do not reuse it for other entities.

* **View card:** saved views; do not reuse it for other entities.

* **Search result card:** search results only, with an Explorer and a Studio variant; never use it in ordinary grids.

## Do / Don't

| Do | Don't |
| --- | --- |
| Make the whole item card one click target to the detail page | Scatter separate links inside the card body |
| Reveal contextual actions on focus as well as hover, or in an [actions menu](dropdown-select) | Stack persistent buttons on every card in a grid |
| Keep every card in a grid the same kind and size | Mix item cards and grouped-content cards in one grid |
| Show two or three metadata lines (type, owner, last modified) | Cram the full attribute set onto the card face |

> Card title and description wording per sub-kind (item, selectable, topic) lives in the Content guidelines for cards.
