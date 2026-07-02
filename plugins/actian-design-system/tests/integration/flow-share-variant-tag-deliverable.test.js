const { test } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const SIDE = path.resolve(
  __dirname,
  "..",
  "..",
  "vendor",
  "components",
  "dist",
  "token-bindings",
  "tag-default.json",
);
const assemble = require("../../scripts/renderers/assemble-flow-share.js");

// Pull the real background-color token from the vendored sidecar whose
// binding is scoped to variant.prop === "Color" and whose variant.values
// includes colorValue (e.g. "Pink", "Default"). Fails loudly (rather than
// silently returning the first match) unless there is EXACTLY ONE such
// candidate — a zero or multi-match sidecar would let this test pass while
// a composite-key collision quietly rendered the wrong token.
function scopedBgToken(colorValue) {
  const doc = JSON.parse(fs.readFileSync(SIDE, "utf8"));
  const candidates = [];
  for (const nid of Object.keys(doc.byNodeId)) {
    for (const b of doc.byNodeId[nid]) {
      if (
        b.property === "background-color" &&
        b.variant &&
        b.variant.prop === "Color" &&
        Array.isArray(b.variant.values) &&
        b.variant.values.indexOf(colorValue) !== -1
      ) {
        candidates.push(b.token);
      }
    }
  }
  assert.strictEqual(
    candidates.length,
    1,
    "expected exactly one Color=" +
      colorValue +
      "-scoped background-color binding in " +
      "tag-default.json, found " +
      candidates.length +
      " (" +
      JSON.stringify(candidates) +
      ")",
  );
  return candidates[0];
}

test("flow-share deliverable: Color=Pink and Color=Default tags render distinct harvested tokens", () => {
  const pink = scopedBgToken("Pink");
  const def = scopedBgToken("Default");
  assert.ok(
    pink,
    "sidecar has a Pink-scoped background-color binding (fixture precondition)",
  );
  assert.ok(
    def,
    "sidecar has a Default-scoped background-color binding (fixture precondition)",
  );
  assert.notStrictEqual(
    pink,
    def,
    "Pink and Default must resolve to DISTINCT tokens, or this test cannot detect a composite-key collision",
  );

  const flow = {
    meta: { library: "ds" },
    screens: [
      {
        name: "S1",
        content: [
          {
            type: "INSTANCE",
            library: "ds",
            dsSlug: "tag-default",
            variant: "Color=Pink",
            props: { Label: "Pink" },
          },
          {
            type: "INSTANCE",
            library: "ds",
            dsSlug: "tag-default",
            variant: "Color=Default",
            props: { Label: "Default" },
          },
        ],
      },
    ],
  };

  // assemble-flow-share.js exports { assembleFlowShare(data) } -> full HTML string.
  const html = assemble.assembleFlowShare(flow);

  assert.ok(
    html.includes("background-color:var(" + pink + ")"),
    "the Pink tag emitted its harvested Pink background token",
  );
  assert.ok(
    html.includes("background-color:var(" + def + ")"),
    "the Default tag emitted its harvested Default background token (a composite-key " +
      "collision between the two nodes would drop one of the two distinct tokens)",
  );
});
