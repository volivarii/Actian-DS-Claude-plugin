# Generate Flow Eval Results — Iteration 2

Run date: 2026-03-27

## Category B — Inference (evals 12-15)

| Eval | Process | Inference | Screens | Components | Config | Content | Avg |
|---|---|---|---|---|---|---|---|
| 12 gf-infer-admin | 5 | 5 | 5 | 5 | 5 | — | 5.0 |
| 13 gf-infer-explorer | 5 | 5 | 5 | 4 | 4 | — | 4.6 |
| 14 gf-infer-studio | 5 | 5 | 4 | 4 | — | — | 4.5 |
| 15 gf-ambiguous | 5 | 5 | — | — | — | 4 | 4.7 |
| **Category avg** | **5.0** | **5.0** | **4.7** | **4.3** | **4.5** | **4.0** | **4.7** |

**Verdict:** Inference is strong. No skill changes needed.

## Category C — Screen Coverage (evals 16-19)

| Eval | Process | Inference | Screens | Components | Config | Forms | Content | Custom | Avg |
|---|---|---|---|---|---|---|---|---|---|
| 16 form-states | 5 | 5 | 5 | 4 | 4 | 5 | 5 | — | 4.7 |
| 17 table-interaction | 5 | 5 | 4 | 4 | 4 | 5 | 4 | — | 4.4 |
| 18 multi-step-wizard | 5 | 4 | 4 | 5 | 4 | 5 | 5 | 5 | 4.6 |
| 19 empty-first-use | 5 | 4 | 4 | 4 | 3 | — | 4 | — | 4.0 |
| **Category avg** | **5.0** | **4.5** | **4.3** | **4.3** | **3.8** | **5.0** | **4.5** | **5.0** | **4.4** |

**Weakest dimension:** Component config (3.8)

## Category D — Component Accuracy (evals 20-22)

| Eval | Process | Inference | Screens | Components | Config | Forms | Content | Avg |
|---|---|---|---|---|---|---|---|---|
| 20 component-form | 5 | 4 | 4 | 4 | 4 | 5 | 5 | 4.4 |
| 21 component-table | 5 | 5 | 4 | 5 | 4 | 5 | 5 | 4.7 |
| 22 component-feedback | 5 | 4 | 4 | 4 | 3 | — | 4 | 4.0 |
| **Category avg** | **5.0** | **4.3** | **4.0** | **4.3** | **3.7** | **5.0** | **4.7** | **4.4** |

**Weakest dimension:** Component config (3.7) — same pattern as Category C

**Key finding from eval 22:** FM Alert is a "phantom component" — listed in flow-html-reference.md and fm-css-reference.md but absent from fm-components.md (no Figma component key). Works for HTML preview but fails at Figma output. Toast vs Alert distinction is handled correctly by reference docs.

## Recurring Issues

### P1 — FM Library documentation gaps (FIXED in flow-html-reference.md)

1. **FM Text input has no Error variant** — FIXED: added "Error states on form inputs" section with HTML + Figma workarounds
2. **FM Alert/Banner/Dialog are HTML-only** — FIXED: split into "Figma library components" vs "HTML-only components" tables with Figma workarounds
3. **FM Dropdown has no text overrides documented** — FIXED: variant table now shows which components have text overrides
4. **FM Empty State variants undifferentiated** — FIXED: table notes "Default = centered icon + text, Variant2 = compact"
5. **FM Toggle needs label pairing** — FIXED: added "Component pairing patterns" section with fm-custom-toggle-row
6. **Toast vs Alert confusion** — FIXED: added "Feedback component selection guide" table

## Category G — Component Configuration (evals 31-34)

| Eval | Process | Inference | Components | Config | Content | Avg |
|---|---|---|---|---|---|---|
| 31 button-variants-icons | 4 | 3 | 4 | 2 | 4 | 3.4 |
| 32 tabs-configuration | 4 | 4 | 4 | 2 | 3 | 3.4 |
| 33 navigation-items | 5 | 4 | 5 | 4 | 4 | 4.4 |
| 34 input-states | 4 | 3 | 3 | 3 | 4 | 3.4 |
| **Category avg** | **4.3** | **3.5** | **4.0** | **2.8** | **3.8** | **3.7** |

**Fixes applied after this round:**
- Added "FM Kit limitations vs DS2026" section (button icons, destructive, input errors)
- Added "Input state guide" (Empty vs Placeholder vs Default vs Disabled)
- Added "Setting text on components without text overrides" (findOne pattern)
- Fixed FM Tab note about missing text overrides

## Category E — Forms Layout (evals 23-24)

| Eval | Process | Inference | Screens | Components | Forms | Content | Avg |
|---|---|---|---|---|---|---|---|
| 23 forms-480px-rule | 4 | 3 | 4 | 4 | 3 | 4 | 3.7 |
| 24 extended-elements | 4 | 4 | 4 | 3 | 3 | 4 | 3.7 |
| **Category avg** | **4.0** | **3.5** | **4.0** | **3.5** | **3.0** | **4.0** | **3.7** |

**Key finding:** Forms layout scored 3.0 — agents struggle to classify elements as "simple" (480px) vs "extended" (full-width) when they're mixed on the same screen.

## Category F — Custom Elements (eval 25)

| Eval | Process | Inference | Screens | Components | Custom | Content | Avg |
|---|---|---|---|---|---|---|---|
| 25 custom-chart | 4 | 3 | 3 | 3 | 4 | 3 | 3.3 |

**Key finding:** Custom element rules are well-specified (prefix, vars, lo-fi). Main weakness: skill assumes action flows, not dashboard/viewing flows — screen planning doesn't fit read-only pages well.

## Category H — Content Quality (eval 27)

| Eval | Process | Inference | Config | Content | Avg |
|---|---|---|---|---|---|
| 27 contextual-copy | 4 | 5 | 4 | 3 | 4.0 |

**Key finding:** Skill says "be contextual" but lacks examples showing the spectrum from generic ("Save") to truly contextual ("Schedule refresh"). Principle-based, not example-driven.

## Category I — Edge Cases (evals 28-30)

| Eval | Process | Inference | Avg |
|---|---|---|---|
| 28 minimal-prompt | 5 | 5 | 5.0 |
| 29 two-subflows | 4 | 3 | 3.5 |
| 30 reference-image | 4 | 4 | 4.0 |
| **Category avg** | **4.3** | **4.0** | **4.2** |

**Key findings:**
- Eval 28: Perfect — skill literally uses "create a flow" as its pause example
- Eval 29: Role-to-app-context mapping (requester=Explorer, approver=Admin) requires Actian domain knowledge not in the skill
- Eval 30: "Reference mentioned but not attached" isn't explicitly handled

---

## Grand Summary — All 21 Evals

| Category | Evals | Avg Score | Weakest Dimension |
|---|---|---|---|
| B — Inference | 12-15 | **4.7** | Content (4.0) |
| C — Screen Coverage | 16-19 | **4.4** | Component config (3.8) |
| D — Component Accuracy | 20-22 | **4.4** | Component config (3.7) |
| E — Forms Layout | 23-24 | **3.7** | Forms layout (3.0) |
| F — Custom Elements | 25 | **3.3** | Inference/screens (3.0) |
| G — Component Config | 31-34 | **3.7** | Component config (2.8) |
| H — Content Quality | 27 | **4.0** | Content (3.0) |
| I — Edge Cases | 28-30 | **4.2** | Inference (4.0) |
| **Overall** | **21** | **4.0** | **Component config (3.3)** |

### Dimension averages across all evals

| Dimension | Avg | Status |
|---|---|---|
| Process | **4.6** | Strong |
| Inference | **4.2** | Good |
| Screen coverage | **4.1** | Good |
| Component accuracy | **4.0** | Good |
| Forms layout | **4.3** | Good (when tested) |
| Content quality | **4.1** | Good |
| Custom elements | **4.5** | Strong (when tested) |
| **Component config** | **3.3** | **Weakest — primary improvement target** |

### Fixes applied during this iteration

1. Full variant/text override table for all 25 FM components
2. HTML-only vs Figma library component split
3. Error states on form inputs (HTML + Figma workarounds)
4. Feedback component selection guide (Toast vs Alert vs Banner vs Dialog)
5. Component pairing patterns (label + input, label + toggle, etc.)
6. FM Kit limitations vs DS2026 (icons, destructive)
7. Input state guide (Empty vs Placeholder vs Default vs Disabled)
8. Text override workaround for components without named properties

### Skill-level fixes applied (round 2)

1. **Detail view pattern guide** — SKILL.md now has full page / side panel / expanded row decision table (eval 17)
2. **Dashboard/viewing flow template** — Step 3 now has separate screen templates for action flows vs viewing/dashboard flows (eval 25)
3. **Role-to-app-context mapping** — SKILL.md Step 1 now has inference guide table mapping signals to Admin/Studio/Explorer + multi-role guidance (eval 29)
4. **"Reference mentioned but not attached"** — Step 1 now explicitly says to ask for the reference before proceeding (eval 30)
5. **Content quality examples** — Step 4 now has a generic-vs-contextual comparison table for all text elements (eval 27)
6. **Extended element classification** — flow-html-reference.md Forms Layout now has a two-column table classifying 14 element types as 480px or full-width (evals 23-24)
