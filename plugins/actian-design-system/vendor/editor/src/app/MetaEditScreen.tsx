// Schema-driven editor for a component's _meta.yml file.
//
// Phase 1a shipped this as a self-contained screen with an internal
// component-list dropdown. PR 2a (Phase 1b) moves enumeration to the
// Sidebar; this component now accepts a `path` prop and renders the
// form for that single file.

import { useEffect, useMemo, useState } from "react";
import type { Octokit } from "@octokit/rest";
import type { RJSFSchema } from "@rjsf/utils";
import {
  AlertDialog,
  Badge,
  Button,
  Callout,
  Card,
  Flex,
  Heading,
  Link,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { createOctokit, MissingPATError } from "../core/octokit";
import { submitDraft } from "../core/submitDraft";
import { getTextFile } from "./githubApi";
import { RJSFForm } from "../form-engine/RJSFForm";
import { guidelineMetaUiSchema } from "../uiSchemas/guidelineMeta";
import { parseYaml, stringifyYaml } from "../form-engine/yamlSerializer";
import { CategorySelectWidget } from "../form-engine/widgets/CategorySelectWidget";
import { RelatedMultiSelectWidget } from "../form-engine/widgets/RelatedMultiSelectWidget";
import { TierBanner } from "./TierBanner";

// Custom RJSF widgets keyed by uiSchema `ui:widget` name. Octokit is
// threaded via formContext so widgets can lazy-fetch option sets.
const META_WIDGETS = {
  CategorySelect: CategorySelectWidget,
  RelatedMultiSelect: RelatedMultiSelectWidget,
};
import { submissionCartSingleton } from "../drafts/store-instance";
import { useCart } from "../drafts/useCart";

interface MetaEditScreenProps {
  path: string | null;
  octokit?: Octokit;
  onOpenSettings?: () => void;
  // Optional — when present, "Next steps" Author-X buttons navigate via
  // this callback (lifted from EditorShell → App's setActivePath).
  onNavigate?: (path: string) => void;
}

type LoadState<T> =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; value: T }
  | { kind: "error"; message: string };

function slugFromPath(path: string): string | null {
  const m = path.match(/^components\/src\/([^/]+)\/_meta\.yml$/);
  return m && m[1] ? m[1] : null;
}

export function MetaEditScreen({
  path,
  octokit,
  onOpenSettings,
  onNavigate,
}: MetaEditScreenProps) {
  const [ghError, setGhError] = useState<string | null>(null);
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

  const slug = path ? slugFromPath(path) : null;
  const metaPath = slug ? `components/src/${slug}/_meta.yml` : null;
  const [schema, setSchema] = useState<LoadState<RJSFSchema>>({ kind: "idle" });
  // `source` distinguishes how this meta got loaded so the UI can call
  // it out (cart-wins, remote, or 404→stub creation flow).
  const [meta, setMeta] = useState<
    LoadState<{
      value: unknown;
      originalText: string;
      source: "remote" | "cart" | "stub";
    }>
  >({ kind: "idle" });
  // Tracks in-progress edits; kept in sync with meta on load and reset
  // whenever the path changes.
  const [formData, setFormData] = useState<unknown>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stagedAt, setStagedAt] = useState<number | null>(null);
  const cartEntries = useCart(submissionCartSingleton);
  const inCart = useMemo(
    () =>
      metaPath ? (cartEntries.find((e) => e.path === metaPath) ?? null) : null,
    [cartEntries, metaPath],
  );
  // Workspace-context: any sibling files for this slug staged in the
  // cart? If yes, single-file submit becomes the secondary (orphan-risk)
  // action; "Update batch" becomes primary.
  const siblingStaged = useMemo(() => {
    if (!slug) return 0;
    const prefix = `components/src/${slug}/`;
    return cartEntries.filter(
      (e) => e.path.startsWith(prefix) && e.path !== metaPath,
    ).length;
  }, [cartEntries, slug, metaPath]);
  const inWorkspaceContext = siblingStaged > 0;
  const [confirmOrphanSubmit, setConfirmOrphanSubmit] = useState(false);

  useEffect(() => {
    if (!gh || !slug || !metaPath) return;
    setSchema({ kind: "loading" });
    setMeta({ kind: "loading" });
    setFormData(undefined);
    setPrUrl(null);
    setSubmitError(null);
    setStagedAt(null);
    (async () => {
      try {
        // Cart wins over remote — represents the user's in-progress work
        // (whether a new ghost-stub or a staged edit of an existing file).
        const cartHit = submissionCartSingleton
          .list()
          .find((e) => e.path === metaPath);
        const schemaText = await getTextFile(gh, "schemas/guideline-meta.json");
        let metaText: string;
        let source: "remote" | "cart" | "stub";
        if (cartHit) {
          metaText = cartHit.content;
          source = "cart";
        } else {
          try {
            metaText = await getTextFile(gh, metaPath);
            source = "remote";
          } catch (err) {
            const status = (err as { status?: number }).status;
            if (status !== 404) throw err;
            // No cart, no remote — fall back to a bare stub. (Coverage
            // dashboard normally stages in cart BEFORE navigating, so
            // this path is rare — e.g. direct URL hit or stale draft.)
            metaText = bareStub(slug);
            source = "stub";
          }
        }
        const parsed = parseYaml(metaText);
        setSchema({
          kind: "ready",
          value: JSON.parse(schemaText) as RJSFSchema,
        });
        setMeta({
          kind: "ready",
          value: { value: parsed, originalText: metaText, source },
        });
        setFormData(parsed);
      } catch (err) {
        const msg = (err as Error).message;
        setSchema({ kind: "error", message: msg });
        setMeta({ kind: "error", message: msg });
      }
    })();
  }, [gh, slug, metaPath]);

  const serializeForm = (submitted: unknown): string => {
    if (meta.kind !== "ready") throw new Error("meta not loaded");
    // _meta.yml's `domains.<name>` maps must be flow-style — the
    // knowledge repo's restricted YAML parser rejects block-nested
    // values under domains. flowAtDepth: 2 means: every YAMLMap at
    // depth 2 (i.e. each domain) becomes `{ status: …, owner: … }`.
    return stringifyYaml(submitted, {
      originalText: meta.value.originalText,
      flowAtDepth: 2,
    });
  };

  const handleSubmit = async (submitted: unknown) => {
    if (!gh || meta.kind !== "ready" || schema.kind !== "ready" || !metaPath)
      return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const yaml = serializeForm(submitted);
      const verb = meta.value.source === "remote" ? "update" : "create";
      const result = await submitDraft(
        {
          id: `meta-${slug}-${Date.now()}`,
          message: `chore(${slug}): ${verb} _meta.yml via editor\n\nEdited through the Knowledge Editor (Phase 1b).`,
          files: [{ path: metaPath, content: yaml }],
          sourceMetadata: { kind: "human", via: "MetaEditScreen" },
        },
        {
          owner: "volivarii",
          repo: "actian-ds-knowledge",
          base: "main",
          schemas: {
            "guideline-meta": schema.value as Record<string, unknown>,
          },
          octokit: gh,
        },
      );
      setPrUrl(result.prUrl);
      // If a cart entry was staged for this path, clear it — the PR
      // is open, so the staged stub is now redundant.
      if (inCart) submissionCartSingleton.remove(metaPath);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToBatch = () => {
    if (meta.kind !== "ready" || !metaPath) return;
    setSubmitError(null);
    try {
      const yaml = serializeForm(formData);
      submissionCartSingleton.add({
        path: metaPath,
        content: yaml,
        basedOnSha: "",
        addedAt: Date.now(),
      });
      setStagedAt(Date.now());
    } catch (err) {
      setSubmitError((err as Error).message);
    }
  };

  if (ghError) {
    return (
      <Callout.Root color="amber" role="alert">
        <Callout.Text>
          {ghError}{" "}
          {onOpenSettings && (
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onOpenSettings();
              }}
            >
              Open Settings →
            </Link>
          )}
        </Callout.Text>
      </Callout.Root>
    );
  }

  if (!path) {
    return (
      <Callout.Root>
        <Callout.Text>Choose a component in the sidebar to begin.</Callout.Text>
      </Callout.Root>
    );
  }

  if (!slug) {
    return (
      <Callout.Root color="red" role="alert">
        <Callout.Text>Path {path} is not a component _meta.yml.</Callout.Text>
      </Callout.Root>
    );
  }

  if (schema.kind === "error") {
    return (
      <Callout.Root color="ruby" role="alert">
        <Callout.Text>{schema.message}</Callout.Text>
      </Callout.Root>
    );
  }

  if (meta.kind === "error") {
    return (
      <Callout.Root color="ruby" role="alert">
        <Callout.Text>{meta.message}</Callout.Text>
      </Callout.Root>
    );
  }

  if (schema.kind !== "ready" || meta.kind !== "ready") {
    return <Spinner />;
  }

  const schemaValue = schema.value;
  const isNew = meta.value.source !== "remote";
  const justStaged = stagedAt !== null && Date.now() - stagedAt < 4000;

  return (
    <Card>
      <Flex direction="column" gap="3" p="3">
        {path && <TierBanner path={path} />}
        <Flex align="center" justify="between" gap="2" wrap="wrap">
          <Heading size="3">{path}</Heading>
          <Flex gap="2" align="center">
            {isNew && (
              <Badge color="amber" variant="soft">
                New component — not yet on remote
              </Badge>
            )}
            {inCart && (
              <Badge color="indigo" variant="soft">
                In batch
              </Badge>
            )}
          </Flex>
        </Flex>
        <Callout.Root color="gray" size="1">
          <Callout.Text>
            <strong>Advanced metadata.</strong> Domain status, owner, and
            last-updated are managed by the Authoring Workspace and git — not
            editable here. Use this surface for <code>related</code>,{" "}
            <code>examples</code>, <code>lastReviewed</code>, and{" "}
            <code>section</code>.
          </Callout.Text>
        </Callout.Root>
        <RJSFForm
          schema={schemaValue}
          uiSchema={guidelineMetaUiSchema}
          formData={formData}
          onChange={(next) => setFormData(next)}
          onSubmit={(v) => handleSubmit(v)}
          widgets={META_WIDGETS}
          formContext={{ octokit: gh }}
        >
          <Flex gap="2" mt="3" align="center" wrap="wrap">
            {inWorkspaceContext ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  color="gray"
                  size="2"
                  onClick={() => setConfirmOrphanSubmit(true)}
                  disabled={submitting}
                  title={`Open a PR for ONLY this _meta.yml — your ${siblingStaged} other staged file${siblingStaged === 1 ? "" : "s"} for this component stay in the batch`}
                >
                  Submit only this file…
                </Button>
                <Button
                  type="button"
                  onClick={handleAddToBatch}
                  disabled={submitting}
                  title={`Stage this _meta.yml alongside ${siblingStaged} other${siblingStaged === 1 ? "" : "s"} for this component. Submit them all together from the header batch button.`}
                >
                  {inCart ? "Update batch" : "Add to batch"}
                </Button>
              </>
            ) : (
              <>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Opening PR…" : "Submit as PR"}
                </Button>
                <Button
                  type="button"
                  variant="soft"
                  onClick={handleAddToBatch}
                  disabled={submitting}
                  title="Stage this _meta.yml in the submission batch"
                >
                  {inCart ? "Update batch" : "Add to batch"}
                </Button>
              </>
            )}
            {justStaged && (
              <Text size="1" color="grass">
                ✓ Staged
              </Text>
            )}
          </Flex>
        </RJSFForm>
        {prUrl && (
          <Callout.Root color="grass" role="status">
            <Callout.Text>
              PR opened —{" "}
              <Link href={prUrl} target="_blank" rel="noreferrer">
                {prUrl}
              </Link>
            </Callout.Text>
          </Callout.Root>
        )}
        {submitError && (
          <Callout.Root color="ruby" role="alert">
            <Callout.Text>Submit failed: {submitError}</Callout.Text>
          </Callout.Root>
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
            {siblingStaged === 1 ? "" : "s"} staged for <code>{slug}</code> in
            your batch. Submitting just this _meta.yml opens a PR for it alone —
            the staged sibling{siblingStaged === 1 ? "" : "s"} stay in the batch
            and may end up inconsistent (e.g. a domain.md file shipped on a
            separate PR from its metadata declaration).
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
                  void handleSubmit(formData);
                }}
              >
                Yes, submit only this file
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Card>
  );
}

function bareStub(slug: string): string {
  return [
    "# yaml-language-server: $schema=../../../schemas/guideline-meta.json",
    `component: "${slug}"`,
    "domains:",
    "  content: { status: not-started }",
    "  usage: { status: not-started }",
    "  design: { status: not-started }",
    "  behavior: { status: not-started }",
    "  tokens: { status: not-started }",
    "",
  ].join("\n");
}
