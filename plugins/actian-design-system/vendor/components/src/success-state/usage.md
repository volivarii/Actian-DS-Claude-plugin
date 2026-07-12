---
title: "Success state usage guidelines"
---
## When to use

* Use a success state to close out a completed journey: a connection created, datasets imported, an onboarding flow finished. Completed journeys end here, not on a passing message.

* Use it when the outcome needs a moment of reassurance: a long setup, a first-time task, an operation the user might doubt worked.

* Use it to hand the user their next step: the screen pairs the confirmation with a logical follow-on action (**Open catalog**).

* Use it in the container the journey occupied: the full page for full-page flows, the [modal](modal) body for flows that ran there.

## When not to use

* Don't use a success state for a routine action's result: a save or publish is a [global toast](global-toast).

* Don't use it for feedback tied to one element: use an [inline toast](inline-toast).

* Don't use it between steps of a flow: mid-journey progress belongs to the [stepper](stepper).

* Don't show it before the action has fully completed; while the outcome is uncertain, keep the loading treatment.

## Variant selection

Success states have no type or size variants; the choices are configuration.

* **Illustration and title:** always present; the title confirms what completed (**Items imported**), and the illustration is decorative for assistive tech.

* **Body:** one line pointing at what the completion makes possible.

* **Primary CTA:** a single action that starts the next task.

## Do / Don't

| Do | Don't |
| --- | --- |
| Show it once, at the end of the journey | Insert a success screen after every step |
| Point the CTA at the next task (**Open catalog**) | Close the flow with a bare **Done** |
| Keep to a single primary CTA | Line up three next actions under the illustration |
| Land the user somewhere useful afterwards | Return them to the same [empty state](empty-state) they started from |

> Wording rules (confirm what completed, one-line body, example messages) live in the Content guidelines for success state.
