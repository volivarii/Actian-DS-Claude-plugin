"use strict";

// flow-share-appearance.test.js — DELIVERABLE-level proof that Phase 1B's
// captured-appearance renderer is actually WIRED into the canonical
// generate-flow deliverable (assembleFlowShare, server-side Node render).
//
// tag-status is a non-override, non-BUILT_SLUGS slug, so it falls to the
// default: case in ds-html-map.js — which (as of Task 6) must build the
// anatomy DOC map (buildDsAnatomyDocMap) and inject it via
// setAnatomyDocMap() BEFORE the render loop, so renderAppearanceComponent
// picks the Success variant's real vendored background (#f0ffec) instead of
// degrading to a graceful chip (data-slug) or the old anatomy-HTML fallback
// (which carries no per-instance variant color).
//
// Repo style: node:test + node:assert (see flow-share-anatomy.test.js,
// flow-share-a1-overrides.test.js).

var { describe, it } = require("node:test");
var assert = require("node:assert");
var {
  assembleFlowShare,
} = require("../../scripts/renderers/assemble-flow-share.js");
var ds = require("../../scripts/renderers/html-renderers/ds-html-map.js");

// Minimal flow doc: one screen, one DS tag-status instance at Status=Success.
function fixture() {
  return {
    meta: { title: "t" },
    screens: [
      {
        id: "s1",
        name: "S1",
        content: [
          {
            type: "INSTANCE",
            library: "ds",
            dsSlug: "tag-status",
            variant: "Status=Success",
            props: {},
          },
        ],
      },
    ],
  };
}

describe("flow-share: appearance-doc rendering (Phase 1B, Task 6)", function () {
  it("renders tag-status Status=Success from real vendored appearance, not a graceful chip", function () {
    var html = assembleFlowShare(fixture());
    // Success bg from the vendored tag-status appearance doc:
    assert.ok(
      /#f0ffec/i.test(html),
      "assembled HTML must carry the real vendored Success background #f0ffec",
    );
    assert.strictEqual(
      html.indexOf('data-slug="tag-status"'),
      -1,
      "tag-status must NOT fall back to a graceful chip",
    );
    // Positive marker for the appearance renderer itself (data-ds-slug, set by
    // renderAppearanceComponent) — distinguishes this from the legacy anatomy
    // HTML fallback, which also carries no such per-instance guarantee.
    assert.ok(
      html.indexOf('data-ds-slug="tag-status"') !== -1,
      "appearance renderer marker (data-ds-slug) must be present",
    );
  });

  it("does not leak the server anatomy doc map after assembly", function () {
    // After assembleFlowShare returns, a server-side render of the same slug
    // with no window must chip — proving setAnatomyDocMap was reset (no
    // cross-call state leak), mirroring flow-share-anatomy.test.js's leak check.
    assembleFlowShare(fixture());
    var prev = typeof global.window !== "undefined" ? global.window : undefined;
    delete global.window;
    var html = ds.renderDSComponent({
      type: "INSTANCE",
      library: "ds",
      dsSlug: "tag-status",
      variant: "Status=Success",
      props: {},
    });
    if (prev !== undefined) global.window = prev;
    assert.ok(
      html.indexOf("ds-component") !== -1,
      "slug must chip after assembly (server doc map was reset)",
    );
  });
});
