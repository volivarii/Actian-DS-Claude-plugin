// Substrate taxonomy loader — reads the vendored a11y-index.json + motion.json
// into in-memory indexes that power the Section Inspector + Topic Picker.
//
// Doctrine note: this module is the AUTHOR-FACING name resolver. UI text
// derived from these getters uses titles ("Color contrast"), never slugs.

import { readFile } from "node:fs/promises";

export type Domain = "accessibility" | "motion";

export interface SearchResult {
  slug: string;
  domain: Domain;
  title: string;
  body: string | null;
}

export interface Taxonomy {
  getSlugs(domain: Domain): string[];
  getTitle(domain: Domain, slug: string): string | null;
  getBody(domain: Domain, slug: string): string | null;
  domainOfSlug(slug: string): Domain | null;
  searchSections(query: string, opts?: { domain?: Domain; limit?: number }): SearchResult[];
}

export class TaxonomyLoadError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "TaxonomyLoadError";
  }
}

interface A11ySectionRaw {
  slug: string;
  title: string;
  body?: string;
}

interface MotionPatternRaw {
  slug: string;
  name: string;
  description?: string;
}

interface A11yIndexFile {
  sections: A11ySectionRaw[];
}

interface MotionFile {
  patterns: Record<string, MotionPatternRaw>;
}

export interface LoadOpts {
  a11yIndexPath: string;
  motionPath: string;
}

export async function loadTaxonomy(opts: LoadOpts): Promise<Taxonomy> {
  let a11y: A11yIndexFile;
  let motion: MotionFile;
  try {
    a11y = JSON.parse(await readFile(opts.a11yIndexPath, "utf8")) as A11yIndexFile;
  } catch (err) {
    throw new TaxonomyLoadError(`Failed to load a11y index from ${opts.a11yIndexPath}`, err);
  }
  try {
    motion = JSON.parse(await readFile(opts.motionPath, "utf8")) as MotionFile;
  } catch (err) {
    throw new TaxonomyLoadError(`Failed to load motion file from ${opts.motionPath}`, err);
  }

  const a11yBySlug = new Map<string, { title: string; body: string | null }>();
  for (const section of a11y.sections ?? []) {
    a11yBySlug.set(section.slug, { title: section.title, body: section.body ?? null });
  }

  const motionBySlug = new Map<string, { title: string; body: string | null }>();
  for (const pattern of Object.values(motion.patterns ?? {})) {
    motionBySlug.set(pattern.slug, { title: pattern.name, body: pattern.description ?? null });
  }

  function getMap(domain: Domain): Map<string, { title: string; body: string | null }> {
    return domain === "accessibility" ? a11yBySlug : motionBySlug;
  }

  return {
    getSlugs(domain) {
      return Array.from(getMap(domain).keys());
    },
    getTitle(domain, slug) {
      return getMap(domain).get(slug)?.title ?? null;
    },
    getBody(domain, slug) {
      return getMap(domain).get(slug)?.body ?? null;
    },
    domainOfSlug(slug) {
      if (a11yBySlug.has(slug)) return "accessibility";
      if (motionBySlug.has(slug)) return "motion";
      return null;
    },
    searchSections(query, opts) {
      const q = query.toLowerCase().trim();
      if (q === "") return [];
      const limit = opts?.limit ?? 20;
      const out: SearchResult[] = [];
      const scopes: Domain[] = opts?.domain ? [opts.domain] : ["accessibility", "motion"];
      for (const domain of scopes) {
        for (const [slug, entry] of getMap(domain)) {
          const haystack = `${entry.title} ${entry.body ?? ""}`.toLowerCase();
          if (haystack.includes(q)) {
            out.push({ slug, domain, title: entry.title, body: entry.body });
            if (out.length >= limit) return out;
          }
        }
      }
      return out;
    },
  };
}
