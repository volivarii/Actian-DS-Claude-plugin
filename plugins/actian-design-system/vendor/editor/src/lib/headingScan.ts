// Extract H1-H3 headings from markdown text for the Outline panel.
//
// Returns one entry per heading with its level, display text, and
// 0-indexed line number (for CM6's view.dispatch + scrollIntoView).
//
// Scanning rules:
//   1. Iterate line-by-line so line numbers stay accurate (regex-strip
//      approaches collapse the original source).
//   2. Skip the YAML frontmatter envelope when present (line 0 is `---`).
//      Frontmatter often contains `#` comment lines that would otherwise
//      be mistaken for H1 headings and show up in the Outline.
//   3. Toggle `inFence` on each ``` line; ignore headings inside fences.
//   4. Match /^(#{1,3})\s+(.+)$/ outside fences.
//   5. Strip a trailing `{#slug}` from the display text (authors include
//      these for cross-consumer anchor contracts; the slug isn't part of
//      the visible heading prose).
//   6. Skip blank/whitespace-only headings.

export interface Heading {
  level: 1 | 2 | 3;
  text: string;
  /** 0-indexed line number in the source markdown. */
  line: number;
}

const HEADING_RE = /^(#{1,3})\s+(.+?)\s*$/;
const TRAILING_ANCHOR_RE = /\s*\{#[a-z0-9][a-z0-9-]*\}\s*$/;
const FENCE_RE = /^```/;
const FRONTMATTER_FENCE_RE = /^---\s*$/;

export function scanHeadings(text: string): Heading[] {
  const lines = text.split("\n");
  const out: Heading[] = [];
  let inFence = false;
  // Detect the YAML frontmatter envelope and skip past its closing `---`.
  // Only a `---` on line 0 opens frontmatter; mid-document `---` is a
  // markdown thematic break and stays scanned as content.
  let i = 0;
  if (lines.length > 0 && FRONTMATTER_FENCE_RE.test(lines[0]!)) {
    let j = 1;
    while (j < lines.length && !FRONTMATTER_FENCE_RE.test(lines[j]!)) j++;
    if (j < lines.length) i = j + 1;
  }
  for (; i < lines.length; i++) {
    const line = lines[i]!;
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = HEADING_RE.exec(line);
    if (!match) continue;
    const level = match[1]!.length as 1 | 2 | 3;
    const rawText = match[2]!;
    const text = rawText.replace(TRAILING_ANCHOR_RE, "").trim();
    if (text.length === 0) continue;
    out.push({ level, text, line: i });
  }
  return out;
}
