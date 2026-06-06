"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var PATHS = require("../../scripts/lib/paths.js");

// dskit categories that are NOT authorable UI components (icons + brand assets).
// The authorable UI surface = dskit minus these (≈76 components) — the real
// ceiling for the DS render tier (DS-native feeder), broader than the 22
// conversion-reachable slugs.
var NON_AUTHORABLE_CATEGORIES = new Set([
  "Icons",
  "Product logos",
  "Illustrations & graphics",
]);

// FM→DS CONVERSION coverage gate (one of two feeders into the shared DS render tier).
//
// The DS render tier (ds-html-map.js) is fed by two paths: (1) FM→DS CONVERSION —
// transform-to-hifi.js maps a fat-marker wireframe onto the DS slugs in
// fm-to-ds-map.json; and (2) DS-NATIVE authoring (future) — a generator that emits
// DS nodes directly, reaching the broader *authorable* dskit surface. This gate
// covers feeder (1) ONLY: every DS slug reachable via conversion must have a `case`
// in ds-html-map.js OR be in NOT_YET_IMPLEMENTED — so a mapping can never silently
// fall through to the graceful chip, and phase progress is visible. The DS-native
// authorable surface gets its own coverage gate when that feeder lands.
//
// Mirrors tests/integration/fm-coverage.test.js (the FM-tier equivalent).

var MAP = path.join(
  __dirname,
  "..",
  "..",
  "references",
  "convert-to-hifi",
  "fm-to-ds-map.json",
);
var DS_HTML_MAP = path.join(
  __dirname,
  "..",
  "..",
  "scripts",
  "renderers",
  "html-renderers",
  "ds-html-map.js",
);

// Slugs reachable from the map but not yet built as hi-fi renderers. SHRINK this
// as phases land (P1 forms, P2 display/feedback, P3 chrome). Empty = full parity.
var NOT_YET_IMPLEMENTED = new Set([
  // P1 — forms core
  "dropdown-select-default",
  "radio-button",
  "toggle",
  "input-date",
  "rich-text",
  // P2 — display / feedback
  "tag-interactive",
  "alert-banner",
  "notification",
  "progress-bar-small",
  "tooltip",
  "empty-state",
  "stepper",
  // P3 — chrome / structural
  "page-header",
  "modal",
]);

function reachableDsSlugs() {
  var map = JSON.parse(fs.readFileSync(MAP, "utf8"));
  var slugs = new Set();
  Object.keys(map.mappings || {}).forEach(function (fmRef) {
    var slug = map.mappings[fmRef].dsSlug;
    if (slug) slugs.add(slug);
  });
  return slugs;
}

function implementedCases() {
  var src = fs.readFileSync(DS_HTML_MAP, "utf8");
  var cases = new Set();
  var re = /case\s+"([^"]+)":/g,
    m;
  while ((m = re.exec(src))) cases.add(m[1]);
  return cases;
}

// The authorable UI surface = every dskit component NOT in an icon/brand-asset
// category. This is the real ceiling for the render tier (the DS-native feeder
// can author any of these directly — far beyond the 22 conversion-reachable).
function authorableDsSlugs() {
  var dskit = JSON.parse(
    fs.readFileSync(PATHS.components.registries.dskit, "utf8"),
  );
  var comps = dskit.components || {};
  var slugs = new Set();
  Object.keys(comps).forEach(function (slug) {
    if (!NON_AUTHORABLE_CATEGORIES.has(comps[slug].category)) slugs.add(slug);
  });
  return slugs;
}

test("every reachable DS slug has a renderer case or is allowlisted", function () {
  var reachable = reachableDsSlugs();
  var cases = implementedCases();

  var uncovered = [];
  reachable.forEach(function (slug) {
    if (cases.has(slug)) return;
    if (NOT_YET_IMPLEMENTED.has(slug)) return;
    uncovered.push(slug);
  });
  assert.deepEqual(
    uncovered.sort(),
    [],
    "DS slugs reachable from fm-to-ds-map.json with no renderer case " +
      "(implement them in ds-html-map.js or add to NOT_YET_IMPLEMENTED): " +
      uncovered.join(", "),
  );
});

test("no orphan renderer cases (every case is a real authorable DS component)", function () {
  // Validated against the AUTHORABLE dskit surface, not the conversion map — a
  // DS-native-only component (e.g. card-for-items, which has no FM mapping) is a
  // legitimate case, not an orphan. An orphan is a case whose slug isn't a real
  // authorable DS component at all (typo, or a renamed/removed component).
  var authorable = authorableDsSlugs();
  var cases = implementedCases();

  var orphans = [];
  cases.forEach(function (slug) {
    if (!authorable.has(slug)) orphans.push(slug);
  });
  assert.deepEqual(
    orphans.sort(),
    [],
    "ds-html-map.js has case(s) for slug(s) that are not authorable dskit " +
      "components (typo, or a component was renamed/removed): " +
      orphans.join(", "),
  );
});

test("NOT_YET_IMPLEMENTED stays valid (subset of reachable, none already built)", function () {
  var reachable = reachableDsSlugs();
  var cases = implementedCases();

  var bogus = [];
  var stale = [];
  NOT_YET_IMPLEMENTED.forEach(function (slug) {
    if (!reachable.has(slug)) bogus.push(slug);
    if (cases.has(slug)) stale.push(slug);
  });
  assert.deepEqual(
    bogus.sort(),
    [],
    "NOT_YET_IMPLEMENTED lists slug(s) not reachable from the map: " +
      bogus.join(", "),
  );
  assert.deepEqual(
    stale.sort(),
    [],
    "NOT_YET_IMPLEMENTED lists slug(s) that ARE implemented — remove them: " +
      stale.join(", "),
  );
});
