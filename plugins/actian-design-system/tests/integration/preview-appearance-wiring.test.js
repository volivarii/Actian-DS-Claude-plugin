"use strict";

// preview-appearance-wiring.test.js — DELIVERABLE-level proof that the
// BROWSER flow bundle (assemble-preview.js --type flow) — as distinct from
// the server-side assembleFlowShare path already covered by
// flow-share-appearance.test.js — both embeds the anatomy DOC map
// (window.__dsAnatomyDocs) with real vendored appearance data AND inlines
// the two Phase 1B appearance renderer modules (appearance-style.js,
// appearance-render.js) in the load-bearing order documented in
// assemble-preview.js's TYPE_CONFIGS.flow.renderers comments: fm-html-map ->
// appearance-style -> appearance-render -> ds-html-map -> render-node ->
// flow-renderer.
//
// Why this matters: ds-html-map.js's default: case (the seam that handles
// non-BUILT_SLUGS, non-override slugs like tag-status) reads
// window.__dsAnatomyDocs first and calls
// window.appearanceRender.renderAppearanceComponent(doc, ...). If a future
// edit drops appearance-render.js from TYPE_CONFIGS.flow, or reorders it
// after ds-html-map.js, window.appearanceRender is undefined at the point
// ds-html-map.js's IIFE captures it, so the browser seam falls straight
// through to a graceful chip — the washed-out-tag regression — with zero
// prior test signal, because flow-share-appearance.test.js only exercises
// the server (assembleFlowShare) path, not this browser CLI path. (There is
// no legacy anatomy-render.js / anatomy-map fallback left to catch this —
// that two-hop path was retired in Group C.)
//
// Repo style: node:test + node:assert, spawnSync over the real CLI (see
// tests/renderers/assemble-preview.test.js's run() helper).

var { describe, it, before } = require("node:test");
var assert = require("node:assert");
var spawnSync = require("child_process").spawnSync;
var path = require("path");
var os = require("os");
var fs = require("fs");

var SCRIPT = path.join(
  __dirname,
  "..",
  "..",
  "scripts",
  "renderers",
  "assemble-preview.js",
);

// Minimal one-screen flow: a single DS tag-status instance at Status=Success.
// tag-status is a non-override, non-BUILT_SLUGS slug (absent from
// ds-html-map.js's BUILT_SLUGS list), so it is only ever reachable through
// the default: seam this test is targeting.
function fixture() {
  return {
    meta: { feature: "Status Check", app: "Preview" },
    screens: [
      {
        id: "s1",
        name: "S1",
        content: [
          {
            type: "INSTANCE",
            library: "ds",
            dsSlug: "tag-status",
            variant: "Status=Success",
            props: {},
          },
        ],
      },
    ],
  };
}

function assemble() {
  var tmpJson = path.join(
    os.tmpdir(),
    "preview-appearance-wiring-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 8) +
      ".json",
  );
  var outputFile = tmpJson.replace(/\.json$/, ".html");
  fs.writeFileSync(tmpJson, JSON.stringify(fixture()), "utf8");
  var result = spawnSync(
    "node",
    [SCRIPT, tmpJson, "--type", "flow", "-o", outputFile],
    { encoding: "utf8" },
  );
  var html = fs.existsSync(outputFile)
    ? fs.readFileSync(outputFile, "utf8")
    : "";
  fs.unlinkSync(tmpJson);
  if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
  return { status: result.status, stderr: result.stderr, html: html };
}

describe("assemble-preview --type flow: appearance renderer wiring (Phase 1B)", function () {
  // Every test below inspects the SAME deterministic output (fixed fixture,
  // no randomness in the assembled HTML), so assemble() runs ONCE here
  // instead of once per test (was 5 separate spawnSync child processes).
  var r;

  before(function () {
    r = assemble();
  });

  it("assembles cleanly", function () {
    assert.strictEqual(r.status, 0, "exits cleanly: " + r.stderr);
  });

  it("embeds window.__dsAnatomyDocs with the tag-status doc's real Success color", function () {
    var docsIdx = r.html.indexOf("window.__dsAnatomyDocs");
    assert.ok(docsIdx !== -1, "html embeds window.__dsAnatomyDocs");

    // Scope the check to that specific <script> block, not the whole
    // document (spec-data JSON elsewhere also mentions "tag-status").
    var blockEnd = r.html.indexOf("</script>", docsIdx);
    var block = r.html.substring(docsIdx, blockEnd);

    assert.ok(
      block.indexOf('"tag-status":') !== -1,
      "the doc map keys in on tag-status",
    );
    assert.ok(
      block.indexOf("#f0ffec") !== -1,
      "the embedded doc carries the real vendored Success background #f0ffec (not just a slug reference)",
    );
  });

  it("inlines both appearance-style.js and appearance-render.js", function () {
    assert.ok(
      r.html.indexOf("/* appearance-style.js */") !== -1,
      "appearance-style.js is inlined",
    );
    assert.ok(
      r.html.indexOf("/* appearance-render.js */") !== -1,
      "appearance-render.js is inlined",
    );
    assert.ok(
      r.html.indexOf("/* ds-html-map.js */") !== -1,
      "ds-html-map.js is inlined",
    );
  });

  it("inlines the modules in dependency order: style -> render -> ds-html-map", function () {
    // Load-bearing order: ds-html-map.js's default: case reads
    // window.appearanceRender at IIFE-eval time. If appearance-render.js is
    // dropped or moved after ds-html-map.js, window.appearanceRender is
    // undefined when ds-html-map.js's closure runs, and the seam degrades
    // straight to a graceful chip (there is no legacy anatomy-map fallback
    // left to catch it — Group C retired that two-hop path).
    var styleIdx = r.html.indexOf("/* appearance-style.js */");
    var renderIdx = r.html.indexOf("/* appearance-render.js */");
    var dsMapIdx = r.html.indexOf("/* ds-html-map.js */");

    assert.ok(styleIdx !== -1, "appearance-style.js marker present");
    assert.ok(renderIdx !== -1, "appearance-render.js marker present");
    assert.ok(dsMapIdx !== -1, "ds-html-map.js marker present");

    assert.ok(
      styleIdx < renderIdx,
      "appearance-style.js must be inlined before appearance-render.js",
    );
    assert.ok(
      renderIdx < dsMapIdx,
      "appearance-render.js must be inlined before ds-html-map.js",
    );
  });

  it("injects window.dsIcons BEFORE inlining appearance-render.js (F2)", function () {
    // F2: renderIconGlyph resolves node.slug against the module-level `dsIcons`
    // dual-source default, which reads window.dsIcons at IIFE-eval time (see
    // appearance-render.js's top-of-file comment). If assemble-preview.js ever
    // stopped injecting the window.dsIcons script (assemble-shared.js's
    // buildDsIconsScript()) before inlining appearance-render.js, the module
    // would resolve dsIcons to {} and every icon-bearing instance would
    // silently fall back to the neutral-box placeholder, with zero prior
    // signal from this suite (which only checked __dsAnatomyDocs / renderer
    // ordering, not the icon-geometry global).
    var iconsIdx = r.html.indexOf("window.dsIcons");
    var renderIdx = r.html.indexOf("/* appearance-render.js */");

    assert.ok(iconsIdx !== -1, "window.dsIcons script present");
    assert.ok(renderIdx !== -1, "appearance-render.js marker present");
    assert.ok(
      iconsIdx < renderIdx,
      "window.dsIcons must be injected before appearance-render.js is inlined",
    );
  });
});
