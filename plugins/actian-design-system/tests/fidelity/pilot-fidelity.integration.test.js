"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("node:fs");
var path = require("node:path");
var R = require("../../scripts/fidelity/resolve-binaries");
var RF = require("../../scripts/fidelity/run-fidelity");
var PATHS = require("../../scripts/lib/paths");

var chrome = R.resolveChrome();
var PILOT = ["button", "checkbox-with-label", "alert-banner"];
var haveOracles = PILOT.every(function (s) {
  return fs.existsSync(PATHS.components.mediaDefault(s));
});

// Honest Gate-1 lock (SP1, calibrated 2026-06-14). The gate now CONSUMES the
// single-component default.webp oracles and produces real comparisons. We do
// NOT assert the trio passes pixel-diff: calibration showed the hand-authored
// ds-html-map leaves diverge from the Figma defaults (button brand-blue is
// darker than Figma; checkbox square is proportionally taller; alert-banner is
// a hug-width card vs Figma's full-width banner with action + close). Those are
// real fidelity gaps the gate is correctly surfacing — tracked as the
// leaf-regeneration follow-on, NOT papered over with threshold/aspect hacks.
//
// What this locks is the substrate win this slice delivered:
//   (1) every pilot row references the single-component default.webp oracle
//       (not the legacy multi-variant preview.webp board), and
//   (2) at least one structurally-matching component (button) yields a NON-NULL
//       Gate-1 verdict — proving the render -> rasterize -> diff pipeline runs
//       end-to-end against a real single-component oracle instead of skipping.
test(
  "pilot trio consumes the default.webp oracles and Gate-1 produces a real comparison",
  {
    skip: !chrome
      ? "Chrome not resolvable"
      : !haveOracles
        ? "default.webp oracles not vendored"
        : false,
  },
  function () {
    var rows = RF.run(PILOT, { write: false });
    var bySlug = {};
    rows.forEach(function (r) {
      bySlug[r.slug] = r;
    });

    PILOT.forEach(function (slug) {
      var r = bySlug[slug];
      assert.ok(r, slug + " produced a ledger row");
      assert.equal(
        path.basename(r.reference.media[0]),
        "default.webp",
        slug + " must reference the default.webp oracle",
      );
    });

    // button structurally matches its oracle (leading + trailing icon, label),
    // so the pipeline produces a real (non-null) Gate-1 verdict rather than an
    // aspect-mismatch skip. This proves the oracle is consumed end-to-end.
    assert.notEqual(
      bySlug.button.pixel.pass,
      null,
      "button Gate-1 should be a real comparison, not a skip (ratio " +
        (bySlug.button.pixel && bySlug.button.pixel.ratio) +
        ")",
    );
  },
);
