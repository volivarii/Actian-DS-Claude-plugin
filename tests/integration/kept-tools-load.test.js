"use strict";
// Every script the cards and the kept renderers run loads on its own: none of
// them requires a file that the default route took with it when it was removed.
const { it } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const S = path.resolve(__dirname, "../../plugins/actian-design-system/scripts");
const KEEP = [
  "renderers/assemble-direct.js", "renderers/direct-shell.js", "renderers/assemble-shared.js", "renderers/look-direct.js",
  "renderers/figma-screen.js", "renderers/assemble-intent.js", "renderers/assemble-preview.js", "renderers/assemble-proposal.js",
  "renderers/html-renderers/ds-screen-tree.js", "renderers/html-renderers/render-node-figma.js", "renderers/html-renderers/validate-node.js",
  "renderers/html-renderers/ds-set-props.js", "renderers/html-renderers/flow-renderer.js", "renderers/html-renderers/render-node.js",
  "validation/check-direct.js", "validation/check-handover.js", "validation/validate-proposal.js", "validation/validate-schema.js",
  "validation/component-property-rules.js", "lib/paths.js", "lib/renderer.js", "lib/app-record.js", "lib/terminology-check.js",
  "lib/shared-constants.js", "lib/bump-version.js", "lib/ds-components.js", "lib/app-context/prepare-flow.js",
  "lib/app-context/direct-brief.js", "lib/a11y/resolve-a11y.js", "fidelity/render-leaf.js", "fidelity/resolve-binaries.js",
  "vendor/vendor-snapshot.js",
];
for (const f of KEEP) it("loads " + f, () => assert.doesNotThrow(() => require(path.join(S, f))));
