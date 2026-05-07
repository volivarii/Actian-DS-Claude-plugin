"use strict";

/**
 * render-html.js — HTML interpreter for the renderTable spec.
 *
 * Sister to render-figma.js. Same spec drives both — proves the abstraction
 * stays domain-level (no Figma vocabulary leaks into the spec, otherwise the
 * HTML interpreter couldn't render it).
 *
 * UMD-wrapped: callable from Node (CommonJS require) and from the browser
 * (window.renderTableHtml). The browser path is used by brief-renderer.js to
 * render the brief preview's tables; the Node path is used by tests, the CLI
 * below, and (eventually) the unified docs site.
 *
 * CLI usage (Node only):
 *   echo '{...spec...}' | node render-html.js
 *
 * Programmatic usage:
 *   var renderer = require("./render-html");      // Node
 *   var html = renderer.render(spec);
 *   // OR (browser): var html = window.renderTableHtml.render(spec);
 *
 * CLI output: HTML string to stdout, manifest to stderr; exit 0 on success.
 *             Error report (JSON) to stderr; exit 1 on invalid spec.
 */

(function (root, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else if (typeof root !== "undefined") {
    root.renderTableHtml = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  // -------------------------------------------------------------------------
  // HTML escaping
  // -------------------------------------------------------------------------

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // -------------------------------------------------------------------------
  // Cell renderers — mirror render-figma.js structure
  // -------------------------------------------------------------------------

  function renderTextCell(cell, alignment) {
    var styles = [];
    if (cell.weight === "semibold") styles.push("font-weight:600");
    if (alignment && alignment !== "left") styles.push("text-align:" + alignment);
    var styleAttr = styles.length ? ' style="' + styles.join(";") + '"' : "";
    return "<span" + styleAttr + ">" + esc(cell.value) + "</span>";
  }

  function renderTokenPillCell(cell) {
    return '<span class="token-pill">' + esc(cell.value) + "</span>";
  }

  function renderCodeCell(cell) {
    return '<code class="code-cell">' + esc(cell.value) + "</code>";
  }

  function renderBadgeCell(cell) {
    var label = cell.label || cell.variant.toUpperCase();
    return (
      '<span class="badge badge--' + esc(cell.variant) + '">' +
      esc(label) +
      "</span>"
    );
  }

  function renderColorSwatchCell(cell) {
    var hex = cell.hex || cell.color;
    var pill = cell.tokenName
      ? '<span class="token-pill token-pill--swatch">' +
        esc(cell.tokenName) +
        "</span>"
      : "";
    return (
      '<span class="color-swatch-cell">' +
      '<span class="color-swatch__dot" style="background:' +
      esc(cell.color) +
      '"></span>' +
      '<span class="color-swatch__stack">' +
      pill +
      '<code class="color-swatch__hex">' +
      esc(hex) +
      "</code>" +
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

  // -------------------------------------------------------------------------
  // Main render function
  // -------------------------------------------------------------------------

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
          align && align !== "left"
            ? ' style="text-align:' + align + '"'
            : "";
        html += "<td" + styleAttr + ">" + renderCell(cell, align) + "</td>";
      });
      // Footnote markers ride inside cell content; no per-row HTML needed today.
      html += "</tr>";
    });
    html += "</tbody></table>";

    if (spec.footnotes && spec.footnotes.length) {
      html += '<div class="render-table__footnotes">';
      spec.footnotes.forEach(function (fn) {
        html +=
          '<div class="render-table__footnote">' +
          "<sup>" +
          esc(fn.ref) +
          "</sup> " +
          esc(fn.text) +
          "</div>";
      });
      html += "</div>";
    }

    return html;
  }

  return { render: render, renderCell: renderCell };
});

// ---------------------------------------------------------------------------
// CLI — only active when running this file directly under Node.
// Imports fs/path/render-figma at this point so the UMD module above stays
// browser-safe (no top-level require of Node-only modules).
// ---------------------------------------------------------------------------

if (typeof require !== "undefined" && require.main === module) {
  var fs = require("fs");
  var path = require("path");
  var figmaModule = require(path.join(__dirname, "render-figma.js"));
  var validate = figmaModule.validate;
  var loadTokenNames = figmaModule.loadTokenNames;
  var renderer = module.exports;

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

  var raw = readStdinSync();
  if (!raw || !raw.trim()) {
    process.stderr.write(
      JSON.stringify({
        ok: false,
        errors: [{ path: "$", message: "Empty spec via stdin" }],
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
        errors: [{ path: "$", message: "JSON parse: " + e.message }],
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

  var htmlOut = renderer.render(spec);
  process.stdout.write(htmlOut);
  process.stderr.write(
    JSON.stringify({
      ok: true,
      manifest: {
        rowCount: spec.rows.length,
        columnCount: spec.headers.length,
      },
    }) + "\n",
  );
}
