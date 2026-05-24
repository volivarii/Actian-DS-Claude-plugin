// Small helper layer around Octokit for the vertical slice. Reads bytes from
// the repo (component dirs, _meta.yml, schemas) by their path on `main`.
// Phase 1b consolidates this with the writer (submitDraft) into a single
// repo-access module — for the vertical slice, keeping them split is fine.

import type { Octokit } from "@octokit/rest";

export interface RepoCoords {
  owner: string;
  repo: string;
  ref?: string;
}

const DEFAULT_COORDS: Required<RepoCoords> = {
  owner: "volivarii",
  repo: "actian-ds-knowledge",
  ref: "main",
};

function withDefaults(coords?: RepoCoords): Required<RepoCoords> {
  return { ...DEFAULT_COORDS, ...(coords ?? {}) };
}

export async function listDirectories(
  gh: Octokit,
  dirPath: string,
  coords?: RepoCoords,
): Promise<string[]> {
  const { owner, repo, ref } = withDefaults(coords);
  const res = await gh.repos.getContent({ owner, repo, path: dirPath, ref });
  if (!Array.isArray(res.data)) {
    throw new Error(`expected directory listing at ${dirPath}`);
  }
  return res.data
    .filter((entry) => entry.type === "dir")
    .map((entry) => entry.name)
    .sort();
}

export async function getTextFile(
  gh: Octokit,
  filePath: string,
  coords?: RepoCoords,
): Promise<string> {
  const { owner, repo, ref } = withDefaults(coords);
  const res = await gh.repos.getContent({
    owner,
    repo,
    path: filePath,
    ref,
  });
  if (Array.isArray(res.data) || !("content" in res.data)) {
    throw new Error(`expected a file at ${filePath}`);
  }
  // GitHub returns base64 by default for files via getContent.
  if (res.data.encoding !== "base64") {
    throw new Error(`unexpected encoding: ${res.data.encoding}`);
  }
  return atob(res.data.content.replace(/\n/g, ""));
}
