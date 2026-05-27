import { test, afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import React from "react";
import { DraftInbox } from "../../src/app/DraftInbox";
import { submissionCartSingleton } from "../../src/drafts/store-instance";

afterEach(() => cleanup());

beforeEach(() => {
  submissionCartSingleton.clear();
});

function wrap(node: React.ReactNode) {
  return <Theme>{node}</Theme>;
}

test("DraftInbox: shows empty state when cart has no entries", () => {
  render(wrap(<DraftInbox onOpenFile={() => {}} onOpenStaging={() => {}} />));
  assert.ok(screen.getByText(/No drafts in batch/i));
});

test("DraftInbox: groups entries by component slug", () => {
  submissionCartSingleton.add({
    path: "components/src/button/content.md",
    content: "x",
    basedOnSha: "",
    addedAt: Date.now(),
  });
  submissionCartSingleton.add({
    path: "components/src/button/_meta.yml",
    content: "y",
    basedOnSha: "",
    addedAt: Date.now(),
  });
  submissionCartSingleton.add({
    path: "components/src/tabs/content.md",
    content: "z",
    basedOnSha: "",
    addedAt: Date.now(),
  });
  render(wrap(<DraftInbox onOpenFile={() => {}} onOpenStaging={() => {}} />));
  assert.ok(screen.getByText("Button"));
  assert.ok(screen.getByText("Tabs"));
  assert.ok(screen.getByText("components/src/button/content.md"));
  assert.ok(screen.getByText("components/src/tabs/content.md"));
});

test("DraftInbox: groups foundations + accessibility separately", () => {
  submissionCartSingleton.add({
    path: "foundations/src/02-color-primitives.md",
    content: "x",
    basedOnSha: "abc",
    addedAt: Date.now(),
  });
  submissionCartSingleton.add({
    path: "accessibility/accessibility.md",
    content: "y",
    basedOnSha: "abc",
    addedAt: Date.now(),
  });
  render(wrap(<DraftInbox onOpenFile={() => {}} onOpenStaging={() => {}} />));
  assert.ok(screen.getByText("Foundations"));
  assert.ok(screen.getByText("Accessibility"));
});

test("DraftInbox: Open → calls onOpenFile with the file path", () => {
  submissionCartSingleton.add({
    path: "foundations/src/02-color-primitives.md",
    content: "x",
    basedOnSha: "abc",
    addedAt: Date.now(),
  });
  const calls: string[] = [];
  render(
    wrap(
      <DraftInbox onOpenFile={(p) => calls.push(p)} onOpenStaging={() => {}} />,
    ),
  );
  fireEvent.click(screen.getByText("Open →"));
  assert.deepEqual(calls, ["foundations/src/02-color-primitives.md"]);
});

test("DraftInbox: workspace group → 'Open workspace →' navigates to workspace/<slug>", () => {
  submissionCartSingleton.add({
    path: "components/src/button/content.md",
    content: "x",
    basedOnSha: "",
    addedAt: Date.now(),
  });
  const calls: string[] = [];
  render(
    wrap(
      <DraftInbox onOpenFile={(p) => calls.push(p)} onOpenStaging={() => {}} />,
    ),
  );
  fireEvent.click(screen.getByText("Open workspace →"));
  assert.deepEqual(calls, ["workspace/button"]);
});

test("DraftInbox: Remove → drops the entry from the cart", () => {
  submissionCartSingleton.add({
    path: "components/src/button/content.md",
    content: "x",
    basedOnSha: "",
    addedAt: Date.now(),
  });
  const { container } = render(
    wrap(<DraftInbox onOpenFile={() => {}} onOpenStaging={() => {}} />),
  );
  assert.equal(submissionCartSingleton.list().length, 1);
  // The remove button has aria-label "Remove <path> from batch".
  const removeBtn = container.querySelector(
    '[aria-label*="Remove"][aria-label*="from batch"]',
  ) as HTMLElement | null;
  assert.ok(removeBtn);
  fireEvent.click(removeBtn!);
  assert.equal(submissionCartSingleton.list().length, 0);
});

test("DraftInbox: Clear all wipes the cart", () => {
  submissionCartSingleton.add({
    path: "components/src/button/content.md",
    content: "x",
    basedOnSha: "",
    addedAt: Date.now(),
  });
  submissionCartSingleton.add({
    path: "components/src/tabs/content.md",
    content: "y",
    basedOnSha: "",
    addedAt: Date.now(),
  });
  render(wrap(<DraftInbox onOpenFile={() => {}} onOpenStaging={() => {}} />));
  fireEvent.click(screen.getByText("Clear all"));
  assert.equal(submissionCartSingleton.list().length, 0);
});

test("DraftInbox: 'Open submission batch' calls onOpenStaging", () => {
  submissionCartSingleton.add({
    path: "components/src/button/content.md",
    content: "x",
    basedOnSha: "",
    addedAt: Date.now(),
  });
  let opened = false;
  render(
    wrap(
      <DraftInbox
        onOpenFile={() => {}}
        onOpenStaging={() => (opened = true)}
      />,
    ),
  );
  fireEvent.click(screen.getByText(/Open submission batch/));
  assert.equal(opened, true);
});
