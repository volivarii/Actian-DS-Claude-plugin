#!/usr/bin/env node
'use strict';

/**
 * slide-to-figma.js — Reads slide-data.json, builds slide nodes,
 * generates Figma plugin JS via the codegen library.
 *
 * Usage:
 *   node scripts/slide-to-figma.js <slide-data.json> --target-node-id <id>
 *
 * Output: JSON array of { callIndex, code, description } to stdout
 * Logs:   "Done: N call(s), M slide(s)" to stderr
 */

const fs = require('fs');
const path = require('path');
const codegen = require('./figma-codegen');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_BIN_SIZE = 25000; // bytes (raw JSON of items in bin)
const OVERHEAD = 800;       // per-item overhead estimate

const SLIDE_W = 1920;
const SLIDE_H = 1080;

const FONTS = ['Roboto:Regular', 'Roboto:Bold', 'Roboto:Medium'];

// DS Kit variable keys for theme-aware colors
const VARIABLES = {
  brandPrimary:  { key: 'a256595115f6048a1e1c843e3099a79a5c259288' },
  bgDefault:     { key: '805afec875092b89deebe685e17992963d603974' },
  bgGrey2:       { key: '2d7f893d1d1f5807dfc84b7b6e057eff8fd2ae31' },
  bgReverse:     { key: '3d35091ed8a67f9cf4dc1e55e32a4bac7ac07a79' },
  textPrimary:   { key: 'cb3cf6a8b661f3a2ff12835120957f3278d329d0' },
  textSecondary: { key: '54d9d36f7653380d99e9aadbad21e14f9dcdb295' },
  textReverse:   { key: 'd5b2b08fd5bab41595edb892bf4707cb94bae50a' },
  borderDefault: { key: '290c868621027b488cbc3b262619959bec52765f' },
  cat1Strong:    { key: 'a6da1a364e8613bd146667f77efa03ee7ea39305' },
  cat2Strong:    { key: 'c2c0376490a69426cedfdcb1ab2a6d531b626fdf' },
  cat3Strong:    { key: '9997cab3913a4dfbcb8729e5a11bd21f14f16b86' },
  cat4Strong:    { key: '2b5d7f13d3765cb54d6b7ffdcd36b6ed3543823f' },
  cat5Strong:    { key: '8d43f11cdb9916465065f37576bb8d903706dcfc' }
};

const DARK_GRADIENT = [{
  type: 'LINEAR',
  stops: [{ color: '#090952', position: 0 }, { color: '#1414B8', position: 1 }],
  angle: 80
}];

const LIGHT_GRADIENT = [{
  type: 'LINEAR',
  stops: [{ color: '#EEEEFD', position: 0 }, { color: '#CBDAFF', position: 1 }],
  angle: 80
}];

const IMPORTS = {
  genLog: { key: 'a9653f30925367e96dea90093d750bfe70849571', method: 'single' }
};

// ---------------------------------------------------------------------------
// Slide builders
// ---------------------------------------------------------------------------

function buildCover(slide) {
  return {
    type: 'FRAME',
    name: slide.name || 'Slide: Cover',
    width: SLIDE_W, height: SLIDE_H,
    layout: { mode: 'NONE' },
    clipsContent: true,
    fills: DARK_GRADIENT,
    children: [
      { type: 'TEXT', name: 'Topic', content: slide.topic || '', font: 'Roboto:Medium', size: 40, color: '#FFFFFF', width: 1760, x: 80, y: 88, variables: { 'fills.0.color': 'textReverse' } },
      { type: 'TEXT', name: 'Title', content: slide.title || '', font: 'Roboto:Medium', size: 130, color: '#FFFFFF', width: 1760, x: 69, y: 166, lineHeight: { value: 102, unit: 'PERCENT' }, variables: { 'fills.0.color': 'textReverse' } },
      { type: 'TEXT', name: 'Subtitle', content: slide.subtitle || '', font: 'Roboto:Regular', size: 60, color: '#FFFFFF', opacity: 0.8, width: 1760, x: 69, y: 341, lineHeight: { value: 102, unit: 'PERCENT' } },
      { type: 'TEXT', name: 'Date', content: slide.date || '', font: 'Roboto:Regular', size: 32, color: '#FFFFFF', x: 80, y: 931, variables: { 'fills.0.color': 'textReverse' } },
      { type: 'TEXT', name: 'Creators', content: slide.creators || '', font: 'Roboto:Regular', size: 32, color: '#FFFFFF', x: 80, y: 980, variables: { 'fills.0.color': 'textReverse' } }
    ]
  };
}

function buildSection(slide) {
  return {
    type: 'FRAME',
    name: slide.name || 'Slide: Section',
    width: SLIDE_W, height: SLIDE_H,
    layout: { mode: 'NONE' },
    clipsContent: true,
    fills: LIGHT_GRADIENT,
    children: [
      { type: 'TEXT', name: 'Topic', content: slide.topic || '', font: 'Roboto:Regular', size: 60, color: '#12131F', width: 1760, x: 69, y: 361, lineHeight: { value: 102, unit: 'PERCENT' }, variables: { 'fills.0.color': 'textPrimary' } },
      { type: 'TEXT', name: 'Title', content: slide.title || '', font: 'Roboto:Medium', size: 130, color: '#12131F', width: 1760, x: 69, y: 449, lineHeight: { value: 102, unit: 'PERCENT' }, variables: { 'fills.0.color': 'textPrimary' } }
    ]
  };
}

function buildBodyFull(slide) {
  const children = [
    {
      type: 'TEXT', name: 'Slide title', content: slide.title || '',
      font: 'Roboto:Regular', size: 56, color: '#12131F',
      lineHeight: { value: 103, unit: 'PERCENT' },
      sizing: { horizontal: 'FILL', vertical: 'HUG' },
      variables: { 'fills.0.color': 'textPrimary' }
    }
  ];

  if (slide.content && slide.content.length > 0) {
    children.push({
      type: 'FRAME', name: 'Content area',
      layout: { mode: 'VERTICAL', spacing: 16, padding: [24, 24, 24, 24], primaryAxisAlign: 'CENTER', counterAxisAlign: 'CENTER' },
      sizing: { horizontal: 'FILL', vertical: 'FILL' },
      fills: ['#F5F5FA'], cornerRadius: 4,
      variables: { 'fills.0.color': 'bgGrey2' },
      children: slide.content
    });
  }

  return {
    type: 'FRAME',
    name: slide.name || 'Slide: Body',
    width: SLIDE_W, height: SLIDE_H,
    layout: { mode: 'VERTICAL', spacing: 24, padding: [64, 80, 64, 80] },
    clipsContent: true,
    fills: ['#FFFFFF'],
    variables: { 'fills.0.color': 'bgDefault' },
    children: children
  };
}

function buildBodyTextVisual(slide) {
  return {
    type: 'FRAME',
    name: slide.name || 'Slide: Body',
    width: SLIDE_W, height: SLIDE_H,
    layout: { mode: 'VERTICAL', spacing: 0, padding: [64, 80, 64, 80] },
    clipsContent: true,
    fills: ['#FFFFFF'],
    variables: { 'fills.0.color': 'bgDefault' },
    children: [
      {
        type: 'TEXT', name: 'Slide title', content: slide.title || '',
        font: 'Roboto:Regular', size: 56, color: '#12131F',
        lineHeight: { value: 103, unit: 'PERCENT' },
        sizing: { horizontal: 'FILL', vertical: 'HUG' },
        variables: { 'fills.0.color': 'textPrimary' }
      },
      {
        type: 'FRAME', name: 'Content columns',
        layout: { mode: 'HORIZONTAL', spacing: 56 },
        sizing: { horizontal: 'FILL', vertical: 'FILL' },
        fills: [],
        children: [
          {
            type: 'FRAME', name: 'Text column',
            layout: { mode: 'VERTICAL', spacing: 16 },
            sizing: { horizontal: 549, vertical: 'FILL' },
            fills: [],
            children: slide.textContent || [
              { type: 'TEXT', name: 'Body', content: slide.body || '', font: 'Roboto:Regular', size: 24, color: '#12131F', width: 549, lineHeight: { value: 150, unit: 'PERCENT' }, variables: { 'fills.0.color': 'textPrimary' } }
            ]
          },
          {
            type: 'FRAME', name: 'Visual area',
            layout: { mode: 'VERTICAL', spacing: 0, padding: [24, 24, 24, 24], primaryAxisAlign: 'CENTER', counterAxisAlign: 'CENTER' },
            sizing: { horizontal: 'FILL', vertical: 'FILL' },
            fills: ['#F5F5FA'], cornerRadius: 4,
            variables: { 'fills.0.color': 'bgGrey2' },
            children: slide.visualContent || [
              { type: 'TEXT', name: 'Visual placeholder', content: 'Visual content here', font: 'Roboto:Regular', size: 18, color: '#717D96' }
            ]
          }
        ]
      }
    ]
  };
}

function buildBackCover(slide) {
  return {
    type: 'FRAME',
    name: slide.name || 'Slide: Back cover',
    width: SLIDE_W, height: SLIDE_H,
    layout: { mode: 'NONE' },
    clipsContent: true,
    fills: DARK_GRADIENT,
    children: [
      { type: 'TEXT', name: 'Closing text', content: slide.title || 'Thank you', font: 'Roboto:Medium', size: 152, color: '#FFFFFF', width: 1760, x: 69, y: 361, lineHeight: { value: 102, unit: 'PERCENT' }, variables: { 'fills.0.color': 'textReverse' } }
    ]
  };
}

function buildSlide(slide) {
  const t = slide.type || 'body-full';
  switch (t) {
    case 'cover':            return buildCover(slide);
    case 'section':          return buildSection(slide);
    case 'body-full':        return buildBodyFull(slide);
    case 'body-text-visual': return buildBodyTextVisual(slide);
    case 'back-cover':       return buildBackCover(slide);
    default:
      process.stderr.write('Warning: unknown slide type "' + t + '", using body-full\n');
      return buildBodyFull(slide);
  }
}

// ---------------------------------------------------------------------------
// Gen Log
// ---------------------------------------------------------------------------

function buildGenLog(meta) {
  return {
    type: 'INSTANCE',
    ref: 'genLog',
    name: 'Generation Log',
    props: {
      Skill: 'generate-presentation',
      Prompt: (meta.prompt || '').substring(0, 200),
      Date: meta.generatedAt || new Date().toISOString(),
      Duration: meta.duration || '',
      Model: meta.model || 'unknown',
      Plugin: meta.pluginVersion || 'unknown'
    }
  };
}

// ---------------------------------------------------------------------------
// Variable scanner — collect all variable ref names used in content
// ---------------------------------------------------------------------------

function scanVariables(nodes, vars) {
  if (!vars) vars = new Set();
  if (!Array.isArray(nodes)) return vars;
  for (const node of nodes) {
    if (!node) continue;
    if (node.variables) {
      for (const val of Object.values(node.variables)) {
        if (typeof val === 'string') vars.add(val);
      }
    }
    if (node.children) scanVariables(node.children, vars);
  }
  return vars;
}

// scanRefs: use codegen.scanRefs

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(input) {
  const errors = [];
  if (!input.meta) errors.push('Missing "meta" object');
  else {
    if (!input.meta.title) errors.push('Missing meta.title');
    if (!input.meta.targetNodeId) errors.push('Missing meta.targetNodeId');
  }
  if (!input.slides || !Array.isArray(input.slides) || input.slides.length === 0) {
    errors.push('Missing or empty "slides" array');
  } else {
    const validTypes = ['cover', 'section', 'body-full', 'body-text-visual', 'back-cover'];
    for (let i = 0; i < input.slides.length; i++) {
      const s = input.slides[i];
      if (s.type && !validTypes.includes(s.type)) {
        errors.push('slides[' + i + ']: type must be one of: ' + validTypes.join(', '));
      }
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Auto-splitter
// ---------------------------------------------------------------------------

function autoSplit(meta, allItems, usedVars) {
  const bins = codegen.binPack(allItems, MAX_BIN_SIZE, OVERHEAD);

  // Resolve which variables are actually used
  const resolvedVars = {};
  for (const v of usedVars) {
    if (VARIABLES[v]) resolvedVars[v] = { key: VARIABLES[v].key };
  }

  // Resolve additional imports from content refs
  const allRefs = codegen.scanRefs(allItems);
  const imports = Object.assign({}, IMPORTS);
  if (allRefs.has('divider')) {
    imports.divider = { key: 'f4d778e1cf9bb61a33712c791486f54bb1c095b7', method: 'single' };
  }

  const calls = [];
  for (let b = 0; b < bins.length; b++) {
    const spec = {
      meta: { skill: 'generate-presentation' },
      fonts: FONTS,
      imports: b === 0 ? imports : {},
      variables: resolvedVars,
      tree: bins[b]
    };

    if (b === 0) {
      spec.meta.targetNodeId = meta.targetNodeId;
      spec.meta.component = meta.title || 'Presentation';
      spec.meta.wrapperName = 'Presentation: ' + (meta.title || 'Deck');
      spec.meta.sectionName = 'Presentation: ' + (meta.title || 'Deck');
    } else {
      spec.meta.targetNodeId = meta.targetNodeId;
      spec.meta.appendToId = '__WRAPPER_ID__';
    }

    // Generate code using codegen library
    const code = codegen.generateCallCode(spec);
    const codeSize = Buffer.byteLength(code, 'utf8');

    const slideNames = bins[b]
      .filter(item => item.type === 'FRAME')
      .map(item => item.name || 'Slide')
      .join(', ');
    const description = 'Call ' + (b + 1) + ' of ' + bins.length + ': ' +
      (slideNames || 'generation log') +
      ' (' + codeSize + ' bytes)';

    process.stderr.write('Call ' + (b + 1) + ': ' + bins[b].length + ' items, ' + codeSize + ' bytes code\n');
    if (codeSize > 100000) {
      process.stderr.write('WARNING: Call ' + (b + 1) + ' code exceeds 100KB\n');
    }

    calls.push({ callIndex: b + 1, code: code, description: description });
  }

  return calls;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  let inputPath = null;
  let targetNodeId = null;
  let outputPath = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target-node-id' && args[i + 1]) { targetNodeId = args[++i]; }
    else if (args[i] === '--output' && args[i + 1]) { outputPath = args[++i]; }
    else if (!inputPath) { inputPath = args[i]; }
  }

  if (!inputPath) {
    process.stderr.write('Usage: node slide-to-figma.js <slide-data.json> --target-node-id <id> [--output <path>]\n');
    process.exit(1);
  }

  let raw;
  if (inputPath === '-') { raw = fs.readFileSync(0, 'utf8'); }
  else {
    if (!fs.existsSync(inputPath)) { process.stderr.write('Error: file not found: ' + inputPath + '\n'); process.exit(1); }
    raw = fs.readFileSync(inputPath, 'utf8');
  }

  let input;
  try { input = JSON.parse(raw); }
  catch (e) { process.stderr.write('Error: invalid JSON: ' + e.message + '\n'); process.exit(1); }

  if (targetNodeId) {
    if (!input.meta) input.meta = {};
    input.meta.targetNodeId = targetNodeId;
  }

  const errors = validate(input);
  if (errors.length > 0) {
    process.stderr.write('Validation errors:\n');
    for (const e of errors) process.stderr.write('  - ' + e + '\n');
    process.exit(1);
  }

  // Build slides
  const items = [];
  items.push(buildGenLog(input.meta));

  for (const slide of input.slides) {
    items.push(buildSlide(slide));
  }

  // Scan variables used across all slides
  const usedVars = scanVariables(items);
  // Always include core variables for slides
  ['bgDefault', 'bgGrey2', 'textPrimary', 'textSecondary', 'textReverse', 'brandPrimary', 'borderDefault'].forEach(function(v) { usedVars.add(v); });

  const calls = autoSplit(input.meta, items, usedVars);
  const output = JSON.stringify(calls);

  if (outputPath) {
    fs.writeFileSync(outputPath, output);
    process.stderr.write('Written to ' + outputPath + '\n');
  } else {
    process.stdout.write(output + '\n');
  }

  process.stderr.write('Done: ' + calls.length + ' call(s), ' + input.slides.length + ' slide(s)\n');
}

main();
