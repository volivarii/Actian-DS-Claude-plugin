import { test } from "node:test";
import assert from "node:assert/strict";
import { EditorState } from "@codemirror/state";
import { CompletionContext } from "@codemirror/autocomplete";
import { anchorCompletionSource } from "../../src/markdown-engine/anchorCompletion";
import { setCachedIndexForTesting } from "../../src/lib/anchorIndex";

function ctxAt(doc: string, pos: number) {
  const state = EditorState.create({ doc });
  return new CompletionContext(state, pos, false);
}

function primeIndex(slugs: Record<string, { defs: string[]; refs: string[] }>) {
  const entries = new Map();
  for (const [slug, v] of Object.entries(slugs)) {
    entries.set(slug, {
      slug,
      definedIn: v.defs,
      referencedBy: v.refs,
    });
  }
  setCachedIndexForTesting({
    entries,
    scannedAt: 0,
    scannedPaths: [],
  });
}

test("anchorCompletionSource: triggers inside markdown link (#…)", () => {
  primeIndex({ "aria-labels": { defs: ["a.md"], refs: [] } });
  const doc = "See [more](#ari";
  const result = anchorCompletionSource(ctxAt(doc, doc.length));
  assert.notEqual(result, null);
  assert.deepEqual(
    result!.options.map((o) => o.label),
    ["aria-labels"],
  );
});

test("anchorCompletionSource: triggers in cross-file link (path#…)", () => {
  primeIndex({ "focus-keyboard": { defs: ["a.md"], refs: ["b.md"] } });
  const doc = "[k](accessibility#foc";
  const result = anchorCompletionSource(ctxAt(doc, doc.length));
  assert.notEqual(result, null);
  assert.deepEqual(
    result!.options.map((o) => o.label),
    ["focus-keyboard"],
  );
});

test("anchorCompletionSource: triggers in inline YAML ref: with partial filtering", () => {
  primeIndex({
    one: { defs: ["a"], refs: [] },
    two: { defs: ["b"], refs: [] },
  });
  const doc = "- { ref: o";
  const result = anchorCompletionSource(ctxAt(doc, doc.length));
  assert.notEqual(result, null);
  assert.deepEqual(
    result!.options.map((o) => o.label),
    ["one"],
  );
});

test("anchorCompletionSource: empty YAML partial returns all slugs", () => {
  primeIndex({
    one: { defs: ["a"], refs: [] },
    two: { defs: ["b"], refs: [] },
  });
  const doc = "- { ref: ";
  const result = anchorCompletionSource(ctxAt(doc, doc.length));
  assert.notEqual(result, null);
  assert.deepEqual(result!.options.map((o) => o.label).sort(), ["one", "two"]);
});

test("anchorCompletionSource: returns null outside trigger contexts", () => {
  primeIndex({ alpha: { defs: ["a"], refs: [] } });
  const doc = "just some prose";
  const result = anchorCompletionSource(ctxAt(doc, doc.length));
  assert.equal(result, null);
});

test("anchorCompletionSource: detail string shows reference count", () => {
  primeIndex({ alpha: { defs: ["a"], refs: ["x", "y", "z"] } });
  const doc = "[k](#al";
  const result = anchorCompletionSource(ctxAt(doc, doc.length));
  const opt = result!.options.find((o) => o.label === "alpha");
  assert.ok(opt!.detail!.includes("3"));
});
