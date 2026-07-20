// scripts/render/capture-seed.js
//
// One-time seed generator for the canonical component render library that lives
// in actian-ds-knowledge. Slice 1 SEEDS the canonical button.html by capturing
// the plugin's existing hand-authored Button render (the full variant matrix in
// one self-contained doc). Slice 2 replaces this capture with a real
// derive-from-facts in the knowledge repo; this script is the bootstrap, not the
// permanent producer.
//
// captureMatrix(slug) returns one self-contained HTML document whose first
// line is the DesignSync `@dsCard` marker, containing one rendered instance of
// the slug per registry-derived variant cell (see variantMatrix) plus a
// disabled state where the registry offers one, all sharing the single
// inlined stylesheet (tokens + fonts + base + component CSS) that render-leaf
// already assembles. captureButtonMatrix() is captureMatrix("button"), kept
// as a named alias for the original slice-1 bootstrap caller. RENDER_SLUGS is
// the full 35-slug set (the html-renderers switch); the --all CLI mode
// captures every one of them into a destination directory.
"use strict";

var path = require("node:path");
var fs = require("node:fs");

var leaf = require("../fidelity/render-leaf.js");
var renderer = require("../lib/renderer.js");
var dsMap = renderer.dsHtmlMap;

// The 35 render slugs are the `case "<slug>":` branches in the vendored
// ds-html-map. This list drives the --all CLI mode and is the seed set for the
// canonical render library bootstrap.
// The matrix logic (RENDER_SLUGS, findComponent, variantMatrix, groupFor and
// their helpers) moved to knowledge at renderer-relocation phase 1a and is
// consumed from the vendored renderer. capture-seed keeps only the render and
// capture half; it retires wholesale at phase 3.
var matrix = renderer.matrix;
var RENDER_SLUGS = matrix.RENDER_SLUGS;
var findComponent = matrix.findComponent;
var variantMatrix = matrix.variantMatrix;
var groupFor = matrix.groupFor;

// Each cell stacks the rendered component over a caption naming the variant.
// The caption inherits the body text color at reduced opacity, so no color is
// hardcoded and no token name is guessed.
function renderCell(slug, cell) {
  var fragment = dsMap.renderDSComponent({
    dsSlug: slug,
    variant: cell.variant,
    props: cell.props || {},
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

// Generalized capture: builds the full variant matrix for any of the 35
// render slugs into one self-contained @dsCard doc. Slice 1 seeded only
// button by hand; this generalizes that bootstrap to the whole render set
// using the registry-derived variantMatrix() instead of a hand-picked list.
function captureMatrix(slug) {
  var grid =
    '<div style="display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start">' +
    variantMatrix(slug)
      .map(function (cell) {
        return renderCell(slug, cell);
      })
      .join("") +
    "</div>";
  // buildLeafHtml inlines the whole stylesheet and wraps the fragment in a
  // self-contained page. fullWidth lets the matrix use the viewport width.
  var doc = leaf.buildLeafHtml(slug, grid, { fullWidth: true });
  return '<!-- @dsCard group="' + groupFor(slug) + '" -->\n' + doc;
}

function captureButtonMatrix() {
  return captureMatrix("button");
}

if (require.main === module) {
  var argv = process.argv.slice(2);
  var allIdx = argv.indexOf("--all");
  if (allIdx >= 0 && argv[allIdx + 1]) {
    var destDir = path.resolve(argv[allIdx + 1]);
    fs.mkdirSync(destDir, { recursive: true });
    var wrote = 0,
      skipped = [];
    RENDER_SLUGS.forEach(function (slug) {
      try {
        fs.writeFileSync(
          path.join(destDir, slug + ".html"),
          captureMatrix(slug),
        );
        wrote++;
      } catch (e) {
        skipped.push(slug + " (" + e.message + ")");
      }
    });
    process.stdout.write("wrote " + wrote + " seed(s) -> " + destDir + "\n");
    if (skipped.length)
      process.stdout.write("skipped: " + skipped.join(", ") + "\n");
  } else {
    // existing single --write / stdout behavior, now slug-parameterized
    var wi = argv.indexOf("--write");
    var slug =
      argv.indexOf("--slug") >= 0 ? argv[argv.indexOf("--slug") + 1] : "button";
    var html = captureMatrix(slug);
    if (wi >= 0 && argv[wi + 1]) {
      var out = path.resolve(argv[wi + 1]);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, html);
      process.stdout.write("wrote " + out + " (" + html.length + " bytes)\n");
    } else {
      process.stdout.write(html);
    }
  }
}

module.exports = {
  captureButtonMatrix: captureButtonMatrix,
  captureMatrix: captureMatrix,
  RENDER_SLUGS: RENDER_SLUGS,
  findComponent: findComponent,
  variantMatrix: variantMatrix,
};
