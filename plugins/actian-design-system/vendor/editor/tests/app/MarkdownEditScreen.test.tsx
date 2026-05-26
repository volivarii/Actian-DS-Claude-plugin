import { test } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import React from "react";
import { MarkdownEditScreen } from "../../src/app/MarkdownEditScreen";

function makeFakeOctokit(remoteText: string, remoteSha = "SHA_REMOTE_1") {
  const remoteB64 = Buffer.from(remoteText, "utf-8").toString("base64");
  const calls: Record<string, unknown[]> = { "pulls.create": [] };
  return {
    calls,
    gh: {
      repos: {
        getContent: async () => ({
          data: { content: remoteB64, encoding: "base64", sha: remoteSha },
        }),
      },
      git: {
        getRef: async () => ({ data: { object: { sha: "BASE_SHA" } } }),
        createRef: async () => ({ data: {} }),
        createBlob: async () => ({ data: { sha: "BLOB" } }),
        createTree: async () => ({ data: { sha: "TREE" } }),
        createCommit: async () => ({ data: { sha: "COMMIT" } }),
        updateRef: async () => ({ data: {} }),
      },
      pulls: {
        create: async (args: unknown) => {
          calls["pulls.create"]!.push(args);
          return { data: { html_url: "https://github.com/x/y/pull/42" } };
        },
      },
    } as any,
  };
}

function wrap(node: React.ReactNode) {
  return <Theme>{node}</Theme>;
}

test("MarkdownEditScreen: loads remote and shows file path heading", async () => {
  localStorage.clear();
  const { gh } = makeFakeOctokit("## Hello {#hello}\n");
  render(
    wrap(
      <MarkdownEditScreen path="foundations/src/foundations.md" octokit={gh} />,
    ),
  );
  await waitFor(() =>
    assert.ok(screen.getByText("foundations/src/foundations.md")),
  );
  cleanup();
});

test("MarkdownEditScreen: submit opens a PR (happy path)", async () => {
  localStorage.clear();
  const { gh, calls } = makeFakeOctokit("## Hello {#hello}\n");
  render(
    wrap(
      <MarkdownEditScreen path="foundations/src/foundations.md" octokit={gh} />,
    ),
  );
  await waitFor(() => screen.getByRole("button", { name: /submit/i }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
  });
  await waitFor(() => assert.equal(calls["pulls.create"]!.length, 1));
  cleanup();
});
