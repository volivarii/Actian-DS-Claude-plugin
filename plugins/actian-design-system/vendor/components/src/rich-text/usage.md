---
title: "Rich text usage guidelines"
---
## When to use

* Use rich text for long-form content where formatting carries meaning: headings, lists, links, emphasis (for example a data product description).

* Use it for fields users will later read as a formatted page: dataset documentation, notes, comments.

* Use it for release notes and changelog-style updates, where lists and emphasis structure the message.

* Use the same editor everywhere formatted content is written, so descriptions read the same across Studio, Explorer, and Administration.

## When not to use

* Don't use it for short single-line values such as names, hosts, or titles: use a [text input](text-input).

* Don't use it for values the system parses (connection strings, expressions, queries): formatting markup would corrupt the value; use a [text input](text-input) with the right type.

* Don't use it when the content never benefits from formatting, such as a one-sentence reason field: the toolbar becomes noise.

* Don't use it to lay out tabular data: structured rows and columns belong in a [table](table), not formatted prose.

## Variant selection

Rich text has no type or size variants; the choice is how much room the field gets.

* **Compact field:** a few formatted lines inside a form, the typical description field.

* **Full writing surface:** long documentation where the user needs room to write and review; give the editor the panel or page, not a form row.

## Do / Don't

| Do | Don't |
| --- | --- |
| Offer only the formats the field needs (bold, links, lists) | Ship a full word-processor toolbar for a two-line description |
| Put formatting hints in helper text below the field | Cram formatting instructions into the placeholder |
| Preserve formatting wherever the content is displayed | Strip formatting on the read view and surprise the author |
| Warn before discarding long unsaved content | Lose a written description on accidental navigation |
| Sanitize pasted content down to the allowed formats | Import arbitrary styling from pasted documents |

> Placeholder and toolbar label wording rules (Bold, Italic, Bullet list) live in the Content guidelines for rich text.
