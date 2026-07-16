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
var HR = path.join(__dirname, "..", "renderers", "html-renderers");
var dsMap = require(path.join(HR, "ds-html-map.js"));
var PATHS = require("../lib/paths");

// The 35 render slugs are the `case "<slug>":` branches in
// scripts/renderers/html-renderers/ds-html-map.js. This list drives the
// --all CLI mode and is the seed set for the canonical render library bootstrap.
var RENDER_SLUGS = [
  "account-dropdown",
  "alert-banner",
  "app-switcher-dropdown",
  "badge",
  "breadcrumb",
  "button",
  "calendar",
  "card-for-items",
  "chat-with-ai-steward",
  "checkbox",
  "dropdown-select-default",
  "empty-state",
  "global-header",
  "input-date",
  "loader",
  "modal",
  "notification",
  "page-header",
  "popover",
  "progress-bar-small",
  "radio-button",
  "rich-text",
  "search",
  "segmented-control",
  "side-nav",
  "stepper",
  "sticky-footer",
  "table",
  "tabs",
  "tag-default",
  "tag-interactive",
  "text-input",
  "toggle",
  "toolbar",
  "tooltip",
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

// Per-slug curated matrices. Button is the flagship: its Intent x Emphasis
// richness (including the Critical variants) reads better than a single-axis
// registry derivation, so it is authored here rather than derived. Kept in the
// deriver so a re-run of --all reproduces it instead of clobbering it.
var MATRIX_OVERRIDES = {
  button: [
    {
      label: "Primary",
      variant: "Emphasis=Filled",
      props: { Label: "Primary" },
    },
    {
      label: "Secondary",
      variant: "Emphasis=Outlined",
      props: { Label: "Secondary" },
    },
    {
      label: "Tertiary",
      variant: "Emphasis=Ghost",
      props: { Label: "Tertiary" },
    },
    {
      label: "Critical",
      variant: "Intent=Critical, Emphasis=Filled",
      props: { Label: "Critical" },
    },
    {
      label: "Critical secondary",
      variant: "Intent=Critical, Emphasis=Outlined",
      props: { Label: "Critical secondary" },
    },
    {
      label: "Disabled",
      variant: "Emphasis=Filled, State=Disabled",
      props: { Label: "Disabled" },
    },
  ],
};

function variantMatrix(slug) {
  if (MATRIX_OVERRIDES[slug]) return MATRIX_OVERRIDES[slug];
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

// The @dsCard group comes from the component's registry category (falling
// back to its group), so the seed lands under the same grouping DesignSync
// already uses; "Components" is the last-resort default when a slug carries
// neither (e.g. it is missing from all three registries).
function groupFor(slug) {
  var comp = findComponent(slug);
  return (comp && (comp.category || comp.group)) || "Components";
}

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
