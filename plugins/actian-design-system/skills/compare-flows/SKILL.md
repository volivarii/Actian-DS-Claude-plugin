---
name: compare-flows
description: Compare two Figma designs side-by-side — v1 vs v2 diffs, before/after analysis, or competing UX approaches. Requires two Figma URLs.
argument-hint: "[Figma URL 1] [Figma URL 2]"
---

# Compare Flows

Compare two Figma flows or screens and provide structured UX recommendations. Runs autonomously — fetch both designs, analyze, output full report. Only pause if user provides just one URL (ask for second).

## Pipeline

1. Parse each URL per `../../references/figma/figma-output.md` (extract `fileKey`, `nodeId`). Classify each node via `use_figma` (see figma-output.md), route to resolved targets, then get screenshots.
2. `get_design_context` on key screens in each flow
3. Analyze across all dimensions below
4. Self-review: verify every dimension evaluated, every issue has severity + location
5. Present structured report

## Comparison dimensions

- **Structure:** Screen count, naming conventions, branching (linear vs. branched), missing screens (empty/error/confirmation states)
- **Component usage:** Which FM components in each, components in one but not other, ad-hoc elements that should be library components
- **Consistency:** Layout patterns, typography, spacing, color token usage between the two flows
- **Forms layout:** Simple inputs 480px max-width, extended elements full-width, action footer sticky bottom primary right
- **UX patterns:** Information hierarchy, progressive disclosure, user effort (fewer steps = better), error recovery
- **Accessibility:** Contrast, touch targets, focus order

## Severity levels

| Severity | Meaning |
|----------|---------|
| **P0 Critical** | Blocks usability or violates WCAG AA |
| **P1 Important** | Degrades experience or breaks conventions |
| **P2 Minor** | Polish issue, low user impact |

A flow with fewer P0s is generally stronger regardless of P1/P2 counts.

## Output format

```markdown
## Flow Comparison: [Flow A] vs [Flow B]

### At a glance
| Dimension | Flow A | Flow B |
|-----------|--------|--------|

### Strengths
**Flow A:** ...
**Flow B:** ...

### Issues (P0/P1/P2 tables)
| # | Flow | Issue | Location | Recommendation |

### Recommendation
[Which flow is stronger and why, or how to merge best of both]

### Suggested next steps
1. [Actionable item]
```

## References

- `references/figma/figma-output.md` — Figma URL parsing
- `references/ds-rules/quality-checklist.md` — cleanup pass checklist (applied to both flows)
- `docs/content-guidelines.md` — content guideline checks
- `docs/accessibility-guidelines.md` — accessibility checks
