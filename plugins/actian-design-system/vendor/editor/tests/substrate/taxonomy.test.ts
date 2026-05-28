import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadTaxonomy } from "../../src/substrate/taxonomy";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const A11Y_FIXTURE = path.resolve(
  HERE,
  "../fixtures/substrate/a11y-index.fixture.json",
);
const MOTION_FIXTURE = path.resolve(
  HERE,
  "../fixtures/substrate/motion.fixture.json",
);

test("loadTaxonomy: exposes accessibility slugs", async () => {
  const tax = await loadTaxonomy({
    a11yIndexPath: A11Y_FIXTURE,
    motionPath: MOTION_FIXTURE,
  });
  assert.deepEqual(tax.getSlugs("accessibility").sort(), [
    "color-contrast",
    "focus-keyboard",
    "typography",
  ]);
});

test("loadTaxonomy: exposes motion slugs", async () => {
  const tax = await loadTaxonomy({
    a11yIndexPath: A11Y_FIXTURE,
    motionPath: MOTION_FIXTURE,
  });
  assert.deepEqual(tax.getSlugs("motion").sort(), [
    "drawer-open-close",
    "state-transitions",
  ]);
});

test("loadTaxonomy: getTitle returns human-readable title", async () => {
  const tax = await loadTaxonomy({
    a11yIndexPath: A11Y_FIXTURE,
    motionPath: MOTION_FIXTURE,
  });
  assert.equal(
    tax.getTitle("accessibility", "color-contrast"),
    "Color contrast",
  );
  assert.equal(
    tax.getTitle("motion", "state-transitions"),
    "State transitions",
  );
});

test("loadTaxonomy: getBody returns section body", async () => {
  const tax = await loadTaxonomy({
    a11yIndexPath: A11Y_FIXTURE,
    motionPath: MOTION_FIXTURE,
  });
  assert.match(tax.getBody("accessibility", "color-contrast") ?? "", /WCAG AA/);
});

test("loadTaxonomy: unknown slug returns null for title + body", async () => {
  const tax = await loadTaxonomy({
    a11yIndexPath: A11Y_FIXTURE,
    motionPath: MOTION_FIXTURE,
  });
  assert.equal(tax.getTitle("accessibility", "nonexistent"), null);
  assert.equal(tax.getBody("accessibility", "nonexistent"), null);
});

test("loadTaxonomy: domainOfSlug routes correctly", async () => {
  const tax = await loadTaxonomy({
    a11yIndexPath: A11Y_FIXTURE,
    motionPath: MOTION_FIXTURE,
  });
  assert.equal(tax.domainOfSlug("color-contrast"), "accessibility");
  assert.equal(tax.domainOfSlug("state-transitions"), "motion");
  assert.equal(tax.domainOfSlug("nonexistent"), null);
});

test("loadTaxonomy: searchSections matches title prefix + body words", async () => {
  const tax = await loadTaxonomy({
    a11yIndexPath: A11Y_FIXTURE,
    motionPath: MOTION_FIXTURE,
  });
  const results = tax.searchSections("contrast");
  assert.equal(results.length, 1);
  assert.equal(results[0]?.slug, "color-contrast");
  assert.equal(results[0]?.domain, "accessibility");
});

test("loadTaxonomy: searchSections returns empty for no match", async () => {
  const tax = await loadTaxonomy({
    a11yIndexPath: A11Y_FIXTURE,
    motionPath: MOTION_FIXTURE,
  });
  assert.deepEqual(tax.searchSections("xyznever"), []);
});

test("loadTaxonomy: malformed JSON throws tagged error", async () => {
  await assert.rejects(
    loadTaxonomy({
      a11yIndexPath: "/nonexistent/path.json",
      motionPath: MOTION_FIXTURE,
    }),
    /TaxonomyLoadError/,
  );
});
