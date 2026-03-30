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
| 14 | **Registry keys valid** | P1 | All component keys referenced in `use_figma` code exist in the corresponding registry JSON (`meta-kit-registry.json`, `fm-components-registry.json`, or `dskit-components-registry.json`). No `"PENDING"` keys used in production output. |

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

## Component Brief

Items specific to the `component-brief` skill, in addition to Universal.

| # | Check | Pass criteria |
|---|-------|---------------|
| 1 | **All declared cards present** | Every card in the selection is generated and complete — no empty or placeholder cards. |
| 2 | **Card titles match templates** | Card title + subtitle match the HTML template titles exactly. |
| 3 | **Variant matrix complete** | Card 2 shows ALL variant rows from the HTML (e.g., Standalone, Inline, With icon) × all states. Same row count in Figma as HTML. |
| 4 | **Token tables include swatches** | Card 4 color token rows include a 12px swatch dot (rectangle, cornerRadius 3) filled with the hex value next to the token name. Text-only token names without swatches = fail. |
| 5 | **Anatomy has all 4 sub-sections** | Card 3 includes: Structure (badges), Specs (pink `#E91E8C` dimension lines), States (grid), Parts reference (table). Missing Specs = P0 fail. |
| 6 | **Component API has REQ/OPT badges** | Card 5 props table shows colored badges (REQ = red, OPT = grey) as styled frames, not plain text. |
| 7 | **Do/Don't pairs styled** | Cards 6-7 Do/Don't pairs have colored header bars (green `#047800` for Do, red `#C10C0D` for Don't). |
| 8 | **Code spec uses `--zen-*` tokens** | Card 9 CSS code block references `--zen-*` token names, not raw hex. |
| 9 | **Accessibility cards complete** | Card 8 covers all applicable WCAG requirements with P0/P1/P2 severity. |
| 10 | **Contrast ratio table with swatches** | Card 8 includes foreground/background contrast table with 12px swatch dots, ratio values, and Pass/Exempt badges. |
| 11 | **Card frames named by title** | Each card frame is renamed to its card title (`"Anatomy"`, `"Design tokens"`, etc.) — not left as `"Meta / Chrome / Brief Card"`. |
| 12 | **Figma↔HTML parity** | Every sub-section, table, visual element, and row count in the Figma output matches what the HTML spec contains. Omissions = P0. |

---

## Generate Flow

Items specific to the `generate-flow` skill, in addition to Universal.

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
| 9 | **Content guidelines applied** | Button labels use action verbs (title case). Form labels are concise (no colons). Error messages explain what + how to fix. |
| 10 | **Accessibility basics** | Interactive elements have focus indicators. Form inputs have labels. No text below 11px. Color is not the only status indicator. |

---

## Generate Presentation

Items specific to the `generate-presentation` skill, in addition to Universal.

| # | Check | Pass criteria |
|---|-------|---------------|
| 1 | **Slide count matches outline** | Final deck has the planned number of slides — no missing or extra slides. |
| 2 | **Cover slide complete** | Cover has title, subtitle, date, and creators fields filled. |
| 3 | **Charts use category tokens** | All chart series colors use `category-N-strong` tokens (or `--zen-color-category-N-strong` in CSS). Never hardcoded chart colors. |
| 4 | **Review report completed** | Step 5 review report presented and approved before Figma output. |
| 5 | **Content follows guidelines** | Every headline passes "So what?" test. 1 message per slide. Active voice. Max 6 bullets or 150 words per text area. Every metric has context. |
| 6 | **Slide templates correct** | Cover and Back cover use gradient backgrounds. Section dividers use light gradient. Body slides use white background. |
| 7 | **Narrative arc present** | Deck follows situation -> complication -> resolution -> evidence -> next steps structure. |

---

## Create Component

Items specific to the `create-component` skill, in addition to Universal.

| # | Check | Pass criteria |
|---|-------|---------------|
| 1 | **Naming convention** | FM prefix for Fat Marker components, no prefix for DS Kit. Matches existing catalog naming patterns. |
| 2 | **Variant axes consistent** | All variant axis names and values align with existing catalog conventions. |
| 3 | **Text properties exposed** | `isProperty: true` set on all user-facing text fields (titles, labels, descriptions, button text). |
| 4 | **Boolean properties on toggles** | All optional/toggleable elements (badge, description, footer, icon) have boolean property toggles. |
| 5 | **Sizing uses hug/fill** | Layout uses `"hug"` / `"fill"` sizing — no unnecessary fixed pixel values. |
| 6 | **All variants defined** | Every declared variant has a complete definition with all required children. No empty variants. |
| 7 | **Default text is realistic** | Placeholder text is contextual and realistic, not "Lorem ipsum" or generic "Text". |
| 8 | **Touch targets adequate** | Interactive children meet minimum 44px touch target size. |
