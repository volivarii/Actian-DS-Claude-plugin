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

test("slugs with root appearance emit at least one value declaration", function () {
  var withAppearance = docs().filter(function (d) {
    return d.doc.root && d.doc.root.appearance;
  });
  assert.ok(
    withAppearance.length >= 56,
    "expected many appearance-bearing slugs, got " + withAppearance.length,
  );
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
