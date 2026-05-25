import { test } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { render, screen, cleanup } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import React from "react";
import { SaveStateIndicator } from "../../src/app/SaveStateIndicator";

function wrap(node: React.ReactNode) {
  return <Theme>{node}</Theme>;
}

test("SaveStateIndicator: renders nothing when state is idle", () => {
  // Render without the Theme wrapper so container.firstChild is truly null.
  const { container } = render(<SaveStateIndicator state={{ kind: "idle" }} />);
  assert.equal(container.firstChild, null);
  cleanup();
});

test("SaveStateIndicator: renders 'Unsaved changes' when state is unsaved", () => {
  render(wrap(<SaveStateIndicator state={{ kind: "unsaved" }} />));
  assert.ok(screen.getByText(/Unsaved changes/i));
  cleanup();
});

test("SaveStateIndicator: renders 'Saving…' when state is saving", () => {
  render(wrap(<SaveStateIndicator state={{ kind: "saving" }} />));
  assert.ok(screen.getByText(/Saving/i));
  cleanup();
});

test("SaveStateIndicator: renders 'Draft saved · just now' for fresh saved state", () => {
  const now = Date.now();
  render(wrap(<SaveStateIndicator state={{ kind: "saved", savedAt: now }} />));
  assert.ok(screen.getByText(/Draft saved/i));
  assert.ok(screen.getByText(/just now/i));
  cleanup();
});

test("SaveStateIndicator: renders relative timestamp for older saved state", () => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  render(
    wrap(
      <SaveStateIndicator state={{ kind: "saved", savedAt: tenMinutesAgo }} />,
    ),
  );
  assert.ok(screen.getByText(/Draft saved/i));
  // The relative time string should mention "m ago" (minutes) for a 10-minute-old save.
  const fullText =
    (screen.getByText(/Draft saved/i).textContent ?? "") +
    Array.from(screen.getAllByText(/m ago/i))
      .map((el) => el.textContent ?? "")
      .join("");
  assert.match(fullText, /1[0-9]?\s*m\s*ago/i);
  cleanup();
});
