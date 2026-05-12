"use strict";

// Schema test for the component-category sync (Phase 0 in knowledge repo
// v0.3.4–v0.3.6; Phase 1 consumption in plugin v1.81.0+).
//
// Asserts:
//   1. categories.json structure is valid and matches the known shape.
//   2. Every category name in categories.json is in KNOWN_CATEGORIES.
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
const KNOWN_CATEGORIES = new Set([
  "Action",
  "Form (input & selection)",
  "Navigation",
  "Data Display",
  "Feedback",
  "Overlays",
]);

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

test("categories.json — every category is in KNOWN_CATEGORIES", () => {
  const c = loadJSON(PATHS.components.categories);
  for (const name of Object.keys(c.categories)) {
    assert.ok(
      KNOWN_CATEGORIES.has(name),
      `Unknown category '${name}'. Update KNOWN_CATEGORIES in tests/integration/categories.test.js AND knowledge repo's transform-categories.js if the design team intentionally added it.`,
    );
  }
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
    const refs = (d && d.card_motion && d.card_motion.patternRefs) || [];
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
    const refs =
      (d && d.card_accessibility && d.card_accessibility.requirementRefs) || [];
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

test("category-defaults — every dskit registry category label normalizes to an existing defaults slug", () => {
  const c = loadJSON(PATHS.components.categories);
  const unmapped = [];
  for (const label of Object.keys(c.categories)) {
    const slug = loader.normalizeCategorySlug(label);
    const d = loader.loadDefaultsForCategory(slug);
    if (!d) unmapped.push(`'${label}' → '${slug}' (no defaults file)`);
  }
  assert.deepEqual(
    unmapped,
    [],
    `dskit category labels with no matching defaults file:\n  ${unmapped.join("\n  ")}`,
  );
});
