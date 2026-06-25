---
title: "Buttons"
nav_order: 5
---
# Buttons

Buttons trigger actions. They are the primary mechanism for users to submit forms, confirm choices, navigate, and initiate processes within the platform.

***

## When to use

* Use buttons for actions, not navigation. For navigation, use [links](link).

* Use a primary button for the main action on a page or modal.

* Use secondary buttons for alternative or less critical actions.

* Use ghost or tertiary buttons for low-priority or destructive actions that should not draw immediate attention.

## Style

* Use sentence case for all button labels.

* Use the verb + object formula whenever possible (for example, **Create report**, **Delete dataset**).

* Keep labels concise - ideally two to four words.

* Do not end button labels with punctuation.

* Do not use articles (a, an, the) in button labels unless necessary for clarity.

## Behavior

* Disable the primary button until all required fields are complete.

* Show a loading indicator on the button when an action is in progress.

* Return focus to the triggering element after a modal or dialog closes.

## Do / Don't

| Do             | Don't            |
| -------------- | ---------------- |
| Create report  | Report           |
| Delete dataset | Delete           |
| Add connection | Add a connection |
| Save changes   | Save Changes     |

***

## Terminology for button labeling

Use the following term pairs consistently across the platform. Choosing the wrong term creates confusion when the same action appears under different labels in different contexts.

| Term or term pair       | Usage                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cancel vs Close         | Use **Cancel** when the user is backing out of a page or modal where information has been entered or a confirmation is required. Cancel returns the user to the previous state without saving. Use **Close** for read-only messages or screens.                                                                                                                                               |
| Create vs Add vs Insert | Use **Create** when the user is making something brand new. Use **Add** when bringing in similar information that already exists elsewhere. Use **Insert** when bringing in similar information and the ordering is important. The plus (+) icon is only needed when creating a new object to add to something else. When adding an existing object to a list, the icon is not needed.        |
| OK                      | Use **OK** for read-only pages that are not legally required to be accepted.                                                                                                                                                                                                                                                                                                                  |
| Accept vs Decline       | Use **Accept** when legal terms of service need to be acknowledged before the user can proceed. **Accept** can also be paired with **Decline** when the user must choose whether to implement proposed changes from someone else or from AI.                                                                                                                                                  |
| Got it!                 | Use **Got it!** when providing information confirmation modals where the user does not have to take any action.                                                                                                                                                                                                                                                                               |
| Select vs Choose        | Use **Select** when the user is picking from a list with limited options. Use **Choose** when the user is picking from a large number of options or making an open-ended decision.                                                                                                                                                                                                            |
| Submit vs Send vs Save  | Use **Submit** for a form. Use **Send** only for email. Use **Save** when the user is adding or changing selections on a modal.                                                                                                                                                                                                                                                               |
| View vs See             | Use **View** as a noun (for example, **Table view**). Use **See** as a verb, but only with a modifier (for example, **See more**).                                                                                                                                                                                                                                                            |
| Stepper buttons         | Use verb + object for the creation button. With few exceptions, the verb should be **Create**. Use only the verb (without the object) when finishing a stepper (for example, **Create** not **Create integration**). In modals and steppers, the initial button and the final button should use the same term in most cases. Exceptions include using **Save** on the final step of a wizard. |
