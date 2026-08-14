# Search dropdown menu: usage notes

The search dropdown menu shows suggestions and matching results below a search field as the user types. It helps users reach a result without leaving the field.

## When to use
- To surface matching results or suggestions as the user types in a search field.
- Do not use it to show filters or unrelated actions. Keep it to query matches and suggestions.
- Use it to surface matching results and suggestions live under a search field as the user types, so a known target is reachable without leaving the field.
- Use it to shortcut the full results page: a user typing an exact asset name should land on that asset in one click.
- Use it to group matches by type (**Datasets**, **Topics**) when more than one kind of asset can match the query.

## When not to use
- Don't put filter controls or unrelated actions in the menu: refinement belongs to filters on the results page; the menu carries only matches and suggestions.
- Don't use it as a form control that assigns a value by typing: use a combo box.
- Don't use it as a command or actions menu under a button: use dropdown / select.
- Don't make it the whole search experience: cap the list and hand off to the full results page (**See all results**) instead of scrolling dozens of matches in a floating menu.

## Style
- Group results by type when more than one type can match. Use a short heading for each group. For example, "Datasets", "Topics".
- Highlight the matched portion of each result so users can confirm relevance.
- Keep each result to its name plus minimal context, such as type or owner.

## Category guidance (inherited: design, behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
