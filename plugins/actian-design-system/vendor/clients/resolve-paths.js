"use strict";

// resolve-paths.js — canonical manifest→PATHS resolver core (the substrate's
// reference reader). Generic + dependency-free: given a vendor root containing
// paths-manifest.json, returns the dot-walked PATHS object (leaves = file
// paths, collections = (slug)=>path functions). Consumers IMPORT this from
// their vendored copy and add their own overlays + vendor-integrity checks.
// Factored verbatim from the plugin's scripts/lib/paths.js (the core walker is
// unchanged); consumer-specific bits (integrity check, overlays) intentionally
// excluded.

var fs = require("fs");
var path = require("path");

var SUPPORTED_SCHEMA_VERSION = "v1";

// The ONLY definition of "can this collection pattern address a member".
// Exported so scripts/validate-manifest.js gates on the same rule the resolver
// enforces at runtime: a gate that disagrees with the code it protects is the
// exact failure mode the resolvable-pattern check exists to prevent.
//   "{name}"           caller supplies the whole path relative to dir
//   ...{slug}...       resolver substitutes the slug
// Anything else describes the layout for enumeration and must declare
// "resolvable": false in the manifest.
function isResolvablePattern(pattern) {
  if (typeof pattern !== "string") return false;
  return pattern === "{name}" || pattern.indexOf("{slug}") !== -1;
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
      // collName/coll are `var` loop bindings, so every value the closure needs
      // is passed in as a parameter rather than captured: a captured binding
      // would hold the LAST iteration's value for every collection.
      (function (collDir, collRoot, name, declaredColl) {
        // NOT named `entry`: the sub-directory walk below declares `var entry`,
        // which is function-scoped and would hoist over this parameter.
        var pattern = declaredColl.pattern;
        var declaredDir = declaredColl.dir;
        return function (slug) {
          // A "{name}" collection addresses a member by its path RELATIVE to
          // dir ("ds-base.css", "html-renderers/ds-html-map.js"): no extension
          // to append, and with recursive:true no sub-dir walk, because the
          // caller supplies the whole relative path. Handled before the {slug}
          // branch, which would otherwise leave "{name}" unsubstituted and fall
          // through to the "<slug>.md" walk, returning null for every input.
          if (pattern === "{name}") {
            if (typeof slug !== "string" || slug === "") {
              throw new Error(
                "resolve-paths.js: collection '" +
                  name +
                  "' needs a member name (a path relative to " +
                  declaredDir +
                  "), got " +
                  JSON.stringify(slug),
              );
            }
            // Lexical containment only: path.resolve does not follow symlinks,
            // so this rejects "../" traversal, not a symlinked member. The
            // collection is vendored content and names come from our own code,
            // so that is the intended boundary.
            var resolvedName = path.resolve(collRoot, slug);
            if (
              resolvedName === collRoot ||
              resolvedName.indexOf(collRoot + path.sep) !== 0
            ) {
              throw new Error(
                "resolve-paths.js: '" +
                  slug +
                  "' escapes the collection directory " +
                  collDir,
              );
            }
            return resolvedName;
          }

          // A pattern with no {slug} token cannot address a member: the
          // substitution below is a no-op for it. Two such shapes exist in the
          // manifest and BOTH used to fail silently, which is how the {name}
          // bug above survived undetected for three phases:
          //   "<topSlug>/.../<slug>.json"  angle brackets, so no braces remain
          //     and the check below passed the pattern through VERBATIM,
          //     handing back a literal ".../<topSlug>/.../<slug>.json".
          //   "{name}.json"                braces remain, so it fell to the
          //     "<slug>.md" walk and returned null for every input.
          // These are descriptive patterns (they document the layout for
          // enumeration) and are not resolvable. Fail loudly rather than
          // returning a fabricated path or a null that reads as "not found".
          if (!isResolvablePattern(pattern)) {
            // validate-manifest.js gates this at PR time, so reaching here
            // means either a declared-descriptive collection was called, or a
            // consumer is running against a manifest older than that gate.
            if (declaredColl.resolvable === false) {
              throw new Error(
                "resolve-paths.js: collection '" +
                  name +
                  "' is declared descriptive-only (resolvable: false). Its " +
                  "pattern '" +
                  pattern +
                  "' documents the layout for enumeration and cannot address " +
                  "a member, so read the directory directly instead.",
              );
            }
            throw new Error(
              "resolve-paths.js: collection '" +
                name +
                "' declares pattern '" +
                pattern +
                "', which cannot address a member: it does not vary by slug. " +
                "Resolvable forms: a pattern containing {slug}, or exactly " +
                "{name} (caller supplies the path relative to dir). Set " +
                "'resolvable: false' on the collection if it is descriptive.",
            );
          }

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
      })(dir, path.resolve(dir), collName, coll),
    );
  }

  return out;
}

// Read <vendorRoot>/paths-manifest.json and build the PATHS object. The single
// entry point consumers call (then layer their own overlays on the result).
function buildPaths(vendorRoot) {
  var manifestPath = path.join(vendorRoot, "paths-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      "resolve-paths.js: manifest not found at " +
        manifestPath +
        ". Check vendorRoot or re-run the vendor snapshot.",
    );
  }
  var raw = fs.readFileSync(manifestPath, "utf8");
  var manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      "resolve-paths.js: manifest at " +
        manifestPath +
        " failed to parse: " +
        err.message,
    );
  }
  return buildPathsFromManifest(manifest, vendorRoot);
}

module.exports = {
  buildPaths: buildPaths,
  isResolvablePattern: isResolvablePattern,
  buildPathsFromManifest: buildPathsFromManifest,
  SUPPORTED_SCHEMA_VERSION: SUPPORTED_SCHEMA_VERSION,
};
