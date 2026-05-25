import { getCachedIndex, scanFileForAnchors } from "../lib/anchorIndex";

export interface RenameWarning {
  removedSlug: string;
  refCount: number;
}

/** Compare current text's defined slugs to the index's record for this path.
 *  Any slug the index attributes to this file but is no longer in the text is
 *  a "rename or removal" event — warn proportional to ref count. */
export function computeRenameWarnings(
  path: string,
  currentText: string,
): RenameWarning[] {
  const index = getCachedIndex();
  if (!index) return [];

  const currentDefined = new Set(scanFileForAnchors(currentText).defines);
  const warnings: RenameWarning[] = [];
  for (const [slug, entry] of index.entries) {
    if (!entry.definedIn.includes(path)) continue;
    if (!currentDefined.has(slug)) {
      warnings.push({ removedSlug: slug, refCount: entry.referencedBy.length });
    }
  }
  return warnings;
}
