---

<!-- This skill can be invoked directly (/design-audit) or via the DS companion. -->
name: design-audit
description: This skill should be used when the user wants to audit, review, lint, or QA a Figma design against DS Kit or Fat Marker rules, asks if tokens are correct, wants to find design system inconsistencies, asks what's wrong with a screen, shares a Figma URL asking if it meets standards, or asks to fix a specific audit finding ("fix finding #N", "fix the hardcoded blue").
argument-hint: "[Figma URL] or [fix finding #N]"
---

<!-- This skill can be invoked directly (/design-audit) or via the DS companion. -->

# Design System Audit

> **Works with both workflows.** First determine which library the file uses (FM components = Workflow A, DS Kit components = Workflow B), then apply the corresponding rules from CLAUDE.md.
> **Shared rules apply:** Content guidelines, accessibility guidelines (WCAG 2.1 AA), quality & hygiene checklist, and generation log format — all per CLAUDE.md.

Audit a Figma file or section against the Actian Design System 2026 and/or Fat Marker conventions.

**When NOT to use:** If the user provides *two* Figma URLs to compare → use `compare-flows`. If the user asks to *create* a component → use `create-component`.

> **Mode: Audit.** Be methodical and exhaustive — check every element against the rules. Work through tokens, components, accessibility, content, forms layout, and missing states systematically. Flag everything, categorize by severity (P0 critical / P1 important / P2 minor). Quote the specific rule being violated. Output a structured report, not prose.

## Input

The user provides a Figma URL (frame, page, or section). If no URL is given, ask for one.

## Steps

1. **Extract file key and node ID** from the URL — follow `../../references/figma-output.md` § "Figma URL Parsing". Convert dashes to colons in nodeId. Pass `fileKey` and `nodeId` explicitly to all MCP calls. Never rely on "current selection".
2. **Get metadata** using `get_metadata(fileKey, nodeId)` to understand the full structure (pages, frames, components used).
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
- Check typography: should be Inter (Fat Marker) or Roboto (DS Kit), using defined text style tokens.
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

### Findings

| # | Severity | Confidence | Finding | Rule | Fix |
|---|----------|------------|---------|------|-----|

### Warnings
1. [Issue] — [Location] — [Recommendation]

### Component Usage
| Component | Count | Status |
|-----------|-------|--------|

### Recommendations
- [Actionable next steps]
```

### Confidence scores

Every finding must include a confidence score (0.0–1.0):

| Score | Meaning | When to use |
|-------|---------|------------|
| 0.9–1.0 | Certain | Token value directly visible in `get_design_context` output, contrast ratio calculated |
| 0.7–0.8 | High | Structure strongly suggests violation (e.g., frame without auto-layout, text without style binding) |
| 0.5–0.6 | Medium | Inferred from screenshot or partial data (e.g., color looks off but hex not extractable) |
| 0.3–0.4 | Low | Based on naming conventions or indirect evidence only |
| 0.0–0.2 | Speculative | Flagged for manual review, insufficient data to confirm |

Include confidence in every finding row:

| # | Severity | Confidence | Finding | Rule | Fix |
|---|----------|------------|---------|------|-----|
| 1 | P0 | 0.95 | Button uses hardcoded #0550DC | Style check: zero hardcoded hex | Bind `theme-primary` variable |
| 2 | P1 | 0.70 | Frame "Header" appears to lack auto-layout | Auto-layout on every frame | Add auto-layout with HORIZONTAL direction |
| 3 | P2 | 0.40 | Layer named "Frame 23" | Descriptive layer naming | Rename to describe content |

### Evidence standard

Every finding must cite what structure in the design proves the violation:

- **What:** The specific node/layer name and ID where the issue exists
- **Expected:** What the design system rule requires (quote the rule)
- **Actual:** What was observed (include hex values, pixel values, or node properties from `get_design_context`)
- **Why it matters:** Impact on users, consistency, or maintenance

Findings without evidence are not findings — they are guesses. If you cannot extract enough data to support a finding at confidence ≥ 0.5, add it to a "Needs manual review" section instead of the main findings table.

### JSON output (for programmatic consumption)

When the user requests JSON output or for programmatic consumption by the fix step below, produce structured JSON alongside the Markdown report:

```json
{
  "audit": {
    "file": "Design Consistency 2026",
    "fileKey": "<read from .figma-keys.json>",
    "nodeId": "10939-12809",
    "timestamp": "2026-03-26T14:30:00Z",
    "summary": {
      "total": 12,
      "p0": 3,
      "p1": 5,
      "p2": 4,
      "tokenCompliance": 0.78,
      "componentCount": { "library": 14, "adHoc": 3 }
    },
    "findings": [
      {
        "id": 1,
        "severity": "P0",
        "confidence": 0.95,
        "category": "token-usage",
        "finding": "Button uses hardcoded #0550DC instead of theme-primary variable",
        "node": "Frame 1 > Button > Fill",
        "nodeId": "1234:5678",
        "expected": "Bound to variable theme-primary (key: a256...)",
        "actual": "Hardcoded fill #0550DC",
        "rule": "Style check: zero hardcoded hex values",
        "fix": "Bind theme-primary variable to fill property",
        "fixType": "bind-tokens",
        "autoFixable": true
      }
    ]
  }
}
```

The `fixType` field classifies fixes:
- `swap-instance` — Replace ad-hoc element with library component
- `bind-tokens` — Bind variable/style to property
- `align-variant` — Switch to correct variant
- `compose-from-primitives` — Build from library primitives
- `blocked` — Cannot be auto-fixed (needs design decision)

The `autoFixable` field: `true` for swap-instance, bind-tokens, align-variant; `false` for compose-from-primitives and blocked.

---

<!-- This skill can be invoked directly (/design-audit) or via the DS companion. -->

## Fixing findings

After presenting the audit report, the user can ask to fix findings directly:
- `"fix #3"` — fix a specific finding
- `"fix all auto-fixable"` — batch fix all findings where `autoFixable: true`
- `"fix the hardcoded blue on the login button"` — free-text description

### Fix types

**swap-instance:** Replace ad-hoc element with correct library component.
1. Identify target node via node ID from audit
2. Find correct component via `search_design_system`
3. Import: `figma.importComponentByKeyAsync(key)`
4. Create instance, position at original location
5. Copy text content from original, delete original

**bind-tokens:** Bind a variable or style to a node property.
1. Import variable: `figma.variables.importVariableByKeyAsync(key)`
2. Bind to fill, or import style and assign `node.fillStyleId = style.id`
3. Call `setExplicitVariableModeForCollection` on nearest ancestor (ghost mode prevention)

**align-variant:** Switch instance to correct variant.
1. Read current properties: `instance.componentProperties`
2. Set correct variant: `instance.setProperties({ "Property": "Value" })`

**compose-from-primitives:** Build from library primitives when no single component matches.
1. Import required primitives via `search_design_system`
2. Create container with auto-layout, compose primitives, position at original location, delete original

**blocked:** Cannot be auto-fixed. Present details and explain why manual intervention is needed.

### Verification

After every fix:
1. `get_screenshot` on the fixed node
2. Compare against expected state
3. Report: `✓ Finding #3 fixed (bind-tokens): Bound theme-primary to Button fill`
4. On failure: `✗ Finding #3 failed: [reason]. Manual review needed.`

### Batch mode

When "fix all auto-fixable":
1. Filter findings where `autoFixable: true`
2. Sort by severity (P0 first)
3. Apply fixes sequentially (never parallel `use_figma`)
4. Report: "Fixed N/M findings. K blocked."

