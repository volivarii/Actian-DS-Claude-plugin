---
name: compare-flows
description: Compare two Figma flows with structured UX analysis and recommendations. Use when user asks to compare, diff, or evaluate two designs.
argument-hint: "[Figma URL 1] [Figma URL 2]"
---

# Compare Flows

> **Works with both workflows.** Determine which library each flow uses. If comparing across fidelity levels (FM vs DS2026), note the difference and focus on UX structure rather than visual tokens.
> **Content guidelines:** Evaluate all UI copy in both flows against `docs/content-guidelines.md` — flag inconsistencies in button labels, link text, status messages, and terminology.
> **Accessibility guidelines:** Compare accessibility compliance in both flows using `docs/accessibility-guidelines.md` — check focus order, keyboard access, ARIA patterns, contrast, touch targets, and missing states. WCAG 2.1 AA.
> **Quality & hygiene:** Evaluate both flows against the Quality & Hygiene Checklist in CLAUDE.md — flag violations as comparison points.

Compare two Figma flows or screens and provide structured UX recommendations.

> **Mode: Research + Audit.** Read both flows thoroughly before concluding. Compare approaches as structured analysis — separate observation from opinion. Then switch to audit posture: flag issues by severity, quote specific rules, output a structured report.

## Input

The user provides two Figma URLs (frames, sections, or pages) to compare. Examples:
- "Compare these two onboarding flows and recommend the stronger one"
- "What changed between v1 and v2 of this checkout flow?"
- "How does the Explorer view differ from the Studio view for item details?"

## Steps

1. **Fetch both designs** — get metadata and screenshots for both URLs.
2. **Get design context** for key screens in each flow.
3. **Analyze and compare** across the dimensions below.
4. **Present findings** in a structured format.

## Comparison dimensions

### Structure
- Number of screens/steps in each flow
- Screen naming conventions
- Flow branching (linear vs. branched)
- Missing screens (empty states, errors, confirmations)

### Component usage
- Which FM components are used in each?
- Any components in one but not the other?
- Any ad-hoc elements that should be library components?

### Consistency
- Do both flows follow the same layout pattern (header + sidebar + content)?
- Typography consistency between the two
- Spacing and alignment consistency
- Color token usage

### Forms layout (Design Consistency handoff)
- Are simple form inputs constrained to **480px max-width**?
- Are extended elements (selectable rows, tiles, tables) displayed **full-width**?
- Is the action footer sticky bottom with primary actions right, secondary left?

### UX patterns
- Information hierarchy — is the most important content prominent?
- Progressive disclosure — is complexity managed well?
- User effort — which flow requires fewer steps/decisions?
- Error recovery — which handles errors more gracefully?

### Accessibility
- Contrast issues in either flow
- Touch target sizes
- Focus order logic

## Output format

```markdown
## Flow Comparison: [Flow A] vs [Flow B]

### At a glance
| Dimension | Flow A | Flow B |
|-----------|--------|--------|
| Screens | X | Y |
| Components used | X | Y |
| Missing states | [list] | [list] |

### Strengths
**Flow A:**
- [What it does well]

**Flow B:**
- [What it does well]

### Issues
**Flow A:**
- [Problem] — [Recommendation]

**Flow B:**
- [Problem] — [Recommendation]

### Recommendation
[Which flow is stronger and why, or how to combine the best of both]

### Suggested next steps
1. [Action item]
2. [Action item]
```
