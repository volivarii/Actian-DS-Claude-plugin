---
name: design-audit
description: Audit a Figma file against DS2026 and Fat Marker conventions. Checks tokens, components, accessibility, content, and missing states. Use when user asks to audit, review, or check a design.
argument-hint: "[Figma URL]"
---

# Design System Audit

> **Works with both workflows.** First determine which library the file uses (FM components = Workflow A, DS2026 components = Workflow B), then apply the corresponding rules from CLAUDE.md.
> **Content guidelines:** Audit all UI copy against `references/content-guidelines.md` (in the skills directory) — check button labels, link text, form labels, status messages, modal copy, table headers, and navigation items.
> **Accessibility guidelines:** Audit against `references/accessibility-guidelines.md` (in the skills directory) — use the General Accessibility Checklist and the relevant component-specific checklists (P0–P2). Check contrast ratios, keyboard access, focus indicators, ARIA patterns, touch targets, and state completeness. All WCAG 2.1 AA.

Audit a Figma file or section against the Actian Design System 2026 and/or Fat Marker conventions.

## Input

The user provides a Figma URL (frame, page, or section). If no URL is given, ask for one.

## Steps

1. **Extract file key and node ID** from the URL.
2. **Get metadata** using `get_metadata` to understand the full structure (pages, frames, components used).
3. **Get screenshots** of key frames for visual reference.
4. **Get design context** on representative nodes to inspect token usage, typography, spacing, and component structure.

## What to check

### Component consistency
- Are FM-prefixed components used consistently? Flag any detached instances or ad-hoc recreations.
- Are component names consistent with the Fat Marker catalog? (See `components/FATMARKER-COMPONENT-CATALOG.md`)
- Flag any naming mismatches (e.g., "App_header" without "FM" prefix, "Text Cell" vs "Table Cell").

### Token usage
- Check for hardcoded hex colors — all colors should use design tokens from CLAUDE.md.
- Check typography: should be Inter (Fat Marker) or Roboto (DS2026), using defined text style tokens.
- Check spacing: values should align with the spacing scale (4, 8, 12, 16, 24, 32px).
- Check border radius: should use radius tokens (2, 4, 6, 8, 10, 12, 9999px).

### Flow structure (if auditing a flow)
- Does each sub-flow have a dark cover card with Feature / Flow / User?
- Are screens named with the convention: `[Persona] - [Page] - [State/Action]`?
- Are screens 1440x960px (standard) or 1440x700px (compact)?
- Is the reading order left-to-right, top-to-bottom?

### Missing states
- Flag flows missing: empty states, error states, loading states, or confirmation states.
- Flag forms missing: validation errors, disabled states, required field indicators.

### Accessibility
- Check color contrast on text elements (WCAG AA minimum).
- Verify interactive elements have visible focus states.
- Flag any text below 11px (body-micro minimum).

## Output format

Present findings as a structured report:

```
## Audit: [File/Section Name]

### Summary
- X issues found: Y critical, Z warnings
- Components used: [count] from FM kit, [count] ad-hoc
- Token compliance: [percentage]

### Critical Issues
1. [Issue] — [Location] — [Fix]

### Warnings
1. [Issue] — [Location] — [Recommendation]

### Component Usage
| Component | Count | Status |
|-----------|-------|--------|

### Recommendations
- [Actionable next steps]
```
