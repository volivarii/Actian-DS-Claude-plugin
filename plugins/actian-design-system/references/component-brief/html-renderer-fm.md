# Brief HTML Renderer — Fat Marker (FM)

Mechanical process that converts `brief-data.json` into `[component]-spec.html` for FM mode. No AI interpretation — only data → card builders → file. FM mode has 5 cards (not 9), uses Inter font, 820px cards, dark page header, and the FM color palette.

## Process

1. Read `brief-data.json`
2. Read `templates/fm-wrapper.html` (CSS framework only — no card template files needed)
3. Build each card's HTML from the data model using the card builders below
4. Replace `{{GENERATION_CARD}}` with the gen card HTML from `meta`
5. Replace `{{CARDS}}` with the concatenated card HTML
6. Replace `{{PAGE_TITLE}}` with `${card1_header.name} — Fat Marker Component Brief`
7. Write `{project}/components/[name]/[name]-spec.html`

**No card template files are read.** The card structures below replace any `fm-card-1-*.html` through `fm-card-5-*.html` files. The wrapper's CSS framework provides all styling classes.

## Wrapper placeholders

| Placeholder | Source |
|------------|--------|
| `{{PAGE_TITLE}}` | `${card1_header.name} — Fat Marker Component Brief` |
| `{{GENERATION_CARD}}` | Gen card HTML from `meta` (see below) |
| `{{CARDS}}` | Concatenated card HTML from builders below |

## Generation card

```html
<div class="gen-card" data-name="Generation log">
  <div class="gen-card__label">GENERATED</div>
  <div class="gen-card__field"><span class="gen-card__key">Skill</span> ${meta.skill}</div>
  <div class="gen-card__field"><span class="gen-card__key">Prompt</span> component-brief ${meta.component}</div>
  <div class="gen-card__field"><span class="gen-card__key">Date</span> ${meta.generatedAt}</div>
  <div class="gen-card__field"><span class="gen-card__key">Duration</span> ${meta.duration}</div>
  <div class="gen-card__field"><span class="gen-card__key">Model</span> ${meta.model}</div>
  <div class="gen-card__field"><span class="gen-card__key">Plugin</span> v${meta.pluginVersion}</div>
</div>
```

## AI-interpreted part: Component HTML

Card 2 needs to render the actual FM component visually in HTML (e.g., a wireframe-style button with border, fill, and label). This is the ONLY part that requires AI interpretation — the AI writes a `componentHtml(variantName)` function and component-specific CSS once. Everything else is mechanical.

FM components use the FM palette (see wrapper comment):
- Background: `#FFFFFF`
- Stroke: `#B0B0B0`
- Text: `#333333`
- Primary fill: `#333333`
- Primary text: `#FFFFFF`

Add the component-specific CSS inside a `<style>` tag within Card 2.

---

## Card 1 — Page header (dark card)

```html
<div class="card card--dark" data-name="Page header">
  <div class="page-header">
    <div class="page-header__source">${card1_header.source}</div>
    <div class="page-header__title">${card1_header.name}</div>
    <div class="page-header__subtitle">${card1_header.description}</div>
  </div>
</div>
```

## Card 2 — Actual component (Locked)

Variant grid column count is driven by `card2_component.gridColumns`. Use `variant-grid--${gridColumns}col` class (e.g., `variant-grid--3col`, `variant-grid--2col`).

```html
<div class="card" data-name="Actual component (Locked)">
  <div class="card-header">
    <div class="card-header__title">Actual component (Locked)</div>
    <div class="card-header__subtitle">All variants of the component as they appear in the wireframe kit.</div>
  </div>
  <div class="card-content">
    <style>${componentSpecificCss}</style>
    <div class="section" data-name="Variants">
      <div class="section__title">Variants</div>
      <div class="variant-grid variant-grid--${card2_component.gridColumns}col">
        ${card2_component.variants.map(v => `
          <div class="variant-cell">
            ${componentHtml(v.variantName)}
            <div class="variant-cell__label">${v.label}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</div>
```

## Card 3 — Design guidelines

Each section in `card3_design_guidelines.sections` is rendered as a titled block of narrative prose.

```html
<div class="card" data-name="Design guidelines">
  <div class="card-header">
    <div class="card-header__title">Design guidelines</div>
    <div class="card-header__subtitle">Behavior, accessibility, and interaction patterns for ${card1_header.name}.</div>
  </div>
  <div class="card-content">
    ${card3_design_guidelines.sections.map(s => `
      <div class="section">
        <div class="section__title">${s.title}</div>
        <div class="section__subtitle">${s.body}</div>
      </div>
    `).join('')}
  </div>
</div>
```

## Card 4 — Content guidelines

When-to-use paragraph followed by Do/Don't pairs rendered in a 2-column grid. Each pair emits a do card and a don't card as adjacent siblings.

```html
<div class="card" data-name="Content guidelines">
  <div class="card-header">
    <div class="card-header__title">Content guidelines</div>
    <div class="card-header__subtitle">When to use ${card1_header.name} and content do's and don'ts.</div>
  </div>
  <div class="card-content">
    <div class="section" data-name="When to use">
      <div class="section__title">When to use</div>
      <div class="section__subtitle">${card4_content_guidelines.whenToUse}</div>
    </div>
    <div class="section" data-name="Do and Don't">
      <div class="section__title">Do &amp; Don't</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        ${card4_content_guidelines.doDont.map(pair => `
          <div class="do-card">
            <div class="do-card__bar do-card__bar--do"></div>
            <div class="do-card__body do-card__body--do">
              <div class="do-card__label do-card__label--do">Do</div>
              <p style="font-size:13px;color:#2D3648;">${pair.do}</p>
            </div>
          </div>
          <div class="do-card">
            <div class="do-card__bar do-card__bar--dont"></div>
            <div class="do-card__body do-card__body--dont">
              <div class="do-card__label do-card__label--dont">Don't</div>
              <p style="font-size:13px;color:#2D3648;">${pair.dont}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</div>
```

## Card 5 — Anatomy

Diagram with numbered pointer badges, an inline legend row, and a parts reference table. The diagram renders `componentHtml('default')`. Badge numbers and names come from `card5_anatomy.parts`.

```html
<div class="card" data-name="Anatomy">
  <div class="card-header">
    <div class="card-header__title">Anatomy</div>
    <div class="card-header__subtitle">Structural breakdown with numbered callouts and specifications.</div>
  </div>
  <div class="card-content">
    <div class="section" data-name="Structure">
      <div class="anatomy-diagram">
        ${componentHtml('default')}
      </div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:16px;">
        ${card5_anatomy.parts.map(p => `
          <div style="display:flex;align-items:center;gap:6px;">
            <div class="pointer-badge">${p.number}</div>
            <span style="font-size:13px;color:#475467;">${p.name}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="section" data-name="Parts reference">
      <div class="section__title">Parts reference</div>
      <table>
        <thead>
          <tr>
            <th style="width:40px;">#</th>
            <th>Element</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${card5_anatomy.parts.map(p => `
            <tr>
              <td><div class="pointer-badge">${p.number}</div></td>
              <td><strong>${p.name}</strong></td>
              <td>${p.description}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>
```

## Annotation layer

Add before `</body>`:

```html
<script src="/_plugin/annotation-loader.js" defer></script>
```
