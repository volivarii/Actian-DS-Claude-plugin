import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { DraftStore, type Draft } from "../../src/drafts/DraftStore";

function makeMemoryStorage(): Storage {
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

let storage: Storage;
let store: DraftStore;
beforeEach(() => {
  storage = makeMemoryStorage();
  store = new DraftStore(storage);
});

test("DraftStore.save + load roundtrip", () => {
  const draft: Draft = {
    text: "## Hello\n",
    basedOnSha: "abc123",
    ts: 1700000000000,
  };
  store.save("foundations/src/02-color-primitives.md", draft);
  const got = store.load("foundations/src/02-color-primitives.md");
  assert.deepEqual(got, draft);
});

test("DraftStore.load returns null for missing path", () => {
  assert.equal(store.load("nonexistent.md"), null);
});

test("DraftStore.load returns null for corrupted JSON", () => {
  storage.setItem("editor:draft:foo.md", "not-json{{{");
  assert.equal(store.load("foo.md"), null);
});

test("DraftStore.clear removes a single path", () => {
  store.save("a.md", { text: "A", basedOnSha: "s1", ts: 1 });
  store.save("b.md", { text: "B", basedOnSha: "s2", ts: 2 });
  store.clear("a.md");
  assert.equal(store.load("a.md"), null);
  assert.ok(store.load("b.md"));
});

test("DraftStore.allPaths returns paths with drafts", () => {
  store.save("a.md", { text: "A", basedOnSha: "s1", ts: 1 });
  store.save("b.md", { text: "B", basedOnSha: "s2", ts: 2 });
  storage.setItem("unrelated", "value");
  const paths = store.allPaths();
  assert.deepEqual([...paths].sort(), ["a.md", "b.md"]);
});

test("DraftStore.save quota-exceeded returns false (no throw)", () => {
  const quotaStorage: Storage = {
    ...storage,
    setItem: () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    },
  };
  const quotaStore = new DraftStore(quotaStorage);
  const ok = quotaStore.save("foo.md", { text: "x", basedOnSha: "s", ts: 1 });
  assert.equal(ok, false);
});

test("DraftStore.save success returns true", () => {
  const ok = store.save("foo.md", { text: "x", basedOnSha: "s", ts: 1 });
  assert.equal(ok, true);
});

test("DraftStore.has returns true iff a draft exists", () => {
  assert.equal(store.has("foo.md"), false);
  store.save("foo.md", { text: "x", basedOnSha: "s", ts: 1 });
  assert.equal(store.has("foo.md"), true);
});
