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
var PATHS = require("../lib/paths");

// The Button taxonomy is Intent x Emphasis (knowledge v0.34.x). These six cells
// exercise every emphasis class the renderer produces (primary, secondary,
// tertiary, critical, critical-secondary) plus a disabled example. The variant
// strings use the same `Key=Value` form parseVariant() reads from Figma.
var MATRIX = [
  { label: "Primary", variant: "Emphasis=Filled" },
  { label: "Secondary", variant: "Emphasis=Outlined" },
  { label: "Tertiary", variant: "Emphasis=Ghost" },
  { label: "Critical", variant: "Intent=Critical, Emphasis=Filled" },
  {
    label: "Critical secondary",
    variant: "Intent=Critical, Emphasis=Outlined",
  },
  { label: "Disabled", variant: "Emphasis=Filled, State=Disabled" },
];

function readRegistry(kit) {
  try {
    return JSON.parse(
      fs.readFileSync(PATHS.components.registries[kit], "utf8"),
    );
  } catch (e) {
    return { components: {} };
  }
}

// A render slug may live in any kit; search ds -> meta -> fm.
function findComponent(slug) {
  var kits = ["dskit", "metakit", "fmkit"];
  for (var i = 0; i < kits.length; i++) {
    var reg = readRegistry(kits[i]);
    if (reg.components && reg.components[slug]) return reg.components[slug];
  }
  return null;
}

var SECONDARY_AXES = { Size: 1, State: 1 };

// Derives a small variant matrix straight from the registry, so any of the 35
// render slugs (not just Button) gets a representative set of cells without a
// per-slug hand-authored MATRIX. Primary axis = the richest non-Size/State
// axis; cells = one per primary-axis value (capped at 5) plus a disabled
// state cell when the State axis offers one. Slugs with no usable variants
// fall back to a single default cell so callers always get at least one.
function variantMatrix(slug) {
  var comp = findComponent(slug);
  var variants = (comp && comp.variants) || {};
  var axes = Object.keys(variants).filter(function (a) {
    return (
      !SECONDARY_AXES[a] && Array.isArray(variants[a]) && variants[a].length
    );
  });
  if (!axes.length) {
    return [{ label: slug, variant: "", props: { Label: slug } }];
  }
  // Primary axis = the non-Size/State axis with the most values.
  axes.sort(function (a, b) {
    return variants[b].length - variants[a].length;
  });
  var primary = axes[0];
  var cells = variants[primary].slice(0, 5).map(function (v) {
    return { label: v, variant: primary + "=" + v, props: { Label: v } };
  });
  // Add a disabled state cell when the State axis offers it.
  if (variants.State && variants.State.indexOf("Disabled") >= 0) {
    cells.push({
      label: "Disabled",
      variant: primary + "=" + variants[primary][0] + ", State=Disabled",
      props: { Label: "Disabled" },
    });
  }
  return cells;
}

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

module.exports = {
  captureButtonMatrix: captureButtonMatrix,
  MATRIX: MATRIX,
  findComponent: findComponent,
  variantMatrix: variantMatrix,
};
