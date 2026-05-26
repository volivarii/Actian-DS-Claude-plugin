// Staging drawer surfacing the SubmissionCart contents + batch submit.
//
// Opens from a header button when cart has entries. User can:
//   - review the file list
//   - remove individual entries
//   - clear the cart
//   - submit the batch (one PR, all files)
//
// On success: clears the cart + closes drawer + shows the PR URL.

import { useCallback, useEffect, useState } from "react";
import type { Octokit } from "@octokit/rest";
import { DEFAULT_COORDS } from "../config/coords";
import {
  AlertDialog,
  Box,
  Button,
  Callout,
  Dialog,
  Flex,
  IconButton,
  Link,
  Spinner,
  Text,
} from "@radix-ui/themes";
import type { CartEntry, SubmissionCart } from "../drafts/SubmissionCart";
import { submitDraft } from "../core/submitDraft";
import { AnchorPreservationError } from "../core/anchorPreservation";
import { ReadonlyPathError, SchemaValidationError } from "../core/types";
import {
  validateCartCoupling,
  type CouplingMismatch,
} from "../lib/workspaceState";

export interface SubmissionStagingProps {
  cart: SubmissionCart;
  entries: CartEntry[];
  octokit: Octokit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmissionStaging({
  cart,
  entries,
  octokit,
  open,
  onOpenChange,
}: SubmissionStagingProps) {
  const [submitting, setSubmitting] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [anchorWarning, setAnchorWarning] = useState<{
    path: string;
    dropped: string[];
  } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [mismatches, setMismatches] = useState<CouplingMismatch[]>([]);

  // Re-validate the coupling whenever the cart contents (or dialog open
  // state) change. We surface mismatches as a callout AND block submit.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const next = await validateCartCoupling(octokit, cart);
        if (!cancelled) setMismatches(next);
      } catch {
        if (!cancelled) setMismatches([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, octokit, cart, entries]);

  const doSubmit = useCallback(
    async (allowAnchorDrop: boolean) => {
      if (entries.length === 0 || submitting) return;
      setSubmitting(true);
      setError(null);
      setPrUrl(null);
      try {
        const message =
          entries.length === 1
            ? `edit ${entries[0]!.path}`
            : `edit ${entries.length} files`;
        const result = await submitDraft(
          {
            id: `batch-${Date.now()}`,
            message,
            files: entries.map((e) => ({ path: e.path, content: e.content })),
            sourceMetadata: { kind: "human", via: "SubmissionStaging" },
            allowAnchorDrop,
          },
          {
            ...DEFAULT_COORDS,
            base: "main",
            schemas: {},
            octokit,
          },
        );
        setPrUrl(result.prUrl);
        cart.clear();
      } catch (err) {
        if (err instanceof AnchorPreservationError) {
          setAnchorWarning({ path: err.path, dropped: err.dropped });
        } else if (err instanceof ReadonlyPathError) {
          setError(`Read-only path: ${err.path}`);
        } else if (err instanceof SchemaValidationError) {
          setError(`Schema validation failed for ${err.path}`);
        } else {
          setError((err as Error).message);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [entries, submitting, cart, octokit],
  );

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content maxWidth="640px">
          <Dialog.Title>Submission batch ({entries.length})</Dialog.Title>
          <Dialog.Description size="2" color="gray" mb="3">
            One PR will be opened with all files below.
          </Dialog.Description>

          {entries.length === 0 ? (
            <Text color="gray">No files staged.</Text>
          ) : (
            <Flex direction="column" gap="1" mb="3">
              {entries.map((e) => (
                <Flex
                  key={e.path}
                  align="center"
                  justify="between"
                  px="2"
                  py="1"
                  style={{
                    borderRadius: 4,
                    background: "var(--gray-2)",
                  }}
                >
                  <Box>
                    <Text size="2" weight="medium">
                      {e.path}
                    </Text>
                    <Text size="1" color="gray" as="div">
                      added {new Date(e.addedAt).toLocaleTimeString()} · sha{" "}
                      {e.basedOnSha.slice(0, 7)}
                    </Text>
                  </Box>
                  <IconButton
                    size="1"
                    variant="ghost"
                    color="gray"
                    aria-label={`Remove ${e.path} from batch`}
                    onClick={() => cart.remove(e.path)}
                  >
                    ✕
                  </IconButton>
                </Flex>
              ))}
            </Flex>
          )}

          {mismatches.length > 0 && (
            <Callout.Root color="amber" mb="3">
              <Callout.Text>
                <strong>Metadata ↔ content mismatch.</strong> Submission is
                blocked until each declared domain has its `.md` file in the
                batch (or already on remote). Found {mismatches.length} mismatch
                {mismatches.length === 1 ? "" : "es"}:
              </Callout.Text>
              <Box mt="2">
                {mismatches.map((m, i) => (
                  <Text size="1" as="div" key={i}>
                    •{" "}
                    {m.kind === "declared-but-missing" ? (
                      <>
                        <code>{m.slug}/_meta.yml</code> declares{" "}
                        <code>
                          {m.domain}.status: {m.declaredStatus}
                        </code>{" "}
                        but{" "}
                        <code>
                          {m.slug}/{m.domain}.md
                        </code>{" "}
                        is not in the batch and not on remote.
                      </>
                    ) : (
                      <>
                        <code>
                          {m.slug}/{m.domain}.md
                        </code>{" "}
                        is staged but <code>{m.slug}/_meta.yml</code> doesn't
                        declare it ({m.declaredStatus ?? "absent"}). Open the
                        workspace to author the metadata.
                      </>
                    )}
                  </Text>
                ))}
              </Box>
            </Callout.Root>
          )}
          {prUrl && (
            <Callout.Root color="green" mb="3">
              <Callout.Text>
                PR opened:{" "}
                <Link href={prUrl} target="_blank" rel="noopener">
                  {prUrl}
                </Link>
              </Callout.Text>
            </Callout.Root>
          )}
          {error && (
            <Callout.Root color="red" mb="3">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}

          <Flex gap="2" justify="end" align="center">
            {entries.length > 0 && (
              <Button
                variant="soft"
                color="gray"
                onClick={() => setConfirmClear(true)}
              >
                Clear batch
              </Button>
            )}
            <Dialog.Close>
              <Button variant="soft">Close</Button>
            </Dialog.Close>
            <Button
              disabled={
                entries.length === 0 || submitting || mismatches.length > 0
              }
              onClick={() => void doSubmit(false)}
              title={
                mismatches.length > 0
                  ? "Resolve metadata ↔ content mismatches before submitting"
                  : undefined
              }
            >
              {submitting ? <Spinner /> : `Submit batch`}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <AlertDialog.Root
        open={anchorWarning !== null}
        onOpenChange={(o) => !o && setAnchorWarning(null)}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Anchors will disappear</AlertDialog.Title>
          <AlertDialog.Description>
            {anchorWarning &&
              `In ${anchorWarning.path}: ${anchorWarning.dropped.map((a) => `#${a}`).join(", ")}. Proceed anyway?`}
          </AlertDialog.Description>
          <Flex gap="2" justify="end" mt="3">
            <AlertDialog.Cancel>
              <Button variant="soft" onClick={() => setAnchorWarning(null)}>
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={() => {
                  setAnchorWarning(null);
                  void doSubmit(true);
                }}
              >
                Drop anchors & submit
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      <AlertDialog.Root open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialog.Content>
          <AlertDialog.Title>Clear the batch?</AlertDialog.Title>
          <AlertDialog.Description>
            This removes all {entries.length} files from the batch. Per-file
            drafts (in the editor) are not affected.
          </AlertDialog.Description>
          <Flex gap="2" justify="end" mt="3">
            <AlertDialog.Cancel>
              <Button variant="soft">Keep</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={() => {
                  cart.clear();
                  setConfirmClear(false);
                }}
              >
                Clear
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  );
}
