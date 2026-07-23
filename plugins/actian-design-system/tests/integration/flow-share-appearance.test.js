"use strict";

// flow-share-appearance.test.js — DELIVERABLE-level proof that Phase 1B's
// captured-appearance renderer is actually WIRED into the canonical
// generate-flow deliverable (assembleFlowShare, server-side Node render).
//
// The specimen is a non-override, non-BUILT_SLUGS slug, so it falls to the
// default: case in ds-html-map.js — which (as of Task 6) must build the
// anatomy DOC map (buildDsAnatomyDocMap) and inject it via
// setAnatomyDocMap() BEFORE the render loop, so renderAppearanceComponent
// picks the doc's real vendored background instead of degrading straight to a
// graceful chip (data-slug).
//
// The specimen and its expected colour are both resolved at run time from the
// substrate. This test used to hardcode tag-status / #f0ffec; knowledge #472
// gave tag-status a bespoke ds-html-map leaf, which correctly shadows the
// appearance path and left the assertion pointed at a slug that no longer
// exercises it. Deriving both keeps the test about the WIRING, and matches the
// standing rule to assert data-derived invariants over frozen snapshots.
//
// Current contract (post-Group-C): the default: case has exactly two
// outcomes — an appearance doc renders via renderAppearanceComponent, or (no
// doc, or it rendered empty) a direct gracefulChip(). There is no
// anatomy-render.js / legacy slug-to-html anatomy-map fallback in between;
// that two-hop path was retired in Group C. `data-ds-slug` is present on the
// appearance output too, so the unique marker is the `class="ds-appearance"`
// wrapper, which only renderAppearanceComponent emits.
//
// The colour check is SCOPED to inside that wrapper. Page-wide it would be
// worthless: the hardcoded specimen used to be tag-status, whose #f0ffec was
// rare enough that a page-wide search meant something, but a run-time
// specimen can legitimately resolve to a common colour (today it is
// bar-graph at #ffffff, which appears 19 times in the assembled page's
// inlined CSS and survives even a totally broken renderer). Anchoring on the
// wrapper and asserting the emitted `background:` declaration keeps the
// assertion about THIS component's render for any specimen.
//
// Repo style: node:test + node:assert (see flow-share-anatomy.test.js,
// flow-share-a1-overrides.test.js).

var { describe, it } = require("node:test");
var assert = require("node:assert");
var {
  assembleFlowShare,
} = require("../../scripts/renderers/assemble-flow-share.js");
var ds = require("../../scripts/lib/renderer.js").dsHtmlMap;
var { pickSpecimen } = require("../helpers/appearance-specimen.js");

// A slug still served by the appearance path whose ROOT carries a resolved
// background — the root is what the default-variant render is guaranteed to
// emit, so that hex is a sound oracle for "this came from the appearance doc".
var SPECIMEN = pickSpecimen(ds.BUILT_SLUGS, function (slug, doc) {
  var bg =
    doc && doc.root && doc.root.appearance && doc.root.appearance.background;
  return typeof bg === "string" && /^#[0-9a-fA-F]{3,8}$/.test(bg);
});
var SLUG = SPECIMEN.slug;
var EXPECTED_BG = SPECIMEN.doc.root.appearance.background;
var VARIANT = (SPECIMEN.doc.root && SPECIMEN.doc.root.name) || "";

// Minimal flow doc: one screen, one DS instance of the chosen specimen.
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
            dsSlug: SLUG,
            variant: VARIANT,
            props: {},
          },
        ],
      },
    ],
  };
}

describe("flow-share: appearance-doc rendering (Phase 1B, Task 6)", function () {
  it("renders the specimen from real vendored appearance, not a graceful chip", function () {
    var html = assembleFlowShare(fixture());
    // Root background from the specimen's own vendored appearance doc, checked
    // INSIDE the appearance wrapper (see header: page-wide is meaningless).
    var wrapperIdx = html.indexOf('class="ds-appearance');
    assert.ok(
      wrapperIdx !== -1,
      "assembled HTML must contain an appearance wrapper for " + SLUG,
    );
    var wrapperRegion = html.slice(wrapperIdx, wrapperIdx + 1000);
    assert.ok(
      wrapperRegion.indexOf("background:" + EXPECTED_BG) !== -1,
      "the appearance wrapper must emit " +
        SLUG +
        "'s real vendored root background " +
        EXPECTED_BG +
        " (appearance rendering emits resolved values, never var(--...))",
    );
    assert.strictEqual(
      html.indexOf('data-slug="' + SLUG + '"'),
      -1,
      SLUG + " must NOT fall back to a graceful chip",
    );
    // data-ds-slug alone isn't the unique marker (see the file header): it's
    // kept here as a sanity check that the seam emitted something DS-shaped,
    // not proof this is the appearance path specifically.
    assert.ok(
      html.indexOf('data-ds-slug="' + SLUG + '"') !== -1,
      "appearance renderer marker (data-ds-slug) must be present",
    );
    // The TRUE unique marker: only renderAppearanceComponent emits the
    // `.ds-appearance` wrapper class — a chip-degraded output never does (and
    // there is no anatomy-render.js fallback left that could also emit it).
    assert.match(
      html,
      /class="ds-appearance/,
      "assembled HTML must carry the ds-appearance wrapper class (the true appearance-renderer marker)",
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
      dsSlug: SLUG,
      variant: VARIANT,
      props: {},
    });
    if (prev !== undefined) global.window = prev;
    assert.ok(
      html.indexOf("ds-component") !== -1,
      "slug must chip after assembly (server doc map was reset)",
    );
  });
});
