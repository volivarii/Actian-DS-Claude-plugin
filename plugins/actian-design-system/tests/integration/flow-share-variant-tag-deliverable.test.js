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

test("flow-share deliverable: tag-default keeps its instance label AND injects its distinct harvested variant token", () => {
  const pink = scopedBgToken("Pink");
  const def = scopedBgToken("Default");
  assert.ok(
    pink && def && pink !== def,
    "sidecar has distinct Pink/Default background tokens (precondition)",
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
            props: { Label: "Customer Orders" },
          },
          {
            type: "INSTANCE",
            library: "ds",
            dsSlug: "tag-default",
            variant: "Color=Default",
            props: { Label: "Draft Items" },
          },
        ],
      },
    ],
  };

  // assemble-flow-share.js exports { assembleFlowShare(data) } -> full HTML string.
  const html = assemble.assembleFlowShare(flow);

  assert.ok(
    html.includes("Customer Orders"),
    "Pink tag keeps its instance label",
  );
  assert.ok(
    html.includes("Draft Items"),
    "Default tag keeps its instance label",
  );
  assert.ok(
    html.includes('class="ds-tag"'),
    "renders the hand-authored ds-tag span, not anatomy divs",
  );
  assert.ok(
    html.includes("background-color:var(" + pink + ")"),
    "Pink tag injected its harvested token",
  );
  assert.ok(
    html.includes("background-color:var(" + def + ")"),
    "Default tag injected its distinct harvested token",
  );
});
