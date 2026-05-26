import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import React from "react";
import { CoverageDashboard } from "../../src/app/CoverageDashboard";

afterEach(() => cleanup());

function wrap(node: React.ReactNode) {
  return <Theme>{node}</Theme>;
}

function b64(s: string): string {
  return Buffer.from(s, "utf-8").toString("base64");
}

function fakeGh(opts: {
  dirs: Array<{ name: string; type: "dir" | "file" }>;
  files: Record<string, string>;
}) {
  return {
    repos: {
      getContent: async ({ path }: { path: string }) => {
        if (path === "components/src") return { data: opts.dirs };
        const content = opts.files[path];
        if (content === undefined) {
          const err = new Error("not found") as Error & { status: number };
          err.status = 404;
          throw err;
        }
        return { data: { content: b64(content), encoding: "base64" } };
      },
    },
  } as any;
}

const DIRS = [
  { name: "button", type: "dir" as const },
  { name: "tabs", type: "dir" as const },
  { name: "categories", type: "dir" as const },
];

const FILES = {
  "components/src/button/_meta.yml": `
component: "Button"
category: action
domains:
  content: { status: approved }
  usage: { status: draft }
  design: { status: inherited }
  behavior: { status: not-started }
  tokens: { status: not-started }
`,
  "components/src/tabs/_meta.yml": `
component: "Tabs"
category: navigation
domains:
  content: { status: approved }
  usage: { status: not-started }
  design: { status: inherited }
  behavior: { status: inherited }
  tokens: { status: not-started }
`,
};

test("CoverageDashboard: renders rows from fixture _meta.yml", async () => {
  render(
    wrap(
      <CoverageDashboard
        octokit={fakeGh({ dirs: DIRS, files: FILES })}
        onOpenFile={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Button"));
  assert.ok(screen.getByText("Button"));
  assert.ok(screen.getByText("Tabs"));
});

test("CoverageDashboard: clicking row header opens _meta.yml", async () => {
  const calls: string[] = [];
  render(
    wrap(
      <CoverageDashboard
        octokit={fakeGh({ dirs: DIRS, files: FILES })}
        onOpenFile={(p) => calls.push(p)}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Button"));
  fireEvent.click(screen.getByText("Button"));
  assert.deepEqual(calls, ["components/src/button/_meta.yml"]);
});

test("CoverageDashboard: clicking approved cell opens domain.md", async () => {
  const calls: string[] = [];
  render(
    wrap(
      <CoverageDashboard
        octokit={fakeGh({ dirs: DIRS, files: FILES })}
        onOpenFile={(p) => calls.push(p)}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Button"));
  // 'ready' = the user-facing label for approved status. Two components
  // each have content=approved, so there are two 'ready' cells; click the first.
  const readyCells = screen.getAllByText("ready");
  fireEvent.click(readyCells[0]!);
  assert.equal(calls.length, 1);
  assert.match(calls[0]!, /^components\/src\/(button|tabs)\/content\.md$/);
});

test("CoverageDashboard: clicking inherited cell opens category file", async () => {
  const calls: string[] = [];
  render(
    wrap(
      <CoverageDashboard
        octokit={fakeGh({ dirs: DIRS, files: FILES })}
        onOpenFile={(p) => calls.push(p)}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Button"));
  const inheritedCells = screen.getAllByText("inherited");
  fireEvent.click(inheritedCells[0]!);
  assert.equal(calls.length, 1);
  assert.match(
    calls[0]!,
    /^components\/src\/categories\/(action|navigation)\.md$/,
  );
});

test("CoverageDashboard: shows per-domain counts strip", async () => {
  render(
    wrap(
      <CoverageDashboard
        octokit={fakeGh({ dirs: DIRS, files: FILES })}
        onOpenFile={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Button"));
  // both fixture components have content=approved → 2/2
  assert.ok(screen.getByText(/2\/2 authored/));
});

test("CoverageDashboard: shows error callout when load fails", async () => {
  const errGh = {
    repos: {
      getContent: async () => {
        throw new Error("boom");
      },
    },
  } as any;
  render(wrap(<CoverageDashboard octokit={errGh} onOpenFile={() => {}} />));
  await waitFor(() => screen.getByText(/Failed to load coverage/));
  assert.ok(screen.getByText(/boom/));
});
