# Quality Checklist

Unified quality checklist for all skill outputs. Every generated deliverable must pass the **Universal** section plus the relevant **skill-specific** section before being marked complete.

Source: Actian Design System — Quality & Hygiene (Figma, DS Kit library)

---

## Universal (all skills)

These checks apply to every output — component briefs, flows, presentations, and created components.

| # | Check | Severity | Pass criteria |
|---|-------|----------|---------------|
| 1 | **Auto-layout on every frame** | P0 | Every container uses auto-layout (flex/grid in HTML, auto-layout in Figma). No absolute-positioned children unless intentionally overlaid (badges, pointers). |
| 2 | **HUG/Fill sizing explicit** | P0 | Every frame created via `use_figma` has `layoutSizingHorizontal` and `layoutSizingVertical` explicitly set to `'HUG'` or `'FILL'`. Never rely on Figma's default (FIXED 100px). |
| 3 | **Descriptive layer names** | P1 | No auto-generated names ("Frame 1", "Rectangle 2", "Group 7"). Every layer follows `category/name` or a simple descriptor (`Container`, `Leading icon`, `Label`). |
| 4 | **Token compliance** | P0 | All colors use design tokens or Figma variables — never arbitrary hex. `--zen-*` for DS Kit, `--fm-*` for Fat Marker. |
| 5 | **Generation log present** | P1 | Visible generation card as the first element, all fields filled (skill, prompt, date, duration, model, plugin version). |
| 6 | **Style check** | P0 | Zero hardcoded hex values, pixel font sizes, or raw shadows. 100% of colors, fonts, shadows, and border radii reference variables or styles. |
| 7 | **Variable mode set** | P1 | After binding DS Kit variables, `setExplicitVariableModeForCollection` is called on the nearest ancestor frame. No ghost mode resolution. |
| 8 | **Meta Kit components for chrome** | P1 | Brief Card, Flow Screen, Generation Log, Code Block, Do-Don't Pair used for structural chrome — not hand-built frames. |
| 9 | **Spacing from the scale** | P1 | All spacing values use the FM/DS scale: 4, 8, 12, 16, 24, 28, 32px. No arbitrary gaps. |
| 10 | **No hidden/invisible layers** | P2 | No `display: none`, `opacity: 0`, or invisible layers left from drafting. Delete anything not needed. |
| 11 | **Component description filled** | P1 | Every main component has a filled Description field stating what it does, when to use it, and constraints. |
| 12 | **WCAG AA contrast** | P0 | Every foreground/background pair passes WCAG AA — 4.5:1 for normal text, 3:1 for large text and UI elements. Disabled states exempt but distinguishable. |
| 13 | **Template compliance** | P1 | When Meta Kit templates are available (registry keys are not `"PENDING"`), builders use clone-and-fill pattern instead of raw frame construction. Check for `cloneTemplate()` calls in `use_figma` code. |
| 14 | **Registry keys valid** | P1 | All component keys referenced in `use_figma` code exist in the corresponding registry JSON (`metakit.json`, `fmkit.json`, or `dskit.json`). No `"PENDING"` keys used in production output. |

### HTML translation

When generating HTML for local preview, the checklist translates to:

| Figma check | HTML equivalent |
|-------------|-----------------|
| Auto Layout | Use `display: flex` or `display: grid` with appropriate sizing. No fixed pixel widths that break on resize. |
| HUG/Fill sizing | Use explicit `width`/`height` or flex sizing. No unconstrained containers. |
| Descriptive layer names | All `data-name` values are descriptive (`"Page header"`, `"Variant matrix"` — not `"div"`, `"section1"`). |
| Token compliance | Reference `--zen-*` or `--fm-*` CSS custom properties exclusively. Zero raw hex or inline color values. |
| Generation log present | Include generation card as the first child inside the layout container. |
| Style check | Reference `--zen-*` CSS custom properties exclusively. Zero raw hex, px font sizes, or inline color values. |
| Variable mode set | CSS variables resolve via `[data-theme]` selector on ancestor. No inline overrides. |
| Meta Kit components | All component references use the correct library component — no detached or inline duplicates. |
| Spacing from the scale | Use spacing tokens or scale values. No arbitrary margins/padding. |
| No hidden/invisible layers | No `display: none` or `opacity: 0` elements left from iteration. Delete unused markup. |
| Component description filled | Include `<!-- AI CONSUMPTION METADATA -->` comment and descriptive subtitles on every card. |
| WCAG AA contrast | Verify all text/background pairs against WCAG AA. Use token colors — they are pre-validated. |
| Template compliance | N/A — templates only apply to Figma output via `use_figma`. HTML uses its own card templates. |
| Registry keys valid | N/A — HTML generation does not reference component registries. |

---

## Generate Flow (actian-ux-prototype)

Items specific to the `actian-ux-prototype` skill, in addition to Universal.

| # | Check | Pass criteria |
|---|-------|---------------|
| 1 | **Cover card present** | Dark cover card with Feature, Flow, and User fields is the first screen in each flow row. |
| 2 | **Screen naming convention** | Every screen label follows `[Persona] - [Page] - [State/Action]`. |
| 3 | **Screen dimensions** | Standard: 1440x960px. Compact (no sidebar): 1440x700px. No other sizes. |
| 4 | **FM library components used** | All standard UI elements use imported FM Kit components — never recreated as raw frames. |
| 5 | **Forms layout** | Simple form inputs in a 480px max-width container. Tables/tiles full-width. Action footer: primary right, secondary left. |
| 6 | **Missing states flagged** | Empty, error, loading, and confirmation states are included (or explicitly noted as out of scope). |
| 7 | **Reading order** | Screens flow left-to-right, top-to-bottom. One row per sub-flow, no wrapping. |
| 8 | **Custom elements follow FM conventions** | `fm-custom-` prefix, `--fm-*` variables, FM spacing/typography, HTML comment explaining purpose. Lo-fi fidelity. |
| 9 | **Content guidelines applied** | Sentence case on all UI text (not title case). Buttons are verb + object ("Save changes", not "Save Changes" or bare "Save"). Form labels concise (no colons). Error messages explain what + how to fix. Apply the full avoid-list in `../../vendor/content/dist/words-to-avoid.json` (do not inline a subset). Placeholder text models input — never repeats the label. See `../../vendor/content/dist/global.md` (cross-cutting rules) + per-component `../../vendor/components/dist/guidelines/<slug>.json` `domains.content`. |
| 10 | **Accessibility basics** | Interactive elements have focus indicators. Form inputs have labels. No text below 11px. Color is not the only status indicator. |

---
