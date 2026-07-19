#!/usr/bin/env node
"use strict";
// Anatomy loading + the shared ratio-floor gate.
//
// The former slug→html anatomy-tree renderer (renderAnatomy/renderNode/
// tokenDecls, "path c") was retired in Group C: it is superseded by
// appearance-render.js's captured-appearance renderer (Phase 1B). The
// token-injection sidecar-reading chain that used to live here (path b:
// loadTokenBindings/pickBinding/resolveTokenDecls/resolveRootTokenStyle) was
// retired in Task A3 (branch feat/retire-tag-default-path-b): Task A2
// re-sourced buildDsVariantStyleMap's variant colors from the appearance
// layer instead, so path b had no remaining production caller.
var fs = require("fs");
var path = require("path");
// Relocation phase 1: lib/paths lives only in the plugin. In knowledge the fact
// loader is injected, so a missing lib/paths must degrade to null rather than throw
// at load. The default anatomy readers below are already wrapped in try/catch, so a
// null PATHS there yields null (an honest "no anatomy"), never a crash.
var PATHS = null;
try {
  PATHS = require(path.join(__dirname, "..", "lib", "paths.js"));
} catch (e) {
  PATHS = null;
}

function loadAnatomy(slug, loader) {
  if (typeof loader === "function") return loader(slug);
  try {
    return JSON.parse(
      fs.readFileSync(PATHS.components.anatomy.byKey(slug), "utf8"),
    );
  } catch (e) {
    return null;
  }
}

// Ratio floor gate, shared by ds-coverage-report.js's coverage() and
// buildDsAnatomyDocMap's R2 floor (ds-anatomy-map.js). Strict mode (default):
// missing/non-numeric ratio fails unless minRatio <= 0. opts.keepMissingRatio
// flips that one case to PASS (used by R2, which keeps synthetic/hand-built
// docs that carry no quality.ratio at all); a numeric ratio is always
// compared to minRatio the same way in both modes.
function passesRatioGate(ratio, minRatio, opts) {
  opts = opts || {};
  if (typeof ratio !== "number") {
    return opts.keepMissingRatio ? true : 0 >= minRatio;
  }
  return ratio >= minRatio;
}

module.exports = {
  loadAnatomy: loadAnatomy,
  passesRatioGate: passesRatioGate,
};
