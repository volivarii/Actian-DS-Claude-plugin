// tests/renderers/appearance-icon-orphan-gate.test.js
// F2 — data-driven icon-slug orphan gate. Walks every vendored anatomy doc
// (components/dist/anatomy/*.json — the per-component tree; the roll-up
// anatomy.bundle.json lives one level up at components/dist/ and is
// naturally excluded by scoping to this subdirectory), collects every
// kind:"instance" node carrying a non-null `slug`, and asserts each slug
// resolves in the vendored icons.json.
//
// Why kind:"instance" (not "icon"/"vector"): the F2 scouting pass confirmed
// anatomy docs never emit kind:"icon" or kind:"image" for real glyphs — they
// arrive as kind:"instance" nodes (a nested DS component reference) with a
// `slug` set when the anatomy sync resolved one. kind:"vector" nodes are
// decorative paths, not icon-component instances, and must never be treated
// as icon-bearing — see appearance-render.js's renderIconGlyph, which is
// gated to kind:"instance"/"icon" only.
//
// This is a DATA gate (walks vendored JSON), distinct from
// ds-html-map.test.js's "orphan-ref gate" (a STATIC source-scan of literal
// renderIcon("slug") call sites in ds-html-map.js). Starts green: as of this
// writing, 321 total instance nodes, 32 with a non-null slug, resolving to 8
// distinct glyphs, all present in icons.json. Guards future vendor refreshes
// from silently introducing an unresolvable icon slug — renderIconGlyph()
// never throws on a miss, so without this gate an orphaned slug would
// silently degrade to the neutral-box placeholder with zero test signal.
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var PATHS = require("../../scripts/lib/paths.js");

var ANATOMY_DIR = path.join(__dirname, "../../vendor/components/dist/anatomy");

function collectSluggedInstances(node, out, docSlug) {
  if (!node || typeof node !== "object") return;
  if (node.kind === "instance" && node.slug != null) {
    out.push({ slug: node.slug, doc: docSlug, id: node.id });
  }
  if (Array.isArray(node.children)) {
    node.children.forEach(function (c) {
      collectSluggedInstances(c, out, docSlug);
    });
  }
}

test("every vendored anatomy kind:instance node's slug resolves in icons.json (F2 orphan gate)", function () {
  var files = fs.readdirSync(ANATOMY_DIR).filter(function (f) {
    return f.endsWith(".json");
  });
  assert.ok(files.length > 0, "expected vendored anatomy docs to be present");

  var icons =
    JSON.parse(fs.readFileSync(PATHS.components.icons.svg, "utf8")).icons ||
    {};

  var found = [];
  files.forEach(function (f) {
    var slug = f.replace(/\.json$/, "");
    var doc = JSON.parse(fs.readFileSync(path.join(ANATOMY_DIR, f), "utf8"));
    collectSluggedInstances(doc.root, found, slug);
  });

  assert.ok(
    found.length > 0,
    "expected at least one kind:instance node with a non-null slug across " +
      "vendored anatomy (F2's real-glyph corpus) — got 0; either the vendor " +
      "snapshot changed shape or this gate is no longer exercising anything",
  );

  var missing = found.filter(function (f) {
    return !(f.slug in icons);
  });

  assert.deepEqual(
    missing,
    [],
    "instance node slug(s) not resolvable in vendored icons.json (would " +
      "silently render the neutral-box placeholder instead of a real " +
      "glyph): " +
      missing
        .map(function (m) {
          return m.slug + " (doc: " + m.doc + ", id: " + m.id + ")";
        })
        .join(", "),
  );
});
