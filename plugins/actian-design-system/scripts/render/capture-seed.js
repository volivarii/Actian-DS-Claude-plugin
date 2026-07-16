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

var _regCache = null;
function readRegistry(kit) {
  if (!_regCache) _regCache = {};
  if (_regCache[kit] === undefined) {
    try {
      _regCache[kit] = JSON.parse(
        fs.readFileSync(PATHS.components.registries[kit], "utf8"),
      );
    } catch (e) {
      process.stderr.write(
        "capture-seed: registry read failed (" + kit + "): " + e.message + "\n",
      );
      _regCache[kit] = { components: {} };
    }
  }
  return _regCache[kit];
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

// Size and State (singular or plural) are secondary axes: they vary interaction,
// not the component's identity. Matched case and pluralization insensitively so
// real data ("States") is caught.
function isSecondaryAxis(name) {
  return /^(size|states?)$/i.test(name);
}
function stateAxisName(variants) {
  return (
    Object.keys(variants).find(function (a) {
      return /^states?$/i.test(a);
    }) || null
  );
}
function disabledValue(values) {
  return (
    (values || []).find(function (v) {
      return /disabled/i.test(v);
    }) || null
  );
}

function variantMatrix(slug) {
  var comp = findComponent(slug);
  var variants = (comp && comp.variants) || {};
  var stateAxis = stateAxisName(variants);
  var primaryAxes = Object.keys(variants).filter(function (a) {
    return (
      !isSecondaryAxis(a) && Array.isArray(variants[a]) && variants[a].length
    );
  });
  // Primary axis = most values; deterministic name tie-break so the pick is stable
  // across registry re-vendors.
  primaryAxes.sort(function (a, b) {
    return variants[b].length - variants[a].length || a.localeCompare(b);
  });

  var cells = [];
  var primary = null;
  if (primaryAxes.length) {
    primary = primaryAxes[0];
    cells = variants[primary].slice(0, 5).map(function (v) {
      return { label: v, variant: primary + "=" + v, props: { Label: v } };
    });
  } else if (stateAxis) {
    // No identity axis: the state axis is the component's only variance; show a few.
    primary = stateAxis;
    cells = variants[stateAxis].slice(0, 5).map(function (v) {
      return { label: v, variant: stateAxis + "=" + v, props: { Label: v } };
    });
  }

  if (!cells.length) {
    return [{ label: slug, variant: "", props: { Label: slug } }];
  }

  // Ensure a disabled example when the state axis offers one and none is shown yet.
  // The state axis name is used verbatim (button uses "State", text-input "States"),
  // because the renderer keys on the exact axis name.
  if (stateAxis) {
    var dv = disabledValue(variants[stateAxis]);
    var alreadyDisabled = cells.some(function (c) {
      return /disabled/i.test(c.variant);
    });
    if (dv && !alreadyDisabled) {
      var base =
        primary && primary !== stateAxis
          ? primary + "=" + variants[primary][0] + ", "
          : "";
      cells.push({
        label: dv,
        variant: base + stateAxis + "=" + dv,
        props: { Label: dv },
      });
    }
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
