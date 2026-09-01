#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var R = require(
  path.resolve(__dirname, "..", "..", "scripts", "renderers", "renderability.js"),
);
var { loadAnatomy } = require("../../scripts/lib/renderer.js").anatomyRender;
var fs = require("fs");

// Pick, at run time, a vendored doc that isRenderable rejects for a GIVEN
// reason. The rejections are ordered (no layout, then too few placeable
// nodes, then unresolved instances), so a hardcoded specimen silently starts
// testing an earlier rule the moment a sync changes its anatomy. That is what
// happened to notification-dropdown in the v0.34.157 sync: still rejected,
// but for "only 8/17 nodes placeable" rather than the unresolved-instances
// rule this test is about. Same reasoning as tests/helpers/appearance-
// specimen.js; the population is asserted non-empty so a substrate with no
// such doc left fails loudly instead of passing vacuously.
var ANATOMY_DIR = path.resolve(
  __dirname,
  "..",
  "..",
  "vendor",
  "components",
  "dist",
  "anatomy",
);
function pickRejectedFor(pattern) {
  var found = null;
  fs.readdirSync(ANATOMY_DIR)
    .filter(function (name) {
      return name.endsWith(".json");
    })
    .sort() // deterministic: same specimen on every run and every machine
    .forEach(function (name) {
      if (found) return;
      var slug = name.replace(/\.json$/, "");
      var verdict = R.isRenderable(loadAnatomy(slug));
      if (!verdict.ok && pattern.test(verdict.why)) {
        found = { slug: slug, why: verdict.why };
      }
    });
  return found;
}

describe("renderability.docStats", function () {
  it("returns a zeroed shape for a missing or malformed doc", function () {
    var s = R.docStats(null);
    assert.strictEqual(s.nodes, 0);
    assert.strictEqual(s.rootHasLayout, false);
    assert.strictEqual(s.instances, 0);
  });

  it("counts nodes, instances and unresolved instances on a real doc", function () {
    // notification-dropdown is the canonical case: every one of its instances
    // is unresolved, so it renders a styled container full of blank items.
    var doc = loadAnatomy("notification-dropdown");
    assert.ok(doc, "fixture: notification-dropdown anatomy must exist");
    var s = R.docStats(doc);
    assert.ok(s.nodes > 1, "should walk the whole tree");
    assert.ok(s.instances > 0, "notification-dropdown has instance nodes");
    assert.strictEqual(
      s.unresolved,
      s.instances,
      "every notification-dropdown instance is unresolved",
    );
  });

  it("does not count the root as a non-root node", function () {
    var doc = loadAnatomy("notification-dropdown");
    var s = R.docStats(doc);
    assert.strictEqual(s.nonRoot, s.nodes - 1);
  });
});

describe("renderability.isRenderable", function () {
  it("rejects a doc whose root carries no layout (no box model)", function () {
    // spinner scores 0.83 on the upstream ratio yet renders as five grey
    // boxes: its root has no layout at all.
    var doc = loadAnatomy("spinner");
    assert.ok(doc, "fixture: spinner anatomy must exist");
    var v = R.isRenderable(doc);
    assert.strictEqual(v.ok, false);
    assert.match(v.why, /root has no layout/);
  });

  it("rejects a doc whose instances are mostly unresolved", function () {
    var picked = pickRejectedFor(/instances unresolved/);
    assert.ok(
      picked,
      "no vendored anatomy doc reaches the unresolved-instances rejection " +
        "any more, so this rule has no specimen: retire or repoint the test " +
        "rather than letting it pass vacuously",
    );
    var v = R.isRenderable(loadAnatomy(picked.slug));
    assert.strictEqual(v.ok, false, picked.slug + " should be rejected");
    assert.match(v.why, /instances unresolved/);
  });

  it("admits a doc that carries real layout, paint and resolvable children", function () {
    var doc = loadAnatomy("collapse");
    assert.ok(doc, "fixture: collapse anatomy must exist");
    var v = R.isRenderable(doc);
    assert.strictEqual(v.ok, true, "collapse should be renderable");
    assert.strictEqual(v.why, "");
  });

  it("rejects a missing doc without throwing", function () {
    assert.strictEqual(R.isRenderable(null).ok, false);
    assert.strictEqual(R.isRenderable({}).ok, false);
  });

  it("does NOT simply mirror the upstream quality.ratio", function () {
    // The whole point: the ratio is a Figma auto-layout hygiene score, not a
    // renderability score. spinner proves they disagree.
    var doc = loadAnatomy("spinner");
    assert.ok(doc.quality.ratio >= 0.6, "spinner passes the old ratio gate");
    assert.strictEqual(
      R.isRenderable(doc).ok,
      false,
      "yet it is not renderable",
    );
  });
});

describe("renderability.countBlankBoxes", function () {
  it("counts empty placeholder divs", function () {
    var html =
      '<div class="ds-appearance"><div class="ds-appearance__instance"></div>' +
      '<div class="ds-appearance__vector" style="background:#eee" aria-hidden="true"></div>' +
      "</div>";
    assert.strictEqual(R.countBlankBoxes(html), 2);
  });

  it("does NOT count a placeholder that has content", function () {
    var html = '<div class="ds-appearance__instance">Notification</div>';
    assert.strictEqual(R.countBlankBoxes(html), 0);
  });

  it("does not count ordinary containers or text", function () {
    var html =
      '<div class="ds-appearance__container"></div>' +
      '<span class="ds-appearance__text">hi</span>';
    assert.strictEqual(R.countBlankBoxes(html), 0);
  });

  it("returns 0 for empty or non-string input", function () {
    assert.strictEqual(R.countBlankBoxes(""), 0);
    assert.strictEqual(R.countBlankBoxes(null), 0);
    assert.strictEqual(R.countBlankBoxes(undefined), 0);
  });
});
