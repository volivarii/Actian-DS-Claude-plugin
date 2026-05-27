import { test } from "node:test";
import assert from "node:assert/strict";
import { getPathTier } from "../../src/lib/pathTiers";

test("getPathTier: tokens/* → Figma-synced read-only", () => {
  assert.equal(
    getPathTier("tokens/tokens.json").tier,
    "read-only-figma-synced",
  );
  assert.equal(getPathTier("tokens/tokens.css").tier, "read-only-figma-synced");
});

test("getPathTier: registries → Figma-synced read-only", () => {
  assert.equal(
    getPathTier("components/dist/registries/dskit.json").tier,
    "read-only-figma-synced",
  );
});

test("getPathTier: <area>/dist/* → CI-derived read-only", () => {
  assert.equal(
    getPathTier("foundations/dist/foundations.json").tier,
    "read-only-derived",
  );
  assert.equal(
    getPathTier("components/dist/guidelines/button.json").tier,
    "read-only-derived",
  );
});

test("getPathTier: llms.txt + llms-full.txt → CI-derived", () => {
  assert.equal(getPathTier("llms.txt").tier, "read-only-derived");
  assert.equal(getPathTier("llms-full.txt").tier, "read-only-derived");
});

test("getPathTier: paths-manifest.json → lockstep", () => {
  assert.equal(getPathTier("paths-manifest.json").tier, "read-only-lockstep");
});

test("getPathTier: components/src/categories/<x>.md → high-impact-category", () => {
  assert.equal(
    getPathTier("components/src/categories/action.md").tier,
    "high-impact-category",
  );
});

test("getPathTier: foundations/src/<x>.md → high-impact-foundations", () => {
  assert.equal(
    getPathTier("foundations/src/02-color-primitives.md").tier,
    "high-impact-foundations",
  );
});

test("getPathTier: accessibility/src/<x>.md → high-impact-accessibility", () => {
  assert.equal(
    getPathTier("accessibility/src/01-principles.md").tier,
    "high-impact-accessibility",
  );
});

test("getPathTier: per-component files → writable", () => {
  assert.equal(
    getPathTier("components/src/button/content.md").tier,
    "writable",
  );
  assert.equal(getPathTier("components/src/button/_meta.yml").tier, "writable");
});

test("getPathTier: severity is 'red' for read-only tiers, 'amber' for high-impact", () => {
  assert.equal(getPathTier("tokens/tokens.json").severity, "red");
  assert.equal(getPathTier("paths-manifest.json").severity, "red");
  assert.equal(
    getPathTier("foundations/src/02-color-primitives.md").severity,
    "amber",
  );
  assert.equal(
    getPathTier("components/src/categories/action.md").severity,
    "amber",
  );
});

test("getPathTier: writable severity is 'none'", () => {
  assert.equal(
    getPathTier("components/src/button/content.md").severity,
    "none",
  );
});
