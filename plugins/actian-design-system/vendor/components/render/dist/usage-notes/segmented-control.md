# Segmented control: usage notes

A segmented control lets users switch between mutually exclusive views or modes. All options are visible simultaneously.

## When to use
- To switch between 2-5 mutually exclusive views or modes within a single surface.
- When all options benefit from side-by-side visibility.
- Do not use for page-level navigation. Use tabs instead.
- Do not use when options represent independent toggles. Use separate toggle controls instead.
- Use a segmented control to switch between two to four mutually exclusive presentations of the same content set, applied the instant a segment is clicked (**List / Grid**, **Day / Week / Month**).
- Use it when all options benefit from side-by-side visibility, so the current mode and its alternatives read at a glance.
- Use it above a table or card grid to re-display the records already on screen in another arrangement.

## When not to use
- Don't use it inside a form where the choice applies on submit: use a radio button group.
- Don't use it for peer views of different content on one object (**Overview**, **Lineage**, **Settings**): use tabs. A segmented control re-displays one content set; tabs move between distinct ones.
- Don't use it for page-level navigation; if the destination changes, it is the side nav or tabs, not a mode switch.
- Don't use it for a single binary on/off setting: use a toggle.

## Style
- Labels should be short nouns or verbs. One or two words maximum.
- Keep all labels similar in length for visual balance.
- Use sentence case.

## Category guidance (inherited: design, behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
