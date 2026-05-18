---
title: "Loading and progress"
nav_order: 30
# Pattern fan-out — Feedback-category loading affordances. Jeff: edit/correct/extend.
relatedComponents: [loader, loader-with-logo, loading-skeleton, spinner]
---
# Loading

---

## Loading indicator

### When to use

During transitions, page loads, or background processes.

### Style

- Use a loading message only when the wait is likely to exceed three seconds.
- Keep loading messages brief and present-tense. For example, `Loading datasets...`
- Do not use `Please wait`.

---

## Progress indicator

### When to use

- For multi-step flows such as wizards or onboarding sequences.
- For file uploads or long-running background processes.

### Style

- Label each step in a stepper with a short noun or verb phrase.
- Show current step and total step count. For example, `Step 2 of 4`.
- For upload progress, show percentage or file size transferred.
