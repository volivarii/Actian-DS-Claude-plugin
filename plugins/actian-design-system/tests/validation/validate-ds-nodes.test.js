#!/usr/bin/env node
"use strict";

// Task 3: DS-node validation tests
// Covers unknown-ds-slug (hard error) + ds-slug-unbuilt (warning) + known-built (clean).
// Warning-tier slug is resolved at run time from the vendored dskit registry
// (present there, carrying anatomy, absent from BUILT_SLUGS).

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var validate = require(
  path.join(PLUGIN_ROOT, "scripts", "validation", "validate-flow-data.js"),
);
var PATHS = require(path.join(PLUGIN_ROOT, "scripts", "lib", "paths.js"));
var ds = require(
  path.join(PLUGIN_ROOT, "scripts", "lib", "renderer.js"),
).dsHtmlMap;
var { pickUnbuiltRegistrySlug } = require("../helpers/appearance-specimen.js");

// Authorable-but-unbuilt specimen, resolved at run time. Hardcoding it means
// re-pointing this test on every gray-box slice: it named "tooltip" until
// Hi-Fi Slice 1 built tooltip, then "avatar" until knowledge #472 built that
// too. The warning tier is the subject, not any particular slug.
var UNBUILT_SLUG = pickUnbuiltRegistrySlug(
  ds.BUILT_SLUGS,
  PATHS.components.registries.dskit,
);

// Minimal valid flow fixture that passes all other checks:
// - skipTokens + skipTerminology + skipAvoidWords suppress unrelated noise
// - meta.feature present; app + library + template satisfy screen minimal shape
// - props.Label avoids banned text; "Go" is clean
function flowWith(node) {
  return {
    meta: { feature: "t", app: "Studio", library: "ds" },
    screens: [
      {
        id: "s1",
        name: "S",
        template: "studio",
        content: [{ type: "FRAME", name: "main", children: [node] }],
      },
    ],
  };
}

// Build a DS-native INSTANCE node (library:"ds", no ref)
function dsNode(slug) {
  return {
    type: "INSTANCE",
    library: "ds",
    dsSlug: slug,
    props: { Label: "Go" },
  };
}

// Options to suppress unrelated check noise in these focused tests
var QUIET = {
  skipTokens: true,
  skipTerminology: true,
  skipAvoidWords: true,
};

// ---------------------------------------------------------------------------
// Test 1: unknown dsSlug → hard error
// ---------------------------------------------------------------------------
describe("validate-ds-nodes: unknown-ds-slug", function () {
  it("flags a totally-made-up slug with kind=unknown-ds-slug, severity=error", function () {
    var data = flowWith(dsNode("totally-made-up-slug"));
    var result = validate.validate(data, QUIET);
    var errs = result.findings.filter(function (f) {
      return f.kind === "unknown-ds-slug";
    });
    assert.strictEqual(
      errs.length,
      1,
      "expected exactly one unknown-ds-slug finding",
    );
    assert.strictEqual(errs[0].severity, "error");
  });

  it("unknown-ds-slug finding has a message mentioning the slug", function () {
    var data = flowWith(dsNode("totally-made-up-slug"));
    var result = validate.validate(data, QUIET);
    var errs = result.findings.filter(function (f) {
      return f.kind === "unknown-ds-slug";
    });
    assert.ok(errs.length > 0, "expected at least one unknown-ds-slug finding");
    assert.ok(
      errs[0].message.indexOf("totally-made-up-slug") !== -1,
      "message should mention the offending slug",
    );
  });

  it("unknown-ds-slug is NOT flagged as unknown-component (no ref to chase)", function () {
    var data = flowWith(dsNode("totally-made-up-slug"));
    var result = validate.validate(data, QUIET);
    var unknownComp = result.findings.filter(function (f) {
      return f.kind === "unknown-component";
    });
    assert.strictEqual(
      unknownComp.length,
      0,
      "DS nodes without ref must not trigger unknown-component",
    );
  });
});

// ---------------------------------------------------------------------------
// Test 2: authorable-but-unbuilt dsSlug → WARNING (not an error)
// Specimen resolved at run time (see UNBUILT_SLUG above): present in the
// vendored dskit registry, carrying anatomy, and absent from BUILT_SLUGS.
// ---------------------------------------------------------------------------
describe("validate-ds-nodes: ds-slug-unbuilt", function () {
  it("flags the unbuilt slug with kind=ds-slug-unbuilt, severity=warning", function () {
    var data = flowWith(dsNode(UNBUILT_SLUG));
    var result = validate.validate(data, QUIET);
    var warns = result.findings.filter(function (f) {
      return f.kind === "ds-slug-unbuilt";
    });
    assert.strictEqual(
      warns.length,
      1,
      "expected exactly one ds-slug-unbuilt finding for " + UNBUILT_SLUG,
    );
    assert.strictEqual(warns[0].severity, "warning");
  });

  it("the unbuilt slug does NOT produce an error finding", function () {
    var data = flowWith(dsNode(UNBUILT_SLUG));
    var result = validate.validate(data, QUIET);
    var errs = result.findings.filter(function (f) {
      return f.severity === "error" && f.kind !== "missing-justification";
    });
    assert.strictEqual(
      errs.length,
      0,
      UNBUILT_SLUG + " is in the registry so must not produce any error",
    );
  });

  it("the unbuilt slug does NOT trigger unknown-component", function () {
    var data = flowWith(dsNode(UNBUILT_SLUG));
    var result = validate.validate(data, QUIET);
    var unknownComp = result.findings.filter(function (f) {
      return f.kind === "unknown-component";
    });
    assert.strictEqual(
      unknownComp.length,
      0,
      "DS nodes without ref must not trigger unknown-component",
    );
  });
});

// ---------------------------------------------------------------------------
// Test 3: built dsSlug ("button") → no error, no warning
// ---------------------------------------------------------------------------
describe("validate-ds-nodes: built dsSlug clean (button)", function () {
  it("button dsSlug produces no unknown-ds-slug or ds-slug-unbuilt findings", function () {
    var data = flowWith(dsNode("button"));
    var result = validate.validate(data, QUIET);
    var dsFindings = result.findings.filter(function (f) {
      return f.kind === "unknown-ds-slug" || f.kind === "ds-slug-unbuilt";
    });
    assert.strictEqual(
      dsFindings.length,
      0,
      "built slug must produce zero ds-node findings",
    );
  });

  it("button dsSlug produces no error findings at all", function () {
    var data = flowWith(dsNode("button"));
    var result = validate.validate(data, QUIET);
    var errs = result.findings.filter(function (f) {
      return f.severity === "error";
    });
    assert.strictEqual(
      errs.length,
      0,
      "clean built DS node must produce no errors",
    );
  });
});

// ---------------------------------------------------------------------------
// Test 4: DS node without ref does NOT trigger FM ref-based checks
// ---------------------------------------------------------------------------
describe("validate-ds-nodes: no ref → no FM ref checks fire", function () {
  it("library:ds node without ref field does not trigger unknown-component", function () {
    // Explicit: node has library:"ds" but no ref property at all
    var node = {
      type: "INSTANCE",
      library: "ds",
      dsSlug: "button",
      props: { Label: "Go" },
    };
    assert.strictEqual(node.ref, undefined, "fixture must have no ref");
    var data = flowWith(node);
    var result = validate.validate(data, QUIET);
    var unknownComp = result.findings.filter(function (f) {
      return f.kind === "unknown-component";
    });
    assert.strictEqual(
      unknownComp.length,
      0,
      "no ref on DS node must not trigger unknown-component",
    );
  });

  it("library:ds node without ref does not trigger missing-required-override", function () {
    var node = {
      type: "INSTANCE",
      library: "ds",
      dsSlug: "button",
      props: { Label: "Go" },
    };
    var data = flowWith(node);
    var result = validate.validate(data, QUIET);
    var overrideFindings = result.findings.filter(function (f) {
      return f.kind === "missing-required-override";
    });
    assert.strictEqual(
      overrideFindings.length,
      0,
      "no ref → no required-override check",
    );
  });
});
