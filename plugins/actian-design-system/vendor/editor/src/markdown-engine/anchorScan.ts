// Extract the set of {#slug} anchor markers from markdown text.
//
// The Substrate Doctrine (P6) treats these as cross-consumer contracts —
// removing one breaks plugin, docs site, category refs, and MCP consumers
// that hard-link the slug. submitDraft uses this to surface accidental
// deletion via the AnchorWarning modal.
//
// Scanning rules:
//   1. Strip fenced code blocks (``` ... ```) — they may contain literal
//      {#foo} that the author isn't claiming as a contract.
//   2. Strip inline code (`...`) — same reasoning.
//   3. Strip HTML comments (<!-- ... -->) — commented-out content is not
//      a live anchor.
//   4. Match /\{#([a-z0-9][a-z0-9-]*)\}/g on the remainder. Lowercase only
//      (kebab convention); leading char must be [a-z0-9].
//   5. Return a Set<string> of slugs (deduped).
//
// Trade-off: indented code blocks (4-space prefix) are NOT stripped. A
// scanner that distinguishes indented code from regular indented paragraphs
// would need a full block parser. Authors should use fenced blocks.

const FENCED_CODE_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`[^`\n]*`/g;
const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;
const ANCHOR_RE = /\{#([a-z0-9][a-z0-9-]*)\}/g;

export function scanAnchors(text: string): Set<string> {
  const stripped = text
    .replace(FENCED_CODE_RE, "")
    .replace(HTML_COMMENT_RE, "")
    .replace(INLINE_CODE_RE, "");
  const out = new Set<string>();
  for (const match of stripped.matchAll(ANCHOR_RE)) {
    const slug = match[1];
    if (slug) out.add(slug);
  }
  return out;
}
