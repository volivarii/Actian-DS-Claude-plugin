// tests/renderers/appearance-render-realdata.test.js
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var r = require("../../scripts/renderers/appearance-render.js");
var as = require("../../scripts/renderers/appearance-style.js");

var ANATOMY_DIR = path.join(__dirname, "../../vendor/components/dist/anatomy");

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
var NO_ROOT_APPEARANCE = {
  // Brand art and imagery: raster/vector assets, no styled root frame.
  "actian-data-intelligence": "brand asset",
  "actian-data-observability": "brand asset",
  "actian-pyramid": "brand asset",
  "data-intelligence-dev-logo": "brand asset",
  "white-label-merck-favicon": "brand asset",
  "zeenea-logo": "brand asset",
  illustration: "illustration, not a styled component",
  "background-explore": "decorative background art",
  "component-1": "unnamed Figma scratch component",

  // Motion / skeleton: the visible surface lives on animated children.
  spinner: "root is a bare wrapper; the arc child carries the paint",
  "loading-skeleton": "shimmer lives on the children",
  "loader-with-logo": "root wraps a logo child",
  "progress-bar-small": "track and fill are children",
  "scroll-bar": "thumb child carries the paint",
  "lineage-connecting-line": "a stroked path, no root surface",

  // Layout containers: transparent by design, children carry the paint.
  breadcrumbs: "transparent row of links",
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
  // radio-button JOINED this list in the 2026-07 Figma form-control rework
  // (knowledge sync #378), which is what made the old frozen count fail at 55.
  // Recorded here rather than papered over by a looser threshold. If the rework
  // was NOT meant to strip its root appearance, that is a substrate bug and this
  // entry should be deleted, not kept.
  "radio-button":
    "indicator is a child (2026-07 rework; VERIFY this was intended)",
  "checkbox-with-label": "box is a child",
  toggle: "track and knob are children",
  "text-input": "field box is a child",
  "input-date": "field box is a child",
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
    return !NO_ROOT_APPEARANCE[s];
  });
  assert.deepEqual(
    unexpected,
    [],
    "these slugs LOST their root appearance and are not in the allowlist: " +
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
