import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addRefToFrontmatter,
  refTypeFor,
  removeRefFromFrontmatter,
} from "../../src/substrate/frontmatterRewriter";

const NO_FRONTMATTER = `## 1. Section

Body.
`;

const WITH_A11Y = `---
a11y_refs:
  - { ref: color-contrast, note: "preserves contrast" }
---

## 1. Section

Body.
`;

test("addRefToFrontmatter: appends to existing a11y_refs", () => {
  const result = addRefToFrontmatter(WITH_A11Y, "a11y_refs", {
    slug: "typography",
    note: null,
  });
  assert.match(result, /a11y_refs:/);
  assert.match(result, /ref: color-contrast/);
  assert.match(result, /ref: typography/);
});

test("addRefToFrontmatter: creates new a11y_refs section when absent", () => {
  const result = addRefToFrontmatter(NO_FRONTMATTER, "a11y_refs", {
    slug: "color-contrast",
    note: null,
  });
  assert.match(result, /^---/);
  assert.match(result, /a11y_refs:/);
  assert.match(result, /ref: color-contrast/);
  assert.match(result, /## 1\. Section/);
});

test("addRefToFrontmatter: creates frontmatter envelope if file has none", () => {
  const result = addRefToFrontmatter(NO_FRONTMATTER, "motion_refs", {
    slug: "state-transitions",
    note: "subtle hover",
  });
  assert.equal(result.slice(0, 3), "---");
  assert.match(result, /motion_refs:/);
  assert.match(result, /note: "subtle hover"/);
});

test("addRefToFrontmatter: motion_refs key targets the right block", () => {
  const result = addRefToFrontmatter(WITH_A11Y, "motion_refs", {
    slug: "drawer-open-close",
    note: null,
  });
  assert.match(result, /a11y_refs:[\s\S]+motion_refs:/);
  assert.match(result, /ref: drawer-open-close/);
});

test("removeRefFromFrontmatter: drops the matching entry", () => {
  const before = `---
a11y_refs:
  - { ref: color-contrast }
  - { ref: typography }
---

## 1. Section
`;
  const result = removeRefFromFrontmatter(
    before,
    "a11y_refs",
    "color-contrast",
  );
  assert.doesNotMatch(result, /ref: color-contrast/);
  assert.match(result, /ref: typography/);
});

test("removeRefFromFrontmatter: removes entire key when last entry drops", () => {
  const before = `---
a11y_refs:
  - { ref: color-contrast }
---

## 1. Section
`;
  const result = removeRefFromFrontmatter(
    before,
    "a11y_refs",
    "color-contrast",
  );
  assert.doesNotMatch(result, /a11y_refs:/);
  assert.match(result, /## 1\. Section/);
});

test("refTypeFor: accessibility domain maps to a11y_refs", () => {
  assert.equal(refTypeFor("accessibility"), "a11y_refs");
});

test("refTypeFor: motion domain maps to motion_refs", () => {
  assert.equal(refTypeFor("motion"), "motion_refs");
});

// Regression: when the modified block isn't the trailing key in the
// frontmatter, the old reconstruction glued the closing `---` onto the
// last content line because FRONTMATTER_RE's capture group excludes the
// trailing `\n`. Covers add + remove for a11y_refs ahead of motion_refs.
const MULTI_KEY = `---
# YAML comment line that previously confused the outline scanner
a11y_refs:
  - { ref: typography }
motion_refs:
  - { ref: drawer-open-close }
  - { ref: state-transitions, note: covers things }
---

## 2. Tokens

Body.
`;

test("addRefToFrontmatter: preserves the closing --- on its own line in multi-key frontmatter", () => {
  const result = addRefToFrontmatter(MULTI_KEY, "a11y_refs", {
    slug: "color-contrast",
    note: null,
  });
  assert.match(
    result,
    /\n---\n\n## 2\. Tokens/,
    "closing --- must remain on its own line followed by body",
  );
  // The motion_refs block should be intact, including its last entry.
  assert.match(result, /ref: state-transitions, note: covers things/);
  assert.match(result, /ref: color-contrast/);
});

test("removeRefFromFrontmatter: preserves the closing --- in multi-key frontmatter", () => {
  const withExtra = addRefToFrontmatter(MULTI_KEY, "a11y_refs", {
    slug: "color-contrast",
    note: null,
  });
  const result = removeRefFromFrontmatter(
    withExtra,
    "a11y_refs",
    "color-contrast",
  );
  assert.match(
    result,
    /\n---\n\n## 2\. Tokens/,
    "closing --- must remain on its own line after remove",
  );
  assert.doesNotMatch(result, /ref: color-contrast/);
  assert.match(result, /ref: state-transitions/);
});
