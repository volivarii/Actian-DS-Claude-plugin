# Specs: Describe several items

**Owner (Designer):** To fill
**Intent:** intent.md
**Figma:** https://www.figma.com/design/abc/x?node-id=1-2
**Prototype:** prototype.html
**Knowledge:** v0.34.218

## Screens / Flows Covered
Source: Prototype
1. Catalog, no description: the filtered list.

## Components Used
Source: Figma
- Button (button): the Write descriptions bulk action.

## States
Source: Prototype
| Screen | Default | Loading | Empty | Error | Disabled |
| --- | --- | --- | --- | --- | --- |
| Catalog | yes | n/a | yes | no | n/a |

## Interactions & Transitions
Source: Prototype
- Clicking Write descriptions opens the drawer on the first item.

## Copy
Source: Prototype
- Bulk action: "Write descriptions"
- Confirmation: "3 descriptions saved"

## Accessibility Notes
Source: Figma
- Focus order: list, bulk bar, drawer.

## Edge Cases
Source: Intent
- No item selected → the bulk action is disabled.

## Flagged concerns
Source: Figma + Intent
- None.
