#!/usr/bin/env node
// scripts/validate-spec.js
// Validates a figma-spec.json file against the JSON Spec Interpreter schema.
// Usage: node scripts/validate-spec.js path/to/figma-spec.json

const fs = require('fs');
const path = require('path');

const VALID_TYPES = new Set([
  'FRAME', 'TEXT', 'RECT', 'INSTANCE', 'DIVIDER',
  'LINE', 'ELLIPSE', 'VECTOR', 'POLYGON', 'STAR', 'SVG',
  'GROUP', 'BOOLEAN', 'SECTION',
  'COMPONENT', 'COMPONENT_SET',
  'LOCAL_INSTANCE'
]);

const VALID_IMPORT_METHODS = new Set(['set', 'single']);
const VALID_VARIABLE_TYPES = new Set(['COLOR', 'FLOAT', 'STRING', 'BOOLEAN']);
const VALID_STYLE_TYPES = new Set(['TEXT', 'EFFECT', 'FILL', 'STROKE', 'GRID']);
const VALID_LAYOUT_MODES = new Set(['VERTICAL', 'HORIZONTAL', 'NONE']);
const VALID_SIZING_VALUES = new Set(['FILL', 'HUG']);
const VALID_BOOLEAN_OPS = new Set(['UNION', 'SUBTRACT', 'INTERSECT', 'EXCLUDE']);
const VALID_STROKE_ALIGNS = new Set(['INSIDE', 'OUTSIDE', 'CENTER']);
const VALID_EFFECT_TYPES = new Set(['DROP_SHADOW', 'INNER_SHADOW', 'LAYER_BLUR', 'BACKGROUND_BLUR']);
const VALID_TEXT_ALIGNS_H = new Set(['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED']);
const VALID_TEXT_ALIGNS_V = new Set(['TOP', 'CENTER', 'BOTTOM']);

const errors = [];
const warnings = [];

function error(path, msg) { errors.push(`ERROR ${path}: ${msg}`); }
function warn(path, msg) { warnings.push(`WARN ${path}: ${msg}`); }

function validateMeta(meta) {
  if (!meta) return error('meta', 'missing');
  if (!meta.skill) error('meta.skill', 'missing');
  if (!meta.targetNodeId && !meta.appendToId) error('meta', 'must have either targetNodeId or appendToId');
}

function validateImports(imports) {
  if (!imports) return;
  for (const [ref, def] of Object.entries(imports)) {
    if (!def.key) error(`imports.${ref}.key`, 'missing');
    if (!VALID_IMPORT_METHODS.has(def.method)) error(`imports.${ref}.method`, `invalid: "${def.method}" (expected: set, single)`);
  }
}

function validateVariables(variables) {
  if (!variables) return;
  for (const [ref, def] of Object.entries(variables)) {
    if (!def.key) error(`variables.${ref}.key`, 'missing');
    if (!VALID_VARIABLE_TYPES.has(def.type)) error(`variables.${ref}.type`, `invalid: "${def.type}"`);
  }
}

function validateStylesDefs(styles) {
  if (!styles) return;
  for (const [ref, def] of Object.entries(styles)) {
    if (!def.key) error(`styles.${ref}.key`, 'missing');
    if (!VALID_STYLE_TYPES.has(def.type)) error(`styles.${ref}.type`, `invalid: "${def.type}"`);
  }
}

function validateNode(node, nodePath, importRefs, varRefs) {
  if (!node.type) return error(nodePath, 'missing type');
  if (!VALID_TYPES.has(node.type)) return error(nodePath, `unknown type: "${node.type}"`);

  // Type-specific validation
  switch (node.type) {
    case 'FRAME':
      if (node.layout && node.layout.mode && !VALID_LAYOUT_MODES.has(node.layout.mode)) {
        error(`${nodePath}.layout.mode`, `invalid: "${node.layout.mode}"`);
      }
      if (node.layout && node.layout.padding && (!Array.isArray(node.layout.padding) || node.layout.padding.length !== 4)) {
        error(`${nodePath}.layout.padding`, 'must be [top, right, bottom, left]');
      }
      break;

    case 'TEXT':
      if (node.content == null) warn(`${nodePath}.content`, 'missing content — will create empty text node');
      if (node.font && !node.font.includes(':')) error(`${nodePath}.font`, 'must be "Family:Style" format');
      if (node.textAlign) {
        if (node.textAlign.horizontal && !VALID_TEXT_ALIGNS_H.has(node.textAlign.horizontal)) {
          error(`${nodePath}.textAlign.horizontal`, `invalid: "${node.textAlign.horizontal}"`);
        }
        if (node.textAlign.vertical && !VALID_TEXT_ALIGNS_V.has(node.textAlign.vertical)) {
          error(`${nodePath}.textAlign.vertical`, `invalid: "${node.textAlign.vertical}"`);
        }
      }
      break;

    case 'INSTANCE':
      if (!node.ref) error(`${nodePath}.ref`, 'missing — must reference an import key');
      if (node.ref && !importRefs.has(node.ref)) error(`${nodePath}.ref`, `"${node.ref}" not found in spec.imports`);
      break;

    case 'DIVIDER':
      if (!importRefs.has('divider') && !importRefs.has('cardDivider')) {
        warn(`${nodePath}`, 'DIVIDER requires "divider" or "cardDivider" in spec.imports');
      }
      break;

    case 'BOOLEAN':
      if (!VALID_BOOLEAN_OPS.has(node.operation)) error(`${nodePath}.operation`, `invalid: "${node.operation}"`);
      if (!node.children || node.children.length < 2) error(`${nodePath}.children`, 'BOOLEAN requires at least 2 children');
      break;

    case 'SVG':
      if (!node.svg) error(`${nodePath}.svg`, 'missing svg string');
      break;

    case 'VECTOR':
      if (!node.paths) warn(`${nodePath}.paths`, 'missing — will create empty vector');
      break;

    case 'COMPONENT':
      if (node.properties) {
        node.properties.forEach((p, i) => {
          if (!p.name) error(`${nodePath}.properties[${i}].name`, 'missing');
          if (!['TEXT', 'BOOLEAN', 'INSTANCE_SWAP'].includes(p.type)) {
            error(`${nodePath}.properties[${i}].type`, `invalid: "${p.type}" (expected: TEXT, BOOLEAN, INSTANCE_SWAP)`);
          }
        });
      }
      if (node.propertyLinks) {
        node.propertyLinks.forEach((pl, i) => {
          if (!pl.layer) error(`${nodePath}.propertyLinks[${i}].layer`, 'missing');
          if (!pl.property) error(`${nodePath}.propertyLinks[${i}].property`, 'missing');
        });
      }
      break;

    case 'COMPONENT_SET':
      if (!node.variants || !node.variants.length) error(`${nodePath}.variants`, 'COMPONENT_SET requires at least one variant');
      if (node.variants) {
        node.variants.forEach((v, i) => {
          if (!v.name) error(`${nodePath}.variants[${i}].name`, 'missing — must be "Axis=Value" format');
          validateNode(v, `${nodePath}.variants[${i}]`, importRefs, varRefs);
        });
      }
      break;

    case 'LOCAL_INSTANCE':
      if (!node.ref) error(`${nodePath}.ref`, 'missing — must reference a key in spec.localComponents');
      // Cross-check against localComponents (if we have access)
      break;
  }

  // Validate sizing
  if (node.sizing) {
    for (const dir of ['horizontal', 'vertical']) {
      const v = node.sizing[dir];
      if (v != null && !VALID_SIZING_VALUES.has(v) && typeof v !== 'number') {
        error(`${nodePath}.sizing.${dir}`, `invalid: "${v}" (expected: FILL, HUG, or number)`);
      }
    }
  }

  // Validate stroke
  if (node.stroke) {
    if (!node.stroke.color) error(`${nodePath}.stroke.color`, 'missing');
    if (node.stroke.align && !VALID_STROKE_ALIGNS.has(node.stroke.align)) {
      error(`${nodePath}.stroke.align`, `invalid: "${node.stroke.align}"`);
    }
  }

  // Validate effects
  if (node.effects) {
    node.effects.forEach((e, i) => {
      if (!VALID_EFFECT_TYPES.has(e.type)) error(`${nodePath}.effects[${i}].type`, `invalid: "${e.type}"`);
    });
  }

  // Validate variable refs exist
  if (node.variables) {
    for (const [field, ref] of Object.entries(node.variables)) {
      if (!varRefs.has(ref)) error(`${nodePath}.variables.${field}`, `variable ref "${ref}" not found in spec.variables`);
    }
  }

  // Validate fills are hex or gradient
  if (node.fills && Array.isArray(node.fills)) {
    node.fills.forEach((f, i) => {
      if (typeof f === 'string' && !/^#[0-9A-Fa-f]{6}$/.test(f)) {
        error(`${nodePath}.fills[${i}]`, `invalid hex: "${f}"`);
      }
    });
  }

  // Recurse into children
  if (node.children) {
    node.children.forEach((child, i) => {
      validateNode(child, `${nodePath}.children[${i}]`, importRefs, varRefs);
    });
  }
}

// Main
const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node validate-spec.js <path-to-figma-spec.json>');
  process.exit(1);
}

let spec;
try {
  spec = JSON.parse(fs.readFileSync(filePath, 'utf8'));
} catch (e) {
  console.error(`Failed to parse ${filePath}: ${e.message}`);
  process.exit(1);
}

// Validate top-level
validateMeta(spec.meta);
validateImports(spec.imports);
validateVariables(spec.variables);
validateStylesDefs(spec.styles);

if (!spec.fonts || !Array.isArray(spec.fonts)) warn('fonts', 'missing or not an array');
if (!spec.tree) error('tree', 'missing — spec must have a tree');

// Collect refs for cross-referencing
const importRefs = new Set(Object.keys(spec.imports || {}));
const varRefs = new Set(Object.keys(spec.variables || {}));

// Validate tree
if (spec.tree) {
  if (Array.isArray(spec.tree)) {
    spec.tree.forEach((node, i) => validateNode(node, `tree[${i}]`, importRefs, varRefs));
  } else {
    validateNode(spec.tree, 'tree', importRefs, varRefs);
  }
}

// Report
const total = errors.length + warnings.length;
if (errors.length > 0) {
  console.error(`\n${errors.length} error(s):`);
  errors.forEach(e => console.error(`  ${e}`));
}
if (warnings.length > 0) {
  console.warn(`\n${warnings.length} warning(s):`);
  warnings.forEach(w => console.warn(`  ${w}`));
}
if (total === 0) {
  console.log(`\n✓ Spec is valid (${filePath})`);
} else {
  console.log(`\n${errors.length} errors, ${warnings.length} warnings`);
}
process.exit(errors.length > 0 ? 1 : 0);
