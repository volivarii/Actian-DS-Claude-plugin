#!/usr/bin/env node
'use strict';

/**
 * brief-to-figma.js — Deterministic transformer: brief-data.json -> Figma plugin JS code
 *
 * Usage:
 *   node scripts/brief-to-figma.js <brief-data.json> --target-node-id <id> [--call N] [--output <path>] [--output-dir <dir>]
 *
 * Reads brief-data.json, builds card nodes, then uses figma-codegen.js to generate
 * self-contained Figma plugin JS code.
 *
 * Output: JSON array of { callIndex, code, description } to stdout
 *         With --output-dir: writes call-N.js files + manifest.json to <dir>
 */

const fs = require('fs');
const path = require('path');
const codegen = require('./figma-codegen');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IMPORTS = {
  briefCard:      { key: '3dbb732730af0754210cde7af35e5236a2502843', method: 'set' },
  doDontPair:     { key: '28edfacf13e50706586172bd48f8a3ad84d7c263', method: 'set' },
  colorSwatch:    { key: 'da3369932f710386b76ca91a40ebd48d94e3f2e0', method: 'set' },
  contrastBadge:  { key: '941756541adc6ce21e32e848c2039c64fece0fcf', method: 'set' },
  pointerBadge:   { key: '7e066fc21d9a2bbbcd1149113787cf59140162d4', method: 'set' },
  dimAnnotation:  { key: '49bf6a1b210a403ba145a3fdee9b1994eb54069a', method: 'set' },
  a11yCard:       { key: 'b4779a13f4097d682413a669eaaf9ead1b49f115', method: 'set' },
  codeBlock:      { key: '1bf10eee1751a46da5f90a9671be6c9abf0073b7', method: 'single' },
  genLog:         { key: 'a9653f30925367e96dea90093d750bfe70849571', method: 'single' },
  divider:        { key: 'f4d778e1cf9bb61a33712c791486f54bb1c095b7', method: 'single' }
};

const FONTS = [
  'Inter:Regular',
  'Inter:Semi Bold',
  'Inter:Bold',
  'Inter:Medium',
  'Fira Code:Regular',
  'Roboto:Regular'
];

const TOKEN_COLORS = {
  selector:    '#FF79C6',
  property:    '#82AAFF',
  value:       '#C3E88D',
  comment:     '#676E95',
  keyword:     '#C792EA',
  string:      '#C3E88D',
  punctuation: '#BABED8',
  tag:         '#FF5370',
  attribute:   '#FFCB6B',
  'function':  '#82AAFF',
  text:        '#BABED8'
};

const PALETTE = {
  textPrimary:     '#1A1A2E',
  textSecondary:   '#595968',
  textTertiary:    '#888888',
  bgGrey:          '#F5F5FA',
  bgLight:         '#F9FAFB',
  white:           '#FFFFFF',
  errorRed:        '#C10C0D',
  successGreen:    '#047800',
  errorBg:         '#FEF3F2',
  annotationPink:  '#E91E8C',
};

// Max raw JSON bytes per bin (keeps generated code under ~45KB)
const MAX_BIN_SIZE = 3500; // bytes — keeps generated code under 45KB (expansion ratio ~12x)
const OVERHEAD = 500;      // meta + fonts + imports envelope

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Returns a TEXT spec node */
function textNode(content, font, size, color, opts) {
  opts = opts || {};
  const node = { type: 'TEXT', content, font, size, color };
  if (opts.width != null) node.width = opts.width;
  if (opts.textCase) node.textCase = opts.textCase;
  if (opts.textRanges) node.textRanges = opts.textRanges;
  if (opts.name) node.name = opts.name;
  return node;
}

/** Returns a section title TEXT node — Inter:Semi Bold 16px textPrimary */
function sectionTitle(title) {
  return textNode(title, 'Inter:Semi Bold', 16, PALETTE.textPrimary);
}

/** Returns a DIVIDER spec node */
function dividerNode() {
  return { type: 'DIVIDER' };
}

/** Returns a table FRAME with header row + data rows */
function tableFrame(name, headers, rows, colWidths) {
  const headerChildren = headers.map((h, i) =>
    textNode(h, 'Inter:Bold', 12, PALETTE.textSecondary, { width: colWidths[i] })
  );

  const headerRow = {
    type: 'FRAME',
    name: 'Header',
    layout: { mode: 'HORIZONTAL', spacing: 0, padding: [8, 12, 8, 12] },
    fills: [PALETTE.bgGrey],
    children: headerChildren,
    sizing: { horizontal: 'FILL', vertical: 'HUG' }
  };

  const dataRows = rows.map((row, ri) => {
    const cells = row.map((cell, ci) => {
      // If cell is already a spec node (object with type), use it directly
      if (cell && typeof cell === 'object' && cell.type) return cell;
      // If cell is a frame (object with children), use it directly
      if (cell && typeof cell === 'object' && cell.children) return cell;
      // Otherwise, make a text node
      return textNode(String(cell), 'Inter:Regular', 14, PALETTE.textPrimary, { width: colWidths[ci] });
    });
    return {
      type: 'FRAME',
      name: `Row ${ri}`,
      layout: { mode: 'HORIZONTAL', spacing: 0, padding: [8, 12, 8, 12] },
      fills: [],
      children: cells,
      sizing: { horizontal: 'FILL', vertical: 'HUG' }
    };
  });

  return {
    type: 'FRAME',
    name: name,
    layout: { mode: 'VERTICAL', spacing: 0, padding: [0, 0, 0, 0] },
    fills: [],
    children: [headerRow, ...dataRows],
    sizing: { horizontal: 'FILL', vertical: 'HUG' }
  };
}

/** Returns a FRAME with colorSwatch INSTANCE + TEXT for a token cell */
function isValidHex(s) {
  return /^#[0-9A-Fa-f]{6}$/.test(s);
}

function swatchCell(hex, tokenName) {
  // Normalize non-hex values: "none", "transparent", "rgba(...)" → use empty fills
  const fills = isValidHex(hex) ? [hex] : [];
  return {
    type: 'FRAME',
    name: `Cell: ${tokenName}`,
    layout: { mode: 'HORIZONTAL', spacing: 6, padding: [0, 0, 0, 0] },
    fills: [],
    children: [
      {
        type: 'INSTANCE',
        ref: 'colorSwatch',
        variant: 'Size=Small',
        fills: fills,
        sizing: { horizontal: 'HUG', vertical: 'HUG' }
      },
      textNode(`${tokenName} ${hex}`, 'Fira Code:Regular', 11, PALETTE.textSecondary)
    ],
    sizing: { horizontal: 'HUG', vertical: 'HUG' }
  };
}

/** Converts code.tokens array to { content, textRanges } for syntax coloring */
function computeTextRanges(tokens) {
  let content = '';
  const textRanges = [];
  let offset = 0;

  for (const token of tokens) {
    if (token.type === 'newline') {
      content += '\n';
      offset += 1;
      continue;
    }
    const text = token.text || '';
    const start = offset;
    const end = offset + text.length;
    const color = TOKEN_COLORS[token.type] || '#BABED8';
    textRanges.push({ start, end, color });
    content += text;
    offset = end;
  }

  return { content, textRanges };
}

/** Returns a briefCard Standard INSTANCE with detach + children (the card shell) */
function cardShell(name, title, subtitle, children) {
  return {
    type: 'INSTANCE',
    ref: 'briefCard',
    name: name,
    variant: 'Mode=DS, Type=Standard',
    props: {
      Title: title,
      Subtitle: subtitle
    },
    detach: true,
    width: 960,
    children: children
  };
}

/** Returns a bullet row FRAME (for when-to-use / when-not-to-use) */
function bulletRow(text, prefix, prefixColor) {
  return {
    type: 'FRAME',
    name: `Bullet: ${text.substring(0, 40)}`,
    layout: { mode: 'HORIZONTAL', spacing: 8, padding: [0, 0, 0, 0] },
    fills: [],
    children: [
      textNode(prefix, 'Inter:Bold', 14, prefixColor),
      textNode(text, 'Inter:Regular', 14, PALETTE.textPrimary)
    ],
    sizing: { horizontal: 'FILL', vertical: 'HUG' }
  };
}

/** Returns a REQ or OPT badge FRAME */
function reqOptBadge(required) {
  const label = required ? 'REQ' : 'OPT';
  const bg    = required ? PALETTE.errorBg    : PALETTE.bgGrey;
  const fg    = required ? PALETTE.errorRed   : PALETTE.textTertiary;
  return {
    type: 'FRAME',
    name: label + ' badge',
    layout: { mode: 'HORIZONTAL', padding: [2, 6, 2, 6] },
    cornerRadius: 4,
    fills: [bg],
    children: [{
      type: 'TEXT',
      content: label,
      font: 'Inter:Bold',
      size: 10,
      color: fg
    }]
  };
}

// ---------------------------------------------------------------------------
// Card builders
// ---------------------------------------------------------------------------

/** Card 0 — Generation Log. Data source: meta */
function buildGenLog(meta) {
  return {
    type: 'INSTANCE',
    ref: 'genLog',
    name: 'Generation Log',
    props: {
      Skill: meta.skill || 'component-brief',
      Prompt: `component-brief ${meta.component}`,
      Date: meta.generatedAt,
      Duration: meta.duration,
      Model: meta.model,
      Plugin: meta.pluginVersion || 'unknown'
    },
    sizing: { horizontal: 'HUG', vertical: 'HUG' }
  };
}

/** Card 1 — Page Header. Data source: card1_header */
function buildCard1(card1_header) {
  return {
    type: 'INSTANCE',
    ref: 'briefCard',
    name: 'Page header',
    variant: 'Mode=DS, Type=Page Header',
    props: {
      'Component Name': card1_header.name,
      Description: card1_header.description
    },
    detach: true,
    width: 960
  };
}

/** Card 2 — Actual Component. Data source: card2_component, meta */
function buildCard2(card2_component, meta) {
  const children = [];

  // Section title: Variant matrix
  children.push(sectionTitle('Variant matrix'));

  // Variant matrix rows
  for (const row of card2_component.variantMatrix) {
    const columns = row.columns.map(col => ({
      type: 'FRAME',
      name: col.label,
      layout: { mode: 'VERTICAL', spacing: 8, padding: [0, 0, 0, 0] },
      fills: [],
      children: [
        {
          type: 'LOCAL_INSTANCE',
          ref: 'targetComponent',
          variant: col.variantName,
          name: `${row.row} ${col.label}`
        },
        textNode(col.label, 'Inter:Medium', 12, PALETTE.textTertiary)
      ],
      sizing: { horizontal: 'HUG', vertical: 'HUG' }
    }));

    children.push({
      type: 'FRAME',
      name: `Row: ${row.row}`,
      layout: { mode: 'HORIZONTAL', spacing: 24, padding: [0, 0, 0, 0] },
      fills: [],
      children: columns,
      sizing: { horizontal: 'FILL', vertical: 'HUG' }
    });
  }

  // Divider
  children.push(dividerNode());

  // Section title: Theme comparison
  children.push(sectionTitle('Theme comparison'));

  // Theme comparison row
  const themeNames = ['actian', 'studio', 'explorer'];
  const themeLabels = { actian: 'Actian', studio: 'Studio', explorer: 'Explorer' };
  const themeFrames = [];

  for (const themeName of themeNames) {
    const theme = card2_component.themeComparison[themeName];
    if (!theme) continue;

    const swatchChildren = [];
    for (const swatch of (theme.swatches || [])) {
      swatchChildren.push({
        type: 'INSTANCE',
        ref: 'colorSwatch',
        variant: 'Size=Small',
        fills: [swatch.hex],
        sizing: { horizontal: 'HUG', vertical: 'HUG' }
      });
      swatchChildren.push(textNode(swatch.token, 'Inter:Regular', 11, PALETTE.textSecondary));
    }

    themeFrames.push({
      type: 'FRAME',
      name: `Theme: ${themeLabels[themeName]}`,
      layout: { mode: 'VERTICAL', spacing: 8, padding: [16, 16, 16, 16] },
      fills: [PALETTE.white],
      cornerRadius: 8,
      children: [
        textNode(themeLabels[themeName], 'Inter:Semi Bold', 14, PALETTE.textPrimary),
        {
          type: 'FRAME',
          name: 'Swatches',
          layout: { mode: 'HORIZONTAL', spacing: 12, padding: [0, 0, 0, 0] },
          fills: [],
          children: swatchChildren,
          sizing: { horizontal: 'HUG', vertical: 'HUG' }
        }
      ],
      sizing: { horizontal: 'HUG', vertical: 'HUG' }
    });
  }

  children.push({
    type: 'FRAME',
    name: 'Theme comparison row',
    layout: { mode: 'HORIZONTAL', spacing: 24, padding: [0, 0, 0, 0] },
    fills: [],
    children: themeFrames,
    sizing: { horizontal: 'FILL', vertical: 'HUG' }
  });

  return cardShell('Actual component', 'Actual component', 'Live component across all states and theme modes', children);
}

/** Card 3 — Anatomy. Data source: card3_anatomy */
function buildCard3(card3_anatomy) {
  const children = [];

  // Sub-section 1: Structure
  children.push(sectionTitle('Structure'));

  // Diagram frame with free positioning
  const diagramChildren = [];

  // Pointer badges for each part
  for (const part of card3_anatomy.parts) {
    diagramChildren.push({
      type: 'INSTANCE',
      ref: 'pointerBadge',
      name: `Badge ${part.letter}`,
      variant: 'Direction=Left',
      props: { Label: part.letter },
      sizing: { horizontal: 'HUG', vertical: 'HUG' }
    });

    // Leader line for each part
    diagramChildren.push({
      type: 'VECTOR',
      name: `Leader ${part.letter}`,
      paths: ['M 0 10 L 50 10'],
      stroke: { color: PALETTE.annotationPink, weight: 1 },
      fills: []
    });
  }

  children.push({
    type: 'FRAME',
    name: 'Structure diagram',
    layout: { mode: 'NONE' },
    fills: [PALETTE.bgLight],
    cornerRadius: 12,
    children: diagramChildren,
    sizing: { horizontal: 'FILL', vertical: 400 }
  });

  // Legend row
  const legendChildren = card3_anatomy.parts.map(part =>
    textNode(`${part.letter} \u2014 ${part.name}`, 'Inter:Regular', 12, PALETTE.textSecondary)
  );

  children.push({
    type: 'FRAME',
    name: 'Legend',
    layout: { mode: 'HORIZONTAL', spacing: 20, padding: [0, 0, 0, 0] },
    fills: [],
    children: legendChildren,
    sizing: { horizontal: 'FILL', vertical: 'HUG' }
  });

  // Sub-section 2: Specs
  children.push(dividerNode());
  children.push(sectionTitle('Specs'));

  const specChildren = [];
  for (const spec of card3_anatomy.specs) {
    const orientationVariant = spec.orientation === 'vertical'
      ? 'Orientation=Vertical'
      : 'Orientation=Horizontal';

    specChildren.push({
      type: 'INSTANCE',
      ref: 'dimAnnotation',
      name: `Spec: ${spec.target}`,
      variant: orientationVariant,
      props: { Value: spec.label },
      sizing: { horizontal: 'HUG', vertical: 'HUG' }
    });
  }

  children.push({
    type: 'FRAME',
    name: 'Specs diagram',
    layout: { mode: 'NONE' },
    fills: [PALETTE.bgLight],
    cornerRadius: 12,
    children: specChildren,
    sizing: { horizontal: 'FILL', vertical: 300 }
  });

  // Sub-section 3: States
  children.push(dividerNode());
  children.push(sectionTitle('States'));

  const stateColumns = card3_anatomy.states.map(state => ({
    type: 'FRAME',
    name: `State: ${state}`,
    layout: { mode: 'VERTICAL', spacing: 8, padding: [0, 0, 0, 0] },
    fills: [],
    children: [
      textNode(state, 'Inter:Medium', 12, PALETTE.textTertiary),
      {
        type: 'LOCAL_INSTANCE',
        ref: 'targetComponent',
        variant: `State=${state}`,
        name: `${state} state`
      }
    ],
    sizing: { horizontal: 'HUG', vertical: 'HUG' }
  }));

  children.push({
    type: 'FRAME',
    name: 'States grid',
    layout: { mode: 'HORIZONTAL', spacing: 24, padding: [0, 0, 0, 0] },
    fills: [],
    children: stateColumns,
    sizing: { horizontal: 'FILL', vertical: 'HUG' }
  });

  // Sub-section 4: Parts reference table
  children.push(dividerNode());
  children.push(sectionTitle('Parts reference'));

  const partsHeaders = ['Part', 'Element', 'Token', 'Notes'];
  const partsWidths = [60, 140, 240, 300];
  const partsRows = card3_anatomy.partsTable.map(row => {
    // Token column uses monospace
    const tokenCell = textNode(row.token, 'Fira Code:Regular', 12, PALETTE.textPrimary, { width: 240 });
    return [
      textNode(row.part, 'Inter:Regular', 14, PALETTE.textPrimary, { width: 60 }),
      textNode(row.element, 'Inter:Regular', 14, PALETTE.textPrimary, { width: 140 }),
      tokenCell,
      textNode(row.notes, 'Inter:Regular', 14, PALETTE.textSecondary, { width: 300 })
    ];
  });

  children.push(tableFrame('Parts reference table', partsHeaders, partsRows, partsWidths));

  return cardShell('Anatomy', 'Anatomy', 'Component structure, dimensions, interactive states, and part-level token mapping', children);
}

/** Card 4 — Design Tokens. Data source: card4_tokens */
function buildCard4(card4_tokens) {
  const children = [];

  // Sub-section 1: Color tokens table
  children.push(sectionTitle('Color tokens'));

  // Headers from first row's columns
  const colorHeaders = ['Variant / State'];
  if (card4_tokens.colorTokens.length > 0) {
    for (const col of card4_tokens.colorTokens[0].columns) {
      colorHeaders.push(col.header);
    }
  }

  // Column widths: first col wider for state name, rest equal
  const colCount = colorHeaders.length;
  const colorWidths = [140];
  for (let i = 1; i < colCount; i++) colorWidths.push(160);

  const colorRows = card4_tokens.colorTokens.map(row => {
    const cells = [textNode(row.state, 'Inter:Medium', 14, PALETTE.textPrimary, { width: 140 })];
    for (const col of row.columns) {
      cells.push(swatchCell(col.hex, col.token));
    }
    return cells;
  });

  children.push(tableFrame('Color tokens table', colorHeaders, colorRows, colorWidths));

  // Sub-section 2: Sizing & spacing
  children.push(dividerNode());
  children.push(sectionTitle('Sizing & spacing'));

  const sizingHeaders = ['Property', 'Token', 'Value'];
  const sizingWidths = [200, 240, 120];
  const sizingRows = (card4_tokens.sizingTokens || []).map(row => [
    textNode(row.property, 'Inter:Regular', 14, PALETTE.textPrimary, { width: 200 }),
    textNode(row.token, 'Fira Code:Regular', 12, PALETTE.textPrimary, { width: 240 }),
    textNode(row.value, 'Inter:Regular', 14, PALETTE.textPrimary, { width: 120 })
  ]);

  children.push(tableFrame('Sizing table', sizingHeaders, sizingRows, sizingWidths));

  // Sub-section 3: Typography
  children.push(dividerNode());
  children.push(sectionTitle('Typography'));

  for (const typo of (card4_tokens.typography || [])) {
    children.push({
      type: 'FRAME',
      name: `Typography: ${typo.element}`,
      layout: { mode: 'VERTICAL', spacing: 4, padding: [8, 0, 8, 0] },
      fills: [],
      children: [
        textNode(typo.element, 'Inter:Semi Bold', 14, PALETTE.textPrimary),
        textNode(`${typo.token} \u2014 ${typo.font}, tracking ${typo.tracking}`, 'Inter:Regular', 12, PALETTE.textSecondary)
      ],
      sizing: { horizontal: 'FILL', vertical: 'HUG' }
    });
  }

  return cardShell('Design tokens', 'Design tokens', 'Color, sizing, spacing, and typography tokens', children);
}

/** Card 5 — Component API. Data source: card5_api */
function buildCard5(card5_api) {
  const headers = ['', 'Property', 'Type', 'Default', 'Values', 'Notes'];
  const colWidths = [50, 140, 100, 120, 200, 350];

  const rows = card5_api.props.map(prop => [
    reqOptBadge(prop.required),
    textNode(prop.name, 'Fira Code:Regular', 12, PALETTE.textPrimary, { width: 140 }),
    textNode(prop.type, 'Inter:Regular', 14, '#C792EA', { width: 100 }),
    textNode(prop.default, 'Inter:Regular', 14, '#C3E88D', { width: 120 }),
    textNode(prop.values, 'Inter:Regular', 14, PALETTE.textPrimary, { width: 200 }),
    textNode(prop.notes, 'Inter:Regular', 14, PALETTE.textSecondary, { width: 350 })
  ]);

  const table = tableFrame('API table', headers, rows, colWidths);

  return cardShell('Component API', 'Component API', 'Properties, types, defaults, and allowed values', [table]);
}

/** Card 6 — Usage Guidelines. Data source: card6_usage, card1_header */
function buildCard6(card6_usage, card1_header) {
  const children = [];

  // When to use
  children.push(sectionTitle('When to use'));
  for (const item of (card6_usage.whenToUse || [])) {
    children.push(bulletRow(item, '+', PALETTE.successGreen));
  }

  // Divider
  children.push(dividerNode());

  // When NOT to use
  children.push(sectionTitle('When NOT to use'));
  for (const item of (card6_usage.whenNotToUse || [])) {
    children.push(bulletRow(item, '\u2212', PALETTE.errorRed));
  }

  // Divider
  children.push(dividerNode());

  // Do-Don't pairs
  for (const pair of (card6_usage.doDont || [])) {
    children.push({
      type: 'INSTANCE',
      ref: 'doDontPair',
      name: `Do-Dont: ${pair.doLabel}`,
      variant: 'Mode=DS',
      props: {
        'Do Label': pair.doLabel,
        'Do Example': pair.doDetail,
        "Don't Label": pair.dontLabel,
        "Don't Example": pair.dontDetail
      },
      sizing: { horizontal: 'FILL', vertical: 'HUG' }
    });
  }

  const componentName = card1_header ? card1_header.name : '';
  return cardShell('Usage guidelines', 'Usage guidelines', `When and how to use ${componentName}`, children);
}

/** Card 7 — Content Guidelines. Data source: card7_content, card1_header */
function buildCard7(card7_content, card1_header) {
  const children = [];

  // Rules
  const rules = card7_content.rules || [];
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    children.push(sectionTitle(rule.title));
    children.push(textNode(rule.description, 'Inter:Regular', 14, PALETTE.textSecondary));

    children.push({
      type: 'INSTANCE',
      ref: 'doDontPair',
      name: `Do-Dont: ${rule.title}`,
      variant: 'Mode=DS',
      props: {
        'Do Label': rule.do,
        'Do Example': '',
        "Don't Label": rule.dont,
        "Don't Example": ''
      },
      sizing: { horizontal: 'FILL', vertical: 'HUG' }
    });

    // Divider between rules (not after the last)
    if (i < rules.length - 1) {
      children.push(dividerNode());
    }
  }

  // Terminology table
  const terminology = card7_content.terminology || [];
  if (terminology.length > 0) {
    children.push(dividerNode());
    children.push(sectionTitle('Terminology'));

    const termHeaders = ['Term', 'When to use'];
    const termWidths = [160, 500];
    const termRows = terminology.map(t => [
      textNode(t.term, 'Inter:Semi Bold', 14, PALETTE.textPrimary, { width: 160 }),
      textNode(t.use, 'Inter:Regular', 14, PALETTE.textSecondary, { width: 500 })
    ]);

    children.push(tableFrame('Terminology table', termHeaders, termRows, termWidths));
  }

  const componentName = card1_header ? card1_header.name : '';
  return cardShell('Content guidelines', 'Content guidelines', `Label copy rules for ${componentName}`, children);
}

/** Card 8 — Accessibility. Data source: card8_accessibility */
function buildCard8(card8_accessibility) {
  const children = [];

  // Sub-section 1: Requirements (2x3 grid)
  children.push(sectionTitle('Requirements'));

  const reqCards = (card8_accessibility.requirements || []).map(req => {
    // Build code block child if code tokens exist
    const codeChildren = [];
    if (req.code && req.code.tokens && req.code.tokens.length > 0) {
      const { content, textRanges } = computeTextRanges(req.code.tokens);
      codeChildren.push({
        type: 'INSTANCE',
        ref: 'codeBlock',
        name: `Code: ${req.title.toLowerCase().replace(/\s+/g, '-')}`,
        detach: true,
        children: [
          textNode(content, 'Fira Code:Regular', 12, '#BABED8', {
            name: 'Code',
            textRanges: textRanges
          })
        ]
      });
    }

    return {
      type: 'INSTANCE',
      ref: 'a11yCard',
      name: req.title,
      variant: 'Mode=DS',
      props: {
        Title: req.title,
        Body: req.body,
        'Icon Color': req.icon
      },
      detach: true,
      children: codeChildren,
      sizing: { horizontal: 'FILL', vertical: 'HUG' }
    };
  });

  children.push({
    type: 'FRAME',
    name: 'Requirements grid',
    layout: { mode: 'HORIZONTAL', spacing: 16, counterAxisSpacing: 16, wrap: true, padding: [0, 0, 0, 0] },
    fills: [],
    children: reqCards,
    sizing: { horizontal: 'FILL', vertical: 'HUG' }
  });

  // Sub-section 2: ARIA specification table
  const ariaTable = card8_accessibility.ariaTable || [];
  if (ariaTable.length > 0) {
    children.push(dividerNode());
    children.push(sectionTitle('ARIA specification'));

    const ariaHeaders = ['Element', 'Role', 'Label', 'Focus Order', 'Keyboard', 'Announcement'];
    const ariaWidths = [120, 100, 120, 80, 200, 200];
    const ariaRows = ariaTable.map(row => [
      textNode(row.element, 'Inter:Regular', 14, PALETTE.textPrimary, { width: 120 }),
      textNode(row.role, 'Fira Code:Regular', 12, PALETTE.textPrimary, { width: 100 }),
      textNode(row.label, 'Fira Code:Regular', 12, PALETTE.textPrimary, { width: 120 }),
      textNode(row.focusOrder, 'Inter:Regular', 14, PALETTE.textPrimary, { width: 80 }),
      textNode(row.keyboard, 'Inter:Regular', 14, PALETTE.textSecondary, { width: 200 }),
      textNode(row.announcement, 'Inter:Regular', 14, PALETTE.textSecondary, { width: 200 })
    ]);

    children.push(tableFrame('ARIA table', ariaHeaders, ariaRows, ariaWidths));
  }

  // Sub-section 3: Contrast ratios table
  const contrastTable = card8_accessibility.contrastTable || [];
  if (contrastTable.length > 0) {
    children.push(dividerNode());
    children.push(sectionTitle('Contrast ratios'));

    const contrastHeaders = ['Element', 'Foreground', 'Background', 'Ratio', 'WCAG AA'];
    const contrastWidths = [160, 160, 160, 80, 80];
    const contrastRows = contrastTable.map(row => [
      textNode(row.element, 'Inter:Regular', 14, PALETTE.textPrimary, { width: 160 }),
      swatchCell(row.foreground, row.foreground),
      swatchCell(row.background, row.background),
      textNode(row.ratio, 'Inter:Regular', 14, PALETTE.textPrimary, { width: 80 }),
      {
        type: 'INSTANCE',
        ref: 'contrastBadge',
        variant: `Status=${row.wcag}`,
        sizing: { horizontal: 'HUG', vertical: 'HUG' }
      }
    ]);

    children.push(tableFrame('Contrast table', contrastHeaders, contrastRows, contrastWidths));
  }

  return cardShell('Accessibility', 'Accessibility', 'WCAG 2.1 AA requirements, keyboard navigation, ARIA patterns, and contrast ratios', children);
}

/** Card 9 — Code Specification. Data source: card9_code, card1_header */
function buildCard9(card9_code, card1_header) {
  const { content, textRanges } = computeTextRanges(card9_code.tokens);
  const language = (card9_code.language || 'css').toUpperCase();

  const codeBlock = {
    type: 'INSTANCE',
    ref: 'codeBlock',
    name: `${language} Code Block`,
    props: {
      'Show Header': true,
      'Header Text': language
    },
    detach: true,
    children: [
      textNode(content, 'Fira Code:Regular', 12, '#BABED8', {
        name: 'Code',
        textRanges: textRanges
      })
    ],
    sizing: { horizontal: 'FILL', vertical: 'HUG' }
  };

  const componentName = card1_header ? card1_header.name : '';
  return cardShell('Code specification', 'Code specification', `CSS custom properties for ${componentName}`, [codeBlock]);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(data) {
  const errors = [];

  if (!data.meta || !data.meta.component) {
    errors.push('meta.component is required');
  }
  if (!data.meta || !data.meta.componentKey) {
    errors.push('meta.componentKey is required (needed for localComponents)');
  }
  // Card 1 (header) is optional for partial briefs — validate only if present
  if (data.card1_header && !data.card1_header.name) {
    errors.push('card1_header.name is required when card1_header is present');
  }
  if (data.card1_header && !data.card1_header.description) {
    errors.push('card1_header.description is required when card1_header is present');
  }
  // Warn about missing cards but don't block — partial briefs are valid
  if (data.card2_component && (!Array.isArray(data.card2_component.variantMatrix) || data.card2_component.variantMatrix.length === 0)) {
    errors.push('card2_component.variantMatrix must be a non-empty array');
  }
  if (data.card4_tokens && (!Array.isArray(data.card4_tokens.colorTokens) || data.card4_tokens.colorTokens.length === 0)) {
    errors.push('card4_tokens.colorTokens must be a non-empty array');
  }
  if (data.card8_accessibility && (!Array.isArray(data.card8_accessibility.requirements) || data.card8_accessibility.requirements.length !== 6)) {
    errors.push('card8_accessibility.requirements must have exactly 6 items');
  }
  if (data.card9_code && (!Array.isArray(data.card9_code.tokens) || data.card9_code.tokens.length === 0)) {
    errors.push('card9_code.tokens must be a non-empty array');
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Bin-packing + code generation
// ---------------------------------------------------------------------------

/**
 * Build all cards and bin-pack them into code generation calls.
 * Returns array of { callIndex, code, description }.
 */
function autoSplitCalls(data, targetNodeId) {
  // Build only cards that have data — supports partial briefs
  const allCards = [
    { name: 'GenLog', node: buildGenLog(data.meta) }
  ];
  if (data.card1_header)      allCards.push({ name: 'Card 1', node: buildCard1(data.card1_header) });
  if (data.card2_component)   allCards.push({ name: 'Card 2', node: buildCard2(data.card2_component, data.meta) });
  if (data.card3_anatomy)     allCards.push({ name: 'Card 3', node: buildCard3(data.card3_anatomy) });
  if (data.card4_tokens)      allCards.push({ name: 'Card 4', node: buildCard4(data.card4_tokens) });
  if (data.card5_api)         allCards.push({ name: 'Card 5', node: buildCard5(data.card5_api) });
  if (data.card6_usage)       allCards.push({ name: 'Card 6', node: buildCard6(data.card6_usage, data.card1_header || { name: data.meta.componentName || 'Component' }) });
  if (data.card7_content)     allCards.push({ name: 'Card 7', node: buildCard7(data.card7_content, data.card1_header || { name: data.meta.componentName || 'Component' }) });
  if (data.card8_accessibility) allCards.push({ name: 'Card 8', node: buildCard8(data.card8_accessibility) });
  if (data.card9_code)        allCards.push({ name: 'Card 9', node: buildCard9(data.card9_code, data.card1_header || { name: data.meta.componentName || 'Component' }) });

  // Bin-pack card nodes into groups under MAX_BIN_SIZE raw JSON bytes
  const treeNodes = allCards.map(c => c.node);
  const nodeBins = codegen.binPack(treeNodes, MAX_BIN_SIZE, OVERHEAD);

  // Map node bins back to card wrappers (preserving name for descriptions)
  const bins = [];
  let cardIdx = 0;
  for (const nodeBin of nodeBins) {
    const cardBin = [];
    for (let i = 0; i < nodeBin.length; i++) {
      cardBin.push(allCards[cardIdx++]);
    }
    bins.push(cardBin);
  }

  const totalCalls = bins.length;
  const results = [];

  for (let b = 0; b < bins.length; b++) {
    const bin = bins[b];
    const callIdx = b + 1;
    const treeNodes = bin.map(c => c.node);
    const names = bin.map(c => c.name).join(', ');

    // Build spec for this bin
    const spec = {
      meta: {
        skill: 'component-brief',
        component: data.meta.component
      },
      fonts: FONTS.slice(),
      imports: { ...IMPORTS },
      localComponents: {
        targetComponent: { nodeId: data.meta.componentKey }
      },
      tree: treeNodes
    };

    if (callIdx === 1) {
      spec.meta.targetNodeId = targetNodeId;
      spec.meta.wrapperName = `Component Spec: ${data.meta.component}`;
      spec.meta.sectionName = `Component Spec: ${data.meta.component}`;
    } else {
      spec.meta.appendToId = '__WRAPPER_ID__';
    }

    // Generate code
    const code = codegen.generateCallCode(spec);
    const codeSize = Buffer.byteLength(code, 'utf8');

    process.stderr.write(`Call ${callIdx}: ${names} (code=${codeSize} bytes)\n`);

    if (codeSize > 45000) {
      process.stderr.write(`WARNING: Call ${callIdx} code exceeds 45KB (${codeSize} bytes)\n`);
    }

    results.push({
      callIndex: callIdx,
      code: code,
      description: `Call ${callIdx}/${totalCalls}: ${names}`
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { inputPath: null, targetNodeId: null, call: null, output: null, outputDir: null };

  if (args.indexOf('--help') !== -1) {
    process.stdout.write(JSON.stringify({
      name: 'brief-to-figma',
      description: 'Reads brief-data.json, generates Figma Plugin API JavaScript for component briefs.',
      flags: [
        { name: '--target-node-id', required: true, description: 'Figma node ID for the target page' },
        { name: '--call', required: false, description: 'Output only call N (1-based)' },
        { name: '--output', required: false, description: 'Write JSON output to file instead of stdout' },
        { name: '--output-dir', required: false, description: 'Directory to write call-N.js + manifest.json' }
      ]
    }, null, 2) + '\n');
    process.exit(0);
  }

  let i = 0;
  while (i < args.length) {
    if (args[i] === '--target-node-id' && i + 1 < args.length) {
      result.targetNodeId = args[i + 1];
      i += 2;
    } else if (args[i] === '--call' && i + 1 < args.length) {
      result.call = parseInt(args[i + 1], 10);
      i += 2;
    } else if (args[i] === '--output-dir' && i + 1 < args.length) {
      result.outputDir = args[i + 1];
      i += 2;
    } else if (args[i] === '--output' && i + 1 < args.length) {
      result.output = args[i + 1];
      i += 2;
    } else if (!args[i].startsWith('--')) {
      result.inputPath = args[i];
      i += 1;
    } else {
      process.stderr.write(`Unknown argument: ${args[i]}\n`);
      process.exit(1);
    }
  }

  return result;
}

function main() {
  const opts = parseArgs(process.argv);

  if (!opts.inputPath) {
    process.stderr.write('Usage: node brief-to-figma.js <brief-data.json> --target-node-id <id> [--call N] [--output <path>] [--output-dir <dir>]\n');
    process.exit(1);
  }

  if (!opts.targetNodeId) {
    process.stderr.write('Error: --target-node-id is required\n');
    process.exit(1);
  }

  if (opts.call != null && opts.call < 1) {
    process.stderr.write('Error: --call must be >= 1\n');
    process.exit(1);
  }

  // Read input
  let rawData;
  try {
    rawData = fs.readFileSync(path.resolve(opts.inputPath), 'utf8');
  } catch (err) {
    process.stderr.write(`Error reading input file: ${err.message}\n`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(rawData);
  } catch (err) {
    process.stderr.write(`Error parsing JSON: ${err.message}\n`);
    process.exit(1);
  }

  // Schema validation (warn only — backwards compatible)
  try {
    var schemaValidator = require('./validate-schema');
    var briefSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schemas', 'brief-data.schema.json'), 'utf8'));
    var schemaErrors = schemaValidator(data, briefSchema);
    for (var i = 0; i < schemaErrors.length; i++) {
      process.stderr.write('SCHEMA: ' + schemaErrors[i] + '\n');
    }
  } catch (e) { /* schema files not available — skip */ }

  // Validate
  const errors = validate(data);
  if (errors.length > 0) {
    process.stderr.write('Validation errors:\n');
    for (const e of errors) {
      process.stderr.write(`  - ${e}\n`);
    }
    process.exit(1);
  }

  // Build code calls with auto-splitting
  const allCalls = autoSplitCalls(data, opts.targetNodeId);

  let output;
  if (opts.call != null) {
    if (opts.call > allCalls.length) {
      process.stderr.write(`Error: --call ${opts.call} but only ${allCalls.length} calls generated\n`);
      process.exit(1);
    }
    output = allCalls[opts.call - 1];
  } else {
    output = allCalls;
  }

  if (opts.outputDir) {
    // Write each call as a separate file + manifest
    fs.mkdirSync(opts.outputDir, { recursive: true });
    const manifest = { totalCalls: allCalls.length, calls: [] };
    for (const r of allCalls) {
      const fileName = 'call-' + r.callIndex + '.js';
      const filePath = path.join(opts.outputDir, fileName);
      fs.writeFileSync(filePath, r.code, 'utf8');
      manifest.calls.push({
        callIndex: r.callIndex,
        file: fileName,
        sizeBytes: Buffer.byteLength(r.code, 'utf8'),
        description: r.description
      });
    }
    fs.writeFileSync(path.join(opts.outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    process.stderr.write(`Wrote ${allCalls.length} call file(s) to ${opts.outputDir}\n`);
  } else {
    const json = JSON.stringify(output, null, 2);

    if (opts.output) {
      try {
        fs.mkdirSync(path.dirname(path.resolve(opts.output)), { recursive: true });
        fs.writeFileSync(path.resolve(opts.output), json, 'utf8');
      } catch (err) {
        process.stderr.write(`Error writing output file: ${err.message}\n`);
        process.exit(1);
      }
    } else {
      process.stdout.write(json + '\n');
    }
  }

  process.stderr.write(`Done: ${allCalls.length} call(s)\n`);
}

main();
