// Git-derived metadata fields surfaced in the Authoring Workspace.
//
// Phase 3a of T1.8: instead of asking authors to maintain
// `domains.<d>.updatedAt` and `owner` by hand (which we know they don't),
// derive them from the most recent commit touching the file. Honest
// staleness + actual authorship; no manual drift.
//
// Cached per-session (sessionStorage, 5-min TTL) to avoid re-fetching on
// every accordion expand/collapse cycle.

import type { Octokit } from "@octokit/rest";

export interface CommitInfo {
  /** GitHub login of the commit author. null when the commit author
   *  isn't a GitHub user (e.g. unmapped email). */
  author: string | null;
  /** ISO-8601 commit timestamp. */
  date: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_PREFIX = "editor:commit-info:";

interface CachedEntry {
  info: CommitInfo | null;
  fetchedAt: number;
}

/**
 * Fetch the latest commit touching `path` on main. Returns null when no
 * commit history exists (file not yet committed) or the fetch fails.
 *
 * The owner/repo are hardcoded to volivarii/actian-ds-knowledge to match
 * the rest of the editor; once a multi-repo story exists this should be
 * threaded through.
 */
export async function fetchLatestCommit(
  gh: Octokit,
  path: string,
): Promise<CommitInfo | null> {
  const cacheKey = CACHE_PREFIX + path;
  const cached = readCache(cacheKey);
  if (cached) return cached.info;

  try {
    const res = await gh.repos.listCommits({
      owner: "volivarii",
      repo: "actian-ds-knowledge",
      path,
      per_page: 1,
    });
    const commit = res.data[0];
    if (!commit) {
      writeCache(cacheKey, null);
      return null;
    }
    const info: CommitInfo = {
      author: commit.author?.login ?? null,
      date:
        commit.commit.author?.date ?? commit.commit.committer?.date ?? "",
    };
    writeCache(cacheKey, info);
    return info;
  } catch {
    // Silent failure — caller treats null as "no derived info available";
    // UI degrades to omitting the badge rather than throwing.
    return null;
  }
}

function readCache(key: string): CachedEntry | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry;
    if (
      typeof parsed?.fetchedAt !== "number" ||
      Date.now() - parsed.fetchedAt > CACHE_TTL_MS
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key: string, info: CommitInfo | null): void {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ info, fetchedAt: Date.now() }),
    );
  } catch {
    // Quota or unavailable storage — silently skip cache.
  }
}

/**
 * Human-relative time. Stable units; rolls up gradually.
 *   <60s   → "just now"
 *   <60m   → "Nm ago"
 *   <24h   → "Nh ago"
 *   <30d   → "Nd ago"
 *   <12mo  → "Nmo ago"
 *   else   → "Ny ago"
 */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "";
  const diffSec = Math.max(0, Math.floor((now - ts) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  const diffYr = Math.floor(diffMo / 12);
  return `${diffYr}y ago`;
}
