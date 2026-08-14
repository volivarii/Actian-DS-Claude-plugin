# Rich text: usage notes

The rich text editor allows users to write and format long-form content such as descriptions, notes, and documentation.

## When to use
- When users need to format content with headings, lists, links, or emphasis.
- For long-form inputs such as descriptions, notes, or comments.
- Do not use for short single-line inputs. Use a text input instead.
- Use rich text for long-form content where formatting carries meaning: headings, lists, links, emphasis (for example a data product description).
- Use it for fields users will later read as a formatted page: dataset documentation, notes, comments.
- Use it for release notes and changelog-style updates, where lists and emphasis structure the message.
- Use the same editor everywhere formatted content is written, so descriptions read the same across Studio, Explorer, and Administration.

## When not to use
- Don't use it for short single-line values such as names, hosts, or titles: use a text input.
- Don't use it for values the system parses (connection strings, expressions, queries): formatting markup would corrupt the value; use a text input with the right type.
- Don't use it when the content never benefits from formatting, such as a one-sentence reason field: the toolbar becomes noise.
- Don't use it to lay out tabular data: structured rows and columns belong in a table, not formatted prose.

## Style
- Placeholder text should describe what kind of content belongs here. For example, "Add a description" or "Write release notes."
- Toolbar button labels follow standard conventions: Bold, Italic, Link, Bullet list, Numbered list.
- Do not use placeholder text to convey formatting instructions. Use helper text below the field instead.

## Category guidance (inherited: design, behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
