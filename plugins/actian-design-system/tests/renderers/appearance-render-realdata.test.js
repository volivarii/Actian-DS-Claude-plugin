// tests/renderers/appearance-render-realdata.test.js
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var r = require("../../scripts/lib/renderer.js").appearanceRender;
var as = require("../../scripts/lib/renderer.js").appearanceStyle;

var ANATOMY_DIR = path.join(__dirname, "../../vendor/components/dist/anatomy");
var REGISTRY = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../vendor/components/dist/registries/dskit.json"),
    "utf8",
  ),
).components;

function docs() {
  return fs
    .readdirSync(ANATOMY_DIR)
    .filter(function (f) {
      return f.endsWith(".json");
    })
    .map(function (f) {
      return {
        slug: f.replace(/\.json$/, ""),
        doc: JSON.parse(fs.readFileSync(path.join(ANATOMY_DIR, f), "utf8")),
      };
    });
}

test("every vendored anatomy renders without throwing", function () {
  docs().forEach(function (d) {
    var variant =
      d.doc.root && d.doc.root.name && d.doc.root.name.indexOf("=") !== -1
        ? parseName(d.doc.root.name)
        : null;
    var html;
    assert.doesNotThrow(function () {
      html = r.renderAppearanceComponent(d.doc, { variant: variant });
    }, d.slug);
    assert.ok(typeof html === "string" && html.length > 0, d.slug);
  });
});

// Appearance-only CSS properties: the exact set appearanceToDecls() can emit
// (appearance-style.js). Layout/flexStyle() never emits any of these — it
// only emits display/flex-direction/gap/padding/justify-content/align-items
// — so a match here cannot be satisfied by layout output alone. This makes
// the assertion fail if appearance rendering collapses, unlike a bare
// /style="/ check (which flexStyle() alone would still satisfy).
var APPEARANCE_ONLY_CSS =
  /(?:background|border|border-radius|color|font-size|font-weight|line-height|letter-spacing):/;

// Direct/unmasked check: does the appearance layer itself (not the rendered
// HTML string) yield a declaration anywhere in this node's subtree? A doc
// qualifies as "root appearance" when d.doc.root.appearance is truthy, but
// some real components (e.g. dropdown-select-default, radio-button) carry
// their root `appearance` object as PURELY variant-conditional deltas with
// no base value — the root itself resolves to zero decls for the default
// variant, while a descendant node (e.g. the visible box/indicator) carries
// the actual background/border. Walking the subtree keeps the check tied to
// the module's real functions (not a regex over HTML) while staying true to
// how these components are actually structured.
function subtreeYieldsDecls(node, variant) {
  if (!node || typeof node !== "object") return false;
  var decls = as.appearanceToDecls(r.resolveNodeAppearance(node, variant));
  if (decls.length > 0) return true;
  if (Array.isArray(node.children)) {
    return node.children.some(function (c) {
      return subtreeYieldsDecls(c, variant);
    });
  }
  return false;
}

// Slugs whose anatomy root legitimately carries NO appearance, each with the
// reason it is exempt. This replaces an older `>= 56` assertion, a magic number
// snapshotted from whatever the substrate held that day.
//
// Why an allowlist and not a count (or a ratio): the per-slug loop below can
// only inspect docs that HAVE a root appearance, so a doc that silently LOSES
// one drops out of the loop entirely and is never checked. The coverage
// assertion is therefore the only thing standing between us and a silent
// drop-out, and any threshold grants slack measured in whole components. An
// allowlist has zero slack: a new drop-out fails BY NAME, and a human either
// records why it is legitimate or fixes the substrate.
// ...and it covers COMPONENTS-section slugs only. "The root carries paint" is a
// component expectation. A product logo, an illustration or a Foundations page
// entry has no root surface by construction: the paint is in its vector
// children. Those used to be hand-listed here too (8 brand assets), which held
// for as long as the anatomy phase captured 8 of them. The v0.34.122 bump
// captured 104, so the hand-list became the failure: ~95 connector logos
// (snowflake, tableau, db2, ...) plus the new Foundations pages reported as
// having "LOST their root appearance", and the vendor PR stayed red.
//
// Exempting them by SECTION instead of by name is derived from the registry, so
// the next batch of connector logos cannot red this gate, and the list below
// keeps holding only what it is good at: per-component decisions. A slug absent
// from the registry is deliberately NOT exempt, so a mystery doc still fails.
function isComponentsSection(slug) {
  var entry = REGISTRY[slug];
  return !entry || entry.section === "Components";
}

var NO_ROOT_APPEARANCE = {
  "component-1": "unnamed Figma scratch component",

  // Motion / skeleton: the visible surface lives on animated children.
  spinner: "root is a bare wrapper; the arc child carries the paint",
  "loading-skeleton": "shimmer lives on the children",
  "loader-with-logo": "root wraps a logo child",
  "progress-bar-small": "track and fill are children",
  "scroll-bar": "thumb child carries the paint",
  "lineage-connecting-line": "a stroked path, no root surface",

  // Layout containers: transparent by design, children carry the paint.
  breadcrumb: "transparent row of links",
  "page-header": "transparent layout band",
  stepper: "transparent row of steps",
  table: "cells and rows carry the paint",
  "empty-state": "transparent layout container",
  "error-state": "transparent layout container",
  "maintenance-state": "transparent layout container",
  confirmation: "transparent layout container",

  // Form controls. These carry their root `appearance` as PURELY
  // variant-conditional deltas with no base value (see subtreeYieldsDecls
  // above): the visible box or indicator is a child.
  //
  // radio JOINED this list in the 2026-07 Figma form-control rework
  // (knowledge sync #378), which is what made the old frozen count fail at 55.
  // Recorded here rather than papered over by a looser threshold. If the rework
  // was NOT meant to strip its root appearance, that is a substrate bug and this
  // entry should be deleted, not kept. Keyed `radio-button` until the 2026-07-23
  // sync renamed the Figma component to "Radio" (same dsKey).
  radio: "indicator is a child (2026-07 rework; VERIFY this was intended)",
  checkbox: "box is a child",
  toggle: "track and knob are children",
  "text-input": "field box is a child",
  // Third name for one component, same dsKey throughout: `input-date` until
  // the 2026-08-26 Figma v2.7.0 reorg made it "Date input"
  // (knowledge c8340c77), then `calendar-date-input`, and since the 2026-09-03
  // breaking sync simply `calendar`, taking the slug the calendar ICON used to
  // hold in the components map (knowledge #650). The icon survives in the icon
  // namespace, so nothing was lost there either.
  //
  // The capture is unchanged in shape across all three: verified against the
  // deleted `calendar-date-input.json` at knowledge 0e088405^, which carried no
  // root appearance either and painted on the same `Field` child. Same profile
  // as `text-input` two lines above. This is the same entry under the current
  // name, not a new loss.
  calendar: "field box is a child, same as text-input",

  // Arrived with the same reorg. Its root is a bare wrapper: the `Pagination`
  // child paints #ffffff and the Previous/Next buttons carry the borders, so
  // 4 of its 10 captured nodes paint and none of them is the root. Same
  // profile as spinner and progress-bar-small above.
  pagination: "root is a bare wrapper; the page buttons carry the paint",

  // These five were section:"Foundations" until the 2026-08 taxonomy repair
  // (knowledge #534 to #536) moved them from Figma PAGE-NAME categories
  // ("Base: label, message, field, textfield buttons") into section:"Components"
  // / category:"Form". Their anatomy is BYTE-IDENTICAL across that change, so
  // nothing was lost: this gate simply began examining them for the first time.
  // Each was checked individually rather than waved through as a family, and
  // each has the same shape as its already-listed siblings above.
  label: "text child carries the paint (root has none; Description child does)",
  "text-area": "field box is a child, same as text-input",
  message: "icon and text children carry the paint",
  // These two are layout wrappers around a SLOT ("Slot for input, selection"),
  // so nothing in the captured subtree paints at all, not the root and not any
  // of its 6 descendants. Same profile as the already-listed breadcrumb (15
  // descendants, 0 paint) and table (11, 0). Stated as what the capture shows
  // rather than as "the input child paints", which would send a future reader
  // hunting for a painting child that is not there.
  "checkbox-group": "layout wrapper around a slot; nothing in the subtree paints",
  "radio-group": "layout wrapper around a slot; nothing in the subtree paints",
};

test("no anatomy doc silently loses its root appearance", function () {
  var all = docs();
  assert.ok(
    all.length > 0,
    "no anatomy docs loaded at all: the vendored anatomy dist is missing",
  );

  var without = all
    .filter(function (d) {
      return !(d.doc.root && d.doc.root.appearance);
    })
    .map(function (d) {
      return d.slug;
    })
    .sort();

  var unexpected = without.filter(function (s) {
    return isComponentsSection(s) && !NO_ROOT_APPEARANCE[s];
  });
  assert.deepEqual(
    unexpected,
    [],
    "these COMPONENTS-section slugs LOST their root appearance and are not in " +
      "the allowlist: " +
      unexpected.join(", ") +
      ". Either the substrate regressed, or the loss is legitimate and belongs " +
      "in NO_ROOT_APPEARANCE with a reason.",
  );

  var stale = Object.keys(NO_ROOT_APPEARANCE)
    .filter(function (s) {
      return without.indexOf(s) === -1;
    })
    .sort();
  assert.deepEqual(
    stale,
    [],
    "these slugs now HAVE a root appearance and should be removed from the " +
      "NO_ROOT_APPEARANCE allowlist: " +
      stale.join(", "),
  );
});

test("slugs with root appearance emit at least one value declaration", function () {
  var all = docs();
  var withAppearance = all.filter(function (d) {
    return d.doc.root && d.doc.root.appearance;
  });
  withAppearance.forEach(function (d) {
    var variant = null;

    // 1. Direct: the appearance layer itself must yield a declaration
    // somewhere in the tree (not derived from the rendered HTML string).
    assert.ok(
      subtreeYieldsDecls(d.doc.root, variant),
      d.slug + " appearance yields no decls anywhere in the tree",
    );

    // 2. End-to-end: the rendered HTML must carry an appearance-only
    // property. Layout emits only display/flex-direction/gap/padding/
    // justify-content/align-items, so this cannot be a layout false-positive.
    var html = r.renderAppearanceComponent(d.doc, { variant: variant });
    assert.match(
      html,
      APPEARANCE_ONLY_CSS,
      d.slug + " should emit an appearance-derived CSS declaration",
    );
  });
});

function parseName(name) {
  var out = {};
  String(name)
    .split(",")
    .forEach(function (pair) {
      var i = pair.indexOf("=");
      if (i !== -1) out[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
    });
  return out;
}
