#!/usr/bin/env node
'use strict';

/**
 * snapshot.test.js — Snapshot test for CLAUDE.md gate table.
 *
 * This is the only snapshot that isn't covered by contract tests.
 * Template keys, CLI flags, and type names are all verified by
 * contract.test.js and --help output — snapshots were redundant.
 *
 * First run:  creates .snap file, test PASSES
 * Later runs: compares against .snap file, FAIL with diff if changed
 * To update:  delete tests/snapshots/gate-table.snap and rerun
 *
 * Run with: node tests/snapshot.test.js
 */

var { describe, it } = require('node:test');
var assert = require('node:assert');
var fs = require('fs');
var path = require('path');

var PLUGIN_ROOT = path.resolve(__dirname, '..');
var SNAP_DIR = path.join(__dirname, 'snapshots');

if (!fs.existsSync(SNAP_DIR)) {
  fs.mkdirSync(SNAP_DIR, { recursive: true });
}

function checkSnapshot(snapFile, actual) {
  var snapPath = path.join(SNAP_DIR, snapFile);
  var actualStr = typeof actual === 'string' ? actual : JSON.stringify(actual, null, 2);

  if (!fs.existsSync(snapPath)) {
    fs.writeFileSync(snapPath, actualStr, 'utf8');
    return { created: true };
  }

  var expected = fs.readFileSync(snapPath, 'utf8');
  if (actualStr === expected) return { match: true };

  return {
    mismatch: true,
    diff: 'Snapshot mismatch. If intentional, delete tests/snapshots/' + snapFile + ' and rerun.'
  };
}

describe('CLAUDE.md gate table snapshot', function() {
  it('gate table matches snapshot', function() {
    var claudeMd = fs.readFileSync(path.join(PLUGIN_ROOT, 'CLAUDE.md'), 'utf8');
    var gateMatch = claudeMd.match(/## Skill Review Gates\n([\s\S]*?)(?=\n---|\n## )/);
    var gateTable = gateMatch ? gateMatch[0].trim() : '';

    assert.ok(gateTable.length > 0, 'gate table extracted from CLAUDE.md');

    var result = checkSnapshot('gate-table.snap', gateTable);
    if (result.mismatch) {
      assert.fail(result.diff);
    }
  });
});
