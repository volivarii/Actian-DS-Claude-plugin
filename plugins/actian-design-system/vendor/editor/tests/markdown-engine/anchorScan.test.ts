import { test } from "node:test";
import assert from "node:assert/strict";
import { scanAnchors } from "../../src/markdown-engine/anchorScan";

test("scanAnchors: extracts a single anchor from a heading", () => {
  const got = scanAnchors("## Color  {#color}\n");
  assert.deepEqual([...got].sort(), ["color"]);
});

test("scanAnchors: extracts multiple anchors", () => {
  const text = "## A {#a}\n\n## B {#b}\n\n### C {#c-kebab}\n";
  assert.deepEqual([...scanAnchors(text)].sort(), ["a", "b", "c-kebab"]);
});

test("scanAnchors: ignores fenced code blocks", () => {
  const text = "## Real {#real}\n\n```\n## Fake {#fake}\n```\n";
  assert.deepEqual([...scanAnchors(text)].sort(), ["real"]);
});

test("scanAnchors: ignores indented code blocks (documented trade-off)", () => {
  const text = "## Real {#real}\n\n    ## Fake {#fake}\n";
  // Indented code blocks NOT excluded — would need a full block parser.
  // Authors should use fenced blocks.
  assert.deepEqual([...scanAnchors(text)].sort(), ["fake", "real"]);
});

test("scanAnchors: ignores inline code", () => {
  const text = "Use `{#fake}` syntax. ## Real {#real}\n";
  assert.deepEqual([...scanAnchors(text)].sort(), ["real"]);
});

test("scanAnchors: ignores HTML comments", () => {
  const text = "<!-- ## Hidden {#hidden} -->\n## Real {#real}\n";
  assert.deepEqual([...scanAnchors(text)].sort(), ["real"]);
});

test("scanAnchors: ignores malformed anchors", () => {
  const text = "## A {color}\n## B {#}\n## C {#Color}\n## D {#-bad}\n## E {#good-1}\n";
  assert.deepEqual([...scanAnchors(text)].sort(), ["good-1"]);
});

test("scanAnchors: returns Set (deduped)", () => {
  const text = "## A {#color}\n\n[ref](#color)\n\n## B {#color}\n";
  const got = scanAnchors(text);
  assert.equal(got.size, 1);
  assert.ok(got.has("color"));
});

test("scanAnchors: empty input returns empty set", () => {
  assert.equal(scanAnchors("").size, 0);
});
