# Flow Research Guide

Competitor research and reference analysis procedures for the generate-flow skill.

## Accepted reference formats

| Format | How to handle |
|--------|---------------|
| **Figma URL** | Fetch with `get_design_context` + `get_screenshot` to analyze layout, components, flow structure |
| **Image file path** | Read with the Read tool. Describe layout, components, flow steps, copy. |
| **Pasted image** | Analyze directly. Describe layout, components, flow steps, UX patterns. |
| **Website URL** | Fetch with `WebFetch` for page structure, or `WebSearch` for screenshots |
| **PDF** | Read with the Read tool (specify pages if large). Extract screen layouts, flow structure, requirements. |

## How to use references

References inform the flow — not templates to copy. For each reference:

1. **Describe what you see** — layout structure, key components, flow steps, interaction patterns
2. **Extract what's useful** — patterns to adopt, information architecture, UX conventions
3. **Note what to avoid** — patterns conflicting with Actian conventions or FM constraints
4. **Map to FM components** — which Fat Marker components can replicate the reference

Include a "Reference analysis" section in output:

```
### Reference analysis

**[Reference 1 — source name]:**
- Layout: [observed structure]
- Key patterns: [what to adopt]
- FM mapping: [how to recreate with FM components]
- Skip: [what doesn't apply]
```

## Competitor research (when opted in)

Research how other products solve the same problem.

**What to research:**
1. **Direct competitors** — Collibra, Alation, Atlan, data.world, Informatica, OneTrust, BigID, Monte Carlo, Soda, Great Expectations
2. **General SaaS patterns** — Linear, Notion, Figma, Stripe Dashboard
3. **UX pattern libraries** — forms/wizards, tables/lists, access/permissions, empty states

**How to research:**
- `WebSearch` for screenshots, case studies, documentation of competitor flows
- `WebFetch` on product pages, help docs, blog posts showing the UX

**Output format:**

```
### Competitor & pattern research: [Feature]

**How others handle this:**
- [Product A]: [approach]
- [Product B]: [approach]

**Common patterns:**
- [Observation]

**Recommendation for our flow:**
- [What to adopt and why]
```

## Research frame (included by default)

When research was conducted, include the summary as the first screen in HTML output:

- Dark-background card (`--fm-base-900` bg, `--fm-base-white` text)
- Title: "Research: [Feature]"
- Competitor findings, common patterns, recommendation, sources
- Same width as flow screens (1440px), height auto
- Typography: `fm-page-header__title` for headings, 14px Inter for body

Skip only if user says "no research card" or "skip the research frame".
