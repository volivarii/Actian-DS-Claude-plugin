# Figma Plugin API Traps

Methods, properties, and patterns that throw, silently fail, or don't
exist inside `use_figma`. Use this as a checklist when reviewing push
patterns.

Source: `figma-use/references/api-reference.md` (canonical) + Actian
Sprint 1b PR-A audits (commits 98fa34e, 13a087d, a93f28a, 9c0fd71,
4efc89b on `main`).

---

## Methods that don't exist (throw on call)

| Method | What to use instead |
|---|---|
| `figma.getLocalComponents()` | `figma.currentPage.findAll(n => n.type === 'COMPONENT')` |
| `figma.getLocalComponentsAsync()` | `figma.currentPage.findAll(n => n.type === 'COMPONENT')` |
| `figma.getLocalComponentSetsAsync()` | `figma.currentPage.findAll(n => n.type === 'COMPONENT_SET')` |
| `figma.notify(...)` | (no-op — not supported in `use_figma`) |
| `figma.showUI(...)` | (no-op — `use_figma` has no UI surface) |
| `figma.openExternal(...)` | (no-op — return URLs in the response instead) |
| `figma.loadAllPagesAsync()` | Use `setCurrentPageAsync(page)` per page |
| `figma.variables.extendLibraryCollectionByKeyAsync(...)` | Not supported |
| `figma.teamLibrary.*` | Not supported in `use_figma` (use `getNodeByIdAsync` + key-based imports) |

## Setters that throw

| Setter | What to use instead |
|---|---|
| `figma.currentPage = page` | `await figma.setCurrentPageAsync(page)` |

## Properties that are NOT bindable to variables

`setBoundVariable(field, variable)` silently fails or throws on these
fields. Set them as direct values resolved from the token registry.

| Field | Why | Workaround |
|---|---|---|
| `cornerRadius` | Unified field not bindable | Bind `topLeftRadius`, `topRightRadius`, `bottomLeftRadius`, `bottomRightRadius` individually |
| `fontSize` | Not in the bindable-fields list | Set as literal: `text.fontSize = 14;` |
| `fontWeight` | Not in the bindable-fields list | Set as literal via `fontName.style` (e.g. `"Medium"`) |
| `lineHeight` | Not in the bindable-fields list | Set as literal: `text.lineHeight = { value: 20, unit: 'PIXELS' };` |

## Auto-layout values that throw

| Field | Forbidden value | Reason |
|---|---|---|
| `counterAxisAlignItems` | `'STRETCH'` | Not supported (use `'CENTER'`, `'MIN'`, `'MAX'`, `'BASELINE'`) |

## Patterns that silently fail

| Pattern | What happens | Fix |
|---|---|---|
| Cross-call `appendChild` | The reparent silently fails; node is orphaned | Build the wrapper first; create+append children IN-CALL via `getNodeByIdAsync(wrapperId)` retrieval |
| `appendChild` without font preload on text-bearing subtree | Throws or produces garbled text | Preload fonts via `findAll(n => n.type === 'TEXT')` + `Promise.all(loadFontAsync)` BEFORE the append (see Rule 8) |
| Unawaited `loadFontAsync` / `setCurrentPageAsync` | Subsequent ops fail with "missing font" / wrong page errors | Always `await` Promise-returning APIs |
| `node.resize()` after setting `primaryAxisSizingMode`/`counterAxisSizingMode` | Resize silently resets sizing modes to FIXED | Call `resize()` first, then set sizing modes; or use `node.set({...})` which auto-orders |
| Returning `{ briefId: x }` or single-ID shapes | Violates Critical Rule 15 | Always return `{ createdNodeIds: [...], mutatedNodeIds: [...] }` |

## Variable mutation gotchas

`setBoundVariableForPaint(paint, field, variable)`,
`setBoundVariableForEffect(effect, field, variable)`,
`setBoundVariableForLayoutGrid(grid, field, variable)` all return NEW
objects. You MUST capture and reassign:

```js
// WRONG — original paint is unchanged
const paint = node.fills[0];
paint.setBoundVariableForPaint(...);  // returns new paint, discarded

// CORRECT
const newPaint = paint.setBoundVariableForPaint(...);
node.fills = [newPaint, ...node.fills.slice(1)];
```

## Plan-dependent limits

- **Variable collection mode count**: Free-tier files cap at fewer modes
  than Org-tier. Pattern 14's per-mode binding can throw on Free files.
- **Variable count per collection**: Plan-dependent; expect up to 1000
  on Org, fewer on Free.

## See also

- `figma-use/SKILL.md` Critical Rules 1-17 in v2.2.3 — the canonical rule
  set. (When citing individual rules elsewhere in the docs, follow the
  topic-leading convention from `references/figma/figma-push-patterns.md`
  `## Critical Rules` — quote the upstream topic, bracket the rule number
  with the version, so renumbering doesn't silently break citations.)
- `figma-use/references/gotchas.md` — full pitfall catalogue with WRONG/
  CORRECT examples
- `references/figma/figma-push-patterns.md` `## Critical Rules` section
