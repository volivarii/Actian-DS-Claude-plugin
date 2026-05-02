#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var reconcile = require(path.resolve(__dirname, "..", "scripts", "sync-fm-to-ds-map.js"));

// Build a minimal fixture registry — only what reconcile needs.
function makeRegistry() {
  return {
    components: {
      button: { key: "KEY-BUTTON", nodeId: "1:1" },
      "radio-button": { key: "KEY-RADIO-NEW", nodeId: "2:1" },
      toglge: { key: "KEY-TOGGLE-NEW", nodeId: "3:1" }
    }
  };
}

describe("sync-fm-to-ds-map reconcile", function () {
  it("backfills dsKey for legacy entry that has only dsSlug", function () {
    var map = {
      _meta: {},
      mappings: {
        fmButton: { dsSlug: "button", defaultVariant: {} }
      },
      unmappable: {}
    };
    var result = reconcile.reconcile(map, makeRegistry());
    assert.strictEqual(result.changes.backfilled.length, 1);
    assert.strictEqual(map.mappings.fmButton.dsKey, "KEY-BUTTON");
    assert.strictEqual(map.mappings.fmButton.dsSlug, "button");
  });

  it("refreshes dsSlug when registry slug has drifted", function () {
    var map = {
      _meta: {},
      mappings: {
        fmRadioButton: {
          dsKey: "KEY-RADIO-NEW",
          dsSlug: "radio-button-radio-button",  // stale
          defaultVariant: {}
        }
      },
      unmappable: {}
    };
    var result = reconcile.reconcile(map, makeRegistry());
    assert.strictEqual(result.changes.refreshed.length, 1);
    assert.strictEqual(map.mappings.fmRadioButton.dsSlug, "radio-button");
  });

  it("warns when dsKey does not resolve in registry", function () {
    var map = {
      _meta: {},
      mappings: {
        fmGhost: { dsKey: "KEY-DOES-NOT-EXIST", dsSlug: "ghost" }
      },
      unmappable: {}
    };
    var result = reconcile.reconcile(map, makeRegistry());
    assert.strictEqual(result.changes.warnings.length, 1);
    assert.match(result.changes.warnings[0], /KEY-DOES-NOT-EXIST/);
    // Does NOT mutate
    assert.strictEqual(map.mappings.fmGhost.dsSlug, "ghost");
  });

  it("is a no-op when entry already in sync", function () {
    var map = {
      _meta: {},
      mappings: {
        fmButton: { dsKey: "KEY-BUTTON", dsSlug: "button", defaultVariant: {} }
      },
      unmappable: {}
    };
    var result = reconcile.reconcile(map, makeRegistry());
    assert.strictEqual(result.changes.backfilled.length, 0);
    assert.strictEqual(result.changes.refreshed.length, 0);
    assert.strictEqual(result.changes.warnings.length, 0);
  });

  it("warns when entry has neither dsKey nor dsSlug", function () {
    var map = {
      _meta: {},
      mappings: {
        fmOrphan: { defaultVariant: {} }
      },
      unmappable: {}
    };
    var result = reconcile.reconcile(map, makeRegistry());
    assert.strictEqual(result.changes.warnings.length, 1);
    assert.match(result.changes.warnings[0], /fmOrphan/);
  });
});
