// Categories loader — used by the CategorySelectWidget to populate the
// dropdown over the canonical set of category slugs. The source of truth
// is `components/src/categories/*.md` (one file per category); each
// `inherited` domain resolves to its category file's content.
//
// Cached per-session (5-min TTL); sessionStorage-backed.

import type { Octokit } from "@octokit/rest";
import { listFilesByGlob } from "../app/githubApi";

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_KEY = "editor:categories:v1";
const SKIP_FILES = new Set(["AUTHORING.md"]);

interface CachedEntry {
  slugs: string[];
  fetchedAt: number;
}

export async function loadCategories(gh: Octokit): Promise<string[]> {
  const cached = readCache();
  if (cached) return cached.slugs;
  try {
    const files = await listFilesByGlob(gh, "components/src/categories", {
      extension: ".md",
      exclude: Array.from(SKIP_FILES),
    });
    // Strip .md extension → slug list.
    const slugs = files
      .filter((f) => !SKIP_FILES.has(f))
      .map((f) => f.replace(/\.md$/, ""))
      .sort();
    writeCache(slugs);
    return slugs;
  } catch {
    return [];
  }
}

function readCache(): CachedEntry | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry;
    if (
      typeof parsed?.fetchedAt !== "number" ||
      Date.now() - parsed.fetchedAt > CACHE_TTL_MS ||
      !Array.isArray(parsed.slugs)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(slugs: string[]): void {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ slugs, fetchedAt: Date.now() }),
    );
  } catch {
    /* silent */
  }
}
