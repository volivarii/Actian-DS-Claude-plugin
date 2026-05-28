// Browser-safe frontmatter parser — pure string→object, no fs/path/node
// dependencies. Extracted from refGraph.ts so the editor UI can reuse
// the SAME parser without pulling Node-only modules into the browser
// bundle.
//
// Format note: this matches the strict subset documented in
// components/src/categories/AUTHORING.md and the P8 closure. It is NOT
// a general YAML parser. Authors who deviate from the documented shape
// get a silent miss here (refs are just not extracted), which the
// inspector surfaces by showing an empty connections list.

import type { RefType } from "./refGraph";

// Match a YAML frontmatter envelope at the very top of a markdown file.
// Use `[ \t]*` around the `---` fences (NOT `\s*`) so the trailing
// blank line that separates the envelope from the body stays in the
// body. Round-trip safety with frontmatterRewriter.ts depends on this.
const FRONTMATTER_RE = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*\n/;

// Match `a11y_refs:` / `motion_refs:` blocks with `- { ref: <slug> [, note: ...] }` entries.
const REF_BLOCK_RE =
  /^(a11y_refs|motion_refs):\s*\n((?:\s*-\s+\{[^}]*\}\s*\n?)+)/gm;
const REF_ENTRY_RE =
  /\{\s*ref\s*:\s*([a-z][a-z0-9-]*)(?:\s*,\s*note\s*:\s*(?:"([^"]*)"|'([^']*)'|([^},]*)))?\s*\}/g;

export interface ParsedFrontmatter {
  a11y_refs: Array<{ ref: string; note: string | null }>;
  motion_refs: Array<{ ref: string; note: string | null }>;
}

export function parseFrontmatter(raw: string): {
  frontmatter: ParsedFrontmatter;
  body: string;
} {
  const match = raw.match(FRONTMATTER_RE);
  const frontmatter: ParsedFrontmatter = { a11y_refs: [], motion_refs: [] };
  if (!match || match[1] === undefined) {
    return { frontmatter, body: raw };
  }
  const block = match[1];
  REF_BLOCK_RE.lastIndex = 0;
  let blockMatch;
  while ((blockMatch = REF_BLOCK_RE.exec(block)) !== null) {
    const refType = blockMatch[1] as RefType;
    const entries = blockMatch[2] ?? "";
    REF_ENTRY_RE.lastIndex = 0;
    let entryMatch;
    while ((entryMatch = REF_ENTRY_RE.exec(entries)) !== null) {
      const ref = entryMatch[1] ?? "";
      const note =
        entryMatch[2] ?? entryMatch[3] ?? entryMatch[4]?.trim() ?? null;
      frontmatter[refType].push({
        ref,
        note: note && note.length > 0 ? note : null,
      });
    }
  }
  return { frontmatter, body: raw.slice(match[0].length) };
}
