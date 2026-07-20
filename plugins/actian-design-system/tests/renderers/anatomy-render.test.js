#!/usr/bin/env node
"use strict";
// anatomy-render.js: Group C retired the slug→html tree renderer
// (renderAnatomy/renderNode/tokenDecls, "path c"); it's superseded by
// appearance-render.js's captured-appearance renderer (Phase 1B). Task A3
// (branch feat/retire-tag-default-path-b) retired the token-injection
// sidecar-reading chain (path b: loadTokenBindings/pickBinding/
// resolveTokenDecls/resolveRootTokenStyle) that this file used to exercise.
// This file now only exercises the two surviving exports: loadAnatomy (still
// used by ds-coverage-report.js and by ds-anatomy-map.js's variant-color
// builder) and passesRatioGate (shared ratio-floor gate).
var { test } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var ar = require("../../scripts/lib/renderer.js").anatomyRender;

test("loadAnatomy: delegates to an injected loader with the slug", () => {
  var seen = null;
  var doc = { root: { id: "r" }, quality: { ratio: 1 } };
  var result = ar.loadAnatomy("tag-default", (slug) => {
    seen = slug;
    return doc;
  });
  assert.strictEqual(seen, "tag-default");
  assert.strictEqual(result, doc);
});

test("loadAnatomy: without a loader, missing/unreadable sidecar returns null", () => {
  assert.strictEqual(ar.loadAnatomy("__no-such-slug-fixture__"), null);
});

test("passesRatioGate: numeric ratio compares against minRatio", () => {
  assert.strictEqual(ar.passesRatioGate(0.8, 0.6), true);
  assert.strictEqual(ar.passesRatioGate(0.4, 0.6), false);
  assert.strictEqual(ar.passesRatioGate(0.6, 0.6), true);
});

test("passesRatioGate: non-numeric ratio fails unless minRatio <= 0", () => {
  assert.strictEqual(ar.passesRatioGate(undefined, 0.6), false);
  assert.strictEqual(ar.passesRatioGate("n/a", 0.6), false);
  assert.strictEqual(ar.passesRatioGate(undefined, 0), true);
});

test("passesRatioGate: opts.keepMissingRatio flips the missing-ratio case to pass", () => {
  assert.strictEqual(
    ar.passesRatioGate(undefined, 0.6, { keepMissingRatio: true }),
    true,
  );
  // A numeric ratio is still compared normally even with keepMissingRatio set.
  assert.strictEqual(
    ar.passesRatioGate(0.1, 0.6, { keepMissingRatio: true }),
    false,
  );
});
