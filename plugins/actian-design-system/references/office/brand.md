# Actian Brand & Visual Guidelines

Actian is **a division of HCLSoftware**. These guidelines are extracted directly from Actian's
official 2026 PowerPoint master template and reconciled with the HCLSoftware brand system. Apply
them to every slide. When in doubt, open the template and match what it does.

---

## 1. Color Palette

The Actian palette is **blue-forward** (where the broader HCLSoftware palette leans teal). Blue
leads, teal is the accent, navy anchors dark backgrounds, greys support.

### Theme colors (exact values from the template's color scheme)

| Role | Name | Hex | Theme slot | Usage |
|------|------|-----|-----------|-------|
| **Primary Blue** | Actian Blue | `0E5FDB` | accent1 / accent6 | Hero color. Headings, primary buttons, key chart series, solid blue dividers, links. |
| **Bright Blue** | Sky Blue | `3B90FE` | accent2 / hlink | Secondary accent, hyperlinks, secondary data series, hover. |
| **Teal** | Actian Teal | `03C2CD` | accent3 | Signature accent — corner swooshes, highlights, success states, solid teal dividers. |
| **Light Blue** | Powder Blue | `C4E0FA` | accent4 | Soft fills, card backgrounds, light chart series. |
| **Ice** | Ice Blue | `AAFFFF` | accent5 | Very light glow / subtle highlight on dark backgrounds. |
| **Navy** | Software Navy | `000032` | — | Deepest background anchor for gradients and dark slides. |
| **Dark Slate** | Slate | `394247` | dk2 | Body text alternative, muted UI text (softer than pure black). |
| **Light Grey** | Cloud | `F1F1F1` | lt2 | Page tints, image placeholders, alternating rows, neutral fills. |
| **Black** | — | `000000` | dk1 | Primary text on light backgrounds. |
| **White** | — | `FFFFFF` | lt1 | Backgrounds, reversed text, white logo. |

### Extended HCLSoftware blues (use when more steps are needed, e.g. multi-series charts)

`0F5FDC` (Dark Blue) · `8AC6F8` (Mid Blue) · `DCE6F0` (Ice Blue UI) · `ECF3F8` (Tech Grey) ·
`F7F7FC` (Light BG). These are interchangeable with the Actian theme blues above.

### Color usage rules

- **Two to three colors per slide.** Blue dominates (~60–70% of color weight); teal is the single
  sharp accent; grey/navy support. Never give every accent equal weight.
- **Teal is precious** — use it for one accent per slide (a corner curve, a highlighted stat, a
  selected step), not as a large fill except on a dedicated teal divider.
- Body text: `000000` or `394247` on light; `FFFFFF` on dark/gradient.
- Never introduce off-brand colors as primary. Semantic data colors are acceptable **sparingly**:
  success `03C2CD`, warning `F5A623`, error `DC3545`.

---

## 2. The Signature Gradient

The Actian hero gradient flows from **deep navy** (bottom-left, darkest) up through **Actian blue**
to **bright blue / teal** (top-right). It defines title slides, section dividers, and the end slide.

```css
/* Diagonal, lower-left dark → upper-right bright */
background: linear-gradient(45deg, #000032 0%, #0A3A9E 35%, #0E5FDB 65%, #2FA8E8 90%, #03C2CD 100%);
```

PptxGenJS cannot render gradients natively — **use the bundled gradient image instead**:
`assets/backgrounds/actian-hero-gradient.png` (navy→blue with the data-pixel motif baked in) or
`actian-end-gradient.jpg` (the end-slide gradient). In the template-editing workflow the gradient is
already part of the title/divider/end layouts — you get it for free.

---

## 3. The Visual Motif — "Data Pixels"

Actian's defining graphic element: small **glassy 3-D squares (diamonds) and plus-signs** that
scatter and drift across dark gradient backgrounds, evoking flowing data points. They appear:

- On the **title slide**, clustered in the lower-left of the diagonal blue panel.
- On **dark dividers** (`3_Divider`) and dark title variants, drifting from a dense corner outward.

Treatment: cyan/blue (`3B90FE`–`AAFFFF`), semi-transparent, varied sizes, never evenly spaced.
**Do not scatter them on light content slides** — they belong only on dark gradient surfaces. The
motif is pre-rendered into `assets/backgrounds/actian-hero-gradient.png`.

Secondary motifs seen in the template: a **diagonal cut** dividing a blue panel from a white panel
(title slide), a faint **halftone dot-sphere** on some title variants, and a small **teal quarter-
circle corner accent** at the bottom of content slides.

---

## 4. Typography

**Arial. Only Arial. No exceptions.** It is the universal Actian/HCLSoftware brand font. Fallback
order in non-Office contexts: Arial → Helvetica Neue → Helvetica → sans-serif.

| Element | Font / Weight | Size (16:9 slide) |
|---------|---------------|-------------------|
| Title-slide title | Arial Bold | 36pt (auto-shrinks to ~24pt on overflow) |
| Section / page title | Arial Bold | 31pt (master default); 25–36pt range |
| Divider title | Arial Bold | 36pt |
| Subtitle | Arial Regular | 25pt |
| Body level 1 | Arial Regular | 21pt |
| Body level 2 | Arial Regular | 19pt |
| Body level 3–4 | Arial Regular | 17pt |
| Presenter / meta | Arial Regular | 18pt |
| Footer / copyright / captions | Arial Regular | 8–9pt |

- **Bold** all titles, section headers, and inline labels (e.g. `Status:`). Body copy is Regular.
- Left-align body and lists. Center only short titles and the dark cover/end slides.
- Honor size contrast: a 31–36pt title against 17–21pt body. Don't crowd sizes together.

---

## 5. Logos

Bundled in `assets/logos/`:

| File | Use on | Contents |
|------|--------|----------|
| `actian-logo-white.svg` | Dark / gradient backgrounds (title, divider, end) | White triangle mark + "ACTIAN™" + "a division of HCLSoftware" |
| `actian-logo-color.svg` | Light / white backgrounds (content footers) | Blue (`0E5FDB`) mark + navy (`000032`) wordmark + "a division of HCLSoftware" |

The full logo's native aspect ratio is **≈3.2 : 1** (wordmark + subtext lockup). The mark-only
triangle is roughly square. SVG renders crisply in modern PowerPoint/Microsoft 365.

### Logo rules (strict)

- **Top-left** of title slides; **bottom-right** as the footer lockup on content slides (this is how
  the template does it — the master places it automatically when editing the template).
- **Never** stretch, distort, rotate, recolor, or add effects. Scale width and height together.
- White logo on dark/gradient; color logo on light. Never the color logo on a busy dark background.
- Maintain clear space around the logo of at least the height of the triangle mark.

---

## 6. Footer System

Content slides carry a consistent footer (inherited from the master in the editing workflow):

- **Bottom-left:** slide number + `Copyright © <year> Actian Corporation` (Arial ~8pt, grey `394247`).
- **Bottom-right:** the ACTIAN "a division of HCLSoftware" logo lockup (color on light slides).
- **Corner accent:** a small teal (`03C2CD`) quarter-circle / swoosh near the bottom corner.

When building from scratch, reproduce this: ~0.5" margins, footer baseline ~7.0–7.2" down on the
7.5"-tall slide. Use the current year (today is 2026) unless told otherwise.

---

## 7. Backgrounds & Layout Geometry

- **Slide size:** 13.33" × 7.5" (16:9). Standard content margin ≈ **0.64"** on the left (title and
  content start at x≈0.64"); keep ≥ 0.5" everywhere.
- **Content slide:** white (`FFFFFF`) background. Title at y≈0.43" (≈0.78" tall), optional subtitle
  at y≈1.23", content body region from y≈2.25" down to ≈6.8".
- **Divider:** full-bleed solid `0E5FDB`, solid `03C2CD`, or the dark pixel gradient; centered title
  at y≈2.7" (36pt white bold) with subtitle at y≈3.75".
- **Title slide:** diagonal blue gradient panel on the left ~40% (white logo top-left, motif lower-
  left, copyright bottom-left); white panel on the right ~60% with bold black title, grey subtitle,
  and presenter block.
- **End slide:** full gradient, centered white logo, "A division of **HCLSoftware**", `actian.com`
  underlined near the bottom.

---

## 8. Charts & Data Visualization

Use the brand sequence, in order, so series read as on-brand:

1. `0E5FDB` Actian Blue · 2. `03C2CD` Teal · 3. `3B90FE` Bright Blue · 4. `C4E0FA` Light Blue ·
5. `8AC6F8` Mid Blue · 6. `000032` Navy · 7. `394247` Slate · 8. `AAFFFF` Ice.

- Clean white chart area, no heavy borders or 3-D. Muted grey (`394247`) axis labels.
- Subtle value-axis gridlines (`E2E8F0`/`DCE6F0`, 0.5pt); hide category gridlines.
- Hide the legend for single-series charts; label values directly where it aids reading.
- Tables: header row `0E5FDB` fill + white bold; alternating rows white / `F7F7FC`; total/accent row
  `03C2CD` fill + white; thin `DCE6F0` borders.

---

## 9. Do / Don't

**Do**
- Start from the bundled template; let theme + master supply colors, fonts, logo, footer, motif.
- Keep it clean, flat, spacious. Blue leads, teal accents.
- Use the dark→light→dark sandwich and vary layouts across the deck.
- Use white logo on dark, color logo on light; preserve aspect ratio.

**Don't**
- Use any font but Arial. Use off-brand primary colors. Spread teal everywhere.
- Add drop shadows, bevels, 3-D, or accent lines under titles.
- Distort/recolor/rotate the logo, or put the color logo on a dark background.
- Scatter the data-pixel motif on light content slides.
- Leave template prompt text ("Click to edit…", "Presenter Name", "Month #, Year") in the output.
