/**
 * orderManifestLoader.ts
 *
 * Fetches a domain's `_order.json` from GitHub and returns the parsed slug
 * array alongside the file's blob SHA. The SHA is required for write-back
 * (GitHub's update-file API rejects requests that omit the current SHA).
 *
 * Returns `null` when the manifest does not yet exist (404) so callers can
 * treat an absent `_order.json` as an empty / unordered domain without
 * throwing. All other errors (network, bad JSON, wrong shape) are re-thrown
 * so callers see them as genuine failures.
 */

import type { Octokit } from "@octokit/rest";
import { type RepoCoords, decodeBase64Utf8 } from "../app/githubApi";
import { DEFAULT_COORDS } from "../config/coords";

export interface OrderManifestResult {
  order: string[];
  sha: string;
}

export async function loadOrderManifest(
  octokit: Octokit,
  domainPath: string,
  coords?: RepoCoords,
): Promise<OrderManifestResult | null> {
  const merged: Required<RepoCoords> = {
    ...DEFAULT_COORDS,
    ref: "main",
    ...(coords ?? {}),
  };
  const { owner, repo, ref } = merged;
  const path = `${domainPath}/_order.json`;

  let res: Awaited<ReturnType<typeof octokit.repos.getContent>>;
  try {
    res = await octokit.repos.getContent({ owner, repo, path, ref });
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      (err as { status: unknown }).status === 404
    ) {
      return null;
    }
    throw err;
  }

  const data = res.data as { content: string; encoding: string; sha: string };
  const raw = decodeBase64Utf8(data.content);
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(
      `loadOrderManifest: ${path} is not an array`,
    );
  }
  if (!parsed.every((item) => typeof item === "string")) {
    throw new Error(
      `loadOrderManifest: ${path} is not an array of strings`,
    );
  }

  return { order: parsed as string[], sha: data.sha };
}
