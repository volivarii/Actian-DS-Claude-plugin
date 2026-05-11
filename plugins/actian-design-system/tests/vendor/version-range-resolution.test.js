"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  matchesRange,
  resolveTargetTag,
  compareSemver,
} = require("../../scripts/vendor/vendor-snapshot.js");

test("vendor-snapshot range resolution", async (t) => {
  await t.test("~ range matches same minor, any patch >=", () => {
    assert.equal(matchesRange("0.1.0", "~0.1.0"), true);
    assert.equal(matchesRange("0.1.5", "~0.1.0"), true);
    assert.equal(matchesRange("0.1.99", "~0.1.0"), true);
    assert.equal(matchesRange("0.2.0", "~0.1.0"), false);
    assert.equal(matchesRange("1.1.0", "~0.1.0"), false);
    assert.equal(matchesRange("0.0.9", "~0.1.0"), false);
  });

  await t.test("^ range on pre-1.0 behaves like ~ (patches only)", () => {
    assert.equal(matchesRange("0.1.0", "^0.1.0"), true);
    assert.equal(matchesRange("0.1.5", "^0.1.0"), true);
    assert.equal(matchesRange("0.2.0", "^0.1.0"), false);
  });

  await t.test("^ range on >=1.0 allows minor + patch", () => {
    assert.equal(matchesRange("1.1.0", "^1.0.0"), true);
    assert.equal(matchesRange("1.5.3", "^1.0.0"), true);
    assert.equal(matchesRange("2.0.0", "^1.0.0"), false);
    assert.equal(matchesRange("0.9.0", "^1.0.0"), false);
  });

  await t.test("exact version range matches only that version", () => {
    assert.equal(matchesRange("0.1.1", "0.1.1"), true);
    assert.equal(matchesRange("0.1.2", "0.1.1"), false);
  });

  await t.test("compareSemver orders correctly", () => {
    assert.equal(compareSemver("0.1.0", "0.1.1"), -1);
    assert.equal(compareSemver("0.1.1", "0.1.0"), 1);
    assert.equal(compareSemver("0.1.0", "0.1.0"), 0);
    assert.equal(compareSemver("0.2.0", "0.1.99"), 1);
    assert.equal(compareSemver("1.0.0", "0.99.99"), 1);
  });

  await t.test("resolveTargetTag returns highest matching", () => {
    const tags = ["v0.1.0", "v0.1.1", "v0.1.2", "v0.2.0"];
    assert.equal(resolveTargetTag(tags, "~0.1.0"), "v0.1.2");
    assert.equal(resolveTargetTag(tags, "~0.2.0"), "v0.2.0");
  });

  await t.test("resolveTargetTag returns null when no tag matches", () => {
    const tags = ["v0.1.0", "v0.1.1"];
    assert.equal(resolveTargetTag(tags, "~0.2.0"), null);
  });

  await t.test("resolveTargetTag returns null for empty tag list", () => {
    assert.equal(resolveTargetTag([], "~0.1.0"), null);
  });

  await t.test("resolveTargetTag ignores tags with invalid semver", () => {
    const tags = ["v0.1.0", "garbage", "v0.1.1", "not-a-tag"];
    assert.equal(resolveTargetTag(tags, "~0.1.0"), "v0.1.1");
  });

  await t.test("resolveTargetTag ignores pre-release suffixed tags", () => {
    const tags = ["v0.1.0", "v0.1.1-beta", "v0.1.0-rc.1", "v0.1.2-pre"];
    assert.equal(resolveTargetTag(tags, "~0.1.0"), "v0.1.0");
  });

  await t.test("resolveTargetTag handles tags without v prefix", () => {
    const tags = ["0.1.0", "0.1.1"];
    assert.equal(resolveTargetTag(tags, "~0.1.0"), "v0.1.1");
  });
});
