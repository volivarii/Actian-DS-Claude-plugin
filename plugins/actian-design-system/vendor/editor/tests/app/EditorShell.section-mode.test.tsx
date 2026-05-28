import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { render, screen, cleanup } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import React from "react";
import { EditorShell } from "../../src/app/EditorShell";

afterEach(cleanup);

// Smoke tests for the Tier 2 v1 layout.
//
// CRITICAL UX invariant (fixed after the v1 manual smoke discovered the
// tab-swap bug): the body editor stays mounted at all times. The Section
// Inspector appears as a fixed-width RIGHT-RAIL panel inside the markdown
// edit screen when the caret is inside a section — never as a tab swap
// that hides the body.
//
// EditorShell itself no longer renders any tabs. The auth-failed branch
// surfaces a callout, not a Section Inspector — so we just assert that the
// shell mounts without tabs in the default render.

test("EditorShell: renders no top-level tabs (body-editor-first layout)", () => {
  localStorage.clear();
  render(
    <Theme>
      <EditorShell />
    </Theme>,
  );
  const tabs = screen.queryAllByRole("tab");
  assert.equal(
    tabs.length,
    0,
    "EditorShell must not introduce a tab strip; the Section Inspector is an " +
      "in-pane right-rail panel owned by MarkdownEditScreen, not a tab toggle",
  );
});

test("EditorShell: mounts cleanly with no octokit (auth-failed path)", () => {
  localStorage.clear();
  // No octokit + no PAT in localStorage → MissingPATError surfaces inside a
  // Radix Callout. We just verify the shell renders without throwing — the
  // specific callout text is owned by the auth layer, not Tier 2.
  const { container } = render(
    <Theme>
      <EditorShell />
    </Theme>,
  );
  assert.ok(container.firstChild, "EditorShell must render a root node");
});
