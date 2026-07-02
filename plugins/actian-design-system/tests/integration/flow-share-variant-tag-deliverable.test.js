const { test } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const SIDE = path.resolve(
  __dirname, "..", "..", "vendor", "components", "dist", "token-bindings", "tag-default.json"
);
const assemble = require("../../scripts/renderers/assemble-flow-share.js");

// Pull the real Pink-scoped background token from the vendored sidecar.
function pinkBgToken() {
  const doc = JSON.parse(fs.readFileSync(SIDE, "utf8"));
  for (const nid of Object.keys(doc.byNodeId)) {
    for (const b of doc.byNodeId[nid]) {
      if (b.property === "background-color" && b.variant && b.variant.prop === "Color" &&
          Array.isArray(b.variant.values) && b.variant.values.indexOf("Pink") !== -1) {
        return b.token;
      }
    }
  }
  return null;
}

test("flow-share deliverable: a Color=Pink tag renders its harvested Pink token", () => {
  const token = pinkBgToken();
  assert.ok(token, "sidecar has a Pink-scoped background-color binding (fixture precondition)");

  const flow = {
    meta: { library: "ds" },
    screens: [
      { name: "S1", content: [
        { type: "INSTANCE", library: "ds", dsSlug: "tag-default", variant: "Color=Pink", props: { Label: "Pink" } },
        { type: "INSTANCE", library: "ds", dsSlug: "tag-default", variant: "Color=Default", props: { Label: "Default" } },
      ] },
    ],
  };

  // assemble-flow-share.js exports { assembleFlowShare(data) } -> full HTML string.
  const html = assemble.assembleFlowShare(flow);

  assert.ok(html.includes("background-color:var(" + token + ")"),
    "the Pink tag emitted its harvested Pink background token");
});
