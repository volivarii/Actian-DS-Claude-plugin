"use strict";
/**
 * flow-share-streaming.test.js — Characterization test for streaming behavior.
 *
 * Trade-off C: the pipeline re-emits the flow-share file per screen.  Screens
 * not yet built carry `status: "pending"` and render as shimmer placeholders;
 * finished screens render real content.  This test pins that behavior so any
 * accidental regression is caught immediately.
 *
 * Discovered markers (read from flow-renderer.js + assemble-flow-share.js):
 *   - Pending shimmer class:   "fm-skeleton"          (skeletonBody())
 *   - Pending screen class:    "screen--pending"      (pendingClass)
 *   - Per-screen cell class:   "proto-screen-cell"    (assemble-flow-share.js)
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var {
  assembleFlowShare,
} = require("../../scripts/renderers/assemble-flow-share.js");

// ---------------------------------------------------------------------------
// Inline mixed-state flow-data fixture: 3 screens — 1 pending, 2 ready.
// ---------------------------------------------------------------------------
var MIXED_FLOW = {
  meta: {
    feature: "Streaming Characterization",
    app: "Studio",
    pluginVersion: "0.0.0-test",
  },
  screens: [
    // Screen 1 — PENDING (no content yet, status flag set)
    {
      name: "Screen 1: Loading",
      template: "studio",
      status: "pending",
      content: [],
    },
    // Screen 2 — READY (has content[] with a text node).
    // Note: render-node.js TEXT case reads node.content (not node.characters).
    {
      name: "Screen 2: Ready A",
      template: "studio",
      content: [
        {
          type: "TEXT",
          name: "Heading",
          content: "Welcome to Screen Two",
        },
      ],
    },
    // Screen 3 — READY (uses contentHtml fallback)
    {
      name: "Screen 3: Ready B",
      template: "studio",
      contentHtml: "<p>Screen three content</p>",
    },
  ],
};

describe("assembleFlowShare — streaming (mixed pending + ready)", function () {
  var html; // compute once, shared across assertions
  it("assembles without throwing", function () {
    html = assembleFlowShare(MIXED_FLOW);
    assert.ok(
      typeof html === "string" && html.length > 0,
      "returns non-empty string",
    );
  });

  // Assertion 1: pending screen renders shimmer placeholder
  it("pending screen contains fm-skeleton shimmer markup", function () {
    assert.ok(
      html.indexOf("fm-skeleton") !== -1,
      'expected "fm-skeleton" class for pending screen shimmer',
    );
  });

  it("pending screen carries screen--pending class", function () {
    assert.ok(
      html.indexOf("screen--pending") !== -1,
      'expected "screen--pending" class on the pending screen element',
    );
  });

  // Assertion 2: ready screens render their real content
  it("ready screens render actual content, not shimmer", function () {
    // Screen 2's text node content must appear
    assert.ok(
      html.indexOf("Welcome to Screen Two") !== -1,
      "expected text content from Screen 2's content[] node",
    );
    // Screen 3's contentHtml must appear
    assert.ok(
      html.indexOf("Screen three content") !== -1,
      "expected literal text from Screen 3's contentHtml",
    );
  });

  it("ready screens do NOT carry screen--pending class on their own cells", function () {
    // Count occurrences: there should be exactly 1 pending screen marker for the
    // 1 pending screen in our fixture — not more.
    var pendingCount = (html.match(/screen--pending/g) || []).length;
    assert.strictEqual(
      pendingCount,
      1,
      "exactly 1 screen--pending marker (one pending screen in fixture)",
    );
  });

  // Assertion 3: exactly ONE proto-screen-cell per screen
  it("produces exactly one proto-screen-cell per screen regardless of pending/ready", function () {
    var cellCount = html.split('class="proto-screen-cell"').length - 1;
    assert.strictEqual(
      cellCount,
      MIXED_FLOW.screens.length,
      "one proto-screen-cell per screen (" +
        MIXED_FLOW.screens.length +
        " total)",
    );
  });
});
