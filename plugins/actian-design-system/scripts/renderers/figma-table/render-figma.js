#!/usr/bin/env node
"use strict";

/**
 * render-figma.js — Deterministic Figma Plugin API code emitter for renderTable spec.
 *
 * Phase 1 of the pattern-harness migration (per
 * docs/superpowers/specs/2026-05-07-pattern-harness-migration-design.md).
 *
 * Replaces Pattern 3 (Table Pattern) and Pattern 4 (Color Swatch Cell Pattern)
 * markdown-driven AI inlining with a deterministic interpreter. The AI emits a
 * domain-level JSON spec; this script validates it + emits the Plugin API JS
 * code that mcp_use_figma will execute. No improvisation surface.
 *
 * Usage:
 *   echo '{"schemaVersion":"2026.05",...}' | node render-figma.js [--parent-id <id>]
 *   node render-figma.js --spec spec.json --parent-id <contentSlotId>
 *
 * Output:
 *   - On success: stdout is the Plugin API JS code; stderr has manifest stats; exit 0.
 *   - On invalid spec: stdout is empty; stderr is JSON error report; exit 1.
 *
 * Multi-target sibling: render-html.js (HTML interpreter for the same spec).
 */

var fs = require("fs");
var path = require("path");

var SCRIPT_DIR = __dirname;
var SCHEMA_PATH = path.join(SCRIPT_DIR, "schemas", "render-table.json");
var PLUGIN_ROOT = path.resolve(SCRIPT_DIR, "../../..");
var TOKENS_PATH = path.join(PLUGIN_ROOT, "tokens", "actian-ds.tokens.json");

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgv(argv) {
  var args = { parentId: null, specPath: null };
  for (var i = 2; i < argv.length; i++) {
    if (argv[i] === "--parent-id") args.parentId = argv[++i];
    else if (argv[i] === "--spec") args.specPath = argv[++i];
    else if (argv[i] === "--help" || argv[i] === "-h") {
      process.stderr.write(
        "Usage: render-figma.js [--spec <file>] [--parent-id <id>]\n",
      );
      process.exit(0);
    }
  }
  return args;
}

function readSpecSync(specPath) {
  if (specPath) return fs.readFileSync(specPath, "utf8");
  // stdin
  var data = "";
  var buf = Buffer.alloc(4096);
  var fd = 0;
  while (true) {
    try {
      var n = fs.readSync(fd, buf, 0, buf.length, null);
      if (!n) break;
      data += buf.toString("utf8", 0, n);
    } catch (e) {
      if (e.code === "EAGAIN") continue;
      break;
    }
  }
  return data;
}

// ---------------------------------------------------------------------------
// Validation (JSON Schema subset — minimal hand-rolled, no ajv dep)
// ---------------------------------------------------------------------------

function loadSchema() {
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
}

function loadTokenNames() {
  if (!fs.existsSync(TOKENS_PATH)) return null;
  try {
    var doc = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
    var names = new Set();
    walkTokens(doc, "", names);
    return names;
  } catch (e) {
    return null;
  }
}

function walkTokens(node, prefix, out) {
  if (!node || typeof node !== "object") return;
  if (node.$value !== undefined && node.$type !== undefined) {
    // Leaf token. Convention: token CSS var = --zen-<dotpath-with-dashes>
    out.add("--zen-" + prefix.replace(/\./g, "-"));
    return;
  }
  for (var k in node) {
    if (k.charAt(0) === "$") continue;
    walkTokens(node[k], prefix ? prefix + "." + k : k, out);
  }
}

var CELL_TYPES = [
  "text",
  "token-pill",
  "code",
  "badge",
  "color-swatch",
  "empty",
];
var BADGE_VARIANTS = ["req", "opt", "draft", "stub", "canonical"];

// additionalProperties: false enforcement — mirrors the schema. Stray fields
// are improvisation surface; the schema bans them, the hand-rolled validator
// must too, otherwise the determinism guarantee leaks.
var SPEC_ALLOWED_KEYS = [
  "schemaVersion",
  "headers",
  "columnAlignments",
  "rows",
  "footnotes",
];
var ROW_ALLOWED_KEYS = ["cells", "footnoteRef"];
var FOOTNOTE_ALLOWED_KEYS = ["ref", "text"];
var CELL_ALLOWED_KEYS = {
  text: ["type", "value", "weight"],
  "token-pill": ["type", "value"],
  code: ["type", "value"],
  badge: ["type", "variant", "label"],
  "color-swatch": ["type", "color", "tokenName", "hex"],
  empty: ["type"],
};

function unexpectedKeys(obj, allowed) {
  var out = [];
  for (var k in obj) {
    if (
      Object.prototype.hasOwnProperty.call(obj, k) &&
      allowed.indexOf(k) === -1
    )
      out.push(k);
  }
  return out;
}

function validate(spec, tokenNames) {
  var errors = [];

  function err(path, message, suggestion) {
    errors.push({
      path: path,
      message: message,
      suggestion: suggestion || null,
    });
  }

  if (!spec || typeof spec !== "object")
    return [
      {
        path: "$",
        message: "Spec must be a JSON object",
        suggestion: "Check JSON syntax",
      },
    ];

  unexpectedKeys(spec, SPEC_ALLOWED_KEYS).forEach(function (k) {
    err(
      "$." + k,
      "Unexpected field on spec root",
      "Allowed: " + SPEC_ALLOWED_KEYS.join(", "),
    );
  });

  if (
    typeof spec.schemaVersion !== "string" ||
    !/^2026\.0[5-9]/.test(spec.schemaVersion)
  )
    err(
      "schemaVersion",
      "Required string matching ^2026\\.0[5-9]",
      'Set to "2026.05" (current schema version)',
    );

  if (!Array.isArray(spec.headers) || spec.headers.length < 1)
    err("headers", "Required non-empty string array", null);
  else
    spec.headers.forEach(function (h, i) {
      if (typeof h !== "string")
        err("headers[" + i + "]", "Must be a string", null);
    });

  if (!Array.isArray(spec.rows))
    err("rows", "Required array (may be empty)", null);
  else {
    var nCols = Array.isArray(spec.headers) ? spec.headers.length : 0;
    spec.rows.forEach(function (row, r) {
      if (!row || typeof row !== "object" || !Array.isArray(row.cells)) {
        err("rows[" + r + "]", "Required object with .cells array", null);
        return;
      }
      unexpectedKeys(row, ROW_ALLOWED_KEYS).forEach(function (k) {
        err(
          "rows[" + r + "]." + k,
          "Unexpected field on row",
          "Allowed: " + ROW_ALLOWED_KEYS.join(", "),
        );
      });
      if (row.cells.length !== nCols)
        err(
          "rows[" + r + "].cells",
          "Cell count " + row.cells.length + " ≠ headers count " + nCols,
          "Add missing cells (use {type: 'empty'} for blanks) or trim",
        );
      row.cells.forEach(function (cell, c) {
        validateCell(cell, "rows[" + r + "].cells[" + c + "]", tokenNames, err);
      });
      if (row.footnoteRef !== undefined && typeof row.footnoteRef !== "string")
        err("rows[" + r + "].footnoteRef", "Must be a string if present", null);
    });
  }

  if (spec.columnAlignments) {
    if (!Array.isArray(spec.columnAlignments))
      err("columnAlignments", "Must be an array if present", null);
    else
      spec.columnAlignments.forEach(function (a, i) {
        if (a !== "left" && a !== "center" && a !== "right")
          err("columnAlignments[" + i + "]", "Must be left|center|right", null);
      });
  }

  // Footnotes shape — required by spec when present.
  var definedFootnoteRefs = new Set();
  if (spec.footnotes !== undefined) {
    if (!Array.isArray(spec.footnotes))
      err("footnotes", "Must be an array if present", null);
    else
      spec.footnotes.forEach(function (fn, i) {
        if (!fn || typeof fn !== "object") {
          err("footnotes[" + i + "]", "Must be an object", null);
          return;
        }
        unexpectedKeys(fn, FOOTNOTE_ALLOWED_KEYS).forEach(function (k) {
          err(
            "footnotes[" + i + "]." + k,
            "Unexpected field on footnote",
            "Allowed: " + FOOTNOTE_ALLOWED_KEYS.join(", "),
          );
        });
        if (typeof fn.ref !== "string")
          err("footnotes[" + i + "].ref", "Required string", null);
        else definedFootnoteRefs.add(fn.ref);
        if (typeof fn.text !== "string")
          err("footnotes[" + i + "].text", "Required string", null);
      });
  }

  // Cross-reference: every row.footnoteRef must resolve to a footnotes[] entry.
  // A dangling ref renders as a superscript pointing nowhere — silent UX bug.
  if (Array.isArray(spec.rows)) {
    spec.rows.forEach(function (row, r) {
      if (
        row &&
        typeof row === "object" &&
        typeof row.footnoteRef === "string" &&
        !definedFootnoteRefs.has(row.footnoteRef)
      )
        err(
          "rows[" + r + "].footnoteRef",
          'Footnote ref "' + row.footnoteRef + '" not defined in footnotes[]',
          "Add a footnotes[] entry with matching ref, or remove the row.footnoteRef",
        );
    });
  }

  return errors;
}

function validateCell(cell, p, tokenNames, err) {
  if (!cell || typeof cell !== "object")
    return err(p, "Cell must be an object with a .type field", null);
  if (CELL_TYPES.indexOf(cell.type) === -1)
    return err(p + ".type", "Must be one of: " + CELL_TYPES.join(", "), null);

  var allowed = CELL_ALLOWED_KEYS[cell.type];
  unexpectedKeys(cell, allowed).forEach(function (k) {
    err(
      p + "." + k,
      "Unexpected field on " + cell.type + " cell",
      "Allowed: " + allowed.join(", "),
    );
  });

  switch (cell.type) {
    case "text":
      if (typeof cell.value !== "string")
        err(p + ".value", "Required string", null);
      if (
        cell.weight &&
        cell.weight !== "regular" &&
        cell.weight !== "semibold"
      )
        err(p + ".weight", "Must be regular|semibold", null);
      break;
    case "token-pill":
      if (typeof cell.value !== "string")
        err(p + ".value", "Required string", null);
      else if (!/^--zen-/.test(cell.value))
        err(
          p + ".value",
          "Must start with '--zen-'",
          "Use the CSS variable form, e.g. --zen-spacing-lg",
        );
      else if (tokenNames && !tokenNames.has(cell.value))
        err(
          p + ".value",
          "Token '" + cell.value + "' not found in registry",
          "Check tokens/actian-ds.tokens.json — possible typo or missing token",
        );
      break;
    case "code":
      if (typeof cell.value !== "string")
        err(p + ".value", "Required string", null);
      break;
    case "badge":
      if (BADGE_VARIANTS.indexOf(cell.variant) === -1)
        err(
          p + ".variant",
          "Must be one of: " + BADGE_VARIANTS.join(", "),
          null,
        );
      if (cell.label && typeof cell.label !== "string")
        err(p + ".label", "Must be a string if present", null);
      break;
    case "color-swatch":
      if (!/^#[0-9A-Fa-f]{6}$/.test(cell.color || ""))
        err(p + ".color", "Required hex color #RRGGBB", null);
      if (cell.tokenName && !/^--zen-/.test(cell.tokenName))
        err(p + ".tokenName", "Must start with '--zen-' if present", null);
      else if (cell.tokenName && tokenNames && !tokenNames.has(cell.tokenName))
        err(
          p + ".tokenName",
          "Token '" + cell.tokenName + "' not found in registry",
          null,
        );
      if (cell.hex && !/^#[0-9A-Fa-f]{6}$/.test(cell.hex))
        err(p + ".hex", "Must be hex color #RRGGBB if present", null);
      break;
    case "empty":
      // No further validation
      break;
  }
}

// ---------------------------------------------------------------------------
// Code emitter (deterministic Figma Plugin API output)
// ---------------------------------------------------------------------------

/**
 * Color constants — mirrors Pattern 3/4 styling. Centralized here so the
 * interpreter, not the AI, decides token-pill bg/fg, header row fill, etc.
 */
var STYLE = {
  HEADER_FILL: "#F5F5FA",
  HEADER_TEXT: "#595968",
  TOKEN_PILL_BG: "#F0F2FA",
  TOKEN_PILL_FG: "#0550DC",
  CODE_BG: "#F5F5FA",
  CODE_FG: "#1A1A2E",
  TEXT_DEFAULT: "#1A1A2E",
  BADGE_REQ_BG: "#FFE5EC",
  BADGE_REQ_FG: "#B71540",
  BADGE_OPT_BG: "#F5F5FA",
  BADGE_OPT_FG: "#595968",
  BADGE_DRAFT_BG: "#FFF4DB",
  BADGE_DRAFT_FG: "#7A4F01",
  BADGE_STUB_BG: "#F5F5FA",
  BADGE_STUB_FG: "#595968",
  BADGE_CANONICAL_BG: "#E0F5E5",
  BADGE_CANONICAL_FG: "#0E5C24",
  COLOR_SWATCH_BORDER: "#D1D5DB",
};

function hexLit(hex) {
  // Outputs a JS expression: hexToRgb("#xxx")
  return 'hexToRgb("' + hex + '")';
}

function jsString(s) {
  return JSON.stringify(s);
}

function emit(spec, parentIdPlaceholder) {
  var parentId = parentIdPlaceholder || "<contentSlotId>";
  var lines = [];
  var stats = { rowsEmitted: 0, cellsByType: {} };

  CELL_TYPES.forEach(function (t) {
    stats.cellsByType[t] = 0;
  });

  // Header / utility — emitted once
  lines.push(
    "// renderTable — deterministic emit (schema " + spec.schemaVersion + ")",
  );
  lines.push(
    'await figma.loadFontAsync({ family: "Inter", style: "Regular" });',
  );
  lines.push(
    'await figma.loadFontAsync({ family: "Inter", style: "Medium" });',
  );
  lines.push(
    'await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });',
  );
  if (spec.rows.some(rowHasCellType(spec, "code")))
    lines.push(
      'await figma.loadFontAsync({ family: "Fira Code", style: "Regular" });',
    );
  lines.push("");
  lines.push("function hexToRgb(hex) {");
  lines.push('  var h = hex.replace("#", "");');
  lines.push(
    "  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };",
  );
  lines.push("}");
  lines.push("");
  lines.push('var parent = await figma.getNodeByIdAsync("' + parentId + '");');
  lines.push("");

  // Outer table frame
  lines.push("var table = figma.createFrame();");
  lines.push('table.name = "Table (renderTable)";');
  lines.push('table.layoutMode = "VERTICAL";');
  lines.push("table.itemSpacing = 0;");
  lines.push('table.primaryAxisSizingMode = "AUTO";');
  lines.push('table.counterAxisSizingMode = "AUTO";');
  lines.push("table.fills = [];");
  lines.push("parent.appendChild(table);");
  lines.push('table.layoutSizingHorizontal = "FILL";');
  lines.push("");

  // Header row
  emitRow(
    lines,
    "header",
    spec.headers,
    /* isHeader */ true,
    spec.columnAlignments,
  );

  // Data rows
  spec.rows.forEach(function (row, idx) {
    emitDataRow(lines, "data" + idx, row, spec.columnAlignments, stats);
    stats.rowsEmitted += 1;
    if (row.footnoteRef) {
      // Append a tiny superscript text node to first cell — emit comment for now
      lines.push(
        "// row " + idx + ' has footnote ref: "' + row.footnoteRef + '"',
      );
    }
  });

  // Footnotes (if any)
  if (spec.footnotes && spec.footnotes.length) {
    lines.push("");
    lines.push("// Footnotes");
    spec.footnotes.forEach(function (fn) {
      lines.push("var footnote = figma.createText();");
      lines.push('footnote.fontName = { family: "Inter", style: "Regular" };');
      lines.push("footnote.fontSize = 11;");
      lines.push(
        'footnote.fills = [{ type: "SOLID", color: hexToRgb("#595968") }];',
      );
      lines.push(
        "footnote.characters = " + jsString(fn.ref + " " + fn.text) + ";",
      );
      lines.push("table.appendChild(footnote);");
      lines.push('footnote.layoutSizingHorizontal = "FILL";');
    });
  }

  lines.push("");
  lines.push("return { createdNodeIds: [table.id], mutatedNodeIds: [] };");

  return { code: lines.join("\n"), manifest: stats };
}

function rowHasCellType(spec, type) {
  return function (row) {
    return row.cells.some(function (c) {
      return c.type === type;
    });
  };
}

function emitRow(lines, varSuffix, headerStrings, isHeader, alignments) {
  var v = "row_" + varSuffix;
  lines.push("var " + v + " = figma.createFrame();");
  lines.push(v + '.name = "Header Row";');
  lines.push(v + '.layoutMode = "HORIZONTAL";');
  lines.push(v + ".itemSpacing = 0;");
  lines.push(
    v +
      '.fills = [{ type: "SOLID", color: ' +
      hexLit(STYLE.HEADER_FILL) +
      " }];",
  );
  lines.push(v + ".paddingTop = 8;");
  lines.push(v + ".paddingBottom = 8;");
  lines.push(v + ".paddingLeft = 12;");
  lines.push(v + ".paddingRight = 12;");
  lines.push(v + '.primaryAxisSizingMode = "AUTO";');
  lines.push(v + '.counterAxisSizingMode = "AUTO";');
  lines.push(v + '.counterAxisAlignItems = "CENTER";');
  lines.push("table.appendChild(" + v + ");");
  lines.push(v + '.layoutSizingHorizontal = "FILL";');

  headerStrings.forEach(function (h, i) {
    var cellVar = v + "_c" + i;
    lines.push("var " + cellVar + " = figma.createText();");
    lines.push(cellVar + ".characters = " + jsString(h) + ";");
    lines.push(
      cellVar + '.fontName = { family: "Inter", style: "Semi Bold" };',
    );
    lines.push(cellVar + ".fontSize = 12;");
    lines.push(
      cellVar +
        '.fills = [{ type: "SOLID", color: ' +
        hexLit(STYLE.HEADER_TEXT) +
        " }];",
    );
    lines.push(v + ".appendChild(" + cellVar + ");");
    lines.push(cellVar + '.layoutSizingHorizontal = "FILL";');
    if (alignments && alignments[i]) {
      var align =
        alignments[i] === "left"
          ? "LEFT"
          : alignments[i] === "center"
            ? "CENTER"
            : "RIGHT";
      lines.push(cellVar + ".textAlignHorizontal = " + jsString(align) + ";");
    }
  });
  lines.push("");
}

function emitDataRow(lines, varSuffix, row, alignments, stats) {
  var v = "row_" + varSuffix;
  lines.push("var " + v + " = figma.createFrame();");
  lines.push(v + '.name = "Data Row";');
  lines.push(v + '.layoutMode = "HORIZONTAL";');
  lines.push(v + ".itemSpacing = 0;");
  lines.push(v + ".fills = [];");
  lines.push(v + ".paddingTop = 8;");
  lines.push(v + ".paddingBottom = 8;");
  lines.push(v + ".paddingLeft = 12;");
  lines.push(v + ".paddingRight = 12;");
  // CRITICAL — the load-bearing fix from v1.70.4 audit. parent row HUGs its tallest child.
  lines.push(v + '.primaryAxisSizingMode = "AUTO";');
  lines.push(v + '.counterAxisSizingMode = "AUTO";');
  lines.push(v + '.counterAxisAlignItems = "CENTER";');
  lines.push("table.appendChild(" + v + ");");
  lines.push(v + '.layoutSizingHorizontal = "FILL";');

  row.cells.forEach(function (cell, i) {
    emitCell(lines, v + "_c" + i, v, cell, alignments && alignments[i]);
    stats.cellsByType[cell.type] += 1;
  });
  lines.push("");
}

function emitCell(lines, cellVar, parentVar, cell, alignment) {
  switch (cell.type) {
    case "text":
      emitTextCell(lines, cellVar, parentVar, cell, alignment);
      break;
    case "token-pill":
      emitTokenPillCell(lines, cellVar, parentVar, cell);
      break;
    case "code":
      emitCodeCell(lines, cellVar, parentVar, cell);
      break;
    case "badge":
      emitBadgeCell(lines, cellVar, parentVar, cell);
      break;
    case "color-swatch":
      emitColorSwatchCell(lines, cellVar, parentVar, cell);
      break;
    case "empty":
      emitEmptyCell(lines, cellVar, parentVar);
      break;
  }
}

function emitTextCell(lines, cellVar, parentVar, cell, alignment) {
  // Wrap text in a frame with FILL horizontal so column widths distribute evenly,
  // and HUG vertical so the row grows to fit multi-line content.
  var wrap = cellVar + "_w";
  lines.push("var " + wrap + " = figma.createFrame();");
  lines.push(wrap + '.name = "Cell — text";');
  lines.push(wrap + ".fills = [];");
  lines.push(wrap + '.layoutMode = "VERTICAL";');
  lines.push(wrap + '.primaryAxisSizingMode = "AUTO";');
  lines.push(wrap + '.counterAxisSizingMode = "AUTO";');
  lines.push(parentVar + ".appendChild(" + wrap + ");");
  lines.push(wrap + '.layoutSizingHorizontal = "FILL";');

  var weight = cell.weight === "semibold" ? "Semi Bold" : "Regular";
  lines.push("var " + cellVar + " = figma.createText();");
  lines.push(
    cellVar +
      '.fontName = { family: "Inter", style: ' +
      jsString(weight) +
      " };",
  );
  lines.push(cellVar + ".fontSize = 14;");
  lines.push(
    cellVar +
      '.fills = [{ type: "SOLID", color: ' +
      hexLit(STYLE.TEXT_DEFAULT) +
      " }];",
  );
  lines.push(cellVar + ".characters = " + jsString(cell.value) + ";");
  lines.push(wrap + ".appendChild(" + cellVar + ");");
  lines.push(cellVar + '.layoutSizingHorizontal = "FILL";');
  if (alignment) {
    var align =
      alignment === "left"
        ? "LEFT"
        : alignment === "center"
          ? "CENTER"
          : "RIGHT";
    lines.push(cellVar + ".textAlignHorizontal = " + jsString(align) + ";");
  }
}

function emitTokenPillCell(lines, cellVar, parentVar, cell) {
  // Wrap so the column width distributes; pill HUGs its content inside the wrap.
  var wrap = cellVar + "_w";
  lines.push("var " + wrap + " = figma.createFrame();");
  lines.push(wrap + '.name = "Cell — token-pill";');
  lines.push(wrap + ".fills = [];");
  lines.push(wrap + '.layoutMode = "HORIZONTAL";');
  lines.push(wrap + '.primaryAxisSizingMode = "AUTO";');
  lines.push(wrap + '.counterAxisSizingMode = "AUTO";');
  lines.push(parentVar + ".appendChild(" + wrap + ");");
  lines.push(wrap + '.layoutSizingHorizontal = "FILL";');

  var pillVar = cellVar + "_p";
  lines.push("var " + pillVar + " = figma.createFrame();");
  lines.push(pillVar + '.name = "Token: " + ' + jsString(cell.value) + ";");
  lines.push(pillVar + '.layoutMode = "HORIZONTAL";');
  lines.push(pillVar + '.primaryAxisSizingMode = "AUTO";');
  lines.push(pillVar + '.counterAxisSizingMode = "AUTO";');
  lines.push(pillVar + ".paddingLeft = 5;");
  lines.push(pillVar + ".paddingRight = 5;");
  lines.push(pillVar + ".paddingTop = 2;");
  lines.push(pillVar + ".paddingBottom = 2;");
  lines.push(pillVar + ".cornerRadius = 3;");
  lines.push(
    pillVar +
      '.fills = [{ type: "SOLID", color: ' +
      hexLit(STYLE.TOKEN_PILL_BG) +
      " }];",
  );
  lines.push("var " + cellVar + " = figma.createText();");
  lines.push(cellVar + '.fontName = { family: "Inter", style: "Medium" };');
  lines.push(cellVar + ".fontSize = 12;");
  lines.push(cellVar + ".characters = " + jsString(cell.value) + ";");
  lines.push(
    cellVar +
      '.fills = [{ type: "SOLID", color: ' +
      hexLit(STYLE.TOKEN_PILL_FG) +
      " }];",
  );
  lines.push(pillVar + ".appendChild(" + cellVar + ");");
  lines.push(wrap + ".appendChild(" + pillVar + ");");
}

function emitCodeCell(lines, cellVar, parentVar, cell) {
  var wrap = cellVar + "_w";
  lines.push("var " + wrap + " = figma.createFrame();");
  lines.push(wrap + '.name = "Cell — code";');
  lines.push(
    wrap +
      '.fills = [{ type: "SOLID", color: ' +
      hexLit(STYLE.CODE_BG) +
      " }];",
  );
  lines.push(wrap + '.layoutMode = "HORIZONTAL";');
  lines.push(wrap + ".paddingLeft = 6;");
  lines.push(wrap + ".paddingRight = 6;");
  lines.push(wrap + ".paddingTop = 2;");
  lines.push(wrap + ".paddingBottom = 2;");
  lines.push(wrap + ".cornerRadius = 3;");
  lines.push(wrap + '.primaryAxisSizingMode = "AUTO";');
  lines.push(wrap + '.counterAxisSizingMode = "AUTO";');
  lines.push(parentVar + ".appendChild(" + wrap + ");");
  lines.push(wrap + '.layoutSizingHorizontal = "FILL";');

  lines.push("var " + cellVar + " = figma.createText();");
  lines.push(
    cellVar + '.fontName = { family: "Fira Code", style: "Regular" };',
  );
  lines.push(cellVar + ".fontSize = 12;");
  lines.push(
    cellVar +
      '.fills = [{ type: "SOLID", color: ' +
      hexLit(STYLE.CODE_FG) +
      " }];",
  );
  lines.push(cellVar + ".characters = " + jsString(cell.value) + ";");
  lines.push(wrap + ".appendChild(" + cellVar + ");");
}

function emitBadgeCell(lines, cellVar, parentVar, cell) {
  var bgKey = "BADGE_" + cell.variant.toUpperCase() + "_BG";
  var fgKey = "BADGE_" + cell.variant.toUpperCase() + "_FG";
  var bg = STYLE[bgKey];
  var fg = STYLE[fgKey];
  var label = cell.label || cell.variant.toUpperCase();

  var wrap = cellVar + "_w";
  lines.push("var " + wrap + " = figma.createFrame();");
  lines.push(wrap + '.name = "Cell — badge";');
  lines.push(wrap + ".fills = [];");
  lines.push(wrap + '.layoutMode = "HORIZONTAL";');
  lines.push(wrap + '.primaryAxisSizingMode = "AUTO";');
  lines.push(wrap + '.counterAxisSizingMode = "AUTO";');
  lines.push(parentVar + ".appendChild(" + wrap + ");");
  lines.push(wrap + '.layoutSizingHorizontal = "FILL";');

  var badgeVar = cellVar + "_b";
  lines.push("var " + badgeVar + " = figma.createFrame();");
  lines.push(badgeVar + '.layoutMode = "HORIZONTAL";');
  lines.push(badgeVar + '.primaryAxisSizingMode = "AUTO";');
  lines.push(badgeVar + '.counterAxisSizingMode = "AUTO";');
  lines.push(badgeVar + ".paddingLeft = 6;");
  lines.push(badgeVar + ".paddingRight = 6;");
  lines.push(badgeVar + ".paddingTop = 2;");
  lines.push(badgeVar + ".paddingBottom = 2;");
  lines.push(badgeVar + ".cornerRadius = 3;");
  lines.push(
    badgeVar + '.fills = [{ type: "SOLID", color: ' + hexLit(bg) + " }];",
  );
  lines.push("var " + cellVar + " = figma.createText();");
  lines.push(cellVar + '.fontName = { family: "Inter", style: "Semi Bold" };');
  lines.push(cellVar + ".fontSize = 10;");
  lines.push(cellVar + ".characters = " + jsString(label) + ";");
  lines.push(
    cellVar + '.fills = [{ type: "SOLID", color: ' + hexLit(fg) + " }];",
  );
  lines.push(badgeVar + ".appendChild(" + cellVar + ");");
  lines.push(wrap + ".appendChild(" + badgeVar + ");");
}

function emitColorSwatchCell(lines, cellVar, parentVar, cell) {
  var wrap = cellVar + "_w";
  lines.push("var " + wrap + " = figma.createFrame();");
  lines.push(wrap + '.name = "Cell — color-swatch";');
  lines.push(wrap + ".fills = [];");
  lines.push(wrap + '.layoutMode = "HORIZONTAL";');
  lines.push(wrap + ".itemSpacing = 8;");
  lines.push(wrap + '.primaryAxisSizingMode = "AUTO";');
  lines.push(wrap + '.counterAxisSizingMode = "AUTO";');
  lines.push(wrap + '.counterAxisAlignItems = "CENTER";');
  lines.push(parentVar + ".appendChild(" + wrap + ");");
  lines.push(wrap + '.layoutSizingHorizontal = "FILL";');

  // Swatch dot — flat 12×12 frame (avoids dependency on Color Swatch component import,
  // which would require an importComponentSetByKeyAsync call we control internally).
  var dotVar = cellVar + "_dot";
  lines.push("var " + dotVar + " = figma.createFrame();");
  lines.push(dotVar + '.name = "Swatch dot";');
  lines.push(dotVar + ".resize(12, 12);");
  lines.push(dotVar + ".cornerRadius = 6;");
  lines.push(
    dotVar + '.fills = [{ type: "SOLID", color: ' + hexLit(cell.color) + " }];",
  );
  lines.push(
    dotVar +
      '.strokes = [{ type: "SOLID", color: ' +
      hexLit(STYLE.COLOR_SWATCH_BORDER) +
      " }];",
  );
  lines.push(dotVar + ".strokeWeight = 1;");
  lines.push(wrap + ".appendChild(" + dotVar + ");");

  // Text stack
  var stackVar = cellVar + "_stack";
  lines.push("var " + stackVar + " = figma.createFrame();");
  lines.push(stackVar + '.name = "Swatch stack";');
  lines.push(stackVar + ".fills = [];");
  lines.push(stackVar + '.layoutMode = "VERTICAL";');
  lines.push(stackVar + ".itemSpacing = 2;");
  lines.push(stackVar + '.primaryAxisSizingMode = "AUTO";');
  lines.push(stackVar + '.counterAxisSizingMode = "AUTO";');
  lines.push(wrap + ".appendChild(" + stackVar + ");");

  // Token pill (if tokenName)
  if (cell.tokenName) {
    var pillVar = cellVar + "_pill";
    lines.push("var " + pillVar + " = figma.createFrame();");
    lines.push(
      pillVar + '.name = "Token: " + ' + jsString(cell.tokenName) + ";",
    );
    lines.push(pillVar + '.layoutMode = "HORIZONTAL";');
    lines.push(pillVar + '.primaryAxisSizingMode = "AUTO";');
    lines.push(pillVar + '.counterAxisSizingMode = "AUTO";');
    lines.push(pillVar + ".paddingLeft = 5;");
    lines.push(pillVar + ".paddingRight = 5;");
    lines.push(pillVar + ".paddingTop = 2;");
    lines.push(pillVar + ".paddingBottom = 2;");
    lines.push(pillVar + ".cornerRadius = 3;");
    lines.push(
      pillVar +
        '.fills = [{ type: "SOLID", color: ' +
        hexLit(STYLE.TOKEN_PILL_BG) +
        " }];",
    );
    lines.push("var " + cellVar + "_tn = figma.createText();");
    lines.push(
      cellVar + '_tn.fontName = { family: "Inter", style: "Medium" };',
    );
    lines.push(cellVar + "_tn.fontSize = 11;");
    lines.push(
      cellVar +
        '_tn.fills = [{ type: "SOLID", color: ' +
        hexLit(STYLE.TOKEN_PILL_FG) +
        " }];",
    );
    lines.push(cellVar + "_tn.characters = " + jsString(cell.tokenName) + ";");
    lines.push(pillVar + ".appendChild(" + cellVar + "_tn);");
    lines.push(stackVar + ".appendChild(" + pillVar + ");");
  }

  // Hex value
  var hex = cell.hex || cell.color;
  var hexTextVar = cellVar + "_hx";
  lines.push("var " + hexTextVar + " = figma.createText();");
  lines.push(
    hexTextVar + '.fontName = { family: "Fira Code", style: "Regular" };',
  );
  lines.push(hexTextVar + ".fontSize = 11;");
  lines.push(
    hexTextVar +
      '.fills = [{ type: "SOLID", color: ' +
      hexLit("#595968") +
      " }];",
  );
  lines.push(hexTextVar + ".characters = " + jsString(hex) + ";");
  lines.push(stackVar + ".appendChild(" + hexTextVar + ");");

  // Assign cellVar so caller can reference it (we use the wrap as the cell handle)
  lines.push("var " + cellVar + " = " + wrap + ";  // cell handle");
}

function emitEmptyCell(lines, cellVar, parentVar) {
  lines.push("var " + cellVar + " = figma.createFrame();");
  lines.push(cellVar + '.name = "Cell — empty";');
  lines.push(cellVar + ".fills = [];");
  lines.push(cellVar + '.layoutMode = "HORIZONTAL";');
  lines.push(cellVar + '.primaryAxisSizingMode = "AUTO";');
  lines.push(cellVar + '.counterAxisSizingMode = "AUTO";');
  lines.push(parentVar + ".appendChild(" + cellVar + ");");
  lines.push(cellVar + '.layoutSizingHorizontal = "FILL";');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  var args = parseArgv(process.argv);
  var raw = readSpecSync(args.specPath);
  if (!raw || !raw.trim()) {
    process.stderr.write(
      JSON.stringify({
        ok: false,
        errors: [
          {
            path: "$",
            message: "Empty spec input — provide via stdin or --spec",
          },
        ],
      }) + "\n",
    );
    process.exit(1);
  }

  var spec;
  try {
    spec = JSON.parse(raw);
  } catch (e) {
    process.stderr.write(
      JSON.stringify({
        ok: false,
        errors: [{ path: "$", message: "JSON parse error: " + e.message }],
      }) + "\n",
    );
    process.exit(1);
  }

  var tokenNames = loadTokenNames();
  var errors = validate(spec, tokenNames);
  if (errors.length) {
    process.stderr.write(
      JSON.stringify({ ok: false, errors: errors }, null, 2) + "\n",
    );
    process.exit(1);
  }

  var result = emit(spec, args.parentId);
  process.stdout.write(result.code);
  process.stderr.write(
    JSON.stringify({ ok: true, manifest: result.manifest }, null, 2) + "\n",
  );
}

if (require.main === module) main();

// Exported for tests
module.exports = {
  validate: validate,
  emit: emit,
  loadSchema: loadSchema,
  loadTokenNames: loadTokenNames,
  CELL_TYPES: CELL_TYPES,
  BADGE_VARIANTS: BADGE_VARIANTS,
};
