import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appendSlug,
  removeSlug,
  moveSlug,
} from "../../src/lib/orderManifest";

test("appendSlug appends to end and returns a new array", () => {
  const order = ["a", "b", "c"];
  const next = appendSlug(order, "d");
  assert.deepEqual(next, ["a", "b", "c", "d"]);
  assert.deepEqual(order, ["a", "b", "c"]);
  assert.notEqual(next, order);
});

test("appendSlug throws on duplicate slug", () => {
  assert.throws(() => appendSlug(["a", "b"], "a"), /already exists/i);
});

test("removeSlug removes the slug and returns a new array", () => {
  const order = ["a", "b", "c"];
  const next = removeSlug(order, "b");
  assert.deepEqual(next, ["a", "c"]);
  assert.deepEqual(order, ["a", "b", "c"]);
});

test("removeSlug throws on unknown slug", () => {
  assert.throws(() => removeSlug(["a", "b"], "z"), /not found/i);
});

test("moveSlug repositions a slug", () => {
  assert.deepEqual(moveSlug(["a", "b", "c", "d"], "a", 2), ["b", "c", "a", "d"]);
  assert.deepEqual(moveSlug(["a", "b", "c", "d"], "d", 0), ["d", "a", "b", "c"]);
});

test("moveSlug is a no-op when source equals dest", () => {
  const order = ["a", "b", "c"];
  const next = moveSlug(order, "b", 1);
  assert.deepEqual(next, order);
});

test("moveSlug throws on unknown slug", () => {
  assert.throws(() => moveSlug(["a", "b"], "z", 0), /not found/i);
});

test("moveSlug clamps target index into [0, length-1]", () => {
  assert.deepEqual(moveSlug(["a", "b", "c"], "a", 99), ["b", "c", "a"]);
  assert.deepEqual(moveSlug(["a", "b", "c"], "c", -3), ["c", "a", "b"]);
});
