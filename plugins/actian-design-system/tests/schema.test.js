#!/usr/bin/env node
'use strict';

/**
 * schema.test.js — Tests for JSON Schema files, validator, and doc generator.
 *
 * Run with: node tests/schema.test.js
 * (from the plugins/actian-design-system directory)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    process.stdout.write('  \u2713 ' + message + '\n');
  } else {
    failed++;
    failures.push(message);
    process.stdout.write('  \u2717 ' + message + '\n');
  }
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..');
const schemasDir = path.join(ROOT, 'schemas');
const scriptsDir = path.join(ROOT, 'scripts');
const fixturesDir = path.join(ROOT, 'tests', 'fixtures');

const validate = require(path.join(scriptsDir, 'validate-schema'));
const schemaToDocs = require(path.join(scriptsDir, 'schema-to-docs'));

// ---------------------------------------------------------------------------
// Test: Schema files parse as valid JSON
// ---------------------------------------------------------------------------

process.stdout.write('\nSchema files parse as valid JSON\n');

const schemaFiles = [
  'flow-data.schema.json',
  'brief-data.schema.json',
  'slide-data.schema.json'
];

const schemas = {};

for (const file of schemaFiles) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(path.join(schemasDir, file), 'utf8'));
  } catch (e) {
    parsed = null;
  }
  schemas[file] = parsed;
  assert(parsed !== null && typeof parsed === 'object', file + ' parses as valid JSON');
}

// ---------------------------------------------------------------------------
// Test: Fixtures validate against schemas with 0 errors
// ---------------------------------------------------------------------------

process.stdout.write('\nFixtures validate against schemas\n');

const fixturePairs = [
  { fixture: 'admin-dashboard.json', schema: 'flow-data.schema.json' },
  { fixture: 'button-brief-data.json', schema: 'brief-data.schema.json' },
  { fixture: 'sample-presentation.json', schema: 'slide-data.schema.json' }
];

for (const pair of fixturePairs) {
  const data = JSON.parse(fs.readFileSync(path.join(fixturesDir, pair.fixture), 'utf8'));
  const schema = schemas[pair.schema];
  const errors = validate(data, schema);
  // Filter out deprecation warnings for fixture validation
  const realErrors = errors.filter(e => !e.includes('deprecated'));
  assert(
    realErrors.length === 0,
    pair.fixture + ' validates against ' + pair.schema + ' (' + realErrors.length + ' errors' + (realErrors.length > 0 ? ': ' + realErrors[0] : '') + ')'
  );
}

// ---------------------------------------------------------------------------
// Test: Validator catches missing required field
// ---------------------------------------------------------------------------

process.stdout.write('\nValidator catches known bad input\n');

const badFlow = { screens: [] };
const flowErrors = validate(badFlow, schemas['flow-data.schema.json']);
assert(
  flowErrors.some(e => e.includes('missing required field "meta"')),
  'Detects missing required "meta" field'
);

const badFlowEmpty = { meta: { feature: 'Test' }, screens: [] };
const emptyErrors = validate(badFlowEmpty, schemas['flow-data.schema.json']);
assert(
  emptyErrors.some(e => e.includes('minimum is 1')),
  'Detects empty screens array (minItems: 1)'
);

// ---------------------------------------------------------------------------
// Test: Validator catches wrong type
// ---------------------------------------------------------------------------

const badType = { meta: 'not-an-object', screens: [{ name: 'S1', content: [] }] };
const typeErrors = validate(badType, schemas['flow-data.schema.json']);
assert(
  typeErrors.some(e => e.includes('expected object but got string')),
  'Detects wrong type (string instead of object)'
);

// ---------------------------------------------------------------------------
// Test: Validator catches invalid enum
// ---------------------------------------------------------------------------

const badEnum = {
  meta: { feature: 'Test', app: 'InvalidApp' },
  screens: [{ name: 'S1', content: [] }]
};
const enumErrors = validate(badEnum, schemas['flow-data.schema.json']);
assert(
  enumErrors.some(e => e.includes('not in enum')),
  'Detects invalid enum value'
);

// ---------------------------------------------------------------------------
// Test: Validator detects deprecated field (warning)
// ---------------------------------------------------------------------------

const deprecatedFlow = {
  meta: { feature: 'Test' },
  screens: [{ name: 'S1', content: [], chrome: 'standard' }]
};
const deprecatedErrors = validate(deprecatedFlow, schemas['flow-data.schema.json']);
assert(
  deprecatedErrors.some(e => e.includes('deprecated')),
  'Detects deprecated field as warning'
);

// ---------------------------------------------------------------------------
// Test: Validator handles $ref/$defs correctly
// ---------------------------------------------------------------------------

process.stdout.write('\nValidator handles $ref/$defs\n');

const flowWithContent = {
  meta: { feature: 'Test' },
  screens: [{
    name: 'S1',
    content: [
      { type: 'FRAME', name: 'Row', children: [
        { type: 'TEXT', content: 'Hello', font: 'Inter:Regular', size: 14, color: '#000' }
      ]},
      { type: 'DIVIDER' }
    ]
  }]
};
const refErrors = validate(flowWithContent, schemas['flow-data.schema.json']);
const refRealErrors = refErrors.filter(e => !e.includes('deprecated'));
assert(
  refRealErrors.length === 0,
  'Recursive $ref content nodes validate correctly (' + refRealErrors.length + ' errors)'
);

const badContentType = {
  meta: { feature: 'Test' },
  screens: [{
    name: 'S1',
    content: [{ type: 'INVALID_TYPE', name: 'Bad' }]
  }]
};
const badRefErrors = validate(badContentType, schemas['flow-data.schema.json']);
assert(
  badRefErrors.some(e => e.includes('not in enum')),
  'Detects invalid content node type via $ref'
);

// ---------------------------------------------------------------------------
// Test: Validator catches const mismatch
// ---------------------------------------------------------------------------

const badConst = {
  meta: { feature: 'Test', skill: 'wrong-skill' },
  screens: [{ name: 'S1', content: [] }]
};
const constErrors = validate(badConst, schemas['flow-data.schema.json']);
assert(
  constErrors.some(e => e.includes('expected const')),
  'Detects const mismatch for skill field'
);

// ---------------------------------------------------------------------------
// Test: Brief schema validates fixture
// ---------------------------------------------------------------------------

process.stdout.write('\nBrief schema specifics\n');

const badBrief = { meta: { component: 'X', skill: 'component-brief' } };
const briefErrors = validate(badBrief, schemas['brief-data.schema.json']);
assert(
  briefErrors.some(e => e.includes('missing required field "card1_header"')),
  'Brief requires card1_header'
);

// ---------------------------------------------------------------------------
// Test: Slide schema validates fixture
// ---------------------------------------------------------------------------

process.stdout.write('\nSlide schema specifics\n');

const badSlide = { meta: {}, slides: [{ type: 'cover', name: 'C' }] };
const slideErrors = validate(badSlide, schemas['slide-data.schema.json']);
assert(
  slideErrors.some(e => e.includes('missing required field "title"')),
  'Slide meta requires title'
);

const badSlideType = {
  meta: { title: 'T' },
  slides: [{ type: 'invalid-type', name: 'S' }]
};
const slideTypeErrors = validate(badSlideType, schemas['slide-data.schema.json']);
assert(
  slideTypeErrors.some(e => e.includes('not in enum')),
  'Detects invalid slide type enum'
);

// ---------------------------------------------------------------------------
// Test: schema-to-docs.js produces markdown output
// ---------------------------------------------------------------------------

process.stdout.write('\nschema-to-docs produces markdown\n');

for (const file of schemaFiles) {
  const md = schemaToDocs(schemas[file]);
  assert(
    md.includes('| Field |') && md.includes('| Type |'),
    file + ' generates markdown table'
  );
  assert(
    md.split('\n').length > 5,
    file + ' markdown has substantial content (' + md.split('\n').length + ' lines)'
  );
}

// ---------------------------------------------------------------------------
// Test: CLI mode works
// ---------------------------------------------------------------------------

process.stdout.write('\nCLI mode\n');

try {
  const cliOut = execSync(
    'node ' + path.join(scriptsDir, 'validate-schema.js') + ' ' +
    path.join(fixturesDir, 'admin-dashboard.json') + ' ' +
    path.join(schemasDir, 'flow-data.schema.json'),
    { encoding: 'utf8' }
  );
  assert(cliOut.includes('Valid: 0 errors') || cliOut.includes('0 errors'), 'CLI validates flow fixture');
} catch (e) {
  // CLI exits 1 on deprecation warnings — check stderr
  const out = (e.stdout || '') + (e.stderr || '');
  assert(false, 'CLI validates flow fixture (got: ' + out.trim().substring(0, 100) + ')');
}

try {
  const cliDoc = execSync(
    'node ' + path.join(scriptsDir, 'schema-to-docs.js') + ' ' +
    path.join(schemasDir, 'flow-data.schema.json'),
    { encoding: 'utf8' }
  );
  assert(cliDoc.includes('| Field |'), 'CLI schema-to-docs produces markdown');
} catch (e) {
  assert(false, 'CLI schema-to-docs produces markdown');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

process.stdout.write('\n' + passed + ' passed, ' + failed + ' failed\n');
if (failures.length > 0) {
  process.stdout.write('Failures:\n');
  for (const f of failures) process.stdout.write('  - ' + f + '\n');
  process.exit(1);
}
