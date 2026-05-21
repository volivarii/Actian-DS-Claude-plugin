---
title: "Table"
---
# Table

The table component displays structured information in rows and columns. It is the primary way users view, compare, and act on datasets, connections, catalog entries, and other list-based content in the platform.

---

## When to use

- To display multiple items with shared attributes that benefit from comparison.
- When users need to sort, filter, or act on rows individually or in bulk.
- When row-level actions (edit, delete, export) need to be accessible without leaving the view.
- Do not use a table for fewer than three columns or when a simple list or prose suffices.
- Do not use a table to display a single item's attributes - use a detail panel or form instead.

## Style

- Default column width should fit the widest expected value. Fixed widths work well for predictable data types: status (80-100px), date (120px), count or ID (60-80px).
- Do not add row numbers unless the sequence itself is meaningful data - for example, a ranked list.
- Status values always use standard vocabulary: Active, Inactive, Draft, Published, Deprecated, Error. Do not invent synonyms.
- Truncate long text with an ellipsis and expose the full value on hover via tooltip. Never wrap cell text across multiple lines.

## Column headers

- Use short, descriptive noun phrases. Two to three words maximum.
- Use sentence case.
- Do not use abbreviations unless they are universally understood (for example, "ID," "URL").
- Do not end column headers with punctuation.
- Align header labels with the data they describe - left-align text columns, right-align numeric columns.
- Do not embed units of measurement in the column header. Put them in cell values or as a parenthetical sub-label: **Revenue (USD)**, not **Revenue in USD dollars**.
- An action column (overflow menu) can be left unlabeled if the icon is self-evident, but include an accessible `aria-label` of "Actions".

### Column header examples

| Use | Avoid |
|---|---|
| Last modified | Last Modification Date |
| Owner | Assigned to / Owned by |
| Status | Current status |
| Row count | No. of rows |
| Revenue (USD) | Revenue in U.S. Dollars |
{: .do-dont-table}

## Cell content

- Keep cell values concise. Truncate long values with an ellipsis and show the full value on hover via tooltip.
- Use consistent formatting within each column - do not mix date formats or number formats across rows.
- Right-align numeric values and left-align text within the same column. Do not mix alignments.
- Use consistent decimal places within a column. Do not show `1.5` in one row and `1.50` in another.
- Dates: use ISO 8601 (YYYY-MM-DD) unless the product context requires a locale-specific format.
- Use "-" (hyphen) for empty values - not blank, "N/A," or "null."
- Boolean values: use **Yes / No**, not **True / False** or **1 / 0**.
- Status values use standard vocabulary: Active, Inactive, Draft, Published, Deprecated, Error.

## Behavior

### Sorting

- When a column is sortable, indicate the active sort column and direction at all times.
- Default sort should reflect the user's most likely intent - for catalog entries, sort by last modified descending.
- Do not apply alphabetical sort as a default unless alphabetical order is genuinely meaningful. For names, alphabetical is fine; for status values, priority order is better.

### Empty states

- No rows (no data yet): follow the [empty state](empty-and-system-states) pattern - headline, one-sentence explanation, and a primary CTA. For example: "No connections found / Add your first connection to get started. / Add connection"
- No results after filtering or search: "No results for '[term]'" or "No items match your filters" + a "Clear filters" link. Never leave a blank table with no explanation.

### Row actions

- Place destructive actions (Delete, Remove) last in the overflow menu, separated by a divider from non-destructive actions.
- Confirm destructive row actions with a confirmation dialog before executing - never delete on first click.
- Overflow menu item labels: verb only. Use "Edit", "Delete", "Rename", "Duplicate" - not "Edit item" or "Delete this row".

### Selection

- Show the selected row count close to the bulk action controls: "3 rows selected". Use "rows" not "items" unless a more specific noun is available (for example, "3 datasets selected").
- "Select all" selects the current page only. If selecting across pages is supported, expose it as a secondary affordance with explicit copy: "Select all 340 results".

## Bulk actions

- Label bulk action buttons with a verb that applies to all selected items. For example, **Delete selected** or **Export**.
- Show the count of selected items near the action. For example, `3 items selected`.

## Pagination

- Label page controls plainly. Use **Previous** and **Next**.
- Show total result count when relevant. For example, `Showing 1-25 of 340 results`.

## Do / Don't

| Do | Don't |
|---|---|
| Last modified | Last Modification Date |
| Revenue (USD) | Revenue in U.S. Dollars |
| - (hyphen) for empty cells | N/A / null / blank |
| Active | active / ACTIVE |
| 3 rows selected | 3 items selected (when rows are datasets) |
| No connections found + CTA | (blank table with no explanation) |
| Delete (overflow menu item) | Delete this connection |
| Showing 1-25 of 340 results | Page 1 of 14 |
{: .do-dont-table}
