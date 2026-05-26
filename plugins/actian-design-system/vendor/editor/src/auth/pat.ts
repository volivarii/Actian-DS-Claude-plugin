import type { AuthSession } from "./types";
import { _setSession } from "./index";

const STORAGE_KEY = "editor.auth.pat";

export function signInWithPAT(pat: string): AuthSession {
  const trimmed = pat.trim();
  if (trimmed === "") {
    throw new Error("PAT must not be empty");
  }
  const session: AuthSession = { method: "pat", token: trimmed };
  try {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } catch {
    /* storage may be disabled; session still set in-memory */
  }
  _setSession(session);
  return session;
}

export function loadPATSession(): AuthSession | null {
  try {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return null;
    return { method: "pat", token };
  } catch {
    return null;
  }
}
