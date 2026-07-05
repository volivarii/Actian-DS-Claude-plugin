// tests/renderers/appearance-icon-orphan-gate.test.js
// F2 — data-driven icon-slug invariant gate. Walks every vendored anatomy doc
// (components/dist/anatomy/*.json — the per-component tree; the roll-up
// anatomy.bundle.json lives one level up at components/dist/ and is
// naturally excluded by scoping to this subdirectory), collects every
// kind:"instance" OR kind:"icon" node carrying a non-null `slug`, and
// classifies each slug three ways instead of hard-failing anything absent
// from icons.json:
//
//   (a) resolves in icons.json (viewBox+body shape) -> real glyph, must also
//       pass the active-content tripwire below.
//   (b) NOT in icons.json but IS a key in the vendored component registry
//       (vendor/components/dist/registries/dskit.json) -> informational only.
//       Anatomy instance slugs are component-registry slugs by schema, so a
//       nested Button/Input/Card instance under some other component's
//       anatomy tree is expected and correct: renderIconGlyph resolves
//       nothing for it and the renderer falls through to the placeholder
//       container by design (see appearance-render.js). This branch existing
//       and growing is NOT a regression.
//   (c) in NEITHER -> a true orphan: a slug nothing in the vendored tree can
//       explain. THIS is what hard-fails.
//
// Why kind:"instance"/"icon" (not "vector"): the F2 scouting pass confirmed
// anatomy docs never emit kind:"icon" or kind:"image" for real glyphs today
// (they arrive as kind:"instance"); kind:"icon" is collected defensively in
// case a future sync starts emitting it (mirrors appearance-render.js's
// renderIconGlyph acceptance). kind:"vector" nodes are decorative paths, not
// icon-component instances, and are never collected here.
//
// This is a DATA gate (walks vendored JSON), distinct from
// ds-html-map.test.js's "orphan-ref gate" (a STATIC source-scan of literal
// renderIcon("slug") call sites in ds-html-map.js).
"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var PATHS = require("../../scripts/lib/paths.js");

var ANATOMY_DIR = path.join(__dirname, "../../vendor/components/dist/anatomy");

function collectSluggedNodes(node, out, docSlug) {
  if (!node || typeof node !== "object") return;
  if ((node.kind === "instance" || node.kind === "icon") && node.slug != null) {
    out.push({ slug: node.slug, kind: node.kind, doc: docSlug, id: node.id });
  }
  if (Array.isArray(node.children)) {
    node.children.forEach(function (c) {
      collectSluggedNodes(c, out, docSlug);
    });
  }
}

// Single module-scope corpus walk, shared by every test below (the previous
// version of this file scanned the full anatomy dir twice, once per test).
var ANATOMY_FILES = fs.readdirSync(ANATOMY_DIR).filter(function (f) {
  return f.endsWith(".json");
});

var COLLECTED = [];
ANATOMY_FILES.forEach(function (f) {
  var docSlug = f.replace(/\.json$/, "");
  var doc = JSON.parse(fs.readFileSync(path.join(ANATOMY_DIR, f), "utf8"));
  collectSluggedNodes(doc.root, COLLECTED, docSlug);
});

var ICONS =
  JSON.parse(fs.readFileSync(PATHS.components.icons.svg, "utf8")).icons || {};
var REGISTRY =
  JSON.parse(fs.readFileSync(PATHS.components.registries.dskit, "utf8"))
    .components || {};

// Acceptance mirrors renderIconGlyph's real predicate (appearance-render.js):
// an entry must be own-property present AND carry string viewBox + body, or
// the renderer treats it as unresolved and falls through to the placeholder.
// A prototype-chain hit (e.g. slug "toString"/"constructor") or a malformed
// entry (missing/non-string viewBox or body) is NOT resolvable.
function resolvableIcon(slug) {
  if (!Object.prototype.hasOwnProperty.call(ICONS, slug)) return false;
  var icon = ICONS[slug];
  return (
    icon != null && typeof icon.viewBox === "string" && typeof icon.body === "string"
  );
}

function isRegistryComponent(slug) {
  return Object.prototype.hasOwnProperty.call(REGISTRY, slug);
}

// C — supply-chain active-content denylist. appearance-render.js's
// renderIconGlyph interpolates icon.body directly into rendered SVG markup
// with no sanitization (see appearance-style.js's C3-style denylist
// reasoning for appearance decls, which does NOT cover icon body). A
// compromised or malformed vendor refresh smuggling active content into an
// icon body would execute in every generated preview. Case-insensitive;
// current bodies are plain path geometry with fill="currentColor" and pass
// every pattern below (verified before this gate shipped).
var ACTIVE_CONTENT_DENYLIST = [
  /<script/i,
  /\bon[a-z]+\s*=/i,
  /javascript:/i,
  /<foreignobject/i,
  /\bhref\s*=/i,
  /<image/i,
  /<iframe/i,
  /<embed/i,
  /<object/i,
  /data:text\/html/i,
];

function activeContentHit(body) {
  if (typeof body !== "string") return null;
  for (var i = 0; i < ACTIVE_CONTENT_DENYLIST.length; i++) {
    if (ACTIVE_CONTENT_DENYLIST[i].test(body)) {
      return ACTIVE_CONTENT_DENYLIST[i].toString();
    }
  }
  return null;
}

test("non-vacuity: the anatomy corpus scan actually collected slugged nodes", function () {
  assert.ok(
    COLLECTED.length > 0,
    "expected at least one kind:instance/icon node with a non-null slug " +
      "across vendored anatomy (F2's real-glyph corpus) — got 0; either the " +
      "vendor snapshot changed shape or this gate is no longer exercising " +
      "anything",
  );
});

test("three-way classification: every slugged anatomy node is either a real icon, a known nested component, or a true orphan", function () {
  var trueOrphans = [];
  var nestedComponentCount = 0;
  var iconEntries = [];

  COLLECTED.forEach(function (entry) {
    if (resolvableIcon(entry.slug)) {
      iconEntries.push(entry);
    } else if (isRegistryComponent(entry.slug)) {
      nestedComponentCount++;
    } else {
      trueOrphans.push(entry);
    }
  });

  // (c) hard fail: a slug in neither icons.json nor the component registry
  // is unexplainable and would silently render the neutral-box placeholder
  // with zero prior signal.
  assert.deepEqual(
    trueOrphans,
    [],
    "instance/icon node slug(s) resolve in NEITHER icons.json NOR the " +
      "component registry (true orphans): " +
      trueOrphans
        .map(function (m) {
          return m.slug + " (doc: " + m.doc + ", id: " + m.id + ")";
        })
        .join(", "),
  );

  // (b) informational only — nested component instances (e.g. a Button
  // nested under some other component's anatomy) are expected and are not
  // asserted against; logged via the assertion message context only if the
  // suite is run verbosely. No hard assertion here by design.
  void nestedComponentCount;

  // (a) every icon-resolvable entry must ALSO pass the active-content
  // tripwire — a resolvable-but-malicious icon body must still fail loudly.
  var poisoned = [];
  iconEntries.forEach(function (entry) {
    var hit = activeContentHit(ICONS[entry.slug].body);
    if (hit) poisoned.push(entry.slug + " (matched " + hit + ")");
  });
  assert.deepEqual(
    poisoned,
    [],
    "icon body referenced by vendored anatomy contains active content: " +
      poisoned.join(", "),
  );
});

// B4 — collision tripwire. icons.json and the component registry are
// different vendored artifacts; today EVERY icons.json key also appears as
// a registry component key (Figma publishes icon components under
// section=Foundations/category=Icons, and the registry indexes components
// from every category, icons included — verified: all 142 current overlap
// entries carry category "Icons", none is a different, non-icon UI
// component coincidentally sharing an icon's slug). That specific ambiguity
// (a non-icon component slug colliding with an icon slug) is what this
// tripwire guards: renderIconGlyph checks icons.json first, so a future
// collision would make it emit an icon glyph where a nested component
// belongs — see the comment at its call site in appearance-render.js.
// Hardcoded snapshot (not re-derived from current data) so a NEW slug
// entering the overlap fails loudly here rather than silently in render.
var KNOWN_ICON_REGISTRY_OVERLAP = [
  "add", "add-circle", "ai", "alert", "alert-circle", "analytics", "api-key",
  "applications", "arrow", "arrow-alt", "arrow-down", "asleep", "award-04",
  "back", "bin-type", "book-bookmark", "book-edit", "boolean-type",
  "brightness-contrast", "calendar-2", "catalog-design", "catalogs",
  "chart-bar", "chart-pie", "checkmark-outline", "chevron-left",
  "chevron-sort", "chevron-sort-down", "chevron-sort-up", "chevron-up",
  "circle-dash", "close", "cloud-upload", "connected", "dashboard",
  "data-access-request", "data-file-question", "data-model",
  "data-product-output-port", "data-structured", "database",
  "database-check", "directory", "disconnected", "discussion", "dots",
  "download", "drag", "edit", "error-filled", "event-time-type", "exit",
  "expand", "exploration", "export", "favorite", "favorite-filled", "filter",
  "filter-text", "float-type", "geo-point-type", "glossary", "graph-merge",
  "help-bubble", "help-circle", "help-laptop", "history", "home",
  "icon-query-queue", "image", "info", "info-filled", "input", "input-ports",
  "integer-type", "layers-front", "layers-front-curator-indicator",
  "lineage", "link-type", "list-bullets", "list-numbers", "mail",
  "maintenance", "map", "maximize", "menu", "minimize", "misuse-outline",
  "move", "null-sign", "open", "output", "paragraph-justify", "pending",
  "pii", "pin", "process", "relation", "relation-incoming",
  "relation-outgoing", "rocket-1", "rotate-back", "scanner", "schema",
  "security-services", "server-search", "settings", "shield-lock",
  "simple-check", "stop-outline", "success-filled", "suggestion",
  "tags-add", "target-type", "task-list", "task-list-multiple",
  "task-list-settings", "text-file", "text-type", "thumbs-down",
  "thumbs-up", "tools", "trash", "undo", "unknown-type", "upload-file",
  "use-with-care", "user-add", "user-group", "user-info", "user-lock",
  "user-single", "view", "view-card", "view-details", "view-table",
  "warning-alt", "warning-filled", "zoom-in", "zoom-out", "zoom-reset",
  "zoom-to-fit",
].sort();

test("collision tripwire: icons.json keys that also exist as component registry keys must not grow beyond the known snapshot", function () {
  var overlap = Object.keys(ICONS)
    .filter(isRegistryComponent)
    .sort();

  // eslint-disable-next-line no-console
  console.log(
    "icons.json <-> registry overlap: " +
      overlap.length +
      " key(s): " +
      overlap.join(", "),
  );

  var grown = overlap.filter(function (k) {
    return KNOWN_ICON_REGISTRY_OVERLAP.indexOf(k) === -1;
  });

  assert.deepEqual(
    grown,
    [],
    "new icons.json/registry collision(s) not in the known snapshot: " +
      grown.join(", ") +
      " — inspect whether a non-icon component now shares an icon slug " +
      "(genuine renderer ambiguity) before extending the snapshot",
  );
});

// C — broadened supply-chain sweep: ALL 142 vendored icon bodies, not just
// the subset actually referenced by anatomy today (cheap: icons.json is
// small, and this catches a poisoned icon before it is ever wired into any
// anatomy doc).
test("every icons.json body (all vendored icons, not just anatomy-referenced) passes the active-content denylist", function () {
  var offenders = [];
  Object.keys(ICONS).forEach(function (slug) {
    var icon = ICONS[slug];
    var hit = icon && activeContentHit(icon.body);
    if (hit) offenders.push(slug + " (matched " + hit + ")");
  });

  assert.deepEqual(
    offenders,
    [],
    "icon body containing active content for slug(s): " + offenders.join(", "),
  );
});
