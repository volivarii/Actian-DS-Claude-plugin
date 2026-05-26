import type { AuthSession } from "./types";
import { _setSession } from "./index";

// Set during Phase A — the deployed Worker URL.
// Update this string when the OAuth App / Worker move to the Actian org
// (see auth-worker/README.md "Ownership transfer" runbook).
export const WORKER_ORIGIN =
  "https://actian-ds-knowledge-auth.volivari.workers.dev";

const STORAGE_KEY = "editor.auth.oauth";

interface PersistedOAuth {
  method: "oauth";
  token: string;
  login?: string;
}

interface WorkerSuccessPayload {
  provider: string;
  token: string;
}

interface WorkerErrorPayload {
  provider: string;
  error: string;
  errorCode?: string;
}

export async function signInWithOAuth(): Promise<AuthSession> {
  const params = new URLSearchParams({
    provider: "github",
    site_id: window.location.hostname,
  });
  const authUrl = `${WORKER_ORIGIN}/auth?${params}`;
  const popup = window.open(authUrl, "github-oauth", "width=600,height=720");
  if (!popup) {
    throw new Error(
      "Popup blocked. Allow popups for this site or use the PAT fallback.",
    );
  }

  return new Promise<AuthSession>((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(pollClose);
    };

    const onMessage = async (event: MessageEvent) => {
      if (settled) return;
      if (event.origin !== WORKER_ORIGIN) return;
      if (typeof event.data !== "string") return;

      // Phase 1: popup pings opener; reply so popup will send the token.
      if (event.data === "authorizing:github") {
        (event.source as Window | null)?.postMessage(
          "authorizing:github",
          event.origin,
        );
        return;
      }

      // Phase 2: popup sends `authorization:github:<status>:<json>`.
      const match = event.data.match(
        /^authorization:github:(success|error):(.+)$/,
      );
      if (!match || !match[2]) return;
      const status = match[1];
      const payloadStr = match[2];
      settled = true;
      cleanup();

      if (status === "error") {
        let payload: WorkerErrorPayload | null = null;
        try {
          payload = JSON.parse(payloadStr);
        } catch {
          reject(new Error("Sign-in failed (malformed error payload)"));
          return;
        }
        reject(new Error(payload?.error ?? "Sign-in failed"));
        return;
      }

      // Success: parse payload + fetch login from /user.
      let payload: WorkerSuccessPayload;
      try {
        payload = JSON.parse(payloadStr);
      } catch {
        reject(new Error("Sign-in failed (malformed success payload)"));
        return;
      }
      let login: string | undefined;
      try {
        const res = await fetch("https://api.github.com/user", {
          headers: { Authorization: `token ${payload.token}` },
        });
        if (res.ok) {
          const user = (await res.json()) as { login?: string };
          login = user.login;
        }
      } catch {
        /* login is informational; not blocking */
      }

      const session: AuthSession = {
        method: "oauth",
        token: payload.token,
        login,
      };
      persist(session);
      _setSession(session);
      resolve(session);
    };
    window.addEventListener("message", onMessage);

    // If the popup closes without sending a message, fail after a short
    // grace period (give postMessage time to arrive).
    const pollClose = window.setInterval(() => {
      if (popup.closed && !settled) {
        settled = true;
        cleanup();
        reject(new Error("Sign-in popup was closed before completing"));
      }
    }, 500);
  });
}

export function loadOAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedOAuth;
  } catch {
    return null;
  }
}

function persist(session: AuthSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* */
  }
}
