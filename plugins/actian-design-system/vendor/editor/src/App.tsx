import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Theme,
  Tooltip,
} from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./styles/tokens.css";
import "./styles/dark-theme.css";
import "./styles/base.css";
import { SettingsPanel } from "./settings/SettingsPanel";
import { EditorShell } from "./app/EditorShell";
import { SignInScreen } from "./app/SignInScreen";
import { SaveStateIndicator } from "./app/SaveStateIndicator";
import { SubmissionStaging } from "./app/SubmissionStaging";
import {
  RecentSubmissions,
  anyOpenFailing,
  type SubmissionRow,
} from "./app/RecentSubmissions";
import { CommandPalette, type CommandItem } from "./app/CommandPalette";
import { useSaveState } from "./drafts/useSaveState";
import { useCart } from "./drafts/useCart";
import {
  draftStoreSingleton,
  submissionCartSingleton,
} from "./drafts/store-instance";
import { createOctokit } from "./core/octokit";
import { loadComponentSlugs } from "./lib/componentSlugs";
import { loadAnchorIndex } from "./lib/anchorIndex";
import {
  bootstrap as bootstrapAuth,
  getSession,
  signInWithOAuth,
  signInWithPAT,
  subscribe,
} from "./auth";

const DOMAINS = ["content", "usage", "design", "behavior", "tokens"] as const;
type Domain = (typeof DOMAINS)[number];

const DOMAIN_LABEL: Record<Domain, string> = {
  content: "Content",
  usage: "Usage",
  design: "Design",
  behavior: "Behavior",
  tokens: "Tokens",
};

/** Pull `<slug>` from `workspace/<slug>` or `components/src/<slug>/<anything>`. */
function activeComponentSlug(path: string | null): string | null {
  if (!path) return null;
  const ws = /^workspace\/([a-z0-9][a-z0-9-]*)$/.exec(path);
  if (ws && ws[1]) return ws[1];
  const file = /^components\/src\/([^/]+)\//.exec(path);
  if (file && file[1] && file[1] !== "categories" && file[1] !== "guidelines") {
    return file[1];
  }
  return null;
}

function GearIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [stagingOpen, setStagingOpen] = useState(false);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [submissionRows, setSubmissionRows] = useState<SubmissionRow[]>([]);
  const [session, setSession] = useState(() => getSession());

  useEffect(() => {
    bootstrapAuth();
    setSession(getSession());
    const unsub = subscribe(setSession);
    return unsub;
  }, []);

  const saveState = useSaveState(activePath, draftStoreSingleton);
  const cartEntries = useCart(submissionCartSingleton);
  // The header's Submit-batch button + the staging dialog need an Octokit
  // instance. createOctokit throws when no session; recompute when the
  // session changes so that signing in re-activates the dependent UI
  // without requiring a page reload.
  const headerOctokit = useMemo(() => {
    if (!session) return null;
    try {
      return createOctokit();
    } catch {
      return null;
    }
  }, [session]);
  // Lazy-load the known component slug set so Cmd-K can offer
  // "Go to <slug>" without the user knowing exact spellings.
  const [knownSlugs, setKnownSlugs] = useState<string[]>([]);
  useEffect(() => {
    if (!headerOctokit) return;
    let cancelled = false;
    (async () => {
      const slugs = await loadComponentSlugs(headerOctokit);
      if (!cancelled) setKnownSlugs(slugs);
    })();
    return () => {
      cancelled = true;
    };
  }, [headerOctokit]);

  const commands: CommandItem[] = useMemo(() => {
    const activeSlug = activeComponentSlug(activePath);
    const base: CommandItem[] = [
      {
        id: "open-coverage",
        label: "Open coverage dashboard",
        group: "Navigate",
        run: () => setActivePath(null),
      },
      {
        id: "open-inbox",
        label: "Open draft inbox",
        hint: cartEntries.length > 0 ? `${cartEntries.length} staged` : "empty",
        group: "Navigate",
        run: () => setActivePath("inbox"),
      },
      {
        id: "open-batch",
        label: "Open submission batch dialog",
        hint: cartEntries.length > 0 ? `${cartEntries.length} staged` : "empty",
        group: "Actions",
        run: () => setStagingOpen(true),
      },
      {
        id: "open-submissions",
        label: "Open recent submissions",
        group: "Actions",
        run: () => setSubmissionsOpen(true),
      },
      {
        id: "open-settings",
        label: "Open settings",
        group: "Actions",
        run: () => setSettingsOpen(true),
      },
      {
        id: "refresh-anchor-index",
        label: "Refresh anchor index",
        hint: "Re-scan all markdown for {#slug} markers",
        group: "Actions",
        run: () => {
          if (headerOctokit) {
            void loadAnchorIndex(headerOctokit, { force: true }).catch(
              () => {},
            );
          }
        },
      },
    ];
    // Component-context commands — surfaced only when an active
    // component is in scope (workspace OR a component-scoped file).
    if (activeSlug) {
      base.push({
        id: `ctx-workspace-${activeSlug}`,
        label: `Open workspace overview (${activeSlug})`,
        group: "Current component",
        run: () => setActivePath(`workspace/${activeSlug}`),
      });
      for (const d of DOMAINS) {
        base.push({
          id: `ctx-domain-${d}`,
          label: `Switch to ${DOMAIN_LABEL[d]}`,
          hint: `${activeSlug}/${d}.md`,
          group: "Current component",
          run: () => setActivePath(`components/src/${activeSlug}/${d}.md`),
        });
      }
      base.push({
        id: "ctx-meta",
        label: "Edit advanced metadata",
        hint: `${activeSlug}/_meta.yml`,
        group: "Current component",
        run: () => setActivePath(`components/src/${activeSlug}/_meta.yml`),
      });
    }
    // Goto-by-slug — every known component as a navigable target. Many
    // entries; cmdk's typeahead handles the filtering.
    for (const slug of knownSlugs) {
      base.push({
        id: `goto-${slug}`,
        label: `Go to ${slug}`,
        hint: `workspace/${slug}`,
        group: "Components",
        run: () => setActivePath(`workspace/${slug}`),
      });
    }
    return base;
  }, [activePath, cartEntries.length, knownSlugs]);
  return (
    <Theme accentColor="indigo" radius="medium" appearance="dark">
      <Flex direction="column" style={{ height: "100vh", width: "100vw" }}>
        <Flex
          justify="between"
          align="center"
          px="4"
          py="2"
          style={{ borderBottom: "1px solid var(--gray-5)", flexShrink: 0 }}
        >
          <Flex align="center" gap="2">
            <img
              src="/actian-ds-knowledge/editor/favicon.svg"
              width="20"
              height="20"
              alt=""
              style={{ display: "block" }}
            />
            <Heading size="4">Actian DS Knowledge Editor</Heading>
          </Flex>
          <Flex align="center" gap="3">
            <SaveStateIndicator state={saveState} />
            {headerOctokit && (
              <Button
                size="1"
                variant="soft"
                color={anyOpenFailing(submissionRows) ? "amber" : "gray"}
                onClick={() => setSubmissionsOpen(true)}
                title="My recent submissions + CI status"
              >
                Submissions
                {anyOpenFailing(submissionRows) && (
                  <Badge color="amber" radius="full" size="1">
                    !
                  </Badge>
                )}
              </Button>
            )}
            {cartEntries.length > 0 && (
              <Button
                size="1"
                variant="soft"
                color="indigo"
                onClick={() => setStagingOpen(true)}
              >
                <span aria-hidden="true">📋</span>
                Batch
                <Badge color="indigo" radius="full" size="1">
                  {cartEntries.length}
                </Badge>
              </Button>
            )}
            <Tooltip content="Settings">
              <IconButton
                variant="ghost"
                onClick={() => setSettingsOpen(true)}
                aria-label="Open settings"
              >
                <GearIcon />
              </IconButton>
            </Tooltip>
          </Flex>
        </Flex>
        <Box flexGrow="1" style={{ minHeight: 0 }}>
          {session == null ? (
            <SignInScreen
              onOAuthSignIn={async () => {
                await signInWithOAuth();
              }}
              onPATSignIn={(pat) => {
                signInWithPAT(pat);
              }}
            />
          ) : (
            <EditorShell
              onOpenSettings={() => setSettingsOpen(true)}
              activePath={activePath}
              setActivePath={setActivePath}
              onOpenStaging={() => setStagingOpen(true)}
            />
          )}
        </Box>
        <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
        {headerOctokit && (
          <SubmissionStaging
            cart={submissionCartSingleton}
            entries={cartEntries}
            octokit={headerOctokit}
            open={stagingOpen}
            onOpenChange={setStagingOpen}
          />
        )}
        {headerOctokit && (
          <RecentSubmissions
            octokit={headerOctokit}
            open={submissionsOpen}
            onOpenChange={setSubmissionsOpen}
            onLoaded={setSubmissionRows}
          />
        )}
        <CommandPalette commands={commands} />
      </Flex>
    </Theme>
  );
}
