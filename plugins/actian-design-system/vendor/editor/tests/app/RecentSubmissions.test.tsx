import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import React from "react";
import {
  anyOpenFailing,
  deriveCi,
  RecentSubmissions,
  type SubmissionRow,
} from "../../src/app/RecentSubmissions";

afterEach(() => cleanup());

function wrap(node: React.ReactNode) {
  return <Theme>{node}</Theme>;
}

interface FakeGhOpts {
  authorLogin?: string;
  prs?: Array<{
    number: number;
    title: string;
    state: "open" | "closed";
    merged_at?: string | null;
    html_url: string;
    created_at: string;
    user: { login: string };
    head: { sha: string };
  }>;
  checksBySha?: Record<string, Array<{ status: string; conclusion: string | null }>>;
}

function fakeGh(opts: FakeGhOpts = {}) {
  return {
    users: {
      getAuthenticated: async () => ({
        data: { login: opts.authorLogin ?? "me" },
      }),
    },
    pulls: {
      list: async () => ({ data: opts.prs ?? [] }),
    },
    checks: {
      listForRef: async ({ ref }: { ref: string }) => ({
        data: { check_runs: opts.checksBySha?.[ref] ?? [] },
      }),
    },
  } as any;
}

test("RecentSubmissions: shows empty state when author has no PRs", async () => {
  render(
    wrap(
      <RecentSubmissions
        octokit={fakeGh({ authorLogin: "me", prs: [] })}
        open={true}
        onOpenChange={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText(/haven't opened any PRs/i));
  assert.ok(true);
});

test("RecentSubmissions: renders only PRs authored by the PAT owner", async () => {
  const gh = fakeGh({
    authorLogin: "me",
    prs: [
      {
        number: 1,
        title: "mine",
        state: "open",
        merged_at: null,
        html_url: "https://example/1",
        created_at: "2026-05-24T00:00:00Z",
        user: { login: "me" },
        head: { sha: "aaa" },
      },
      {
        number: 2,
        title: "someone else",
        state: "open",
        merged_at: null,
        html_url: "https://example/2",
        created_at: "2026-05-24T00:00:00Z",
        user: { login: "bob" },
        head: { sha: "bbb" },
      },
    ],
    checksBySha: { aaa: [], bbb: [] },
  });
  render(
    wrap(
      <RecentSubmissions octokit={gh} open={true} onOpenChange={() => {}} />,
    ),
  );
  await waitFor(() => screen.getByText(/mine/));
  assert.ok(screen.getByText(/mine/));
  assert.equal(screen.queryByText(/someone else/), null);
});

test("RecentSubmissions: surfaces CI status badge per PR", async () => {
  const gh = fakeGh({
    authorLogin: "me",
    prs: [
      {
        number: 1,
        title: "broken",
        state: "open",
        merged_at: null,
        html_url: "https://example/1",
        created_at: "2026-05-24T00:00:00Z",
        user: { login: "me" },
        head: { sha: "fail-sha" },
      },
    ],
    checksBySha: {
      "fail-sha": [{ status: "completed", conclusion: "failure" }],
    },
  });
  render(
    wrap(
      <RecentSubmissions octokit={gh} open={true} onOpenChange={() => {}} />,
    ),
  );
  await waitFor(() => screen.getByText(/CI: failure/i));
  assert.ok(screen.getByText(/CI: failure/i));
});

test("RecentSubmissions: skips polling when closed", async () => {
  let listCalls = 0;
  const gh = {
    users: { getAuthenticated: async () => ({ data: { login: "me" } }) },
    pulls: {
      list: async () => {
        listCalls += 1;
        return { data: [] };
      },
    },
    checks: { listForRef: async () => ({ data: { check_runs: [] } }) },
  } as any;
  render(
    wrap(
      <RecentSubmissions octokit={gh} open={false} onOpenChange={() => {}} />,
    ),
  );
  // Give effects a chance to run.
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(listCalls, 0);
});

test("deriveCi: empty runs → 'none'", () => {
  assert.equal(deriveCi([]), "none");
});

test("deriveCi: any in-progress → 'pending'", () => {
  assert.equal(
    deriveCi([{ status: "in_progress", conclusion: null }]),
    "pending",
  );
});

test("deriveCi: any failure → 'failure'", () => {
  assert.equal(
    deriveCi([
      { status: "completed", conclusion: "success" },
      { status: "completed", conclusion: "failure" },
    ]),
    "failure",
  );
});

test("deriveCi: all success → 'success'", () => {
  assert.equal(
    deriveCi([
      { status: "completed", conclusion: "success" },
      { status: "completed", conclusion: "success" },
    ]),
    "success",
  );
});

test("anyOpenFailing: true only when an open PR has CI failure", () => {
  const rows: SubmissionRow[] = [
    {
      number: 1,
      title: "closed-failure",
      state: "closed",
      url: "",
      createdAt: "",
      ci: "failure",
    },
    {
      number: 2,
      title: "open-success",
      state: "open",
      url: "",
      createdAt: "",
      ci: "success",
    },
  ];
  assert.equal(anyOpenFailing(rows), false);
  rows.push({
    number: 3,
    title: "open-failure",
    state: "open",
    url: "",
    createdAt: "",
    ci: "failure",
  });
  assert.equal(anyOpenFailing(rows), true);
});
