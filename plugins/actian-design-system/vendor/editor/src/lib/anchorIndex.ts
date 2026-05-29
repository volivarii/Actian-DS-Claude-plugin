// Anchor index — read-only scanner + session cache over the substrate's
// {#kebab-slug} reference contracts. See spec
// 2026-05-24-anchor-autocomplete-design.md for the rationale + lifecycle.

import type { Octokit } from "@octokit/rest";
import {
  listFilesByGlob,
  listDirectories,
  getTextFile,
} from "../app/githubApi";

const HEADING_ANCHOR_RE = /^#{1,6}\s+.+?\s+\{#([a-z][a-z0-9-]*)\}\s*$/gm;
const BOLD_PARA_ANCHOR_RE = /^\*\*[^*]+\*\*\s+\{#([a-z][a-z0-9-]*)\}\s*$/gm;
const YAML_REF_RE = /\{\s*ref\s*:\s*([a-z][a-z0-9-]*)/g;
const LINK_ANCHOR_RE = /\[[^\]]+\]\((?!https?:\/\/)[^)]*#([a-z][a-z0-9-]*)\)/g;
const FENCED_CODE_RE = /(?:```|~~~)[\s\S]*?(?:```|~~~)/g;
// Matches `"ref":"<slug>"` and `"ref": "<slug>"` in JSON substrate files
// (e.g. components/dist/guidelines/*.json a11y_refs / motion_refs arrays).
const JSON_REF_RE = /"ref"\s*:\s*"([a-z][a-z0-9-]*)"/g;

export interface AnchorEntry {
  slug: string;
  definedIn: string[];
  referencedBy: string[];
}

export interface AnchorIndex {
  entries: Map<string, AnchorEntry>;
  scannedAt: number;
  scannedPaths: string[];
}

/** Pure scanner — no I/O. Strips fenced code first to avoid false positives. */
export function scanFileForAnchors(text: string): {
  defines: string[];
  references: string[];
} {
  const stripped = text.replace(FENCED_CODE_RE, (m) =>
    "\n".repeat(m.split("\n").length - 1),
  );
  const defines: string[] = [];
  const references: string[] = [];

  for (const re of [HEADING_ANCHOR_RE, BOLD_PARA_ANCHOR_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(stripped)) !== null) defines.push(m[1]!);
  }
  for (const re of [YAML_REF_RE, LINK_ANCHOR_RE, JSON_REF_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(stripped)) !== null) references.push(m[1]!);
  }
  return { defines, references };
}

// Module-level cache; reset by loadAnchorIndex with options.force.
let cached: AnchorIndex | null = null;
// In-flight build promise. Dedups concurrent loaders so the second caller
// awaits the first's fetch instead of starting a duplicate fan-out.
let inflight: Promise<AnchorIndex> | null = null;

export function getCachedIndex(): AnchorIndex | null {
  return cached;
}

export function setCachedIndexForTesting(index: AnchorIndex | null): void {
  cached = index;
  inflight = null;
}

export function findDefinitions(slug: string): string[] {
  if (!cached) return [];
  return cached.entries.get(slug)?.definedIn ?? [];
}

export function findReferences(slug: string): string[] {
  if (!cached) return [];
  return cached.entries.get(slug)?.referencedBy ?? [];
}

export function listSlugs(): string[] {
  if (!cached) return [];
  return Array.from(cached.entries.keys()).sort();
}

/** Build (or rebuild) the index by fetching all eligible markdown files
 *  and substrate JSON files (for JSON-style "ref":"slug" references).
 *  Dedups concurrent non-forced calls via the in-flight promise. */
export async function loadAnchorIndex(
  octokit: Octokit,
  options: { force?: boolean; cartOverrides?: Map<string, string> } = {},
): Promise<AnchorIndex> {
  if (cached && !options.force) return cached;
  if (inflight && !options.force) return inflight;

  const build = (async () => {
    const [mdPaths, jsonPaths] = await Promise.all([
      collectMarkdownPaths(octokit),
      collectJsonPaths(octokit),
    ]);
    const paths = [...mdPaths, ...jsonPaths];
    const cartOverrides = options.cartOverrides ?? new Map();
    const entries = new Map<string, AnchorEntry>();

    await Promise.all(
      paths.map(async (path) => {
        try {
          const text =
            cartOverrides.get(path) ?? (await getTextFile(octokit, path));
          const { defines, references } = scanFileForAnchors(text);
          for (const slug of defines) {
            const entry = ensureEntry(entries, slug);
            if (!entry.definedIn.includes(path)) entry.definedIn.push(path);
          }
          for (const slug of references) {
            const entry = ensureEntry(entries, slug);
            if (!entry.referencedBy.includes(path))
              entry.referencedBy.push(path);
          }
        } catch (err) {
          console.warn(
            `[anchorIndex] skipping ${path}:`,
            err instanceof Error ? err.message : err,
          );
        }
      }),
    );

    const result: AnchorIndex = {
      entries,
      scannedAt: Date.now(),
      scannedPaths: paths,
    };
    cached = result;
    return result;
  })();

  inflight = build;
  try {
    return await build;
  } finally {
    if (inflight === build) inflight = null;
  }
}

function ensureEntry(map: Map<string, AnchorEntry>, slug: string): AnchorEntry {
  let entry = map.get(slug);
  if (!entry) {
    entry = { slug, definedIn: [], referencedBy: [] };
    map.set(slug, entry);
  }
  return entry;
}

async function collectJsonPaths(gh: Octokit): Promise<string[]> {
  const [guidelines, foundationsDist, accessibilityDist] = await Promise.all([
    listFilesByGlob(gh, "components/dist/guidelines", {
      extension: ".json",
    }).catch(() => []),
    listFilesByGlob(gh, "foundations/dist", {
      extension: ".json",
    }).catch(() => []),
    listFilesByGlob(gh, "accessibility/dist", {
      extension: ".json",
    }).catch(() => []),
  ]);

  const paths: string[] = [];
  for (const name of guidelines)
    paths.push(`components/dist/guidelines/${name}`);
  for (const name of foundationsDist) paths.push(`foundations/dist/${name}`);
  for (const name of accessibilityDist)
    paths.push(`accessibility/dist/${name}`);
  return paths;
}

async function collectMarkdownPaths(gh: Octokit): Promise<string[]> {
  const [foundations, accessibility, patterns, product, writing, comps] =
    await Promise.all([
      listFilesByGlob(gh, "foundations/src", {
        extension: ".md",
        exclude: ["AUTHORING.md"],
      }).catch(() => []),
      listFilesByGlob(gh, "accessibility/src", {
        extension: ".md",
        exclude: ["AUTHORING.md"],
      }).catch(() => []),
      listFilesByGlob(gh, "content/src/patterns", {
        extension: ".md",
        exclude: ["AUTHORING.md"],
      }).catch(() => []),
      listFilesByGlob(gh, "content/src/product", {
        extension: ".md",
        exclude: ["AUTHORING.md"],
      }).catch(() => []),
      listFilesByGlob(gh, "content/src/writing", {
        extension: ".md",
        exclude: ["AUTHORING.md"],
      }).catch(() => []),
      listDirectories(gh, "components/src").catch(() => []),
    ]);

  const paths: string[] = [];
  for (const name of foundations) paths.push(`foundations/src/${name}`);
  for (const name of accessibility) paths.push(`accessibility/src/${name}`);
  for (const name of patterns) paths.push(`content/src/patterns/${name}`);
  for (const name of product) paths.push(`content/src/product/${name}`);
  for (const name of writing) paths.push(`content/src/writing/${name}`);

  // Components: enumerate per-slug domain mds + category mds.
  for (const slug of comps) {
    if (slug === "categories" || slug === "guidelines") continue;
    for (const d of ["content", "usage", "design", "behavior", "tokens"]) {
      paths.push(`components/src/${slug}/${d}.md`);
    }
  }
  const categories = await listFilesByGlob(gh, "components/src/categories", {
    extension: ".md",
    exclude: ["AUTHORING.md"],
  }).catch(() => []);
  for (const name of categories)
    paths.push(`components/src/categories/${name}`);

  return paths;
}
