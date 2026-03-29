# Brief HTML Renderer

Mechanical process that converts `brief-data.json` into `[component]-spec.html`. No AI interpretation — only data → card builders → file.

## Process

1. Read `brief-data.json`
2. Read `templates/ds-wrapper.html` (CSS framework only — no card template files needed)
3. Build each card's HTML from the data model using the card builders below
4. Replace `{{GENERATION_CARD}}` with the gen card HTML from `meta`
5. Replace `{{CARDS}}` with the concatenated card HTML
6. Replace `{{PAGE_TITLE}}` with `${card1_header.name} — Actian DS2026 Component Brief`
7. Write `{project}/components/[name]/[name]-spec.html`

**No card template files are read.** The card structures below replace `ds-card-1-*.html` through `ds-card-9-*.html`. The wrapper's CSS framework provides all styling classes.

## Wrapper placeholders

| Placeholder | Source |
|------------|--------|
| `{{PAGE_TITLE}}` | `${meta.component} — Actian DS2026 Component Brief` |
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

## Shared helper: tokenized code renderer

Used by Cards 8 and 9. Maps token types to CSS classes.

```
tokenClassMap = { selector: 'sel', property: 'prop', value: 'val', comment: 'cm', keyword: 'kw', string: 'str', punctuation: 'punc', tag: 'tag', attribute: 'attr', function: 'fn' }

renderTokenizedCode(tokens):
  For each token:
    if token.type === 'newline' → '\n'
    else → <span class="${tokenClassMap[token.type] || ''}">${escapeHtml(token.text)}</span>
```

## AI-interpreted part: Component HTML

Cards 2 and 3 need to render the actual component visually in HTML (e.g., an input field with label, border, placeholder). This is the ONLY part that requires AI interpretation — the AI writes a `componentHtml(variantName)` function and component-specific CSS once during Step 2. Everything else is mechanical.

Add the component-specific CSS inside a `<style>` tag within Card 2.

---

## Card 1 — Page header

```html
<div class="brief-card--header" data-name="Page header">
  <div class="card-title-row">
    <div class="card-title" data-name="Component name">${card1_header.name}</div>
    <svg class="card-logo" width="40" height="40" viewBox="0 0 40 40">
      <rect width="40" height="40" rx="4" fill="#0550DC"/>
    </svg>
  </div>
  <p class="card-body">${card1_header.description}</p>
</div>
```

## Card 2 — Actual component

```html
<style>${componentSpecificCss}</style>
<div class="brief-card" data-name="Actual component">
  <div class="card-section-header">
    <div class="card-section-header__title">Actual component</div>
    <div class="card-section-header__subtitle">Live component across all states and theme modes</div>
  </div>
  <div class="card-content">
    <div class="section" data-name="Variant matrix">
      <table class="variant-matrix">
        <thead>
          <tr>
            <th>Type</th>
            ${variantMatrix[0].columns.map(c => '<th>' + c.label + '</th>').join('')}
          </tr>
        </thead>
        <tbody>
          ${variantMatrix.map(row => `
            <tr>
              <td style="font-weight:600;white-space:nowrap;">${row.row}</td>
              ${row.columns.map(col => `
                <td style="text-align:center;">
                  ${componentHtml(col.variantName)}
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="card-divider"></div>
    <div class="section" data-name="Theme comparison">
      <div class="section-title">Theme comparison</div>
      <div class="theme-row">
        ${['actian', 'studio', 'explorer'].map(theme => `
          <div class="theme-card">
            <div class="theme-card__label">${theme.charAt(0).toUpperCase() + theme.slice(1)}</div>
            <div class="theme-card__states">
              ${componentHtml(themeComparison[theme].variantName, theme)}
            </div>
            <div class="theme-card__swatches">
              ${themeComparison[theme].swatches.map(s => `
                <div class="swatch">
                  <span class="swatch__dot" style="background:${s.hex};"></span>
                  <span class="swatch__name">${s.token}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</div>
```

## Card 3 — Anatomy

```html
<div class="brief-card" data-name="Anatomy">
  <div class="card-section-header">
    <div class="card-section-header__title">Anatomy</div>
    <div class="card-section-header__subtitle">Component structure, dimensions, interactive states, and part-level token mapping</div>
  </div>
  <div class="card-content">
    <!-- Structure -->
    <div class="section" data-name="Structure">
      <div class="section-title">Structure</div>
      <div class="anatomy-box">
        <div class="anatomy-component">
          <span class="anatomy-component__label">${card1_header.name} — Default</span>
          ${componentHtml('default')}
        </div>
        <div class="anatomy-props">
          ${card3_anatomy.parts.map(p => `
            <div class="anatomy-prop">
              <div class="anatomy-prop__label">${p.letter} · ${p.name.toUpperCase()}</div>
              <div class="anatomy-prop__value">${p.description}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="section-body">${card3_anatomy.parts.map(p => p.letter + ' — ' + p.name).join(' · ')}</div>
    </div>
    <div class="card-divider"></div>

    <!-- Specs -->
    <div class="section" data-name="Specs">
      <div class="section-title">Specs</div>
      <div style="display:flex;gap:64px;align-items:flex-start;">
        <div style="position:relative;">
          ${componentHtml('default')}
          ${card3_anatomy.specs.map(spec => `
            <div style="color:#E91E8C;font-size:11px;font-weight:600;white-space:nowrap;">
              ${spec.label} <span style="font-weight:400;color:#888;">${spec.target}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    <div class="card-divider"></div>

    <!-- States -->
    <div class="section" data-name="States">
      <div class="section-title">States</div>
      <div class="state-grid">
        ${card3_anatomy.states.map(state => `
          <div class="state-col">
            <div class="state-label">${state}</div>
            ${componentHtml(stateVariantName(state))}
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card-divider"></div>

    <!-- Parts reference -->
    <div class="section" data-name="Parts reference">
      <div class="section-title">Parts reference</div>
      <table class="spec-table">
        <thead>
          <tr><th>Part</th><th>Element</th><th>Token</th><th>Notes</th></tr>
        </thead>
        <tbody>
          ${card3_anatomy.partsTable.map(r => `
            <tr>
              <td>${r.part}</td>
              <td>${r.element}</td>
              <td><code>${r.token}</code></td>
              <td>${r.notes}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>
```

## Card 4 — Design tokens

```html
<div class="brief-card" data-name="Design tokens">
  <div class="card-section-header">
    <div class="card-section-header__title">Design tokens</div>
    <div class="card-section-header__subtitle">Color, sizing, spacing, and typography tokens mapped to each variant and state</div>
  </div>
  <div class="card-content">
    <!-- Color tokens -->
    <div class="section" data-name="Color tokens">
      <div class="section-title">Color tokens</div>
      <table class="spec-table">
        <thead>
          <tr>
            <th>Variant · State</th>
            ${card4_tokens.colorTokens[0].columns.map(c => '<th>' + c.header + '</th>').join('')}
          </tr>
        </thead>
        <tbody>
          ${card4_tokens.colorTokens.map(row => `
            <tr>
              <td style="font-weight:600;white-space:nowrap;">${row.state}</td>
              ${row.columns.map(col => `
                <td>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span class="swatch__dot" style="background:${col.hex};"></span>
                    <span>${col.token} <code style="color:#888;">(${col.hex})</code></span>
                  </div>
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="card-divider"></div>

    <!-- Sizing & spacing -->
    <div class="section" data-name="Sizing and spacing">
      <div class="section-title">Sizing & spacing</div>
      <table class="spec-table">
        <thead><tr><th>Property</th><th>Token</th><th>Value</th></tr></thead>
        <tbody>
          ${card4_tokens.sizingTokens.map(r => `
            <tr>
              <td>${r.property}</td>
              <td><code>${r.token}</code></td>
              <td>${r.value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="card-divider"></div>

    <!-- Typography -->
    <div class="section" data-name="Typography">
      <div class="section-title">Typography</div>
      ${card4_tokens.typography.map(t => `
        <div style="display:flex;align-items:baseline;gap:24px;margin-bottom:16px;">
          <div style="font-size:14px;"><strong>${t.element}</strong></div>
          <div style="font-size:12px;color:#888;">${t.token} · ${t.font} · ${t.tracking} tracking</div>
        </div>
      `).join('')}
    </div>
  </div>
</div>
```

## Card 5 — Component API

```html
<div class="brief-card" data-name="Component API">
  <div class="card-section-header">
    <div class="card-section-header__title">Component API</div>
    <div class="card-section-header__subtitle">Configurable properties, types, defaults, and allowed values</div>
  </div>
  <div class="card-content">
    <div class="section" data-name="Props table">
      <table class="spec-table">
        <thead>
          <tr><th></th><th>Property</th><th>Type</th><th>Default</th><th>Values</th><th>Notes</th></tr>
        </thead>
        <tbody>
          ${card5_api.props.map(p => `
            <tr>
              <td><span class="badge badge--${p.required ? 'req' : 'opt'}">${p.required ? 'REQ' : 'OPT'}</span></td>
              <td><code>${p.name}</code></td>
              <td style="color:#C792EA;">${p.type}</td>
              <td style="color:#C3E88D;">${p.default}</td>
              <td>${p.values}</td>
              <td>${p.notes}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>
```

## Card 6 — Usage guidelines

```html
<div data-name="Usage guidelines" style="width:960px;background:#fff;border-radius:16px;padding:48px;">
  <div class="card-section-header">
    <div class="card-section-header__title">Usage guidelines</div>
    <div class="card-section-header__subtitle">When and how to use each ${card1_header.name} type, with do and don't examples.</div>
  </div>
  <div class="card-content">
    <div data-name="When to use">
      <div class="card-sub-heading">When to use</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${card6_usage.whenToUse.map(item => `
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <span style="color:#047800;font-weight:700;font-size:16px;">+</span>
            <span class="section-body">${item}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card-divider"></div>
    <div data-name="When not to use">
      <div class="card-sub-heading">When NOT to use</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${card6_usage.whenNotToUse.map(item => `
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <span style="color:#C10C0D;font-weight:700;font-size:16px;">&minus;</span>
            <span class="section-body">${item}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card-divider"></div>
    <div data-name="Do and don't">
      <div class="card-sub-heading">Do / Don't</div>
      <div style="display:flex;flex-direction:column;gap:16px;">
        ${card6_usage.doDont.map(pair => `
          <div class="do-dont-row">
            <div class="do-dont-card">
              <div class="do-dont-card__bar do-dont-card__bar--do"></div>
              <div class="do-dont-card__label" style="color:#047800;">Do &mdash; ${pair.doLabel}</div>
              <div class="do-dont-card__example">${pair.doDetail}</div>
            </div>
            <div class="do-dont-card">
              <div class="do-dont-card__bar do-dont-card__bar--dont"></div>
              <div class="do-dont-card__label" style="color:#C10C0D;">Don't &mdash; ${pair.dontLabel}</div>
              <div class="do-dont-card__example">${pair.dontDetail}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</div>
```

## Card 7 — Content guidelines

```html
<div data-name="Content guidelines" style="width:960px;background:#fff;border-radius:16px;padding:48px;">
  <div class="card-section-header">
    <div class="card-section-header__title">Content guidelines</div>
    <div class="card-section-header__subtitle">Label copy rules for ${card1_header.name}.</div>
  </div>
  <div class="card-content">
    ${card7_content.rules.map(rule => `
      <div class="section" data-name="${rule.title}">
        <div class="section-title">${rule.title}</div>
        <div class="section-body">${rule.description}</div>
        <div class="do-dont-row" style="margin-top:12px;">
          <div class="do-dont-card">
            <div class="do-dont-card__bar do-dont-card__bar--do"></div>
            <div class="do-dont-card__label" style="color:#047800;">Do</div>
            <div class="do-dont-card__example">${rule.do}</div>
          </div>
          <div class="do-dont-card">
            <div class="do-dont-card__bar do-dont-card__bar--dont"></div>
            <div class="do-dont-card__label" style="color:#C10C0D;">Don't</div>
            <div class="do-dont-card__example">${rule.dont}</div>
          </div>
        </div>
      </div>
      <div class="card-divider"></div>
    `).join('')}
    ${card7_content.terminology.length > 0 ? `
      <div data-name="Terminology">
        <div class="card-sub-heading">Terminology</div>
        <table class="spec-table">
          <thead><tr><th style="width:200px;">Term</th><th>When to use</th></tr></thead>
          <tbody>
            ${card7_content.terminology.map(t => `
              <tr>
                <td style="font-weight:600;">${t.term}</td>
                <td>${t.use}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}
  </div>
</div>
```

## Card 8 — Accessibility

```html
<div data-name="Accessibility" style="width:960px;background:#fff;border-radius:16px;padding:48px;">
  <div class="card-section-header">
    <div class="card-section-header__title">Accessibility</div>
    <div class="card-section-header__subtitle">WCAG 2.1 AA requirements, keyboard navigation, ARIA patterns, and contrast ratios for ${card1_header.name}.</div>
  </div>
  <div class="card-content">
    <div data-name="A11y requirements">
      <div class="card-sub-heading">Requirements</div>
      <div class="a11y-grid">
        ${card8_accessibility.requirements.map(req => `
          <div class="a11y-card">
            <div class="a11y-card__icon a11y-card__icon--${req.icon}"></div>
            <div class="a11y-card__title">${req.title}</div>
            <div class="a11y-card__body">${req.body}</div>
            <div class="a11y-card__code">
              <pre>${renderTokenizedCode(req.code.tokens)}</pre>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="card-divider"></div>

    ${card8_accessibility.ariaTable && card8_accessibility.ariaTable.length > 0 ? `
      <div data-name="ARIA specification">
        <div class="card-sub-heading">ARIA specification</div>
        <table class="spec-table">
          <thead>
            <tr><th>Element</th><th>Role</th><th>Label</th><th>Focus Order</th><th>Keyboard</th><th>Announcement</th></tr>
          </thead>
          <tbody>
            ${card8_accessibility.ariaTable.map(r => `
              <tr>
                <td style="font-weight:600;">${r.element}</td>
                <td><code>${r.role}</code></td>
                <td><code>${r.label}</code></td>
                <td>${r.focusOrder}</td>
                <td>${r.keyboard}</td>
                <td>${r.announcement}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="card-divider"></div>
    ` : ''}

    <div data-name="Contrast ratios">
      <div class="card-sub-heading">Contrast ratios</div>
      <table class="spec-table">
        <thead>
          <tr><th>Element</th><th>Foreground</th><th>Background</th><th>Ratio</th><th>WCAG AA</th></tr>
        </thead>
        <tbody>
          ${card8_accessibility.contrastTable.map(r => `
            <tr>
              <td>${r.element}</td>
              <td>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span class="swatch__dot" style="background:${r.foreground};"></span>
                  ${r.foreground}
                </div>
              </td>
              <td>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span class="swatch__dot" style="background:${r.background};"></span>
                  ${r.background}
                </div>
              </td>
              <td>${r.ratio}</td>
              <td><span class="badge badge--${r.wcag === 'Pass' ? 'pass' : r.wcag === 'Exempt' ? 'exempt' : 'fail'}">${r.wcag}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>
```

## Card 9 — Code specification

```html
<div data-name="Code specification" style="width:960px;background:#fff;border-radius:16px;padding:48px;">
  <div class="card-section-header">
    <div class="card-section-header__title">Code specification</div>
    <div class="card-section-header__subtitle">CSS custom properties for ${card1_header.name}.</div>
  </div>
  <div class="card-content">
    <div data-name="Code block" style="background:#1E1E2E;border-radius:8px;padding:16px;overflow-x:auto;">
      <pre style="margin:0;white-space:pre;font-family:'Fira Code',monospace;font-size:12px;line-height:1.6;color:#BABED8;">${renderTokenizedCode(card9_code.tokens)}</pre>
    </div>
  </div>
</div>
```

## Annotation layer

Add before `</body>`:

```html
<script src="/_plugin/annotation-loader.js" defer></script>
```
