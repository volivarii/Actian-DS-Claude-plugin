"use strict";

/**
 * paths.js — Manifest-driven vendor path resolver (thin wrapper).
 *
 * Reads vendor/paths-manifest.json at module load and builds the PATHS object.
 * The GENERIC manifest→PATHS walker (schema-version check, dot-notation
 * setNested, collection function builders) is single-sourced from the
 * substrate's reference reader (vendor/clients/resolve-paths.js, imported
 * below) — refreshed every vendor pull, zero drift. This wrapper adds the
 * plugin-specific layers: the vendor-integrity check + the plugin-derived
 * overlays (component mirrors written post-vendor by render-component-reference.js,
 * byKit/bySlug ergonomics, convenience constants).
 *
 * Spec: docs/superpowers/specs/2026-05-10-manifest-and-tag-pin-design.md +
 *       docs/superpowers/specs/2026-06-02-shared-consumption-client-design.md
 *
 * Note on caching: PATHS is built once per Node process at module load.
 * Plugin processes are short-lived (per skill invocation), so vendor
 * changes between processes are picked up on the next invocation.
 */

var fs = require("fs");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var VENDOR = path.join(PLUGIN_ROOT, "vendor");
var MANIFEST_PATH = path.join(VENDOR, "paths-manifest.json");
var VENDORED_JSON_PATH = path.join(PLUGIN_ROOT, "vendored.json");

// Generic manifest→PATHS resolver core — single-sourced from the vendored
// substrate reference reader. IMPORTING the vendored copy (vs maintaining our
// own) is safe: it's read-only runtime code that doesn't mutate the tree, and
// it's refreshed on every vendor pull. The plugin-specific integrity check +
// overlays stay here in the wrapper.
var resolverCore = require(path.join(VENDOR, "clients", "resolve-paths.js"));
var buildPathsFromManifest = resolverCore.buildPathsFromManifest;
var SUPPORTED_SCHEMA_VERSION = resolverCore.SUPPORTED_SCHEMA_VERSION;

// Strip leading "v" so git tag "v0.3.1" compares equal to
// package.json#version "0.3.1".
function normalizeVersion(v) {
  if (v == null) return null;
  return String(v).replace(/^v/, "");
}

// Vendor-integrity check — confirms the vendored manifest's
// knowledge_version matches what vendored.json says it pulled.
// Catches partial / corrupted / out-of-band-modified vendor snapshots.
// Skipped silently when:
//   - vendored.json is missing (legacy plugin layout pre-v1.79.5), OR
//   - resolved_version is null (snapshot done via --sha for incident
//     recovery, not via tag-range resolution)
function verifyVendorIntegrity(manifest, vendoredJsonPath) {
  if (!fs.existsSync(vendoredJsonPath)) return;
  var vendored;
  try {
    vendored = JSON.parse(fs.readFileSync(vendoredJsonPath, "utf8"));
  } catch (err) {
    // Don't compound errors — let downstream JSON validation surface this.
    return;
  }
  var resolved = vendored.knowledge_repo_resolved_version;
  if (!resolved) return;
  var manifestV = normalizeVersion(manifest.knowledge_version);
  var resolvedV = normalizeVersion(resolved);
  if (manifestV !== resolvedV) {
    throw new Error(
      "paths.js: vendor-integrity check failed — manifest says " +
        "knowledge_version='" +
        manifest.knowledge_version +
        "' but vendored.json says resolved_version='" +
        resolved +
        "'. Vendor snapshot may be partial, corrupted, or modified out " +
        "of band. Re-run scripts/vendor/vendor-snapshot.js --range.",
    );
  }
}

function loadAndBuildPaths() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(
      "paths.js: manifest not found at " +
        MANIFEST_PATH +
        ". Run vendor-snapshot.yml or pull the latest plugin tree.",
    );
  }
  var raw = fs.readFileSync(MANIFEST_PATH, "utf8");
  var manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      "paths.js: manifest at " +
        MANIFEST_PATH +
        " failed to parse: " +
        err.message,
    );
  }
  verifyVendorIntegrity(manifest, VENDORED_JSON_PATH);
  return buildPathsFromManifest(manifest, VENDOR);
}

var PATHS = loadAndBuildPaths();

// Plugin-derived overlays — files written post-vendor by the plugin's
// render-component-reference.js. NOT in the upstream manifest (knowledge
// repo doesn't ship them); plugin's concern.
PATHS.components = PATHS.components || {};
PATHS.components.mirrors = {
  ds: path.join(VENDOR, "components", "dist", "dskit-components.md"),
  fm: path.join(VENDOR, "components", "dist", "fm-components.md"),
  metaKit: path.join(VENDOR, "components", "dist", "meta-kit", "components.md"),
};

// Synthesized helper: byKit("ds"/"fm"/"meta") maps to registry leaf paths.
// Preserved from pre-manifest API for backward compat with validate-flow-data.js etc.
PATHS.components.registries = PATHS.components.registries || {};
PATHS.components.registries.byKit = function (kit) {
  if (kit === "ds") return PATHS.components.registries.dskit;
  if (kit === "fm") return PATHS.components.registries.fmkit;
  if (kit === "meta") return PATHS.components.registries.metakit;
  throw new Error(
    "PATHS.components.registries.byKit: unknown kit '" +
      kit +
      "' (expected 'ds', 'fm', or 'meta')",
  );
};

// Content section resolver alias. The manifest's `content.section`
// collection auto-builds PATHS.content.section as a (slug) => path
// function. Expose it as `bySlug` to mirror the `byKit` ergonomics
// callers already know.
PATHS.content = PATHS.content || {};
if (typeof PATHS.content.section === "function") {
  PATHS.content.bySlug = PATHS.content.section;
}

// Top-level convenience constants (not in manifest — direct access for plugin internals).
PATHS.pluginRoot = PLUGIN_ROOT;
PATHS.vendor = VENDOR;

// Compat: legacy field name some consumers may use
PATHS.foundations = PATHS.foundations || {};
PATHS.foundations.distDir = path.join(VENDOR, "foundations", "dist");

module.exports = PATHS;
module.exports.buildPathsFromManifest = buildPathsFromManifest;
module.exports.verifyVendorIntegrity = verifyVendorIntegrity;
module.exports.normalizeVersion = normalizeVersion;
module.exports.SUPPORTED_SCHEMA_VERSION = SUPPORTED_SCHEMA_VERSION;
