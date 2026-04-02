# Design Audit — Evidence Standard, Fix Types, and JSON Output

## Confidence scores

Every finding must include a confidence score (0.0-1.0):

| Score | Meaning | When to use |
|-------|---------|------------|
| 0.9-1.0 | Certain | Token value directly visible in `get_design_context` output, contrast ratio calculated |
| 0.7-0.8 | High | Structure strongly suggests violation (e.g., frame without auto-layout, text without style binding) |
| 0.5-0.6 | Medium | Inferred from screenshot or partial data (e.g., color looks off but hex not extractable) |
| 0.3-0.4 | Low | Based on naming conventions or indirect evidence only |
| 0.0-0.2 | Speculative | Flagged for manual review, insufficient data to confirm |

## Evidence standard

Every finding must cite what structure in the design proves the violation:

- **What:** The specific node/layer name and ID where the issue exists
- **Expected:** What the design system rule requires (quote the rule)
- **Actual:** What was observed (include hex values, pixel values, or node properties from `get_design_context`)
- **Why it matters:** Impact on users, consistency, or maintenance

Findings without evidence are not findings — they are guesses. If you cannot extract enough data to support a finding at confidence >= 0.5, add it to a "Needs manual review" section instead of the main findings table.

## JSON output format

When the user requests JSON output or for programmatic consumption by the fix step:

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

## Fix types

### swap-instance
Replace ad-hoc element with correct library component.
1. Identify target node via node ID from audit
2. Find correct component via `search_design_system`
3. Import: `figma.importComponentByKeyAsync(key)`
4. Create instance, position at original location
5. Copy text content from original, delete original

### bind-tokens
Bind a variable or style to a node property.
1. Import variable: `figma.variables.importVariableByKeyAsync(key)`
2. Bind to fill, or import style and assign `node.fillStyleId = style.id`
3. Call `setExplicitVariableModeForCollection` on nearest ancestor (ghost mode prevention)

### align-variant
Switch instance to correct variant.
1. Read current properties: `instance.componentProperties`
2. Set correct variant: `instance.setProperties({ "Property": "Value" })`

### compose-from-primitives
Build from library primitives when no single component matches.
1. Import required primitives via `search_design_system`
2. Create container with auto-layout, compose primitives, position at original location, delete original

### blocked
Cannot be auto-fixed. Present details and explain why manual intervention is needed.

## Verification (after every fix)

1. `get_screenshot` on the fixed node
2. Compare against expected state
3. Report: "Finding #3 fixed (bind-tokens): Bound theme-primary to Button fill"
4. On failure: "Finding #3 failed: [reason]. Manual review needed."

## Batch mode ("fix all auto-fixable")

1. Filter findings where `autoFixable: true`
2. Sort by severity (P0 first)
3. Apply fixes sequentially (never parallel `use_figma`)
4. Report: "Fixed N/M findings. K blocked."
