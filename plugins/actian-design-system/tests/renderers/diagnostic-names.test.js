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
    assert.match(
      result.stdout,
      /\.name\s*=\s*"Table \(renderTable\)";/,
      'stdout must contain `.name = "Table (renderTable)";` exactly — the eval-lane A8 assertion depends on this literal.',
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
    assert.match(
      result.stdout,
      /\.name\s*=\s*"Token: "\s*\+\s*"--zen-spacing-lg";/,
      'stdout must contain a `.name = "Token: " + "--zen-…";` concatenation — the eval-lane A8 assertion reads the runtime concatenated value via get_metadata, but the test pins the source emit form.',
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
    assert.match(
      result.stdout,
      /\.name\s*=\s*"Swatch stack";/,
      'stdout must contain `.name = "Swatch stack";` — the vertical text-stack inside emitColorSwatchCell.',
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
    assert.match(
      result.stdout,
      /_pill\.name\s*=\s*"Token: "\s*\+\s*"--zen-color-bg-default";/,
      'stdout must contain `_pill.name = "Token: " + "--zen-color-bg-default";` — keeps the swatch pill consistent with emitTokenPillCell so A8\'s secondary "Token: --zen-…" pill count is uniform.',
    );
  });
});
