#!/usr/bin/env node
'use strict';

/**
 * schema-to-docs.js — Reads a JSON Schema file and outputs a markdown table.
 *
 * Columns: Field | Type | Required | Description
 * Handles nested properties with dot-path prefixes. Resolves $ref/$defs.
 *
 * Usage:
 *   node scripts/schema-to-docs.js <schema.json>
 */

const fs = require('fs');
const path = require('path');

function resolveRef(ref, root) {
  var match = ref.match(/^#\/\$defs\/(.+)$/);
  if (match && root.$defs && root.$defs[match[1]]) {
    return root.$defs[match[1]];
  }
  return null;
}

function resolveSchema(schema, root) {
  if (schema && schema.$ref) {
    return resolveRef(schema.$ref, root) || schema;
  }
  return schema;
}

function typeString(schema, root) {
  if (!schema) return '';
  var s = resolveSchema(schema, root);
  if (s.const) return JSON.stringify(s.const);
  if (s.enum) return s.enum.join(' \\| ');
  if (s.type) {
    if (Array.isArray(s.type)) return s.type.join(' \\| ');
    return s.type;
  }
  return 'any';
}

function collectFields(schema, root, prefix, requiredSet, rows, seen) {
  if (!schema || typeof schema !== 'object') return;

  var resolved = resolveSchema(schema, root);
  if (!resolved) return;

  // Prevent infinite recursion for recursive $ref
  var key = prefix + '::' + (schema.$ref || '');
  if (seen && seen[key]) return;
  if (!seen) seen = {};
  seen[key] = true;

  var req = resolved.required || [];
  var props = resolved.properties || {};
  var keys = Object.keys(props);

  for (var i = 0; i < keys.length; i++) {
    var name = keys[i];
    var sub = resolveSchema(props[name], root);
    var fieldPath = prefix ? prefix + '.' + name : name;
    var isRequired = requiredSet ? requiredSet.indexOf(name) !== -1 : req.indexOf(name) !== -1;
    var desc = (sub && sub.description) || '';
    if (sub && sub.deprecated) desc = '**DEPRECATED.** ' + desc;

    rows.push({
      field: fieldPath,
      type: typeString(props[name], root),
      required: isRequired ? 'Yes' : 'No',
      description: desc
    });

    // Recurse into object properties
    if (sub && sub.type === 'object' && sub.properties) {
      collectFields(sub, root, fieldPath, sub.required || [], rows, seen);
    }

    // Recurse into array items if they have properties
    if (sub && sub.type === 'array' && sub.items) {
      var itemRef = (props[name].items && props[name].items.$ref) || (sub.items && sub.items.$ref) || '';
      var itemSchema = resolveSchema(sub.items, root);
      if (itemSchema && itemSchema.type === 'object' && itemSchema.properties) {
        // Skip if this $ref was already visited (recursive schemas)
        if (!itemRef || !seen[itemRef]) {
          if (itemRef) seen[itemRef] = true;
          collectFields(itemSchema, root, fieldPath + '[]', itemSchema.required || [], rows, seen);
        }
      }
    }
  }
}

function generateMarkdown(schema) {
  var rows = [];
  collectFields(schema, schema, '', schema.required || [], rows, {});

  var lines = [];
  lines.push('# ' + (schema.title || 'Schema') + '\n');
  if (schema.description) lines.push(schema.description + '\n');
  lines.push('| Field | Type | Required | Description |');
  lines.push('|-------|------|----------|-------------|');

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    lines.push('| `' + r.field + '` | ' + r.type + ' | ' + r.required + ' | ' + r.description + ' |');
  }

  return lines.join('\n') + '\n';
}

module.exports = generateMarkdown;

// CLI mode
if (require.main === module) {
  if (process.argv.length < 3) {
    process.stderr.write('Usage: node schema-to-docs.js <schema.json>\n');
    process.exit(1);
  }

  var schemaPath = path.resolve(process.argv[2]);
  var schema;
  try { schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')); }
  catch (e) { process.stderr.write('Error reading schema: ' + e.message + '\n'); process.exit(1); }

  process.stdout.write(generateMarkdown(schema));
}
