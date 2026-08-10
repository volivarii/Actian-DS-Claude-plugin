"use strict";

// Schema test for the component-category sync (Phase 0 in knowledge repo
// v0.3.4–v0.3.6; Phase 1 consumption in plugin v1.81.0+).
//
// Asserts:
//   1. categories.json structure is valid and matches the known shape.
//   2. Every COMPONENTS-section category is in the curated closed set, and
//      every other category equals its Figma page clean-name.
//   3. Every component slug listed in categories.json exists in the
//      DS Kit registry.
//   4. Every DS Kit registry entry with a `category` field is
//      cross-referenced in categories.json under that category.
//   5. categories.json `uncategorized.count` + sum-of-categorized-counts
//      equals the registry's total component count.
//
// Failure mode: surfaces drift between the registry and categories.json
// (e.g., a manual edit to categories.json without re-running the sync,
// or a vendor snapshot that pulled one file but not the other).

const test = require("node:test");
const assert = require("node:assert/strict");
const PATHS = require("../../scripts/lib/paths");

// Source of truth for the closed set of categories. Mirrors
// KNOWN_CATEGORIES in the knowledge repo's
// scripts/transformers/transform-categories.js. Keep in sync when the
// design team adds a new category in Figma.
//
// COMPONENTS-section categories — these have curated *-defaults.json
// files under vendor/components/dist/categories/. The
// category-defaults-loader test enforces that mapping.
const COMPONENTS_CATEGORIES = new Set([
  "Action",
  "Form (input & selection)",
  "Navigation",
  "Data Display",
  "Feedback",
  "Overlays",
]);

// ζ.2 (knowledge v0.7.0+, 2026-05-13) — `category` is now populated for
// items outside the COMPONENTS section too: Foundations pages (icons,
// breakpoints, etc.) and Brand assets pages. These values come straight
// from the Figma page clean-name. No defaults files exist for them yet
// (category-defaults are scoped to the curated Components set above);
// the category-defaults-loader test below skips these by design.
//
// There is deliberately NO closed list of them. There used to be
// (NON_COMPONENTS_CATEGORIES), and it was a local invention: the knowledge repo
// keeps no such list either, because outside the COMPONENTS section the category
// simply IS the page clean-name. So every Foundations page the design team added
// broke this gate for a reason that was never a defect, and on 2026-07-23 four
// arrived at once ("Base: label, message, field, textfield buttons",
// "Checkbox, checkbox card, checkbox group", "Radio, radio card, radio group",
// "Text area, text input"), holding the v0.34.122 vendor PR red for 15 nights.
// The old failure message compounded it by advising an update to
// transform-categories.js, which for a Foundations page has nothing to update.
//
// What replaced it asserts the relation instead of the membership: a
// non-COMPONENTS category must equal the clean page name of every component
// filed under it. That still catches the drift this file exists to catch (a hand
// edit to categories.json, or a vendor snapshot that pulled one file and not the
// other, which would break the relation), and it cannot rot when Figma gains a
// page. Verified against v0.34.122: 252/252 non-COMPONENTS members match, and
// 0/71 COMPONENTS members do, since those categories are curated groupings
// spanning many pages.

// Mirrors LEADING_EMOJI_RE + extractStatus() in the knowledge repo's
// scripts/transformers/component-status-emoji.js, which is what produces the
// `category` value in the first place. Mirroring the rule (rather than
// stripping any leading symbol) keeps the two in agreement even for a page
// prefixed with an emoji outside the status map, e.g. "⚪️ Calendar": knowledge
// leaves that one intact, and so does this.
const LEADING_STATUS_EMOJI_RE = /^\s*(✅|✍️|⛔️|⚠️)\s+(.*?)\s*$/;

function pageCleanName(page) {
  const raw = String(page == null ? "" : page);
  const m = LEADING_STATUS_EMOJI_RE.exec(raw);
  return m ? m[2] : raw.trim();
}

function loadJSON(p) {
  return JSON.parse(require("fs").readFileSync(p, "utf8"));
}

test("categories.json — structure", () => {
  const c = loadJSON(PATHS.components.categories);
  assert.equal(c.library, "ds", "categories.json is DS-Kit-only");
  assert.ok(typeof c.generatedAt === "string", "generatedAt is set");
  assert.ok(
    c.categories && typeof c.categories === "object",
    "categories present",
  );
  assert.ok(
    c.uncategorized && typeof c.uncategorized.count === "number",
    "uncategorized.count present",
  );
});

test("categories.json — COMPONENTS categories are the curated closed set; every other category is its page clean-name", () => {
  const c = loadJSON(PATHS.components.categories);
  const reg = loadJSON(PATHS.components.registries.dskit);

  // Collected, not asserted one at a time: the old loop stopped at the first
  // unknown name, so a run that reported one drifted category was hiding three
  // more. A gate that reveals its findings one nightly at a time is a gate that
  // takes four nights to read.
  const unknownComponentsCategories = [];
  const nameMismatches = [];

  for (const [name, entry] of Object.entries(c.categories)) {
    for (const slug of entry.components) {
      const comp = reg.components[slug];
      // A slug missing from the registry is a different defect, asserted by the
      // "every listed slug exists in DS Kit registry" test below.
      if (!comp) continue;

      if (comp.section === "Components") {
        if (!COMPONENTS_CATEGORIES.has(name)) {
          unknownComponentsCategories.push(`${name} (via ${slug})`);
        }
        continue;
      }

      const expected = pageCleanName(comp.page);
      if (expected !== name) {
        nameMismatches.push(
          `${slug}: category '${name}' != page clean-name '${expected}'`,
        );
      }
    }
  }

  assert.deepEqual(
    [...new Set(unknownComponentsCategories)].sort(),
    [],
    "COMPONENTS-section components filed under a category outside the curated set. " +
      "This one IS a decision: each curated category needs a *-defaults.json under " +
      "vendor/components/dist/categories/, so add it here AND in the knowledge repo's " +
      "transform-categories.js KNOWN_CATEGORIES, or fix the Figma page's category header",
  );

  assert.deepEqual(
    nameMismatches.sort(),
    [],
    "outside the COMPONENTS section a category is defined as the Figma page clean-name, " +
      "so a mismatch means categories.json and the registry disagree: a hand edit, or a " +
      "vendor snapshot that pulled one file and not the other",
  );
});

test("categories.json — every listed slug exists in DS Kit registry", () => {
  const c = loadJSON(PATHS.components.categories);
  const reg = loadJSON(PATHS.components.registries.dskit);
  const regSlugs = new Set(Object.keys(reg.components));

  const missing = [];
  for (const [catName, entry] of Object.entries(c.categories)) {
    for (const slug of entry.components) {
      if (!regSlugs.has(slug)) {
        missing.push(`${catName} -> ${slug}`);
      }
    }
  }
  assert.equal(
    missing.length,
    0,
    `categories.json lists ${missing.length} slug(s) not present in dskit registry: ${missing.join(", ")}`,
  );
});

test("DS Kit registry — every component with a category is cross-referenced in categories.json", () => {
  const c = loadJSON(PATHS.components.categories);
  const reg = loadJSON(PATHS.components.registries.dskit);

  const orphans = [];
  for (const [slug, entry] of Object.entries(reg.components)) {
    if (!entry.category) continue;
    const cat = c.categories[entry.category];
    if (!cat) {
      orphans.push(
        `${slug} -> category='${entry.category}' (category absent from categories.json)`,
      );
      continue;
    }
    if (!cat.components.includes(slug)) {
      orphans.push(
        `${slug} -> registry says '${entry.category}' but slug not in that category's components[]`,
      );
    }
  }
  assert.equal(
    orphans.length,
    0,
    `${orphans.length} registry/categories.json drift: ${orphans.slice(0, 10).join("; ")}${orphans.length > 10 ? "; …" : ""}`,
  );
});

test("categories.json — counts reconcile with registry", () => {
  const c = loadJSON(PATHS.components.categories);
  const reg = loadJSON(PATHS.components.registries.dskit);

  const categorizedSum = Object.values(c.categories).reduce(
    (sum, entry) => sum + entry.count,
    0,
  );
  const total = categorizedSum + c.uncategorized.count;
  const regTotal = Object.keys(reg.components).length;

  assert.equal(
    total,
    regTotal,
    `categories.json totals (${categorizedSum} categorized + ${c.uncategorized.count} uncategorized = ${total}) do not match registry component count (${regTotal})`,
  );

  for (const [name, entry] of Object.entries(c.categories)) {
    assert.equal(
      entry.count,
      entry.components.length,
      `category '${name}' has count=${entry.count} but components[].length=${entry.components.length}`,
    );
  }
});

// --- Phase 2c (knowledge v0.4.x+ / plugin v1.82.0+) ---

const loader = require("../../scripts/transformers/category-defaults-loader.js");

test("category-defaults — all 6 dist files exist", () => {
  const slugs = [
    "action",
    "form-input-selection",
    "navigation",
    "data-display",
    "feedback",
    "overlays",
  ];
  const missing = [];
  for (const slug of slugs) {
    const d = loader.loadDefaultsForCategory(slug);
    if (!d) missing.push(slug);
  }
  assert.deepEqual(
    missing,
    [],
    `category defaults missing from vendor: ${missing.join(", ")}. ` +
      `Run scripts/vendor/vendor-snapshot.js --range to refresh.`,
  );
});

test("category-defaults — bundle file exists at registered manifest path", () => {
  const fs = require("fs");
  // PATHS.components.categoryDefaults.bundle is the manifest-registered bundle path.
  // (Sibling of PATHS.components.categoryDefaults.byKey which is the collection function.)
  assert.ok(
    PATHS.components &&
      PATHS.components.categoryDefaults &&
      PATHS.components.categoryDefaults.bundle,
    "manifest must register components.categoryDefaults.bundle",
  );
  const bundlePath = PATHS.components.categoryDefaults.bundle;
  assert.equal(typeof bundlePath, "string", "bundle path must be a string");
  assert.ok(fs.existsSync(bundlePath), `bundle not found at ${bundlePath}`);
  const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
  assert.ok(bundle.categories, "bundle.categories must exist");
  assert.equal(
    Object.keys(bundle.categories).length,
    6,
    "bundle must contain all 6 categories",
  );
});

test("category-defaults — every motion_refs slug resolves against tokens/motion.json", () => {
  loader._resetCache();
  const slugs = [
    "action",
    "form-input-selection",
    "navigation",
    "data-display",
    "feedback",
    "overlays",
  ];
  const unresolved = [];
  for (const slug of slugs) {
    const d = loader.loadDefaultsForCategory(slug);
    const refs = (d && d.motion_refs && d.motion_refs.patternRefs) || [];
    for (const r of refs) {
      if (!loader.resolveMotionRef(r.ref)) {
        unresolved.push(`${slug} → motion ref '${r.ref}'`);
      }
    }
  }
  assert.deepEqual(
    unresolved,
    [],
    `Unresolved motion refs (upstream slug rename suspected):\n  ${unresolved.join("\n  ")}`,
  );
});

test("category-defaults — every accessibility ref slug resolves against a11y-index.json", () => {
  loader._resetCache();
  const slugs = [
    "action",
    "form-input-selection",
    "navigation",
    "data-display",
    "feedback",
    "overlays",
  ];
  const unresolved = [];
  for (const slug of slugs) {
    const d = loader.loadDefaultsForCategory(slug);
    const refs = (d && d.a11y_refs && d.a11y_refs.requirementRefs) || [];
    for (const r of refs) {
      if (!loader.resolveAccessibilityRef(r.ref)) {
        unresolved.push(`${slug} → a11y ref '${r.ref}'`);
      }
    }
  }
  assert.deepEqual(
    unresolved,
    [],
    `Unresolved a11y refs (upstream slug rename suspected):\n  ${unresolved.join("\n  ")}`,
  );
});

test("category-defaults — every COMPONENTS-section category resolves to an existing defaults slug (via registry categorySlug)", () => {
  // ζ.2 (2026-05-13): scoped to COMPONENTS-section categories. Foundations
  // and Brand-section categories (Icons, Marketing icons, etc.) intentionally
  // have no defaults file — the loader falls through to null and per-component
  // guideline content still renders cleanly. Add to COMPONENTS_CATEGORIES if
  // we author defaults for any of the new Foundations/Brand categories.
  //
  // Move 3 (knowledge #189): the slug is the registry's canonical
  // `entry.categorySlug` (= slugify(category)) — consumed verbatim, not
  // re-derived from the label. This exercises the real brief-time path.
  const reg = loadJSON(PATHS.components.registries.dskit);
  const comps = reg.components || {};
  const unmapped = [];
  const seen = new Set();
  for (const slug of Object.keys(comps)) {
    const entry = comps[slug];
    if (!entry || !COMPONENTS_CATEGORIES.has(entry.category)) continue;
    const catSlug = entry.categorySlug;
    if (!catSlug || seen.has(catSlug)) continue;
    seen.add(catSlug);
    if (!loader.loadDefaultsForCategory(catSlug)) {
      unmapped.push(`'${entry.category}' → '${catSlug}' (no defaults file)`);
    }
  }
  assert.deepEqual(
    unmapped,
    [],
    `COMPONENTS-section categories with no matching defaults file:\n  ${unmapped.join("\n  ")}`,
  );
});
