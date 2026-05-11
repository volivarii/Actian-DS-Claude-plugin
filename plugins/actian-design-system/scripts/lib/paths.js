"use strict";

/**
 * paths.js — Manifest-driven vendor path resolver.
 *
 * Reads vendor/paths-manifest.json at module load and builds the PATHS
 * object via dot-notation walker + collection function builders.
 * Plugin-derived overlays (component mirrors written post-vendor by
 * render-component-reference.js) are added on top.
 *
 * Spec: docs/superpowers/specs/2026-05-10-manifest-and-tag-pin-design.md
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

var SUPPORTED_SCHEMA_VERSION = "v1";

function setNested(obj, parts, value) {
  var cursor = obj;
  for (var i = 0; i < parts.length - 1; i++) {
    var part = parts[i];
    if (cursor[part] !== undefined && typeof cursor[part] !== "object") {
      throw new Error(
        "paths.js: dot-notation key conflict — '" +
          parts.join(".") +
          "' cannot coexist with a leaf at '" +
          parts.slice(0, i + 1).join(".") +
          "'",
      );
    }
    cursor[part] = cursor[part] || {};
    cursor = cursor[part];
  }
  var leaf = parts[parts.length - 1];
  if (cursor[leaf] !== undefined) {
    throw new Error(
      "paths.js: dot-notation key conflict — '" +
        parts.join(".") +
        "' is already set",
    );
  }
  cursor[leaf] = value;
}

function buildPathsFromManifest(manifest, vendorRoot) {
  if (manifest.manifest_schema_version !== SUPPORTED_SCHEMA_VERSION) {
    throw new Error(
      "paths.js: expected manifest_schema_version '" +
        SUPPORTED_SCHEMA_VERSION +
        "', found '" +
        manifest.manifest_schema_version +
        "'. Plugin must be upgraded.",
    );
  }

  var out = {};
  var paths = manifest.paths || {};
  for (var name in paths) {
    var entry = paths[name];
    if (!entry.path) {
      throw new Error("paths.js: entry '" + name + "' missing 'path' field");
    }
    if (!entry.type) {
      throw new Error("paths.js: entry '" + name + "' missing 'type' field");
    }
    if (!entry.origin) {
      throw new Error(
        "paths.js: entry '" + name + "' missing 'origin' field",
      );
    }
    if (!entry.description) {
      throw new Error(
        "paths.js: entry '" + name + "' missing 'description' field",
      );
    }
    setNested(out, name.split("."), path.join(vendorRoot, entry.path));
  }

  var collections = manifest.collections || {};
  for (var collName in collections) {
    var coll = collections[collName];
    if (!coll.dir) {
      throw new Error(
        "paths.js: collection '" + collName + "' missing 'dir' field",
      );
    }
    if (!coll.pattern) {
      throw new Error(
        "paths.js: collection '" + collName + "' missing 'pattern' field",
      );
    }
    var dir = path.join(vendorRoot, coll.dir);
    setNested(
      out,
      collName.split("."),
      (function (collDir, pattern) {
        return function (slug) {
          return path.join(collDir, pattern.replace("{slug}", slug));
        };
      })(dir, coll.pattern),
    );
  }

  return out;
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

// Top-level convenience constants (not in manifest — direct access for plugin internals).
PATHS.pluginRoot = PLUGIN_ROOT;
PATHS.vendor = VENDOR;

// Compat: legacy field name some consumers may use
PATHS.foundations = PATHS.foundations || {};
PATHS.foundations.distDir = path.join(VENDOR, "foundations", "dist");

module.exports = PATHS;
module.exports.buildPathsFromManifest = buildPathsFromManifest;
module.exports.SUPPORTED_SCHEMA_VERSION = SUPPORTED_SCHEMA_VERSION;
