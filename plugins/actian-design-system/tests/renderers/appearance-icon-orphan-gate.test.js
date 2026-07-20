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

var ICONS_DOC = JSON.parse(fs.readFileSync(PATHS.components.icons.svg, "utf8"));
var ICONS = ICONS_DOC.icons || {};
var REGISTRY =
  JSON.parse(fs.readFileSync(PATHS.components.registries.dskit, "utf8"))
    .components || {};
var appearanceRender = require("../../scripts/lib/renderer.js").appearanceRender;

// Acceptance mirrors renderIconGlyph's real predicate (appearance-render.js):
// an entry must be own-property present AND carry string viewBox + body, or
// the renderer treats it as unresolved and falls through to the placeholder.
// A prototype-chain hit (e.g. slug "toString"/"constructor") or a malformed
// entry (missing/non-string viewBox or body) is NOT resolvable.
function resolvableIcon(slug) {
  if (!Object.prototype.hasOwnProperty.call(ICONS, slug)) return false;
  var icon = ICONS[slug];
  return (
    icon != null &&
    typeof icon.viewBox === "string" &&
    typeof icon.body === "string"
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

// B4 — collision invariant. icons.json and the component registry are
// different vendored artifacts; today EVERY icons.json key also appears as
// a registry component key (Figma publishes icon components under
// section=Foundations/category=Icons, and the registry indexes components
// from every category, icons included). That overlap is EXPECTED and grows
// legitimately whenever a new icon is published (new icons.json key + a
// matching Icons-category registry entry) — a fixed-membership/fixed-count
// snapshot would fail CI on that ordinary growth, which is exactly the
// today-fact-not-invariant bug this gate exists to avoid.
//
// The actual ambiguity worth hard-failing on (see renderIconGlyph's call
// site in appearance-render.js: it checks icons.json first) is a NON-icon
// registry component coincidentally sharing an icon's slug — that would
// make the renderer emit an icon glyph where a distinct nested component
// belongs. So the invariant is category-shaped, not membership-shaped:
// every registry entry that shares a slug with icons.json must itself be
// categorized "Icons" (field verified against
// vendor/components/dist/registries/dskit.json's `category` string —
// inspected all 142 current overlap entries: every one carries category
// "Icons" and none is missing the field; a future entry that lacks a
// `category`, or carries any value other than "Icons", is treated as a
// genuine collision and fails loudly here).
function isIconsCategoryComponent(entry) {
  return entry != null && entry.category === "Icons";
}

// B4 — the collision invariant, restated.
//
// This gate used to assert that NO icons.json slug could belong to a non-icon
// component. That premise is dead: knowledge now gives icons their own namespace
// (knowledge #418), because a design system may legitimately ship a `calendar`
// GLYPH and a `Calendar` COMPONENT, and forcing them to share one flat slug map
// meant one of them silently vanished — the DS shipped with no calendar and no
// search glyph for exactly that reason.
//
// So the overlap is now LEGAL. The ambiguity it warned about, however, is still
// completely real, and this is the one place it can be caught:
//
//   renderIconGlyph resolves a component reference BY SLUG and checks the icon
//   map first. global-header's anatomy nests `search` — meaning the whole Search
//   FIELD — so left alone it would draw a tiny magnifier where an entire input
//   belongs.
//
// The substrate declares the ambiguous slugs (icons.json `_meta.shadowed_by_component`,
// knowledge #420), and the renderer must DEFER on them: an anatomy slug is resolved
// against the component registry, and a shadowed icon is never in it, so for these
// slugs an anatomy reference always means the component.
//
// The gate therefore moves from "this can never happen" to "when it happens, the
// renderer does the right thing" — a behaviour assertion, which is strictly
// stronger than the membership one it replaces.
test("collision invariant: an icon slug shadowed by a NON-icon component renders the component, never the glyph", function () {
  var overlap = Object.keys(ICONS).filter(isRegistryComponent).sort();
  var shadowedInFact = overlap.filter(function (k) {
    return !isIconsCategoryComponent(REGISTRY[k]);
  });
  var declared =
    (ICONS_DOC._meta && ICONS_DOC._meta.shadowed_by_component) || [];

  // 1. The substrate must DECLARE every ambiguity that actually exists. A missed
  //    declaration is the dangerous case: the renderer would never know to defer.
  assert.deepEqual(
    shadowedInFact.slice().sort(),
    declared.slice().sort(),
    "icons.json/registry slug overlap(s) on a NON-icon component that the " +
      "substrate does not declare in _meta.shadowed_by_component: " +
      shadowedInFact
        .filter(function (k) {
          return declared.indexOf(k) === -1;
        })
        .join(", ") +
      " — renderIconGlyph checks icons.json first, so an undeclared one renders " +
      "an icon glyph where the distinct non-icon component belongs",
  );

  // 2. And the renderer must actually DEFER on them. Assert the behaviour, not
  //    just the data: a declaration nothing honours is worthless.
  declared.forEach(function (slug) {
    var out = appearanceRender.renderIconGlyph({ slug: slug }, null, {
      iconMap: ICONS,
      shadowedSlugs: declared,
    });
    assert.equal(
      out,
      null,
      "`" +
        slug +
        "` is also a non-icon component (" +
        (REGISTRY[slug] && REGISTRY[slug].name) +
        "), so an anatomy reference means the COMPONENT — the renderer must fall " +
        "through, not draw the glyph",
    );
  });

  // 3. Guard the guard: an ordinary, unshadowed icon must still render. Otherwise
  //    a bug that made renderIconGlyph return null for everything would pass (2).
  var plain = Object.keys(ICONS).find(function (k) {
    return declared.indexOf(k) === -1 && ICONS[k] && ICONS[k].body;
  });
  assert.ok(plain, "expected at least one unshadowed icon to test with");
  assert.match(
    appearanceRender.renderIconGlyph({ slug: plain }, null, {
      iconMap: ICONS,
      shadowedSlugs: declared,
    }) || "",
    /<svg/,
    "an unshadowed icon must still render its glyph — otherwise this gate is vacuous",
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
