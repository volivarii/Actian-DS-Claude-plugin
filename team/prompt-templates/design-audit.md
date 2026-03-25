# Prompt Template: Design System Audit

> Copy this into Claude Desktop when reviewing an existing Figma file. Paste the Figma URL where indicated.
> Updated: 2026-03-25

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

5. **Accessibility** — Check text contrast (WCAG AA minimum 4.5:1 normal, 3:1 large), verify interactive elements have focus states, flag any text below 11px.

6. **Quality & hygiene checklist** — Also check:
   - Auto Layout: do components resize correctly (Fixed/Hug/Fill)?
   - Constraints: will elements break when stretched?
   - Properties: are Boolean toggles and Text properties named clearly?
   - States: are Hover, Pressed, Disabled, Focused states present?
   - Style check: 100% of colors/fonts linked to Variables/Styles?
   - Instance cleanup: any detached instances in library pages?
   - Hidden layers: any invisible layers left from drafting?
   - Documentation: is the Description field filled for every main component?

Format your findings as:
- Summary (X issues: Y critical / P0, Z important / P1, W minor / P2)
- Critical issues (P0 — with location and fix)
- Important issues (P1 — with recommendation)
- Minor issues (P2 — polish items)
- Component usage table
- Quality & hygiene checklist pass/fail
- Actionable next steps
```

---

## Tips
- Select a specific frame or section rather than an entire file — focused audits give better results
- Run this on your own work before design review to catch issues early
- After the audit, ask: "Which of these issues should I fix first?"
- The quality & hygiene checklist items are P0–P2 severity: Auto Layout, States, Contrast, Style check are P0 blockers
