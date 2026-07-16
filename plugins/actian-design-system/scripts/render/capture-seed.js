// scripts/render/capture-seed.js
//
// One-time seed generator for the canonical component render library that lives
// in actian-ds-knowledge. Slice 1 SEEDS the canonical button.html by capturing
// the plugin's existing hand-authored Button render (the full variant matrix in
// one self-contained doc). Slice 2 replaces this capture with a real
// derive-from-facts in the knowledge repo; this script is the bootstrap, not the
// permanent producer.
//
// captureButtonMatrix() returns one self-contained HTML document whose first
// line is the DesignSync `@dsCard` marker, containing one rendered Button per
// (Intent x Emphasis) variant plus a disabled state, all sharing the single
// inlined stylesheet (tokens + fonts + base + button CSS) that render-leaf
// already assembles.
"use strict";

var path = require("node:path");
var fs = require("node:fs");

var leaf = require("../fidelity/render-leaf.js");
var HR = path.join(__dirname, "..", "renderers", "html-renderers");
var dsMap = require(path.join(HR, "ds-html-map.js"));

// The Button taxonomy is Intent x Emphasis (knowledge v0.34.x). These six cells
// exercise every emphasis class the renderer produces (primary, secondary,
// tertiary, critical, critical-secondary) plus a disabled example. The variant
// strings use the same `Key=Value` form parseVariant() reads from Figma.
var MATRIX = [
  { label: "Primary", variant: "Emphasis=Filled" },
  { label: "Secondary", variant: "Emphasis=Outlined" },
  { label: "Tertiary", variant: "Emphasis=Ghost" },
  { label: "Critical", variant: "Intent=Critical, Emphasis=Filled" },
  { label: "Critical secondary", variant: "Intent=Critical, Emphasis=Outlined" },
  { label: "Disabled", variant: "Emphasis=Filled, State=Disabled" },
];

// Each cell stacks the rendered Button over a caption naming the variant. The
// caption inherits the body text color at reduced opacity, so no color is
// hardcoded and no token name is guessed.
function renderCell(cell) {
  var fragment = dsMap.renderDSComponent({
    dsSlug: "button",
    variant: cell.variant,
    props: { Label: cell.label },
  });
  return (
    '<div style="display:flex;flex-direction:column;gap:8px;align-items:flex-start">' +
    fragment +
    '<span style="font:12px/1.4 sans-serif;opacity:0.55">' +
    dsMap.esc(cell.label) +
    "</span>" +
    "</div>"
  );
}

function captureButtonMatrix() {
  var grid =
    '<div style="display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start">' +
    MATRIX.map(renderCell).join("") +
    "</div>";
  // buildLeafHtml inlines the whole stylesheet and wraps the fragment in a
  // self-contained page. fullWidth lets the matrix use the viewport width.
  var doc = leaf.buildLeafHtml("button", grid, { fullWidth: true });
  return '<!-- @dsCard group="Components" -->\n' + doc;
}

if (require.main === module) {
  var argv = process.argv.slice(2);
  var wi = argv.indexOf("--write");
  var html = captureButtonMatrix();
  if (wi >= 0 && argv[wi + 1]) {
    var out = path.resolve(argv[wi + 1]);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
    process.stdout.write("wrote " + out + " (" + html.length + " bytes)\n");
  } else {
    process.stdout.write(html);
  }
}

module.exports = { captureButtonMatrix: captureButtonMatrix, MATRIX: MATRIX };
