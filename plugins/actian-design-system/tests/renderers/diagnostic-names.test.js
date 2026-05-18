#!/usr/bin/env node
"use strict";

/**
 * diagnostic-names.test.js — Pin the diagnostic frame names produced by
 * render-figma.js for use by the eval-lane A8 assertion (renderTable
 * invocation rate). If these strings ever drift, the eval-lane grader's
 * adoption-rate measurement silently breaks. This test makes any drift loud.
 *
 * The eval-lane A8 assertion in evals/component-brief/grader.md reads
 * frame metadata via get_metadata. At Figma runtime the names are:
 *   - "Table (renderTable)"      (one per table render)
 *   - "Token: --zen-…"           (one per token-pill cell)
 *
 * The renderer EMITS source JS that produces those names at runtime.
 * For "Table" the source is a literal; for "Token" the source is a
 * concatenation expression (`"Token: " + tokenName`). This test pins
 * the source form because that's what render-figma.js writes; any
 * emit-form change (e.g. switching to a pre-concatenated literal)
 * will trip the regex and force a coordinated update with the
 * grader procedure.
 *
 * Run with: node tests/renderers/diagnostic-names.test.js
 * (from the plugins/actian-design-system directory)
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var { spawnSync } = require("child_process");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var RENDERER = path.join(
  PLUGIN_ROOT,
  "scripts",
  "renderers",
  "figma-table",
  "render-figma.js",
);

function runRendererWithSpec(spec, parentId) {
  var result = spawnSync(
    process.execPath,
    [RENDERER, "--parent-id", parentId],
    { input: JSON.stringify(spec), encoding: "utf8" },
  );
  return result;
}

describe("render-figma diagnostic names", function () {
  it("emits a top-level frame named 'Table (renderTable)'", function () {
    var spec = {
      schemaVersion: "2026.05",
      headers: ["Property", "Token", "Value"],
      rows: [
        {
          cells: [
            { type: "text", value: "Box width" },
            { type: "token-pill", value: "--zen-spacing-lg" },
            { type: "text", value: "24px" },
          ],
        },
      ],
    };
    var result = runRendererWithSpec(spec, "0:1");
    assert.strictEqual(
      result.status,
      0,
      "renderer exited non-zero. stderr=" + result.stderr,
    );
    // v1.87.0: name now lives inside createAutoLayout's props object (object-property form),
    // not the prior `.name = "X";` assignment form. Runtime .name at Figma is unchanged —
    // createAutoLayout({ name: ... }) sets the property identically — so the A8 grader
    // (which reads via get_metadata) still works.
    assert.match(
      result.stdout,
      /name:\s*"Table \(renderTable\)"/,
      'stdout must contain `name: "Table (renderTable)"` in the createAutoLayout props — the eval-lane A8 assertion reads the runtime value via get_metadata.',
    );
  });

  it("emits per-token-pill frames named 'Token: --zen-…'", function () {
    var spec = {
      schemaVersion: "2026.05",
      headers: ["Property", "Token"],
      rows: [
        {
          cells: [
            { type: "text", value: "Box width" },
            { type: "token-pill", value: "--zen-spacing-lg" },
          ],
        },
      ],
    };
    var result = runRendererWithSpec(spec, "0:1");
    assert.strictEqual(result.status, 0);
    // The renderer emits a JS concatenation expression (line 651:
    //   pillVar + '.name = "Token: " + ' + jsString(cell.value) + ";"
    // ), not a pre-concatenated literal. At Figma runtime the
    // resulting `.name` value is "Token: --zen-spacing-lg" — which
    // is what the eval-lane A8 grader reads via get_metadata. The
    // test pins the SOURCE form because that's what render-figma.js
    // emits; any change to the emit form (e.g. inlining the literal)
    // will trip this regex and force a coordinated update with the
    // grader procedure in evals/component-brief/grader.md.
    // v1.87.0: name now lives inside createAutoLayout's props object — the concatenation
    // expression `"Token: " + tokenName` is unchanged, but the leading `.name =` is now
    // `name:`. Runtime .name at Figma is identical.
    assert.match(
      result.stdout,
      /name:\s*"Token: "\s*\+\s*"--zen-spacing-lg"/,
      'stdout must contain a `name: "Token: " + "--zen-…"` concatenation in the createAutoLayout props — the eval-lane A8 assertion reads the runtime concatenated value via get_metadata.',
    );
  });

  it("emits a named dot frame for color-swatch cells", function () {
    var spec = {
      schemaVersion: "2026.05",
      headers: ["Token", "Color"],
      rows: [
        {
          cells: [
            { type: "text", value: "Primary" },
            {
              type: "color-swatch",
              color: "#0066ff",
              hex: "#0066ff",
              tokenName: "--zen-color-bg-default",
            },
          ],
        },
      ],
    };
    var result = runRendererWithSpec(spec, "0:1");
    assert.strictEqual(
      result.status,
      0,
      "renderer exited non-zero. stderr=" + result.stderr,
    );
    assert.match(
      result.stdout,
      /\.name\s*=\s*"Swatch dot";/,
      'stdout must contain `.name = "Swatch dot";` — A1 grader counts unnamed frames as anonymity, and the swatch dot is one of three sub-frames inside emitColorSwatchCell.',
    );
  });

  it("emits a named stack frame for color-swatch cells", function () {
    var spec = {
      schemaVersion: "2026.05",
      headers: ["Token", "Color"],
      rows: [
        {
          cells: [
            { type: "text", value: "Primary" },
            {
              type: "color-swatch",
              color: "#0066ff",
              hex: "#0066ff",
              tokenName: "--zen-color-bg-default",
            },
          ],
        },
      ],
    };
    var result = runRendererWithSpec(spec, "0:1");
    assert.strictEqual(result.status, 0);
    // v1.87.0: name now lives inside createAutoLayout's props object.
    assert.match(
      result.stdout,
      /name:\s*"Swatch stack"/,
      'stdout must contain `name: "Swatch stack"` in the createAutoLayout props — the vertical text-stack inside emitColorSwatchCell.',
    );
  });

  it("emits a Token-named pill frame inside color-swatch cells when tokenName is set", function () {
    var spec = {
      schemaVersion: "2026.05",
      headers: ["Token", "Color"],
      rows: [
        {
          cells: [
            { type: "text", value: "Primary" },
            {
              type: "color-swatch",
              color: "#0066ff",
              hex: "#0066ff",
              tokenName: "--zen-color-bg-default",
            },
          ],
        },
      ],
    };
    var result = runRendererWithSpec(spec, "0:1");
    assert.strictEqual(result.status, 0);
    // v1.87.0: name now lives inside the createAutoLayout(...) call for _pill.
    // The matcher is loosened (no leading `_pill\.`) because the createAutoLayout
    // call assigns the result to `var <cellVar>_pill`, so the `name:` line appears
    // in the createAutoLayout props rather than as a separate `_pill.name = ...`
    // statement. The "Token: ..." concatenation is unchanged.
    assert.match(
      result.stdout,
      /name:\s*"Token: "\s*\+\s*"--zen-color-bg-default"/,
      'stdout must contain `name: "Token: " + "--zen-color-bg-default"` inside the swatch-cell pill\'s createAutoLayout props — keeps it consistent with emitTokenPillCell so A8\'s secondary pill count is uniform.',
    );
  });
});
