---
# yaml-language-server: $schema=../../../schemas/category-defaults.json
_schema_version: 1
slug: feedback
label: Feedback
authoring_status: engineer-seed
confidence:
  anatomy: medium
  variants: high
  motion: high
  a11y: high
last_reviewed: 2026-05-12

anatomy:
  - { name: Container, description: the bounding surface — typically a status region or live region }
  - { name: Status icon, description: glyph + color reinforcing severity (info, success, warning, error) }
  - { name: Title (optional), description: short headline summarizing the message }
  - { name: Message, description: the body content explaining what happened and (if applicable) what to do }
  - { name: Action (optional), description: primary action — retry, undo, dismiss, view details }
  - { name: Dismiss control (optional), description: explicit close affordance for transient feedback }

variants:
  - { axis: Severity, values: [info, success, warning, error] }
  - { axis: Persistence, values: [transient, persistent] }
  - { axis: State, values: [entering, visible, exiting, dismissed] }

motion_refs:
  - { ref: success-toast, note: transient feedback follows the toast enter/exit timing curve }
  - { ref: skeleton-loading, note: loader-with-logo + loading-skeleton inherit the skeleton pulse cadence }
  - { ref: state-transitions, note: severity transitions (e.g. error → success) cross-fade rather than swap }

accessibility:
  - { ref: feedback-errors, note: error severity must be conveyed by text + icon, not color alone }
  - { ref: aria-guidance, note: transient messages use role=status (polite) or role=alert (assertive) per severity }
  - { ref: color-contrast }
  - { ref: motion-media, note: respect prefers-reduced-motion — disable entrance pulse + slide }
  - { ref: keyboard-focus, note: focus must not be stolen by toasts; persistent alerts may receive focus when actionable }
---

# Feedback — design rationale

Components in this category communicate system state to the user. Members: `alert-banner`, `confirmation`, `empty-state`, `error-state`, `loader`, `loader-with-logo`, `loading-skeleton`, `maintenance-banner`, `maintenance-state`, `notification`, `spinner`.

## Reference patterns

- **Polaris** — Banner, Toast, EmptyState, Spinner, SkeletonPage
- **Material** — Snackbars, Banners, Progress Indicators (Linear/Circular), Skeleton
- **Carbon** — InlineNotification, ToastNotification, ActionableNotification, Loading, SkeletonText

## Why these defaults

Feedback patterns share a Severity × Persistence matrix. Transient messages (toasts, snackbars) must NOT steal focus and must be polite by default; assertive announcements are reserved for blocking errors. Motion is central to the category — but reduced-motion users need a graceful degradation.

## Notes for refining authors

- `empty-state` / `error-state` / `maintenance-state` are full-page or full-region treatments — their anatomy extends with `Illustration` + `Primary action` + `Secondary action`.
- `spinner` / `loader` / `loader-with-logo` are pure loading indicators — strip down to `Container` + `Animation`. Severity is N/A.
- `notification` is the system-tray entry, distinct from inline `alert-banner`. Likely needs different a11y refs (notification center patterns).
- `loading-skeleton` is a layout primitive rather than a message — confidence on its category fit is `medium`.
