// Read-only path refusal — the first gate in the Commit-PR core.
//
// Three classes of paths are off-limits to the editor:
//   1. **Figma-synced**: tokens.json + component registries. Changing these
//      in the editor would conflict with the next sync-from-figma run.
//   2. **CI-derived / frozen build artifacts**: anything under */dist/, the
//      llms*.txt files, and tokens.css (a frozen hand-maintained CSS
//      snapshot vendored from tokens.json). These are regenerated from
//      source; hand-edits would be silently overwritten.
//   3. **Lockstep / repo-machinery**: paths-manifest.json carries the
//      knowledge_version that scripts/lib/bump-version.js bumps atomically
//      alongside package.json. Editor writes here would corrupt the
//      lockstep and break the vendor snapshot workflow.
//
// Everything else — components/src, accessibility, foundations/src, content/src,
// app-context, fm-to-ds-map, components/src/icon-groups, components/src/categories
// — is writable.

const READONLY_EXACT = new Set<string>([
  "tokens/tokens.json",
  "tokens/tokens.css",
  "tokens/token-reference.md",
  "llms.txt",
  "llms-full.txt",
  "paths-manifest.json",
]);

const READONLY_PREFIXES: ReadonlyArray<string> = [
  "components/dist/registries/",
];

// `<top-level>/dist/...` — every domain's CI-derived tree.
const READONLY_DIST_RE = /^[^/]+\/dist\//;

export function isReadOnlyPath(path: string): boolean {
  if (READONLY_EXACT.has(path)) return true;
  if (READONLY_PREFIXES.some((p) => path.startsWith(p))) return true;
  if (READONLY_DIST_RE.test(path)) return true;
  return false;
}
