// components/render/renderer/matrix.js
//
// Ported from the plugin's scripts/render/capture-seed.js (renderer-relocation
// phase 1a, task 4). This is the variant-matrix selection logic only: which
// registry-derived variant cells to render per component. The functions below
// are copied verbatim from the plugin; the only change is readRegistry(kit),
// which reads knowledge's local components/dist/registries/<kit>.json instead
// of the plugin's PATHS.components.registries[kit] (lib/paths, which knowledge
// does not have). renderCell/captureMatrix/captureButtonMatrix stay in the
// plugin-side driver (a later task); this module only picks the cells.
"use strict";

var fs = require("node:fs");
var path = require("node:path");

var REG_DIR = path.resolve(__dirname, "..", "..", "dist", "registries");
var _cache = {};
function readRegistry(kit) {
  if (kit in _cache) return _cache[kit];
  try {
    _cache[kit] = JSON.parse(
      fs.readFileSync(path.join(REG_DIR, kit + ".json"), "utf8"),
    );
  } catch (e) {
    _cache[kit] = { components: {} };
  }
  return _cache[kit];
}

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

// A render slug may live in any kit; search ds -> meta -> fm.
function findComponent(slug) {
  var kits = ["dskit", "metakit", "fmkit"];
  for (var i = 0; i < kits.length; i++) {
    var reg = readRegistry(kits[i]);
    if (reg.components && reg.components[slug]) return reg.components[slug];
  }
  return null;
}

// Size, State (singular or plural), and Breakpoint(s) are secondary axes: they
// vary density/interaction/responsive width, not the component's identity, so
// they should not become the card's matrix (a global-header shown at five
// breakpoints is noise). Matched case and pluralization insensitively so real
// data ("States", "Breakpoints") is caught.
function isSecondaryAxis(name) {
  return /^(size|states?|breakpoints?)$/i.test(name);
}

// When two axes tie on value count, prefer the one whose name reads as the
// component's identity (Type/Variant/Emphasis/Intent/Kind/Style/Appearance)
// over an incidental layout axis, so the matrix shows what distinguishes the
// component. Falls through to alphabetical for a stable, re-vendor-proof pick.
var IDENTITY_AXIS = /type|variant|emphasis|intent|kind|style|appearance/i;
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

  // tag-default's Color axis has 9 values; the generic 5-cell cap would drop
  // three colors. The color IS the component's identity here, so show them all.
  // ds-base.css carries a .ds-tag--<color> rule for the 8 tinted colors; the
  // renderer's tag-default case emits ds-tag--<color> from v.Color, so this
  // override drives every color through the generic renderer (no template).
  // "Default" has no --color rule and renders as the base gray .ds-tag.
  "tag-default": [
    "Pink",
    "Purple",
    "Indigo",
    "Yellow",
    "Lime",
    "Teal",
    "Orange",
    "Gray",
    "Default",
  ].map(function (c) {
    return { label: c, variant: "Color=" + c, props: { Label: c } };
  }),

  // Size is a secondary axis (filtered by isSecondaryAxis), so the generic
  // derivation falls back to a single bare cell with no props. Curate one
  // representative rich cell instead: default illustration, title, body, and
  // both the tertiary + primary actions, so the gallery shows the component
  // as designed rather than the stub default.
  "empty-state": [
    {
      label: "Default",
      variant: "Size=Large",
      props: {
        Headline: "No policies available",
        Body: "Create policies to define how your platform operates.",
        Cta: "Create policy",
        Secondary: "Learn more",
      },
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
    return (
      variants[b].length - variants[a].length ||
      (IDENTITY_AXIS.test(b) ? 1 : 0) - (IDENTITY_AXIS.test(a) ? 1 : 0) ||
      a.localeCompare(b)
    );
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
// back to its group), so the card lands under the same grouping DesignSync
// already uses; "Components" is the last-resort default when a slug carries
// neither (e.g. it is missing from all three registries). That fallback is a
// SILENT reclassification, so invariant 5 in tests/render/fragment-invariants.test.js
// fails any RENDER_SLUGS slug that reaches it.
function groupFor(slug) {
  var comp = findComponent(slug);
  return (comp && (comp.category || comp.group)) || "Components";
}

module.exports = {
  variantMatrix: variantMatrix,
  findComponent: findComponent,
  groupFor: groupFor,
  RENDER_SLUGS: RENDER_SLUGS,
  MATRIX_OVERRIDES: MATRIX_OVERRIDES,
};
