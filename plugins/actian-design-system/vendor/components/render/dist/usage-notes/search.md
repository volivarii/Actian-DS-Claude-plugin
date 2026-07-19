# Search: usage notes

Search allows users to find assets quickly. Placeholder text should provide a hint as to what is being searched and help the user understand the scope of the search.

## When to use
- As a global entry point for finding any data asset.
- As a scoped filter within a specific view or catalog section.
- Use search as the global entry point for finding any data asset across the platform, from the global header or the Explorer home.
- Use it as a scoped filter inside a specific view: a catalog section, a topic, a long list where typing narrows what is shown.
- Use it when users know roughly what they are looking for and a keyword beats browsing or structured criteria.

## When not to use
- Don't use search to collect a freeform form value such as a name or host: use a text input. Search queries content; it never stores data.
- Don't use it to pick a form value by typing from a known list: use a combo box.
- Don't use it as the only way to narrow a result set by structured attributes (owner, status, type): pair it with filters instead of teaching users keyword tricks.
- Don't embed a search field for a list short enough to scan; a dozen visible items need no query box.

## Category guidance (inherited: design, behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
