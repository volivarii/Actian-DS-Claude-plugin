"use strict";

// appearance-specimen.js — pick a live specimen for the appearance-doc path.
//
// Several deliverable-level tests prove the captured-appearance renderer is
// wired by rendering ONE representative slug and asserting it came out as
// appearance HTML rather than a graceful chip. The slug itself was never the
// subject; it was only a specimen that had to be non-BUILT (BUILT slugs take
// their bespoke ds-html-map leaf instead) and carry usable anatomy.
//
// Those specimens used to be hardcoded ("tag-status", "link"). The
// gray-box-to-zero programme is deliberately converting non-BUILT slugs into
// BUILT ones slice by slice (knowledge #465 built `link`, #472 built
// `tag-status` and `avatar`), so every hardcoded specimen eventually becomes
// BUILT and reds these tests for a reason that is not a regression. Picking
// the specimen at run time from whatever is still on the appearance path
// keeps the assertion pointed at the wiring instead of at a slug name.
//
// The population is asserted non-empty on purpose. When gray-box finishes and
// nothing is left on the appearance path, these tests must fail loudly and be
// retired or repointed, not pass vacuously against zero specimens.

var fs = require("node:fs");
var path = require("node:path");

var ANATOMY_DIR = path.join(__dirname, "../../vendor/components/dist/anatomy");

function loadAnatomyDocs() {
  var docs = {};
  fs.readdirSync(ANATOMY_DIR)
    .filter(function (f) {
      return f.endsWith(".json");
    })
    .sort() // deterministic: same specimen on every run and every machine
    .forEach(function (f) {
      var slug = f.replace(/\.json$/, "");
      docs[slug] = JSON.parse(
        fs.readFileSync(path.join(ANATOMY_DIR, f), "utf8"),
      );
    });
  return docs;
}

// Slugs still served by the appearance path: they have an anatomy doc and no
// bespoke BUILT leaf shadowing it.
function nonBuiltSlugs(builtSlugs) {
  var docs = loadAnatomyDocs();
  return Object.keys(docs).filter(function (slug) {
    return builtSlugs.indexOf(slug) === -1;
  });
}

// First non-BUILT slug (deterministic order) for which `isUsable(slug, doc)`
// holds. Callers supply the usability predicate because "usable" differs per
// test: one needs buildDsAnatomyDocMap to yield a doc, another needs a
// resolved background colour to assert against.
function pickSpecimen(builtSlugs, isUsable) {
  var docs = loadAnatomyDocs();
  var candidates = nonBuiltSlugs(builtSlugs);
  if (!candidates.length) {
    throw new Error(
      "no non-BUILT slugs remain on the appearance path — the appearance-doc " +
        "tests have no subject left; retire or repoint them rather than " +
        "letting them pass against an empty population",
    );
  }
  for (var i = 0; i < candidates.length; i++) {
    if (isUsable(candidates[i], docs[candidates[i]])) {
      return { slug: candidates[i], doc: docs[candidates[i]] };
    }
  }
  throw new Error(
    "none of the " +
      candidates.length +
      " non-BUILT slugs satisfied the specimen predicate (checked: " +
      candidates.join(", ") +
      ")",
  );
}

// The first resolved background hex anywhere in a doc's tree. Appearance
// rendering emits resolved values, never `var(--token)` references, so this
// hex is what the rendered output must contain — a data-derived oracle rather
// than a hardcoded colour that goes stale when the capture is re-synced.
function firstResolvedBackground(node) {
  if (!node || typeof node !== "object") return null;
  var ap = node.appearance || {};
  if (typeof ap.background === "string" && /^#[0-9a-fA-F]{3,8}$/.test(ap.background)) {
    return ap.background;
  }
  var kids = node.children || [];
  for (var i = 0; i < kids.length; i++) {
    var hit = firstResolvedBackground(kids[i]);
    if (hit) return hit;
  }
  return null;
}

module.exports = {
  ANATOMY_DIR: ANATOMY_DIR,
  loadAnatomyDocs: loadAnatomyDocs,
  nonBuiltSlugs: nonBuiltSlugs,
  pickSpecimen: pickSpecimen,
  firstResolvedBackground: firstResolvedBackground,
};
