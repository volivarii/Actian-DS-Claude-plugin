#!/usr/bin/env node
"use strict";

/**
 * validate-schema.js — Lightweight JSON Schema validator (no npm deps).
 *
 * Supports: type, required, properties, enum, const, pattern, minItems,
 *           items, $ref/$defs, deprecated (warning, not error).
 *
 * Usage as module:
 *   const validate = require('./validate-schema');
 *   const errors = validate(data, schema);
 *
 * Usage as CLI:
 *   node validate-schema.js <data.json> <schema.json>
 */

const fs = require("fs");
const path = require("path");

function validate(data, schema, _rootSchema, _path) {
  const root = _rootSchema || schema;
  const p = _path || "";
  const errors = [];

  if (!schema || typeof schema !== "object") return errors;

  // Resolve $ref
  if (schema.$ref) {
    const refPath = schema.$ref;
    const match = refPath.match(/^#\/\$defs\/(.+)$/);
    if (match && root.$defs && root.$defs[match[1]]) {
      return validate(data, root.$defs[match[1]], root, p);
    }
    errors.push(p + ": unresolved $ref " + refPath);
    return errors;
  }

  // deprecated — warn but don't error
  if (schema.deprecated && data !== undefined && data !== null) {
    errors.push(p + ": deprecated field is present (warning)");
  }

  if (data === undefined || data === null) {
    // null/undefined — only fail if there's a type constraint that excludes null
    if (schema.type && data === null) {
      var types = Array.isArray(schema.type) ? schema.type : [schema.type];
      if (types.indexOf("null") === -1) {
        errors.push(
          (p || "/") + ": expected " + types.join("|") + " but got null",
        );
      }
    }
    return errors;
  }

  // const
  if (schema.const !== undefined) {
    if (data !== schema.const) {
      errors.push(
        (p || "/") +
          ": expected const " +
          JSON.stringify(schema.const) +
          " but got " +
          JSON.stringify(data),
      );
    }
  }

  // enum
  if (schema.enum) {
    if (schema.enum.indexOf(data) === -1) {
      errors.push(
        (p || "/") +
          ": value " +
          JSON.stringify(data) +
          " not in enum [" +
          schema.enum.join(", ") +
          "]",
      );
    }
  }

  // pattern (string-only, anchored regex)
  if (typeof schema.pattern === "string" && typeof data === "string") {
    if (!new RegExp(schema.pattern).test(data)) {
      errors.push(
        (p || "/") +
          ": value " +
          JSON.stringify(data) +
          " does not match pattern /" +
          schema.pattern +
          "/",
      );
    }
  }

  // type check
  if (schema.type) {
    var types = Array.isArray(schema.type) ? schema.type : [schema.type];
    var actual = Array.isArray(data) ? "array" : typeof data;
    if (
      actual === "number" &&
      types.indexOf("integer") !== -1 &&
      Number.isInteger(data)
    ) {
      // integer matches
    } else if (types.indexOf(actual) === -1) {
      // Allow integer to match number
      if (!(actual === "number" && types.indexOf("integer") !== -1)) {
        errors.push(
          (p || "/") + ": expected " + types.join("|") + " but got " + actual,
        );
        return errors; // stop descending on type mismatch
      }
    }
  }

  // object properties + required
  if (typeof data === "object" && !Array.isArray(data)) {
    if (schema.required) {
      for (var i = 0; i < schema.required.length; i++) {
        if (data[schema.required[i]] === undefined) {
          errors.push(
            (p || "/") +
              ': missing required field "' +
              schema.required[i] +
              '"',
          );
        }
      }
    }
    if (schema.properties) {
      var keys = Object.keys(data);
      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        if (schema.properties[key]) {
          var sub = validate(
            data[key],
            schema.properties[key],
            root,
            p + "/" + key,
          );
          for (var j = 0; j < sub.length; j++) errors.push(sub[j]);
        }
      }
    }
  }

  // array items + minItems
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push(
        (p || "/") +
          ": array has " +
          data.length +
          " items, minimum is " +
          schema.minItems,
      );
    }
    if (schema.items) {
      for (var i = 0; i < data.length; i++) {
        var sub = validate(data[i], schema.items, root, p + "/[" + i + "]");
        for (var j = 0; j < sub.length; j++) errors.push(sub[j]);
      }
    }
  }

  return errors;
}

module.exports = validate;

// ---------------------------------------------------------------------------
// validateBriefData — Sub-project B _source contract enforcer
//
// Checks every card_ key in a brief data object for:
//   1. missing-source-field   — card object has no _source property
//   2. invalid-source-value   — _source is not 'figma' or 'generated'
//   3. empty-figma-source     — figma-sourced card has empty content + no _fallback
//   4. forbidden-card-key     — retired card keys (card_api, card_code, card_states)
//   5. fallback-without-reason — _fallback: true with no _fallbackReason
//
// Returns: { findings: Array<{ kind, severity, card, message }> }
// ---------------------------------------------------------------------------

var BRIEF_VALID_SOURCES = ["figma", "generated"];
var BRIEF_FORBIDDEN_KEYS = ["card_api", "card_code", "card_states"];
// Brief slot identifiers. F2 (knowledge 0.22.0) renamed the 6 domain slots
// to drop the card_ prefix; card_header + card_content stay card-prefixed
// because they describe brief card UI structure rather than domain data.
var BRIEF_SLOT_KEYS = [
  "card_header",
  "card_content",
  "anatomy",
  "variants",
  "motion",
  "accessibility",
  "tokens",
  "usage",
];

function validateBriefData(data) {
  var findings = [];
  if (!data || typeof data !== "object") {
    findings.push({
      kind: "invalid-data",
      severity: "error",
      message: "data must be an object",
    });
    return { findings: findings };
  }
  var keys = Object.keys(data);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    // Forbidden keys still validate as a finding (so callers see the retired
    // key surfaced); everything else not in the BRIEF_SLOT_KEYS allowlist
    // is skipped.
    if (
      BRIEF_SLOT_KEYS.indexOf(k) === -1 &&
      BRIEF_FORBIDDEN_KEYS.indexOf(k) === -1
    )
      continue;
    var card = data[k];
    if (!card || typeof card !== "object") continue;

    if (BRIEF_FORBIDDEN_KEYS.indexOf(k) !== -1) {
      findings.push({
        kind: "forbidden-card-key",
        severity: "error",
        card: k,
        message: k + " was retired in sub-project B",
      });
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(card, "_source")) {
      findings.push({
        kind: "missing-source-field",
        severity: "error",
        card: k,
        message: "card object must have _source field",
      });
      continue;
    }

    if (BRIEF_VALID_SOURCES.indexOf(card._source) === -1) {
      findings.push({
        kind: "invalid-source-value",
        severity: "error",
        card: k,
        message: "_source must be 'figma' or 'generated', got: " + card._source,
      });
    }

    if (card._fallback === true && !card._fallbackReason) {
      findings.push({
        kind: "fallback-without-reason",
        severity: "warning",
        card: k,
        message: "_fallback: true requires _fallbackReason",
      });
    }

    // Empty-content check for figma-sourced transcribe cards
    if (card._source === "figma" && card._fallback !== true) {
      if (
        k === "card_header" &&
        (!card.description || String(card.description).trim() === "")
      ) {
        findings.push({
          kind: "empty-figma-source",
          severity: "error",
          card: k,
          message: "card_header claims figma source but description is empty",
        });
      }
      if (
        k === "card_content" &&
        (!Array.isArray(card.rules) || card.rules.length === 0) &&
        (!Array.isArray(card.terminology) || card.terminology.length === 0)
      ) {
        // A transcribed content card carries rules and/or terminology — a
        // guideline whose content is purely a terminology table has no
        // rules. Empty only when BOTH are empty.
        findings.push({
          kind: "empty-figma-source",
          severity: "error",
          card: k,
          message:
            "card_content claims figma source but both rules and terminology are empty",
        });
      }
      if (
        k === "motion" &&
        (!Array.isArray(card.phases) || card.phases.length === 0) &&
        (typeof card.overrides !== "string" || card.overrides.length === 0)
      ) {
        findings.push({
          kind: "empty-figma-source",
          severity: "error",
          card: k,
          message:
            "motion claims figma source but phases array is empty and no overrides set",
        });
      }
      if (
        k === "motion" &&
        (typeof card.patternSlug !== "string" || card.patternSlug.trim() === "")
      ) {
        findings.push({
          kind: "empty-figma-source",
          severity: "error",
          card: k,
          message:
            "motion claims figma source but patternSlug is missing or empty (recipe contract: patternSlug must match a key in foundations/dist/tokens/motion.json#patterns)",
        });
      }
    }
  }
  return { findings: findings };
}

module.exports.validateBriefData = validateBriefData;

// CLI mode
if (require.main === module) {
  if (process.argv.length < 4) {
    process.stderr.write(
      "Usage: node validate-schema.js <data.json> <schema.json>\n",
    );
    process.exit(1);
  }

  var dataPath = path.resolve(process.argv[2]);
  var schemaPath = path.resolve(process.argv[3]);

  var data, schema;
  try {
    data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch (e) {
    process.stderr.write("Error reading data: " + e.message + "\n");
    process.exit(1);
  }
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  } catch (e) {
    process.stderr.write("Error reading schema: " + e.message + "\n");
    process.exit(1);
  }

  var errors = validate(data, schema);
  var warnings = errors.filter(function (e) {
    return e.indexOf("deprecated") !== -1 || e.indexOf("warning") !== -1;
  });
  var realErrors = errors.filter(function (e) {
    return e.indexOf("deprecated") === -1 && e.indexOf("warning") === -1;
  });

  for (var i = 0; i < warnings.length; i++) {
    process.stderr.write("  WARNING: " + warnings[i] + "\n");
  }

  if (realErrors.length === 0) {
    process.stdout.write(
      "Valid: 0 errors" +
        (warnings.length > 0 ? " (" + warnings.length + " warnings)" : "") +
        "\n",
    );
  } else {
    for (var i = 0; i < realErrors.length; i++) {
      process.stdout.write("  " + realErrors[i] + "\n");
    }
    process.stdout.write(realErrors.length + " error(s)\n");
    process.exit(1);
  }
}
