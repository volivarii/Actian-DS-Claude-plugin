---
title: "Search dropdown menu"
---
# Search dropdown menu

The search dropdown menu shows suggestions and matching results below a [search](search) field as the user types. It helps users reach a result without leaving the field.

***

## When to use

- To surface matching results or suggestions as the user types in a search field.
- Do not use it to show filters or unrelated actions. Keep it to query matches and suggestions.

## Style

- Group results by type when more than one type can match. Use a short heading for each group. For example, "Datasets", "Topics".
- Highlight the matched portion of each result so users can confirm relevance.
- Keep each result to its name plus minimal context, such as type or owner.

## Behavior

- Show a brief empty message when there are no matches. For example, "No matches for [query]".
- Let users move through results with the keyboard and select with Enter.
- Offer a way to see all results when matches exceed what the menu shows. For example, "See all results".

## Do / Don't

| Do | Don't |
|---|---|
| No matches for "sales_q4" | Nothing found. |
| See all results | View more |
| Datasets (group heading) | Mixing datasets and topics with no grouping |
