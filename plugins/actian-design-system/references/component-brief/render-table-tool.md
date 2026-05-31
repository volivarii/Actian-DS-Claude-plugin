# renderTable tool — reference

> **Status: REQUIRED (v1.73.0).** This tool is the canonical path
> for every table-shaped surface in a component brief. **ALWAYS**
> invoke `render-figma.js` via the Bash CLI pattern below. **NEVER**
> inline token-table construction directly in
> `mcp__claude_ai_Figma__use_figma` — the v1.70.x retry loop produced
> five separate patches against the inlined-construction failure
> mode (cells crushed to 1px) and the v1.72.1 eval lane measured
> inter-run variance on identical inputs. **FAILURE to invoke this
> tool reproduces a known regression** that doc-layer fixes cannot
> resolve.
>
> Pattern 3 (`appendTokenTagCell`) and Pattern 4 (color grid) remain
> in `push-patterns.md` per `MIGRATIONS.md` Rule 1 (parallel change),
> but they are fallback documentation only — not the canonical
> rendering path. New brief generation MUST go through this tool.
> The eval lane A8 assertion measures invocation rate per fixture
> (`evals/component-brief/grader.md`). The v1.73.0 ship gate
> requires every per-measurement file (`--runs 5` × 2 fixtures =
> 10 grading.json files) to report adoption rate ≥ 80%.
>
> **NEVER rename the `Table (renderTable)` frame name** that
> `render-figma.js` emits. The eval lane A8 assertion uses strict
> string equality on this exact name as the diagnostic that the
> interpreter ran. The v1.73.0 eval measured 7/10 runs renaming
> the table frame with descriptive suffixes (e.g.
> `"Anatomy parts table (renderTable)"`,
> `"Table (renderTable) — Sizing"`), breaking the gate even
> though the interpreter ran in all 10 runs. v1.73.1 makes this
> rule explicit: pass the emitted JS **verbatim** into
> `mcp__claude_ai_Figma__use_figma`. Do NOT edit. Do NOT
> interpolate. Do NOT add suffixes. If you want to label the
> table for the canvas, set the name on the *parent sub-frame*
> (e.g. the Tokens sub-frame's heading), not on the renderTable
> frame.

**Intended scope (when adoption is proven):** every table-shaped surface in a component brief — the Sizing, Color, and Typography token tables in the Tokens sub-frame, and the Anatomy parts table in the Anatomy sub-frame.

The driving design spec lives as a working artifact (untracked per the project's no-commit-specs convention).

---

## Why a tool, not a markdown pattern

The v1.70.0–v1.70.4 retry loop landed five separate patches against the same recurring bug — token-tag cells crushed to 1px height across multiple table surfaces. Each patch missed because the AI was inlining table construction from prose patterns and improvising layout math (cell wrappers with `layoutMode = "NONE"`, absolute-positioned children at negative `y`, and so on). The improvisation surface was unbounded.

The renderTable tool moves table rendering out of the AI's improvisation surface and into a deterministic interpreter. The AI emits a domain-level JSON spec (cells are `text`, `token-pill`, `code`, `badge`, `color-swatch`, or `empty` — never `layoutMode`); the interpreter handles all sizing, autolayout, and font math. The same spec drives a Figma interpreter (`render-figma.js`) and an HTML interpreter (`render-html.js`), so the brief preview and the Figma push stay in lockstep.

For background see the design spec linked at the top.

---

## Spec shape

Top-level fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| `schemaVersion` | string | yes | Pin to `"2026.05"` (calendar versioned). The interpreter handles backward-compat for older shapes. |
| `headers` | string[] | yes | Column labels. Length determines column count. |
| `rows` | object[] | yes | Each row has a `cells` array whose length must match `headers.length`. |
| `columnAlignments` | string[] | no | Per-column `"left" \| "center" \| "right"`. Defaults to `"left"`. |
| `footnotes` | object[] | no | `{ ref, text }` entries. Referenced from `row.footnoteRef`. |

Row shape:

```json
{
  "cells": [...],          // length === headers.length
  "footnoteRef": "*"       // optional; must match a footnotes[].ref
}
```

Cell discriminator types (the `type` field always comes first):

- **`text`** — `{ type, value, weight? }` — `weight` is `"regular"` (default) or `"semibold"`.
- **`token-pill`** — `{ type, value }` — `value` must start with `--zen-` and exists in `vendor/tokens/tokens.json`.
- **`code`** — `{ type, value }` — rendered in Fira Code monospace.
- **`badge`** — `{ type, variant, label? }` — `variant` is `req | opt | draft | stub | canonical`.
- **`color-swatch`** — `{ type, color, tokenName?, hex? }` — `color` is the swatch dot fill (hex `#RRGGBB`); `tokenName` optionally renders a token-pill above the hex line.
- **`empty`** — `{ type }` — placeholder when a cell has no content but the column-count must be preserved.

`additionalProperties` is **false** at every level. Stray fields fail boundary validation.

---

## Invocation

The interpreter ships as a Node CLI. The AI calls it via Bash, captures stdout, and passes the emitted JS to `mcp_use_figma`.

**Use the project's standard Node-resolution pattern** — bare `node` fails on Claude Desktop (Node is not on `PATH`) and is blocked by a PreToolUse hook (`scripts/hooks/check-bare-node.sh`). Always source `resolve-node.sh` and use `$NODE_BIN` in the same Bash call:

```bash
# stdin form (one Bash call — source MUST be in the same call as the node invocation)
echo "$SPEC_JSON" | (
  source "$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh" &&
  "$NODE_BIN" "$CLAUDE_PLUGIN_ROOT/scripts/renderers/figma-table/render-figma.js" \
    --parent-id "<contentSlotId>"
)

# file form
source "$CLAUDE_PLUGIN_ROOT/scripts/lib/resolve-node.sh" && \
  "$NODE_BIN" "$CLAUDE_PLUGIN_ROOT/scripts/renderers/figma-table/render-figma.js" \
    --spec /tmp/spec.json --parent-id "<contentSlotId>"
```

`$CLAUDE_PLUGIN_ROOT` is set by the Claude harness to the plugin's installed root. Do not substitute `$PLUGIN_ROOT` — that variable is unset in skill invocations and the path will resolve to `/scripts/...`.

**Output contract:**

- **Success:** stdout is the Plugin API JS code; stderr has a `{ ok: true, manifest: {...} }` block; exit 0.
- **Invalid spec:** stdout is empty; stderr is `{ ok: false, errors: [{ path, message, suggestion }] }`; exit 1.

The error report is structured. On a validation failure the AI corrects the spec and re-runs the tool — never edit the emitted JS directly.

The HTML preview is produced by the sister script `render-html.js` from the same spec; the brief renderer wires it in automatically (no AI invocation needed for the preview path — that part is already proven working).

---

## Boundary validator

Before emitting JS, the interpreter validates:

- JSON Schema conformance (shape, required fields, enum values).
- `additionalProperties: false` on spec root, rows, footnotes, and every cell discriminator.
- Token names (`token-pill.value`, `color-swatch.tokenName`) against `vendor/tokens/tokens.json`.
- Cell-count per row matches `headers.length`.
- Every `row.footnoteRef` resolves to a `footnotes[].ref` entry.

Errors include a `path` (e.g. `rows[0].cells[1].value`), a human message, and (where helpful) a `suggestion` field. Treat them as a tight retry loop: read the error, fix the spec, re-run.

---

## Worked examples

### Sizing tokens table

```json
{
  "schemaVersion": "2026.05",
  "headers": ["Property", "Token", "Value"],
  "rows": [
    {
      "cells": [
        { "type": "text", "value": "Box width" },
        { "type": "token-pill", "value": "--zen-spacing-lg" },
        { "type": "text", "value": "24px" }
      ]
    },
    {
      "cells": [
        { "type": "text", "value": "Corner radius" },
        { "type": "token-pill", "value": "--zen-border-radius-xs" },
        { "type": "text", "value": "2px" }
      ]
    }
  ]
}
```

### Color tokens grid

For grid-shaped color layouts (one row per state, multiple swatch columns), use `color-swatch` cells. The interpreter renders each as a 12×12 dot + token-pill (if `tokenName` is set) + hex line.

```json
{
  "schemaVersion": "2026.05",
  "headers": ["State", "Background", "Foreground", "Border"],
  "rows": [
    {
      "cells": [
        { "type": "text", "value": "Default", "weight": "semibold" },
        { "type": "color-swatch", "color": "#0F5FDC", "tokenName": "--zen-color-bg-emphasis" },
        { "type": "color-swatch", "color": "#FFFFFF", "tokenName": "--zen-color-fg-on-emphasis" },
        { "type": "color-swatch", "color": "#0F5FDC", "tokenName": "--zen-color-border-emphasis" }
      ]
    }
  ]
}
```

### Typography tokens table

```json
{
  "schemaVersion": "2026.05",
  "headers": ["Element", "Token", "Style"],
  "rows": [
    {
      "cells": [
        { "type": "text", "value": "Label" },
        { "type": "token-pill", "value": "--zen-typography-body-md" },
        { "type": "text", "value": "Inter 400 14px / 20px" }
      ]
    }
  ]
}
```

### Anatomy parts table

Use `badge` cells for REQ / OPT markers and `footnotes` for state-only parts (focus ring, hover surface) per the v1.70.0+ Anatomy convention.

```json
{
  "schemaVersion": "2026.05",
  "headers": ["#", "Part", "Required", "Notes"],
  "rows": [
    {
      "cells": [
        { "type": "text", "value": "1", "weight": "semibold" },
        { "type": "text", "value": "Container" },
        { "type": "badge", "variant": "req" },
        { "type": "text", "value": "" }
      ]
    },
    {
      "cells": [
        { "type": "text", "value": "2" },
        { "type": "text", "value": "Focus ring" },
        { "type": "badge", "variant": "opt" },
        { "type": "text", "value": "Renders only in :focus-visible" }
      ],
      "footnoteRef": "*"
    }
  ],
  "footnotes": [
    { "ref": "*", "text": "State-only — not visible in the Default state shown above." }
  ]
}
```

---

## Anti-patterns (the validator will reject these)

- Setting `layoutMode`, `primaryAxisSizingMode`, `counterAxisSizingMode`, or any other Figma vocabulary in the spec — those decisions belong to the interpreter, not the AI.
- Adding cell fields the schema doesn't allow (e.g. `color` on a `text` cell, or `width` on any cell). Cell sizing is centrally controlled.
- Inlining row construction or `appendTokenTagCell` calls outside the tool. The helper is gone; use `token-pill` cells instead.
- Using `text` cells with embedded HTML / Markdown to fake a token pill or badge. The discriminator types exist for this reason.
- Inventing column headers or row counts that don't appear in the brief data. The card data model upstream determines structural decisions; the spec only renders them.

---

## What this tool does NOT replace

Other patterns in `push-patterns.md` continue to apply unchanged for non-table surfaces:

- Pattern 1 (Card Shell), Pattern 2 (Section Header) — card scaffolding.
- Pattern 5 (Do/Don't pairs), Pattern 6 (Accessibility), Pattern 7 (Bullet rows).
- Pattern 8 (Variant Instance) and the Variation matrix — `renderVariationMatrix` (Phase 3) will eventually replace this; until then the markdown pattern stands.
- Pattern 9 (Anatomy diagram) — the badge + leader-line algorithm is reasoning-heavy and stays prose; the **parts table inside it** comes through `renderTable` per the example above.
- Pattern 14 (Specs Redline) — `renderSpecsRedline` (Phase 2) will replace this.
- Patterns 10 (Contrast Table Row), 11 (ARIA Spec Row) — reuse `renderTable` once Phase 1 is smoke-clean.

---

## Source files

- Schema: `scripts/renderers/figma-table/schemas/render-table.json`
- Figma interpreter + validator: `scripts/renderers/figma-table/render-figma.js`
- HTML interpreter: `scripts/renderers/figma-table/render-html.js`
- Tests: `tests/renderers/figma-table.test.js`
