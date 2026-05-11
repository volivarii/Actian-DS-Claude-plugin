---
title: "Data tables"
nav_order: 8
---
# Data tables

Data tables display structured information in rows and columns. They are the primary way users view, compare, and act on datasets, connections, catalog entries, and other list-based content in the platform.

---

## When to use

- To display multiple items with shared attributes that benefit from comparison.
- When users need to sort, filter, or act on rows individually or in bulk.
- Do not use a data table for fewer than three columns or when a simple list suffices.

## Column headers

- Use short, descriptive noun phrases. Two to three words maximum.
- Use sentence case.
- Do not use abbreviations unless they are universally understood (for example, "ID," "URL").
- Do not end column headers with punctuation.
- Align header labels with the data they describe - left-align text columns, right-align numeric columns.

### Column header examples

| Use | Avoid |
|---|---|
| Last modified | Last Modification Date |
| Owner | Assigned to / Owned by |
| Status | Current status |
| Row count | No. of rows |
{: .do-dont-table}

## Cell content

- Keep cell values concise. Truncate long values with an ellipsis and show the full value on hover via tooltip.
- Use consistent date and number formatting across the table.
- Use "None" or "-" (em dash) for empty values - not blank, "N/A," or "null."
- Status values use standard vocabulary: Active, Inactive, Draft, Published, Deprecated, Error.

## Bulk actions

- Label bulk action buttons with a verb that applies to all selected items. For example, **Delete selected** or **Export**.
- Show the count of selected items near the action. For example, `3 items selected`.
