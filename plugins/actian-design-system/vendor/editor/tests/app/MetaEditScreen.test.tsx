import "../setup-dom";
import { test } from "node:test";
import assert from "node:assert/strict";
import { Theme } from "@radix-ui/themes";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { MetaEditScreen } from "../../src/app/MetaEditScreen";

// Bare-minimum fake octokit — never called because the test only exercises
// the null-path and loading branches. The real Octokit wiring is covered by
// submitDraft tests.
const fakeOctokit = {
  repos: { getContent: async () => ({ data: [] }) },
} as any;

function wrap(node: React.ReactNode) {
  return <Theme>{node}</Theme>;
}

test("MetaEditScreen — renders without throwing when an octokit is injected (null path)", () => {
  const { container } = render(
    wrap(<MetaEditScreen path={null} octokit={fakeOctokit} />),
  );
  assert.ok(container);
  cleanup();
});

test("MetaEditScreen — shows sidebar prompt when path is null", () => {
  render(wrap(<MetaEditScreen path={null} octokit={fakeOctokit} />));
  assert.ok(screen.getByText(/Choose a component in the sidebar/i));
  cleanup();
});
