import { Octokit } from "@octokit/rest";
import { getSession } from "../auth";

export class MissingAuthError extends Error {
  constructor() {
    super(
      "Not signed in. Click 'Sign in with GitHub' or paste a Personal Access Token in Settings.",
    );
    this.name = "MissingAuthError";
  }
}

// Backwards-compat alias — existing callers reference MissingPATError.
export const MissingPATError = MissingAuthError;

export function createOctokit(): Octokit {
  const session = getSession();
  if (!session) throw new MissingAuthError();
  return new Octokit({ auth: session.token });
}
