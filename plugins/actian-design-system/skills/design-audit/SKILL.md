---
name: design-audit
description: Audit a Figma design against DS rules — tokens, spacing, a11y, component usage, copy, heuristic UX. Finds inconsistencies and can fix specific findings.
argument-hint: "[Figma URL] [--scope copy|tokens|a11y|heuristic|all] [--fix <id|all>] [--no-prompt]"
---

# Design System Audit

Audit a Figma file or section against the Actian Design System 2026 and/or Fat Marker conventions. Determine which library the file uses (FM = Workflow A, DS Kit = Workflow B), then apply corresponding rules.

> **Always pass `skillNames: "figma-use"` on every `mcp__claude_ai_Figma__use_figma` invocation.** This is mandatory per Figma's official contract — the `figma-use` skill carries the load-bearing Plugin API rules (atomic-on-error, color 0–1 range, HUG-after-append, font preload, await-all-promises, page-context-reset, return-all-IDs, explicit `variable.scopes`). Skipping it produces hard-to-debug failures.
> (Source: https://help.figma.com/hc/en-us/articles/39287396773399)

## Flags

| Flag | Type | Default | Behavior |
|------|------|---------|----------|
| `--scope <list>` | string list | `all` | Limits findings to a subset: `copy`, `tokens`, `a11y`, `heuristic`, `all`. Multi-value supported (`--scope copy,tokens`). `heuristic` is a new finding category covering UX principles, IA clarity, task efficiency — full implementation is engine work; for now, surfaces a placeholder section in the report. |
| `--fix <id\|all>` | string | none | Auto-applies fixes. `id` = single finding number (e.g., `--fix 3`). `all` = all P0 + P1 findings where `autoFixable: true`. Without `--fix`, the audit reports without modifying the design (passive audit is the default). |
| `--no-prompt` | boolean | false | Skip the interactive scope + fix gates (Step 0.5 + Step 5.5). Use defaults for any unset flags. See `references/ds-rules/interactive-gates.md`. |

## Step 0 — Parse args

Parse args. Note whether `--scope`, `--fix`, and `--no-prompt` were explicitly passed. The `--no-prompt` flag is parsed via `scripts/lib/parse-no-prompt.js`.

## Step 0.5 — Scope gate (interactive)

**Skipped if:** `--scope` is explicitly passed OR `--no-prompt` is set.

Otherwise, present this prompt verbatim before running any audit checks:

```
Audit scope for <target>:

  all (default) — copy + tokens + a11y + heuristic
  copy          — content guidelines, banned terms, label patterns
  tokens        — color/spacing/radius binding, hardcoded values
  a11y          — WCAG 2.1 AA, contrast, ARIA, keyboard
  heuristic     — UX patterns, layout, intent

Reply: scope name, comma-separated list, or enter for all.
Examples:
  copy
  copy,a11y
  tokens
```

Parser:
- Empty / "all" → `--scope all`
- One token from {copy, tokens, a11y, heuristic} → `--scope <token>`
- Comma-separated list of valid tokens → `--scope <list>`
- Invalid token → re-prompt with the valid set
- 3 retries → abort with: "Aborting. Run again with `--no-prompt` to use scope=all, or `--scope <list>` to set directly."

## Pipeline

1. Parse URL → extract `fileKey` + `nodeId` (per `../../references/figma/figma-output.md`)
2. Classify node via `use_figma` (see figma-output.md) → get type, name, children. Route: if PAGE/SECTION/GROUP, pick the target frame/component from children.
3. `get_screenshot` of resolved target → visual reference
4. `get_design_context` on resolved target → inspect tokens, typography, spacing, components
5. Check each dimension below → structured report with severity (P0/P1/P2)
6. Present findings to user
7. **Step 5.5 — Fix gate** (see below) → resolve `--fix` value
8. Apply fixes per resolved value

## What to check

When `--scope` is set, run only the listed dimensions; otherwise run all.

- **Component guidelines** (scope: `tokens`, `all`): Read `../../vendor/components/guidelines/<slug>.json` for per-component content/design rules
- **Component consistency** (scope: `tokens`, `all`): FM-prefixed components used consistently, no detached instances or ad-hoc recreations, names match catalog (`../../vendor/components/fm-components.md`)
- **Token usage** (scope: `tokens`, `all`): No hardcoded hex colors, typography uses Inter (FM) or Roboto (DS Kit) text style tokens, spacing on scale (4/8/12/16/24/28/32), border radius uses radius tokens
- **Flow structure** (scope: `all`): Dark cover card with Feature/Flow/User, screen naming `[Persona] - [Page] - [State]`, 1440x960 or 1440x700, left-to-right reading order
- **Forms layout** (scope: `all`): Simple inputs 480px max-width, extended elements full-width, action footer sticky bottom with primary right
- **Missing states** (scope: `heuristic`, `all`): Empty, error, loading, confirmation states; form validation, disabled, required indicators
- **Accessibility** (scope: `a11y`, `all`): WCAG AA contrast, visible focus states, no text below 11px
- **Copy review** (scope: `copy`, `all`): Sentence case, action-oriented CTA verbs, no jargon, terminology consistent with `vendor/app-context/app-context.json` glossary, error messages explain what to do next
- **Heuristic UX** (scope: `heuristic`, `all`) — *placeholder, full impl is engine work*: Surface a section in the report titled "Heuristic findings (preview)" describing IA clarity, task efficiency, and feedback patterns. Findings here are advisory until the engine work lands.

## Output format

```
## Audit: [File/Section Name]

### Summary
- X issues found: Y critical, Z warnings
- Token compliance: [percentage]

### Findings
| # | Severity | Confidence | Finding | Rule | Fix |
|---|----------|------------|---------|------|-----|
| 1 | P0 | 0.95 | Button uses hardcoded #0550DC | Zero hardcoded hex | Bind theme-primary variable |
```

## Step 5.5 — Fix gate (interactive)

**Skipped if:** `--fix` is explicitly passed OR `--no-prompt` is set OR no findings to fix.

Otherwise, after presenting findings, present this prompt verbatim:

```
N findings (P0: A, P1: B, P2: C). Fix?

  skip (default) — report only, no edits
  N              — fix finding number N (e.g. "3")
  all            — fix all auto-fixable findings (P0 + P1)

Reply: skip / N / all
```

Parser:
- Empty / "skip" → no fixes (exit cleanly with the report)
- Integer matching a finding number → `--fix <N>`
- "all" → `--fix all`
- Invalid → re-prompt
- 3 retries → abort with: "Aborting. Run again with `--no-prompt` to skip fixes, or `--fix N|all` to set directly."

## Fixing findings (flag form)

The user can also request fixes via prose or flags directly:
- `--fix 3` or `"fix #3"` — fix a specific finding
- `--fix all` or `"fix all auto-fixable"` — batch fix all `autoFixable: true` findings (P0 + P1)
- Free-text: `"fix the hardcoded blue on the login button"`

Fix types, evidence standard, confidence scores, JSON output format, and verification procedure: see `../../references/design-audit/evidence-and-fixes.md`.

## Key rules

- Every finding needs evidence: node ID, expected value, actual value, rule quoted
- Findings below confidence 0.5 go to "Needs manual review" section
- Batch fixes run sequentially (never parallel `use_figma`), P0 first

## References

- `references/design-audit/evidence-and-fixes.md` — confidence scores, evidence standard, JSON output, fix types, verification
- `references/figma/figma-output.md` — Figma URL parsing, token binding
- `references/ds-rules/quality-checklist.md` — cleanup pass checklist
- `references/figma/parity-check.md` — post-fix verification
