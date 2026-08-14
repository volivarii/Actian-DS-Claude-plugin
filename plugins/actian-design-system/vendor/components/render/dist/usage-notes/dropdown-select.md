# Dropdown / Select: usage notes

Dropdowns and select menus allow users to choose one option from a list. They are used for actions menus, filter selections, and single-choice inputs where the full list does not need to be visible at all times.

## When to use
- Use a dropdown to select one item from a predefined list of roughly six or more options (for example **Connection type**, **Region**, **Glossary domain**).
- Use it when space is limited and the alternatives don't need to stay visible: only the chosen value matters after selection.
- Use it for filter controls above a table or catalog list, where several dropdowns sit side by side.
- Use it as an actions menu: a button labeled with a clear action or noun (**Actions**, **More**) opening a short list of commands, for example overflow actions on a row or page.

## When not to use
- Don't hide two to five options behind a dropdown when they fit on screen: use a radio button group so users can compare at a glance.
- Don't make users scroll a very long list (countries, long dataset lists): use a combo box so typing narrows the options.
- Don't use it as a form field that collects several values: use a multi-select. The Search/Multiple variant is for in-menu filter checkboxes, not multi-value input.
- Don't use it to switch views of the same content with immediate effect: use a segmented control.

## Style
- Label the button with a clear action or noun. For example, **Actions** or **More**.
- Menu items should follow the verb + noun formula. For example, **Download PDF**, **Add tag**, **Delete record**.
- Use sentence case for all menu items.
- Multi-selection dropdowns: include checkboxes, and selections should persist until the user closes the menu.

## Category guidance (inherited: design, behavior)
Inputs and selections converge on Label → Control → Helper → Validation as the dominant anatomy across mature DSes. The `Label position` variant captures the dense-form vs comfortable-form authoring choice. The six accessibility refs map to WCAG criteria that apply to every form control regardless of subtype.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
