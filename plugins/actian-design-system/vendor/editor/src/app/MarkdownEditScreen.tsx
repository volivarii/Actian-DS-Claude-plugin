// Integration layer for plain-markdown editing.
//
// Loads the remote file, restores any localStorage draft (with prompt),
// mounts CM6 + Toolbar + Preview, persists edits via useDraft, and
// submits via submitDraft with the anchor-preservation guard active.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Octokit } from "@octokit/rest";
import type { EditorView } from "@codemirror/view";
import {
  AlertDialog,
  Box,
  Button,
  Callout,
  Flex,
  Heading,
  Link,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { createOctokit, MissingPATError } from "../core/octokit";
import { decodeBase64Utf8 } from "./githubApi";
import { DEFAULT_COORDS } from "../config/coords";
import { submitDraft } from "../core/submitDraft";
import { AnchorPreservationError } from "../core/anchorPreservation";
import { ReadonlyPathError, SchemaValidationError } from "../core/types";
import { CodeMirrorEditor } from "../markdown-engine/CodeMirrorEditor";
import { Toolbar } from "../markdown-engine/Toolbar";
import { Preview } from "../markdown-engine/Preview";
import { Outline } from "./Outline";
import { AnchorReferencesPopover } from "./AnchorReferencesPopover";
import {
  draftStoreSingleton,
  submissionCartSingleton,
} from "../drafts/store-instance";
import { useDraft } from "../drafts/useDraft";
import { useCart } from "../drafts/useCart";
import { buildMarkdownStub } from "../lib/markdownStubs";
import { loadAnchorIndex } from "../lib/anchorIndex";
import { computeRenameWarnings } from "../markdown-engine/anchorLinter";
import { Badge } from "@radix-ui/themes";
import { TierBanner } from "./TierBanner";

interface MarkdownEditScreenProps {
  path: string;
  octokit?: Octokit;
  onOpenSettings?: () => void;
  onNavigate?: (path: string) => void;
}

type LoadSource = "remote" | "cart" | "stub";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | {
      kind: "ready";
      remoteText: string;
      remoteSha: string;
      source: LoadSource;
    }
  | { kind: "error"; message: string };

export function MarkdownEditScreen({
  path,
  octokit,
  onOpenSettings,
  onNavigate,
}: MarkdownEditScreenProps) {
  const [ghError, setGhError] = useState<string | null>(null);
  const [anchorPopover, setAnchorPopover] = useState<{
    slug: string;
    triggerEl: HTMLElement;
  } | null>(null);
  const gh = useMemo<Octokit | null>(() => {
    if (octokit) return octokit;
    try {
      return createOctokit();
    } catch (err) {
      setGhError(
        err instanceof MissingPATError
          ? err.message
          : `Failed to initialise GitHub client: ${(err as Error).message}`,
      );
      return null;
    }
  }, [octokit]);

  const [load, setLoad] = useState<LoadState>({ kind: "idle" });
  const [view, setView] = useState<EditorView | null>(null);
  const [text, setText] = useState<string>("");
  const [restorePromptOpen, setRestorePromptOpen] = useState(false);
  const [conflictPromptOpen, setConflictPromptOpen] = useState(false);
  const [anchorWarning, setAnchorWarning] = useState<string[] | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const cartEntries = useCart(submissionCartSingleton);
  const inCart = useMemo(
    () => cartEntries.find((e) => e.path === path) ?? null,
    [cartEntries, path],
  );
  // "Workspace context" = this path lives under components/src/<slug>/
  // AND other files for the same slug are staged in the cart. In that
  // case single-file submit is almost always wrong (orphans the staged
  // siblings); reorder the actions so "Add to batch" is primary.
  const componentSlug = useMemo(() => {
    const m = path.match(/^components\/src\/([^/]+)\//);
    return m && m[1] && m[1] !== "categories" ? m[1] : null;
  }, [path]);
  const siblingStaged = useMemo(() => {
    if (!componentSlug) return 0;
    const prefix = `components/src/${componentSlug}/`;
    return cartEntries.filter(
      (e) => e.path.startsWith(prefix) && e.path !== path,
    ).length;
  }, [cartEntries, componentSlug, path]);
  const inWorkspaceContext = siblingStaged > 0;
  const [confirmOrphanSubmit, setConfirmOrphanSubmit] = useState(false);
  const renameWarnings = useMemo(
    () => computeRenameWarnings(path, text),
    [path, text],
  );

  useEffect(() => {
    if (!gh) return;
    void loadAnchorIndex(gh).catch(() => {
      /* swallow — autocomplete just won't fire */
    });
    setLoad({ kind: "loading" });
    (async () => {
      try {
        // Cart-wins: a staged version of this path represents in-progress
        // work, including "Start authoring" stubs for newly-created files.
        const cartHit = submissionCartSingleton
          .list()
          .find((e) => e.path === path);
        if (cartHit) {
          setLoad({
            kind: "ready",
            remoteText: cartHit.content,
            remoteSha: cartHit.basedOnSha,
            source: "cart",
          });
          setText(cartHit.content);
          return;
        }

        let remoteText: string;
        let remoteSha: string;
        let source: LoadSource;
        try {
          const res = await gh.repos.getContent({
            ...DEFAULT_COORDS,
            path,
            ref: "main",
          });
          if (
            Array.isArray(res.data) ||
            !("content" in res.data) ||
            res.data.encoding !== "base64"
          ) {
            throw new Error(`unexpected response for ${path}`);
          }
          remoteText = decodeBase64Utf8(res.data.content);
          remoteSha = res.data.sha;
          source = "remote";
        } catch (err) {
          const status = (err as { status?: number }).status;
          if (status !== 404) throw err;
          // New file — pre-fill a stub so the canvas isn't blank.
          remoteText = buildMarkdownStub(path);
          remoteSha = "";
          source = "stub";
        }

        setLoad({ kind: "ready", remoteText, remoteSha, source });
        const draft = draftStoreSingleton.load(path);
        if (draft && source === "remote") {
          if (draft.basedOnSha === remoteSha) {
            setRestorePromptOpen(true);
          } else {
            setConflictPromptOpen(true);
          }
        }
        setText(remoteText);
      } catch (err) {
        setLoad({ kind: "error", message: (err as Error).message });
      }
    })();
  }, [gh, path]);

  const sha = load.kind === "ready" ? load.remoteSha : "";
  const { saveText, clearDraft } = useDraft(path, sha, draftStoreSingleton);

  const handleChange = useCallback(
    (next: string) => {
      setText(next);
      if (sha) saveText(next);
    },
    [sha, saveText],
  );

  const onRestore = () => {
    const draft = draftStoreSingleton.load(path);
    if (draft && view) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: draft.text },
      });
    }
    setRestorePromptOpen(false);
  };
  const onDiscardDraft = () => {
    draftStoreSingleton.clear(path);
    setRestorePromptOpen(false);
  };
  const onConflictDiscard = () => {
    draftStoreSingleton.clear(path);
    setConflictPromptOpen(false);
  };

  const submittingRef = useRef(false);
  const doSubmit = useCallback(
    async (allowAnchorDrop: boolean) => {
      if (!gh || load.kind !== "ready") return;
      // Synchronous re-entry guard. React state (`submitting`) updates
      // asynchronously, so a double-click within the same tick can fire
      // submit twice before the button visually disables.
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const result = await submitDraft(
          {
            id: `md-${Date.now()}`,
            message: `edit ${path}`,
            files: [{ path, content: text }],
            sourceMetadata: { kind: "human", via: "MarkdownEditScreen" },
            allowAnchorDrop,
          },
          {
            ...DEFAULT_COORDS,
            base: "main",
            schemas: {},
            octokit: gh,
          },
        );
        setPrUrl(result.prUrl);
        void loadAnchorIndex(gh, { force: true }).catch(() => {});
        clearDraft();
      } catch (err) {
        if (err instanceof AnchorPreservationError) {
          setAnchorWarning(err.dropped);
        } else if (err instanceof ReadonlyPathError) {
          setSubmitError(`This path is read-only: ${err.path}`);
        } else if (err instanceof SchemaValidationError) {
          setSubmitError(`Schema validation failed for ${err.path}`);
        } else {
          setSubmitError((err as Error).message);
        }
      } finally {
        setSubmitting(false);
        submittingRef.current = false;
      }
    },
    [gh, load, path, text, clearDraft],
  );

  const confirmAnchorDrop = () => {
    setAnchorWarning(null);
    void doSubmit(true);
  };
  const cancelAnchorDrop = () => {
    setAnchorWarning(null);
  };

  if (ghError) {
    return (
      <Callout.Root color="amber">
        <Callout.Text>
          {ghError}{" "}
          {onOpenSettings && (
            <Link href="#" onClick={onOpenSettings}>
              Open settings →
            </Link>
          )}
        </Callout.Text>
      </Callout.Root>
    );
  }
  if (load.kind === "loading" || load.kind === "idle") return <Spinner />;
  if (load.kind === "error") {
    return (
      <Callout.Root color="red">
        <Callout.Text>{load.message}</Callout.Text>
      </Callout.Root>
    );
  }

  const isNewFile = load.source !== "remote";
  return (
    <Flex direction="column" height="100%" gap="2">
      <TierBanner path={path} />
      <Flex align="center" justify="between" gap="2" wrap="wrap">
        <Heading size="3">{path}</Heading>
        <Flex gap="2" align="center">
          {isNewFile && (
            <Badge color="amber" variant="soft">
              New file — not yet on remote
            </Badge>
          )}
          {inCart && (
            <Badge color="indigo" variant="soft">
              In batch
            </Badge>
          )}
        </Flex>
      </Flex>
      {renameWarnings.length > 0 && (
        <Callout.Root color="amber" size="1">
          <Callout.Text>
            {renameWarnings
              .map(
                (w) =>
                  `#${w.removedSlug} disappeared — referenced by ${w.refCount} file${w.refCount === 1 ? "" : "s"}`,
              )
              .join(" · ")}
          </Callout.Text>
        </Callout.Root>
      )}
      <Box>{view && <Toolbar view={view} />}</Box>
      <Flex flexGrow="1" minHeight="0" gap="2">
        <Box
          className="editor-outline-pane"
          style={{
            width: 200,
            minWidth: 200,
            flexShrink: 0,
            border: "1px solid var(--gray-5)",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <Outline text={text} view={view} />
        </Box>
        <Box
          flexGrow="1"
          flexShrink="1"
          flexBasis="0"
          style={{
            border: "1px solid var(--gray-5)",
            borderRadius: 6,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <CodeMirrorEditor
            key={path}
            initialText={text}
            onChange={handleChange}
            onReady={setView}
            onAnchorClick={(slug, el) =>
              setAnchorPopover({ slug, triggerEl: el })
            }
          />
          {anchorPopover && (
            <AnchorReferencesPopover
              slug={anchorPopover.slug}
              triggerEl={anchorPopover.triggerEl}
              open
              onOpenChange={(o) => !o && setAnchorPopover(null)}
              onNavigate={(p) => {
                setAnchorPopover(null);
                onNavigate?.(p);
              }}
            />
          )}
        </Box>
        <Box
          flexGrow="1"
          flexShrink="1"
          flexBasis="0"
          style={{
            border: "1px solid var(--gray-5)",
            borderRadius: 6,
            padding: 12,
            overflow: "auto",
            minWidth: 0,
          }}
        >
          <Text size="1" color="gray">
            Preview is informational, not the production renderer.
          </Text>
          <Preview text={text} />
        </Box>
      </Flex>
      <Flex gap="2" justify="end" align="center" wrap="wrap">
        {prUrl && (
          <Text>
            PR opened:{" "}
            <Link href={prUrl} target="_blank" rel="noopener">
              {prUrl}
            </Link>
          </Text>
        )}
        {submitError && <Text color="red">{submitError}</Text>}
        {inWorkspaceContext ? (
          <>
            <Button
              variant="ghost"
              color="gray"
              size="2"
              disabled={load.kind !== "ready" || submitting}
              onClick={() => setConfirmOrphanSubmit(true)}
              title={`Open a PR for ONLY this file — your ${siblingStaged} other staged file${siblingStaged === 1 ? "" : "s"} for this component stay in the batch`}
            >
              Submit only this file…
            </Button>
            <Button
              disabled={load.kind !== "ready"}
              onClick={() => {
                if (load.kind !== "ready") return;
                submissionCartSingleton.add({
                  path,
                  content: text,
                  basedOnSha: load.remoteSha,
                  addedAt: Date.now(),
                });
              }}
              title={`Stage this file alongside ${siblingStaged} other${siblingStaged === 1 ? "" : "s"} for this component. Submit them all together from the header batch button.`}
            >
              {inCart ? "Update in batch" : "Add to batch"}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="soft"
              disabled={load.kind !== "ready"}
              onClick={() => {
                if (load.kind !== "ready") return;
                submissionCartSingleton.add({
                  path,
                  content: text,
                  basedOnSha: load.remoteSha,
                  addedAt: Date.now(),
                });
              }}
              title="Stage this file to submit alongside others in one PR"
            >
              {inCart ? "Update in batch" : "Add to batch"}
            </Button>
            <Button onClick={() => void doSubmit(false)} loading={submitting}>
              Submit as PR
            </Button>
          </>
        )}
      </Flex>

      <AlertDialog.Root
        open={confirmOrphanSubmit}
        onOpenChange={setConfirmOrphanSubmit}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Submit only this file?</AlertDialog.Title>
          <AlertDialog.Description>
            You have <strong>{siblingStaged}</strong> file
            {siblingStaged === 1 ? "" : "s"} staged for{" "}
            <code>{componentSlug}</code> in your batch. Submitting just this
            file opens a PR for it alone — the staged sibling
            {siblingStaged === 1 ? "" : "s"} stay in the batch and may end up
            inconsistent (e.g. metadata declaring a domain whose file is on a
            separate PR).
          </AlertDialog.Description>
          <Flex gap="2" justify="end" mt="3">
            <AlertDialog.Cancel>
              <Button variant="soft">Keep editing</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="red"
                onClick={() => {
                  setConfirmOrphanSubmit(false);
                  void doSubmit(false);
                }}
              >
                Yes, submit only this file
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      <AlertDialog.Root
        open={restorePromptOpen}
        onOpenChange={setRestorePromptOpen}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Unsaved changes</AlertDialog.Title>
          <AlertDialog.Description>
            You have unsaved changes on this file. Restore or discard?
          </AlertDialog.Description>
          <Flex gap="2" justify="end" mt="3">
            <AlertDialog.Action>
              <Button variant="soft" onClick={onDiscardDraft}>
                Discard
              </Button>
            </AlertDialog.Action>
            <AlertDialog.Action>
              <Button onClick={onRestore}>Restore</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      <AlertDialog.Root
        open={conflictPromptOpen}
        onOpenChange={setConflictPromptOpen}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>File changed on remote</AlertDialog.Title>
          <AlertDialog.Description>
            The file changed on the remote since your draft was saved. Discard
            the local draft and start fresh? (Merge is not supported in PR 2a.)
          </AlertDialog.Description>
          <Flex gap="2" justify="end" mt="3">
            <AlertDialog.Action>
              <Button onClick={onConflictDiscard}>Discard draft</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      <AlertDialog.Root
        open={anchorWarning !== null}
        onOpenChange={() => cancelAnchorDrop()}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Anchors will disappear</AlertDialog.Title>
          <AlertDialog.Description>
            These cross-consumer anchor contracts will be removed by this
            change: {anchorWarning?.map((a) => `#${a}`).join(", ")}. Proceed
            anyway?
          </AlertDialog.Description>
          <Flex gap="2" justify="end" mt="3">
            <AlertDialog.Cancel>
              <Button variant="soft" onClick={cancelAnchorDrop}>
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="red" onClick={confirmAnchorDrop}>
                Drop anchors & submit
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Flex>
  );
}
