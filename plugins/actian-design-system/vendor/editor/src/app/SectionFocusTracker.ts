// SectionFocusTracker — given a markdown source and a cursor line,
// returns the section the cursor is currently inside (H2 or H3) with
// its anchor slug. UI subscribes to this to drive the right pane.
//
// Slug derivation mirrors knowledge's foundations parser ast-walk.ts:
//   1. Strip leading number prefix ("2.11 Motion" → "Motion")
//   2. Lowercase + replace non-alphanumeric runs with "-"
//   3. Trim leading/trailing dashes
// Explicit `{#anchor}` markers override derived slugs.

const HEADING_RE = /^(#{2,3})\s+(.+?)\s*$/;
const TRAILING_ANCHOR_RE = /\s*\{#([a-z][a-z0-9-]*)\}\s*$/;
const NUM_PREFIX_RE = /^\s*\d+(?:\.\d+)*\.?\s+/;
const FENCE_RE = /^```/;
const FRONTMATTER_FENCE_RE = /^---\s*$/;

export interface FocusedSection {
  anchor: string;
  level: 2 | 3;
  line: number; // 0-indexed line of the heading itself
}

function deriveSlug(text: string): string {
  return text
    .replace(NUM_PREFIX_RE, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractAnchor(headingText: string): string {
  const m = headingText.match(TRAILING_ANCHOR_RE);
  if (m) return m[1] ?? "";
  return deriveSlug(headingText);
}

interface HeadingEntry {
  level: 2 | 3;
  line: number;
  anchor: string;
}

function scanHeadings(text: string): HeadingEntry[] {
  const lines = text.split("\n");
  const out: HeadingEntry[] = [];
  let inFence = false;
  // Skip the YAML frontmatter envelope (line 0 `---` opens it). Mirrors
  // headingScan.ts so both outline + focus tracker agree on where the
  // authored content starts.
  let i = 0;
  if (lines.length > 0 && FRONTMATTER_FENCE_RE.test(lines[0]!)) {
    let j = 1;
    while (j < lines.length && !FRONTMATTER_FENCE_RE.test(lines[j]!)) j++;
    if (j < lines.length) i = j + 1;
  }
  for (; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(HEADING_RE);
    if (!m) continue;
    const hashes = m[1] ?? "";
    const titleRaw = m[2] ?? "";
    const level = hashes.length === 2 ? 2 : 3;
    const titleNoAnchor = titleRaw.replace(TRAILING_ANCHOR_RE, "");
    const anchor = extractAnchor(titleRaw);
    if (titleNoAnchor.trim().length === 0) continue;
    out.push({ level, line: i, anchor });
  }
  return out;
}

export function computeFocusedSection(
  text: string,
  cursorLine: number,
): FocusedSection | null {
  const headings = scanHeadings(text);
  let current: HeadingEntry | null = null;
  for (const h of headings) {
    if (h.line > cursorLine) break;
    current = h;
  }
  if (!current) return null;
  return { anchor: current.anchor, level: current.level, line: current.line };
}
