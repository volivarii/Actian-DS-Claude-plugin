const { test } = require("node:test");
const assert = require("node:assert");
const { anatomyVariantKey, isDelegated } = require("../../scripts/renderers/html-renderers/anatomy-variant-key.js");

test("anatomyVariantKey: sorts props deterministically", () => {
  assert.strictEqual(anatomyVariantKey("tag-default", { Color: "Pink" }), "tag-default|Color=Pink");
  assert.strictEqual(
    anatomyVariantKey("x", { B: "2", A: "1" }),
    anatomyVariantKey("x", { A: "1", B: "2" })
  );
  assert.strictEqual(anatomyVariantKey("x", { A: "1", B: "2" }), "x|A=1,B=2");
});

test("anatomyVariantKey: empty/absent variant returns the bare slug", () => {
  assert.strictEqual(anatomyVariantKey("tag-default", {}), "tag-default");
  assert.strictEqual(anatomyVariantKey("tag-default", null), "tag-default");
});

test("isDelegated: only tag-* is delegated in slice 1", () => {
  assert.strictEqual(isDelegated("tag-default"), true);
  assert.strictEqual(isDelegated("tag-status"), true);
  assert.strictEqual(isDelegated("button"), false);
  assert.strictEqual(isDelegated(null), false);
});
