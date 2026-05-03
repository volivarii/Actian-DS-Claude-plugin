# Library Gap Detection

When building Figma output, **always check the component catalog before creating custom frames.** If a library component exists for the element you're building, import it — even if a variant is missing.

## When a gap is detected

1. Attach a `Feedback (Type=System)` marker next to the improvised frame in Figma — subtle, doesn't distract the reviewing designer
2. Log the gap to `{project_working_directory}/library-gaps.json` with component name, severity, and workaround

## Severity levels

- `Missing component` — no library component exists for this element
- `Missing variant` — component exists but lacks the needed variant (e.g., Info type on FM Alert)
- `Missing property` — component exists but lacks a needed property (e.g., no text override, no disabled state)
- `General` — other limitation that forced a workaround

## Designer annotations

Designers can place `Feedback (Type=Designer)` components in Figma to annotate issues. Skills scan for these at their post-push parity check step.
