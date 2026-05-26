// Drawer surfacing the current author's recent PRs + CI status.
//
// Closes R4 C14 ("opaque CI") + C15 ("no feedback"). Polls every 60s
// while the drawer is open; suspends polling when closed.
//
// V1 scope (PR 2b T4): list up to 20 most recent PRs authored by the
// PAT's owner; per-PR CI status derived from the head SHA's check runs.
// Webhooks-based real-time updates deferred (would require a server).

import { useCallback, useEffect, useState } from "react";
import type { Octokit } from "@octokit/rest";
import { DEFAULT_COORDS } from "../config/coords";
import {
  Badge,
  Box,
  Callout,
  Dialog,
  Flex,
  Link,
  Spinner,
  Text,
} from "@radix-ui/themes";

export type CiStatus =
  | "success"
  | "failure"
  | "pending"
  | "cancelled"
  | "skipped"
  | "neutral"
  | "none";

export interface SubmissionRow {
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  url: string;
  createdAt: string;
  ci: CiStatus;
}

export interface RecentSubmissionsProps {
  octokit: Octokit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoaded?: (rows: SubmissionRow[]) => void;
}

const POLL_INTERVAL_MS = 60_000;

const CI_COLOR: Record<CiStatus, "green" | "red" | "amber" | "gray"> = {
  success: "green",
  failure: "red",
  pending: "amber",
  cancelled: "gray",
  skipped: "gray",
  neutral: "gray",
  none: "gray",
};

const STATE_COLOR: Record<SubmissionRow["state"], "green" | "purple" | "gray"> =
  {
    open: "green",
    merged: "purple",
    closed: "gray",
  };

export function RecentSubmissions({
  octokit,
  open,
  onOpenChange,
  onLoaded,
}: RecentSubmissionsProps) {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loadState, setLoadState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoadState((s) => (s === "ready" ? "ready" : "loading"));
    setErrorMessage(null);
    try {
      const next = await fetchSubmissions(octokit);
      setRows(next);
      setLoadState("ready");
      onLoaded?.(next);
    } catch (err) {
      setLoadState("error");
      setErrorMessage((err as Error).message);
    }
  }, [octokit, onLoaded]);

  useEffect(() => {
    if (!open) return;
    void refresh();
    const id = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [open, refresh]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="640px">
        <Dialog.Title>My recent submissions</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="3">
          Up to 20 most-recent PRs you authored. Refreshes every 60 seconds
          while open.
        </Dialog.Description>

        {loadState === "loading" && rows.length === 0 && (
          <Flex align="center" gap="2" my="3">
            <Spinner />
            <Text size="2" color="gray">
              Loading submissions…
            </Text>
          </Flex>
        )}

        {loadState === "error" && (
          <Callout.Root color="red" mb="3">
            <Callout.Text>{errorMessage}</Callout.Text>
          </Callout.Root>
        )}

        {loadState === "ready" && rows.length === 0 && (
          <Text color="gray">You haven't opened any PRs in this repo yet.</Text>
        )}

        {rows.length > 0 && (
          <Flex direction="column" gap="1" mb="3">
            {rows.map((r) => (
              <Flex
                key={r.number}
                align="center"
                justify="between"
                gap="2"
                px="2"
                py="2"
                style={{ borderRadius: 4, background: "var(--gray-2)" }}
              >
                <Box style={{ minWidth: 0, flex: 1 }}>
                  <Link
                    href={r.url}
                    target="_blank"
                    rel="noopener"
                    size="2"
                    weight="medium"
                  >
                    #{r.number} {r.title}
                  </Link>
                  <Text size="1" color="gray" as="div">
                    {new Date(r.createdAt).toLocaleString()}
                  </Text>
                </Box>
                <Flex gap="1" align="center">
                  <Badge color={STATE_COLOR[r.state]} variant="soft" size="1">
                    {r.state}
                  </Badge>
                  <Badge color={CI_COLOR[r.ci]} variant="soft" size="1">
                    CI: {r.ci}
                  </Badge>
                </Flex>
              </Flex>
            ))}
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

async function fetchSubmissions(gh: Octokit): Promise<SubmissionRow[]> {
  const me = await gh.users.getAuthenticated();
  const prs = await gh.pulls.list({
    ...DEFAULT_COORDS,
    state: "all",
    per_page: 20,
    sort: "created",
    direction: "desc",
  });
  const mine = prs.data.filter((pr) => pr.user?.login === me.data.login);
  return Promise.all(
    mine.map(async (pr) => {
      const ci = await fetchCi(gh, pr.head.sha);
      return {
        number: pr.number,
        title: pr.title,
        state: pr.merged_at
          ? ("merged" as const)
          : (pr.state as "open" | "closed"),
        url: pr.html_url,
        createdAt: pr.created_at,
        ci,
      };
    }),
  );
}

async function fetchCi(gh: Octokit, sha: string): Promise<CiStatus> {
  try {
    const res = await gh.checks.listForRef({
      ...DEFAULT_COORDS,
      ref: sha,
    });
    return deriveCi(res.data.check_runs);
  } catch {
    return "none";
  }
}

interface CheckRunLite {
  status: string;
  conclusion: string | null;
}

export function deriveCi(runs: CheckRunLite[]): CiStatus {
  if (runs.length === 0) return "none";
  if (runs.some((r) => r.status !== "completed")) return "pending";
  // All completed — derive worst conclusion.
  if (
    runs.some((r) => r.conclusion === "failure" || r.conclusion === "timed_out")
  )
    return "failure";
  if (runs.some((r) => r.conclusion === "cancelled")) return "cancelled";
  if (
    runs.every((r) => r.conclusion === "success" || r.conclusion === "skipped")
  )
    return "success";
  return "neutral";
}

// Quick predicate used by App to color the header badge.
export function anyOpenFailing(rows: SubmissionRow[]): boolean {
  return rows.some((r) => r.state === "open" && r.ci === "failure");
}
