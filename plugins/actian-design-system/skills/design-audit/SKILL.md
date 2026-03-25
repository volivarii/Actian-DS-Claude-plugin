---
name: design-audit
description: Use this skill whenever the user wants to check if a Figma design follows the Actian design system rules. Performs a comprehensive audit covering token usage, component consistency, accessibility (WCAG AA), content guidelines, forms layout, and missing states — then produces a severity-rated report (P0/P1/P2) with specific fixes. Triggers when the user asks to audit, review, or check a design, wants to know if tokens are correct, asks what's wrong with a screen, wants to find inconsistencies, or shares a Figma URL and asks if it meets DS2026 or Fat Marker standards.
argument-hint: "[Figma URL]"
---

# Design System Audit

> **Works with both workflows.** First determine which library the file uses (FM components = Workflow A, DS2026 components = Workflow B), then apply the corresponding rules from CLAUDE.md.
> **Content guidelines:** Audit all UI copy against `../../docs/content-guidelines.md` — check button labels, link text, form labels, status messages, modal copy, table headers, and navigation items.
> **Accessibility guidelines:** Audit against `../../docs/accessibility-guidelines.md` — use the General Accessibility Checklist and the relevant component-specific checklists (P0–P2). Check contrast ratios, keyboard access, focus indicators, ARIA patterns, touch targets, and state completeness. All WCAG 2.1 AA.
> **Quality & hygiene:** Include the Quality & Hygiene Checklist from CLAUDE.md as an audit dimension — flag violations of any of the 10 items (auto layout, constraints, properties, states, contrast, layer naming, style check, instance cleanup, hidden layers, documentation).
> **Generation log:** Follow the Generation Log format in CLAUDE.md for all output files.

Audit a Figma file or section against the Actian Design System 2026 and/or Fat Marker conventions.

> **Mode: Audit.** Be methodical and exhaustive — check every element against the rules. Work through tokens, components, accessibility, content, forms layout, and missing states systematically. Flag everything, categorize by severity (P0 critical / P1 important / P2 minor). Quote the specific rule being violated. Output a structured report, not prose.

## Input

The user provides a Figma URL (frame, page, or section). If no URL is given, ask for one.

## Steps

1. **Extract file key and node ID** from the URL.
2. **Get metadata** using `get_metadata` to understand the full structure (pages, frames, components used).
3. **Get screenshots** of key frames for visual reference.
4. **Get design context** on representative nodes to inspect token usage, typography, spacing, and component structure.

## What to check

### Component-specific guidelines

For each component identified in the design, check `../../docs/component-guidelines/<slug>.json` for per-component content and design guidelines extracted from Figma. Use the `content_guidelines` field to audit UI copy and the `design_guidelines` field to check layout/usage patterns. If no file exists for a component, rely on the generic guidelines.

### Component consistency
- Are FM-prefixed components used consistently? Flag any detached instances or ad-hoc recreations.
- Are component names consistent with the Fat Marker catalog? (See `../../docs/fm-components.md`)
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

### Forms layout (Design Consistency handoff)
- Simple form input containers must be constrained to **480px max-width** — flag if inputs stretch full-width
- Extended elements (selectable rows, tiles, tables) should be **full-width** — flag if constrained to 480px
- Multi-column layouts: forms should be **fluid** inside their containers
- Action footer: sticky bottom, primary actions right, secondary left — flag if reversed or floating

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

## Deep analysis with DS Assembler (recommended)

If the DS Assembler plugin is running (with its Local server URL pointing to the current project directory, served via `scripts/ensure-server.sh . 8765`), use it for a more accurate audit:

### Step 1 — Analyze via plugin

1. Tell the user: **"Open DS Assembler → Analyze tab → select scope → click Analyze"**
2. Wait for the user to confirm analysis is complete
3. Read the analysis results:
   ```bash
   cat assembler-specs/analysis.json
   ```
4. Use the data to enrich the audit with exact node IDs, instance counts, variant usage, and hardcoded color locations

### Step 2 — Enhanced report

With analysis data, the report gains:
- **Exact component counts** by library (local vs external)
- **Variant usage patterns** — which variants are actually used vs available
- **Hardcoded color list** with node IDs and hex values
- **Missing auto-layout** frames with child counts
- **Instance-level detail** — every component instance with its position, variants, and text overrides

### Step 3 — Auto-fix (if user requests)

If the user says "fix it", "apply fixes", or "auto-correct":

1. Generate an `updates.json` file based on the audit findings:
   ```json
   {
     "updates": [
       { "nodeId": "123:456", "action": "set-fill", "fill": "#0550dc" },
       { "nodeId": "789:012", "action": "set-variant", "props": { "State": "Default" } },
       { "nodeId": "345:678", "action": "replace-with-instance", "componentName": "FM Button", "props": { "Type": "Primary" } }
     ]
   }
   ```
2. Save to `assembler-specs/updates.json`
3. Tell the user: **"Open DS Assembler → Update tab → Load Updates → review → Apply"**
4. After the user confirms, read the results:
   ```bash
   cat assembler-specs/update-result.json
   ```
5. Report what was fixed and what failed
