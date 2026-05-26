// Inline markdown editor for one domain inside the Authoring Workspace.
//
// Rendered as the Accordion content of each DomainCard. Loads content
// from cart > remote > stub (same precedence as MarkdownEditScreen).
// Debounced auto-save into the SubmissionCart on edit; first save also
// promotes the _meta.yml domain status to "draft" (idempotent — see
// promoteDomainToDraft).
//
// Per-domain save indicator: ○ Unsaved → ● Saving → ✓ In batch. Mirrors
// the polish-PR header indicator visually but scoped per domain.
//
// Flush-on-unmount so collapsing the accordion doesn't lose pending writes.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Octokit } from "@octokit/rest";
import {
  Badge,
  Box,
  Button,
  Callout,
  Flex,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { CodeMirrorEditor } from "../markdown-engine/CodeMirrorEditor";
import { Preview } from "../markdown-engine/Preview";
import { AnchorReferencesPopover } from "./AnchorReferencesPopover";
import { decodeBase64Utf8 } from "./githubApi";
import { DEFAULT_COORDS } from "../config/coords";
import { submissionCartSingleton } from "../drafts/store-instance";
import { useCart } from "../drafts/useCart";
import { buildMarkdownStub } from "../lib/markdownStubs";
import { loadAnchorIndex } from "../lib/anchorIndex";
import { computeRenameWarnings } from "../markdown-engine/anchorLinter";
import {
  domainPathFor,
  promoteDomainToDraft,
  type Domain,
} from "../lib/workspaceState";

export interface WorkspaceDomainEditorProps {
  slug: string;
  domain: Domain;
  octokit: Octokit;
  onNavigate?: (path: string) => void;
}

type LoadState =
  | { kind: "loading" }
  | {
      kind: "ready";
      text: string;
      remoteSha: string;
      source: "cart" | "remote" | "stub";
    }
  | { kind: "error"; message: string };

// Only transient editor-local states. "In batch" is derived from the
// cart subscription (useCart) so an external cart.clear() correctly
// drops the badge without needing internal state to be reset.
type SaveState = "idle" | "unsaved" | "saving";

const DEBOUNCE_MS = 1000;

export function WorkspaceDomainEditor({
  slug,
  domain,
  octokit,
  onNavigate,
}: WorkspaceDomainEditorProps) {
  const path = useMemo(() => domainPathFor(slug, domain), [slug, domain]);

  const [load, setLoad] = useState<LoadState>({ kind: "loading" });
  const [text, setText] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [anchorPopover, setAnchorPopover] = useState<{
    slug: string;
    triggerEl: HTMLElement;
  } | null>(null);
  const cartEntries = useCart(submissionCartSingleton);
  const inCart = useMemo(
    () => cartEntries.some((e) => e.path === path),
    [cartEntries, path],
  );
  const renameWarnings = useMemo(
    () => computeRenameWarnings(path, text),
    [path, text],
  );

  // Refs for flush-on-unmount + sync access to latest text in the
  // debounce timer callback (which closes over stale state otherwise).
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTextRef = useRef<string>("");
  const remoteShaRef = useRef<string>("");

  const flush = useCallback(async () => {
    const next = latestTextRef.current;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSaveState("saving");
    const wasInCart = submissionCartSingleton.has(path);
    submissionCartSingleton.add({
      path,
      content: next,
      basedOnSha: remoteShaRef.current,
      addedAt: Date.now(),
    });
    if (!wasInCart) {
      // First save for this domain — promote status to draft in _meta.yml.
      try {
        await promoteDomainToDraft(octokit, slug, domain);
      } catch {
        /* non-fatal — the .md is staged; metadata promotion can retry */
      }
    }
    // Back to idle — the green "In batch" badge is now driven by the
    // useCart subscription so it appears/disappears reactively.
    setSaveState("idle");
  }, [path, slug, domain, octokit]);

  // Load: cart > remote > stub.
  useEffect(() => {
    let cancelled = false;
    setLoad({ kind: "loading" });
    setSaveState("idle");
    void loadAnchorIndex(octokit).catch(() => {
      /* swallow — autocomplete just won't fire */
    });
    (async () => {
      try {
        const cartHit = submissionCartSingleton
          .list()
          .find((e) => e.path === path);
        if (cartHit) {
          if (!cancelled) {
            setLoad({
              kind: "ready",
              text: cartHit.content,
              remoteSha: cartHit.basedOnSha,
              source: "cart",
            });
            setText(cartHit.content);
            latestTextRef.current = cartHit.content;
            remoteShaRef.current = cartHit.basedOnSha;
            // "In batch" badge derives from inCart (useCart) reactively.
          }
          return;
        }
        let nextText: string;
        let remoteSha: string;
        let source: "remote" | "stub";
        try {
          const res = await octokit.repos.getContent({
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
          nextText = decodeBase64Utf8(res.data.content);
          remoteSha = res.data.sha;
          source = "remote";
        } catch (err) {
          const status = (err as { status?: number }).status;
          if (status !== 404) throw err;
          nextText = buildMarkdownStub(path);
          remoteSha = "";
          source = "stub";
        }
        if (cancelled) return;
        setLoad({ kind: "ready", text: nextText, remoteSha, source });
        setText(nextText);
        latestTextRef.current = nextText;
        remoteShaRef.current = remoteSha;
      } catch (err) {
        if (!cancelled)
          setLoad({ kind: "error", message: (err as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [octokit, path]);

  // Flush pending debounce on unmount so collapse / navigation doesn't
  // lose the user's last second of edits.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // Synchronous shortcut: write straight to the cart. We can't
        // await async metadata promotion in unmount, but the .md content
        // is the critical thing to preserve.
        if (latestTextRef.current && latestTextRef.current !== "") {
          submissionCartSingleton.add({
            path,
            content: latestTextRef.current,
            basedOnSha: remoteShaRef.current,
            addedAt: Date.now(),
          });
        }
      }
    };
  }, [path]);

  const onChange = useCallback(
    (next: string) => {
      setText(next);
      latestTextRef.current = next;
      setSaveState("unsaved");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flush();
      }, DEBOUNCE_MS);
    },
    [flush],
  );

  if (load.kind === "loading") {
    return (
      <Box p="3">
        <Flex align="center" gap="2">
          <Spinner />
          <Text size="1" color="gray">
            Loading {domain}.md…
          </Text>
        </Flex>
      </Box>
    );
  }

  if (load.kind === "error") {
    return (
      <Box p="3">
        <Callout.Root color="red">
          <Callout.Text>Failed to load: {load.message}</Callout.Text>
        </Callout.Root>
      </Box>
    );
  }

  const isNewFile = load.source !== "remote";
  return (
    <Box p="2">
      <Flex justify="between" align="center" mb="2" wrap="wrap" gap="2">
        <Flex align="center" gap="2">
          <SaveIndicator state={saveState} inCart={inCart} />
          {isNewFile && (
            <Badge color="amber" variant="soft" size="1">
              New file
            </Badge>
          )}
        </Flex>
        <Button
          size="1"
          variant={showPreview ? "soft" : "ghost"}
          color="gray"
          onClick={() => setShowPreview((s) => !s)}
        >
          {showPreview ? "Hide preview" : "Show preview"}
        </Button>
      </Flex>
      {renameWarnings.length > 0 && (
        <Callout.Root color="amber" size="1" mb="2">
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
      <Box
        style={{
          border: "1px solid var(--gray-5)",
          borderRadius: 6,
          minHeight: 200,
          maxHeight: 480,
          overflow: "hidden",
        }}
      >
        <CodeMirrorEditor
          initialText={text}
          onChange={onChange}
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
      {showPreview && (
        <Box
          mt="2"
          style={{
            border: "1px solid var(--gray-5)",
            borderRadius: 6,
            padding: 12,
            background: "var(--zen-color-neutral-50, #fafafa)",
            maxHeight: 360,
            overflow: "auto",
          }}
        >
          <Text size="1" color="gray" as="div" mb="2">
            Preview is informational, not the production renderer.
          </Text>
          <Preview text={text} />
        </Box>
      )}
    </Box>
  );
}

interface SaveIndicatorProps {
  state: SaveState;
  inCart: boolean;
}

function SaveIndicator({ state, inCart }: SaveIndicatorProps) {
  if (state === "saving") {
    return (
      <Badge color="gray" variant="soft" size="1">
        ● Saving…
      </Badge>
    );
  }
  if (state === "unsaved") {
    return (
      <Badge color="amber" variant="soft" size="1">
        ○ Unsaved changes
      </Badge>
    );
  }
  if (inCart) {
    return (
      <Badge color="green" variant="soft" size="1">
        ✓ In batch
      </Badge>
    );
  }
  return (
    <Badge color="gray" variant="soft" size="1">
      Not started
    </Badge>
  );
}
