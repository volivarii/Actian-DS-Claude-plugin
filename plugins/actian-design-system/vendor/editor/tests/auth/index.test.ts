import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getSession,
  signOut,
  subscribe,
  __resetForTesting,
  __setSessionForTesting,
} from "../../src/auth";

afterEach(() => {
  __resetForTesting();
});

test("auth: getSession returns null when no session", () => {
  assert.equal(getSession(), null);
});

test("auth: signOut clears the session", () => {
  __setSessionForTesting({ method: "pat", token: "ghp_test" });
  assert.notEqual(getSession(), null);
  signOut();
  assert.equal(getSession(), null);
});

test("auth: subscribe fires on session changes", () => {
  const events: Array<unknown> = [];
  const unsub = subscribe((s: unknown) => events.push(s));
  __setSessionForTesting({ method: "pat", token: "ghp_test" });
  signOut();
  unsub();
  assert.equal(events.length, 2);
  assert.notEqual(events[0], null);
  assert.equal(events[1], null);
});
