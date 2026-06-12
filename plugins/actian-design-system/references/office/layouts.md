# Actian Template Layout Catalog

The bundled working template `assets/Actian-Template-2026.pptx` contains **54 slide layouts** on a single
master (13.33" × 7.5"). They are grouped below by purpose. The number is the layout's file index
(`ppt/slideLayouts/slideLayout<N>.xml`) — use it with `add_slide.py` in the
[editing workflow](editing.md). Names ending in a number (`1_`, `2_`, `3_`) are **style variants of
the same purpose** (usually light / alternate / dark treatments) — pick whichever tone fits the
slide's place in the dark→light→dark rhythm.

> Tip: run `python3 scripts/thumbnail.py assets/Actian-Template-2026.pptx` to see them rendered, and
> open a layout's XML to read its exact placeholder positions and prompt text.

## Covers & Speaker intros (dark, gradient)
| # | Layout | Use for |
|---|--------|---------|
| 1–2 | `1_Speaker`, `2_Speaker` | Single-speaker intro / "about the presenter" with a photo + bio. |
| 3–4 | `1_Two Speakers`, `2_Two Speakers` | Two presenters side by side. |
| 5–6 | `1_Multiple Speakers`, `2_Multiple Speakers` | Three+ presenters / panel. |
| 7–11 | `1_Title` … `5_Title` | **Title / cover slides.** `1_Title` is the canonical diagonal-panel cover (blue gradient + white logo left, title right). Others are gradient/dark/halftone variants — pick by mood. |

## Agenda & Takeaways (light)
| # | Layout | Use for |
|---|--------|---------|
| 12–14 | `1_Key Takeaways` … `3_Key Takeaways` | Three key points. **Header slots (idx 23/24/25) are 115pt giant numbers** — put `1`/`2`/`3` (or one short word); the takeaway sentence goes in the small text slots (idx 26/27/28). A phrase in the number slot overflows the slide. |
| 15–17 | `1_Agenda` … `3_Agenda` | Numbered agenda / table of contents. |
| 18 | `Agenda with Photo` | Agenda paired with a supporting image. |

## Content (light — the workhorses)
| # | Layout | Use for |
|---|--------|---------|
| 19–21 | `1_Content` … `3_Content` | Standard title + subtitle + body. Title @ x≈0.64",y≈0.43"; body region y≈2.25"–6.8". |
| 22–24 | `1_Content + Title Only` … `3_` | Content with title only (no subtitle). |
| 25 | `Two Content` | Two-column body (comparison, text+list, before/after). |
| 26 | `Two Content + Title Only` | Two columns, title only. |
| 33–36 | `Content 2 Line Header` (+ `Title Only`, `+ 2 Columns`, `+ 2 Columns + Title Only`) | Longer two-line headlines, optionally split into columns. |
| 37 | `2_Title and Content` | Alternate single title + content treatment. |
| 44 | `Content + Image` | Body text with a large image slot on one side (half-bleed). Image + text are **fillable placeholders** — `picture_ph.insert_picture(path)` and set the content text. |
| 39 | `3 Images + Descriptions` | Three image cards each with a caption — features, products, team. Image + caption slots are **fillable placeholders** (`insert_picture` / text). |

## Blank & Title-only (light/dark)
| # | Layout | Use for |
|---|--------|---------|
| 27–29 | `1_Blank` … `3_Blank` | Free canvas (light, mid, dark) for custom compositions. |
| 30–32 | `1_Title Only` … `3_Title Only` | Just a title — for full-bleed visuals or custom content beneath. |

## Section dividers (bold color breaks)
| # | Layout | Use for |
|---|--------|---------|
| 41 | `1_Divider` | Full-bleed **solid Actian blue** `0E5FDB`, centered white title. |
| 42 | `2_Divider` | Full-bleed **solid teal** `03C2CD`. |
| 43 | `3_Divider` | **Dark navy pixel-gradient** divider with the data-pixel motif. |

Place a divider between major sections to reset attention and keep the dark/light rhythm.

## Data & specialty
| # | Layout | Use for |
|---|--------|---------|
| 38 | `Case Study` | Customer story / case study framing. |
| 40 | `Chart` | Title + takeaway + a content-placeholder **frame**. The chart itself is **not** a placeholder — add a real chart via the [hybrid method](editing.md#adding-visuals-to-template-slides-hybrid-method) sized to the frame. |
| 45 | `Quote` | Large grey quotation marks + a single pull quote. |
| 46 | `3 Quotes` | Three testimonials/quotes in a row. |
| 47 | `Table` | Has a real **table placeholder** (idx 12) — but populate it by adding a table via the hybrid method (header `0E5FDB`/white, alt rows, teal total row). |
| 48 | `Substitution analysis` | Comparison / flow. The `1`/`2`/`3` badges are **static shapes** (not relabelable by fill); only the text slots are fillable — redraw badges via the hybrid method to change them. |
| 49 | `Step process chart` | Horizontal **STEP 1 → STEP 6** flow. The STEP pills and their numbers are **static shapes**; only the step *descriptions* (idx 12–17) are fillable. To relabel/renumber the steps, redraw the pills via the [hybrid method](editing.md#adding-visuals-to-template-slides-hybrid-method). |
| 50 | `Timeline` | Milestone timeline. The axis and **`Q1`–`Q4` tick labels are static shapes**; only the milestone text slots (idx 12–20) are fillable. For non-quarterly timelines, redraw the axis/labels via the hybrid method. |
| 51–52 | `1_Poll Question`, `2_Poll Question` | Audience poll / interactive question. |

## Closers (dark, gradient)
| # | Layout | Use for |
|---|--------|---------|
| 53 | `1_End Slide` | Gradient close: centered white logo, "A division of **HCLSoftware**", `actian.com`. |
| 54 | `2_End Slide` | Alternate gradient end slide. |

---

## Building a well-rounded deck

A typical Actian deck uses the dark→light→dark sandwich and varied layouts:

1. **`1_Title`** (7) — cover
2. **`1_Agenda`** (15) — agenda
3. **`1_Divider`** (41) — section break
4. **`1_Content`** / **`Two Content`** / **`Content + Image`** (19 / 25 / 44) — body, varied
5. **`Chart`** / **`Timeline`** / **`Step process chart`** (40 / 50 / 49) — data where it fits
6. **`Quote`** (45) — a customer/leader voice
7. **`2_Divider`** (42) — another section break
8. **`1_Key Takeaways`** (12) — recap
9. **`1_End Slide`** (53) — close

Avoid repeating one content layout for every slide — alternate the `1_/2_/3_` variants and reach for
the specialty layouts whenever the content (data, quote, process, comparison) suits them.
