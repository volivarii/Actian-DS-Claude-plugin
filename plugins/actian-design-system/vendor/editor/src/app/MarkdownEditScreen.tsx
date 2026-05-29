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
import { computeFocusedSection } from "./SectionFocusTracker";
import { ConnectionsPopover } from "./ConnectionsPopover";
import type { FocusedSectionContext } from "./EditorShell";
// NOTE: deep-imported (not via the substrate barrel) to keep the Node-only
// loader (taxonomy.ts uses node:fs/promises, refGraph.ts uses node:path) out
// of the browser bundle. Vite's tree-shaker can't see through the barrel's
// re-exports of node:* modules and surfaces a "readFile is not exported"
// error at build time if we go through ../substrate.
import { buildTaxonomyFromAssets } from "../substrate/buildTaxonomyFromAssets";
import { parseLocalFrontmatter } from "../substrate/parseLocalFrontmatter";
import {
  draftStoreSingleton,
  submissionCartSingleton,
} from "../drafts/store-instance";
import { useDraft } from "../drafts/useDraft";
import { useCart } from "../drafts/useCart";
import { buildMarkdownStub } from "../lib/markdownStubs";
import { loadAnchorIndex, findReferences } from "../lib/anchorIndex";
import { computeRenameWarnings } from "../markdown-engine/anchorLinter";
import { Badge } from "@radix-ui/themes";
import { TierBanner } from "./TierBanner";

interface MarkdownEditScreenProps {
  path: string;
  octokit?: Octokit;
  onOpenSettings?: () => void;
  onNavigate?: (path: string) => void;
  /** Optional outward callback (purely for tests / future analytics) —
   *  fired whenever the caret's resolved section changes. The cursor
   *  NO LONGER drives any UI panel — activation is now explicit via the
   *  Outline pill (the v1.1 fix-up after the persistent-panel bug). */
  onFocusedSectionChange?: (section: FocusedSectionContext | null) => void;
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
  onFocusedSectionChange,
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
  // Preview pane visibility — hidden by default to give the editor the
  // full width. Persisted to localStorage so the user's choice survives
  // page reloads + cross-file navigation.
  const PREVIEW_VISIBLE_KEY = "editor.preview.visible:v1";
  const [showPreview, setShowPreview] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PREVIEW_VISIBLE_KEY) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(PREVIEW_VISIBLE_KEY, showPreview ? "1" : "0");
    } catch {
      /* localStorage may be unavailable (e.g. private mode); ignore. */
    }
  }, [showPreview]);
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

  // Tick whenever anchorIndex finishes loading; drives recomputation of
  // the incoming-refs counts that feed the Outline pills + popover.
  const [anchorIndexTick, setAnchorIndexTick] = useState(0);
  useEffect(() => {
    if (!gh) return;
    void loadAnchorIndex(gh)
      .then(() => setAnchorIndexTick((t) => t + 1))
      .catch(() => {
        /* swallow — autocomplete + pill incoming counts just won't fire */
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

  // Cursor tracking is preserved for analytics / future use ONLY — it no
  // longer drives any visible UI. The v1 right-rail panel was driven by
  // this signal and felt always-on (cursor lives inside a section almost
  // continuously when authors are editing). Activation moved to an
  // explicit Outline pill (see connectionsPopover below).
  const textRef = useRef(text);
  useEffect(() => {
    textRef.current = text;
  }, [text]);
  const handleCursorLineChange = useCallback(
    (line: number) => {
      if (!onFocusedSectionChange) return;
      const section = computeFocusedSection(textRef.current, line);
      const resolved: FocusedSectionContext | null = section
        ? { file: path, ...section }
        : null;
      onFocusedSectionChange(resolved);
    },
    [onFocusedSectionChange, path],
  );

  // Reset analytics callback when the active file changes — the previous
  // file's cursor-derived section no longer applies.
  useEffect(() => {
    onFocusedSectionChange?.(null);
  }, [path, onFocusedSectionChange]);

  // Build the in-memory taxonomy once per mount. The static JSON imports
  // are baked at build time (see substrate/taxonomyAssets.ts) so this is
  // cheap and synchronous — no fetch, no async boundary.
  const taxonomy = useMemo(() => buildTaxonomyFromAssets(), []);

  // Outgoing connections derived from THIS file's frontmatter. Recomputes
  // on edit so adding/removing a connection inline reflects immediately.
  const outgoing = useMemo(
    () => parseLocalFrontmatter(text, taxonomy),
    [text, taxonomy],
  );

  // Per-section connection counts feed the Outline pills. Each H2/H3 in
  // the current file contributes:
  //   - OUTGOING (this section's own a11y_refs/motion_refs in frontmatter)
  //     attached to the file's top H2 per P8 Option A v1.
  //   - INCOMING (other files that reference this section's anchor) via
  //     anchorIndex.findReferences — re-runs when the index finishes
  //     loading (anchorIndexTick).
  // Pill displays the SUM so definition-only files (no frontmatter
  // outgoing, just incoming refs from consumers) still surface a count.
  const connectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const lines = text.split("\n");

    // Walk every line; for each H2/H3 found, set its incoming count from
    // anchorIndex. Use a Set so the same anchor isn't recounted when the
    // walker returns it across multiple lines inside the same section.
    const seenAnchors = new Set<string>();
    let firstH2Anchor: string | null = null;
    for (let i = 0; i < lines.length; i++) {
      const s = computeFocusedSection(text, i);
      if (!s || seenAnchors.has(s.anchor)) continue;
      seenAnchors.add(s.anchor);
      if (s.level === 2 && firstH2Anchor === null) firstH2Anchor = s.anchor;
      // anchorIndexTick is only here to keep this memo dependent on the
      // index becoming available — findReferences reads the module cache.
      const incoming = findReferences(s.anchor).length;
      if (incoming > 0) counts.set(s.anchor, incoming);
    }

    // P8 Option A: outgoing refs attach to the file's top H2.
    if (firstH2Anchor && outgoing.length > 0) {
      const existing = counts.get(firstH2Anchor) ?? 0;
      counts.set(firstH2Anchor, existing + outgoing.length);
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, outgoing, anchorIndexTick]);

  // Popover state — explicit, opens only on Outline pill click. The
  // anchorEl is the pill DOM node; Radix Popover.Anchor positions to it.
  const [connectionsPopover, setConnectionsPopover] = useState<{
    section: FocusedSectionContext;
    anchorEl: HTMLElement;
  } | null>(null);

  const openConnectionsForSection = useCallback(
    (section: FocusedSectionContext, anchorEl: HTMLElement) => {
      setConnectionsPopover({ section, anchorEl });
    },
    [],
  );

  // Close the popover when the active file changes — the prior file's
  // section context no longer applies.
  useEffect(() => {
    setConnectionsPopover(null);
  }, [path]);

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
        // When the active file lives in an ordered domain (foundations/src or
        // accessibility/src), include the cart's pending _order.json so that
        // a +Add that staged both the new .md and the updated _order.json doesn't
        // silently omit the manifest and trigger CI drift errors.
        const orderedMatch = path.match(
          /^(foundations|accessibility)\/src\/[^/]+\.md$/,
        );
        const filesToSubmit: { path: string; content: string }[] = [
          { path, content: text },
        ];
        if (orderedMatch) {
          const orderPath = `${orderedMatch[1]}/src/_order.json`;
          const cartOrderEntry = submissionCartSingleton
            .list()
            .find((e) => e.path === orderPath && !e.deleted);
          if (cartOrderEntry) {
            filesToSubmit.push({
              path: cartOrderEntry.path,
              content: cartOrderEntry.content,
            });
          }
        }
        const result = await submitDraft(
          {
            id: `md-${Date.now()}`,
            message: `edit ${path}`,
            files: filesToSubmit,
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
          <Button
            size="1"
            variant={showPreview ? "soft" : "outline"}
            onClick={() => setShowPreview((v) => !v)}
            aria-label={showPreview ? "Hide preview pane" : "Show preview pane"}
            aria-pressed={showPreview}
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </Button>
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
          <Outline
            text={text}
            view={view}
            file={path}
            connectionCounts={connectionCounts}
            onOpenConnectionsForSection={openConnectionsForSection}
          />
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
            onCursorLineChange={handleCursorLineChange}
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
        {showPreview && (
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
        )}
      </Flex>
      {connectionsPopover && (
        <ConnectionsPopover
          sectionTitle={
            extractHeadingText(text, connectionsPopover.section.line) ||
            connectionsPopover.section.anchor
          }
          text={text}
          anchorEl={connectionsPopover.anchorEl}
          // P8 Option A v1: only the file's top H2 owns the file-level
          // outgoing refs. Sub-section inspectors are read-only incoming
          // views; the picker + remove affordances surface only on the
          // top H2. The outgoing prop is still the file-level set (the
          // SectionInspector hides it when scope === "section"); passing
          // it unconditionally means the file-scope inspector always sees
          // the freshly-mutated state without us recomputing per pill.
          scope={
            connectionsPopover.section.anchor === firstH2Anchor(text)
              ? "file"
              : "section"
          }
          outgoing={outgoing}
          incoming={findReferences(connectionsPopover.section.anchor).map(
            (file) => ({
              file,
              // Incoming references come from anchorIndex which doesn't
              // distinguish a11y_refs vs motion_refs vs heading-link refs.
              // The UI treats all incoming uniformly — refType is plumbing.
              refType: "a11y_refs" as const,
              note: null,
            }),
          )}
          taxonomy={taxonomy}
          onTextChange={(next) => {
            if (!view) return;
            view.dispatch({
              changes: { from: 0, to: view.state.doc.length, insert: next },
            });
          }}
          onClose={() => setConnectionsPopover(null)}
        />
      )}
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

// Resolve the file's top H2 anchor. Used to decide whether the section
// the author opened is the bucket that owns the file-level outgoing refs
// (P8 Option A) — sub-sections render as read-only incoming views.
function firstH2Anchor(source: string): string | null {
  const lines = source.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const s = computeFocusedSection(source, i);
    if (s && s.level === 2) return s.anchor;
  }
  return null;
}

// Pull the human-readable heading text from a markdown source line. Strips
// the leading hashes, optional number prefix ("2.11 Motion"), and trailing
// {#anchor} marker. Returns "" when the line doesn't look like a heading
// (defensive — Outline pill clicks always pass a real heading line).
function extractHeadingText(source: string, line: number): string {
  const raw = source.split("\n")[line];
  if (raw === undefined) return "";
  const m = raw.match(/^#{2,3}\s+(.+?)\s*$/);
  if (!m) return "";
  return (m[1] ?? "")
    .replace(/\s*\{#[a-z][a-z0-9-]*\}\s*$/, "")
    .replace(/^\s*\d+(?:\.\d+)*\.?\s+/, "")
    .trim();
}
