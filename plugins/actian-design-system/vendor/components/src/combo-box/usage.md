---
title: "Combo box usage guidelines"
---
## When to use

* Use a combo box to select one value from a long list (roughly 20 or more items) where typing to narrow the options beats scrolling (for example picking a schema, a dataset, or a connection from hundreds).

* Use it when freeform input is valid alongside the suggestions, so the user can either pick a listed value or enter a new one.

* Use it when users typically know the value by name and can type its first characters faster than they can scan a menu.

## When not to use

* Don't use a combo box for a short, stable list users can scan without typing: use a [dropdown / select](dropdown-select).

* Don't use it to query or filter the content of the page: use [search](search). A combo box narrows a field's own options, not what the page shows.

* Don't use it to collect several values as chips: use a [multi-select](multi-select).

* Don't use it for freeform values with no meaningful suggestion list: use a [text input](text-input).

## Variant selection

Combo boxes have no type or size variants; the choices are between modes.

* **List-only:** only listed values are valid; typing filters the options and the user must pick one.

* **Free entry:** typed values outside the list are accepted, for example naming a new tag while suggesting existing ones.

* **Value display:** keep the chosen value visible in the field after selection; clear the input on selection only when the value is displayed elsewhere.

## Do / Don't

| Do | Don't |
| --- | --- |
| Filter the options as the user types | Wait for Enter to run the filter |
| Show a no-results message when nothing matches | Present an empty open list |
| Let users open the full list before typing anything | Force typing before any option shows |
| Allow selection with Enter as well as click | Require a mouse click to choose |

> Placeholder and option wording rules live in the Content guidelines for combo boxes.
