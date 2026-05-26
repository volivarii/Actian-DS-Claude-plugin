// Draft Inbox — persistent management surface for the SubmissionCart.
//
// Distinct from the SubmissionStaging dialog (which is Submit-focused
// and modal). The inbox is a navigation/management surface: see what's
// in flight, jump back to in-progress files, remove individual entries.
// The "ship it" path still lives behind the header batch button.
//
// Routed via the sentinel path `inbox` recognized by EditorShell.

import { useMemo } from "react";
import {
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Flex,
  Heading,
  IconButton,
  Text,
} from "@radix-ui/themes";
import { submissionCartSingleton } from "../drafts/store-instance";
import { useCart } from "../drafts/useCart";
import type { CartEntry } from "../drafts/SubmissionCart";

export interface DraftInboxProps {
  onOpenFile: (path: string) => void;
  onOpenStaging: () => void;
}

interface GroupedEntries {
  key: string;
  label: string;
  /** When set, "Open" on the group header navigates to a workspace path
   *  instead of an individual file (e.g. a component slug → workspace/<slug>). */
  workspacePath?: string;
  entries: CartEntry[];
}

const COMPONENT_RE = /^components\/src\/([^/]+)\//;
const FOUNDATIONS_RE = /^foundations\//;
const ACCESSIBILITY_RE = /^accessibility\//;

function humanize(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function groupEntries(entries: CartEntry[]): GroupedEntries[] {
  const byKey = new Map<string, GroupedEntries>();
  for (const e of entries) {
    let key: string;
    let label: string;
    let workspacePath: string | undefined;
    const compMatch = COMPONENT_RE.exec(e.path);
    if (compMatch && compMatch[1] && compMatch[1] !== "categories") {
      key = `component:${compMatch[1]}`;
      label = humanize(compMatch[1]);
      workspacePath = `workspace/${compMatch[1]}`;
    } else if (FOUNDATIONS_RE.test(e.path)) {
      key = "foundations";
      label = "Foundations";
    } else if (ACCESSIBILITY_RE.test(e.path)) {
      key = "accessibility";
      label = "Accessibility";
    } else if (compMatch && compMatch[1] === "categories") {
      key = "categories";
      label = "Category defaults";
    } else {
      key = "other";
      label = "Other";
    }
    let group = byKey.get(key);
    if (!group) {
      group = { key, label, workspacePath, entries: [] };
      byKey.set(key, group);
    }
    group.entries.push(e);
  }
  // Sort groups: components first (alphabetical), then foundations,
  // accessibility, categories, other.
  return Array.from(byKey.values()).sort((a, b) => {
    const order = (g: GroupedEntries) =>
      g.key.startsWith("component:")
        ? `0_${g.label}`
        : g.key === "foundations"
          ? "1_foundations"
          : g.key === "accessibility"
            ? "2_accessibility"
            : g.key === "categories"
              ? "3_categories"
              : "9_other";
    return order(a).localeCompare(order(b));
  });
}

function formatRelative(ts: number, now: number = Date.now()): string {
  const diffSec = Math.max(0, Math.floor((now - ts) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function DraftInbox({ onOpenFile, onOpenStaging }: DraftInboxProps) {
  const entries = useCart(submissionCartSingleton);
  const groups = useMemo(() => groupEntries(entries), [entries]);

  return (
    <Box p="5" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Flex align="center" justify="between" gap="2" mb="3" wrap="wrap">
        <Box>
          <Heading size="5" mb="1">
            Draft inbox
          </Heading>
          <Text size="2" color="gray" as="p">
            {entries.length} file{entries.length === 1 ? "" : "s"} staged
            across {groups.length} {groups.length === 1 ? "group" : "groups"}.
            This view is for managing in-flight drafts — to submit the batch,
            use the header batch button.
          </Text>
        </Box>
        <Flex gap="2" align="center">
          <Button
            variant="soft"
            color="gray"
            disabled={entries.length === 0}
            onClick={() => submissionCartSingleton.clear()}
          >
            Clear all
          </Button>
          <Button disabled={entries.length === 0} onClick={onOpenStaging}>
            Open submission batch →
          </Button>
        </Flex>
      </Flex>

      {entries.length === 0 && (
        <Callout.Root color="blue">
          <Callout.Text>
            No drafts in batch. Drafts appear here when you edit files in the
            workspace, markdown editor, or metadata form and click{" "}
            <strong>Add to batch</strong>.
          </Callout.Text>
        </Callout.Root>
      )}

      <Flex direction="column" gap="3">
        {groups.map((g) => (
          <Card key={g.key} variant="surface">
            <Box p="3">
              <Flex align="center" justify="between" gap="2" mb="2" wrap="wrap">
                <Flex align="center" gap="2">
                  <Heading size="3">{g.label}</Heading>
                  <Badge color="gray" variant="soft" size="1">
                    {g.entries.length} file
                    {g.entries.length === 1 ? "" : "s"}
                  </Badge>
                </Flex>
                {g.workspacePath && (
                  <Button
                    variant="outline"
                    size="1"
                    onClick={() => onOpenFile(g.workspacePath!)}
                  >
                    Open workspace →
                  </Button>
                )}
              </Flex>
              <Flex direction="column" gap="1">
                {g.entries.map((e) => (
                  <Flex
                    key={e.path}
                    align="center"
                    justify="between"
                    gap="2"
                    px="2"
                    py="1"
                    style={{
                      borderRadius: 4,
                      background: "var(--gray-2)",
                    }}
                  >
                    <Box style={{ minWidth: 0, flex: 1 }}>
                      <Text size="2" weight="medium" as="div">
                        {e.path}
                      </Text>
                      <Text size="1" color="gray" as="div">
                        added {formatRelative(e.addedAt)}
                      </Text>
                    </Box>
                    <Flex gap="2" align="center">
                      <Button
                        size="1"
                        variant="ghost"
                        onClick={() => onOpenFile(e.path)}
                      >
                        Open →
                      </Button>
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="gray"
                        aria-label={`Remove ${e.path} from batch`}
                        onClick={() => submissionCartSingleton.remove(e.path)}
                      >
                        ✕
                      </IconButton>
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            </Box>
          </Card>
        ))}
      </Flex>
    </Box>
  );
}
