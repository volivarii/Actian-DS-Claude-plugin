#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var { deriveScreenId, stampScreenIds } = require("../scripts/screen-id.js");

describe("deriveScreenId", function () {
  it("kebabs feature + 1-based index", function () {
    assert.strictEqual(
      deriveScreenId("Notification Preferences", 0),
      "notification-preferences-1",
    );
  });

  it("strips non-alphanumerics, collapses dashes", function () {
    assert.strictEqual(
      deriveScreenId("Data Pipelines!! (v2)", 2),
      "data-pipelines-v2-3",
    );
  });

  it("falls back to 'screen' if feature is empty", function () {
    assert.strictEqual(deriveScreenId("", 0), "screen-1");
    assert.strictEqual(deriveScreenId(undefined, 4), "screen-5");
    assert.strictEqual(deriveScreenId(null, 0), "screen-1");
  });

  it("handles slug that becomes empty after stripping (e.g. all-symbols feature)", function () {
    assert.strictEqual(deriveScreenId("!!!", 0), "screen-1");
  });

  it("trims leading/trailing dashes", function () {
    assert.strictEqual(deriveScreenId("- Test -", 0), "test-1");
  });
});

describe("stampScreenIds", function () {
  it("stamps missing IDs in place, preserves existing", function () {
    var data = {
      meta: { feature: "Catalog" },
      screens: [
        { name: "S1", content: [] },
        { id: "custom-id", name: "S2", content: [] },
        { name: "S3", content: [] },
      ],
    };
    stampScreenIds(data);
    assert.strictEqual(data.screens[0].id, "catalog-1");
    assert.strictEqual(data.screens[1].id, "custom-id");
    assert.strictEqual(data.screens[2].id, "catalog-3");
  });

  it("does nothing on null/empty data (no throw)", function () {
    stampScreenIds(null);
    stampScreenIds({});
    stampScreenIds({ screens: [] });
    stampScreenIds({ screens: null });
    // no assertion needed; absence of throw is the test
  });

  it("stamps single-screen flows too (always-stamp rule)", function () {
    var data = { meta: { feature: "Solo Screen" }, screens: [{ name: "S", content: [] }] };
    stampScreenIds(data);
    assert.strictEqual(data.screens[0].id, "solo-screen-1");
  });

  it("uses 'screen' fallback when meta.feature is missing", function () {
    var data = { screens: [{ name: "S", content: [] }, { name: "S2", content: [] }] };
    stampScreenIds(data);
    assert.strictEqual(data.screens[0].id, "screen-1");
    assert.strictEqual(data.screens[1].id, "screen-2");
  });

  it("is idempotent — re-stamping does not mutate already-stamped data", function () {
    var data = {
      meta: { feature: "Test" },
      screens: [
        { name: "S1", content: [] },
        { name: "S2", content: [] },
      ],
    };
    stampScreenIds(data);
    var snapshot = JSON.stringify(data);
    stampScreenIds(data);
    stampScreenIds(data);
    assert.strictEqual(JSON.stringify(data), snapshot);
  });

  it("skips falsy entries in screens array (defense)", function () {
    var data = {
      meta: { feature: "Test" },
      screens: [null, { name: "S", content: [] }, undefined],
    };
    // should not throw
    stampScreenIds(data);
    assert.strictEqual(data.screens[1].id, "test-2");
  });
});
