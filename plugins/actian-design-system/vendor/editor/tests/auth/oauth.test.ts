import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import {
  signInWithOAuth,
  loadOAuthSession,
  WORKER_ORIGIN,
} from "../../src/auth/oauth";
import { __resetForTesting, getSession } from "../../src/auth";

afterEach(() => {
  __resetForTesting();
  try {
    localStorage.removeItem("editor.auth.oauth");
  } catch {
    /* */
  }
});

// Helper: fakes window.open + fetch for /user
function setupBrowserMocks(opts: { userLogin?: string } = {}) {
  const opened: { url: string; source: any; _lastReply?: any } = {
    url: "",
    source: null,
  };
  (window as any).open = (url: string) => {
    opened.url = url;
    const source = {
      closed: false,
      postMessage: (data: any) => {
        opened._lastReply = data;
      },
    };
    opened.source = source;
    return source;
  };
  (global as any).fetch = async (url: string) => {
    if (url === "https://api.github.com/user") {
      return {
        ok: true,
        json: async () => ({ login: opts.userLogin ?? "octocat" }),
      };
    }
    throw new Error(`unexpected fetch: ${url}`);
  };
  return opened;
}

async function dispatchWorkerMessage(data: string, source?: any) {
  window.dispatchEvent(
    new MessageEvent("message", {
      origin: WORKER_ORIGIN,
      data,
      source,
    } as any),
  );
  await new Promise((r) => setTimeout(r, 10));
}

test("auth/oauth: signInWithOAuth opens the Worker /auth endpoint (not GitHub directly)", async () => {
  const opened = setupBrowserMocks();
  const sessionPromise = signInWithOAuth();

  await new Promise((r) => setTimeout(r, 10));
  await dispatchWorkerMessage("authorizing:github", opened.source);
  await dispatchWorkerMessage(
    `authorization:github:success:${JSON.stringify({ provider: "github", token: "gho_test" })}`,
  );

  const session = await sessionPromise;
  assert.ok(opened.url.startsWith(WORKER_ORIGIN + "/auth"));
  assert.ok(opened.url.includes("provider=github"));
  assert.ok(opened.url.includes("site_id="));
  assert.equal(session.method, "oauth");
  assert.equal(session.token, "gho_test");
  assert.equal(session.login, "octocat");
  assert.equal(getSession()?.token, "gho_test");
});

test("auth/oauth: handshake — SPA replies to popup's authorizing:github ping", async () => {
  const opened = setupBrowserMocks();
  const sessionPromise = signInWithOAuth();

  await new Promise((r) => setTimeout(r, 10));
  await dispatchWorkerMessage("authorizing:github", opened.source);

  // The SPA should have replied to the popup with "authorizing:github".
  assert.equal(opened._lastReply, "authorizing:github");

  // Now send the success payload to complete the round-trip.
  await dispatchWorkerMessage(
    `authorization:github:success:${JSON.stringify({ provider: "github", token: "gho_done" })}`,
  );
  const session = await sessionPromise;
  assert.equal(session.token, "gho_done");
});

test("auth/oauth: ignores messages from wrong origin", async () => {
  const opened = setupBrowserMocks();
  const sessionPromise = signInWithOAuth();

  await new Promise((r) => setTimeout(r, 10));
  // Wrong-origin attempt to inject a token:
  window.dispatchEvent(
    new MessageEvent("message", {
      origin: "https://evil.example.com",
      data: `authorization:github:success:${JSON.stringify({ provider: "github", token: "stolen" })}`,
    } as any),
  );
  await new Promise((r) => setTimeout(r, 10));

  // Real handshake afterwards must still resolve correctly.
  await dispatchWorkerMessage("authorizing:github", opened.source);
  await dispatchWorkerMessage(
    `authorization:github:success:${JSON.stringify({ provider: "github", token: "gho_real" })}`,
  );
  const session = await sessionPromise;
  assert.equal(session.token, "gho_real");
});

test("auth/oauth: rejects on error payload from the Worker", async () => {
  const opened = setupBrowserMocks();
  const sessionPromise = signInWithOAuth();
  // Attach the rejection handler immediately so Node does not treat the
  // eventual rejection as unhandled before assert.rejects can catch it.
  const rejectResult = assert.rejects(sessionPromise, /token request failed/i);

  await new Promise((r) => setTimeout(r, 10));
  await dispatchWorkerMessage("authorizing:github", opened.source);
  await dispatchWorkerMessage(
    `authorization:github:error:${JSON.stringify({ provider: "github", error: "Token request failed", errorCode: "TOKEN_REQUEST_FAILED" })}`,
  );

  await rejectResult;
});

test("auth/oauth: rejects if popup is blocked", async () => {
  (window as any).open = () => null;
  await assert.rejects(signInWithOAuth(), /popup/i);
});

test("auth/oauth: loadOAuthSession reads from localStorage", () => {
  const data = {
    method: "oauth" as const,
    token: "gho_persisted",
    login: "octocat",
  };
  localStorage.setItem("editor.auth.oauth", JSON.stringify(data));
  const s = loadOAuthSession();
  assert.equal(s?.token, "gho_persisted");
  assert.equal(s?.login, "octocat");
});

test("auth/oauth: loadOAuthSession returns null when absent", () => {
  const s = loadOAuthSession();
  assert.equal(s, null);
});
