#!/usr/bin/env node
"use strict";

/**
 * render-html.js — HTML interpreter for the renderTable spec.
 *
 * Sister to render-figma.js. Same spec drives both — proves the abstraction
 * stays domain-level (no Figma vocabulary leaks into the spec, otherwise the
 * HTML interpreter couldn't render it).
 *
 * Used by: brief-renderer.js for the brief HTML preview, and (eventually)
 * by the unified docs site (Ring 3 deliverable per project_federated_substrate.md).
 *
 * Usage (CLI — for tests / debugging):
 *   echo '{...spec...}' | node render-html.js
 *
 * Usage (programmatic):
 *   var renderer = require("./render-html");
 *   var html = renderer.render(spec);
 *
 * Output (CLI): HTML string to stdout, manifest to stderr; exit 0 on success.
 *               Error report (JSON) to stderr; exit 1 on invalid spec.
 */

var fs = require("fs");
var path = require("path");

var figmaModule = require(path.join(__dirname, "render-figma.js"));
var validate = figmaModule.validate;
var loadTokenNames = figmaModule.loadTokenNames;

// ---------------------------------------------------------------------------
// HTML escaping
// ---------------------------------------------------------------------------

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Cell renderers — mirror render-figma.js structure
// ---------------------------------------------------------------------------

function renderTextCell(cell, alignment) {
  var weight = cell.weight === "semibold" ? ' style="font-weight:600"' : "";
  var alignClass = alignment ? ' style="text-align:' + alignment + '"' : "";
  // Combine — emit one style attribute if both apply.
  var styles = [];
  if (cell.weight === "semibold") styles.push("font-weight:600");
  if (alignment && alignment !== "left") styles.push("text-align:" + alignment);
  var styleAttr = styles.length ? ' style="' + styles.join(";") + '"' : "";
  return '<span' + styleAttr + '>' + esc(cell.value) + "</span>";
}

function renderTokenPillCell(cell) {
  return '<span class="token-pill">' + esc(cell.value) + "</span>";
}

function renderCodeCell(cell) {
  return '<code class="code-cell">' + esc(cell.value) + "</code>";
}

function renderBadgeCell(cell) {
  var label = cell.label || cell.variant.toUpperCase();
  return '<span class="badge badge--' + esc(cell.variant) + '">' + esc(label) + "</span>";
}

function renderColorSwatchCell(cell) {
  var hex = cell.hex || cell.color;
  var pill = cell.tokenName
    ? '<span class="token-pill token-pill--swatch">' + esc(cell.tokenName) + "</span>"
    : "";
  return (
    '<span class="color-swatch-cell">' +
    '<span class="color-swatch__dot" style="background:' + esc(cell.color) + '"></span>' +
    '<span class="color-swatch__stack">' +
    pill +
    '<code class="color-swatch__hex">' + esc(hex) + "</code>" +
    "</span>" +
    "</span>"
  );
}

function renderEmptyCell() {
  return '<span class="empty-cell">&mdash;</span>';
}

function renderCell(cell, alignment) {
  switch (cell.type) {
    case "text":
      return renderTextCell(cell, alignment);
    case "token-pill":
      return renderTokenPillCell(cell);
    case "code":
      return renderCodeCell(cell);
    case "badge":
      return renderBadgeCell(cell);
    case "color-swatch":
      return renderColorSwatchCell(cell);
    case "empty":
      return renderEmptyCell();
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Main render function
// ---------------------------------------------------------------------------

function render(spec) {
  var html = '<table class="render-table">';
  html += "<thead><tr>";
  spec.headers.forEach(function (h, i) {
    var align = spec.columnAlignments && spec.columnAlignments[i];
    var styleAttr =
      align && align !== "left" ? ' style="text-align:' + align + '"' : "";
    html += "<th" + styleAttr + ">" + esc(h) + "</th>";
  });
  html += "</tr></thead><tbody>";

  spec.rows.forEach(function (row) {
    html += "<tr>";
    row.cells.forEach(function (cell, i) {
      var align = spec.columnAlignments && spec.columnAlignments[i];
      var styleAttr =
        align && align !== "left" ? ' style="text-align:' + align + '"' : "";
      html += "<td" + styleAttr + ">" + renderCell(cell, align) + "</td>";
    });
    if (row.footnoteRef) {
      // No-op for cell-level footnote markers in HTML — they ride inside the cell content.
      // Future: render a sup link to the footnote anchor.
    }
    html += "</tr>";
  });
  html += "</tbody></table>";

  if (spec.footnotes && spec.footnotes.length) {
    html += '<div class="render-table__footnotes">';
    spec.footnotes.forEach(function (fn) {
      html +=
        '<div class="render-table__footnote">' +
        '<sup>' + esc(fn.ref) + "</sup> " + esc(fn.text) +
        "</div>";
    });
    html += "</div>";
  }

  return html;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function readStdinSync() {
  var data = "";
  var buf = Buffer.alloc(4096);
  while (true) {
    try {
      var n = fs.readSync(0, buf, 0, buf.length, null);
      if (!n) break;
      data += buf.toString("utf8", 0, n);
    } catch (e) {
      if (e.code === "EAGAIN") continue;
      break;
    }
  }
  return data;
}

function main() {
  var raw = readStdinSync();
  if (!raw || !raw.trim()) {
    process.stderr.write(
      JSON.stringify({
        ok: false,
        errors: [{ path: "$", message: "Empty spec via stdin" }],
      }) + "\n"
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
        errors: [{ path: "$", message: "JSON parse: " + e.message }],
      }) + "\n"
    );
    process.exit(1);
  }

  var tokenNames = loadTokenNames();
  var errors = validate(spec, tokenNames);
  if (errors.length) {
    process.stderr.write(JSON.stringify({ ok: false, errors: errors }, null, 2) + "\n");
    process.exit(1);
  }

  var html = render(spec);
  process.stdout.write(html);
  process.stderr.write(
    JSON.stringify({
      ok: true,
      manifest: { rowCount: spec.rows.length, columnCount: spec.headers.length },
    }) + "\n"
  );
}

if (require.main === module) main();

module.exports = { render: render, renderCell: renderCell };
