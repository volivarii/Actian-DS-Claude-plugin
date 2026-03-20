# Prompt Template: Compare Flows

> Copy this into Claude Desktop when evaluating two design alternatives. Paste both Figma URLs.

---

## The prompt

```
Compare these two Figma flows and give me a structured recommendation:

**Flow A:** [paste Figma URL]
**Flow B:** [paste Figma URL]

**Context:** [e.g., "Both are onboarding flows for new Explorer users" or "Flow A is the current design, Flow B is a proposed redesign"]

Compare across these dimensions:

1. **Structure** — Number of screens/steps, flow branching, missing screens (empty states, errors, confirmations)
2. **Component usage** — Which components are used in each? Any inconsistencies or ad-hoc elements?
3. **UX patterns** — Information hierarchy, progressive disclosure, user effort (fewer steps = better), error recovery
4. **Consistency** — Do both follow the same layout pattern? Typography, spacing, and color consistency
5. **Accessibility** — Contrast issues, touch targets, focus order

Format as:
- At-a-glance comparison table
- Strengths of each flow
- Issues in each flow (with fixes)
- Recommendation: which is stronger and why (or how to combine the best of both)
- Suggested next steps
```

---

## Tips
- Works best when comparing flows at the same fidelity level (both Fat Marker, or both hi-fi)
- If comparing across fidelity levels, tell Claude: "Flow A is a wireframe, Flow B is production — focus on UX structure, not visual polish"
- After the comparison, ask: "What would the ideal flow look like combining the best of both?"
