// Smoke test for the build-time-baked taxonomy.
//
// Asserts the static JSON imports resolve correctly to the knowledge
// repo's dist/ artifacts AND that the resulting Taxonomy exposes
// non-empty data for both domains. If this test starts failing it
// most likely means:
//   - the dist artifacts have moved (foundations/dist/tokens/motion.json
//     or accessibility/dist/a11y-index.json), or
//   - their schema diverged from the shape parseTaxonomyAssets expects.
// In either case the fix is in src/substrate/taxonomyAssets.ts —
// don't loosen the test.

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTaxonomyFromAssets } from "../../src/substrate/buildTaxonomyFromAssets";

test("buildTaxonomyFromAssets: exposes ≥1 accessibility section from real dist", () => {
  const tax = buildTaxonomyFromAssets();
  const slugs = tax.getSlugs("accessibility");
  assert.ok(
    slugs.length > 0,
    `expected ≥1 accessibility section, got ${slugs.length}`,
  );
});

test("buildTaxonomyFromAssets: exposes ≥1 motion pattern from real dist", () => {
  const tax = buildTaxonomyFromAssets();
  const slugs = tax.getSlugs("motion");
  assert.ok(
    slugs.length > 0,
    `expected ≥1 motion pattern, got ${slugs.length}`,
  );
});

test("buildTaxonomyFromAssets: getTitle resolves real accessibility slugs", () => {
  const tax = buildTaxonomyFromAssets();
  const slugs = tax.getSlugs("accessibility");
  const first = slugs[0]!;
  const title = tax.getTitle("accessibility", first);
  assert.ok(
    title && title.length > 0,
    `expected non-empty title for ${first}, got ${title}`,
  );
});

test("buildTaxonomyFromAssets: domainOfSlug routes a known motion slug to motion", () => {
  const tax = buildTaxonomyFromAssets();
  const motionSlugs = tax.getSlugs("motion");
  // Smoke: at least one motion slug must route back to the motion domain.
  assert.equal(tax.domainOfSlug(motionSlugs[0]!), "motion");
});

test("buildTaxonomyFromAssets: searchSections('contrast') returns real a11y hit", () => {
  // "contrast" is a load-bearing real a11y topic — if this returns 0 the
  // taxonomy bake is broken even if slug counts look fine.
  const tax = buildTaxonomyFromAssets();
  const results = tax.searchSections("contrast");
  assert.ok(
    results.length > 0,
    `expected ≥1 result for "contrast", got ${results.length}`,
  );
  assert.equal(results[0]!.domain, "accessibility");
});

test("buildTaxonomyFromAssets: searchSections empty query → empty list", () => {
  const tax = buildTaxonomyFromAssets();
  assert.deepEqual(tax.searchSections(""), []);
});
