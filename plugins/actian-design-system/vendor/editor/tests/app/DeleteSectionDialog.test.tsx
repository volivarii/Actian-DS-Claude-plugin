import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import React from "react";
import { DeleteSectionDialog } from "../../src/app/DeleteSectionDialog";

afterEach(cleanup);

function renderDialog(
  overrides: Partial<Parameters<typeof DeleteSectionDialog>[0]> = {},
) {
  const defaults: Parameters<typeof DeleteSectionDialog>[0] = {
    open: true,
    slug: "tokens",
    title: "Tokens",
    domain: "foundations",
    refCount: 0,
    sampleRefs: [],
    onConfirm: () => {},
    onCancel: () => {},
  };
  return render(
    <Theme>
      <DeleteSectionDialog {...defaults} {...overrides} />
    </Theme>,
  );
}

function deleteButton(): HTMLButtonElement {
  // Portal-rendered — query document.body
  const btns = document.body.querySelectorAll("button");
  for (const b of btns) {
    if (/^delete$/i.test((b as HTMLButtonElement).textContent ?? "")) {
      return b as HTMLButtonElement;
    }
  }
  throw new Error("Delete button not found");
}

test("DeleteSectionDialog — refCount=0: Delete enabled immediately, no checkbox", () => {
  renderDialog({ refCount: 0, sampleRefs: [] });
  const btn = deleteButton();
  assert.equal(btn.disabled, false);
  assert.equal(document.body.querySelector('button[role="checkbox"]'), null);
});

test("DeleteSectionDialog — refCount>=1: Delete disabled until ack ticked", () => {
  renderDialog({
    refCount: 4,
    sampleRefs: [
      "components/dist/guidelines/button.json",
      "foundations/src/design-guidelines.md",
      "accessibility/src/color-contrast.md",
    ],
  });
  const btn = deleteButton();
  assert.equal(btn.disabled, true);

  const ack = document.body.querySelector(
    'button[role="checkbox"]',
  ) as HTMLButtonElement;
  assert.ok(ack, "ack checkbox present");
  fireEvent.click(ack);
  assert.equal(btn.disabled, false);
});

test("DeleteSectionDialog — refCount>=1: warning lists sample refs and '+N more'", () => {
  renderDialog({
    refCount: 5,
    sampleRefs: ["a.json", "b.md", "c.md"],
  });
  const text = document.body.textContent ?? "";
  assert.match(text, /a\.json/);
  assert.match(text, /b\.md/);
  assert.match(text, /c\.md/);
  assert.match(text, /\+2 more/i);
});

test("DeleteSectionDialog — confirm fires with the slug", () => {
  let captured: string | null = null;
  renderDialog({
    refCount: 0,
    sampleRefs: [],
    onConfirm: (s) => {
      captured = s;
    },
  });
  fireEvent.click(deleteButton());
  assert.equal(captured, "tokens");
});

test("DeleteSectionDialog — path body has data-detail='path' marker", () => {
  renderDialog({});
  const pathEl = document.body.querySelector('[data-detail="path"]');
  assert.ok(pathEl, "data-detail='path' marker present");
  assert.match(pathEl?.textContent ?? "", /foundations\/src\/tokens\.md/);
});

test("DeleteSectionDialog — loading=true: shows placeholder and Delete is disabled", () => {
  renderDialog({ loading: true, refCount: 0, sampleRefs: [] });
  const text = document.body.textContent ?? "";
  assert.match(text, /checking references/i);
  const btn = deleteButton();
  assert.equal(btn.disabled, true);
});

test("DeleteSectionDialog — ack checkbox state resets on close", () => {
  const { rerender } = render(
    <Theme>
      <DeleteSectionDialog
        open
        slug="tokens"
        title="Tokens"
        domain="foundations"
        refCount={2}
        sampleRefs={["a.md"]}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    </Theme>,
  );
  const ack = document.body.querySelector(
    'button[role="checkbox"]',
  ) as HTMLButtonElement;
  fireEvent.click(ack);
  assert.equal(ack.getAttribute("aria-checked"), "true");

  // Close
  rerender(
    <Theme>
      <DeleteSectionDialog
        open={false}
        slug="tokens"
        title="Tokens"
        domain="foundations"
        refCount={2}
        sampleRefs={["a.md"]}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    </Theme>,
  );
  // Re-open
  rerender(
    <Theme>
      <DeleteSectionDialog
        open
        slug="tokens"
        title="Tokens"
        domain="foundations"
        refCount={2}
        sampleRefs={["a.md"]}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    </Theme>,
  );
  const ack2 = document.body.querySelector(
    'button[role="checkbox"]',
  ) as HTMLButtonElement;
  assert.equal(ack2.getAttribute("aria-checked"), "false");
});
