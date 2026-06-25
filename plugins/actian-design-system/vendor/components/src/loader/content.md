---
title: "Loader"
---
# Loader

The loader appears during page transitions, data fetches, and background processes to communicate that the system is working. For application startup or full-screen transitions, use the [loader with logo](loader-with-logo) instead.

***

## When to use

* During page loads, data fetches, or transitions that require the user to wait.

* For in-page or component-level loading states.

## Style

* Include a loading message only when the wait is likely to exceed three seconds.

* Keep messages brief and present-tense.

## Do / Don't

| Do                  | Don't                            |
| ------------------- | -------------------------------- |
| Loading datasets... | Please wait.                     |
| Fetching results... | Loading, this may take a moment. |
