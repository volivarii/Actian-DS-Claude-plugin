---
title: "Checkboxes usage guidelines"
---
## When to use

* Use checkboxes when the user can pick several independent options from a group (for example filtering datasets by format, owner, and status at once).

* Use a single checkbox for one standalone opt-in inside a form that submits, where nothing changes until save (for example **Enable notifications**, agreeing to terms).

* Use checkboxes for bulk selection of rows in a [table](table), such as picking datasets to add to a data product.

## When not to use

* Don't use a checkbox for a setting that takes effect the moment it is clicked: use a [toggle](toggle).

* Don't use checkboxes when exactly one option must be chosen: use a [radio button](radio-button) group.

* Don't stack a checkbox group past roughly seven options: use a [multi-select](multi-select).

## Variant selection

* **Checked / unchecked:** the normal two-state choice; every checkbox the user interacts with resolves to one of these.

* **Indeterminate:** only as a parent whose children are partially selected, such as the select-all header of a [table](table). It is never a third value the user picks directly.

* **Card format:** options that need rich context (title, description, image), at a primary decision point such as choosing a template or a connection type (see [cards](card)).

* **Group vs standalone:** group related checkboxes under one group label; a lone opt-in stands on its own with a clear action label.

## Do / Don't

| Do | Don't |
| --- | --- |
| Let form checkboxes wait for submit (filters and row selection act instantly) | Fire a save request on every tick |
| Use indeterminate only for partial child selection | Offer indeterminate as a choosable state |
| Keep every option in a group independent | Mix mutually exclusive options into one checkbox group |
| Group related checkboxes under one group label | Scatter related options across the form |

> Label wording rules (positive form, parallel structure) live in the Content guidelines for checkboxes.
