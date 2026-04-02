#!/usr/bin/env node
'use strict';

/**
 * validate-schema.js — Lightweight JSON Schema validator (no npm deps).
 *
 * Supports: type, required, properties, enum, const, minItems, items,
 *           $ref/$defs, deprecated (warning, not error).
 *
 * Usage as module:
 *   const validate = require('./validate-schema');
 *   const errors = validate(data, schema);
 *
 * Usage as CLI:
 *   node validate-schema.js <data.json> <schema.json>
 */

const fs = require('fs');
const path = require('path');

function validate(data, schema, _rootSchema, _path) {
  const root = _rootSchema || schema;
  const p = _path || '';
  const errors = [];

  if (!schema || typeof schema !== 'object') return errors;

  // Resolve $ref
  if (schema.$ref) {
    const refPath = schema.$ref;
    const match = refPath.match(/^#\/\$defs\/(.+)$/);
    if (match && root.$defs && root.$defs[match[1]]) {
      return validate(data, root.$defs[match[1]], root, p);
    }
    errors.push(p + ': unresolved $ref ' + refPath);
    return errors;
  }

  // deprecated — warn but don't error
  if (schema.deprecated && data !== undefined && data !== null) {
    errors.push(p + ': deprecated field is present (warning)');
  }

  if (data === undefined || data === null) {
    // null/undefined — only fail if there's a type constraint that excludes null
    if (schema.type && data === null) {
      var types = Array.isArray(schema.type) ? schema.type : [schema.type];
      if (types.indexOf('null') === -1) {
        errors.push((p || '/') + ': expected ' + types.join('|') + ' but got null');
      }
    }
    return errors;
  }

  // const
  if (schema.const !== undefined) {
    if (data !== schema.const) {
      errors.push((p || '/') + ': expected const ' + JSON.stringify(schema.const) + ' but got ' + JSON.stringify(data));
    }
  }

  // enum
  if (schema.enum) {
    if (schema.enum.indexOf(data) === -1) {
      errors.push((p || '/') + ': value ' + JSON.stringify(data) + ' not in enum [' + schema.enum.join(', ') + ']');
    }
  }

  // type check
  if (schema.type) {
    var types = Array.isArray(schema.type) ? schema.type : [schema.type];
    var actual = Array.isArray(data) ? 'array' : typeof data;
    if (actual === 'number' && types.indexOf('integer') !== -1 && Number.isInteger(data)) {
      // integer matches
    } else if (types.indexOf(actual) === -1) {
      // Allow integer to match number
      if (!(actual === 'number' && types.indexOf('integer') !== -1)) {
        errors.push((p || '/') + ': expected ' + types.join('|') + ' but got ' + actual);
        return errors; // stop descending on type mismatch
      }
    }
  }

  // object properties + required
  if (typeof data === 'object' && !Array.isArray(data)) {
    if (schema.required) {
      for (var i = 0; i < schema.required.length; i++) {
        if (data[schema.required[i]] === undefined) {
          errors.push((p || '/') + ': missing required field "' + schema.required[i] + '"');
        }
      }
    }
    if (schema.properties) {
      var keys = Object.keys(data);
      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        if (schema.properties[key]) {
          var sub = validate(data[key], schema.properties[key], root, p + '/' + key);
          for (var j = 0; j < sub.length; j++) errors.push(sub[j]);
        }
      }
    }
  }

  // array items + minItems
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push((p || '/') + ': array has ' + data.length + ' items, minimum is ' + schema.minItems);
    }
    if (schema.items) {
      for (var i = 0; i < data.length; i++) {
        var sub = validate(data[i], schema.items, root, p + '/[' + i + ']');
        for (var j = 0; j < sub.length; j++) errors.push(sub[j]);
      }
    }
  }

  return errors;
}

module.exports = validate;

// CLI mode
if (require.main === module) {
  if (process.argv.length < 4) {
    process.stderr.write('Usage: node validate-schema.js <data.json> <schema.json>\n');
    process.exit(1);
  }

  var dataPath = path.resolve(process.argv[2]);
  var schemaPath = path.resolve(process.argv[3]);

  var data, schema;
  try { data = JSON.parse(fs.readFileSync(dataPath, 'utf8')); }
  catch (e) { process.stderr.write('Error reading data: ' + e.message + '\n'); process.exit(1); }
  try { schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')); }
  catch (e) { process.stderr.write('Error reading schema: ' + e.message + '\n'); process.exit(1); }

  var errors = validate(data, schema);
  var warnings = errors.filter(function(e) { return e.indexOf('deprecated') !== -1 || e.indexOf('warning') !== -1; });
  var realErrors = errors.filter(function(e) { return e.indexOf('deprecated') === -1 && e.indexOf('warning') === -1; });

  for (var i = 0; i < warnings.length; i++) {
    process.stderr.write('  WARNING: ' + warnings[i] + '\n');
  }

  if (realErrors.length === 0) {
    process.stdout.write('Valid: 0 errors' + (warnings.length > 0 ? ' (' + warnings.length + ' warnings)' : '') + '\n');
  } else {
    for (var i = 0; i < realErrors.length; i++) {
      process.stdout.write('  ' + realErrors[i] + '\n');
    }
    process.stdout.write(realErrors.length + ' error(s)\n');
    process.exit(1);
  }
}
