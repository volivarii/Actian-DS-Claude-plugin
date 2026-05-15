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
      PATHS.components.mirrors.metaKit.endsWith("dist/meta-kit/components.md"),
    );
  });
});

test("paths.js normalizeVersion strips v-prefix", async (t) => {
  const { normalizeVersion } = require("../../scripts/lib/paths.js");
  await t.test("strips leading v", () => {
    assert.equal(normalizeVersion("v0.3.1"), "0.3.1");
  });
  await t.test("no-op when no prefix", () => {
    assert.equal(normalizeVersion("0.3.1"), "0.3.1");
  });
  await t.test("returns null for null/undefined", () => {
    assert.equal(normalizeVersion(null), null);
    assert.equal(normalizeVersion(undefined), null);
  });
});

test("paths.js verifyVendorIntegrity", async (t) => {
  const os = require("node:os");
  const { verifyVendorIntegrity } = require("../../scripts/lib/paths.js");

  function writeTmpVendored(payload) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vendor-integrity-"));
    const file = path.join(dir, "vendored.json");
    fs.writeFileSync(file, JSON.stringify(payload));
    return file;
  }

  await t.test("missing vendored.json — skipped silently", () => {
    assert.doesNotThrow(() =>
      verifyVendorIntegrity(
        { knowledge_version: "0.3.1" },
        path.join(os.tmpdir(), "definitely-does-not-exist-vendored.json"),
      ),
    );
  });

  await t.test("resolved_version null — skipped silently", () => {
    const file = writeTmpVendored({ knowledge_repo_resolved_version: null });
    assert.doesNotThrow(() =>
      verifyVendorIntegrity({ knowledge_version: "0.3.1" }, file),
    );
  });

  await t.test("match (with v-prefix on resolved) — passes", () => {
    const file = writeTmpVendored({
      knowledge_repo_resolved_version: "v0.3.1",
    });
    assert.doesNotThrow(() =>
      verifyVendorIntegrity({ knowledge_version: "0.3.1" }, file),
    );
  });

  await t.test("match (no v-prefix) — passes", () => {
    const file = writeTmpVendored({ knowledge_repo_resolved_version: "0.3.1" });
    assert.doesNotThrow(() =>
      verifyVendorIntegrity({ knowledge_version: "0.3.1" }, file),
    );
  });

  await t.test("mismatch — throws with both versions in message", () => {
    const file = writeTmpVendored({
      knowledge_repo_resolved_version: "v0.2.0",
    });
    assert.throws(
      () => verifyVendorIntegrity({ knowledge_version: "0.3.1" }, file),
      /knowledge_version='0\.3\.1'.*resolved_version='v0\.2\.0'/,
    );
  });

  await t.test("malformed vendored.json — skipped silently", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vendor-integrity-"));
    const file = path.join(dir, "vendored.json");
    fs.writeFileSync(file, "{ not valid json");
    assert.doesNotThrow(() =>
      verifyVendorIntegrity({ knowledge_version: "0.3.1" }, file),
    );
  });
});

test("paths.js content.bySlug alias", async (t) => {
  const PATHS = require("../../scripts/lib/paths.js");

  await t.test("bySlug is a function (mirrors content.section)", () => {
    assert.equal(typeof PATHS.content.bySlug, "function");
    assert.equal(PATHS.content.bySlug, PATHS.content.section);
  });

  await t.test(
    "bySlug walks content/src/<bucket>/ sub-dirs to find the file (v0.10.x sub-bucket layout)",
    () => {
      // content/src/ holds global content topics, sub-bucketed at v0.10.x into
      // writing/ (strict grammar/voice rules), patterns/ (universal UX
      // patterns), product/ (Actian product-surface rules). bySlug walks
      // these sub-dirs to find the {slug}.md file — slugs are unique across
      // buckets. Per-component content lives at components/dist/guidelines/.
      assert.ok(
        PATHS.content
          .bySlug("voice-and-tone")
          .endsWith("content/src/writing/voice-and-tone.md"),
      );
      assert.ok(
        PATHS.content
          .bySlug("empty-and-system-states")
          .endsWith("content/src/patterns/empty-and-system-states.md"),
      );
      assert.ok(
        PATHS.content
          .bySlug("lineage-specific-ui")
          .endsWith("content/src/product/lineage-specific-ui.md"),
      );
    },
  );

  await t.test("bySlug returns null for an unknown slug", () => {
    assert.equal(PATHS.content.bySlug("does-not-exist-anywhere"), null);
  });
});
