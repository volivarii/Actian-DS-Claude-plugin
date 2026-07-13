#!/usr/bin/env node
"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var R = require(
  path.resolve(__dirname, "..", "..", "scripts", "renderers", "renderability.js"),
);
var { loadAnatomy } = require(
  path.resolve(__dirname, "..", "..", "scripts", "renderers", "anatomy-render.js"),
);

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
    var doc = loadAnatomy("notification-dropdown");
    var v = R.isRenderable(doc);
    assert.strictEqual(v.ok, false);
    assert.match(v.why, /instances unresolved/);
  });

  it("admits a doc that carries real layout, paint and resolvable children", function () {
    var doc = loadAnatomy("collapse-accordion");
    assert.ok(doc, "fixture: collapse-accordion anatomy must exist");
    var v = R.isRenderable(doc);
    assert.strictEqual(v.ok, true, "collapse-accordion should be renderable");
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
