// Coverage loader for the editor's landing dashboard.
//
// Reads every `components/src/<slug>/_meta.yml` (the 26 "authored" set)
// AND the DS Kit registry (`components/dist/registries/dskit.json`) to
// produce a merged view: authored rows + ghost rows for registry
// components that have no _meta.yml yet. Ghost rows offer the
// Start-authoring action (stub _meta.yml → submission cart).
//
// Eligibility filter: registry categories in SKIP_REGISTRY_CATEGORIES
// (Icons, Product logos, Illustrations & graphics, Local components,
// White-label services, uncategorized) are excluded — leaves ~74
// "eligible non-icon" registry components, of which ~15 overlap with
// authored slugs.
//
// Known debt (NOT solved here): the F1 alias mismatch — 5 _meta slugs
// alias to multi-key registry entries (e.g. `tag` ↔ `tag-default`,
// `tag-interactive`, etc.); 6 _meta slugs don't appear in DS Kit
// registry at all. Ghost rendering is by registry slug; this surfaces
// the alias question to the author rather than solving it implicitly.

import type { Octokit } from "@octokit/rest";
import { parse as parseYaml } from "yaml";
import { listDirectories, getTextFile } from "../app/githubApi";

export const DOMAINS = [
  "content",
  "usage",
  "design",
  "behavior",
  "tokens",
] as const;
export type Domain = (typeof DOMAINS)[number];

export const STATUSES = [
  "not-started",
  "draft",
  "approved",
  "inherited",
] as const;
export type Status = (typeof STATUSES)[number];

export interface DomainEntry {
  status: Status;
  owner?: string;
  updatedAt?: string;
}

export type RowOrigin = "authored" | "unstarted";

export interface CoverageRow {
  slug: string;
  component: string;
  category?: string;
  domains: Record<Domain, DomainEntry>;
  /** authored = has _meta.yml; unstarted = in DS Kit registry but no _meta.yml */
  origin: RowOrigin;
  /** registry key (when origin === "unstarted") — used for stub generation */
  registryKey?: string;
}

const SKIP_DIRS = new Set(["categories", "guidelines"]);
const SKIP_REGISTRY_CATEGORIES = new Set([
  "Icons",
  "Product logos",
  "Illustrations & graphics",
  "Local components",
  "White-label services",
  "uncategorized",
]);

const DSKIT_REGISTRY_PATH = "components/dist/registries/dskit.json";

interface DskitEntry {
  name: string;
  category?: string;
  group?: string;
}

export async function loadCoverage(gh: Octokit): Promise<CoverageRow[]> {
  const [dirs, registry] = await Promise.all([
    listDirectories(gh, "components/src"),
    loadDskitEligible(gh),
  ]);
  const componentDirs = dirs.filter((d) => !SKIP_DIRS.has(d));
  const authoredSlugs = new Set(componentDirs);

  const authored = await Promise.all(
    componentDirs.map((slug) => loadOne(gh, slug)),
  );

  const ghosts: CoverageRow[] = Object.entries(registry)
    .filter(([slug]) => !authoredSlugs.has(slug))
    .map(([slug, entry]) => ({
      slug,
      component: entry.name,
      category: deriveCategorySlug(entry.category),
      domains: blankDomains(),
      origin: "unstarted" as const,
      registryKey: slug,
    }));

  const merged: CoverageRow[] = [...authored, ...ghosts];
  return merged.sort((a, b) => a.slug.localeCompare(b.slug));
}

async function loadDskitEligible(
  gh: Octokit,
): Promise<Record<string, DskitEntry>> {
  try {
    const text = await getTextFile(gh, DSKIT_REGISTRY_PATH);
    const parsed = JSON.parse(text) as {
      components?: Record<string, DskitEntry>;
    };
    const out: Record<string, DskitEntry> = {};
    for (const [slug, entry] of Object.entries(parsed.components ?? {})) {
      const cat = entry?.category ?? "uncategorized";
      if (SKIP_REGISTRY_CATEGORIES.has(cat)) continue;
      out[slug] = entry;
    }
    return out;
  } catch {
    return {};
  }
}

// Registry categories are human-readable (e.g. "Form (input & selection)").
// _meta.yml `category` fields are slugs (e.g. "form-input-selection").
// Slugify so stub _meta.yml files validate against schema.
function deriveCategorySlug(cat?: string): string | undefined {
  if (!cat) return undefined;
  return cat
    .toLowerCase()
    .replace(/[()&,]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function loadOne(gh: Octokit, slug: string): Promise<CoverageRow> {
  try {
    const yamlText = await getTextFile(gh, `components/src/${slug}/_meta.yml`);
    const parsed = parseYaml(yamlText) as Record<string, unknown>;
    return parseRow(slug, parsed);
  } catch {
    return {
      slug,
      component: slug,
      domains: blankDomains(),
      origin: "authored",
    };
  }
}

function parseRow(slug: string, raw: Record<string, unknown>): CoverageRow {
  const domains = (raw.domains as Record<string, unknown>) ?? {};
  return {
    slug,
    component: typeof raw.component === "string" ? raw.component : slug,
    category: typeof raw.category === "string" ? raw.category : undefined,
    domains: {
      content: normalize(domains.content),
      usage: normalize(domains.usage),
      design: normalize(domains.design),
      behavior: normalize(domains.behavior),
      tokens: normalize(domains.tokens),
    },
    origin: "authored",
  };
}

function normalize(entry: unknown): DomainEntry {
  if (!entry || typeof entry !== "object") return { status: "not-started" };
  const e = entry as Record<string, unknown>;
  const status = isStatus(e.status) ? e.status : "not-started";
  return {
    status,
    owner: typeof e.owner === "string" ? e.owner : undefined,
    updatedAt: typeof e.updatedAt === "string" ? e.updatedAt : undefined,
  };
}

function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

function blankDomains(): Record<Domain, DomainEntry> {
  return {
    content: { status: "not-started" },
    usage: { status: "not-started" },
    design: { status: "not-started" },
    behavior: { status: "not-started" },
    tokens: { status: "not-started" },
  };
}

export interface CoverageCounts {
  total: number;
  authored: number;
  unstarted: number;
  perDomain: Record<Domain, { authored: number; inherited: number }>;
}

export function summarize(rows: CoverageRow[]): CoverageCounts {
  const counts: CoverageCounts = {
    total: rows.length,
    authored: 0,
    unstarted: 0,
    perDomain: {
      content: { authored: 0, inherited: 0 },
      usage: { authored: 0, inherited: 0 },
      design: { authored: 0, inherited: 0 },
      behavior: { authored: 0, inherited: 0 },
      tokens: { authored: 0, inherited: 0 },
    },
  };
  for (const row of rows) {
    if (row.origin === "authored") counts.authored += 1;
    else counts.unstarted += 1;
    for (const d of DOMAINS) {
      const s = row.domains[d].status;
      if (s === "approved" || s === "draft") counts.perDomain[d].authored += 1;
      else if (s === "inherited") counts.perDomain[d].inherited += 1;
    }
  }
  return counts;
}

// Resolve the file path a cell click navigates to.
// - approved/draft → the per-component domain file (canonical edit target)
// - inherited → the category-level default file
// - not-started → the _meta.yml (author starts by changing status there)
export function cellTarget(row: CoverageRow, domain: Domain): string {
  const status = row.domains[domain].status;
  if (status === "approved" || status === "draft") {
    return `components/src/${row.slug}/${domain}.md`;
  }
  if (status === "inherited" && row.category) {
    return `components/src/categories/${row.category}.md`;
  }
  return `components/src/${row.slug}/_meta.yml`;
}

// Generate a schema-valid stub _meta.yml for a ghost row. All domains
// start at "not-started" — author updates the matrix after merge.
export function buildStubMeta(row: CoverageRow): string {
  const lines: string[] = [];
  lines.push(
    "# yaml-language-server: $schema=../../../schemas/guideline-meta.json",
  );
  lines.push(`component: "${row.component.replace(/"/g, '\\"')}"`);
  if (row.category) {
    lines.push(`category: ${row.category}`);
  }
  lines.push("domains:");
  for (const d of DOMAINS) {
    lines.push(`  ${d}: { status: not-started }`);
  }
  lines.push("");
  return lines.join("\n");
}
