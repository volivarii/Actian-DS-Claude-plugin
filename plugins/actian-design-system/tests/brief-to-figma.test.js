#!/usr/bin/env node
'use strict';

/**
 * brief-to-figma.test.js — Tests for brief-to-figma.js
 *
 * Run with: node tests/brief-to-figma.test.js
 * (from the plugins/actian-design-system directory)
 */

const { execSync } = require('child_process');
const path = require('path');

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
    process.stdout.write('  \u2717 FAIL: ' + message + '\n');
  }
}

function assertContains(str, substr, message) {
  assert(
    typeof str === 'string' && str.indexOf(substr) !== -1,
    message + ' (expected to contain: ' + JSON.stringify(substr) + ')'
  );
}

function assertNotContains(str, substr, message) {
  assert(
    typeof str === 'string' && str.indexOf(substr) === -1,
    message + ' (expected NOT to contain: ' + JSON.stringify(substr) + ')'
  );
}

function section(name) {
  process.stdout.write('\n' + name + '\n');
}

// ---------------------------------------------------------------------------
// Run the script and capture output
// ---------------------------------------------------------------------------

const SCRIPT = path.join(__dirname, '..', 'scripts', 'brief-to-figma.js');
const FIXTURE = path.join(__dirname, 'fixtures', 'button-brief-data.json');
const TARGET_NODE_ID = '288:7646';

let stdout;
let stderr;
let result;

try {
  const out = execSync(
    'node "' + SCRIPT + '" "' + FIXTURE + '" --target-node-id "' + TARGET_NODE_ID + '"',
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  );
  stdout = out;
  stderr = '';
} catch (e) {
  stdout = e.stdout || '';
  stderr = e.stderr || '';
  process.stderr.write('Script threw error:\n' + stderr + '\n');
}

try {
  result = JSON.parse(stdout);
} catch (e) {
  process.stderr.write('Failed to parse stdout as JSON: ' + e.message + '\n');
  process.stderr.write('stdout preview: ' + stdout.substring(0, 500) + '\n');
  result = null;
}

// ---------------------------------------------------------------------------
// Test 1: Script produces valid JSON array output
// ---------------------------------------------------------------------------

section('Test 1: Script produces valid JSON array output');

assert(Array.isArray(result), 'Output is a JSON array');
assert(result !== null && result.length > 0, 'Array has at least one element');

if (Array.isArray(result) && result.length > 0) {
  assert(
    typeof result[0].callIndex === 'number',
    'Each element has a callIndex number'
  );
  assert(
    typeof result[0].code === 'string',
    'Each element has a code string'
  );
  assert(
    typeof result[0].description === 'string',
    'Each element has a description string'
  );
}

// ---------------------------------------------------------------------------
// Test 2: All calls have code under 100KB ceiling
// ---------------------------------------------------------------------------

section('Test 2: All calls have code within size limits');

if (Array.isArray(result)) {
  const MAX_CODE_BYTES = 100 * 1024; // 100KB hard ceiling
  let allUnder = true;
  for (const call of result) {
    const sz = Buffer.byteLength(call.code, 'utf8');
    if (sz > MAX_CODE_BYTES) {
      allUnder = false;
      process.stdout.write('    Call ' + call.callIndex + ': ' + sz + ' bytes (exceeds 100KB limit)\n');
    }
  }
  assert(allUnder, 'All calls have code under 100KB');
}

// ---------------------------------------------------------------------------
// Test 3: Call 1 creates wrapper + section
// ---------------------------------------------------------------------------

section('Test 3: Call 1 creates wrapper + section');

if (Array.isArray(result) && result.length > 0) {
  const call1Code = result[0].code;
  assertContains(call1Code, 'figma.createSection()', 'Call 1 creates a section');
  assertContains(call1Code, '_wrapper = figma.createFrame()', 'Call 1 creates wrapper frame');
  assertContains(call1Code, TARGET_NODE_ID, 'Call 1 has correct targetNodeId');
}

// ---------------------------------------------------------------------------
// Test 4: Call 2+ uses __WRAPPER_ID__ placeholder, no section creation
// ---------------------------------------------------------------------------

section('Test 4: Call 2+ uses __WRAPPER_ID__ placeholder');

if (Array.isArray(result) && result.length > 1) {
  for (let i = 1; i < result.length; i++) {
    const callCode = result[i].code;
    assertContains(
      callCode,
      '__WRAPPER_ID__',
      'Call ' + (i + 1) + ' uses __WRAPPER_ID__ placeholder'
    );
    assertNotContains(
      callCode,
      'figma.createSection()',
      'Call ' + (i + 1) + ' does not create a section'
    );
  }
}

// ---------------------------------------------------------------------------
// Test 5: Local component import code is generated (localComponents)
// ---------------------------------------------------------------------------

section('Test 5: Local component import code is generated');

if (Array.isArray(result)) {
  const allCode = result.map(c => c.code).join('\n');

  assertContains(
    allCode,
    '_local_targetComponent',
    'Local component variable _local_targetComponent appears in code'
  );
  assertContains(
    allCode,
    "figma.getNodeByIdAsync('123:456')",
    'getNodeByIdAsync called with the componentKey nodeId'
  );
  assertContains(
    allCode,
    '// Load local components by node ID',
    'Local components section comment is present'
  );
}

// ---------------------------------------------------------------------------
// Test 6: LOCAL_INSTANCE nodes use _local_ prefix (not _imp_)
// ---------------------------------------------------------------------------

section('Test 6: LOCAL_INSTANCE nodes use _local_ prefix');

if (Array.isArray(result)) {
  const allCode = result.map(c => c.code).join('\n');

  assertContains(
    allCode,
    'var _cs = _local_targetComponent',
    'LOCAL_INSTANCE references _local_targetComponent'
  );
  assertNotContains(
    allCode,
    '_imp_targetComponent',
    'LOCAL_INSTANCE does not use _imp_ prefix'
  );
}

// ---------------------------------------------------------------------------
// Test 7: All standard imports are present in call 1
// ---------------------------------------------------------------------------

section('Test 7: Standard component imports are present in call 1');

if (Array.isArray(result) && result.length > 0) {
  const call1Code = result[0].code;

  assertContains(call1Code, '_imp_briefCard', 'briefCard is imported in call 1');
  assertContains(call1Code, '_imp_genLog', 'genLog is imported in call 1');
  assertContains(call1Code, '_imp_doDontPair', 'doDontPair is imported in call 1');
  assertContains(call1Code, '_imp_colorSwatch', 'colorSwatch is imported in call 1');
  assertContains(call1Code, '_imp_a11yCard', 'a11yCard is imported in call 1');
  assertContains(call1Code, '_imp_codeBlock', 'codeBlock is imported in call 1');
}

// ---------------------------------------------------------------------------
// Test 8: Generation Log and key cards appear in output
// ---------------------------------------------------------------------------

section('Test 8: Generation Log and key cards appear in output');

if (Array.isArray(result)) {
  const allCode = result.map(c => c.code).join('\n');

  assertContains(allCode, 'Generation Log', 'Generation Log card is present');
  assertContains(allCode, 'component-brief', 'skill metadata set to component-brief');
  assertContains(allCode, 'Actual component', 'Card 2 (Actual component) is present');
  assertContains(allCode, 'Anatomy', 'Card 3 (Anatomy) is present');
  assertContains(allCode, 'Design tokens', 'Card 4 (Design tokens) is present');
  assertContains(allCode, 'Component API', 'Card 5 (Component API) is present');
  assertContains(allCode, 'Usage guidelines', 'Card 6 (Usage guidelines) is present');
  assertContains(allCode, 'Content guidelines', 'Card 7 (Content guidelines) is present');
  assertContains(allCode, 'Accessibility', 'Card 8 (Accessibility) is present');
  assertContains(allCode, 'Code specification', 'Card 9 (Code specification) is present');
}

// ---------------------------------------------------------------------------
// Test 9: variables and styles imports would be emitted when present
// ---------------------------------------------------------------------------

section('Test 9: codegen handles localComponents section block in output');

// Verify the codegen correctly emits local component section header
if (Array.isArray(result)) {
  const call1Code = result[0].code;
  assertContains(
    call1Code,
    '// Load local components by node ID',
    'Local components comment block is emitted'
  );
  // Verify variables/styles section comments would appear if spec had them
  // (we test this by checking they are NOT present since our fixture has none)
  assertNotContains(
    call1Code,
    '// Import variables',
    'No variables section when spec has no variables'
  );
  assertNotContains(
    call1Code,
    '// Import styles',
    'No styles section when spec has no styles'
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

process.stdout.write('\n');
process.stdout.write('Results: ' + passed + ' passed, ' + failed + ' failed\n');

if (failures.length > 0) {
  process.stdout.write('\nFailed:\n');
  for (const f of failures) {
    process.stdout.write('  - ' + f + '\n');
  }
  process.exit(1);
} else {
  process.stdout.write('All tests passed.\n');
}
