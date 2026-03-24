# Actian Presentation Content Guidelines

> Voice, tone, copywriting, and data visualization rules for all generated presentation decks.
> Extends `content-guidelines.md` with presentation-specific patterns.

---

## Voice attributes

Write as a knowledgeable colleague — someone who respects the audience's time and intelligence.

| Attribute | What it means | Avoid the extreme |
|-----------|---------------|-------------------|
| **Confident, not arrogant** | State capabilities directly; let results speak | "We're the only..." / superlatives without proof |
| **Clear, not simplistic** | Explain complex concepts without dumbing them down | Oversimplifying to the point of inaccuracy |
| **Precise, not dry** | Use specific numbers and facts, framed with meaning | Raw data dumps without narrative context |
| **Human, not casual** | Write like a senior colleague, not a brochure or a text message | Slang, emoji, forced humor |
| **Ambitious, not hyperbolic** | Show vision and forward momentum with evidence | "Revolutionary," "paradigm-shifting" without substance |
| **Authoritative, not academic** | Demonstrate expertise through insight, not jargon density | Dense paragraphs, passive voice, footnote-heavy language |

---

## Sentence structure

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
- Use **DS2026 category tokens** (`category-1` through `category-9`) for series colors — never hardcode
- **Highlight the insight** — use color or weight to draw attention to the one bar/line that matters; de-emphasize the rest with grey
- **Title every chart with the insight**, not the category ("Mobile grew 3x" not "Channel breakdown")
- **Minimal axis labels** — remove decimals unless they change the story
- For executive audiences, a **single well-chosen number** in large type often communicates more than a full chart

### CSS chart patterns for HTML slides

**Stat card** (single metric, large):
```html
<div style="text-align:center;padding:40px;">
  <div style="font-family:'Roboto',sans-serif;font-size:72px;font-weight:500;color:#0550DC;">40%</div>
  <div style="font-family:'Roboto',sans-serif;font-size:20px;color:#475467;margin-top:8px;">faster query response</div>
  <div style="font-family:'Roboto',sans-serif;font-size:14px;color:#717D96;margin-top:4px;">vs. previous quarter</div>
</div>
```

**Horizontal bar chart** (CSS-only):
```html
<div style="display:flex;flex-direction:column;gap:12px;width:100%;">
  <div style="display:flex;align-items:center;gap:12px;">
    <div style="width:120px;font-family:'Roboto',sans-serif;font-size:14px;color:#475467;text-align:right;">Category A</div>
    <div style="flex:1;height:28px;background:#EDF0F7;border-radius:4px;overflow:hidden;">
      <div style="width:78%;height:100%;background:var(--zen-color-theme-primary,#0550DC);border-radius:4px;display:flex;align-items:center;padding-left:8px;">
        <span style="font-family:'Roboto',sans-serif;font-size:12px;color:white;font-weight:500;">78%</span>
      </div>
    </div>
  </div>
  <!-- repeat for each bar -->
</div>
```

**Donut chart** (CSS-only, conic-gradient):
```html
<div style="position:relative;width:200px;height:200px;">
  <div style="width:100%;height:100%;border-radius:50%;background:conic-gradient(
    var(--zen-color-category-1-strong,#0550DC) 0% 45%,
    var(--zen-color-category-2-strong,#6941C6) 45% 72%,
    var(--zen-color-category-3-strong,#0E9384) 72% 88%,
    var(--zen-color-category-4-strong,#DC6803) 88% 100%
  );"></div>
  <div style="position:absolute;inset:25%;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;">
    <div style="text-align:center;">
      <div style="font-family:'Roboto',sans-serif;font-size:28px;font-weight:500;color:#12131F;">$48B</div>
      <div style="font-family:'Roboto',sans-serif;font-size:11px;color:#717D96;">Total market</div>
    </div>
  </div>
</div>
```

**Progress bar with target** (status indicator):
```html
<div style="display:flex;flex-direction:column;gap:4px;">
  <div style="display:flex;justify-content:space-between;font-family:'Roboto',sans-serif;font-size:13px;">
    <span style="color:#12131F;font-weight:500;">Adoption rate</span>
    <span style="color:#475467;">72% of 85% target</span>
  </div>
  <div style="height:8px;background:#EDF0F7;border-radius:4px;position:relative;">
    <div style="width:72%;height:100%;background:#0550DC;border-radius:4px;"></div>
    <div style="position:absolute;left:85%;top:-4px;width:2px;height:16px;background:#DC6803;"></div>
  </div>
</div>
```

**Timeline / milestone** (horizontal):
```html
<div style="display:flex;align-items:flex-start;gap:0;width:100%;">
  <div style="flex:1;text-align:center;">
    <div style="width:16px;height:16px;background:#0550DC;border-radius:50%;margin:0 auto;"></div>
    <div style="width:100%;height:2px;background:#0550DC;margin-top:-9px;"></div>
    <div style="font-family:'Roboto',sans-serif;font-size:13px;font-weight:500;color:#12131F;margin-top:12px;">Q1 2026</div>
    <div style="font-family:'Roboto',sans-serif;font-size:12px;color:#475467;margin-top:2px;">Alpha release</div>
  </div>
  <!-- repeat for each milestone -->
</div>
```

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
- [ ] Charts use DS2026 category tokens, not hardcoded colors
- [ ] No jargon without definition
- [ ] Narrative follows situation → complication → resolution → evidence → next steps
- [ ] Sentence case throughout
- [ ] Active voice throughout

### Ready to capture?
"Review the breakdown above. Want to adjust any slides before I push to Figma?"
```
