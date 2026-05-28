import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import React from "react";
import { Sidebar } from "../../src/app/Sidebar";

afterEach(() => {
  cleanup();
  try {
    sessionStorage.clear();
  } catch {
    /* sessionStorage may not be present in all jsdom builds */
  }
});

function fakeGh(
  listings: Record<string, Array<{ name: string; type: "file" | "dir" }>>,
) {
  return {
    repos: {
      getContent: async ({ path }: { path: string }) => {
        if (!(path in listings)) {
          const err = new Error("not found") as Error & { status: number };
          err.status = 404;
          throw err;
        }
        return { data: listings[path] };
      },
    },
  } as any;
}

const LISTINGS = {
  "foundations/src": [
    { name: "color-primitives.md", type: "file" as const },
    { name: "AUTHORING.md", type: "file" as const },
  ],
  "accessibility/src": [
    { name: "principles.md", type: "file" as const },
    { name: "AUTHORING.md", type: "file" as const },
  ],
  "content/src/patterns": [
    { name: "forms.md", type: "file" as const },
    { name: "onboarding.md", type: "file" as const },
  ],
  "content/src/product": [
    { name: "lineage-specific-ui.md", type: "file" as const },
  ],
  "content/src/writing": [
    { name: "voice-and-tone.md", type: "file" as const },
    { name: "words-to-avoid.md", type: "file" as const },
  ],
  "components/src": [
    { name: "button", type: "dir" as const },
    { name: "checkbox", type: "dir" as const },
    { name: "categories", type: "dir" as const },
  ],
};

function wrap(node: React.ReactNode) {
  return <Theme>{node}</Theme>;
}

/** Click the header for `label` to flip its collapsed state. */
function toggleSection(label: string) {
  const header = screen.getByText(label).closest('[role="button"]')!;
  fireEvent.click(header);
}

test("Sidebar: renders Foundations + Accessibility entries (after expand)", async () => {
  render(
    wrap(
      <Sidebar
        octokit={fakeGh(LISTINGS)}
        pendingPaths={new Set()}
        activePath={null}
        onSelect={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Foundations"));
  toggleSection("Foundations");
  toggleSection("Accessibility");
  assert.ok(screen.getByText("color-primitives.md"));
  assert.ok(screen.getByText("principles.md"));
});

test("Sidebar: excludes AUTHORING.md", async () => {
  render(
    wrap(
      <Sidebar
        octokit={fakeGh(LISTINGS)}
        pendingPaths={new Set()}
        activePath={null}
        onSelect={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Foundations"));
  toggleSection("Foundations");
  assert.ok(screen.getByText("color-primitives.md"));
  assert.equal(screen.queryByText("AUTHORING.md"), null);
});

test("Sidebar: excludes categories (skip-dir)", async () => {
  render(
    wrap(
      <Sidebar
        octokit={fakeGh(LISTINGS)}
        pendingPaths={new Set()}
        activePath={null}
        onSelect={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Components"));
  toggleSection("Components");
  assert.ok(screen.getByText("button"));
  assert.equal(screen.queryByText("categories"), null);
});

test("Sidebar: click dispatches onSelect with full path", async () => {
  const calls: (string | null)[] = [];
  render(
    wrap(
      <Sidebar
        octokit={fakeGh(LISTINGS)}
        pendingPaths={new Set()}
        activePath={null}
        onSelect={(p) => calls.push(p)}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Foundations"));
  toggleSection("Foundations");
  fireEvent.click(screen.getByText("color-primitives.md"));
  assert.deepEqual(calls, ["foundations/src/color-primitives.md"]);
});

test("Sidebar: renders a Coverage entry at the top", async () => {
  render(
    wrap(
      <Sidebar
        octokit={fakeGh(LISTINGS)}
        pendingPaths={new Set()}
        activePath={null}
        onSelect={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Coverage"));
  assert.ok(screen.getByText("Coverage"));
});

test("Sidebar: clicking Coverage calls onSelect with null", async () => {
  const calls: (string | null)[] = [];
  render(
    wrap(
      <Sidebar
        octokit={fakeGh(LISTINGS)}
        pendingPaths={new Set()}
        activePath={"foundations/src/color-primitives.md"}
        onSelect={(p) => calls.push(p)}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Coverage"));
  fireEvent.click(screen.getByText("Coverage"));
  assert.deepEqual(calls, [null]);
});

test("Sidebar: renders Content — Patterns/Product/Writing entries (after expand)", async () => {
  render(
    wrap(
      <Sidebar
        octokit={fakeGh(LISTINGS)}
        pendingPaths={new Set()}
        activePath={null}
        onSelect={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Content — Patterns"));
  assert.ok(screen.getByText("Content — Patterns"));
  assert.ok(screen.getByText("Content — Product"));
  assert.ok(screen.getByText("Content — Writing"));
  toggleSection("Content — Patterns");
  toggleSection("Content — Product");
  toggleSection("Content — Writing");
  assert.ok(screen.getByText("forms.md"));
  assert.ok(screen.getByText("onboarding.md"));
  assert.ok(screen.getByText("lineage-specific-ui.md"));
  assert.ok(screen.getByText("voice-and-tone.md"));
  assert.ok(screen.getByText("words-to-avoid.md"));
});

test("Sidebar: clicking content/src entry dispatches full path", async () => {
  const calls: (string | null)[] = [];
  render(
    wrap(
      <Sidebar
        octokit={fakeGh(LISTINGS)}
        pendingPaths={new Set()}
        activePath={null}
        onSelect={(p) => calls.push(p)}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Content — Patterns"));
  toggleSection("Content — Patterns");
  fireEvent.click(screen.getByText("forms.md"));
  assert.deepEqual(calls, ["content/src/patterns/forms.md"]);
});

test("Sidebar: all sections collapsed by default", async () => {
  render(
    wrap(
      <Sidebar
        octokit={fakeGh(LISTINGS)}
        pendingPaths={new Set()}
        activePath={null}
        onSelect={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Foundations"));
  // No section items rendered initially
  assert.equal(screen.queryByText("color-primitives.md"), null);
  assert.equal(screen.queryByText("principles.md"), null);
  assert.equal(screen.queryByText("forms.md"), null);
  assert.equal(screen.queryByText("button"), null);
  // All section headers report aria-expanded=false
  for (const label of [
    "Foundations",
    "Accessibility",
    "Content — Patterns",
    "Content — Product",
    "Content — Writing",
    "Components",
  ]) {
    const header = screen.getByText(label).closest('[role="button"]')!;
    assert.equal(
      header.getAttribute("aria-expanded"),
      "false",
      `${label} should be collapsed by default`,
    );
  }
});

test("Sidebar: Foundations section toggles", async () => {
  render(
    wrap(
      <Sidebar
        octokit={fakeGh(LISTINGS)}
        pendingPaths={new Set()}
        activePath={null}
        onSelect={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Foundations"));
  const header = screen.getByText("Foundations").closest('[role="button"]')!;
  assert.equal(header.getAttribute("aria-expanded"), "false");
  fireEvent.click(header);
  assert.equal(header.getAttribute("aria-expanded"), "true");
  assert.ok(screen.getByText("color-primitives.md"));
  fireEvent.click(header);
  assert.equal(header.getAttribute("aria-expanded"), "false");
  assert.equal(screen.queryByText("color-primitives.md"), null);
});

test("Sidebar: Components section toggles and preserves Show all", async () => {
  // 25 components: forces the cap to engage when section is expanded.
  const many = Array.from({ length: 25 }, (_, i) => ({
    name: `comp-${String(i).padStart(2, "0")}`,
    type: "dir" as const,
  }));
  const listings = { ...LISTINGS, "components/src": many };
  render(
    wrap(
      <Sidebar
        octokit={fakeGh(listings)}
        pendingPaths={new Set()}
        activePath={null}
        onSelect={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Components"));
  const header = screen.getByText("Components").closest('[role="button"]')!;
  // Default collapsed: no items, no Show all
  assert.equal(header.getAttribute("aria-expanded"), "false");
  assert.equal(screen.queryByText("comp-00"), null);
  assert.equal(screen.queryByText("Show all (25)"), null);

  // Expand: cap engages (20 of 25 visible + Show all link)
  fireEvent.click(header);
  await waitFor(() => screen.getByText("comp-00"));
  assert.equal(header.getAttribute("aria-expanded"), "true");
  assert.ok(screen.getByText("comp-19"));
  assert.equal(screen.queryByText("comp-20"), null);
  assert.ok(screen.getByText("Show all (25)"));

  // Click "Show all" — un-caps within the expanded section
  fireEvent.click(screen.getByText("Show all (25)"));
  assert.ok(screen.getByText("comp-24"));

  // Collapse — hides everything including the now-uncapped list
  fireEvent.click(header);
  assert.equal(header.getAttribute("aria-expanded"), "false");
  assert.equal(screen.queryByText("comp-00"), null);
});

test("Sidebar: section collapse state persists via sessionStorage", async () => {
  const { unmount } = render(
    wrap(
      <Sidebar
        octokit={fakeGh(LISTINGS)}
        pendingPaths={new Set()}
        activePath={null}
        onSelect={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Foundations"));
  // Expand Foundations (default is collapsed)
  toggleSection("Foundations");
  unmount();
  // Remount — Foundations should remember the expanded state
  render(
    wrap(
      <Sidebar
        octokit={fakeGh(LISTINGS)}
        pendingPaths={new Set()}
        activePath={null}
        onSelect={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Foundations"));
  const header = screen.getByText("Foundations").closest('[role="button"]')!;
  assert.equal(header.getAttribute("aria-expanded"), "true");
  assert.ok(screen.getByText("color-primitives.md"));
});

test("Sidebar: hides empty content/src groups (e.g. 404 dirs)", async () => {
  // Drop patterns/product/writing listings — should cause 404 from fakeGh
  // and the corresponding headings should not render.
  const partial = {
    "foundations/src": LISTINGS["foundations/src"],
    "accessibility/src": LISTINGS["accessibility/src"],
    "components/src": LISTINGS["components/src"],
  };
  render(
    wrap(
      <Sidebar
        octokit={fakeGh(partial)}
        pendingPaths={new Set()}
        activePath={null}
        onSelect={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Foundations"));
  assert.equal(screen.queryByText("Content — Patterns"), null);
  assert.equal(screen.queryByText("Content — Product"), null);
  assert.equal(screen.queryByText("Content — Writing"), null);
});

test("Sidebar: shows draft-dot for paths in pendingPaths (when expanded)", async () => {
  const pending = new Set(["foundations/src/color-primitives.md"]);
  const { container } = render(
    wrap(
      <Sidebar
        octokit={fakeGh(LISTINGS)}
        pendingPaths={pending}
        activePath={null}
        onSelect={() => {}}
      />,
    ),
  );
  await waitFor(() => screen.getByText("Foundations"));
  toggleSection("Foundations");
  const dots = container.querySelectorAll(".draft-dot");
  assert.equal(dots.length, 1);
});
