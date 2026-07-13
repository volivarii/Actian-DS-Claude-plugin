#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var { measureBlankBoxes } = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "ds-coverage-report.js",
  ),
);

// The number of empty grey placeholder boxes the DS HTML renderer emits across
// the whole authorable vocabulary. This is a CEILING, and it RATCHETS DOWN:
//
//   2026-07-13  136  baseline (knowledge v0.34.96, 25 of 37 non-override slugs)
//
// Lower it as each lane lands. NEVER raise it without saying, in the commit
// message, which slugs regressed and why.
var BUDGET = 136;

// The number of authorable slugs that render a bare graceful-degradation chip
// (ds-html-map.js's gracefulChip(), a `<span class="ds-component" ...>` with
// no real anatomy). This is a SEPARATE ceiling from BUDGET, and it exists to
// close a loophole: if the anatomy doc map partially collapses, slugs that
// used to render real markup (and blank boxes) demote to chips instead. That
// makes BUDGET look like it improved while the actual output got worse. This
// ceiling also RATCHETS DOWN, never up, as slugs get real anatomy authored.
//
//   2026-07-13  4  baseline (glossary-item-hierarchy-diagram, lineage-connecting-line,
//                  notification-dropdown, scroll-bar)
var CHIP_BUDGET = 4;

// measureBlankBoxes() re-parses the authoring markdown, rebuilds the doc map
// over ~72 slugs, and re-renders 37 components: expensive to repeat, and
// every assertion below wants the identical measurement anyway. Compute once
// and share it instead of calling it fresh from each `it` block.
var cached = null;
function renderAll() {
  if (!cached) cached = measureBlankBoxes();
  return cached;
}

describe("blank-box budget", function () {
  it("POSITIVE CONTROL: the anatomy doc map is actually live", function () {
    // Without this, a broken/unset doc map chips every slug, emits zero blank
    // boxes, and the budget below passes while measuring NOTHING. Assert the
    // anatomy marker attribute (data-ds-slug=) is present in real output.
    var r = renderAll();
    assert.ok(
      r.anyAnatomy,
      "no slug rendered anatomy markup, so the doc map is not live and the " +
        "blank-box budget would pass vacuously",
    );
  });

  it("the authorable vocabulary is non-empty (guards a silent parse break)", function () {
    var r = renderAll();
    assert.ok(
      r.slugs.length > 50,
      "expected the ds-components-authoring.md table to parse to >50 slugs, got " +
        r.slugs.length,
    );
  });

  it("emits no more blank grey boxes than the budget", function () {
    var r = renderAll();
    var worst = Object.keys(r.perSlug)
      .filter(function (s) {
        return r.perSlug[s] > 0;
      })
      .sort(function (a, b) {
        return r.perSlug[b] - r.perSlug[a];
      })
      .slice(0, 8)
      .map(function (s) {
        return s + ":" + r.perSlug[s];
      })
      .join(", ");
    assert.ok(
      r.total <= BUDGET,
      "blank-box count regressed to " +
        r.total +
        " (budget " +
        BUDGET +
        "). " +
        "Worst offenders: " +
        worst,
    );
  });

  it("SANITY: the blank-box detector is not silently reading zero", function () {
    // We know today's total is 136, not 0. If countBlankBoxes ever drifts out
    // of sync with the markup shape it's matching against, it can silently
    // return 0 for everything, and the budget assertion above passes
    // vacuously (0 <= BUDGET is always true). This control forces a failure
    // in that case instead of a false green.
    //
    // Self-retiring: when the blank-box count legitimately reaches 0, the
    // fidelity job is done. At that point delete this control AND the
    // BUDGET assertion above deliberately, rather than letting either rot.
    var r = renderAll();
    assert.ok(
      r.total > 0,
      "expected a positive blank-box count (today's baseline is 136), got 0. " +
        "This likely means countBlankBoxes stopped matching the emitted markup " +
        "shape and is silently reading zero, not that the renderer got fixed.",
    );
  });

  it("emits no more bare graceful-degradation chips than the chip budget", function () {
    var r = renderAll();
    assert.ok(
      r.chipSlugs.length <= CHIP_BUDGET,
      "bare-chip count regressed to " +
        r.chipSlugs.length +
        " (budget " +
        CHIP_BUDGET +
        "). A bare chip means the slug renders nothing real, so a lower " +
        "blank-box total from this slug is a demotion, not an improvement. " +
        "Chip slugs: " +
        r.chipSlugs.join(", "),
    );
  });
});
