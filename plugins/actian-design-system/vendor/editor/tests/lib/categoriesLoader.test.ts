import { test } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { loadCategories } from "../../src/lib/categoriesLoader";

function fakeGh(files: Array<{ name: string; type: "file" | "dir" }>) {
  return {
    repos: {
      getContent: async ({ path }: { path: string }) => {
        if (path === "components/src/categories") {
          return { data: files };
        }
        const err = new Error("not found") as Error & { status: number };
        err.status = 404;
        throw err;
      },
    },
  } as any;
}

test("loadCategories: returns sorted slugs from .md files", async () => {
  globalThis.sessionStorage.clear();
  const gh = fakeGh([
    { name: "navigation.md", type: "file" },
    { name: "action.md", type: "file" },
    { name: "feedback.md", type: "file" },
    { name: "data-display.md", type: "file" },
  ]);
  const slugs = await loadCategories(gh);
  assert.deepEqual(slugs, ["action", "data-display", "feedback", "navigation"]);
});

test("loadCategories: excludes AUTHORING.md", async () => {
  globalThis.sessionStorage.clear();
  const gh = fakeGh([
    { name: "AUTHORING.md", type: "file" },
    { name: "action.md", type: "file" },
  ]);
  const slugs = await loadCategories(gh);
  assert.deepEqual(slugs, ["action"]);
});

test("loadCategories: returns empty array when fetch fails", async () => {
  globalThis.sessionStorage.clear();
  const gh = {
    repos: {
      getContent: async () => {
        throw new Error("boom");
      },
    },
  } as any;
  const slugs = await loadCategories(gh);
  assert.deepEqual(slugs, []);
});

test("loadCategories: caches result across calls", async () => {
  globalThis.sessionStorage.clear();
  let callCount = 0;
  const gh = {
    repos: {
      getContent: async () => {
        callCount += 1;
        return { data: [{ name: "action.md", type: "file" }] };
      },
    },
  } as any;
  await loadCategories(gh);
  await loadCategories(gh);
  assert.equal(callCount, 1);
});
