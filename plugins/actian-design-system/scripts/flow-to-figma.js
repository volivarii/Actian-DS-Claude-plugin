#!/usr/bin/env node
'use strict';

/**
 * flow-to-figma.js — Reads flow-data.json, builds chrome from templates,
 * generates Figma plugin JS via the codegen library.
 *
 * Usage:
 *   node scripts/flow-to-figma.js <input.json> --target-node-id "288:7646" [--output-dir <dir>]
 *
 * Output: JSON array of { callIndex, code, description } to stdout
 *         With --output-dir: writes call-N.js files + manifest.json to <dir>
 * Logs:   "Done: N call(s), M screen(s)" to stderr
 */

const fs = require('fs');
const path = require('path');
const codegen = require('./figma-codegen');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_BIN_SIZE = 8000; // bytes (raw JSON of items in bin — ~5x code expansion keeps under 45KB)
const OVERHEAD = 500;      // per-item overhead estimate

const FONTS = [
  'Inter:Regular',
  'Inter:Medium',
  'Inter:Semi Bold',
  'Inter:Bold'
];

// Header height is fixed at 70px across all chrome types
const HEADER_HEIGHT = 70;

// ---------------------------------------------------------------------------
// REF_ALIASES
// ---------------------------------------------------------------------------

const REF_ALIASES = {
  // Meta Kit
  genLog:          { registryKey: 'generation-log',           library: 'meta' },
  researchFrame:   { registryKey: 'research-frame',           library: 'meta' },
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

// ---------------------------------------------------------------------------
// FALLBACK_KEYS
// ---------------------------------------------------------------------------

const FALLBACK_KEYS = {
  genLog:         { key: 'a9653f30925367e96dea90093d750bfe70849571', method: 'single' },
  researchFrame:  { key: 'e671618f2b4c6ea406a995fdc3012ac54eadfe56', method: 'single' },
  divider:        { key: 'f4d778e1cf9bb61a33712c791486f54bb1c095b7', method: 'single' },
  flowCoverCard:  { key: 'eaebde6bd07d2f19f3f9c00a9587240cb085a90d', method: 'single' },
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
// Template name resolution
// ---------------------------------------------------------------------------

// Map old-style chrome + app combo to a template name
const APP_TO_TEMPLATE = {
  'Administration': 'admin',
  'Studio':         'studio',
  'Explorer':       'explorer',
  'Actian':         'admin'  // fallback for Actian brand app
};

/**
 * Resolve template name for a screen.
 * Supports new `screen.template` field and old `screen.chrome` + `meta.app`.
 */
function resolveTemplateName(screen, meta, templates) {
  // New format: explicit template field
  if (screen.template && templates[screen.template]) {
    return screen.template;
  }

  // Old format: chrome + app mapping
  const oldChrome = screen.chrome || 'standard';

  if (oldChrome === 'none') return 'bare';
  if (oldChrome === 'no-sidebar') return 'no-sidebar';

  // 'standard' → look up by app
  if (oldChrome === 'standard' || oldChrome === 'app-header-sidebar') {
    const app = (meta && meta.app) || '';
    return APP_TO_TEMPLATE[app] || 'admin';
  }

  // Fallback
  return 'admin';
}

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

function buildAppHeader(appHeaderVariant) {
  return {
    type: 'INSTANCE',
    ref: 'fmAppHeader',
    variant: appHeaderVariant,
    name: 'App Header'
  };
}

function buildSidebar(activeNavItem, navItems, sidebarWidth, bodyH) {
  const count = navItems || 4;
  const children = [];

  children.push({
    type: 'INSTANCE',
    ref: 'fmSideNavItem',
    variant: 'State=On',
    name: 'Nav: ' + (activeNavItem || 'Home'),
    props: { Label: activeNavItem || 'Home' }
  });

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
    width: sidebarWidth,
    height: bodyH,
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

/**
 * Build a screen frame from a screen definition and its resolved template.
 */
function buildScreen(screenDef, templateDef) {
  const chrome = templateDef.chrome;
  const screenW = templateDef.width || screenDef.width || 1440;
  const screenH = templateDef.height || screenDef.height || 960;

  // chrome: "none" — full screen, content is direct children
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

  const bodyH = screenH - HEADER_HEIGHT;
  const sidebarWidth = templateDef.sidebarWidth || 260;
  const contentW = (chrome === 'app-header-sidebar')
    ? screenW - sidebarWidth
    : screenW;
  const contentPadding = templateDef.contentPadding || [24, 32, 24, 32];
  const contentFill = templateDef.contentFill || '#F5F5FA';
  const appHeaderVariant = templateDef.appHeaderVariant || 'Type=Admin';
  const contentSpacing = screenDef.contentSpacing != null ? screenDef.contentSpacing : 16;

  // Build Content Area children
  const contentChildren = [];
  const ph = buildPageHeader(screenDef.pageHeader);
  if (ph) contentChildren.push(ph);
  if (screenDef.content) contentChildren.push.apply(contentChildren, screenDef.content);

  const contentArea = {
    type: 'FRAME',
    name: 'Content Area',
    width: contentW,
    height: bodyH,
    layout: {
      mode: 'VERTICAL',
      spacing: contentSpacing,
      padding: contentPadding
    },
    fills: [contentFill],
    sizing: { horizontal: 'FILL', vertical: 'FILL' },
    children: contentChildren
  };

  // Build Body children
  const bodyChildren = [];
  if (chrome === 'app-header-sidebar') {
    bodyChildren.push(buildSidebar(
      screenDef.activeNavItem,
      screenDef.navItems,
      sidebarWidth,
      bodyH
    ));
  }
  bodyChildren.push(contentArea);

  const body = {
    type: 'FRAME',
    name: 'Body',
    width: screenW,
    height: bodyH,
    layout: { mode: 'HORIZONTAL', spacing: 0 },
    fills: [],
    sizing: { horizontal: 'FILL', vertical: 'FILL' },
    children: bodyChildren
  };

  return {
    type: 'FRAME',
    name: screenDef.name,
    width: screenW,
    height: screenH,
    fills: ['#FFFFFF'],
    clipsContent: true,
    layout: { mode: 'VERTICAL', spacing: 0 },
    children: [
      buildAppHeader(appHeaderVariant),
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

function buildResearchCard(meta) {
  var research = meta.research;
  var title = research.title || 'UX Research';
  var source = research.source || '';

  var bodyParts = [];
  if (research.competitors) bodyParts.push('How others handle this:\n' + research.competitors);
  if (research.patterns) bodyParts.push('Key patterns adopted:\n' + research.patterns);
  if (research.recommendation) bodyParts.push('Recommendation:\n' + research.recommendation);
  if (research.sources) bodyParts.push('Sources:\n' + research.sources);

  var children = [];
  if (bodyParts.length > 0) {
    children.push({
      type: 'TEXT',
      name: 'Research body',
      text: bodyParts.join('\n\n'),
      style: { fontSize: 13, fontFamily: 'Inter', fontWeight: 'Regular', lineHeight: 20 },
      fills: ['#475467'], // --fm-text-tertiary
      sizing: { horizontal: 'FILL' }
    });
  }

  return {
    type: 'INSTANCE',
    ref: 'researchFrame',
    name: 'Research: ' + title,
    props: {
      Title: title,
      Source: source
    },
    children: children
  };
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
// Build description for a call
// ---------------------------------------------------------------------------

function buildDescription(callIdx, totalCalls, items) {
  const parts = ['Call ' + callIdx + '/' + totalCalls + ':'];
  for (const item of items) {
    parts.push(item.name || item.type || 'item');
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

function validateInput(input, pluginRoot) {
  const warnings = [];

  // Reject contentHtml — must use content[] nodes
  for (const screen of (input.screens || [])) {
    if (screen.contentHtml) {
      warnings.push('Screen "' + (screen.name || '?') + '" uses contentHtml — use content[] nodes instead');
    }
  }

  // Check for missing boolean properties on button instances
  let registry = null;
  try {
    const regPath = path.join(pluginRoot, 'docs', 'fm-components-registry.json');
    registry = JSON.parse(fs.readFileSync(regPath, 'utf8'));
  } catch (e) { /* registry not available — skip boolean checks */ }

  if (registry && registry.components) {
    const walkNodes = function(nodes) {
      for (const node of (nodes || [])) {
        if (node.type === 'INSTANCE' && node.componentKey) {
          const comp = registry.components[node.componentKey];
          if (comp && comp.booleanProperties) {
            for (const propName of Object.keys(comp.booleanProperties)) {
              if (!node.overrides || !(propName in node.overrides)) {
                warnings.push('Screen instance "' + (node.componentKey || '?') + '" missing boolean prop "' + propName + '" (defaults to ' + comp.booleanProperties[propName].default + ')');
              }
            }
          }
        }
        if (node.children) walkNodes(node.children);
      }
    };

    for (const screen of (input.screens || [])) {
      walkNodes(screen.content);
    }
  }

  // Check required meta fields
  if (!input.meta) {
    warnings.push('Missing meta object');
  } else {
    if (!input.meta.feature) warnings.push('meta.feature is missing');
    if (!input.meta.skill) warnings.push('meta.skill is missing');
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  let inputPath = null;
  let targetNodeId = null;
  let outputDir = null;
  let pluginRoot = path.resolve(__dirname, '..');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target-node-id' && args[i + 1]) {
      targetNodeId = args[++i];
    } else if (args[i] === '--output-dir' && args[i + 1]) {
      outputDir = args[++i];
    } else if (args[i] === '--plugin-root' && args[i + 1]) {
      pluginRoot = args[++i];
    } else if (!inputPath) {
      inputPath = args[i];
    }
  }

  if (args.indexOf('--help') !== -1) {
    var helpMeta = {
      name: 'flow-to-figma',
      description: 'Reads flow-data.json, generates Figma Plugin API JavaScript.',
      flags: [
        { name: '--target-node-id', required: false, description: 'Figma node ID to append output to' },
        { name: '--output-dir', required: false, description: 'Directory to write call-N.js + manifest.json' },
        { name: '--plugin-root', required: false, description: 'Override plugin root path' }
      ],
      templates: Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname, 'templates.json'), 'utf8'))['flow-templates'])
    };
    process.stdout.write(JSON.stringify(helpMeta, null, 2) + '\n');
    process.exit(0);
  }

  if (!inputPath) {
    process.stderr.write('Usage: node flow-to-figma.js <input.json> --target-node-id "288:7646" [--output-dir <dir>]\n');
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

  // Validate input
  const warnings = validateInput(input, pluginRoot);
  for (const w of warnings) {
    process.stderr.write('WARNING: ' + w + '\n');
  }

  // Override targetNodeId from CLI
  if (targetNodeId) {
    if (!input.meta) input.meta = {};
    input.meta.targetNodeId = targetNodeId;
  }

  const meta = input.meta || {};

  // Load templates
  const templatesPath = path.join(__dirname, 'templates.json');
  let templatesData;
  try {
    templatesData = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
  } catch (e) {
    process.stderr.write('Error: could not load templates.json: ' + e.message + '\n');
    process.exit(1);
  }
  const templates = templatesData['flow-templates'];

  // Load registries
  const refMap = buildRefMap(pluginRoot);

  // Build all items: genLog + researchCard (if present) + coverCard + screens
  const allItems = [];
  allItems.push(buildGenLog(meta));
  if (meta.research) {
    allItems.push(buildResearchCard(meta));
  }
  allItems.push(buildCoverCard(meta));

  for (const screen of (input.screens || [])) {
    const templateName = resolveTemplateName(screen, meta, templates);
    const templateDef = templates[templateName] || templates['admin'];
    allItems.push(buildScreen(screen, templateDef));
  }

  // Bin-pack
  const bins = codegen.binPack(allItems, MAX_BIN_SIZE, OVERHEAD);
  const totalCalls = bins.length;

  // Generate code for each bin
  const results = [];

  for (let b = 0; b < bins.length; b++) {
    const bin = bins[b];
    const callIdx = b + 1;

    // Scan refs across all items in this bin
    const refs = codegen.scanRefs(bin);
    const imports = resolveImports(refs, refMap);

    // Build spec for codegen
    const spec = {
      meta: {
        skill: 'generate-flow',
        targetNodeId: callIdx === 1 ? (meta.targetNodeId || '__TARGET_NODE_ID__') : undefined,
        wrapperName: callIdx === 1 ? ('generate-flow: ' + (meta.feature || 'Flow')) : undefined,
        sectionName: callIdx === 1 ? ('generate-flow: ' + (meta.feature || 'Flow')) : undefined,
        appendToId: callIdx > 1 ? '__WRAPPER_ID__' : undefined
      },
      fonts: FONTS,
      imports: imports,
      tree: bin
    };

    // Remove undefined keys from meta
    for (const k of Object.keys(spec.meta)) {
      if (spec.meta[k] === undefined) delete spec.meta[k];
    }

    // Generate code
    const code = codegen.generateCallCode(spec);
    const codeSize = Buffer.byteLength(code, 'utf8');

    process.stderr.write('Call ' + callIdx + ': ' + bin.length + ' items, code=' + codeSize + ' bytes\n');

    if (codeSize > 45000) {
      process.stderr.write('WARNING: Call ' + callIdx + ' code exceeds 45KB (' + codeSize + ' bytes)\n');
    }

    results.push({
      callIndex: callIdx,
      code: code,
      description: buildDescription(callIdx, totalCalls, bin)
    });
  }

  // Output
  if (outputDir) {
    // Write each call as a separate file for easier consumption
    fs.mkdirSync(outputDir, { recursive: true });
    const manifest = { totalCalls: totalCalls, calls: [] };
    for (const r of results) {
      const fileName = 'call-' + r.callIndex + '.js';
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, r.code, 'utf8');
      manifest.calls.push({
        callIndex: r.callIndex,
        file: fileName,
        sizeBytes: Buffer.byteLength(r.code, 'utf8'),
        description: r.description
      });
    }
    fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    process.stderr.write('Wrote ' + totalCalls + ' call file(s) to ' + outputDir + '\n');
  } else {
    // Legacy: JSON array to stdout
    process.stdout.write(JSON.stringify(results, null, 2) + '\n');
  }

  process.stderr.write('Done: ' + totalCalls + ' call(s), ' + (input.screens || []).length + ' screen(s)\n');
}

main();
