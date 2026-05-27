import { useEffect, useMemo, useState } from "react";
import type { Octokit } from "@octokit/rest";
import { Box, Button, Callout, Flex, Text } from "@radix-ui/themes";
import { createOctokit, MissingPATError } from "../core/octokit";
import { Sidebar } from "./Sidebar";
import { MetaEditScreen } from "./MetaEditScreen";
import { MarkdownEditScreen } from "./MarkdownEditScreen";
import { RefusalBanner } from "./RefusalBanner";
import { CoverageDashboard } from "./CoverageDashboard";
import { AuthoringWorkspace } from "./AuthoringWorkspace";
import { DraftInbox } from "./DraftInbox";
import { draftStoreSingleton } from "../drafts/store-instance";

interface EditorShellProps {
  onOpenSettings?: () => void;
  octokit?: Octokit;
  activePath: string | null;
  setActivePath: (path: string | null) => void;
  /** Opens the SubmissionStaging dialog (owned by App). Used by the
   *  DraftInbox surface to offer a one-click escalation to submit. */
  onOpenStaging?: () => void;
}

function isPlainMarkdown(path: string): boolean {
  return (
    (/^foundations\/src\/[^/]+\.md$/.test(path) ||
      /^accessibility\/src\/[^/]+\.md$/.test(path) ||
      /^components\/src\/(?!categories\/AUTHORING\.md|AUTHORING\.md|EDITING-GUIDE\.md)[^/]+\/[^/]+\.md$/.test(
        path,
      ) ||
      /^components\/src\/categories\/[^/]+\.md$/.test(path) ||
      /^content\/src\/(patterns|product|writing)\/[^/]+\.md$/.test(path)) &&
    !/AUTHORING\.md$/.test(path)
  );
}

function isMetaYaml(path: string): boolean {
  return /^components\/src\/[^/]+\/_meta\.yml$/.test(path);
}

const WORKSPACE_RE = /^workspace\/([a-z0-9][a-z0-9-]*)$/;
function workspaceSlug(path: string): string | null {
  const m = WORKSPACE_RE.exec(path);
  return m && m[1] ? m[1] : null;
}

// Component-scoped child files (per-component metadata, domain MDs)
// surface a breadcrumb back to the slug's Authoring Workspace.
const COMPONENT_CHILD_RE = /^components\/src\/([^/]+)\/[^/]+\.(?:yml|md)$/;
function parentWorkspaceOf(path: string): string | null {
  const m = COMPONENT_CHILD_RE.exec(path);
  if (!m || !m[1] || m[1] === "categories" || m[1] === "guidelines")
    return null;
  return `workspace/${m[1]}`;
}

export function EditorShell({
  onOpenSettings,
  octokit,
  activePath,
  setActivePath,
  onOpenStaging,
}: EditorShellProps) {
  const [ghError, setGhError] = useState<string | null>(null);
  const gh = useMemo<Octokit | null>(() => {
    if (octokit) return octokit;
    try {
      return createOctokit();
    } catch (err) {
      setGhError(
        err instanceof MissingPATError ? err.message : (err as Error).message,
      );
      return null;
    }
  }, [octokit]);

  const [pendingPaths, setPendingPaths] = useState<Set<string>>(() =>
    draftStoreSingleton.allPaths(),
  );

  useEffect(() => {
    const refresh = () => setPendingPaths(draftStoreSingleton.allPaths());
    // React in real time to draft mutations (pending/cleared/saved) so the
    // sidebar dot updates on discard without waiting for a window focus.
    const unsubscribe = draftStoreSingleton.subscribe(refresh);
    // Keep the focus refresh too — covers the cross-tab case where another
    // tab cleared a draft and emit events don't fire in this tab.
    window.addEventListener("focus", refresh);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", refresh);
    };
  }, []);

  if (ghError) {
    return (
      <Callout.Root color="amber">
        <Callout.Text>{ghError}</Callout.Text>
      </Callout.Root>
    );
  }
  if (!gh) return null;

  let pane: React.ReactNode;
  const wsSlug = activePath ? workspaceSlug(activePath) : null;
  const parentWs = activePath ? parentWorkspaceOf(activePath) : null;
  const breadcrumb = parentWs ? (
    <Box mb="2">
      <Button variant="ghost" size="1" onClick={() => setActivePath(parentWs)}>
        ← Back to workspace
      </Button>
    </Box>
  ) : null;

  if (activePath == null) {
    pane = <CoverageDashboard octokit={gh} onOpenFile={setActivePath} />;
  } else if (activePath === "inbox") {
    pane = (
      <DraftInbox
        onOpenFile={setActivePath}
        onOpenStaging={() => onOpenStaging?.()}
      />
    );
  } else if (wsSlug) {
    pane = (
      <AuthoringWorkspace
        slug={wsSlug}
        octokit={gh}
        onNavigate={setActivePath}
        onBack={() => setActivePath(null)}
      />
    );
  } else if (isMetaYaml(activePath)) {
    pane = (
      <MetaEditScreen
        path={activePath}
        octokit={gh}
        onOpenSettings={onOpenSettings}
        onNavigate={setActivePath}
      />
    );
  } else if (isPlainMarkdown(activePath)) {
    pane = (
      <MarkdownEditScreen
        path={activePath}
        octokit={gh}
        onOpenSettings={onOpenSettings}
        onNavigate={setActivePath}
      />
    );
  } else {
    pane = (
      <RefusalBanner path={activePath} onBack={() => setActivePath(null)} />
    );
  }

  return (
    <Flex style={{ height: "100%", minHeight: 0 }}>
      <Sidebar
        octokit={gh}
        pendingPaths={pendingPaths}
        activePath={activePath}
        onSelect={setActivePath}
      />
      <Box
        flexGrow="1"
        p="3"
        style={{ overflow: "auto", minWidth: 0, minHeight: 0 }}
      >
        {breadcrumb}
        {pane}
      </Box>
    </Flex>
  );
}
