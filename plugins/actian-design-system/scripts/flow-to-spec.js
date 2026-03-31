#!/usr/bin/env node
'use strict';

/**
 * flow-to-spec.js — Hybrid transformer: flow-data.json -> figma-spec.json
 *
 * The AI provides creative content per screen. This script handles all
 * structural chrome (App Header, Sidebar, Content Area) deterministically.
 *
 * Usage:
 *   node scripts/flow-to-spec.js <flow-data.json> --target-node-id <id> [--call N] [--output <path>]
 *
 * Input: flow-data.json with meta + screens (content only)
 * Output: array of figma-spec.json objects (one per use_figma call)
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_SPEC_BYTES = 33000;
const OVERHEAD = 500;

const FONTS = [
  'Inter:Regular',
  'Inter:Medium',
  'Inter:Semi Bold',
  'Inter:Bold'
];

// Chrome dimensions: [screenW, screenH, headerH, sidebarW, contentW, bodyH]
const DIMS = {
  'standard:standard':   [1440, 960, 70, 260, 1180, 890],
  'standard:compact':    [1440, 700, 70, 260, 1180, 630],
  'no-sidebar:standard': [1440, 960, 70,   0, 1440, 890],
  'no-sidebar:compact':  [1440, 700, 70,   0, 1440, 630],
  'none:standard':       [1440, 960,  0,   0, 1440, 960],
  'none:compact':        [1440, 700,  0,   0, 1440, 700]
};

// App context → App Header variant
const APP_HEADER_VARIANT = {
  'Studio': 'Type=Studio',
  'Explorer': 'Type=Explorer',
  'Administration': 'Type=Admin',
  'Actian': 'Type=Actian'
};

// Ref name → registry key mapping (camelCase ref → kebab-case registry key)
const REF_ALIASES = {
  // Meta Kit
  genLog:          { registryKey: 'generation-log',           library: 'meta' },
  divider:         { registryKey: 'card-divider',             library: 'meta' },
  flowCoverCard:   { registryKey: 'flow-cover-card',          library: 'meta' },
  // FM Kit
  fmAppHeader:     { registryKey: 'fm-app_header',            library: 'fm' },
  fmButton:        { registryKey: 'fm-button',                library: 'fm' },
  fmTextInput:     { registryKey: 'fm-text-input-field',      library: 'fm' },
  fmDropdown:      { registryKey: 'fm-dropdown',              library: 'fm' },
  fmInputLabel:    { registryKey: 'fm-input-label',           library: 'fm' },
  fmSideNavBar:    { registryKey: 'fm-side-navigation-bar',   library: 'fm' },
  fmSideNavItem:   { registryKey: 'fm-side-navigation-item',  library: 'fm' },
  fmPageHeader:    { registryKey: 'fm-page-header',           library: 'fm' },
  fmTableCell:     { registryKey: 'fm-table-cell',            library: 'fm' },
  fmCheckbox:      { registryKey: 'fm-checkbox',              library: 'fm' },
  fmRadioButton:   { registryKey: 'fm-radio-button',          library: 'fm' },
  fmToggle:        { registryKey: 'fm-toggle',                library: 'fm' },
  fmSearchInput:   { registryKey: 'fm-search-input-field',    library: 'fm' },
  fmDateInput:     { registryKey: 'fm-date-input',            library: 'fm' },
  fmTextArea:      { registryKey: 'fm-text-area',             library: 'fm' },
  fmAlert:         { registryKey: 'fm-alert',                 library: 'fm' },
  fmDialog:        { registryKey: 'fm-dialog',                library: 'fm' },
  fmBanner:        { registryKey: 'fm-banner',                library: 'fm' },
  fmStepper:       { registryKey: 'fm-stepper',               library: 'fm' },
  fmBadge:         { registryKey: 'fm-badge',                 library: 'fm' },
  fmTag:           { registryKey: 'fm-tag',                   library: 'fm' },
  fmChip:          { registryKey: 'fm-chip',                  library: 'fm' },
  fmTab:           { registryKey: 'fm-tab',                   library: 'fm' },
  fmTabs:          { registryKey: 'fm-tabs',                  library: 'fm' },
  fmToast:         { registryKey: 'fm-toast',                 library: 'fm' },
  fmEmptyState:    { registryKey: 'fm-empty-state',           library: 'fm' },
  fmPlaceholder:   { registryKey: 'fm-placeholder',           library: 'fm' },
  fmIconButtons:   { registryKey: 'fm-icon-buttons',          library: 'fm' },
  fmSpinner:       { registryKey: 'fm-spinner',               library: 'fm' },
  fmMultiSelectDropdown: { registryKey: 'fm-multi-select-dropdown', library: 'fm' },
  fmProgressBar:   { registryKey: 'fm-progress-bar',          library: 'fm' },
  fmMenuItem:      { registryKey: 'fm-menu-item',             library: 'fm' },
  fmTooltip:       { registryKey: 'fm-tooltip',               library: 'fm' },
  fmRichTextField: { registryKey: 'fm-rich-text-field',       library: 'fm' },
  fmSlider:        { registryKey: 'fm-slider',                library: 'fm' }
};

// Hardcoded fallback keys (used when registry files not found)
const FALLBACK_KEYS = {
  genLog:        { key: 'a9653f30925367e96dea90093d750bfe70849571', method: 'single' },
  divider:       { key: 'f4d778e1cf9bb61a33712c791486f54bb1c095b7', method: 'single' },
  flowCoverCard: { key: 'eaebde6bd07d2f19f3f9c00a9587240cb085a90d', method: 'single' },
  fmAppHeader:   { key: '8fc9bcee610c7f8d22ebcc268467993f6dc99c87', method: 'set' },
  fmSideNavItem: { key: 'd18a0a772ed4acd760c497cb93de796ff052a7b4', method: 'set' },
  fmPageHeader:  { key: 'ae1f8684a4a89aa74463d439e4e8c1e7a48137fe', method: 'set' },
  fmButton:      { key: '368b62312ca941c80ea8eeed84a57d33bb470b09', method: 'set' },
  fmTableCell:   { key: '9267fecfadc4577563deb1425fa598d1f5af9144', method: 'set' },
  fmTextInput:   { key: '355855c7b2e05b5b336167883b3c9ebbfbd881ad', method: 'set' },
  fmDropdown:    { key: '781f86dca2a37706771f3e2e580242d2693a722f', method: 'set' },
  fmInputLabel:  { key: 'a39aa1c7cb593f7d26b7659e4cbe4e419e00c766', method: 'set' },
  fmSearchInput: { key: '443e232d5454f06dbd5bc06c2cacf21e80a20e4a', method: 'set' },
  fmTag:         { key: 'c7239d9355ddf557f36f4d159153619672ab81ef', method: 'set' },
  fmChip:        { key: '0861d937682e66d39f57fe52ca83d526e634ff66', method: 'set' },
  fmTab:         { key: 'cfbd732ff4f4e6620b333c60f1ac7fe5116a93aa', method: 'set' },
  fmPlaceholder: { key: 'e49a9de0573cf527736e8173f722f230fa957fb8', method: 'set' },
  fmEmptyState:  { key: 'cf44b9c0b5623a394d90f320f98250dc77378268', method: 'set' },
  fmAlert:       { key: 'fe30f37740688350762bd2b1be426d9d1588b7d9', method: 'set' },
  fmBanner:      { key: 'd7f323e492b456a2c56f81f3dc892eb24de11a6e', method: 'single' },
  fmToggle:      { key: 'fe9e82118d1df75a8aea732eb7f9169ccaa21878', method: 'set' },
  fmCheckbox:    { key: '965cf2c85659bbde891f6f086bbd02d50d445d58', method: 'set' },
  fmDialog:      { key: '0cc53eca9c90cccb8cbc57864ea110378414fd2b', method: 'single' },
  fmTextArea:    { key: 'bba14eea66edb3871ea389afeb4e1a07585e5733', method: 'set' },
  fmBadge:       { key: '2410b87c83d33d3bcb2a6ac7aa2168a53a4eb3d8', method: 'set' },
  fmStepper:     { key: 'd0a21b5288571cc7690c6c9289d18cd298035c53', method: 'set' },
  fmToast:       { key: '6140b137ce98ebfeeb7fc7e426f6d09de1cc18d0', method: 'set' },
  fmIconButtons: { key: 'f868aabb0aa2c52f00610c09da8dce3bccc79dc4', method: 'set' },
  fmSpinner:     { key: '52927648847b15a51d314cf06ca1c0f19f398b4d', method: 'single' },
  fmRadioButton: { key: '1569353eb82fd5f6cb8da979f1048cd1b323e8c4', method: 'set' },
  fmDateInput:   { key: '69d6329ea2d5ac3515b6ebb04ad6c1bd72e4890e', method: 'set' },
  fmProgressBar: { key: '12abe66d36a63ef385a17e2553a1312560a0f106', method: 'set' },
  fmMultiSelectDropdown: { key: '876bfa32334594915085ebea82f1f887b3fecb09', method: 'set' },
  fmTabs:        { key: '860eadef9ba29cf20a3da3ca9d014718e3f6cabb', method: 'single' }
};

// ---------------------------------------------------------------------------
// Registry loader
// ---------------------------------------------------------------------------

function loadRegistry(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return null;
  }
}

function buildRefMap(pluginRoot) {
  const fmReg = loadRegistry(path.join(pluginRoot, 'docs', 'fm-components-registry.json'));
  const metaReg = loadRegistry(path.join(pluginRoot, 'docs', 'meta-kit', 'meta-kit-registry.json'));

  const refMap = {};

  for (const [refName, alias] of Object.entries(REF_ALIASES)) {
    // Try registry first
    let comp = null;
    if (alias.library === 'fm' && fmReg) {
      comp = (fmReg.components || {})[alias.registryKey];
    } else if (alias.library === 'meta' && metaReg) {
      comp = (metaReg.components || {})[alias.registryKey];
    }

    if (comp && comp.key) {
      const method = comp.type === 'component_set' ? 'set' : 'single';
      refMap[refName] = { key: comp.key, method };
    } else if (FALLBACK_KEYS[refName]) {
      refMap[refName] = FALLBACK_KEYS[refName];
    }
  }

  return refMap;
}

// ---------------------------------------------------------------------------
// Chrome builders
// ---------------------------------------------------------------------------

function buildAppHeader(app) {
  const variant = APP_HEADER_VARIANT[app] || 'Type=Admin';
  return {
    type: 'INSTANCE',
    ref: 'fmAppHeader',
    variant: variant,
    name: 'App Header'
  };
}

function buildSidebar(activeNavItem, navItems, height) {
  const count = navItems || 4;
  const children = [];

  // Active item
  children.push({
    type: 'INSTANCE',
    ref: 'fmSideNavItem',
    variant: 'State=On',
    name: 'Nav: ' + (activeNavItem || 'Home'),
    props: { Label: activeNavItem || 'Home' }
  });

  // Placeholder items
  for (let i = 1; i < count; i++) {
    children.push({
      type: 'INSTANCE',
      ref: 'fmSideNavItem',
      variant: 'State=Placeholder',
      name: 'Nav: Placeholder ' + i
    });
  }

  return {
    type: 'FRAME',
    name: 'Sidebar',
    width: 260,
    height: height,
    layout: { mode: 'VERTICAL', spacing: 0, padding: [28, 16, 8, 16] },
    fills: ['#FFFFFF'],
    children: children
  };
}

function buildPageHeader(config) {
  if (!config || !config.title) return null;

  let variant;
  if (config.variant) {
    variant = 'Type=' + config.variant;
  } else if (config.actions && config.actions.length > 0) {
    variant = 'Type=Title + Actions';
  } else if (config.subtitle) {
    variant = 'Type=Title + Subtitle';
  } else {
    variant = 'Type=Title only';
  }

  const props = { Title: config.title };
  if (config.subtitle) props.Subtitle = config.subtitle;

  return {
    type: 'INSTANCE',
    ref: 'fmPageHeader',
    variant: variant,
    name: 'Page Header',
    props: props
  };
}

function buildScreen(screenDef, app) {
  const chrome = screenDef.chrome || 'standard';
  const size = screenDef.size || 'standard';
  const dimKey = chrome + ':' + size;
  const dims = DIMS[dimKey] || DIMS['standard:standard'];
  const [screenW, screenH, headerH, sidebarW, contentW, bodyH] = dims;

  // Chrome "none" — full screen, content is direct children
  if (chrome === 'none') {
    return {
      type: 'FRAME',
      name: screenDef.name,
      width: screenW,
      height: screenH,
      fills: ['#FFFFFF'],
      clipsContent: true,
      layout: { mode: 'VERTICAL', spacing: 0 },
      children: screenDef.content || []
    };
  }

  // Build Content Area
  const contentChildren = [];
  const ph = buildPageHeader(screenDef.pageHeader);
  if (ph) contentChildren.push(ph);
  if (screenDef.content) contentChildren.push.apply(contentChildren, screenDef.content);

  const contentArea = {
    type: 'FRAME',
    name: 'Content Area',
    width: contentW,
    height: bodyH,
    layout: { mode: 'VERTICAL', spacing: 0 },
    fills: ['#F5F5FA'],
    children: contentChildren
  };

  // Build Body children
  const bodyChildren = [];
  if (chrome === 'standard') {
    bodyChildren.push(buildSidebar(screenDef.activeNavItem, screenDef.navItems, bodyH));
  }
  bodyChildren.push(contentArea);

  const body = {
    type: 'FRAME',
    name: 'Body',
    width: screenW,
    height: bodyH,
    layout: { mode: 'HORIZONTAL', spacing: 0 },
    fills: [],
    children: bodyChildren
  };

  // Screen frame
  return {
    type: 'FRAME',
    name: screenDef.name,
    width: screenW,
    height: screenH,
    fills: ['#FFFFFF'],
    clipsContent: true,
    children: [
      buildAppHeader(app),
      body
    ]
  };
}

// ---------------------------------------------------------------------------
// Meta builders
// ---------------------------------------------------------------------------

function buildGenLog(meta) {
  return {
    type: 'INSTANCE',
    ref: 'genLog',
    name: 'Generation Log',
    props: {
      Skill: 'generate-flow',
      Prompt: (meta.prompt || '').substring(0, 200),
      Date: meta.generatedAt || new Date().toISOString(),
      Duration: meta.duration || '',
      Model: meta.model || 'unknown',
      Plugin: meta.pluginVersion || 'unknown'
    }
  };
}

function buildCoverCard(meta) {
  return {
    type: 'INSTANCE',
    ref: 'flowCoverCard',
    name: 'Cover: ' + (meta.feature || 'Flow'),
    props: {
      Feature: meta.feature || '',
      Flow: meta.flow || '',
      User: meta.user || ''
    }
  };
}

// ---------------------------------------------------------------------------
// Import scanner — walks content tree, collects all ref values
// ---------------------------------------------------------------------------

function scanRefs(nodes, refs) {
  if (!refs) refs = new Set();
  if (!Array.isArray(nodes)) return refs;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node) continue;
    if (node.ref) refs.add(node.ref);
    if (node.type === 'DIVIDER') refs.add('divider');
    if (node.children) scanRefs(node.children, refs);
  }

  return refs;
}

// ---------------------------------------------------------------------------
// Import resolver
// ---------------------------------------------------------------------------

function resolveImports(refs, refMap) {
  const imports = {};

  for (const ref of refs) {
    if (refMap[ref]) {
      imports[ref] = refMap[ref];
    } else if (FALLBACK_KEYS[ref]) {
      imports[ref] = FALLBACK_KEYS[ref];
      process.stderr.write('Warning: ref "' + ref + '" not in registry, using fallback key\n');
    } else {
      process.stderr.write('Warning: unknown ref "' + ref + '" — no import key found\n');
    }
  }

  return imports;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(input) {
  const errors = [];

  if (!input.meta) errors.push('Missing "meta" object');
  else {
    if (!input.meta.feature) errors.push('Missing meta.feature');
    if (!input.meta.app) errors.push('Missing meta.app');
    if (!input.meta.targetNodeId) errors.push('Missing meta.targetNodeId');
    const validApps = ['Studio', 'Explorer', 'Administration', 'Actian'];
    if (input.meta.app && !validApps.includes(input.meta.app)) {
      errors.push('meta.app must be one of: ' + validApps.join(', '));
    }
  }

  if (!input.screens || !Array.isArray(input.screens) || input.screens.length === 0) {
    errors.push('Missing or empty "screens" array');
  } else {
    const validChrome = ['standard', 'no-sidebar', 'none'];
    const validSize = ['standard', 'compact'];
    for (let i = 0; i < input.screens.length; i++) {
      const s = input.screens[i];
      const prefix = 'screens[' + i + ']';
      if (!s.name) errors.push(prefix + ': missing "name"');
      if (s.chrome && !validChrome.includes(s.chrome)) {
        errors.push(prefix + ': chrome must be one of: ' + validChrome.join(', '));
      }
      if (s.size && !validSize.includes(s.size)) {
        errors.push(prefix + ': size must be one of: ' + validSize.join(', '));
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Auto-splitter
// ---------------------------------------------------------------------------

function compactSize(obj) {
  return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}

function autoSplit(meta, allItems, refMap) {
  // allItems = [genLog, coverCard, screen1, screen2, ...]
  const bins = [];
  let currentBin = [];
  let currentSize = 0;

  for (let i = 0; i < allItems.length; i++) {
    const itemSize = compactSize(allItems[i]);

    if (currentBin.length > 0 && currentSize + itemSize + OVERHEAD > MAX_SPEC_BYTES) {
      bins.push(currentBin);
      currentBin = [];
      currentSize = 0;
    }

    currentBin.push(allItems[i]);
    currentSize += itemSize;
  }
  if (currentBin.length > 0) bins.push(currentBin);

  // Build spec objects
  const specs = [];
  for (let b = 0; b < bins.length; b++) {
    const bin = bins[b];
    const refs = scanRefs(bin);
    const imports = resolveImports(refs, refMap);

    const spec = {
      meta: {
        skill: 'generate-flow'
      },
      fonts: FONTS,
      imports: imports,
      tree: bin
    };

    if (b === 0) {
      spec.meta.targetNodeId = meta.targetNodeId;
      spec.meta.wrapperName = 'generate-flow: ' + (meta.feature || 'Flow');
      spec.meta.sectionName = 'generate-flow: ' + (meta.feature || 'Flow');
    } else {
      spec.meta.appendToId = '__WRAPPER_ID__';
    }

    const specSize = compactSize(spec);
    process.stderr.write('Call ' + (b + 1) + ': ' + bin.length + ' items, ' + specSize + ' bytes\n');

    if (specSize > 50000) {
      process.stderr.write('WARNING: Call ' + (b + 1) + ' exceeds 50KB limit (' + specSize + ' bytes)\n');
    }

    specs.push(spec);
  }

  return specs;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // Parse args
  const args = process.argv.slice(2);
  let inputPath = null;
  let targetNodeId = null;
  let callIndex = null;
  let outputPath = null;
  let pluginRoot = path.resolve(__dirname, '..');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target-node-id' && args[i + 1]) {
      targetNodeId = args[++i];
    } else if (args[i] === '--call' && args[i + 1]) {
      callIndex = parseInt(args[++i], 10);
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[++i];
    } else if (args[i] === '--plugin-root' && args[i + 1]) {
      pluginRoot = args[++i];
    } else if (!inputPath) {
      inputPath = args[i];
    }
  }

  if (!inputPath) {
    process.stderr.write('Usage: node flow-to-spec.js <flow-data.json> --target-node-id <id> [--call N] [--output <path>]\n');
    process.exit(1);
  }

  // Read input
  let raw;
  if (inputPath === '-') {
    raw = fs.readFileSync(0, 'utf8');
  } else {
    if (!fs.existsSync(inputPath)) {
      process.stderr.write('Error: file not found: ' + inputPath + '\n');
      process.exit(1);
    }
    raw = fs.readFileSync(inputPath, 'utf8');
  }

  let input;
  try {
    input = JSON.parse(raw);
  } catch (e) {
    process.stderr.write('Error: invalid JSON: ' + e.message + '\n');
    process.exit(1);
  }

  // Override targetNodeId from CLI
  if (targetNodeId) {
    if (!input.meta) input.meta = {};
    input.meta.targetNodeId = targetNodeId;
  }

  // Validate
  const errors = validate(input);
  if (errors.length > 0) {
    process.stderr.write('Validation errors:\n');
    for (const e of errors) process.stderr.write('  - ' + e + '\n');
    process.exit(1);
  }

  // Load registries
  const refMap = buildRefMap(pluginRoot);

  // Build tree items
  const items = [];
  items.push(buildGenLog(input.meta));
  items.push(buildCoverCard(input.meta));

  for (const screen of input.screens) {
    items.push(buildScreen(screen, input.meta.app));
  }

  // Auto-split
  const specs = autoSplit(input.meta, items, refMap);

  // Output
  let output;
  if (callIndex != null) {
    if (callIndex < 1 || callIndex > specs.length) {
      process.stderr.write('Error: --call ' + callIndex + ' out of range (1-' + specs.length + ')\n');
      process.exit(1);
    }
    output = JSON.stringify(specs[callIndex - 1]);
  } else {
    output = JSON.stringify(specs);
  }

  if (outputPath) {
    fs.writeFileSync(outputPath, output);
    process.stderr.write('Written to ' + outputPath + '\n');
  } else {
    process.stdout.write(output + '\n');
  }

  process.stderr.write('Done: ' + specs.length + ' call(s), ' + input.screens.length + ' screen(s)\n');
}

main();
