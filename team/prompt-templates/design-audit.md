# Prompt Template: Design System Audit

> Copy this into Claude Desktop when reviewing an existing Figma file. Paste the Figma URL where indicated.

---

## The prompt

```
Review this Figma file against our design system and give me a structured audit:

**Figma URL:** [paste your Figma frame/page link here]

Check for:

1. **Component consistency** — Are components from our library used consistently? Flag any detached instances, ad-hoc recreations, or naming mismatches.

2. **Token usage** — Are colors, typography, spacing, and radius using design tokens? Flag any hardcoded hex values, non-standard font sizes, or spacing that doesn't match our scale (spacing-2xs through spacing-xl: 4, 8, 12, 16, 24, 32px). Check theme-specific tokens (theme-primary, status colors, category colors) match the active theme mode (Actian/Studio/Explorer).

3. **Missing states** — Flag flows missing: empty states, error states, loading states, or confirmation states. Flag forms missing: validation errors, disabled states, required field indicators.

4. **Naming** — Are layers and frames named descriptively? Flag any "Frame 47" or "Group 3" type names.

5. **Accessibility** — Check text contrast (WCAG AA minimum), verify interactive elements have focus states, flag any text below 11px.

Format your findings as:
- Summary (X issues: Y critical, Z warnings)
- Critical issues (with location and fix)
- Warnings (with recommendation)
- Component usage table
- Actionable next steps
```

---

## Tips
- Select a specific frame or section rather than an entire file — focused audits give better results
- Run this on your own work before design review to catch issues early
- After the audit, ask: "Which of these issues should I fix first?"
