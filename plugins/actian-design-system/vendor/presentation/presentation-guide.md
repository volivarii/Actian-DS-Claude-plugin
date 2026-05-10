# Actian Presentation Guide

> Slide templates, content guidelines, and data visualization rules for the `/generate-presentation` skill.
> Source templates: [Template for projects](https://www.figma.com/design/l7KNDEvTs22yr7xbymwoYe/Template-for-projects?node-id=5557-16)

---

## Slide templates

### Overview

5 slide templates at **1920 x 1080px** (16:9). All text is Roboto. Two visual styles: **dark** (gradient background with geometric overlay) and **light** (white or light gradient).

---

### Slide 1 — Cover

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

### Slide 2 — Body (Full content)

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

### Slide 3 — Body (Text + Visual)

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

### Slide 4 — Section divider

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

### Slide 5 — Back cover

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

### Shared design elements

#### Background graphic
Both dark and light slides share the same geometric pattern — three overlapping diagonal vector shapes, rotated -60deg and clipped to the slide bounds. The dark version uses the gradient colors; the light version uses semi-transparent light blues.

#### Color palette

| Name | Value | Use |
|------|-------|-----|
| Dark gradient start | `#090952` | Cover, Back cover |
| Dark gradient end | `#1414B8` | Cover, Back cover |
| Light gradient start | `#EEEEFD` | Section divider |
| Light gradient end | `#CBDAFF` | Section divider |
| Text default | `#12131F` | Body slides, Section divider |
| Content area bg | `#F5F5FA` | Body slide placeholders |
| White | `#FFFFFF` | Body slide backgrounds, text on dark |

#### Typography scale

| Role | Size | Weight | Use |
|------|------|--------|-----|
| Display title | 130–152px | Medium 500 | Cover, Section, Back cover |
| Subtitle | 56–60px | Regular 400 | Cover subtitle, Body titles |
| Body | 24px | Regular 400 | Text+Visual body column |
| Topic label | 40px | Medium 500 | Cover topic |
| Meta | 32px | Regular 400 | Date, Creators |

#### Figma source reference

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

### Slide sequencing rules

1. Every presentation **starts with a Cover** and **ends with a Back cover**
2. Use **Section dividers** to separate major topics (minimum 2 sections for presentations > 8 slides)
3. Choose **Body (Full)** for visual-heavy content (charts, diagrams, screenshots)
4. Choose **Body (Text+Visual)** when written context accompanies a visual
5. Avoid consecutive Section dividers
6. Target 1 key message per slide — if a slide has more than 3 bullet points or 2 concepts, split it

---

## Voice & tone

Write as a knowledgeable colleague — someone who respects the audience's time and intelligence.

| Attribute | What it means | Avoid the extreme |
|-----------|---------------|-------------------|
| **Confident, not arrogant** | State capabilities directly; let results speak | "We're the only..." / superlatives without proof |
| **Clear, not simplistic** | Explain complex concepts without dumbing them down | Oversimplifying to the point of inaccuracy |
| **Precise, not dry** | Use specific numbers and facts, framed with meaning | Raw data dumps without narrative context |
| **Human, not casual** | Write like a senior colleague, not a brochure or a text message | Slang, emoji, forced humor |
| **Ambitious, not hyperbolic** | Show vision and forward momentum with evidence | "Revolutionary," "paradigm-shifting" without substance |
| **Authoritative, not academic** | Demonstrate expertise through insight, not jargon density | Dense paragraphs, passive voice, footnote-heavy language |

### Sentence structure

- **Lead with the conclusion** — inverted pyramid. The key insight goes first, context follows.
- **Active voice always**: "Actian reduces query latency by 40%" not "Query latency is reduced by 40%"
- **Under 20 words per sentence** when possible. Break complex ideas into two sentences.
- **Front-load subject and verb**: "Teams deploy faster" not "With the enhanced deployment pipeline, teams are able to..."
- **Parallel structure in lists** — all items start with the same part of speech
- **No nested clauses** deeper than one level
- **No semicolons** in slide content — split into two statements
- **No empty subjects** — avoid starting with "There is" or "It is"
- **No prepositional chains** — max two prepositions ("analysis of the data" is fine, "analysis of the data of the platform of the customer" is not)

---

## Headlines

Every headline must pass the **"So what?" test** — if someone reads only the headlines of the deck, they should understand the full narrative.

**Write headlines as conclusions, not category labels.**

| Anti-pattern (label) | Better (value headline) |
|----------------------|------------------------|
| "Q3 Performance" | "Q3 revenue up 12% despite market headwinds" |
| "Product Roadmap" | "Three releases in H2 close the top 5 customer gaps" |
| "Market Opportunity" | "Hybrid data market reaches $48B by 2027" |
| "Architecture Overview" | "Single platform replaces four point solutions" |
| "Customer Results" | "Customers cut data pipeline costs by 60% in 90 days" |
| "Current Status" | "Adoption doubled since January — 14 teams now active" |

**Rules:**
- Maximum one line (two lines in rare cases for Cover/Section slides)
- One message per slide — three points on a slide means zero remembered
- Use specific numbers when available — they are more credible and memorable
- Write as a complete thought, not a fragment requiring the body to make sense
- Present tense for current state, future tense only with evidence
- Sentence case (capitalize first word and proper nouns only)

---

## Tone do / don't

| Category | Don't | Do |
|----------|-------|-----|
| **Hype language** | "Our revolutionary, best-in-class AI-powered platform" | "Our platform processes 10B rows in under a second" |
| **Vague claims** | "We help companies work smarter" | "Teams reduce ETL pipeline build time from weeks to hours" |
| **Jargon stacking** | "Leverage our synergistic, cloud-native, AI-driven data mesh" | "Run analytics across all your data sources from one place" |
| **Passive voice** | "Significant cost savings were achieved" | "Customers cut infrastructure costs by 45%" |
| **Feature dumping** | "Supports JDBC, ODBC, REST, gRPC, Kafka, S3, and 200+ connectors" | "Connects to your existing stack — 200+ connectors out of the box" |
| **Self-congratulation** | "We are proud to be recognized as a leader" | "Recognized as a Leader in the 2026 Gartner Magic Quadrant" |
| **Vague pain** | "Data challenges are holding your business back" | "Analysts spend 60% of their time finding data instead of analyzing it" |
| **Weak CTAs** | "Learn more about our solutions" | "See how [Company] cut query times by 80% — read the case study" |
| **Empty modifiers** | "Very fast, highly scalable, extremely reliable" | "Sub-second queries at petabyte scale with 99.99% uptime" |
| **Filler intros** | "In today's rapidly evolving digital landscape..." | Start with the insight. Skip the preamble. |

---

## Data & metrics

### Selection
- **5–7 key metrics per presentation** — if a number does not drive a decision, it does not belong
- Every metric needs **context**: comparison (vs. last quarter), benchmark (vs. industry), or target (vs. goal)
- Isolate and highlight **trends or deviations** — these are where the insight lives

### Formatting
- Lead with the **big number in large type** (48–72px on slide), context in smaller text below
- Format: **[Metric] + [Timeframe] + [Comparison]** — e.g., "40% faster | since v4.2 | vs. competitor median"
- **Round numbers** for executive audiences ("$48B" not "$47.83B") unless precision matters
- **Consistent units** across a deck — don't mix percentages and absolute numbers for the same comparison
- **Maximum 2 charts per slide**; prefer 1 chart with a clear headline
- **Maximum 5 lines of text** when data visuals are present

### Framing patterns
- **Before/After** — show the delta, not just the end state
- **Benchmark** — compare to industry average, competitor, or internal baseline
- **Trajectory** — trend direction with arrow or sparkline alongside the number
- **Threshold** — where the metric sits relative to a target or danger zone

---

## Chart & diagram selection

Start with the question you're answering, then pick the chart type.

| Question | Chart type | Notes |
|----------|-----------|-------|
| How do categories compare? | **Bar chart** (horizontal or vertical) | Best default. Horizontal when labels are long. Sort by value, not alphabetically. |
| How has something changed over time? | **Line chart** | For continuous data with 5+ time points. Max 4–5 series. |
| What is the trend AND magnitude? | **Area chart** | Filled area emphasizes volume. Stacked area shows composition over time. |
| What are the parts of a whole? | **Donut chart** | 2–5 segments only. Summary number in the center. If segments are close in size, use horizontal stacked bar instead. |
| How did we get from A to B? | **Waterfall chart** | Revenue bridges, budget variance, cost breakdowns. Shows positive/negative contributions. |
| What is the current status vs. target? | **Progress bar or bullet chart** | Simple and scannable. Color-code: green = on track, amber = at risk, red = behind. |
| What is the process or flow? | **Flow diagram** | Boxes + arrows for process logic. Numbered steps for sequential workflows. |
| What is the relationship? | **Scatter plot** | Correlation analysis. Add trend line when meaningful. |

### Chart styling rules

- **No 3D effects, no gradient fills, no unnecessary gridlines** — remove all chartjunk
- **Label data directly** on the chart rather than using a separate legend
- Use **DS Kit category tokens** (`category-1` through `category-9`) for series colors — never hardcode
- **Highlight the insight** — use color or weight to draw attention to the one bar/line that matters; de-emphasize the rest with grey
- **Title every chart with the insight**, not the category ("Mobile grew 3x" not "Channel breakdown")
- **Minimal axis labels** — remove decimals unless they change the story
- For executive audiences, a **single well-chosen number** in large type often communicates more than a full chart

---

## Narrative structure

Every deck follows a story arc. The audience should be taken from their current reality to a better future.

1. **Situation** — Where are we now? What's the context? (1–2 slides)
2. **Complication** — What's the challenge or opportunity? Why does it matter? (2–3 slides)
3. **Resolution** — What's the answer? How do we get there? (bulk of the deck)
4. **Evidence** — Proof it works: data, case studies, benchmarks (2–3 slides)
5. **Next steps** — What happens now? Clear call to action (1 slide before Back cover)

Do not open with features. Open with the audience's reality.

---

## Slide content density

| Slide type | Max text | Max visuals | Typical use |
|------------|----------|-------------|-------------|
| Cover | Title + subtitle + meta | BG graphic only | Opening |
| Section divider | Topic + title | BG graphic only | Major transitions |
| Body (Full) — data | 1 headline + 1 subtitle | 1–2 charts or 3–4 stat cards | Metrics, comparisons |
| Body (Full) — visual | 1 headline | 1 diagram or screenshot | Architecture, flows |
| Body (Text+Visual) | 1 headline + 6 bullets max | 1 visual | Explanation + evidence |
| Back cover | "Thank you" | BG graphic only | Closing |

**The one-message rule:** If you cannot summarize a slide's point in one sentence, split it into two slides. Three points on a slide means zero remembered.

---

## Review report format

Before sending any deck to Figma, present a structured review report to the user:

```markdown
## Deck review — [Title]

**Slides:** [count] | **Sections:** [count] | **Estimated duration:** [N] min at 1–2 min/slide

### Slide-by-slide breakdown

| # | Template | Headline | Content summary | Charts/Visuals |
|---|----------|----------|-----------------|----------------|
| 1 | Cover | [Title] | [Subtitle, date, creators] | BG graphic |
| 2 | Body (Full) | [Headline] | [What's on this slide] | [Chart type if any] |
| ... | ... | ... | ... | ... |

### Quality checklist
- [ ] Every headline passes the "So what?" test
- [ ] Maximum 1 message per slide
- [ ] All metrics have context (comparison, benchmark, or target)
- [ ] Charts use DS Kit category tokens, not hardcoded colors
- [ ] No jargon without definition
- [ ] Narrative follows situation → complication → resolution → evidence → next steps
- [ ] Sentence case throughout
- [ ] Active voice throughout

### Ready to capture?
"Review the breakdown above. Want to adjust any slides before I push to Figma?"
```
