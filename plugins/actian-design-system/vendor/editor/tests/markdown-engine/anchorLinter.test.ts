import { test } from "node:test";
import assert from "node:assert/strict";
import { computeRenameWarnings } from "../../src/markdown-engine/anchorLinter";
import { setCachedIndexForTesting } from "../../src/lib/anchorIndex";

function primeIndex(slugs: Record<string, { defs: string[]; refs: string[] }>) {
  const entries = new Map();
  for (const [slug, v] of Object.entries(slugs)) {
    entries.set(slug, { slug, definedIn: v.defs, referencedBy: v.refs });
  }
  setCachedIndexForTesting({ entries, scannedAt: 0, scannedPaths: [] });
}

test("computeRenameWarnings: no warning when slug matches the index", () => {
  primeIndex({ "alpha": { defs: ["foundations/src/foundations.md"], refs: ["x.md"] } });
  const text = "## Title {#alpha}\n";
  const warnings = computeRenameWarnings("foundations/src/foundations.md", text);
  assert.deepEqual(warnings, []);
});

test("computeRenameWarnings: warns when an indexed slug disappeared", () => {
  primeIndex({ "alpha": { defs: ["foundations/src/foundations.md"], refs: ["x.md", "y.md"] } });
  const text = "## Title {#renamed}\n"; // alpha was renamed → warning
  const warnings = computeRenameWarnings("foundations/src/foundations.md", text);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0]!.removedSlug, "alpha");
  assert.equal(warnings[0]!.refCount, 2);
});

test("computeRenameWarnings: no warning for a brand-new slug in this draft", () => {
  primeIndex({});
  const text = "## Title {#brand-new}\n";
  const warnings = computeRenameWarnings("foundations/src/foundations.md", text);
  assert.deepEqual(warnings, []);
});
