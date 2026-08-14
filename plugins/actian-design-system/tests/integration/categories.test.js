"use strict";

// Schema test for the component-category sync (Phase 0 in knowledge repo
// v0.3.4–v0.3.6; Phase 1 consumption in plugin v1.81.0+).
//
// Asserts:
//   1. categories.json structure is valid and matches the known shape.
//   2. Every COMPONENTS-section category is in the curated closed set.
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

// The closed set of COMPONENTS-section categories, DERIVED from the
// substrate rather than restated here. The rule this gate encodes is
// "a Components-section category must have a curated *-defaults.json",
// and each of those files declares its own display `label`, so the set
// is exactly those labels.
//
// It used to be a hand-written list carrying "Form (input & selection)".
// When the design team renamed that Figma page to "Form" (knowledge
// #534, taxonomy 15 categories to 11), the substrate shipped the new
// label and this consumer kept asserting the old one, so an ordinary
// rename read as drift. That is the same failure the vocabulary table
// above was generated to remove, and the same one that cost three repos
// two weeks in July: a consumer restating by hand a fact the producer
// already owns. Derived, a rename now flows through and only a genuinely
// new category (one with no defaults file) still stops the build, which
// is the decision this gate exists to force.
function componentsCategories() {
  const fs = require("fs");
  const path = require("path");
  // Located through the collection rather than through one member: deriving the
  // directory from `.action` would make this line the one thing that breaks if
  // `action` were ever renamed, in a test that exists because a category rename
  // broke something else.
  const byKey = PATHS.components.categoryDefaults.byKey;
  const dir = path.dirname(byKey("action"));
  return new Set(
    fs
      .readdirSync(dir)
      .filter((f) => /-defaults\.json$/.test(f))
      .map(
        (f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).label,
      )
      .filter(Boolean),
  );
}
const COMPONENTS_CATEGORIES = componentsCategories();

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
// #275 (2026-08-12): what replaced NON_COMPONENTS_CATEGORIES in turn (a
// "non-COMPONENTS category must equal the clean page name of every component
// filed under it" relation) was ALSO wrong, for a different reason: knowledge's
// preserveKnownCategories (knowledge #426) deliberately carries a component's
// last-known category forward when Figma's page attribution churns, which
// decouples the two by design. The 2026-08-12 sync did exactly that -- a page
// was renamed while the category stayed put -- and 4 components mismatched for
// a reason that was never a defect either. That check is gone; there is no
// replacement, because the relation it was reaching for (categories.json
// against registry.category) already has an assertion below ("DS Kit registry
// — every component with a category is cross-referenced in categories.json"),
// verified at 327/327 on the 2026-08-12 data since the sync writes both from
// the same computed value. The only thing this file still asserts about
// non-COMPONENTS categories is nothing: there is deliberately no invariant to
// check beyond "every category-bearing component is cross-referenced."

function loadJSON(p) {
  return JSON.parse(require("fs").readFileSync(p, "utf8"));
}

// The shipped category slugs, read from the vendored dist. Written out, this list
// went stale on knowledge #541's rename and quietly stopped covering a category.
function shippedCategorySlugs() {
  const fs = require("fs");
  const path = require("path");
  const dir = path.dirname(PATHS.components.categoryDefaults.byKey("action"));
  const slugs = fs
    .readdirSync(dir)
    .filter((f) => /-defaults\.json$/.test(f))
    .map((f) => f.replace(/-defaults\.json$/, ""))
    .sort();
  assert.ok(slugs.length, "the vendored dist ships category defaults at all");
  return slugs;
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

test("categories.json — every COMPONENTS-section category is in the curated closed set", () => {
  const c = loadJSON(PATHS.components.categories);
  const reg = loadJSON(PATHS.components.registries.dskit);

  // Collected, not asserted one at a time: the old loop stopped at the first
  // unknown name, so a run that reported one drifted category was hiding three
  // more. A gate that reveals its findings one nightly at a time is a gate that
  // takes four nights to read.
  const unknownComponentsCategories = [];

  for (const [name, entry] of Object.entries(c.categories)) {
    for (const slug of entry.components) {
      const comp = reg.components[slug];
      // A slug missing from the registry is a different defect, asserted by the
      // "every listed slug exists in DS Kit registry" test below.
      if (!comp) continue;

      if (comp.section === "Components" && !COMPONENTS_CATEGORIES.has(name)) {
        unknownComponentsCategories.push(`${name} (via ${slug})`);
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

test("category-defaults: every shipped defaults file loads through the loader", () => {
  // The slugs were written out here and still said `form-input-selection` after
  // knowledge #541 renamed it, which is the third hand-written copy of this same
  // list to go stale in one week. Read from the dist instead: the invariant that
  // matters is that everything shipped can be loaded, not that six specific names
  // are present.
  const fs = require("fs");
  const path = require("path");
  const dir = path.dirname(PATHS.components.categoryDefaults.byKey("action"));
  const slugs = fs
    .readdirSync(dir)
    .filter((f) => /-defaults\.json$/.test(f))
    .map((f) => f.replace(/-defaults\.json$/, ""))
    .sort();
  assert.ok(slugs.length, "the vendored dist ships category defaults at all");
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
  // Read from the dist, not written out. These loops iterate against the REAL
  // vendored files, so a retired name does not fail here, it makes the inner
  // loop body never execute: the Form category's refs stopped being verified by
  // any of these gates and all of them stayed green.
  const slugs = shippedCategorySlugs();
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
  // Read from the dist, not written out. These loops iterate against the REAL
  // vendored files, so a retired name does not fail here, it makes the inner
  // loop body never execute: the Form category's refs stopped being verified by
  // any of these gates and all of them stayed green.
  const slugs = shippedCategorySlugs();
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
