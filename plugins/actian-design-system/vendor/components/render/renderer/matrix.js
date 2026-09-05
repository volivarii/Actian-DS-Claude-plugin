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
var DS_MAP_PATH = path.resolve(__dirname, "html-renderers", "ds-html-map.js");
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
      'matrix.js: no `case "<slug>":` branches found in ' +
        DS_MAP_PATH +
        " -- the render-slug derive found nothing, which would silently empty " +
        "RENDER_SLUGS and skip every render. Check the switch or this parser.",
    );
  return out.sort();
}
var RENDER_SLUGS = readRenderSlugs();

// Which CSS class prefixes each render slug owns in ds-base.css.
//
// Only the 28 slugs whose class is NOT `ds-<slug>` appear here; everything
// else falls back to that default via ownedPrefixes() below. The map is the
// TRUTH and the fragment is the drift detector, not the other way round:
// tests/render/css-owners.test.js asserts every declared prefix is a class
// the fragment actually emits and resolves to at least one ds-base.css rule,
// so a render that renames its class reds the build instead of silently
// losing its token surface and its fidelity check.
//
// Auto-deriving this from the fragment does NOT work, and `modal` is the
// counterexample: its fragment root is `.ds-modal-backdrop` wrapping the real
// component root `.ds-modal`, so "first ds-* class in document order" picks
// the wrapper. ds-base.css carries rules for both. A pure derive would
// attribute modal's 5 real rules to a 1-rule wrapper and report a plausible
// wrong answer, which is exactly the failure class this work exists to end.
// modal itself has no entry below: the plain ds-<slug> fallback already
// resolves to the correct root class (ds-modal), so a hand-declared entry
// here would only restate that default (which the redundancy test below
// forbids). It is cited as the reason the map is hand-declared, not as a
// slug that needs one of its own.
//
// As of the 2026-08-12 fold-in, NO slug owns two prefixes and no prefix is
// claimed by more than one slug. `tag-stage` used to be both: it emitted
// `class="ds-tag ds-tag-stage ds-tag--orange ds-tag-stage--orange"` so its own
// scoped modifier could override the shared hue for itself alone, and `.ds-tag`
// was claimed by five tag-family members at once. Figma folded all five into
// tag-read-only's single `Type` axis, so `.ds-tag` now has exactly one owner and
// the family-scope handling in the fidelity classifier (shared-base-no-single-
// subject, the subjectKey cascade collapse) has no subject in this corpus --
// tests/render/css-owners.test.js enumerates that population so it can never be
// checked vacuously, and tests/render/fidelity-check.test.js proves those
// properties on a fixture instead.
var CSS_OWNERS = {
  "global-header-account-dropdown": ["ds-account-menu"],
  "alert-banner": ["ds-alert"],
  "app-switcher-dropdown": ["ds-app-switcher"],
  breadcrumb: ["ds-breadcrumbs"],
  "card-for-grouped-content": ["ds-card-grouped"],
  "card-for-perimeter": ["ds-card-perimeter"],
  "digram-item-types": ["ds-item-type"],
  "digram-topic": ["ds-topic"],
  "dropdown-select-default": ["ds-dropdown-select"],
  "global-header": ["ds-header"],
  "lineage-grouped-node": ["ds-lineage-group"],
  "lineage": ["ds-lineage-node"],
  "notification-dropdown": ["ds-notification-menu"],
  "progress-bar-small": ["ds-progress"],
  "search-dropdown-menu": ["ds-search-menu"],
  "segmented-control": ["ds-segmented"],
  "side-nav": ["ds-sidenav"],
  "read-only-tag": ["ds-tag"],
  "text-input": ["ds-field"],
  "whats-new-dropdown": ["ds-whatsnew"],
};

function ownedPrefixes(slug) {
  return CSS_OWNERS[slug] || ["ds-" + slug];
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

// Every value of a slug's single published identity axis, as matrix cells.
//
// The one thing MATRIX_OVERRIDES is used for that is NOT curation: "show the
// whole identity axis, not the generic 5-cell cap". Written out, that override
// is a hand-copy of the registry's own value list, and both tag overrides that
// used to be written out went stale the moment Figma renamed their axis --
// still green, still rendering cells for a deleted axis, because a curated
// override is authoritative for the gallery by design. Derived here so the copy
// does not exist.
//
// Deliberately narrow: it requires exactly ONE variant axis, so a slug whose
// gallery needs a real choice between axes (button's Intent x Emphasis) cannot
// reach it by accident and keeps its hand-authored cells. A slug that stops
// meeting that precondition returns [] and falls through to the generic path,
// which caps at 5 -- fewer cells, never fabricated ones.
function allIdentityValueCells(slug) {
  var comp = findComponent(slug);
  var variants = (comp && comp.variants) || {};
  var axes = Object.keys(variants).filter(function (a) {
    return Array.isArray(variants[a]) && variants[a].length;
  });
  if (axes.length !== 1) return [];
  var axis = axes[0];
  var reduced = structurallyReducedProps(slug);
  return variants[axis].map(function (value) {
    var props = { Label: value };
    // A variant the capture reports as having FEWER children than the canonical
    // node is missing one, and the renderer must not draw it. See
    // structurallyReducedProps for why this is read rather than hardcoded.
    Object.keys(reduced[value] || {}).forEach(function (k) {
      props[k] = reduced[value][k];
    });
    return {
      label: value,
      variant: axis + "=" + value,
      props: props,
    };
  });
}

// Per-variant prop overrides for the values the CAPTURE reports as structurally
// reduced: `quality.structuralVariants` entries whose reason is a child-count
// shortfall (`childCount:<canonical>!=<actual>`, actual < canonical).
//
// Why this exists at all. tag-read-only's Type=Shared has 1 child where the
// canonical node has 2, and the missing one is the leading icon: the pre-sync
// tag-shared capture had exactly one child (`Shared`, a text node) and the
// retired tag-shared case rendered label-only. The 2026-08-12 fold-in gave the
// renderer a default-TRUE "Leading icon show", so Shared started rendering a "+"
// glyph the design system does not contain. THE FIDELITY GATE CANNOT SEE THIS:
// it compares colours, and a spurious icon span carries none, so `mismatch`
// stays 0 through it forever. Measurement was never going to catch it.
//
// Read, not hardcoded, on two counts:
//  - WHICH values: from `quality.structuralVariants`. Shared is the only flagged
//    value today, so an `if (type === "shared")` would look identical right now
//    and diverge in silence the moment Figma flags another.
//  - WHICH prop: the registry's own default-TRUE BOOLEAN props, by their real
//    keys (`Leading icon show#7276:0`), which the renderer's normalizeProps
//    aliases to the base name a case reads. So no prop name is typed here either.
//
// Applied ONLY when the mapping is unambiguous -- the shortfall must equal the
// number of default-true booleans (1 = 1 today). A component with two optional
// children and a shortfall of one does not say WHICH is absent, and turning both
// off would be a confident wrong answer. That precondition is asserted by
// tests/render/ds-html-map.test.js ("a Type the capture flags as structurally
// reduced renders no leading icon"), so it reds there rather than silently
// mis-suppressing here.
//
// Scope, stated because it is a real limit and not a hidden one: this drives the
// variant MATRIX, so it covers every matrix-rendered surface -- the canonical
// render, the gallery, the fragments the docs site ships, and the producer index
// the fidelity gate builds. A hand-authored flow node that names Type=Shared and
// passes no props still reaches the renderer's default-true branch; fixing that
// needs the capture at render time, which this fs-free, browser-capable renderer
// only has through an injected seam that no caller fills today (an unfilled seam
// would put the glyph straight back, silently).
var ANATOMY_DIR = path.resolve(__dirname, "..", "..", "dist", "anatomy");
var _anatomyCache = {};
function readAnatomy(slug) {
  if (slug in _anatomyCache) return _anatomyCache[slug];
  try {
    _anatomyCache[slug] = JSON.parse(
      fs.readFileSync(path.join(ANATOMY_DIR, slug + ".json"), "utf8"),
    );
  } catch (e) {
    _anatomyCache[slug] = null;
  }
  return _anatomyCache[slug];
}

function structurallyReducedProps(slug) {
  var anatomy = readAnatomy(slug);
  var flags = ((anatomy && anatomy.quality) || {}).structuralVariants || [];
  if (!flags.length) return {};
  var comp = findComponent(slug);
  var defaultTrueBooleans = Object.keys((comp && comp.properties) || {}).filter(
    function (k) {
      var p = comp.properties[k];
      return p && p.type === "BOOLEAN" && p.default === true;
    },
  );
  var out = {};
  flags.forEach(function (entry) {
    var m = /^childCount:(\d+)!=(\d+)$/.exec(String(entry.reason || ""));
    if (!m) return;
    var shortfall = Number(m[1]) - Number(m[2]);
    if (shortfall <= 0) return;
    if (defaultTrueBooleans.length !== shortfall) return;
    out[entry.value] = out[entry.value] || {};
    defaultTrueBooleans.forEach(function (k) {
      out[entry.value][k] = false;
    });
  });
  return out;
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
  // The capture holds one text node reading "Info" on the default variant
  // (Type=Info), so in the design file the message mirrors the type name.
  // Anatomy captures only the default variant, so the same rule is applied to
  // the other three rather than repeating one message across four cells.
  // Action: "Button" is Figma's own placeholder label on the nested Button
  // instance, shown in the default capture. It is SPECIMEN content and lives
  // here rather than as a renderer fallback, so a caller who asks for no
  // optional parts is not handed the word "Button".
  "alert-banner": [
    {
      label: "Info",
      variant: "Type=Info",
      props: { Message: "Info", Action: "Button" },
    },
    {
      label: "Success",
      variant: "Type=Success",
      props: { Message: "Success", Action: "Button" },
    },
    {
      label: "Warning",
      variant: "Type=Warning",
      props: { Message: "Warning", Action: "Button" },
    },
    {
      label: "Error",
      variant: "Type=Error",
      props: { Message: "Error", Action: "Button" },
    },
  ],

  // The default capture (components/dist/media/action-bar/default.webp) pins a
  // destructive `Delete` left of Cancel/Save. Without a specimen that fills it,
  // the leading slot exists in the renderer and appears in no fragment, which is
  // how a slot goes back to being invisible.
  "action-bar": [
    {
      label: "Default",
      variant: "",
      props: { Destructive: "Delete" },
    },
  ],

  // The default capture shows eight items: `Home`, an elided `…`, five `Link`s
  // and the current page, each but the first carrying a Dataset item-type badge
  // reading `Ds`. The generic derivation produced three plain crumbs, so the
  // fragment showed neither the badge slot nor the overflow.
  breadcrumb: [
    {
      label: "Default",
      variant: "",
      props: {
        Items: "Home, …, Link, Link, Link, Link, Link, Current page",
        Badges: ["", "", "Ds", "Ds", "Ds", "Ds", "Ds", "Ds"],
        BadgeType: "Dataset",
      },
    },
  ],

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

  // tag-read-only's identity axis has more than 5 values, so the generic cap
  // would drop most of them; the axis IS the component's identity here, so show
  // every value. DERIVED, not listed: this used to spell out nine Color names,
  // and the 2026-08-12 fold-in replaced Color with a 14-value Type axis --
  // leaving the override rendering nine cells for an axis Figma had deleted,
  // which is the fabrication invariant 10 exists to catch. Deriving removes the
  // failure mode instead of testing for it (invariant 10 keeps guarding the
  // overrides that really are curated, below).
  "read-only-tag": allIdentityValueCells("read-only-tag"),

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

  // Same rationale, same derive, as tag-read-only above. tag-stage, tag-status
  // and tag-glossary-item-type had overrides here until the 2026-08-12 sync
  // retired all three into tag-read-only's Type axis; tag-catalog-item-type's
  // eight hand-listed `Type=` values went with the rename, since the renamed
  // component publishes 28 values on a `Property 1` axis instead. Every value
  // is a distinct colored pill, i.e. the component's identity, so the whole
  // axis is shown.
  "item-type-tag": allIdentityValueCells("item-type-tag"),

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
  "drawer": [
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
  "collapse": [
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

// Specimen content for the gallery: per slug, the props every one of its matrix
// cells should carry.
//
// THE LAYER SEPARATION, which is why this map exists here and not in the
// renderer. ds-html-map.js says what a component DOES with the props it is
// given, and part of that answer is that an optional part is absent when its
// prop is: a page-header with no description is a real page-header, and a
// caller generating a screen must be able to ask for one. matrix.js says what
// the GALLERY should SHOW, and an empty description slot is a poor specimen.
// Two different questions. #543 answered the second one inside the renderer, by
// turning thirteen optional slots into unconditional elements with literal
// fallbacks, and in doing so answered the first one wrongly: every generated
// page-header grew a "Support text", every toggle a "Description", every date
// input a "Use MM/DD/YYYY.", with no way to turn them off. The strings below
// are those, moved to the layer that actually wanted them.
//
// #544 moved twelve. The thirteenth wore a different shape (a variable
// initialised to the literal, not a `props.X ? el : ""` conditional) and went on
// shipping in the renderer, because the omission test that guards this map
// ITERATES this map, so a slot missing here was a slot nothing checked. The
// guard that needs no list is tests/render/sparse-render-ratchet.test.js: it
// renders every slug with no props at all and fails when one starts producing
// parts it did not before.
//
// Provenance travels with the value, in the words it had in the renderer:
// `capture:` quotes components/dist/anatomy/<slug>.json, `authored:` means the
// capture holds no such string, `substituted:` means it holds one that must not
// ship.
//
// NOT MATRIX_OVERRIDES. An override REPLACES a slug's whole cell list, so
// reaching for one to add a single prop would silently change which variant
// values the gallery renders. These props are MERGED into whatever cells
// variantMatrix derives, and they LOSE to a prop the cell already sets.
var SPECIMEN_PROPS = {
  // capture: anatomy/radio.json text layer "Description"
  radio: { "Helper text": "Description" },

  // authored: toggle has no helper layer in the capture; mirrors radio's
  // captured "Description" so the two form controls read consistently
  toggle: { "Helper text": "Description" },

  // capture: anatomy/page-header.json layer "Suppot text" [sic] reads "Support text"
  "page-header": { Description: "Support text" },

  // authored: the capture holds a title ("Edit description") and a Body
  // container, but that container holds only a nested "Rich text" instance with
  // no text to extract, so there is no captured string
  modal: {
    Body: "Update the description so teammates know what this connection is for.",
  },

  // capture: anatomy/toast.json nested button label "Close"
  toast: { Action: "Close" },

  // capture: anatomy/stepper.json layer "Body" reads "Optional body"
  stepper: { Body: "Optional body" },

  // authored: the capture holds "Date", "*" and "mm/dd/yyyy" but no helper layer
  "calendar": { Helper: "Use MM/DD/YYYY." },

  "dropdown-select-default": {
    // capture: anatomy/dropdown-select-default.json layer "description"
    Description:
      "A description helps users to define and understand the purpose of the input.",
    // capture: anatomy/dropdown-select-default.json layer "helper text"
    Helper: "Helper text goes here",
  },

  popover: {
    // capture: anatomy/popover.json layer "Header"
    Title: "Interaction guide",
    // capture: anatomy/popover.json layer "description"; the capture holds two
    // sentences joined by U+2028 line separator characters, normalised here to a
    // single space so no raw line separator reaches the rendered markup
    Body: "Explore this asset’s upstream sources and downstream consumers, as well as the transformations connecting them across the data pipeline. Learn how to navigate data lineage using mouse and keyboard controls.",
  },

  // substituted, not captured: anatomy/global-header-account-dropdown.json holds what reads as
  // a real person's name and address at an external domain. Shipping that as
  // specimen content in a customer-facing bundle is not acceptable, so the
  // structure is kept and the address replaced.
  "global-header-account-dropdown": { Email: "account.user@example.com" },
};

// Merge, never replace, and never in place: a cell's own prop wins, and the
// returned cells are fresh objects so a caller that mutates what it gets back
// cannot reach into MATRIX_OVERRIDES. Applied on every exit of variantMatrix,
// including the override and single-stub paths, so "the gallery shows this
// content" holds for a slug however its cells were arrived at.
function withSpecimenProps(slug, cells) {
  var specimen = SPECIMEN_PROPS[slug];
  if (!specimen) return cells;
  return cells.map(function (cell) {
    var props = {};
    Object.keys(specimen).forEach(function (k) {
      props[k] = specimen[k];
    });
    Object.keys(cell.props || {}).forEach(function (k) {
      props[k] = cell.props[k];
    });
    var out = {};
    Object.keys(cell).forEach(function (k) {
      out[k] = cell[k];
    });
    out.props = props;
    return out;
  });
}

function variantMatrix(slug) {
  // `.length` and not just presence: allIdentityValueCells returns [] when its
  // precondition stops holding (a slug that gained a second axis), and an empty
  // override taken as authoritative would render a card with ZERO cells --
  // invisible in a gallery, and a silent loss of the whole component. Falling
  // through to the generic path yields fewer cells, never no cells.
  if (MATRIX_OVERRIDES[slug] && MATRIX_OVERRIDES[slug].length)
    return withSpecimenProps(slug, MATRIX_OVERRIDES[slug]);
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
    return withSpecimenProps(slug, [
      { label: slug, variant: "", props: { Label: slug } },
    ]);
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
  return withSpecimenProps(slug, cells);
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
  SPECIMEN_PROPS: SPECIMEN_PROPS,
  CSS_OWNERS: CSS_OWNERS,
  ownedPrefixes: ownedPrefixes,
};
