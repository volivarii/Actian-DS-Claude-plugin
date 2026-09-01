const { test } = require("node:test");
const assert = require("node:assert");
const {
  anatomyVariantKey,
  isDelegated,
} = require("../../scripts/lib/renderer.js").anatomyVariantKey;

test("anatomyVariantKey: sorts props deterministically", () => {
  assert.strictEqual(
    anatomyVariantKey("read-only-tag", { Type: "Shared" }),
    "read-only-tag|Type=Shared",
  );
  assert.strictEqual(
    anatomyVariantKey("x", { B: "2", A: "1" }),
    anatomyVariantKey("x", { A: "1", B: "2" }),
  );
  assert.strictEqual(anatomyVariantKey("x", { A: "1", B: "2" }), "x|A=1,B=2");
});

test("anatomyVariantKey: empty/absent variant returns the bare slug", () => {
  assert.strictEqual(anatomyVariantKey("read-only-tag", {}), "read-only-tag");
  assert.strictEqual(
    anatomyVariantKey("read-only-tag", null),
    "read-only-tag",
  );
});

test("isDelegated: only read-only-tag is delegated in slice 1", () => {
  assert.strictEqual(isDelegated("read-only-tag"), true);
  assert.strictEqual(isDelegated("tag-status"), false);
  assert.strictEqual(isDelegated("button"), false);
  assert.strictEqual(isDelegated(null), false);
});

test("isDelegated does NOT resolve a retired slug; its caller already did", () => {
  // read-only-tag answered to `tag-default` until the 2026-08-26 rename.
  // This predicate is deliberately a bare string compare: ds-anatomy-map
  // calls resolveSlug() on the authored slug BEFORE consulting it
  // (collectDsSlugVariants), so teaching it about retired names as well
  // would put the same fact in two places. Pinned so a future edit that
  // moves resolution out of the caller fails here rather than silently
  // dropping a renamed tag out of the variant-style map.
  assert.strictEqual(isDelegated("tag-default"), false);
});
