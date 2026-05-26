// Anchor-preservation guard for the Commit-PR core.
//
// Slots between validatePaths and validateAgainstSchema in submitDraft.
// Compares the {#slug} set extracted from the current remote file against
// the set in the submission. Any slug present in remote but missing from
// submission is reported via AnchorPreservationError.
//
// This is a warn-then-confirm gate, NOT a hard block — section deletion is
// a legitimate edit. The UI layer (MarkdownEditScreen) catches this error,
// surfaces an AnchorWarning modal, and on user confirm re-calls
// submitDraft with `allowAnchorDrop: true`.

import { scanAnchors } from "../markdown-engine/anchorScan";

export function droppedAnchors(remote: string, submission: string): string[] {
  const remoteSet = scanAnchors(remote);
  const submissionSet = scanAnchors(submission);
  return [...remoteSet]
    .filter((slug) => !submissionSet.has(slug))
    .sort();
}

export class AnchorPreservationError extends Error {
  constructor(
    public readonly path: string,
    public readonly dropped: string[],
  ) {
    super(
      `anchor preservation failed for ${path}: dropping ${dropped.length} ` +
        `anchor${dropped.length === 1 ? "" : "s"} (${dropped.join(", ")})`,
    );
    this.name = "AnchorPreservationError";
  }
}
