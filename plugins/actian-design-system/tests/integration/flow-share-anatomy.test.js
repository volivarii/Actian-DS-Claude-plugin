"use strict";

// flow-share-anatomy.test.js — End-to-end proof that the CANONICAL flow-share
// deliverable renders non-override DS slugs as appearance HTML (not a gray
// chip). This exercises both fixes together:
//   C2 — the doc map is collected from content-shaped flow-data (screens[].content)
//   C1 — the doc map is consumed server-side (flow-share pre-renders in Node,
//        where there is no window) via ds-html-map.setAnatomyDocMap().
// (Group C retired the legacy slug→html anatomy map and its setAnatomyMap
// setter; the default: seam now dispatches to the Phase 1B appearance-doc
// render.)
// Markers: both the retired anatomy path and the appearance path emit
// data-ds-slug="<slug>"; the chip emits data-slug="<slug>". We assert on
// those (NOT a bare "ds-anatomy"/"ds-appearance" substring, which also
// appears in the inlined ds-base.css and would mask a chip regression).

var { describe, it } = require("node:test");
var assert = require("node:assert");

var {
  assembleFlowShare,
} = require("../../scripts/renderers/assemble-flow-share.js");
var { collectDsSlugs, buildDsAnatomyDocMap } =
  require("../../scripts/lib/renderer.js").dsAnatomyMap;
var ds = require("../../scripts/lib/renderer.js").dsHtmlMap;
var { pickSpecimen } = require("../helpers/appearance-specimen.js");

// A non-override DS slug with usable vendored anatomy (quality.ratio >= 0.6).
// Picked at run time, not hardcoded: the slug is only a specimen for the
// appearance-doc wiring, and gray-box-to-zero keeps converting specimens into
// BUILT slugs (this test used to name "link", which knowledge #465 built).
// See tests/helpers/appearance-specimen.js.
var SPECIMEN = pickSpecimen(ds.BUILT_SLUGS, function (slug) {
  return Boolean(buildDsAnatomyDocMap([slug])[slug]);
});
var ANATOMY_SLUG = SPECIMEN.slug;

function fixture() {
  return {
    meta: { library: "ds", app: "Test App", feature: "Anatomy wiring" },
    screens: [
      {
        name: "Screen 1",
        library: "ds",
        content: [
          { type: "INSTANCE", library: "ds", dsSlug: ANATOMY_SLUG, props: {} },
        ],
      },
    ],
  };
}

describe("flow-share: server-side appearance-doc rendering (C1 + C2)", function () {
  it("precondition: chosen slug is non-override and has a usable appearance doc", function () {
    var slugs = collectDsSlugs(fixture());
    assert.ok(
      slugs.indexOf(ANATOMY_SLUG) !== -1,
      "collectDsSlugs must find the content-shaped slug",
    );
    var map = buildDsAnatomyDocMap(slugs);
    assert.ok(
      map[ANATOMY_SLUG],
      "substrate must yield an appearance doc for '" +
        ANATOMY_SLUG +
        "' — if this fails the slug became an override or lost anatomy; pick another non-override slug",
    );
  });

  it("renders the non-override slug as appearance HTML, not a chip", function () {
    var html = assembleFlowShare(fixture());
    assert.ok(
      html.indexOf('data-ds-slug="' + ANATOMY_SLUG + '"') !== -1,
      "appearance HTML (data-ds-slug) must be present in flow-share output",
    );
    assert.strictEqual(
      html.indexOf('data-slug="' + ANATOMY_SLUG + '"'),
      -1,
      "the slug must NOT fall back to a chip (data-slug)",
    );
  });

  it("does not leak the server appearance doc map after assembly", function () {
    // After assembleFlowShare returns, a server-side render of the same slug with
    // no window must chip — proving setAnatomyDocMap was reset (no cross-call
    // state).
    assembleFlowShare(fixture());
    var prev = typeof global.window !== "undefined" ? global.window : undefined;
    delete global.window;
    var html = ds.renderDSComponent({
      type: "INSTANCE",
      library: "ds",
      dsSlug: ANATOMY_SLUG,
      props: {},
    });
    if (prev !== undefined) global.window = prev;
    assert.ok(
      html.indexOf("ds-component") !== -1,
      "slug must chip after assembly (server doc map was reset)",
    );
  });
});
