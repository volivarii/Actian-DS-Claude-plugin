import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import React from "react";
import { AddSectionDialog } from "../../src/app/AddSectionDialog";

afterEach(cleanup);

function renderDialog(
  overrides: Partial<Parameters<typeof AddSectionDialog>[0]> = {},
) {
  const defaults: Parameters<typeof AddSectionDialog>[0] = {
    open: true,
    domain: "foundations",
    pathPrefix: "foundations/src",
    existingSlugs: [],
    onConfirm: () => {},
    onCancel: () => {},
  };
  return render(
    <Theme>
      <AddSectionDialog {...defaults} {...overrides} />
    </Theme>,
  );
}

test("AddSectionDialog — typing a title derives the slug", () => {
  const r = renderDialog();
  const title = r.getByLabelText(/title/i) as HTMLInputElement;
  fireEvent.change(title, { target: { value: "Layout Primitives" } });
  const slug = r.getByLabelText(/filename/i) as HTMLInputElement;
  assert.equal(slug.value, "layout-primitives");
});

test("AddSectionDialog — editing slug stops auto-derivation", () => {
  const r = renderDialog();
  const title = r.getByLabelText(/title/i) as HTMLInputElement;
  const slug = r.getByLabelText(/filename/i) as HTMLInputElement;
  fireEvent.change(title, { target: { value: "Layout" } });
  fireEvent.change(slug, { target: { value: "layout-custom" } });
  fireEvent.change(title, { target: { value: "Layout Primitives" } });
  assert.equal(slug.value, "layout-custom");
});

test("AddSectionDialog — Add button disabled when slug fails validation", () => {
  const r = renderDialog();
  const slug = r.getByLabelText(/filename/i) as HTMLInputElement;
  fireEvent.change(slug, { target: { value: "BAD slug!" } });
  const btn = r.getByRole("button", { name: /^add$/i }) as HTMLButtonElement;
  assert.equal(btn.disabled, true);
});

test("AddSectionDialog — Add button disabled when slug collides", () => {
  const r = renderDialog({ existingSlugs: ["intro", "tokens"] });
  const title = r.getByLabelText(/title/i) as HTMLInputElement;
  fireEvent.change(title, { target: { value: "Tokens" } });
  const btn = r.getByRole("button", { name: /^add$/i }) as HTMLButtonElement;
  assert.equal(btn.disabled, true);
});

test("AddSectionDialog — confirm fires with { title, slug }", () => {
  let captured: { title: string; slug: string } | null = null;
  const r = renderDialog({
    onConfirm: (v) => {
      captured = v;
    },
  });
  fireEvent.change(r.getByLabelText(/title/i), {
    target: { value: "Layout Primitives" },
  });
  fireEvent.click(r.getByRole("button", { name: /^add$/i }));
  assert.deepEqual(captured, {
    title: "Layout Primitives",
    slug: "layout-primitives",
  });
});

test("AddSectionDialog — path hint has data-detail='path' for doctrine escape", () => {
  // Dialog.Content renders in a Radix portal (appended to document.body),
  // so r.container won't find it — query document.body directly.
  const r = renderDialog();
  fireEvent.change(r.getByLabelText(/title/i), {
    target: { value: "Layout" },
  });
  const hint = document.body.querySelector('[data-detail="path"]');
  assert.ok(hint, "data-detail='path' marker present");
  assert.match(hint?.textContent ?? "", /foundations\/src\/layout\.md/);
});
