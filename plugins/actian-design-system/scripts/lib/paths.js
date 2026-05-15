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
var VENDORED_JSON_PATH = path.join(PLUGIN_ROOT, "vendored.json");

var SUPPORTED_SCHEMA_VERSION = "v1";

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
      throw new Error("paths.js: entry '" + name + "' missing 'origin' field");
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
          // Substitute {slug}; if no other placeholders remain, join + return.
          var resolved = pattern.replace("{slug}", slug);
          if (!/\{[^}]+\}/.test(resolved)) {
            return path.join(collDir, resolved);
          }
          // Pattern has additional placeholders (e.g. {bucket}/{slug}.md for
          // recursive collections). Walk one level of sub-dirs and return the
          // first match. Slugs are unique across sub-buckets by convention —
          // if that ever changes, this needs to return all matches instead.
          var entries = fs.existsSync(collDir) ? fs.readdirSync(collDir) : [];
          for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var sub = path.join(collDir, entry);
            try {
              if (!fs.statSync(sub).isDirectory()) continue;
            } catch (e) {
              continue;
            }
            var candidate = path.join(sub, slug + ".md");
            if (fs.existsSync(candidate)) return candidate;
          }
          return null;
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
