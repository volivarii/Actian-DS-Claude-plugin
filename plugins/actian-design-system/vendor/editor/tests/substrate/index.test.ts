import { test } from "node:test";
import assert from "node:assert/strict";
import * as substrate from "../../src/substrate";

test("substrate barrel: re-exports loadTaxonomy", () => {
  assert.equal(typeof substrate.loadTaxonomy, "function");
});

test("substrate barrel: re-exports buildRefGraph", () => {
  assert.equal(typeof substrate.buildRefGraph, "function");
});

test("substrate barrel: re-exports suggestRefs", () => {
  assert.equal(typeof substrate.suggestRefs, "function");
});

test("substrate barrel: re-exports TaxonomyLoadError", () => {
  assert.equal(typeof substrate.TaxonomyLoadError, "function");
});

test("substrate barrel: parseFrontmatter exposed for editor reuse", () => {
  assert.equal(typeof substrate.parseFrontmatter, "function");
});
