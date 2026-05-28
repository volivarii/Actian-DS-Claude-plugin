// Local-file connection extraction — given the CURRENT markdown source
// in the editor (not the vendored corpus), return the list of outgoing
// connections so the Section Inspector can show real data BEFORE the
// author has saved/submitted.
//
// Reuses parseFrontmatter from refGraph (the canonical parser for the
// strict-subset YAML envelope). Domain resolution is delegated to the
// in-memory Taxonomy so unknown refs surface as `domain: null` — the
// inspector renders them as broken / unresolved.

// Import the browser-safe parser directly. refGraph.ts re-exports it
// for legacy callers, but going through refGraph would pull node:fs +
// node:path into the editor's browser bundle (Vite cannot tree-shake
// through the re-export boundary). See parseFrontmatter.ts header.
import { parseFrontmatter } from "./parseFrontmatter";
import type { OutgoingConnection } from "./refGraph";
import type { Taxonomy } from "./taxonomy";

export function parseLocalFrontmatter(
  source: string,
  taxonomy: Taxonomy,
): OutgoingConnection[] {
  const { frontmatter } = parseFrontmatter(source);
  const out: OutgoingConnection[] = [];
  for (const refType of ["a11y_refs", "motion_refs"] as const) {
    for (const item of frontmatter[refType]) {
      out.push({
        slug: item.ref,
        refType,
        note: item.note,
        domain: taxonomy.domainOfSlug(item.ref),
      });
    }
  }
  return out;
}
