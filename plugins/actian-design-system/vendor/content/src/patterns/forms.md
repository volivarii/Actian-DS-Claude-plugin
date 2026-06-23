---
title: "Forms"
nav_order: 14
# Pattern fan-out — initial set: registry slugs in the "Form (input & selection)"
# category that benefit from form-level layout/labeling/copy guidance.
# Skipped: search, search-dropdown-menu (search has its own pattern), and
# calendar (date-picker is narrower). Jeff: edit/correct/extend.
relatedComponents: [input, input-date, checkbox-with-label, radio-button, toggle, search-filters]
---
# Forms

Forms collect or update user data. Consistent structure, clear labels, and helpful guidance reduce friction and prevent errors.

***

## When to use

* To collect user input that affects data, configuration, or permissions.

* To edit or update existing records or entities.

* To guide users through multi-step flows where input drives behavior.

* To allow users to provide comments and suggestions, or to confirm, approve, or reject requests that require context.

## Types of forms

| Type                       | Usage                                               | Examples                                     |
| -------------------------- | --------------------------------------------------- | -------------------------------------------- |
| Single page or simple form | Data entry for simple workflows                     | Editing a dataset name or description        |
| Stepper or multi-page form | Task-based workflows                                | Creating a data connection or access request |
| Modal form                 | Short, focused tasks that require user confirmation | Adding a note or setting permissions         |

***

## General form guidelines

### How to use

* Be concise and directive: each label or helper text should clearly describe the required action.

* Use sentence case for labels and titles.

| Do         | Don't      |
| ---------- | ---------- |
| Group name | Group Name |

* Clarify optional vs. required fields: mark required fields consistently using the asterisk (\*) symbol or text label.

* Avoid redundancy: if a section title already establishes context, field labels can be shorter.

* Provide context when needed: helper text should explain the "why," never just restate the label.

* Error text should guide correction.

| Do                 | Don't         |
| ------------------ | ------------- |
| Enter a valid date | Invalid input |

* Success or confirmation text should be brief, reassuring, and specific. For example, `The policy was successfully created`.

* Use progressive disclosure for field entry assistance: Label → Tooltip → Descriptive text → Link to docs.

### Structure

* Group related fields together under sections.

* Always place the primary CTA at the bottom right for consistency.

* Avoid multi-column layouts when possible - single column is easier to read. Exceptions such as separate fields for first and last names are acceptable.

### Behavior

* Labels should be visible even when the field is in focus.

* Include placeholder text only when it provides value - never to just repeat the label.

* The primary CTA should be disabled until all required fields are filled.

* Validate fields inline and provide red error text below the field. See [validation messages](validation-messages) for error text guidelines.

***

## Input labels and helper text

### Style

* Labels describe the purpose of the field. They are always visible.

* Helper text provides brief instruction or clarification below the field. Use it sparingly.

* Placeholder text is a hint only - never a substitute for a label. It disappears when the user starts typing.

### Do / Don't

| Do                                                                              | Don't                                                 |
| ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Label: Connection name / Helper: Use a unique name to identify this connection. | Placeholder: Enter connection name (no visible label) |
| Helper: Must be 8–32 characters.                                                | Helper: Please enter a valid password.                |

***

## Dropdown

### When to use

* For lists of 5 to 20 options.

* When the full list does not need to be visible at all times.

### Style

* Label the dropdown clearly. The label should describe the category of options, not the action.

* Close after selection.

* Keep option phrasing consistent within the same dropdown.

* Use sentence case for all options.

***

## Calendar

The calendar component is used for any interaction involving date ranges, filtering, or scheduling.

### When to use

For any interaction involving date ranges, filtering, or scheduling.

### Style

* Use labels like `From` and `To`, or `Start date` and `End date` for range fields. Do not leave any fields unlabeled.

* Display date formats clearly (MM/DD/YYYY or regional format) with placeholders or hints where appropriate.

* Do not pre-fill dates for users.

### Behavior

* Support both typing and calendar picking.

* Auto-close the calendar when the selection is complete.

* Highlight today, weekends, and blocked dates visually when appropriate.

* Visually display any selected range in the calendar.

***

## Toggle

### Style

* Label the toggle next to or above the control. For example, **Enable alerts**.

* Show the label for the state that is currently active. For example, show `Off` when off, `On` when on - but not both at the same time.

### Behavior

* The action should happen on toggle with no confirmation step.

* Left = off, right = on.

* Should update instantly unless a delay is unavoidable - show a loading indicator if delayed.

* Do not use toggles for destructive or irreversible actions.

### Toggle vs Checkbox vs Radio button

**Use a toggle when:**

* The action takes effect immediately.

* It represents a system state (for example, ON/OFF, enabled/disabled).

* It is a binary setting that persists (for example, dark mode, notifications).

**Use a** **[checkbox](/components/form-input-selection/checkbox-with-label/)** **when:**

* The user is selecting one or more items.

* The action does not take effect immediately (typically part of a form or group submission).

* It is a yes/no decision that is reviewed later. For example, **Agree to terms and conditions** or **Subscribe to newsletter**.

***

## Radio button

### When to use

* When the user must select exactly one option from a short visible list (typically two to six options).

* When all choices should be visible up front rather than hidden in a dropdown.

### Style

* Use short, descriptive labels that clearly state each option.

* Write labels as direct answers to the group's prompt or question. For example, **Yes / No** instead of `Select yes if you agree`.

* Ensure the group label or question is always visible next to the options.

* Avoid jargon or abbreviations.

* Keep labels parallel in structure - all nouns, or all verb phrases.

***

## Radio button card format

Use card-format radio buttons instead of traditional radio buttons when each option needs rich context such as a title, description, image, metadata, or tags, and the selection should feel like a visual choice rather than a text label.

### When to use

* Primary decision point: when the consequences of the choice are important, or they drive a main workflow or journey.

* Examples: pricing tiers, template selections (for example, use cases), or layout choices.

### Behavior

* Indicate selected state visually (`Selected` highlight border, and so on).

* Click anywhere on the tile to toggle selection.

* For multi-select: use checkbox behavior. For single-select: use radio group behavior.

* Maintain selection across steps if part of a multi-step process.

* Title: short, descriptive, and consistent across tiles.

* Supporting text: use only in the large variant.
