#!/usr/bin/env node
// tests/integration/hifi-push-emit.test.js
//
// Deliverable-level proof that the --hifi --push emit path is NOT inert.
// (Slice-1 lesson: a feature can pass every unit test and be 100% inert at the
// real push boundary. The canonical proof runs the CLI — the same invocation
// path push-sequence.md uses — on production-shaped flow data and asserts that
// each real DS Kit key lands in the emitted Plugin API JS on stdout.)
//
// What is exercised here (vs. existing unit tests):
//   - The CLI invocation path (spawnSync → stdin spec → stdout Plugin API JS)
//   - screenTree() wrapping chrome + multiple real content components
//   - Whole-tree traversal: chrome DS keys (global-header, side-nav, page-header)
//     AND content DS keys (input, button, card-for-items) all appear in one emit
//   - Fail-loud path: unknown dsSlug → exit 1, stderr names the slug
//
// Run:
//   source scripts/lib/resolve-node.sh && "$NODE_BIN" --test tests/integration/hifi-push-emit.test.js

"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("node:path");
var cp = require("node:child_process");

var shared = require(
  path.resolve(__dirname, "..", "..", "scripts", "lib", "shared-constants.js"),
);
var dst = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "html-renderers",
    "ds-screen-tree.js",
  ),
);

var CLI = path.resolve(
  __dirname,
  "..",
  "..",
  "scripts",
  "renderers",
  "html-renderers",
  "render-node-figma.js",
);

// Build the DS key map once. Keys are resolved DYNAMICALLY — never hardcoded —
// so this test survives vendor refreshes without rotting.
var DS_KEYS = shared.buildKeyMapFromRegistry("dskit", "ds");

// ---------------------------------------------------------------------------
// Production-shaped --hifi flow fixture
// ---------------------------------------------------------------------------
// Mirrors the shape that generate-flow --hifi produces: meta.library:"ds",
// template "studio" → resolves chrome (global-header + side-nav + page-header),
// content[] holds real DS INSTANCE nodes with the correct authoring vocabulary.
//
// Content slugs chosen because they are all in ds-components-authoring.md and
// all have verified registry keys:
//   text-input     → dsTextInput
//   button         → dsButton
//   card-for-items → dsCardForItems
//
// Chrome slugs resolved by screenTree() from template:"studio":
//   global-header  → dsGlobalHeader
//   side-nav       → dsSideNav
//   page-header    → dsPageHeader  (from screen.pageHeader)

var FIXTURE_SCREEN = {
  name: "Data Products — Catalog",
  template: "studio",
  library: "ds",
  header: { search: true, account: "VO", context: "Catalog" },
  sidebar: {
    items: ["Catalog", "Lineage", "Policies"],
    activeItem: "Catalog",
  },
  pageHeader: {
    title: "Data Products",
    subtitle: "Browse and manage your data products",
  },
  content: [
    {
      type: "INSTANCE",
      library: "ds",
      dsSlug: "text-input",
      variant: "States=Default",
      props: { "Placeholder text": "Search data products" },
      sizing: { horizontal: "FILL" },
    },
    {
      type: "INSTANCE",
      library: "ds",
      dsSlug: "button",
      variant: "Type=Primary, Size=Default",
      props: { Label: "Add data product" },
    },
    {
      type: "INSTANCE",
      library: "ds",
      dsSlug: "card-for-items",
      variant: "Type=Default, State=Default",
      props: { "Title#text": "Analytics Pipeline" },
      sizing: { horizontal: "FILL" },
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Resolve a DS slug to its DS Kit key (dynamic; survives vendor refreshes).
function dsKey(slug) {
  var ref = shared.slugToRef(slug, "ds");
  var entry = DS_KEYS[ref];
  // Guard against an empty/undefined key: indexOf("") is always 0 (!== -1),
  // which would make every "key present" assertion vacuously pass.
  if (!entry || !entry.key) {
    throw new Error(
      "test setup error: slug not in registry or key empty: " + slug,
    );
  }
  return entry.key;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("hifi-push-emit — deliverable-level CLI emit proof", function () {
  // -------------------------------------------------------------------------
  // Case 1 (the canonical proof): production-shaped --hifi screen →
  //   CLI exit 0, stderr {ok:true}, all 6 DS Kit keys present in stdout.
  // -------------------------------------------------------------------------
  it("production-shaped --hifi screen: CLI exit 0, {ok:true}, all DS keys in stdout", function () {
    // Build the full Figma node tree via screenTree() — the same call
    // flow-renderer.js / push-sequence.md makes before serialising to stdin.
    var tree = dst.screenTree(FIXTURE_SCREEN);
    var spec = JSON.stringify({ content: [tree] });

    var r = cp.spawnSync(process.execPath, [CLI, "--parent-id", "1:2"], {
      input: spec,
      encoding: "utf8",
    });

    // ---- exit code + manifest ----
    assert.strictEqual(
      r.status,
      0,
      "CLI must exit 0 on valid spec (stderr: " + (r.stderr || "") + ")",
    );

    var manifest;
    try {
      manifest = JSON.parse(r.stderr);
    } catch (e) {
      assert.fail("stderr is not valid JSON: " + r.stderr);
    }
    assert.strictEqual(manifest.ok, true, "manifest.ok must be true");
    assert.ok(
      !manifest.errors || manifest.errors.length === 0,
      "no errors in manifest",
    );

    // ---- content must be non-empty ----
    var stdout = r.stdout || "";
    assert.ok(stdout.trim().length > 0, "stdout must contain Plugin API JS");

    // ---- chrome DS Kit keys ----
    var globalHeaderKey = dsKey("global-header");
    var sideNavKey = dsKey("side-nav");
    var pageHeaderKey = dsKey("page-header");

    assert.ok(
      stdout.indexOf(globalHeaderKey) !== -1,
      "global-header DS Kit key must appear in emitted JS (key: " +
        globalHeaderKey +
        ")",
    );
    assert.ok(
      stdout.indexOf(sideNavKey) !== -1,
      "side-nav DS Kit key must appear in emitted JS (key: " + sideNavKey + ")",
    );
    assert.ok(
      stdout.indexOf(pageHeaderKey) !== -1,
      "page-header DS Kit key must appear in emitted JS (key: " +
        pageHeaderKey +
        ")",
    );

    // ---- content DS Kit keys ----
    var inputKey = dsKey("text-input");
    var buttonKey = dsKey("button");
    var cardForItemsKey = dsKey("card-for-items");

    assert.ok(
      stdout.indexOf(inputKey) !== -1,
      "input DS Kit key must appear in emitted JS (key: " + inputKey + ")",
    );
    assert.ok(
      stdout.indexOf(buttonKey) !== -1,
      "button DS Kit key must appear in emitted JS (key: " + buttonKey + ")",
    );
    assert.ok(
      stdout.indexOf(cardForItemsKey) !== -1,
      "card-for-items DS Kit key must appear in emitted JS (key: " +
        cardForItemsKey +
        ")",
    );

    // ---- negative control (falsifiability baked in) ----
    // `table` is a real keyed DS vocab slug, but it is NOT in the fixture's
    // content[]. Its key must therefore be ABSENT from stdout. This proves the
    // "key present" assertions above actually bite: if the emitter leaked an
    // arbitrary component, or if indexOf matched on noise, this would catch it.
    assert.ok(
      stdout.indexOf(dsKey("table")) === -1,
      "control: a vocab slug absent from the fixture must NOT appear in stdout (proves assertions bite)",
    );

    // ---- structural completeness (not inert) ----
    assert.ok(
      stdout.indexOf("importComponentByKeyAsync") !== -1 ||
        stdout.indexOf("importComponentSetByKeyAsync") !== -1,
      "emitted JS must contain at least one import call (not inert)",
    );
    assert.ok(
      stdout.indexOf("createInstance") !== -1,
      "emitted JS must contain createInstance calls",
    );

    // ---- gate: no failure path was hit ----
    assert.ok(
      stdout.indexOf("{ok:false}") === -1 &&
        stdout.indexOf('"ok":false') === -1,
      "no failure marker in stdout",
    );
  });

  // -------------------------------------------------------------------------
  // Case 2 (fail-loud proof): unknown dsSlug → exit 1, stderr names the slug.
  // -------------------------------------------------------------------------
  it("unknown dsSlug → CLI exit 1, stderr names the bad slug", function () {
    var badSlug = "definitely-not-a-real-ds-slug";
    var spec = JSON.stringify({
      content: [
        {
          type: "INSTANCE",
          library: "ds",
          dsSlug: badSlug,
          variant: "Type=Primary",
        },
      ],
    });

    var r = cp.spawnSync(process.execPath, [CLI, "--parent-id", "1:2"], {
      input: spec,
      encoding: "utf8",
    });

    assert.strictEqual(r.status, 1, "CLI must exit 1 on unknown dsSlug");
    assert.ok(
      (r.stderr || "").indexOf(badSlug) !== -1,
      "stderr must name the bad slug (" + badSlug + "): " + r.stderr,
    );
    assert.strictEqual(
      (r.stdout || "").trim(),
      "",
      "stdout must be empty on invalid spec",
    );
  });
});
