import { Octokit } from "@octokit/rest";
import { PATVault } from "../settings/PATVault";

export class MissingPATError extends Error {
  constructor() {
    super("No GitHub PAT saved — open Settings and paste a token.");
    this.name = "MissingPATError";
  }
}

// Factory so tests can inject a fake; production reads from PATVault.
export function createOctokit(token?: string): Octokit {
  const resolved = token ?? new PATVault().get();
  if (!resolved) throw new MissingPATError();
  return new Octokit({
    auth: resolved,
    userAgent: "actian-ds-knowledge-editor/0.1",
  });
}
