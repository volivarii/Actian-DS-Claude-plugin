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
    JSON.parse(fs.readFileSync(PATHS.components.icons.svg, "utf8")).icons || {};

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

  // Acceptance mirrors renderIconGlyph's real predicate (appearance-render.js):
  // an entry must be own-property present AND carry string viewBox + body, or
  // the renderer treats it as unresolved and falls through to the placeholder.
  // A prototype-chain hit (e.g. slug "toString"/"constructor") or a malformed
  // entry (missing/non-string viewBox or body) must FAIL this gate the same
  // way a wholly-absent slug does.
  function resolvable(slug) {
    if (!Object.prototype.hasOwnProperty.call(icons, slug)) return false;
    var icon = icons[slug];
    return (
      icon != null &&
      typeof icon.viewBox === "string" &&
      typeof icon.body === "string"
    );
  }

  var missing = found.filter(function (f) {
    return !resolvable(f.slug);
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

// Supply-chain tripwire: every icon entry actually referenced by an anatomy
// slug is trusted verbatim into rendered HTML (appearance-render.js's
// renderIconGlyph interpolates icon.body directly into the SVG markup with no
// sanitization — see its C3-style denylist reasoning for appearance decls,
// which does NOT cover icon body). A compromised or malformed vendor refresh
// smuggling a <script> tag into a referenced icon's body would execute in
// every generated preview. Guard it here, scoped to icons actually reachable
// from vendored anatomy (not the full 142-icon set, most of which are never
// instantiated by anatomy today).
test("every icon.json entry referenced by vendored anatomy has no <script> in its body (F2 supply-chain tripwire)", function () {
  var files = fs.readdirSync(ANATOMY_DIR).filter(function (f) {
    return f.endsWith(".json");
  });
  var icons =
    JSON.parse(fs.readFileSync(PATHS.components.icons.svg, "utf8")).icons || {};

  var referenced = [];
  files.forEach(function (f) {
    var slug = f.replace(/\.json$/, "");
    var doc = JSON.parse(fs.readFileSync(path.join(ANATOMY_DIR, f), "utf8"));
    collectSluggedInstances(doc.root, referenced, slug);
  });

  var offenders = [];
  referenced.forEach(function (r) {
    if (!Object.prototype.hasOwnProperty.call(icons, r.slug)) return;
    var icon = icons[r.slug];
    if (icon && typeof icon.body === "string" && /<script/i.test(icon.body)) {
      offenders.push(r.slug);
    }
  });

  assert.deepEqual(
    offenders,
    [],
    "icon body containing <script> for referenced slug(s): " +
      offenders.join(", "),
  );
});
