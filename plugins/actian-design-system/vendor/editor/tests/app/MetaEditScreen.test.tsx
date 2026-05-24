import "../setup-dom";
import { test } from "node:test";
import assert from "node:assert/strict";
import { Theme } from "@radix-ui/themes";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { MetaEditScreen } from "../../src/app/MetaEditScreen";

// Bare-minimum fake octokit — never called because the test only exercises
// the missing-PAT branch. The real Octokit wiring is covered by submitDraft
// tests.
const fakeOctokit = {
  repos: { getContent: async () => ({ data: [] }) },
} as any;

function wrap(node: React.ReactNode) {
  return <Theme>{node}</Theme>;
}

test("MetaEditScreen — renders without throwing when an octokit is injected", () => {
  const { container } = render(
    wrap(<MetaEditScreen octokit={fakeOctokit} />),
  );
  assert.ok(container);
  cleanup();
});

test("MetaEditScreen — shows the Component picker label on mount", () => {
  render(wrap(<MetaEditScreen octokit={fakeOctokit} />));
  assert.ok(screen.getByText(/Component/i));
  cleanup();
});
