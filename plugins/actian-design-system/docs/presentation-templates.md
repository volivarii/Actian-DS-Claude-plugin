# Actian Presentation Templates

Source: [Template for projects](https://www.figma.com/design/l7KNDEvTs22yr7xbymwoYe/Template-for-projects?node-id=5557-16)

## Overview

5 slide templates at **1920 x 1080px** (16:9). All text is Roboto. Two visual styles: **dark** (gradient background with geometric overlay) and **light** (white or light gradient).

---

## Slide 1 — Cover

**Style:** Dark gradient
**Background:** `linear-gradient(80deg, #090952 2%, #1414B8 107%)` with geometric BG graphic overlay (rotated -60deg, clipped)
**Use:** Opening slide of every presentation

| Element | Font | Size | Weight | Color | Position |
|---------|------|------|--------|-------|----------|
| Topic | Roboto | 40px | Medium (500) | white | top-left, x:80 y:88 |
| Title | Roboto | 130px | Medium (500) | white | x:69 y:166, w:1760 |
| Subtitle | Roboto | 60px | Regular (400) | white | x:69 y:341, w:1760 |
| Date | Roboto | 32px | Regular (400) | white | x:80 y:931 |
| Creators | Roboto | 32px | Regular (400) | white | x:80 y:980 |
| Actian pyramid | — | 80x68px | — | white | bottom-right, x:1760 y:947 |

**Notes:**
- Topic is a short category label (e.g., "UX Research", "Design System", "Engineering")
- Title is the main presentation title, can wrap to 2 lines
- Subtitle provides additional context
- Date format: "March 2026" or "2026-03-23"
- Creators: comma-separated names

---

## Slide 2 — Body (Full content)

**Style:** Light (white background)
**Background:** `white` / `var(--white-black/white)`
**Use:** Content slides with charts, diagrams, images, or full-width content

| Element | Font | Size | Weight | Color | Position |
|---------|------|------|--------|-------|----------|
| Optional label | Roboto | — | — | — | x:80 y:44, hidden by default |
| Title | Roboto | 56px | Regular (400) | `#12131F` / `var(--text/color-text-default)` | x:80 y:64, w:1760 |
| Content area | — | 1761 x 829px | — | `#F5F5FA` / `var(--coolgrey/10)` | x:79 y:187 |

**Notes:**
- Content area is a full-width grey placeholder for any visual content
- Can contain: charts, diagrams, screenshots, tables, component previews, flow diagrams
- Optional label appears above the title when needed for extra categorization

---

## Slide 3 — Body (Text + Visual)

**Style:** Light (white background)
**Background:** `white`
**Use:** Slides that combine written content with a visual reference

| Element | Font | Size | Weight | Color | Position |
|---------|------|------|--------|-------|----------|
| Title | Roboto | 56px | Regular (400) | `#12131F` | x:80 y:64, w:1760 |
| Body text | Roboto | 24px | Regular (400) | `black` | x:80 y:187, w:549, h:829 |
| Visual area | — | 1155 x 829px | — | `#F5F5FA` / `var(--coolgrey/10)` | x:685 y:187, radius:4px |

**Notes:**
- Left 1/3: body text column (549px) for written content, bullet points, key takeaways
- Right 2/3: visual content area (1155px) for diagrams, screenshots, or component previews
- Body text line-height: 1.3 (31.2px)

---

## Slide 4 — Section divider

**Style:** Light gradient with geometric overlay
**Background:** `linear-gradient(80deg, #EEEEFD 2%, #CBDAFF 107%)` with geometric BG graphic overlay (rotated -60deg, light version)
**Use:** Separating major sections within a presentation

| Element | Font | Size | Weight | Color | Position |
|---------|------|------|--------|-------|----------|
| Topic | Roboto | 60px | Regular (400) | `#12131F` / `var(--primary/neutral)` | x:69 y:361, w:1760 |
| Title | Roboto | 130px | Medium (500) | `#12131F` / `var(--primary/neutral)` | x:69 y:449, w:1760 |

**Notes:**
- Topic sits above the title as a section category
- Title is the section name
- No footer elements — clean and minimal
- Uses the same geometric graphic as Cover but in light tones

---

## Slide 5 — Back cover

**Style:** Dark gradient (same as Cover)
**Background:** `linear-gradient(80deg, #090952 2%, #1414B8 107%)` with geometric BG graphic overlay
**Use:** Closing slide of every presentation

| Element | Font | Size | Weight | Color | Position |
|---------|------|------|--------|-------|----------|
| Thank you | Roboto | 152px | Medium (500) | white | x:80 y:421, w:1760 |
| Actian pyramid | — | 80x68px | — | white | bottom-right, x:1760 y:947 |

**Notes:**
- Fixed text "Thank you" — can be customized per context
- Same visual treatment as Cover slide
- No date or creator fields

---

## Shared design elements

### Background graphic
Both dark and light slides share the same geometric pattern — three overlapping diagonal vector shapes, rotated -60deg and clipped to the slide bounds. The dark version uses the gradient colors; the light version uses semi-transparent light blues.

### Color palette

| Name | Value | Use |
|------|-------|-----|
| Dark gradient start | `#090952` | Cover, Back cover |
| Dark gradient end | `#1414B8` | Cover, Back cover |
| Light gradient start | `#EEEEFD` | Section divider |
| Light gradient end | `#CBDAFF` | Section divider |
| Text default | `#12131F` | Body slides, Section divider |
| Content area bg | `#F5F5FA` | Body slide placeholders |
| White | `#FFFFFF` | Body slide backgrounds, text on dark |

### Typography scale

| Role | Size | Weight | Use |
|------|------|--------|-----|
| Display title | 130–152px | Medium 500 | Cover, Section, Back cover |
| Subtitle | 56–60px | Regular 400 | Cover subtitle, Body titles |
| Body | 24px | Regular 400 | Text+Visual body column |
| Topic label | 40px | Medium 500 | Cover topic |
| Meta | 32px | Regular 400 | Date, Creators |

### Figma source reference

| Template | Figma node ID |
|----------|---------------|
| Cover | `5557:17` |
| Body (Full) | `5557:29` |
| Body (Text+Visual) | `5557:33` |
| Section divider | `5557:37` |
| Back cover | `5557:44` |
| Actian pyramid (white) | `5317:44` |

File key: `l7KNDEvTs22yr7xbymwoYe`

---

## Slide sequencing rules

1. Every presentation **starts with a Cover** and **ends with a Back cover**
2. Use **Section dividers** to separate major topics (minimum 2 sections for presentations > 8 slides)
3. Choose **Body (Full)** for visual-heavy content (charts, diagrams, screenshots)
4. Choose **Body (Text+Visual)** when written context accompanies a visual
5. Avoid consecutive Section dividers
6. Target 1 key message per slide — if a slide has more than 3 bullet points or 2 concepts, split it
