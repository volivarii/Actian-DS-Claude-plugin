# Text input: usage notes

Text inputs allow users to enter freeform text. They are used for naming, descriptions, search, and any field where the expected value cannot be constrained to a fixed list.

## When to use
- Use a text input for a single-line freeform value that cannot be constrained to a fixed list: names, emails, hosts, ports (for example **Dataset name**, **Connection host**).
- Use it when the user already knows the value and just needs to type it, rather than pick it from options.
- Specify the input type when the value has a format (email, number, password) so validation and keyboards can assist.

## When not to use
- Don't use a text input when the value comes from a known list: use a dropdown / select, or a combo box when the list is long and typing should narrow it.
- Don't use it to query or filter the content of the page: use search.
- Don't use it for multi-line or formatted content such as data product descriptions: use rich text.
- Don't use it for dates: use the date input.

## Category guidance (inherited: behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage, design); INHERITED from category (behavior).
