# Checkboxes: usage notes

Checkboxes let users select one or more options from a list. They are used for choices that are not mutually exclusive, such as selecting multiple preferences or agreeing to terms.

## When to use
- To allow users to select multiple options in a group.
- For binary settings that are independent of other choices. For example, **Enable notifications**.
- When a task involves filtering or refining data. For example, applying multiple filters to a search.
- Primary decision point: when the consequences of the choice are important, or they drive a main workflow or journey.
- Examples: pricing tiers, template selections (for example, use cases), or layout choices.
- Use checkboxes when the user can pick several independent options from a group (for example filtering datasets by format, owner, and status at once).
- Use a single checkbox for one standalone opt-in inside a form that submits, where nothing changes until save (for example **Enable notifications**, agreeing to terms).

## When not to use
- Don't use a checkbox for a setting that takes effect the moment it is clicked: use a toggle.
- Don't use checkboxes when exactly one option must be chosen: use a radio button group.
- Don't stack a checkbox group past roughly seven options: use a multi-select.

## Style
- Use clear, direct labels that describe what happens if the box is checked.
- Write labels in positive form.
- Group related checkboxes under a group label when possible for context.
- Keep labels parallel in style and length for readability.
- Avoid jargon and abbreviations.

## Category guidance (inherited: design, behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
