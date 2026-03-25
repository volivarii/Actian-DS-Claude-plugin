---
name: compare-flows
description: Use this skill whenever the user wants to decide between two design options or understand what changed between two versions. Takes two Figma URLs and produces a structured comparison report with severity-rated issues, strengths, and a concrete recommendation. Triggers on any request involving two Figma designs — comparing flows, evaluating which version is better, diffing v1 vs v2, reviewing a redesign against the original, or choosing between competing UX approaches. If the user provides two Figma URLs in any context, this skill likely applies.
argument-hint: "[Figma URL 1] [Figma URL 2]"
---

# Compare Flows

> **Works with both workflows.** Determine which library each flow uses. If comparing across fidelity levels (FM vs DS2026), note the difference and focus on UX structure rather than visual tokens.
> **Content guidelines:** Evaluate all UI copy in both flows against `docs/content-guidelines.md` — flag inconsistencies in button labels, link text, status messages, and terminology.
> **Accessibility guidelines:** Compare accessibility compliance in both flows using `docs/accessibility-guidelines.md` — check focus order, keyboard access, ARIA patterns, contrast, touch targets, and missing states. WCAG 2.1 AA.
> **Quality & hygiene:** Evaluate both flows against the Quality & Hygiene Checklist in CLAUDE.md — flag violations as comparison points.
> **Generation log:** Follow the Generation Log format in CLAUDE.md for all output files.

Compare two Figma flows or screens and provide structured UX recommendations.

> **Mode: Research + Audit. Runs autonomously.** Fetch both designs, analyze thoroughly, and output the full report without pausing for intermediate confirmation. Separate observation from opinion. Flag issues by severity, quote specific rules, output a structured report. The only acceptable pause is if the user provides only one URL — ask for the second.

## Input

The user provides two Figma URLs (frames, sections, or pages) to compare. Examples:
- "Compare these two onboarding flows and recommend the stronger one"
- "What changed between v1 and v2 of this checkout flow?"
- "How does the Explorer view differ from the Studio view for item details?"

## Steps

1. **Fetch both designs** — get metadata and screenshots for both URLs.
2. **Get design context** for key screens in each flow.
3. **Analyze and compare** across the dimensions below.
4. **Self-review** — verify completeness before presenting (see Cleanup pass below).
5. **Present findings** in a structured format.

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

## Severity levels

Categorize every issue found in either flow:

| Severity | Meaning | Examples |
|----------|---------|----------|
| **P0 Critical** | Blocks usability or violates WCAG AA | Missing error state on a form, contrast failure, no keyboard access to primary action |
| **P1 Important** | Degrades experience or breaks conventions | Hardcoded hex colors, detached component instances, forms not constrained to 480px, inconsistent naming |
| **P2 Minor** | Polish issue, low user impact | Spacing off by 4px, minor label inconsistency, hidden layers left from drafting |

When comparing, a flow with fewer P0s is generally stronger regardless of P1/P2 counts.

## Output format

```markdown
## Flow Comparison: [Flow A] vs [Flow B]

### At a glance
| Dimension | Flow A | Flow B |
|-----------|--------|--------|
| Screens | X | Y |
| Components used | X | Y |
| Missing states | [list] | [list] |
| Issues | X P0, Y P1, Z P2 | X P0, Y P1, Z P2 |

### Strengths
**Flow A:**
- [What it does well]

**Flow B:**
- [What it does well]

### Issues

**P0 — Critical**
| # | Flow | Issue | Location | Recommendation |
|---|------|-------|----------|----------------|
| 1 | A | [Problem] | [Screen/element] | [Fix] |

**P1 — Important**
| # | Flow | Issue | Location | Recommendation |
|---|------|-------|----------|----------------|
| 1 | B | [Problem] | [Screen/element] | [Fix] |

**P2 — Minor**
| # | Flow | Issue | Location | Recommendation |
|---|------|-------|----------|----------------|
| 1 | A | [Problem] | [Screen/element] | [Fix] |

### Recommendation
[Which flow is stronger and why, or how to combine the best of both]

### Suggested next steps
1. [Action item]
2. [Action item]
```

## Cleanup pass

Before presenting the report, verify completeness:

- [ ] Both flows were fetched — screenshots and design context for all key screens
- [ ] Every comparison dimension was evaluated (structure, components, consistency, forms layout, UX patterns, accessibility)
- [ ] Every issue has a severity level (P0/P1/P2) and a specific location
- [ ] Content guidelines were checked: button labels, link text, status messages, terminology consistency between the two flows
- [ ] Accessibility was checked: contrast, focus order, keyboard access, touch targets
- [ ] Quality & hygiene checklist applied to both flows as comparison points
- [ ] The recommendation is concrete — names the stronger flow or explains how to merge the best of both
- [ ] Suggested next steps are actionable (not generic "review" items)
