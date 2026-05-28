import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import React from "react";
import { AnchorReferencesPopover } from "../../src/app/AnchorReferencesPopover";
import { setCachedIndexForTesting } from "../../src/lib/anchorIndex";

afterEach(() => {
  cleanup();
  setCachedIndexForTesting(null);
});

function primeIndex(slug: string, refs: string[]) {
  setCachedIndexForTesting({
    entries: new Map([
      [slug, { slug, definedIn: ["a.md"], referencedBy: refs }],
    ]),
    scannedAt: 0,
    scannedPaths: [],
  });
}

test("AnchorReferencesPopover: shows referencing files", () => {
  primeIndex("alpha", [
    "foundations/src/color-primitives.md",
    "accessibility/src/principles.md",
  ]);
  render(
    <Theme>
      <AnchorReferencesPopover
        slug="alpha"
        open
        onNavigate={() => {}}
        onOpenChange={() => {}}
      />
    </Theme>,
  );
  assert.ok(screen.getByText("foundations/src/color-primitives.md"));
  assert.ok(screen.getByText("accessibility/src/principles.md"));
});

test("AnchorReferencesPopover: shows '0 refs' when unused", () => {
  primeIndex("alpha", []);
  render(
    <Theme>
      <AnchorReferencesPopover
        slug="alpha"
        open
        onNavigate={() => {}}
        onOpenChange={() => {}}
      />
    </Theme>,
  );
  assert.ok(screen.getByText(/no references/i));
});

test("AnchorReferencesPopover: clicking a file dispatches onNavigate", () => {
  primeIndex("alpha", ["accessibility/src/principles.md"]);
  const calls: string[] = [];
  render(
    <Theme>
      <AnchorReferencesPopover
        slug="alpha"
        open
        onNavigate={(p) => calls.push(p)}
        onOpenChange={() => {}}
      />
    </Theme>,
  );
  fireEvent.click(screen.getByText("accessibility/src/principles.md"));
  assert.deepEqual(calls, ["accessibility/src/principles.md"]);
});
