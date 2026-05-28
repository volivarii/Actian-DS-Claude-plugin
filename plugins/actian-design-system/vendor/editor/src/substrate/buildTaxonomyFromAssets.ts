// Synchronous taxonomy builder over the static JSON imports in
// taxonomyAssets.ts. Mirrors loadTaxonomy()'s in-memory shape but does
// not need async/fs — the JSON is bundled at build time.
//
// Used by the editor UI to power Section Inspector connections + Topic
// Picker search WITHOUT a runtime fetch. The trade-off is that taxonomy
// freshness is gated on the editor build cadence (see taxonomyAssets.ts
// for the rationale).

import type { Domain, SearchResult, Taxonomy } from "./taxonomy";
import { a11yIndex, motionPatterns } from "./taxonomyAssets";

export function buildTaxonomyFromAssets(): Taxonomy {
  const a11yBySlug = new Map<string, { title: string; body: string | null }>();
  for (const section of a11yIndex.sections ?? []) {
    // Real dist/a11y-index.json carries body_excerpt; test fixtures use
    // body. Coalesce so the picker can surface a snippet from either.
    const body = section.body ?? section.body_excerpt ?? null;
    a11yBySlug.set(section.slug, { title: section.title, body });
  }

  const motionBySlug = new Map<string, { title: string; body: string | null }>();
  for (const pattern of Object.values(motionPatterns.patterns ?? {})) {
    motionBySlug.set(pattern.slug, {
      title: pattern.name,
      body: pattern.description ?? null,
    });
  }

  function getMap(
    domain: Domain,
  ): Map<string, { title: string; body: string | null }> {
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
      const scopes: Domain[] = opts?.domain
        ? [opts.domain]
        : ["accessibility", "motion"];
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
