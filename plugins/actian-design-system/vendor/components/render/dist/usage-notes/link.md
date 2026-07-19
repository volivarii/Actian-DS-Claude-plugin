# Links: usage notes

A link visually represents clickable text or elements that navigate users to other pages, sections, or resources. Links appear colored to indicate interactivity and follow accessibility and design standards for clarity and usability.

## When to use
- For navigation to internal or external destinations. Use external link icon in the latter case.
- For inline standalone contextual actions (for example, **Learn more**).
- Avoid using links for actions; use ghost buttons instead.
- Use a link to take the user somewhere: another page, another section, or an external resource. If activating it only changes location, it is a link.
- Use inline links inside prose to connect a mention to its page (for example the data process name in "created by the **Nightly import**").
- Use standalone links for contextual navigation next to content (for example **View dataset details**, **Learn more**).
- Use an external link icon when the destination leaves the product.

## When not to use
- Don't use a link to trigger an action: submitting a form, downloading a file, starting or deleting something is a button. Actions change state; links change place.
- Don't dress a link as a low-emphasis action: use a ghost button instead of a link for **Cancel** or **Retry**.
- Don't use links to switch between views of the same content: use tabs or a segmented control.
- Don't use a bare icon as a link without an accessible label.

## Style
- Use meaningful, descriptive link text.
- Avoid standalone icons as links unless accompanied by an accessible label.
- Use sentence case and no terminal punctuation.
- Keep links clear, concise, accessible, and consistent.

## Category guidance (inherited: design, behavior)
Action surfaces converge on a small set of style ramps (primary → ghost) and a tight state machine (default → hover → focus → active → loading → disabled). The category lives or dies on accessibility: keyboard operability, focus visibility, and non-color state signalling are non-negotiable.

> Note: includes guidance not yet ratified: DRAFT (usage); INHERITED from category (design, behavior).
