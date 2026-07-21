"use strict";
var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");
var cp = require("node:child_process");
var PATHS = require("../../scripts/lib/paths.js");
var RENDERER = require("../../scripts/lib/renderer.js");

// Intentionally mirrors scripts/lib/shared-constants.js `slugToRef` so this gate
// stays dependency-free (importing shared-constants pulls in registry-loading
// side effects). shared-constants.test.js is the authority for the mapping.
function slugToRef(slug, prefix) {
  var stripped =
    slug.indexOf(prefix + "-") === 0 ? slug.slice(prefix.length + 1) : slug;
  return (
    prefix +
    stripped.charAt(0).toUpperCase() +
    stripped.slice(1).replace(/-([a-z])/g, function (_, c) {
      return c.toUpperCase();
    })
  );
}

var ALLOWLIST = new Set(["fmCursor", "fmTableExample"]);

test("every non-icon fm- component has a bespoke renderer case (or is allowlisted)", function () {
  var fmkit = JSON.parse(
    fs.readFileSync(PATHS.components.registries.fmkit, "utf8"),
  );
  var src = fs.readFileSync(
    RENDERER.modulePath("html-renderers/fm-html-map.js"),
    "utf8",
  );
  var cases = new Set();
  var re = /case\s+"([^"]+)":/g,
    m;
  while ((m = re.exec(src))) cases.add(m[1]);

  var missing = [];
  Object.keys(fmkit.components).forEach(function (slug) {
    if (slug.indexOf("fm-") !== 0) return;
    var ref = slugToRef(slug, "fm");
    if (ALLOWLIST.has(ref)) return;
    if (!cases.has(ref)) missing.push(ref + " (" + slug + ")");
  });
  assert.deepEqual(
    missing.sort(),
    [],
    "fm- components missing a renderer case: " + missing.join(", "),
  );
});

test("the default fallback never emits a raw [ref] token", function () {
  var fmMap = RENDERER.fmHtmlMap;
  var html = fmMap.renderFMComponent({
    type: "INSTANCE",
    ref: "fmAcademicCap",
    name: "Academic cap",
  });
  assert.ok(html.indexOf("[fmAcademicCap]") === -1, "no raw [ref] box");
  assert.ok(html.indexOf("Academic cap") !== -1, "renders the human name");
});

test(
  "render-node-figma emits a script for every keyed fm- component" +
    " (unresolvable refs are exactly the keyless ones)",
  function () {
    var EMITTER = path.resolve(
      __dirname,
      "..",
      "..",
      "scripts",
      "renderers",
      "html-renderers",
      "render-node-figma.js",
    );

    // 1. Build full list of fm- refs from the registry.
    var fmkit = JSON.parse(
      fs.readFileSync(PATHS.components.registries.fmkit, "utf8"),
    );
    var fmRefs = Object.keys(fmkit.components)
      .filter(function (slug) {
        return slug.indexOf("fm-") === 0;
      })
      .map(function (slug) {
        return slugToRef(slug, "fm");
      });

    // 2. Build one spec containing every fm- ref as an INSTANCE node.
    var spec = {
      content: fmRefs.map(function (ref) {
        return { type: "INSTANCE", ref: ref };
      }),
    };

    // 3. Run the emitter once via spawnSync.
    var r = cp.spawnSync(process.execPath, [EMITTER, "--parent-id", "1:1"], {
      input: JSON.stringify(spec),
      encoding: "utf8",
    });

    // 4. Determine the set of refs the gate rejected.
    var rejected = [];
    if (r.status !== 0) {
      var parsed = JSON.parse(r.stderr);
      (parsed.errors || []).forEach(function (e) {
        if (e.message && e.message.indexOf("unknown FM ref: ") === 0) {
          rejected.push(e.message.replace("unknown FM ref: ", ""));
        }
      });
    }

    // 5. Independently compute expected-unresolvable from the registry.
    //    buildKeyMapFromRegistry gives the resolvable map; any fm- ref
    //    whose component has no importable key won't appear as a valid
    //    entry there.  In practice the registry records a key for every
    //    fm- slug, so this set is expected to be empty — but the test
    //    stays self-maintaining if that changes.
    var sharedConstants = require("../../scripts/lib/shared-constants.js");
    var fmKeyMap = sharedConstants.buildKeyMapFromRegistry("fmkit", "fm");
    var expectedUnresolvable = fmRefs.filter(function (ref) {
      // A ref is unresolvable when it has no entry at all, or its entry
      // has no key (so importComponentByKeyAsync would fail).
      var entry = fmKeyMap[ref];
      return !entry || !entry.key;
    });

    // 6. Assert rejected == expectedUnresolvable.
    assert.deepEqual(
      rejected.slice().sort(),
      expectedUnresolvable.slice().sort(),
      "Rejected refs must equal exactly the keyless (unresolvable) refs. " +
        "A surplus in 'rejected' means the emitter regressed or a registry " +
        "component lost its key.",
    );

    // Sanity: at least one of the two conditions holds.
    assert.ok(
      r.status === 0 || rejected.length > 0,
      "emitter must either succeed (exit 0) or report errors in stderr JSON",
    );

    // When all refs are resolvable, verify the emitter actually produced code.
    if (r.status === 0) {
      assert.ok(r.stdout.length > 0, "stdout must be non-empty on success");
      assert.ok(
        r.stdout.indexOf("importComponent") !== -1,
        "emitted code must contain an importComponent call",
      );
    }
  },
);
