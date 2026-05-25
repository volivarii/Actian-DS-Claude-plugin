import "../setup-dom";
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { signInWithPAT, loadPATSession } from "../../src/auth/pat";
import { getSession, __resetForTesting } from "../../src/auth";

afterEach(() => {
  __resetForTesting();
  try {
    localStorage.removeItem("editor.auth.pat");
  } catch {
    /* */
  }
});

test("auth/pat: signInWithPAT stores session + persists to localStorage", () => {
  const s = signInWithPAT("ghp_xyz123");
  assert.equal(s.method, "pat");
  assert.equal(s.token, "ghp_xyz123");
  assert.equal(getSession()?.token, "ghp_xyz123");
  assert.equal(localStorage.getItem("editor.auth.pat"), "ghp_xyz123");
});

test("auth/pat: loadPATSession reads from localStorage", () => {
  localStorage.setItem("editor.auth.pat", "ghp_persisted");
  const s = loadPATSession();
  assert.equal(s?.token, "ghp_persisted");
});

test("auth/pat: loadPATSession returns null when absent", () => {
  const s = loadPATSession();
  assert.equal(s, null);
});

test("auth/pat: signInWithPAT rejects empty input", () => {
  assert.throws(() => signInWithPAT(""));
  assert.throws(() => signInWithPAT("   "));
});
