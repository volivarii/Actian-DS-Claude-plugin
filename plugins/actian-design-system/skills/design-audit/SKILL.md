---
name: design-audit
description: Audit a Figma design against DS rules — tokens, spacing, a11y, component usage. Finds inconsistencies and can fix specific findings.
argument-hint: "[Figma URL] or [fix finding #N]"
---

# Design System Audit

Audit a Figma file or section against the Actian Design System 2026 and/or Fat Marker conventions. Determine which library the file uses (FM = Workflow A, DS Kit = Workflow B), then apply corresponding rules.

## Pipeline

1. Parse URL → extract `fileKey` + `nodeId` (per `../../references/figma-output.md`)
2. Classify node via `use_figma` (see figma-output.md) → get type, name, children. Route: if PAGE/SECTION/GROUP, pick the target frame/component from children.
3. `get_screenshot` of resolved target → visual reference
4. `get_design_context` on resolved target → inspect tokens, typography, spacing, components
5. Check each dimension below → structured report with severity (P0/P1/P2)
6. Present findings; user can request fixes ("fix #3", "fix all auto-fixable")

## What to check

- **Component guidelines:** Read `../../docs/component-guidelines/<slug>.json` for per-component content/design rules
- **Component consistency:** FM-prefixed components used consistently, no detached instances or ad-hoc recreations, names match catalog (`../../docs/fm-components.md`)
- **Token usage:** No hardcoded hex colors, typography uses Inter (FM) or Roboto (DS Kit) text style tokens, spacing on scale (4/8/12/16/24/28/32), border radius uses radius tokens
- **Flow structure:** Dark cover card with Feature/Flow/User, screen naming `[Persona] - [Page] - [State]`, 1440x960 or 1440x700, left-to-right reading order
- **Forms layout:** Simple inputs 480px max-width, extended elements full-width, action footer sticky bottom with primary right
- **Missing states:** Empty, error, loading, confirmation states; form validation, disabled, required indicators
- **Copy and labels:** Check visible text against `../../docs/content-guidelines.md` — sentence case on all UI text, action-verb button labels, error messages that say what went wrong and how to fix it, placeholder text that models input (never repeats the label), no banned words (please, sorry, ensure, execute, abort, sign in, disabled)
- **Accessibility:** WCAG AA contrast, visible focus states, no text below 11px

## Output format

```
## Audit: [File/Section Name]

### Summary
- X issues found: Y critical, Z warnings
- Token compliance: [percentage]

### Findings
| # | Severity | Confidence | Finding | Rule | Fix |
|---|----------|------------|---------|------|-----|
| 1 | P0 | 0.95 | Button uses hardcoded #0550DC | Zero hardcoded hex | Bind theme-primary variable |
```

## Fixing findings

After the audit report, the user can request fixes:
- `"fix #3"` — fix a specific finding
- `"fix all auto-fixable"` — batch fix all `autoFixable: true` findings
- Free-text: `"fix the hardcoded blue on the login button"`

Fix types, evidence standard, confidence scores, JSON output format, and verification procedure: see `../../references/design-audit/evidence-and-fixes.md`.

## Key rules

- Every finding needs evidence: node ID, expected value, actual value, rule quoted
- Findings below confidence 0.5 go to "Needs manual review" section
- Batch fixes run sequentially (never parallel `use_figma`), P0 first

## References

- `references/design-audit/evidence-and-fixes.md` — confidence scores, evidence standard, JSON output, fix types, verification
- `references/figma-output.md` — Figma URL parsing, token binding
- `references/quality-checklist.md` — cleanup pass checklist
- `references/parity-check.md` — post-fix verification
