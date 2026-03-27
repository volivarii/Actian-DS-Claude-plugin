# FM Kit vs DS2026 — Component Coverage Report

Compares the Fat Marker wireframe library (31 components) against the DS2026 production library (100 components). The FM Kit is intentionally simpler — it serves broad wireframing, not 1:1 parity.

**Methodology:** For each DS2026 component category, assess whether FM Kit coverage is sufficient for lo-fi wireframing. Flag gaps only when a missing component would force custom elements in common wireframing scenarios.

---

## Coverage summary

| Category | DS2026 components | FM Kit coverage | Verdict |
|---|---|---|---|
| **Action** | Button, Link, Sticky footer | Button, Icon Buttons | Adequate — see findings |
| **Form inputs** | Text input, Dropdown, Calendar, Checkbox, Radio, Toggle, Search, Rich text, Filters | Text input, Text Area, Dropdown, Multi-select dropdown, Date input, Search, Checkbox, Radio, Toggle, Input Label | Strong |
| **Navigation** | Global header, Side nav, Breadcrumbs, Stepper, Tab, Traffic light | App_header, Side nav bar, Side nav item, Tab, Page Header | Adequate — see findings |
| **Data display** | Avatar, Badge, Card, Collapse, Data viz (5 types), Diagram, Page header, Scroll bar, Segmented control, Search result card, Tag (9 types), Table | Badge, Tag, Chip, Table Cell, Placeholder, Page Header | Adequate for wireframing — see findings |
| **Feedback** | Alert/Banner, Empty state (4 types), Loading (4 types), Maintenance banner, Toast | Toast, Empty State, Progress bar | Gaps — see findings |
| **Overlays** | Drawer, Modal, Popover, Tooltip | Tooltip | Gap — see findings |
| **Utility** | — | Sticky note, Cursor, Slider, Menu item, Multi-select menu item | FM-only wireframing helpers |

---

## Findings

### P0 — Missing components that force custom elements frequently

**1. No FM Alert / Banner component**

DS2026 has `Alert-banner` (Primary/Success/Warning/Danger, Horizontal/Vertical). FM Kit has nothing. Every flow with an error message, success banner, or warning notice requires a custom `fm-custom-alert` element.

**Impact:** High — alerts appear in nearly every Standard-tier flow (error states, validation summaries).

**Recommendation:** Add **FM Alert** with 3 variants: `Type: Success / Error / Warning`. Keep it simple — a single-line text container with a left color bar. No icons, no dismiss button. The lo-fi version just needs to visually communicate "this is feedback."

---

**2. No FM Dialog / Modal component**

DS2026 has `Modal` (7 size/type variants). FM Kit has nothing. Every confirmation dialog, destructive action prompt, or quick-edit overlay requires custom construction.

**Impact:** High — confirmation dialogs are in most action flows (delete confirmations, save prompts, approval dialogs).

**Recommendation:** Add **FM Dialog** with 2 variants: `Size: Small / Large`. Small = 450px width (confirmations), Large = 700px (forms in modals). Container with white background, shadow, rounded corners, title text, content area, and action footer. No overlay backdrop needed at lo-fi level.

---

### P1 — Missing components that cause friction in common scenarios

**3. FM Empty State has unclear variants**

DS2026 has 4 distinct empty state types: Empty state (3 sizes), Error state (2 sizes), Confirmation, Maintenance. FM Kit has `FM Empty State` with `Property 1: Default / Variant2` — no description of what these are.

**Impact:** Medium — agents don't know when to use which variant.

**Recommendation:** Rename variants to `Type: Empty / Error` (or add `Type: Compact` if Variant2 is just a size difference). Add a description to the component.

---

**4. No FM Link component**

DS2026 has `Link` (6 states). FM Kit has no standalone link. Inline text links in wireframes are built as plain underlined text.

**Impact:** Low-Medium — links are common but at lo-fi level, underlined text is sufficient. Not worth a separate component.

**Recommendation:** No new component. Document in flow-html-reference.md that inline links use underlined text with `--fm-accent-primary` color.

---

**5. No FM Breadcrumbs component**

DS2026 has `Breadcrumbs`. FM Kit has nothing. Multi-level navigation flows lack hierarchy indication.

**Impact:** Low — breadcrumbs are secondary navigation. FM Page Header (Title + Subtitle) can approximate the hierarchy. Not common enough in wireframes to justify a component.

**Recommendation:** No new component. Use FM Page Header subtitle for hierarchy context.

---

**6. No FM Stepper component**

DS2026 has `Stepper` (4 states). FM Kit has nothing. Multi-step wizard flows (like CSV import, onboarding) can't show step progress.

**Impact:** Medium — wizard flows are a common wireframing pattern and the eval suite (eval 18) showed this as a gap.

**Recommendation:** Add **FM Stepper** with 3 step states: `State: Active / Complete / Upcoming`. Horizontal layout with numbered circles and connecting lines. Keep lo-fi — circles with numbers and a line between them.

---

### P2 — Variant gaps on existing FM components

**7. FM Button — no Icon or Destructive axis**

DS2026 Button has `Icon: Default/Leading/Trailing/Only` and `Destructive: True/False`. FM Button has neither.

**Impact:** Medium — eval 31 scored Component Config at 2 because of this. Leading icons on buttons and destructive styling are common requests.

**Recommendation:** Don't add full Icon/Destructive axes (too complex for lo-fi). Instead:
- Add **FM Button** variant `Type: Destructive` (red-tinted outline button) — 1 new variant value
- For icons, document the `fm-custom-button-with-icon` workaround already in flow-html-reference.md. Icon buttons are covered by FM Icon Buttons.

---

**8. FM Toggle — no Disabled style**

DS2026 Toggle has `State: Disabled`. FM Toggle has `Style: Default` only.

**Impact:** Low — disabled toggles appear in settings flows. Can approximate with reduced opacity.

**Recommendation:** Add `Style: Disabled` to FM Toggle. Minimal effort — grey out the existing component.

---

**9. FM Tab — no text override**

DS2026 Tab has `Label text` override. FM Tab has no documented text override property.

**Impact:** Medium — every tab instance needs `findOne` workaround to set text. Eval 32 scored Config at 2.

**Recommendation:** Add a `Label` text property to FM Tab so text can be set via component properties instead of digging into nested layers.

---

**10. FM Table Cell — no text override**

Same issue as Tab. DS2026 Table has explicit text overrides. FM Table Cell has none documented.

**Recommendation:** Add text override properties: `Header Text` for Header variant, `Cell Text` for Text variant, `Pill Text` for Pill variant.

---

**11. FM Toast — no Success/Error distinction**

DS2026 Notification has `Type: Default / Critical`. FM Toast has `Style: Standard / Outline` — no semantic distinction for success vs error toasts.

**Impact:** Low — at lo-fi level, a toast is a toast. The label text conveys the intent.

**Recommendation:** No change. The text content ("saved successfully" vs "failed to save") is sufficient at wireframe fidelity.

---

**12. FM Dropdown — no text override**

FM Dropdown has no documented text override for the selected value or placeholder text.

**Recommendation:** Add `Dropdown Text` override (matching FM Multi-select dropdown which already has one).

---

### Not needed for FM Kit (intentionally excluded)

These DS2026 components are correctly absent from FM Kit — they're too specialized for broad wireframing:

| DS2026 Component | Why excluded |
|---|---|
| Calendar (3 component sets) | Use FM Date input for date fields. Full calendar picker is hi-fi detail. |
| Rich text editor | Specialized input — use FM Text Area at lo-fi level |
| Filters | Product-specific (Explorer/Studio). Use FM Dropdown + FM Search for filtering. |
| Avatar | Use FM Placeholder or a simple circle at lo-fi level |
| Card (4 types) | Use frames with FM border/radius tokens. Cards are layout, not a component. |
| Collapse/Accordion | Rare in wireframes. Show expanded content directly. |
| Data viz components (lineage, metamodel, glossary, toolbar) | Highly specialized to Actian's data domain. Use `fm-custom-` elements when needed. |
| Diagram components | Same — domain-specific visualization. |
| Segmented control | Use FM Tabs for similar functionality at lo-fi level. |
| Search result card | Product-specific. Use FM Table Cell or FM Placeholder. |
| Tag (9 specialized types) | FM Tag (3 styles) + FM Chip cover wireframing needs. Specialized tag types are hi-fi. |
| Scroll bar | Browser default is sufficient for wireframes. |
| Loading (4 types) | FM Progress bar covers the wireframing need. Spinners/skeletons are hi-fi detail. |
| Maintenance banner | Rare scenario. Use FM Alert (once added) with a "Maintenance" label. |
| Drawer/Side panel | Build as a frame in the wireframe. Not common enough for a component. |
| Popover | Use FM Tooltip or a positioned frame for lo-fi. |
| Traffic light | Use FM Badge or colored dots. |
| Breadcrumbs | Use FM Page Header subtitle. |
| Sticky footer | Build as an action footer frame (already documented in forms layout rules). |

---

## Recommended action plan

### Add to FM Kit (3 new components)

| Component | Variants | Effort | Impact |
|---|---|---|---|
| **FM Alert** | Type: Success / Error / Warning | Small | P0 — unblocks every error/feedback flow |
| **FM Dialog** | Size: Small / Large | Small | P0 — unblocks every confirmation flow |
| **FM Stepper** | State: Active / Complete / Upcoming | Small | P1 — unblocks wizard flows |

### Fix existing FM components (6 changes)

| Component | Change | Effort | Impact |
|---|---|---|---|
| **FM Empty State** | Rename `Property 1` → `Type`, rename `Variant2` → descriptive name | Trivial | P1 |
| **FM Button** | Add `Type: Destructive` variant value | Trivial | P1 |
| **FM Toggle** | Add `Style: Disabled` | Trivial | P2 |
| **FM Tab** | Add `Label` text property | Trivial | P2 |
| **FM Table Cell** | Add text override properties | Small | P2 |
| **FM Dropdown** | Add `Dropdown Text` text override | Trivial | P2 |

### Document only (no component changes)

| Topic | Where to document |
|---|---|
| Inline links = underlined text with accent color | flow-html-reference.md |
| Breadcrumbs = Page Header subtitle | flow-html-reference.md |
| Sticky footer = action footer frame | Already documented |
| Button icons = fm-custom-button-with-icon | Already documented |

---

## Total effort estimate

- **3 new components:** ~2-3 hours in Figma (simple lo-fi components)
- **6 variant/property fixes:** ~1 hour in Figma
- **Documentation updates:** Already partially done in this session's reference fixes

After applying these changes on a Figma branch, merge, then run `/sync-design-system components` to update `fm-components.md`.
