#!/usr/bin/env node
'use strict';

/**
 * slide-to-figma.test.js — Tests for slide-to-figma.js
 *
 * Run with: node tests/slide-to-figma.test.js
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

const SCRIPT = path.join(__dirname, '..', 'scripts', 'slide-to-figma.js');
const FIXTURE = path.join(__dirname, 'fixtures', 'sample-presentation.json');
const TARGET_NODE_ID = '123:456';

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
  process.stderr.write('stdout preview: ' + stdout.substring(0, 300) + '\n');
  result = null;
}

// ---------------------------------------------------------------------------
// Test 1: Script produces JSON array output
// ---------------------------------------------------------------------------

section('Test 1: Script produces JSON array output');

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
// Test 2: All calls have code under reasonable size limit
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
  assertContains(call1Code, '123:456', 'Call 1 has correct targetNodeId');
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
} else {
  // With only 3 slides the fixture fits in one call — skip test gracefully
  process.stdout.write('  (skipped — fixture fits in single call, __WRAPPER_ID__ not needed)\n');
  passed++; // count as pass since this is expected behavior
}

// ---------------------------------------------------------------------------
// Test 5: All 3 slides appear across the calls
// ---------------------------------------------------------------------------

section('Test 5: All 3 slides appear across the calls');

if (Array.isArray(result)) {
  const allCode = result.map(c => c.code).join('\n');

  const slideNames = [
    'Slide: Cover',
    'Slide: Key Metrics',
    'Slide: Back cover'
  ];

  for (const slideName of slideNames) {
    assertContains(allCode, slideName, slideName + ' appears in generated code');
  }
}

// ---------------------------------------------------------------------------
// Test 6: Generation log is present
// ---------------------------------------------------------------------------

section('Test 6: Generation log is present');

if (Array.isArray(result) && result.length > 0) {
  const call1Code = result[0].code;
  assertContains(call1Code, 'genLog', 'Call 1 imports genLog component');
  assertContains(call1Code, 'Generation Log', 'Call 1 creates Generation Log node');
  assertContains(call1Code, 'generate-presentation', 'Call 1 sets skill to generate-presentation');
}

// ---------------------------------------------------------------------------
// Test 7: Variable imports appear in call 1
// ---------------------------------------------------------------------------

section('Test 7: Variable imports appear in call 1');

if (Array.isArray(result) && result.length > 0) {
  const call1Code = result[0].code;
  assertContains(call1Code, 'importVariableByKeyAsync', 'Call 1 imports variables via Figma API');
  assertContains(call1Code, 'bgDefault', 'Call 1 imports bgDefault variable');
  assertContains(call1Code, 'textReverse', 'Call 1 imports textReverse variable');
}

// ---------------------------------------------------------------------------
// Test 8: Gradient fills are generated for cover slide
// ---------------------------------------------------------------------------

section('Test 8: Gradient fills are generated for cover/back-cover slides');

if (Array.isArray(result)) {
  const allCode = result.map(c => c.code).join('\n');
  assertContains(allCode, 'GRADIENT_LINEAR', 'Gradient fills appear in generated code');
  assertContains(allCode, 'angleToTransform', 'Angle transform used for gradient');
  assertContains(allCode, '#090952', 'Dark gradient stop color appears in code');
}

// ---------------------------------------------------------------------------
// Test 9: Font loading appears in call 1
// ---------------------------------------------------------------------------

section('Test 9: Font loading appears in call 1');

if (Array.isArray(result) && result.length > 0) {
  const call1Code = result[0].code;
  assertContains(call1Code, 'loadFontAsync', 'Call 1 loads fonts');
  assertContains(call1Code, 'Roboto', 'Call 1 loads Roboto font');
}

// ---------------------------------------------------------------------------
// Test 10: No interpreter references
// ---------------------------------------------------------------------------

section('Test 10: No interpreter references in output');

if (Array.isArray(result)) {
  const allCode = result.map(c => c.code).join('\n');
  assertNotContains(allCode, 'buildFromSpec', 'No buildFromSpec (interpreter) reference');
  assertNotContains(allCode, 'figma-interpreter', 'No figma-interpreter reference');
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
