import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scanFileForAnchors,
  loadAnchorIndex,
  findDefinitions,
  findReferences,
  listSlugs,
  setCachedIndexForTesting,
} from "../../src/lib/anchorIndex";

test("scanFileForAnchors: heading anchor", () => {
  const text = `## ARIA labels {#aria-labels}\nSome prose.\n`;
  const result = scanFileForAnchors(text);
  assert.deepEqual(result.defines, ["aria-labels"]);
  assert.deepEqual(result.references, []);
});

test("scanFileForAnchors: bold-paragraph anchor (foundations pattern)", () => {
  const text = `**Drawer (open/close)** {#drawer-open-close}\nSome prose.\n`;
  const result = scanFileForAnchors(text);
  assert.deepEqual(result.defines, ["drawer-open-close"]);
});

test("scanFileForAnchors: inline-flow YAML ref", () => {
  const text = `- { ref: focus-keyboard, note: "ring on tab" }\n- { ref: aria-labels }\n`;
  const result = scanFileForAnchors(text);
  assert.deepEqual(result.references, ["focus-keyboard", "aria-labels"]);
});

test("scanFileForAnchors: cross-file link with anchor", () => {
  const text = `See [the keyboard guidance](accessibility#focus-keyboard).\n`;
  const result = scanFileForAnchors(text);
  assert.deepEqual(result.references, ["focus-keyboard"]);
});

test("scanFileForAnchors: same-file link with anchor", () => {
  const text = `See [above](#aria-labels).\n`;
  const result = scanFileForAnchors(text);
  assert.deepEqual(result.references, ["aria-labels"]);
});

test("scanFileForAnchors: ignores anchors inside fenced code blocks", () => {
  const text = "```\n## Title {#fake-slug}\n```\n## Real Title {#real-slug}\n";
  const result = scanFileForAnchors(text);
  assert.deepEqual(result.defines, ["real-slug"]);
});

test("scanFileForAnchors: ignores anchors inside tilde-fenced code blocks", () => {
  const text = "~~~\n## Title {#fake-tilde}\n~~~\n## Real {#real-tilde}\n";
  const result = scanFileForAnchors(text);
  assert.deepEqual(result.defines, ["real-tilde"]);
});

test("scanFileForAnchors: ignores external URLs with fragments", () => {
  const text = "See [MDN](https://developer.mozilla.org/foo#bar) for more.\n";
  const result = scanFileForAnchors(text);
  assert.deepEqual(result.references, []);
});

test("scanFileForAnchors: <Media> JSX is NOT an anchor source", () => {
  const text = `<Media role="parts" layout="grid" />\n`;
  const result = scanFileForAnchors(text);
  assert.deepEqual(result.defines, []);
  assert.deepEqual(result.references, []);
});

test("scanFileForAnchors: rejects slugs starting with digit or capital", () => {
  const text = `## Bad {#9Bad-Slug}\n## Good {#good-slug}\n`;
  const result = scanFileForAnchors(text);
  assert.deepEqual(result.defines, ["good-slug"]);
});

function fakeGh(files: Record<string, string>) {
  return {
    repos: {
      getContent: async ({ path }: { path: string }) => {
        // Directory listing
        if (path === "foundations/src") {
          return {
            data: [{ name: "02-color-primitives.md", type: "file" }],
          };
        }
        if (path === "accessibility/src") {
          return { data: [{ name: "01-principles.md", type: "file" }] };
        }
        if (path === "components/src") {
          return { data: [{ name: "button", type: "dir" }] };
        }
        if (
          path === "components/src/categories" ||
          path === "content/src/patterns" ||
          path === "content/src/product" ||
          path === "content/src/writing"
        ) {
          const err = new Error("404") as Error & { status: number };
          err.status = 404;
          throw err;
        }
        // File content
        if (files[path] !== undefined) {
          return {
            data: {
              type: "file",
              encoding: "base64",
              content: Buffer.from(files[path]!).toString("base64"),
            },
          };
        }
        const err = new Error("404") as Error & { status: number };
        err.status = 404;
        throw err;
      },
    },
  } as any;
}

test("loadAnchorIndex: builds index from remote", async () => {
  setCachedIndexForTesting(null);
  const gh = fakeGh({
    "foundations/src/02-color-primitives.md": "## Title {#alpha}\n",
    "accessibility/src/01-principles.md":
      "## Other {#beta}\n[link](foundations#alpha)\n",
    "components/src/button/content.md": "no anchors here",
    "components/src/button/usage.md": "",
    "components/src/button/design.md": "",
    "components/src/button/behavior.md": "",
    "components/src/button/tokens.md": "",
  });
  const index = await loadAnchorIndex(gh, { force: true });
  assert.deepEqual(listSlugs(), ["alpha", "beta"]);
  assert.deepEqual(findDefinitions("alpha"), [
    "foundations/src/02-color-primitives.md",
  ]);
  assert.deepEqual(findReferences("alpha"), [
    "accessibility/src/01-principles.md",
  ]);
  assert.equal(index.scannedPaths.length > 0, true);
});

test("loadAnchorIndex: returns cache on second call without force", async () => {
  setCachedIndexForTesting(null);
  const gh = fakeGh({
    "foundations/src/02-color-primitives.md": "## A {#one}\n",
  });
  const first = await loadAnchorIndex(gh);
  const second = await loadAnchorIndex(gh);
  assert.equal(first, second);
});

test("loadAnchorIndex: cartOverrides supersedes remote content", async () => {
  setCachedIndexForTesting(null);
  const gh = fakeGh({
    "foundations/src/02-color-primitives.md": "## A {#one}\n",
  });
  await loadAnchorIndex(gh, {
    force: true,
    cartOverrides: new Map([
      ["foundations/src/02-color-primitives.md", "## A {#one}\n## B {#two}\n"],
    ]),
  });
  assert.deepEqual(listSlugs().sort(), ["one", "two"]);
});

test("loadAnchorIndex: bad fetch for one file does not abort the index", async () => {
  setCachedIndexForTesting(null);
  // accessibility/src/01-principles.md is missing — fakeGh will 404 it.
  const gh = fakeGh({
    "foundations/src/02-color-primitives.md": "## A {#survives}\n",
  });
  const index = await loadAnchorIndex(gh, { force: true });
  assert.deepEqual(findDefinitions("survives"), [
    "foundations/src/02-color-primitives.md",
  ]);
  assert.equal(index.scannedPaths.length > 0, true);
});
