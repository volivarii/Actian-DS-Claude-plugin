// Smoke test for the local-file connection extractor.
//
// parseLocalFrontmatter must produce OutgoingConnection[] entries with
// correct refType + note + domain resolution against the supplied
// taxonomy. Unknown slugs surface as `domain: null` (broken) — the
// inspector renders them with the unresolved-row treatment.

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLocalFrontmatter } from "../../src/substrate/parseLocalFrontmatter";
import type { Taxonomy } from "../../src/substrate/taxonomy";

const tax: Taxonomy = {
  getSlugs: () => [],
  getTitle: () => null,
  getBody: () => null,
  domainOfSlug: (slug) => {
    if (slug === "color-contrast") return "accessibility";
    if (slug === "state-transitions") return "motion";
    return null;
  },
  searchSections: () => [],
};

test("parseLocalFrontmatter: returns empty list when no envelope", () => {
  assert.deepEqual(parseLocalFrontmatter("# Just a heading\n", tax), []);
});

test("parseLocalFrontmatter: extracts a11y_refs with notes", () => {
  const src = [
    "---",
    "a11y_refs:",
    "  - { ref: color-contrast, note: AA on body text }",
    "---",
    "",
    "## Heading\n",
  ].join("\n");
  const out = parseLocalFrontmatter(src, tax);
  assert.equal(out.length, 1);
  assert.equal(out[0]!.slug, "color-contrast");
  assert.equal(out[0]!.refType, "a11y_refs");
  assert.equal(out[0]!.note, "AA on body text");
  assert.equal(out[0]!.domain, "accessibility");
});

test("parseLocalFrontmatter: extracts motion_refs", () => {
  const src = [
    "---",
    "motion_refs:",
    "  - { ref: state-transitions }",
    "---",
    "",
    "body",
  ].join("\n");
  const out = parseLocalFrontmatter(src, tax);
  assert.equal(out.length, 1);
  assert.equal(out[0]!.slug, "state-transitions");
  assert.equal(out[0]!.refType, "motion_refs");
  assert.equal(out[0]!.domain, "motion");
});

test("parseLocalFrontmatter: mixes both ref types in source order", () => {
  const src = [
    "---",
    "a11y_refs:",
    "  - { ref: color-contrast }",
    "motion_refs:",
    "  - { ref: state-transitions }",
    "---",
    "",
  ].join("\n");
  const out = parseLocalFrontmatter(src, tax);
  assert.equal(out.length, 2);
  assert.equal(out[0]!.refType, "a11y_refs");
  assert.equal(out[1]!.refType, "motion_refs");
});

test("parseLocalFrontmatter: unknown slug surfaces as domain: null", () => {
  const src = [
    "---",
    "a11y_refs:",
    "  - { ref: ghost-topic }",
    "---",
    "",
  ].join("\n");
  const out = parseLocalFrontmatter(src, tax);
  assert.equal(out.length, 1);
  assert.equal(out[0]!.slug, "ghost-topic");
  assert.equal(out[0]!.domain, null);
});
