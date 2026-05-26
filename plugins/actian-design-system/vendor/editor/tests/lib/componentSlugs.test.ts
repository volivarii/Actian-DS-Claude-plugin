import { test } from "node:test";
import assert from "node:assert/strict";
import "../setup-dom";
import { loadComponentSlugs } from "../../src/lib/componentSlugs";

function b64(s: string): string {
  return Buffer.from(s, "utf-8").toString("base64");
}

function fakeGh(opts: {
  dirs: Array<{ name: string; type: "dir" | "file" }>;
  registry?: Record<string, { name: string; category?: string }>;
}) {
  return {
    repos: {
      getContent: async ({ path }: { path: string }) => {
        if (path === "components/src") {
          return { data: opts.dirs };
        }
        if (path === "components/dist/registries/dskit.json") {
          const body = JSON.stringify({ components: opts.registry ?? {} });
          return { data: { content: b64(body), encoding: "base64" } };
        }
        const err = new Error("not found") as Error & { status: number };
        err.status = 404;
        throw err;
      },
    },
  } as any;
}

test("loadComponentSlugs: union of authored dirs + registry-eligible slugs, sorted, deduped", async () => {
  globalThis.sessionStorage.clear();
  const gh = fakeGh({
    dirs: [
      { name: "button", type: "dir" },
      { name: "tabs", type: "dir" },
      { name: "categories", type: "dir" },
      { name: "guidelines", type: "dir" },
    ],
    registry: {
      button: { name: "Button", category: "Action" },
      "data-grid": { name: "Data grid", category: "Data Display" },
      "icon-arrow-up": { name: "Arrow", category: "Icons" }, // excluded
    },
  });
  const slugs = await loadComponentSlugs(gh);
  assert.deepEqual(slugs, ["button", "data-grid", "tabs"]);
});

test("loadComponentSlugs: returns empty when both sources fail", async () => {
  globalThis.sessionStorage.clear();
  const gh = {
    repos: {
      getContent: async () => {
        throw new Error("boom");
      },
    },
  } as any;
  const slugs = await loadComponentSlugs(gh);
  assert.deepEqual(slugs, []);
});

test("loadComponentSlugs: caches result across calls", async () => {
  globalThis.sessionStorage.clear();
  let dirCalls = 0;
  let registryCalls = 0;
  const gh = {
    repos: {
      getContent: async ({ path }: { path: string }) => {
        if (path === "components/src") {
          dirCalls += 1;
          return { data: [{ name: "button", type: "dir" }] };
        }
        if (path === "components/dist/registries/dskit.json") {
          registryCalls += 1;
          return {
            data: {
              content: b64(JSON.stringify({ components: {} })),
              encoding: "base64",
            },
          };
        }
        throw new Error("unexpected");
      },
    },
  } as any;
  await loadComponentSlugs(gh);
  await loadComponentSlugs(gh);
  assert.equal(dirCalls, 1);
  assert.equal(registryCalls, 1);
});
