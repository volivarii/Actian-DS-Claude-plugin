"use strict";

// preview-retired-slug-wiring.test.js — DELIVERABLE-level proof that the
// BROWSER flow bundle (assemble-preview.js --type flow) resolves a slug the
// design system has renamed, the way the Node path already does.
//
// knowledge #601 made the renderer resolve a retired slug through the identity
// ledger, so content authored against an old name still renders. The map it
// reads is a SEPARATE vendored module, ds-retired-slugs.js, and there is no fs
// in the browser: ds-html-map.js takes it from `require` in Node and from
// window.dsRetiredSlugs in the browser, falling back to an empty map when
// neither supplies one. An empty map is a legitimate state (no renames
// recorded yet) and resolves nothing, so a bundle that forgets to inline the
// module degrades in complete silence: every test on the Node path still
// passes, while a flow preview renders a renamed component as a grey chip.
//
// This is the same failure shape preview-appearance-wiring.test.js guards for
// appearance-style.js and appearance-render.js, one module later. Both halves
// are asserted deliberately: that the module is inlined in the right ORDER,
// and, because a marker can be present while the wiring is broken, that the
// assembled bundle's own scripts actually RESOLVE a retired slug when run with
// a browser's globals and no require.

var { describe, it, before } = require("node:test");
var assert = require("node:assert");
var spawnSync = require("child_process").spawnSync;
var path = require("path");
var os = require("os");
var fs = require("fs");
var vm = require("vm");

var SCRIPT = path.join(
  __dirname,
  "..",
  "..",
  "scripts",
  "renderers",
  "assemble-preview.js",
);

var renderer = require("../../scripts/lib/renderer.js");
var RETIRED = require(
  renderer.modulePath("html-renderers/ds-retired-slugs.js"),
).RETIRED_SLUGS;

// Derive the specimen instead of naming one: every entry here is a rename the
// ledger recorded, and which names are current changes with every Figma sync.
// Prefer a pair whose CURRENT slug has a bespoke leaf, so "did it resolve" is
// answerable from the markup alone without an anatomy doc map.
var BUILT = {};
(renderer.dsHtmlMap.BUILT_SLUGS || []).forEach(function (s) {
  BUILT[s] = true;
});
var SPECIMEN = Object.keys(RETIRED)
  .sort() // deterministic across runs and machines
  .map(function (retired) {
    return { retired: retired, current: RETIRED[retired] };
  })
  .filter(function (p) {
    return BUILT[p.current];
  })[0];

function fixture(slug) {
  return {
    meta: { feature: "Retired slug", app: "Preview" },
    screens: [
      {
        id: "s1",
        name: "S1",
        content: [
          {
            type: "INSTANCE",
            library: "ds",
            dsSlug: slug,
            props: { Label: "Probe" },
          },
        ],
      },
    ],
  };
}

function assemble(slug) {
  var tmpJson = path.join(
    os.tmpdir(),
    "preview-retired-slug-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 8) +
      ".json",
  );
  var outputFile = tmpJson.replace(/\.json$/, ".html");
  fs.writeFileSync(tmpJson, JSON.stringify(fixture(slug)), "utf8");
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

// Pull the inlined renderer modules back out of the deliverable and run them
// the way a browser would: a window, no require, no fs. Anything the bundle
// failed to inline is simply absent, which is the whole point.
function renderInBrowserBundle(html, node) {
  var sandbox = { console: console };
  sandbox.window = sandbox;
  var ctx = vm.createContext(sandbox);

  var re = /<script>\n\s*\/\* ([^*]+?) \*\/\n([\s\S]*?)<\/script>/g;
  var m;
  var loaded = [];
  while ((m = re.exec(html))) {
    loaded.push(m[1].trim());
    vm.runInContext(m[2], ctx, { filename: m[1].trim() });
  }
  assert.ok(
    loaded.indexOf("ds-html-map.js") !== -1,
    "the bundle did not inline ds-html-map.js at all, so this test cannot " +
      "say anything about resolution. Inlined: " + loaded.join(", "),
  );
  return {
    loaded: loaded,
    html: sandbox.dsHtmlMap.renderDSComponent(node),
  };
}

function isGracefulChip(markup) {
  return /<span class="ds-component"/.test(String(markup));
}

describe("assemble-preview --type flow: retired-slug wiring", function () {
  var r;

  before(function () {
    assert.ok(
      SPECIMEN,
      "the vendored identity ledger records no rename whose current slug is " +
        "BUILT, so there is no specimen for this gate. Repoint it at an " +
        "anatomy-tier pair or retire it rather than letting it pass vacuously.",
    );
    r = assemble(SPECIMEN.retired);
  });

  it("assembles cleanly", function () {
    assert.strictEqual(r.status, 0, "exits cleanly: " + r.stderr);
  });

  it("inlines ds-retired-slugs.js BEFORE ds-html-map.js", function () {
    // ds-html-map.js captures window.dsRetiredSlugs when its IIFE evaluates,
    // so a module inlined after it is a module that arrived too late.
    var retiredIdx = r.html.indexOf("/* ds-retired-slugs.js */");
    var dsMapIdx = r.html.indexOf("/* ds-html-map.js */");
    assert.ok(
      retiredIdx !== -1,
      "ds-retired-slugs.js is not inlined, so window.dsRetiredSlugs is " +
        "undefined in the browser and every renamed component chips",
    );
    assert.ok(dsMapIdx !== -1, "ds-html-map.js marker present");
    assert.ok(
      retiredIdx < dsMapIdx,
      "ds-retired-slugs.js must be inlined before ds-html-map.js",
    );
  });

  it("carries the ledger's own mapping, not an empty map", function () {
    // Non-vacuity: an inlined module that generated to {} would satisfy the
    // marker check above while resolving nothing.
    var idx = r.html.indexOf("/* ds-retired-slugs.js */");
    // Anchor first. A -1 index would make substring() read from the top of
    // the document, where spec-data mentions the slug anyway, and this
    // assertion would pass on a bundle that inlined nothing.
    assert.ok(idx !== -1, "ds-retired-slugs.js is not inlined");
    var block = r.html.substring(idx, r.html.indexOf("</script>", idx));
    assert.ok(
      block.indexOf(SPECIMEN.retired) !== -1 &&
        block.indexOf(SPECIMEN.current) !== -1,
      "the inlined map must carry " +
        SPECIMEN.retired +
        " -> " +
        SPECIMEN.current,
    );
  });

  it("resolves the retired slug when run with a browser's globals", function () {
    var out = renderInBrowserBundle(r.html, {
      type: "INSTANCE",
      library: "ds",
      dsSlug: SPECIMEN.retired,
      props: { Label: "Probe" },
    });
    assert.ok(
      !isGracefulChip(out.html),
      SPECIMEN.retired +
        " rendered as a graceful chip in the browser bundle: " +
        String(out.html).slice(0, 160),
    );
  });

  it("renders the retired slug EXACTLY as its current name", function () {
    // The contract knowledge #601 rests on: a retired slug renders what the
    // component answers to now. Asserting "not a chip" alone would pass on a
    // half-resolved render that picked up the leaf but not its variant data.
    var current = renderInBrowserBundle(r.html, {
      type: "INSTANCE",
      library: "ds",
      dsSlug: SPECIMEN.current,
      props: { Label: "Probe" },
    });
    var retired = renderInBrowserBundle(r.html, {
      type: "INSTANCE",
      library: "ds",
      dsSlug: SPECIMEN.retired,
      props: { Label: "Probe" },
    });
    assert.strictEqual(
      retired.html,
      current.html,
      SPECIMEN.retired + " must render identically to " + SPECIMEN.current,
    );
  });
});
