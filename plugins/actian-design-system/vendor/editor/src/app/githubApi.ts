// Small helper layer around Octokit for the vertical slice. Reads bytes from
// the repo (component dirs, _meta.yml, schemas) by their path on `main`.
// Phase 1b consolidates this with the writer (submitDraft) into a single
// repo-access module — for the vertical slice, keeping them split is fine.

import type { Octokit } from "@octokit/rest";
import { DEFAULT_COORDS as ORG_COORDS } from "../config/coords";

export interface RepoCoords {
  owner: string;
  repo: string;
  ref?: string;
}

const DEFAULTS_WITH_REF: Required<RepoCoords> = {
  ...ORG_COORDS,
  ref: "main",
};

function withDefaults(coords?: RepoCoords): Required<RepoCoords> {
  return { ...DEFAULTS_WITH_REF, ...(coords ?? {}) };
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
  return decodeBase64Utf8(res.data.content);
}

/**
 * Decode base64 content (as returned by GitHub's getContent API) to UTF-8.
 * Bare `atob` treats decoded bytes as Latin-1, which corrupts non-ASCII
 * characters (em dashes, curly quotes, arrows) common in SoT markdown.
 * The Uint8Array + TextDecoder dance preserves the full UTF-8 round-trip.
 */
export function decodeBase64Utf8(b64: string): string {
  const bytes = Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) =>
    c.charCodeAt(0),
  );
  return new TextDecoder("utf-8").decode(bytes);
}

/**
 * List files (not subdirectories) in a directory, optionally filtered by
 * extension and an explicit name-exclusion list. Used by the Sidebar to
 * enumerate foundations/src/*.md and accessibility/*.md (minus AUTHORING.md).
 */
export async function listFilesByGlob(
  gh: Octokit,
  dirPath: string,
  options: { extension?: string; exclude?: string[]; coords?: RepoCoords } = {},
): Promise<string[]> {
  const { owner, repo, ref } = withDefaults(options.coords);
  const res = await gh.repos.getContent({ owner, repo, path: dirPath, ref });
  if (!Array.isArray(res.data)) {
    throw new Error(`expected directory listing at ${dirPath}`);
  }
  const exclude = new Set(options.exclude ?? []);
  return res.data
    .filter((entry) => entry.type === "file")
    .filter(
      (entry) => !options.extension || entry.name.endsWith(options.extension),
    )
    .filter((entry) => !exclude.has(entry.name))
    .map((entry) => entry.name)
    .sort();
}
