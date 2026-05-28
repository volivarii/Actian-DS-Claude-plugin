import { test } from "node:test";
import assert from "node:assert/strict";
import { suggestRefs } from "../../src/substrate/ai";

test("suggestRefs: v1 stub returns 'deferred' status", async () => {
  const result = await suggestRefs("Body text about color contrast.", { domains: ["accessibility"] });
  assert.equal(result.status, "deferred");
});

test("suggestRefs: stub returns empty suggestions array", async () => {
  const result = await suggestRefs("Body text", { domains: ["accessibility", "motion"] });
  assert.deepEqual(result.suggestions, []);
});

test("suggestRefs: stub returns a human-readable message", async () => {
  const result = await suggestRefs("Body text", { domains: ["accessibility"] });
  assert.match(result.message, /deferred/i);
  assert.match(result.message, /Anthropic|budget|procurement/);
});

test("suggestRefs: interface signature is stable (forward-compatible)", async () => {
  const result = await suggestRefs("Body", { domains: ["accessibility"] });
  assert.ok("status" in result);
  assert.ok("suggestions" in result);
  assert.ok("message" in result);
});
