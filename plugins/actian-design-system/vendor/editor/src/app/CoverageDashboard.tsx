// Landing dashboard — per-domain × per-component status matrix.
//
// Renders when EditorShell.activePath is null. Replaces the prior
// "Choose a file…" empty-state callout. Pure read+navigate; the only
// write affordance is "Start authoring" on ghost rows, which adds a
// stub _meta.yml to the submission cart for batch PR.
//
// Row sources (T1.5):
//   - authored (origin="authored"): every components/src/<slug>/_meta.yml
//   - unstarted (origin="unstarted"): every DS Kit registry component
//     with no _meta.yml yet (excluding icons / logos / illustrations /
//     uncategorized / local / white-label)
//
// Cell click routing (see cellTarget in coverageLoader.ts):
//   - approved/draft → opens components/src/<slug>/<domain>.md
//   - inherited → opens components/src/categories/<category>.md
//   - not-started → opens components/src/<slug>/_meta.yml
//   - row header (component name, authored) → opens _meta.yml
//   - row header (component name, unstarted) → Start authoring action

import { useEffect, useMemo, useState } from "react";
import type { Octokit } from "@octokit/rest";
import {
  Badge,
  Box,
  Button,
  Callout,
  Flex,
  Heading,
  Spinner,
  Table,
  Text,
} from "@radix-ui/themes";
import {
  cellTarget,
  DOMAINS,
  loadCoverage,
  summarize,
  type CoverageRow,
  type Domain,
  type Status,
} from "../lib/coverageLoader";
import { submissionCartSingleton } from "../drafts/store-instance";
import { useCart } from "../drafts/useCart";

export interface CoverageDashboardProps {
  octokit: Octokit;
  onOpenFile: (path: string) => void;
}

const STATUS_COLOR: Record<Status, "gray" | "amber" | "blue" | "green"> = {
  "not-started": "gray",
  draft: "amber",
  approved: "green",
  inherited: "blue",
};

const STATUS_LABEL: Record<Status, string> = {
  "not-started": "—",
  draft: "draft",
  approved: "ready",
  inherited: "inherited",
};

const DOMAIN_LABEL: Record<Domain, string> = {
  content: "Content",
  usage: "Usage",
  design: "Design",
  behavior: "Behavior",
  tokens: "Tokens",
};

export function CoverageDashboard({
  octokit,
  onOpenFile,
}: CoverageDashboardProps) {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; rows: CoverageRow[] }
    | { kind: "error"; message: string }
  >({ kind: "loading" });
  const cartEntries = useCart(submissionCartSingleton);
  const cartedPaths = useMemo(
    () => new Set(cartEntries.map((e) => e.path)),
    [cartEntries],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await loadCoverage(octokit);
        if (!cancelled) setState({ kind: "ready", rows });
      } catch (err) {
        if (!cancelled)
          setState({ kind: "error", message: (err as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [octokit]);

  const counts = useMemo(
    () => (state.kind === "ready" ? summarize(state.rows) : null),
    [state],
  );

  if (state.kind === "loading") {
    return (
      <Box p="6">
        <Flex align="center" gap="2">
          <Spinner />
          <Text size="2" color="gray">
            Loading coverage…
          </Text>
        </Flex>
      </Box>
    );
  }

  if (state.kind === "error") {
    return (
      <Box p="6">
        <Callout.Root color="red">
          <Callout.Text>Failed to load coverage: {state.message}</Callout.Text>
        </Callout.Root>
      </Box>
    );
  }

  const { rows } = state;

  function startAuthoring(row: CoverageRow) {
    // Open the workspace — pure navigation, no cart mutation. Staging
    // happens lazily the first time the user takes a concrete action
    // (Write a domain, or Edit metadata) inside the workspace.
    onOpenFile(`workspace/${row.slug}`);
  }

  return (
    <Box p="5" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Heading size="5" mb="1">
        Coverage
      </Heading>
      <Text size="2" color="gray" mb="3" as="p">
        {counts!.authored} authored · {counts!.unstarted} unstarted ·{" "}
        {counts!.total} eligible DS Kit components (non-icon). Click a component
        name to open its <code>_meta.yml</code>; click a status cell to edit
        that domain; click <em>Start authoring</em> on an unstarted row to open
        a pre-filled stub in the form editor.
      </Text>

      <Flex gap="3" wrap="wrap" mb="4">
        {DOMAINS.map((d) => {
          const c = counts!.perDomain[d];
          return (
            <Badge key={d} variant="soft" color="gray" size="2">
              <Text weight="medium">{DOMAIN_LABEL[d]}</Text>
              <Text>
                {" · "}
                {c.authored}/{counts!.total} authored
                {c.inherited > 0 ? ` · ${c.inherited} inherited` : ""}
              </Text>
            </Badge>
          );
        })}
      </Flex>

      <Table.Root variant="surface" size="1">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Component</Table.ColumnHeaderCell>
            {DOMAINS.map((d) => (
              <Table.ColumnHeaderCell key={d}>
                {DOMAIN_LABEL[d]}
              </Table.ColumnHeaderCell>
            ))}
            <Table.ColumnHeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={2 + DOMAINS.length}>
                <Text color="gray">No components found.</Text>
              </Table.Cell>
            </Table.Row>
          )}
          {rows.map((row) => {
            const isGhost = row.origin === "unstarted";
            const metaPath = `components/src/${row.slug}/_meta.yml`;
            const staged = cartedPaths.has(metaPath);
            return (
              <Table.Row key={row.slug} style={{ opacity: isGhost ? 0.78 : 1 }}>
                <Table.RowHeaderCell>
                  <Text
                    weight="medium"
                    style={{
                      cursor: isGhost ? "default" : "pointer",
                      fontStyle: isGhost ? "italic" : "normal",
                    }}
                    onClick={() => {
                      if (!isGhost) onOpenFile(metaPath);
                    }}
                    title={
                      isGhost
                        ? `Unstarted (registry: ${row.registryKey})`
                        : `Open ${row.slug}/_meta.yml`
                    }
                  >
                    {row.component}
                  </Text>
                  {row.category && (
                    <Text size="1" color="gray" as="div">
                      {row.category}
                    </Text>
                  )}
                </Table.RowHeaderCell>
                {DOMAINS.map((d) => {
                  const entry = row.domains[d];
                  const target = cellTarget(row, d);
                  return (
                    <Table.Cell
                      key={d}
                      style={{ cursor: isGhost ? "default" : "pointer" }}
                      onClick={() => {
                        if (!isGhost) onOpenFile(target);
                      }}
                      title={
                        isGhost
                          ? "Click Start authoring to add a stub _meta.yml"
                          : `Status: ${entry.status} → ${target}`
                      }
                    >
                      <Badge
                        color={STATUS_COLOR[entry.status]}
                        variant="soft"
                        size="1"
                      >
                        {STATUS_LABEL[entry.status]}
                      </Badge>
                    </Table.Cell>
                  );
                })}
                <Table.Cell>
                  {isGhost && (
                    <Button
                      size="1"
                      variant={staged ? "soft" : "outline"}
                      color={staged ? "gray" : "indigo"}
                      disabled={staged}
                      onClick={() => startAuthoring(row)}
                      title={
                        staged
                          ? "Already staged in the batch"
                          : "Stage a stub _meta.yml in the submission batch"
                      }
                    >
                      {staged ? "Staged" : "Start authoring"}
                    </Button>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
