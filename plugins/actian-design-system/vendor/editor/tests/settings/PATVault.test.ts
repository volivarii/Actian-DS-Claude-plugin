import { test } from "node:test";
import assert from "node:assert/strict";
import { PATVault } from "../../src/settings/PATVault";

function memStore() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
  };
}

test("PATVault — set/get round-trips the token", () => {
  const vault = new PATVault(memStore());
  vault.set("ghp_test_token_value");
  assert.equal(vault.get(), "ghp_test_token_value");
});

test("PATVault — clear removes the token", () => {
  const vault = new PATVault(memStore());
  vault.set("x");
  vault.clear();
  assert.equal(vault.get(), null);
});

test("PATVault — get returns null when nothing stored", () => {
  assert.equal(new PATVault(memStore()).get(), null);
});

test("PATVault — set persists across new instances backed by the same store", () => {
  const store = memStore();
  new PATVault(store).set("ghp_persistent");
  assert.equal(new PATVault(store).get(), "ghp_persistent");
});
