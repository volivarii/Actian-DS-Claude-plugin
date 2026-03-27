# Generate Presentation — HTML Templates & Chart Reference

HTML slide templates and chart types for the generate-presentation skill.

## Slide dimensions and layout

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <!-- AI CONSUMPTION METADATA -->
  <style>
    body { margin: 0; padding: 40px; background: #E0E0E0; display: flex; gap: 40px; align-items: flex-start; }
    .slide { width: 1920px; height: 1080px; flex-shrink: 0; position: relative; overflow: hidden; }
    .gen-card { width: 280px; flex-shrink: 0; background: #2D3648; border-radius: 8px; padding: 16px 20px; font-family: 'Inter', 'Roboto', sans-serif; display: flex; flex-direction: column; gap: 4px; }
    .gen-card__label { font-size: 10px; font-weight: 500; color: #A0ABC0; text-transform: uppercase; letter-spacing: 0.5px; }
    .gen-card__field { font-size: 12px; color: #CBD2E0; line-height: 1.4; }
    .gen-card__key { font-weight: 500; }
    .gen-card__key::after { content: ' '; }
  </style>
</head>
<body>
  <!-- Generation log (first element) -->
  <div class="gen-card" data-name="Generation log">
    <div class="gen-card__label">GENERATED</div>
    <div class="gen-card__field"><span class="gen-card__key">Skill</span> generate-presentation</div>
    <div class="gen-card__field"><span class="gen-card__key">Prompt</span> {{user prompt, truncated to 200 chars}}</div>
    <div class="gen-card__field"><span class="gen-card__key">Date</span> {{ISO 8601 date+time}}</div>
    <div class="gen-card__field"><span class="gen-card__key">Duration</span> {{prompt to file save}}</div>
    <div class="gen-card__field"><span class="gen-card__key">Model</span> {{model ID}}</div>
    <div class="gen-card__field"><span class="gen-card__key">Plugin</span> v{{plugin version}}</div>
  </div>
  <!-- Slides go here -->
</body>
</html>
```

## Template HTML patterns

### Cover slide

```html
<div class="slide" data-name="Cover — [Title]"
     style="background: linear-gradient(80deg, #090952 2%, #1414B8 107%);">
  <!-- BG graphic: use CSS geometric shapes or captured SVG -->
  <div style="position:absolute;top:88px;left:80px;font-family:'Roboto',sans-serif;font-size:40px;font-weight:500;color:white;">[Topic]</div>
  <div style="position:absolute;top:166px;left:69px;width:1760px;font-family:'Roboto',sans-serif;font-size:130px;font-weight:500;color:white;line-height:1.02;">[Title]</div>
  <div style="position:absolute;top:341px;left:69px;width:1760px;font-family:'Roboto',sans-serif;font-size:60px;font-weight:400;color:white;line-height:1.02;">[Subtitle]</div>
  <div style="position:absolute;top:931px;left:80px;font-family:'Roboto',sans-serif;font-size:32px;font-weight:400;color:white;">[Date]</div>
  <div style="position:absolute;top:980px;left:80px;font-family:'Roboto',sans-serif;font-size:32px;font-weight:400;color:white;">[Creators]</div>
  <!-- Actian pyramid placeholder bottom-right -->
  <div style="position:absolute;bottom:65px;right:80px;width:80px;height:68px;display:flex;align-items:center;justify-content:center;">
    <div style="width:0;height:0;border-left:28px solid transparent;border-right:28px solid transparent;border-bottom:48px solid rgba(255,255,255,0.3);"></div>
  </div>
</div>
```

### Body (Full content)

```html
<div class="slide" data-name="[Slide title]" style="background:white;">
  <div style="position:absolute;top:64px;left:80px;width:1760px;font-family:'Roboto',sans-serif;font-size:56px;font-weight:400;color:#12131F;line-height:1.03;">[Title]</div>
  <div style="position:absolute;top:187px;left:79px;width:1761px;height:829px;background:#F5F5FA;border-radius:4px;display:flex;align-items:center;justify-content:center;">
    <!-- Content: charts, tables, diagrams, screenshots -->
  </div>
</div>
```

### Body (Text + Visual)

```html
<div class="slide" data-name="[Slide title]" style="background:white;">
  <div style="position:absolute;top:64px;left:80px;width:1760px;font-family:'Roboto',sans-serif;font-size:56px;font-weight:400;color:#12131F;line-height:1.03;">[Title]</div>
  <div style="position:absolute;top:187px;left:80px;width:549px;height:829px;font-family:'Roboto',sans-serif;font-size:24px;font-weight:400;color:black;line-height:1.3;">
    <!-- Body text, bullet points, key takeaways -->
  </div>
  <div style="position:absolute;top:187px;left:685px;width:1155px;height:829px;background:#F5F5FA;border-radius:4px;display:flex;align-items:center;justify-content:center;">
    <!-- Visual: diagram, screenshot, component preview -->
  </div>
</div>
```

### Section divider

```html
<div class="slide" data-name="Section — [Title]"
     style="background: linear-gradient(80deg, #EEEEFD 2%, #CBDAFF 107%);">
  <!-- Light BG graphic -->
  <div style="position:absolute;top:361px;left:69px;width:1760px;font-family:'Roboto',sans-serif;font-size:60px;font-weight:400;color:#12131F;line-height:1.02;">[Topic]</div>
  <div style="position:absolute;top:449px;left:69px;width:1760px;font-family:'Roboto',sans-serif;font-size:130px;font-weight:500;color:#12131F;line-height:1.02;">[Title]</div>
</div>
```

### Back cover

```html
<div class="slide" data-name="Back cover"
     style="background: linear-gradient(80deg, #090952 2%, #1414B8 107%);">
  <!-- BG graphic -->
  <div style="position:absolute;top:421px;left:80px;width:1760px;font-family:'Roboto',sans-serif;font-size:152px;font-weight:500;color:white;line-height:1.02;">Thank you</div>
  <!-- Actian pyramid placeholder -->
  <div style="position:absolute;bottom:65px;right:80px;width:80px;height:68px;display:flex;align-items:center;justify-content:center;">
    <div style="width:0;height:0;border-left:28px solid transparent;border-right:28px solid transparent;border-bottom:48px solid rgba(255,255,255,0.3);"></div>
  </div>
</div>
```

## Background geometric pattern

For Cover, Section, and Back cover slides:

```html
<div style="position:absolute;inset:0;overflow:hidden;pointer-events:none;">
  <div style="position:absolute;top:-20%;right:-10%;width:60%;height:140%;background:rgba(255,255,255,0.06);transform:rotate(-60deg);border-radius:20px;"></div>
  <div style="position:absolute;top:10%;right:-20%;width:50%;height:120%;background:rgba(255,255,255,0.04);transform:rotate(-60deg);border-radius:20px;"></div>
  <div style="position:absolute;top:-30%;right:5%;width:45%;height:130%;background:rgba(255,255,255,0.08);transform:rotate(-60deg);border-radius:20px;"></div>
</div>
```

For light Section dividers: `rgba(0,0,100,0.03)` instead of white.

## Content inside body slides

- **Data/metrics** — stat cards, bar charts (divs), donut charts (CSS)
- **Bullet points** — Roboto 24px, `#12131F`, line-height 1.5
- **Figma screenshots** — `get_screenshot` + embed
- **Comparison tables** — 11px uppercase headers, `#717D96`
- **Timelines** — horizontal/vertical progress indicators
- **Component previews** — DS2026 tokens
- **Flow diagrams** — simplified boxes + arrows

Style with `--zen-*` tokens. Text in content areas: Roboto 20-24px, `#12131F` or `#475467`.

## Available CSS chart types

No JavaScript dependencies:
- **Stat cards** — single large metric with context
- **Horizontal bar charts** — div-based, width percentages
- **Donut charts** — conic-gradient, max 5 segments
- **Progress bars** — with threshold marker
- **Timelines** — horizontal dot + line milestones
- **Flow diagrams** — boxes + connecting lines
- **Comparison tables** — side-by-side features
- **Before/after cards** — two stat cards with arrow

All charts use `--zen-color-category-N-strong` tokens. Never hardcode chart colors.

## Figma output — slide types

Each slide: **1920 x 1080 px**, auto-layout inside. Font: **Roboto**.

- **Cover**: `theme-primary` gradient, inverse text 48px bold + 24px subtitle
- **Body (Text + Visual)**: `background-bg-default`, two-column, heading 32px bold, body 18px
- **Section divider**: `background-bg-grey-2`, centered 36px bold
- **Back cover**: `theme-primary` gradient, inverse text

Token binding: `../../references/figma-output.md` § "Token binding". Variable keys: `../../docs/meta-kit/variables.md`.
Shared components: `../../docs/meta-kit/components.md` (Do-Don't Pair, Code Block).
Tables: `../../references/meta-kit/builders.md` (`buildSpecTable`).

### Charts in `use_figma`

- **Bar charts** — rectangles using `category-N-strong` hex
- **Data tables** — horizontal auto-layout with header + data rows
- **Complex charts** — placeholder frame labeled `"Chart: [description]"`

### Execution sequence

1. Generation metadata first (key: `a9653f30925367e96dea90093d750bfe70849571`)
2. One `use_figma` call per slide (20KB limit)
3. Arrange horizontally with 40px gap
4. Screenshot + show user
