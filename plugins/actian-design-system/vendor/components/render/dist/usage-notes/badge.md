# Badges: usage notes

Badges indicate a count or a status qualifier on an item — for example, unread notifications or a new-item label.

## When to use
- To show a numeric count on an item (for example, unread notifications).
- To apply a status qualifier that does not fit inline as a tag.
- Use a badge to show a numeric count on an item, for example unread notifications on the bell in the global header.
- Use it for a short, system-set change flag on an item (**New**, **Updated**) that must be scannable in a table cell or on a card. Lifecycle and status words (Draft, Published, Deprecated) belong to tags.
- Use it to flag that something changed or needs attention while the item itself stays unchanged.
- Put the dot form on a container (a side nav entry, a tab) when the new content lives deeper inside.

## When not to use
- Don't use a badge for labels people apply or curate themselves: user-applied classification is a tag. The system sets and clears badges; users never do.
- Don't make a badge interactive: it is a read-only signal, never a click target or a removable chip.
- Don't use a badge to report the outcome of an action just taken: use a global toast or inline toast.
- Don't badge everything on a screen: when every item carries one, none of them signals anything.

## Style
- Badge labels are single words or short abbreviations.
- Use standard status vocabulary: New, Updated, Draft, Published, Deprecated.

## Category guidance (inherited: design, behavior)
This category is intentionally broad: charts, tables, cards, badges, and graph primitives all share "show me data" semantics. The anatomy is therefore high-level — `Primary content` is the load-bearing slot that each member specializes (a chart's plot area, a table's row, a badge's label). `Density` is the dominant variant axis because data-rich screens optimize differently for analyst vs operator contexts. Confidence on `anatomy` is `low` because 31 members will surface category-fit issues that aren't visible from a cross-DS lift alone.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
