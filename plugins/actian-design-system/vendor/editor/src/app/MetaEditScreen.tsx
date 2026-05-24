// Phase 1a vertical slice: list component dirs from
// components/src/, load one _meta.yml, render the schema-driven form,
// submit the change as a real PR. Proves the whole pipeline end-to-end.
//
// Coverage of every authored content type, all three tiers, and the rich
// markdown editor + live preview lands in Phase 1b (Tasks 6-14).

import { useEffect, useMemo, useState } from "react";
import type { Octokit } from "@octokit/rest";
import type { RJSFSchema } from "@rjsf/utils";
import {
  Box,
  Button,
  Callout,
  Card,
  Flex,
  Heading,
  Link,
  Select,
  Spinner,
  Text,
} from "@radix-ui/themes";
import { createOctokit, MissingPATError } from "../core/octokit";
import { submitDraft } from "../core/submitDraft";
import { getTextFile, listDirectories } from "./githubApi";
import { RJSFForm } from "../form-engine/RJSFForm";
import { guidelineMetaUiSchema } from "../uiSchemas/guidelineMeta";
import { parseYaml, stringifyYaml } from "../form-engine/yamlSerializer";

interface MetaEditScreenProps {
  octokit?: Octokit;
  onOpenSettings?: () => void;
}

type LoadState<T> =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; value: T }
  | { kind: "error"; message: string };

// listDirectories filters to entry.type === "dir", so AUTHORING.md and
// EDITING-GUIDE.md never reach this set. The two entries here are real
// subdirectories under components/src/ that aren't editable components:
// `categories/` holds category-defaults frontmatter (editable in its own
// screen in Phase 1b) and `guidelines/` is the legacy scraped layer (read-
// only via validatePaths through the */dist/ pattern, but kept off this
// picker for clarity).
const SKIP_DIRS = new Set(["categories", "guidelines"]);

export function MetaEditScreen({
  octokit,
  onOpenSettings,
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

  const [components, setComponents] = useState<LoadState<string[]>>({
    kind: "idle",
  });
  const [schema, setSchema] = useState<LoadState<RJSFSchema>>({
    kind: "idle",
  });
  const [selected, setSelected] = useState<string | null>(null);
  // Track originalText alongside the parsed value so stringifyYaml can
  // preserve leading comments (yaml-language-server header) on submit.
  const [meta, setMeta] = useState<
    LoadState<{ value: unknown; originalText: string }>
  >({ kind: "idle" });
  const [submitState, setSubmitState] = useState<LoadState<{ prUrl: string }>>({
    kind: "idle",
  });

  useEffect(() => {
    if (!gh) return;
    setComponents({ kind: "loading" });
    listDirectories(gh, "components/src")
      .then((names) =>
        setComponents({
          kind: "ready",
          value: names.filter((n) => !SKIP_DIRS.has(n)),
        }),
      )
      .catch((err: Error) =>
        setComponents({ kind: "error", message: err.message }),
      );
  }, [gh]);

  useEffect(() => {
    if (!gh) return;
    setSchema({ kind: "loading" });
    getTextFile(gh, "schemas/guideline-meta.json")
      .then((text) =>
        setSchema({ kind: "ready", value: JSON.parse(text) as RJSFSchema }),
      )
      .catch((err: Error) =>
        setSchema({ kind: "error", message: err.message }),
      );
  }, [gh]);

  useEffect(() => {
    if (!gh || !selected) return;
    setMeta({ kind: "loading" });
    setSubmitState({ kind: "idle" });
    getTextFile(gh, `components/src/${selected}/_meta.yml`)
      .then((text) =>
        setMeta({
          kind: "ready",
          value: { value: parseYaml(text), originalText: text },
        }),
      )
      .catch((err: Error) => setMeta({ kind: "error", message: err.message }));
  }, [gh, selected]);

  async function handleSubmit(next: unknown) {
    if (!gh || !selected || schema.kind !== "ready" || meta.kind !== "ready")
      return;
    setSubmitState({ kind: "loading" });
    try {
      // _meta.yml's `domains.<name>` maps must be flow-style — the
      // knowledge repo's restricted YAML parser rejects block-nested
      // values under domains. flowAtDepth: 2 means: every YAMLMap at
      // depth 2 (i.e. each domain) becomes `{ status: …, owner: … }`.
      const yaml = stringifyYaml(next, {
        originalText: meta.value.originalText,
        flowAtDepth: 2,
      });
      const result = await submitDraft(
        {
          id: `${selected}-${Date.now()}`,
          message: `chore(${selected}): update _meta.yml via editor\n\nEdited through the Knowledge Editor (Phase 1a vertical slice).`,
          files: [
            {
              path: `components/src/${selected}/_meta.yml`,
              content: yaml,
            },
          ],
          sourceMetadata: { kind: "human", via: "editor/form" },
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
      setSubmitState({ kind: "ready", value: { prUrl: result.prUrl } });
    } catch (err) {
      setSubmitState({
        kind: "error",
        message: (err as Error).message,
      });
    }
  }

  if (ghError) {
    return (
      <Callout.Root color="amber" role="alert">
        <Callout.Text>
          {ghError}{" "}
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onOpenSettings?.();
            }}
          >
            Open Settings →
          </Link>
        </Callout.Text>
      </Callout.Root>
    );
  }

  return (
    <Flex direction="column" gap="4">
      <Box>
        <Text
          as="div"
          size="2"
          weight="bold"
          mb="1"
          id="component-picker-label"
        >
          Component
        </Text>
        {components.kind === "loading" && <Spinner />}
        {components.kind === "error" && (
          <Callout.Root color="ruby" role="alert">
            <Callout.Text>{components.message}</Callout.Text>
          </Callout.Root>
        )}
        {components.kind === "ready" && (
          <Select.Root
            value={selected ?? undefined}
            onValueChange={(v) => setSelected(v)}
          >
            <Select.Trigger
              aria-labelledby="component-picker-label"
              placeholder={`Pick one of ${components.value.length}…`}
            />
            <Select.Content>
              {components.value.map((slug) => (
                <Select.Item key={slug} value={slug}>
                  {slug}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        )}
      </Box>

      {selected && (
        <Card>
          <Flex direction="column" gap="3" p="3">
            <Heading size="3">{selected}/_meta.yml</Heading>
            {meta.kind === "loading" && <Spinner />}
            {meta.kind === "error" && (
              <Callout.Root color="ruby" role="alert">
                <Callout.Text>{meta.message}</Callout.Text>
              </Callout.Root>
            )}
            {schema.kind === "loading" && <Text size="2">Loading schema…</Text>}
            {schema.kind === "error" && (
              <Callout.Root color="ruby" role="alert">
                <Callout.Text>Schema: {schema.message}</Callout.Text>
              </Callout.Root>
            )}
            {meta.kind === "ready" && schema.kind === "ready" && (
              <RJSFForm
                schema={schema.value}
                uiSchema={guidelineMetaUiSchema}
                formData={meta.value.value}
                onChange={(v) =>
                  setMeta({
                    kind: "ready",
                    value: { ...meta.value, value: v },
                  })
                }
                onSubmit={(v) => handleSubmit(v)}
              >
                <Flex gap="2" mt="3">
                  <Button
                    type="submit"
                    disabled={submitState.kind === "loading"}
                  >
                    {submitState.kind === "loading"
                      ? "Opening PR…"
                      : "Submit as PR"}
                  </Button>
                </Flex>
              </RJSFForm>
            )}
            {submitState.kind === "ready" && (
              <Callout.Root color="grass" role="status">
                <Callout.Text>
                  PR opened —{" "}
                  <Link
                    href={submitState.value.prUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {submitState.value.prUrl}
                  </Link>
                </Callout.Text>
              </Callout.Root>
            )}
            {submitState.kind === "error" && (
              <Callout.Root color="ruby" role="alert">
                <Callout.Text>
                  Submit failed: {submitState.message}
                </Callout.Text>
              </Callout.Root>
            )}
          </Flex>
        </Card>
      )}
    </Flex>
  );
}
