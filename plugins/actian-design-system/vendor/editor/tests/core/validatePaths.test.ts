import { test } from "node:test";
import assert from "node:assert/strict";
import { isReadOnlyPath } from "../../src/core/validatePaths";

test("validatePaths — refuses tokens.json (Figma-synced)", () => {
  assert.equal(isReadOnlyPath("tokens/tokens.json"), true);
});

test("validatePaths — refuses tokens.css derived output", () => {
  assert.equal(isReadOnlyPath("tokens/tokens.css"), true);
});

test("validatePaths — refuses dskit registry (Figma-synced)", () => {
  assert.equal(isReadOnlyPath("components/dist/registries/dskit.json"), true);
});

test("validatePaths — refuses any */dist/ path (CI-derived)", () => {
  assert.equal(isReadOnlyPath("components/dist/guidelines/button.json"), true);
  assert.equal(isReadOnlyPath("foundations/dist/tokens/motion.json"), true);
  assert.equal(isReadOnlyPath("accessibility/dist/a11y-index.json"), true);
});

test("validatePaths — refuses llms-full.txt and llms.txt (CI-generated)", () => {
  assert.equal(isReadOnlyPath("llms-full.txt"), true);
  assert.equal(isReadOnlyPath("llms.txt"), true);
});

test("validatePaths — allows components/src content", () => {
  assert.equal(isReadOnlyPath("components/src/button/content.md"), false);
  assert.equal(isReadOnlyPath("components/src/button/_meta.yml"), false);
});

test("validatePaths — allows accessibility/src/*.md", () => {
  assert.equal(isReadOnlyPath("accessibility/src/principles.md"), false);
});

test("validatePaths — allows app-context, fm-to-ds-map, icon-groups (Class C)", () => {
  assert.equal(isReadOnlyPath("app-context/app-context.json"), false);
  assert.equal(isReadOnlyPath("fm-to-ds-map/fm-to-ds-map.json"), false);
  assert.equal(isReadOnlyPath("components/src/icon-groups.json"), false);
});

test("validatePaths — allows foundations/src/*.md (authored)", () => {
  assert.equal(isReadOnlyPath("foundations/src/color-primitives.md"), false);
});

test("validatePaths — allows content/src/global.md (authored prose)", () => {
  assert.equal(isReadOnlyPath("content/src/global.md"), false);
});

test("validatePaths — allows components/src/categories/*.md (authored frontmatter)", () => {
  assert.equal(isReadOnlyPath("components/src/categories/action.md"), false);
});

test("validatePaths — refuses paths-manifest.json (lockstep with package.json)", () => {
  assert.equal(isReadOnlyPath("paths-manifest.json"), true);
});
