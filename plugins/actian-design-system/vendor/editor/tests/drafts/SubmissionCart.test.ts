import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { SubmissionCart, type CartEntry } from "../../src/drafts/SubmissionCart";

function makeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => Array.from(map.keys())[i] ?? null,
    removeItem: (k) => {
      map.delete(k);
    },
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

function entry(path: string, t = Date.now()): CartEntry {
  return { path, content: `body of ${path}`, basedOnSha: "abc1234", addedAt: t };
}

let cart: SubmissionCart;
beforeEach(() => {
  cart = new SubmissionCart(makeStorage());
});

test("SubmissionCart: starts empty", () => {
  assert.deepEqual(cart.list(), []);
});

test("SubmissionCart: add appends entries", () => {
  cart.add(entry("a.md"));
  cart.add(entry("b.md"));
  assert.deepEqual(
    cart.list().map((e) => e.path),
    ["a.md", "b.md"],
  );
});

test("SubmissionCart: add replaces existing entry for same path", () => {
  cart.add(entry("a.md", 1));
  cart.add(entry("a.md", 2));
  const list = cart.list();
  assert.equal(list.length, 1);
  assert.equal(list[0]!.addedAt, 2);
});

test("SubmissionCart: remove drops entry by path", () => {
  cart.add(entry("a.md"));
  cart.add(entry("b.md"));
  cart.remove("a.md");
  assert.deepEqual(
    cart.list().map((e) => e.path),
    ["b.md"],
  );
});

test("SubmissionCart: remove of unknown path is a no-op", () => {
  cart.add(entry("a.md"));
  cart.remove("nope.md");
  assert.equal(cart.list().length, 1);
});

test("SubmissionCart: clear empties the cart", () => {
  cart.add(entry("a.md"));
  cart.add(entry("b.md"));
  cart.clear();
  assert.deepEqual(cart.list(), []);
});

test("SubmissionCart: has returns presence", () => {
  cart.add(entry("a.md"));
  assert.ok(cart.has("a.md"));
  assert.ok(!cart.has("b.md"));
});

test("SubmissionCart: subscribe fires on add/remove/clear", () => {
  const events: string[] = [];
  const unsub = cart.subscribe((e) => {
    events.push(e.kind + ":" + ("path" in e ? e.path : ""));
  });
  cart.add(entry("a.md"));
  cart.remove("a.md");
  cart.add(entry("b.md"));
  cart.clear();
  unsub();
  cart.add(entry("c.md")); // unsubscribed, should not fire
  assert.deepEqual(events, [
    "added:a.md",
    "removed:a.md",
    "added:b.md",
    "cleared:",
  ]);
});

test("SubmissionCart: persists across instances backed by same storage", () => {
  const storage = makeStorage();
  const c1 = new SubmissionCart(storage);
  c1.add(entry("a.md"));
  c1.add(entry("b.md"));
  const c2 = new SubmissionCart(storage);
  assert.equal(c2.list().length, 2);
});

test("SubmissionCart: malformed JSON in storage returns empty list", () => {
  const storage = makeStorage();
  storage.setItem("editor:submission-cart:v1", "not-json");
  const c = new SubmissionCart(storage);
  assert.deepEqual(c.list(), []);
});
