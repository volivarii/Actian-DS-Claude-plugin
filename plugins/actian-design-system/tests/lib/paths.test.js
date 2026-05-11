"use strict";

// Unit tests for plugin's paths.js manifest reader.
// Tests use fixtures in tests/fixtures/manifest/ so we can validate
// edge cases without polluting the real vendor/paths-manifest.json.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const FIXTURE_DIR = path.join(__dirname, "..", "fixtures", "manifest");
const { buildPathsFromManifest } = require("../../scripts/lib/paths.js");

function loadFixture(name) {
  return JSON.parse(
    fs.readFileSync(path.join(FIXTURE_DIR, name + ".json"), "utf8"),
  );
}

test("paths.js buildPathsFromManifest — happy path", async (t) => {
  await t.test("valid manifest builds expected shape", () => {
    const VENDOR = "/fake/vendor";
    const PATHS = buildPathsFromManifest(loadFixture("valid"), VENDOR);
    assert.equal(
      PATHS.foundations.color,
      path.join(VENDOR, "foundations/dist/color.json"),
    );
    assert.equal(PATHS.tokens.json, path.join(VENDOR, "tokens/tokens.json"));
  });

  await t.test("collection key builds a resolver function", () => {
    const VENDOR = "/fake/vendor";
    const PATHS = buildPathsFromManifest(loadFixture("valid"), VENDOR);
    assert.equal(typeof PATHS.components.guideline, "function");
    assert.equal(
      PATHS.components.guideline("button"),
      path.join(VENDOR, "components/src/guidelines/button.json"),
    );
  });

  await t.test("collection function substitutes any slug", () => {
    const VENDOR = "/fake/vendor";
    const PATHS = buildPathsFromManifest(loadFixture("valid"), VENDOR);
    assert.equal(
      PATHS.components.guideline("any-slug-here"),
      path.join(VENDOR, "components/src/guidelines/any-slug-here.json"),
    );
  });

  await t.test("empty manifest is allowed (no paths)", () => {
    const VENDOR = "/fake/vendor";
    const PATHS = buildPathsFromManifest(loadFixture("empty"), VENDOR);
    assert.deepEqual(PATHS, {});
  });
});

test("paths.js buildPathsFromManifest — error paths", async (t) => {
  await t.test("wrong manifest_schema_version throws", () => {
    assert.throws(
      () => buildPathsFromManifest(loadFixture("wrong-version"), "/fake"),
      /manifest_schema_version/,
    );
  });

  await t.test("missing required field throws with field name", () => {
    assert.throws(
      () => buildPathsFromManifest(loadFixture("missing-field"), "/fake"),
      /missing 'type'|missing 'description'/,
    );
  });

  await t.test("dot-notation key conflict (leaf vs branch) throws", () => {
    assert.throws(
      () => buildPathsFromManifest(loadFixture("dup-keys"), "/fake"),
      /conflict|cannot coexist/i,
    );
  });
});

test("paths.js byKit helper", async (t) => {
  // byKit lives on the eagerly-loaded module exports (built via real manifest).
  // We import the side-effecting module here to test its overlay.
  const PATHS = require("../../scripts/lib/paths.js");

  await t.test("byKit('ds') returns dskit path", () => {
    assert.equal(
      PATHS.components.registries.byKit("ds"),
      PATHS.components.registries.dskit,
    );
  });

  await t.test("byKit('fm') returns fmkit path", () => {
    assert.equal(
      PATHS.components.registries.byKit("fm"),
      PATHS.components.registries.fmkit,
    );
  });

  await t.test("byKit('meta') returns metakit path", () => {
    assert.equal(
      PATHS.components.registries.byKit("meta"),
      PATHS.components.registries.metakit,
    );
  });

  await t.test("byKit('unknown') throws", () => {
    assert.throws(
      () => PATHS.components.registries.byKit("unknown"),
      /unknown kit/,
    );
  });
});

test("paths.js plugin-derived mirrors overlay", async (t) => {
  const PATHS = require("../../scripts/lib/paths.js");

  await t.test("mirrors.ds resolves to dist/dskit-components.md", () => {
    assert.ok(PATHS.components.mirrors.ds.endsWith("dist/dskit-components.md"));
  });

  await t.test("mirrors.fm resolves to dist/fm-components.md", () => {
    assert.ok(PATHS.components.mirrors.fm.endsWith("dist/fm-components.md"));
  });

  await t.test("mirrors.metaKit resolves to meta-kit/components.md", () => {
    assert.ok(
      PATHS.components.mirrors.metaKit.endsWith(
        "dist/meta-kit/components.md",
      ),
    );
  });
});
