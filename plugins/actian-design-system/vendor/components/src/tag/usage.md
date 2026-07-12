---
title: "Tags usage guidelines"
---
This guideline covers the tag family: default, status, stage, catalog, catalog item type, glossary item type, shared, and interactive tags.

## When to use

* Use tags to label items with metadata values: topics, domains, types, or user-defined attributes on datasets, data products, and glossary entries.

* Use them for both user-applied labels (a topic a steward adds) and system-applied classification (an item's type or lifecycle stage).

* Use interactive tags in edit contexts where a label can be removed or selected, for example managing the topics on a data product or clearing an applied criterion in [filters](search-filters).

## When not to use

* Don't use a tag as an action trigger: tags are labels, not [buttons](button). Only the interactive variant responds to clicks, and only to select or remove the label itself.

* Don't use a tag for a count or a small indicator attached to another element (unread items on a nav entry): use a [badge](badge). A tag names a metadata value and stands on its own.

* Don't invent freeform text for values the platform already classifies: item types, stages, and statuses use their dedicated variants with fixed vocabularies.

* Don't stack so many tags on a card or row that they crowd out the content; show the few that aid recognition and overflow the rest.

## Variant selection

* **Default:** user-defined or topic labels. The color axis (pink through gray) differentiates neighboring tags; color carries no meaning here.

* **Status:** operational status of a running asset (for example **Success**, **Fail**, **Warning**, **Scheduled**, **Stopped**). Use the platform status vocabulary; never coin a new status word per screen.

* **Stage:** data lifecycle stages, colored per stage consistently across the platform.

* **Catalog, catalog item type, glossary item type:** system classification of what an entity is (**Dataset**, **Data product**, **Field**, **Use case**); always system-set, never typed by users.

* **Shared:** flags an item as recently updated; apply it automatically, not by hand.

* **Interactive:** the removable and selectable form; the only variant that takes hover, focus, and selection.

## Do / Don't

| Do | Don't |
| --- | --- |
| Use the specialized variant for types, stages, and statuses | Put a system status in a freeform default tag |
| Show the remove affordance only in edit contexts | Render an X on tags in a read-only view |
| Keep one color per category, consistent across screens | Recolor the same topic tag from page to page |
| Let tag values come from the platform vocabulary where one exists | Mix **Published** and **Live** for the same state |

> Casing, one-to-three-word length, and the status vocabulary live in the Content guidelines for tags.
