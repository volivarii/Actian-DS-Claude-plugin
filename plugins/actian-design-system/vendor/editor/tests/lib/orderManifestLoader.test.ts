import { test } from "node:test";
import assert from "node:assert/strict";
import { loadOrderManifest } from "../../src/lib/orderManifestLoader";

function fakeOctokit(payload: {
  status: number;
  content?: string;
  sha?: string;
}) {
  return {
    repos: {
      async getContent() {
        if (payload.status === 404) {
          const err = new Error("not found") as Error & { status: number };
          err.status = 404;
          throw err;
        }
        return {
          data: {
            content: Buffer.from(payload.content ?? "[]", "utf-8").toString(
              "base64",
            ),
            encoding: "base64",
            sha: payload.sha ?? "abc123",
          },
        };
      },
    },
  } as unknown as Parameters<typeof loadOrderManifest>[0];
}

test("loadOrderManifest returns parsed array + sha", async () => {
  const oct = fakeOctokit({
    status: 200,
    content: '["intro", "tokens", "design-guidelines"]',
    sha: "deadbeef",
  });
  const result = await loadOrderManifest(oct, "foundations/src");
  assert.deepEqual(result?.order, ["intro", "tokens", "design-guidelines"]);
  assert.equal(result?.sha, "deadbeef");
});

test("loadOrderManifest returns null on 404", async () => {
  const oct = fakeOctokit({ status: 404 });
  const result = await loadOrderManifest(oct, "content/src/patterns");
  assert.equal(result, null);
});

test("loadOrderManifest throws on non-array JSON", async () => {
  const oct = fakeOctokit({ status: 200, content: '{"foo": 1}' });
  await assert.rejects(
    () => loadOrderManifest(oct, "foundations/src"),
    /not an array/i,
  );
});

test("loadOrderManifest throws when array contains non-strings", async () => {
  const oct = fakeOctokit({ status: 200, content: '["a", 1, "b"]' });
  await assert.rejects(
    () => loadOrderManifest(oct, "foundations/src"),
    /not an array of strings/i,
  );
});
