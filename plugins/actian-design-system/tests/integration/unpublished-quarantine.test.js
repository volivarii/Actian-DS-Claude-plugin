"use strict";

// unpublished-quarantine.test.js — keeps the quarantine in tests/helpers/
// unpublished.js honest.
//
// A component can leave the Figma registry two ways, and they need opposite
// responses. A RETIRE is permanent, so its tests, goldens and worked examples
// are deleted (the card-for-items precedent). An UNPUBLISH is temporary: the
// component is archived in the Figma file while an old version is rebuilt and
// is expected back, so deleting its tests destroys work that has to be
// rewritten when it returns. Upstream draws the same distinction and keeps the
// guidance for the second case (knowledge c8340c77, guideline-reachability's
// UNREACHABLE list), which is what makes republishing cost nothing there.
//
// The quarantine is this repo's half of that. It skips the tests that need an
// unpublished slug INSTEAD of deleting them, and this file makes sure the
// skip cannot outlive its cause: the moment the slug is published again, the
// entry is stale and this test says so by name.

var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("node:fs");
var path = require("node:path");
var PATHS = require("../../scripts/lib/paths.js");
var quarantine = require("../helpers/unpublished.js");

var GUIDELINES_DIR = path.join(
  __dirname,
  "..",
  "..",
  "vendor",
  "components",
  "dist",
  "guidelines",
);

function registryComponents() {
  return (
    JSON.parse(fs.readFileSync(PATHS.components.registries.dskit, "utf8"))
      .components || {}
  );
}

test("a quarantined slug is genuinely absent from the vendored registry", function () {
  var components = registryComponents();
  var published = Object.keys(quarantine.EXPECTED_BACK).filter(function (slug) {
    return !!components[slug];
  });
  assert.deepEqual(
    published,
    [],
    "these slugs are PUBLISHED again and their quarantine is stale: " +
      published.join(", ") +
      ". Remove them from EXPECTED_BACK so their tests and goldens run again " +
      "(a skip that outlives its cause is a test nobody is running).",
  );
});

test("a quarantined slug still has its guidance, the evidence it is coming back", function () {
  // The distinction between "unpublished, expected back" and "retired" is not
  // observable from the registry alone: both look like an absent slug. Upstream
  // keeps the guidance for the first case and drops it for the second, so the
  // vendored guideline is the discriminator. If it disappears, this was a
  // retirement after all and the quarantined tests should be deleted, not
  // skipped indefinitely.
  var orphaned = Object.keys(quarantine.EXPECTED_BACK).filter(function (slug) {
    return !fs.existsSync(path.join(GUIDELINES_DIR, slug + ".json"));
  });
  assert.deepEqual(
    orphaned,
    [],
    "these quarantined slugs have lost their vendored guidance: " +
      orphaned.join(", ") +
      ". Upstream keeps guidance only for a component it expects back, so this " +
      "is now a retirement: delete the quarantined tests and goldens instead " +
      "of skipping them.",
  );
});

test("every quarantine entry carries a reason", function () {
  var unexplained = Object.keys(quarantine.EXPECTED_BACK).filter(function (s) {
    var why = quarantine.EXPECTED_BACK[s];
    return typeof why !== "string" || why.trim().length === 0;
  });
  assert.deepEqual(
    unexplained,
    [],
    "these quarantine entries have no reason: " +
      unexplained.join(", ") +
      ". A skip with no stated cause cannot be cleared by the next reader.",
  );
});

test("skipReason answers for a quarantined slug and stays silent otherwise", function () {
  // Non-vacuity: the helper has to actually discriminate. A version that
  // always returned a reason would skip the whole suite; one that never did
  // would red every quarantined test.
  var quarantined = Object.keys(quarantine.EXPECTED_BACK);
  assert.ok(
    quarantined.length > 0,
    "the quarantine is empty, so nothing below proves the helper works. " +
      "If the last entry was cleared, delete this file with it.",
  );
  quarantined.forEach(function (slug) {
    assert.equal(
      typeof quarantine.skipReason(slug),
      "string",
      slug + " is quarantined but skipReason() did not return a reason",
    );
  });

  var live = Object.keys(registryComponents())[0];
  assert.ok(live, "the vendored registry published no components at all");
  assert.equal(
    quarantine.skipReason(live),
    false,
    "skipReason() must return false for the published slug " +
      live +
      ", or every test that consults it would skip",
  );
});
