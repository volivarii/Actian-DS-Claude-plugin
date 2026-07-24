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

// The render slugs ARE the `case "<slug>":` branches in
// html-renderers/ds-html-map.js, so they are read from that source rather
// than restated here. This list drives the --all CLI mode and seeds the
// canonical render library.
//
// This used to be a hand-maintained copy of the same 63 names, which meant
// adding or renaming a component took three coordinated edits across two
// files. #465 shipped a slug that never reached the canonical library for
// exactly that reason: the case existed and this list did not list it.
// Deriving removes that failure mode instead of testing for it. matrix.js is
// node-only (it already requires fs/path above), so reading the sibling
// source is safe here; ds-html-map.js itself is browser-capable and keeps its
// own BUILT_SLUGS literal, which invariant 8 now checks AGAINST this derived
// set rather than against a second hand-written list.
var DS_MAP_PATH = path.resolve(
  __dirname,
  "html-renderers",
  "ds-html-map.js",
);
function readRenderSlugs() {
  var src = fs.readFileSync(DS_MAP_PATH, "utf8");
  var out = [];
  var seen = Object.create(null);
  var re = /^[ \t]*case "([a-z0-9-]+)":/gm;
  var m;
  while ((m = re.exec(src)) !== null) {
    if (!seen[m[1]]) {
      seen[m[1]] = 1;
      out.push(m[1]);
    }
  }
  if (!out.length)
    throw new Error(
      "matrix.js: no `case \"<slug>\":` branches found in " +
        DS_MAP_PATH +
        " -- the render-slug derive found nothing, which would silently empty " +
        "RENDER_SLUGS and skip every render. Check the switch or this parser.",
    );
  return out.sort();
}
var RENDER_SLUGS = readRenderSlugs();

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

  // tag-stage's Color axis has 8 values; the generic 5-cell cap would drop
  // three. Color is the component's identity here (drives both the
  // container bg/border via the existing .ds-tag--<color> rules and the dot
  // fill via the new per-color descendant rules), so show them all.
  "tag-stage": [
    "Orange",
    "Indigo",
    "Purple",
    "Lime",
    "Teal",
    "Yellow",
    "Pink",
    "Gray",
  ].map(function (c) {
    return { label: c, variant: "Color=" + c, props: { Label: c } };
  }),

  // tag-status's Status axis has 11 values; the generic 5-cell cap would drop
  // six. Every status is a distinct real-world state (not decorative), so
  // show them all rather than an arbitrary subset.
  "tag-status": [
    "Fail",
    "Warning",
    "Loading",
    "Maintenance",
    "Scheduled",
    "Queued",
    "Stopped",
    "Sleeping",
    "Offline",
    "Pending",
    "Success",
  ].map(function (s) {
    return { label: s, variant: "Status=" + s, props: { Label: s } };
  }),

  // Property 1 is single-valued ("Default"), so the generic derivation would
  // fall back to a single bare cell with no props and never show the
  // "Show Counter" form. Curate one representative cell with the counter on.
  "tag-glossary-item-type": [
    {
      label: "Default",
      variant: "Property 1=Default",
      props: { Label: "Glossary item", "Show Counter": true, Counter: "00" },
    },
  ],

  // tag-catalog-item-type's Type axis has 8 values; the generic 5-cell cap
  // would drop three. Type IS the component's identity (each value is a
  // distinct colored pill), so show them all.
  "tag-catalog-item-type": [
    "Category",
    "Dataset",
    "Data process",
    "Data product",
    "Field",
    "Output port",
    "Use case",
    "Visualization",
  ].map(function (t) {
    return { label: t, variant: "Type=" + t, props: { Label: t } };
  }),

  // Same rationale as empty-state above: Size is the only (secondary) axis,
  // so curate one representative rich cell instead of the generic bare stub.
  "maintenance-state": [
    {
      label: "Default",
      variant: "Size=Large",
      props: {
        Headline: "Scheduled maintenance in progress until 12:00 PM EST",
        Body: "Reports may be unavailable. Refresh or check back when the maintenance window is complete.",
        Cta: "Create policy",
        Secondary: "Learn more",
      },
    },
  ],

  // Same rationale as empty-state/maintenance-state above: Size is the only
  // (secondary) axis, so curate one representative rich cell (the captured
  // success-confirmation anatomy) instead of the generic bare stub.
  confirmation: [
    {
      label: "Default",
      variant: "Size=Large",
      props: {
        Title: "Success!",
        Body: "The selected items will be imported into the catalog. You will be notified once the import is complete.",
        Cta: "Open the catalog",
        Secondary: "Learn more",
      },
    },
  ],

  // Same rationale as empty-state/maintenance-state/confirmation above: Size
  // is the only (secondary) axis, so curate one representative rich cell
  // instead of the generic bare stub.
  "error-state": [
    {
      label: "Default",
      variant: "Size=Large",
      props: {
        Title: "Something went wrong",
        Body: "There was an error creating your item. Please try again in a moment.",
        Cta: "Try again",
        Secondary: "Go back",
      },
    },
  ],

  // Property 1 is single-valued ("Default"), so the generic derivation would
  // fall back to a single bare cell with props:{Label:slug} -- the case
  // reads Item type/Name/Counter/Completeness, not Label, so that stub would
  // render an all-default card. Curate one representative rich cell instead
  // (values mirror the captured anatomy sample).
  "card-for-perimeter": [
    {
      label: "Default",
      variant: "Property 1=Default",
      props: {
        "Item type": "Dataset",
        "Item type initials": "DS",
        Name: "Dataset",
        Counter: "23",
        Completeness: "50%",
      },
    },
  ],

  // Same rationale as card-for-perimeter above: Property 1 is single-valued
  // ("Default"), so curate one representative rich cell (Title + Body)
  // instead of the generic bare stub.
  "card-for-grouped-content": [
    {
      label: "Default",
      variant: "Property 1=Default",
      props: {
        Title: "Grouped content",
        "Show info icon": true,
        Body: "Group related fields, filters, or summary content under a single labeled section.",
      },
    },
  ],

  // App is the identity axis (Explorer/Studio), but this leaf reads its own
  // Title/Type/Stage/Catalog/etc props, not Label -- the generic derivation
  // would render an all-default card for each App value. Curate 2 cells
  // instead, mirroring card-for-items' only-Selected-shown convention: the
  // faithful default (App=Explorer, State=Default) plus State=Selected.
  "search-result-card": [
    {
      label: "Default",
      variant: "App=Explorer, State=Default",
      props: {
        Title: "Financial Summary EY2024",
        "Tech name": "[Financial Summary EY2024]",
        Type: "Category",
        Stage: "Stage",
        Catalog: "Catalog",
        Description:
          "A product is anything that can be offered to a market that might satisfy a want or need by potential customers.",
        "Featured property 1": "Business Domain: IT",
        "Featured property 2": "Source Application: App 120",
        "Glossary label": "Vehicle",
      },
    },
    {
      label: "Selected",
      variant: "App=Explorer, State=Selected",
      props: {
        Title: "Financial Summary EY2024",
        "Tech name": "[Financial Summary EY2024]",
        Type: "Category",
        Stage: "Stage",
        Catalog: "Catalog",
        Description:
          "A product is anything that can be offered to a market that might satisfy a want or need by potential customers.",
        "Featured property 1": "Business Domain: IT",
        "Featured property 2": "Source Application: App 120",
        "Glossary label": "Vehicle",
      },
    },
  ],

  // Property 1 (Empty/List) is the identity axis, but this leaf reads
  // Items/Header/Empty, not Label -- the generic derivation would render an
  // all-default cell for each value. Curate both cells so the gallery shows
  // the list AND the empty state.
  "notification-dropdown": [
    {
      label: "List",
      variant: "Property 1=List",
      props: {
        Header: "Notifications",
        Items:
          "New items inventoried from PowerBi Online V1 at 7/11/25 12:42 AM.,New items inventoried from PowerBi Online V1 at 7/6/25 12:42 AM.,New items inventoried from PowerBi Online V1 at 7/3/25 4:47 PM.",
      },
    },
    {
      label: "Empty",
      variant: "Property 1=Empty",
      props: { Header: "Notifications" },
    },
  ],

  // Type (No result/Before typed/After typed/Explorer home) is the identity
  // axis, but this leaf reads Heading/Results/Query, not Label -- curate 2
  // representative cells (the captured After-typed default + No result,
  // since that one swaps in an entirely different, text-only body).
  "search-dropdown-menu": [
    {
      label: "After typed",
      variant: "Type=After typed",
      props: {
        Heading: "Suggestions",
        Results: "transmitting,transmitter,transmit,transparent",
      },
    },
    {
      label: "No result",
      variant: "Type=No result",
      props: { Query: "orders" },
    },
  ],

  // Property 1 (Drilldown1/Drilldown2/Empty/List) is the identity axis, but
  // this leaf reads Title/Items/EmptyLabel/Detail, not Label -- curate 3
  // cells (List, Empty, Drilldown) so the gallery shows every wnMode branch.
  "whats-new-dropdown": [
    {
      label: "List",
      variant: "Property 1=List",
      props: {
        Title: "What's new",
        Items:
          "Added support for bulk dataset import.,Fixed an issue where filters were not preserved on page reload.",
      },
    },
    {
      label: "Empty",
      variant: "Property 1=Empty",
      props: { Title: "What's new", EmptyLabel: "No release updates" },
    },
    {
      label: "Drilldown",
      variant: "Property 1=Drilldown1",
      props: {
        Title: "Bulk dataset import",
        Detail:
          "Added support for bulk dataset import. You can now import multiple datasets from a single CSV manifest.",
      },
    },
  ],

  // App (Studio/Explorer) is the identity axis, but this leaf reads
  // Name/Type/Show Back, not Label -- curate both cells so the gallery
  // shows the faithful Studio default plus the minimal Explorer accent.
  "drawer-side-panel": [
    {
      label: "Studio",
      variant: "App=Studio",
      props: { Name: "Financial Summary EY2024", Type: "Dataset" },
    },
    {
      label: "Explorer",
      variant: "App=Explorer",
      props: { Name: "Financial Summary EY2024", Type: "Dataset" },
    },
  ],

  // Complete (25/50/75/100%) has more values than Color mode, so the generic
  // tie-break (most values wins) would pick Complete as primary -- but
  // Complete is the ring animation's own arc-fill cycle, not a chooseable
  // variant (usage guideline), and the case ignores it entirely. Curate the
  // real identity axis (Color mode) instead so the gallery actually shows
  // the on-dark modifier.
  spinner: [
    {
      label: "On light bg",
      variant: "Color mode=On light bg",
      props: { Label: "Loading" },
    },
    {
      label: "On dark bg",
      variant: "Color mode=On dark bg",
      props: { Label: "Loading" },
    },
  ],

  // Property 1 is single-valued ("Default"); Orientation is a USAGE-doc
  // concept driven entirely by a prop, not a registry axis, so the generic
  // derivation would only ever show one (vertical) card. Curate both
  // orientations so the gallery demonstrates the horizontal rail too.
  "scroll-bar": [
    {
      label: "Vertical",
      variant: "Property 1=Default",
      props: { Label: "Content list" },
    },
    {
      label: "Horizontal",
      variant: "Property 1=Default",
      props: { Label: "Content list", Orientation: "Horizontal" },
    },
  ],

  // State is link's only axis and is secondary (isSecondaryAxis), so the
  // generic derivation's 5-cap + name-derived Label would drop Visited (a
  // captured, token-driven color) and show the state name itself as the
  // clickable text ("Hover", "Pressed", ...). Curate all 7 with one
  // consistent, realistic label so the gallery reads as real link text
  // and every captured/reasoned state modifier is visible.
  link: [
    {
      label: "Default",
      variant: "State=Default",
      props: { Label: "View details" },
    },
    {
      label: "Hover",
      variant: "State=Hover",
      props: { Label: "View details" },
    },
    {
      label: "Focus",
      variant: "State=Focus",
      props: { Label: "View details" },
    },
    {
      label: "Pressed",
      variant: "State=Pressed",
      props: { Label: "View details" },
    },
    {
      label: "Expanded",
      variant: "State=Expanded",
      props: { Label: "View details" },
    },
    {
      label: "Visited",
      variant: "State=Visited",
      props: { Label: "View details" },
    },
    {
      label: "Disabled",
      variant: "State=Disabled",
      props: { Label: "View details" },
    },
  ],

  // Type is the identity axis, but the generic derivation would feed
  // props:{Label:<value>} which the case never reads (it reads
  // Initials/Count) -- every card would silently fall back to the default
  // "AV" initials and a Count of 3, never showing the +N overflow. Curate
  // real initials + a Count>4 group so the overflow chip is visible, plus
  // an explicit Disabled cell.
  avatar: [
    { label: "Default", variant: "Type=Default", props: { Initials: "CF" } },
    {
      label: "One group",
      variant: "Type=One group",
      props: { Initials: "CF", Count: "6" },
    },
    {
      label: "Two groups",
      variant: "Type=Two groups",
      props: { Initials: "CF", Count: "3" },
    },
    {
      label: "Disabled",
      variant: "Type=Default, State=Disabled",
      props: { Initials: "CF" },
    },
  ],

  // State is a secondary axis (isSecondaryAxis), so the generic derivation
  // would feed only props:{Label:"Collapsed"|"Expanede"} -- the case reads
  // Title/Body, not Label, so both cards would render the same fallback
  // title with no body. Curate two real cells (mirrors the empty-state
  // override's rationale). The "Expanede" value is the literal registry
  // typo -- see the case comment.
  "collapse-accordion": [
    {
      label: "Collapsed",
      variant: "State=Collapsed",
      props: { Title: "Advanced settings" },
    },
    {
      label: "Expanded",
      variant: "State=Expanede",
      props: {
        Title: "Advanced settings",
        Body: "Configure retention, encryption, and scheduling for this dataset.",
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
