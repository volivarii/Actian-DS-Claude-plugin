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

// Null-prototype so a slug colliding with an Object.prototype name cannot
// resolve through the prototype.
var NO_RENAMES = Object.create(null);

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

// Builds { retiredSlug: currentSlug } from the identity ledger
// (components/dist/identity.json). A consumer that still addresses a component
// by the slug it had before a Figma display-name change resolves through this
// instead of breaking, which is what stops a rename from being a migration
// across three repositories.
//
// A slug that is CURRENT for some component is never treated as retired, even
// if another component used to carry it: a name can be freed and reused, and the
// live component has to win.
// Both maps are null-prototype: they are keyed by slug, and a slug colliding
// with a name on Object.prototype would otherwise resolve through the prototype.
// `renameMap["constructor"]` returns Object itself, which is truthy, and the
// path would become the stringified function.
function buildRenameIndex(ledger) {
  // Shape-tolerant on purpose. readLedger below already treats an unreadable
  // ledger as "no renames" so a bad file cannot wedge a consumer, and a
  // JSON-valid ledger with the wrong shape has to degrade the same way: the
  // schema gates this repo's CI, not a snapshot already vendored somewhere.
  var raw = ledger && ledger.entries;
  var entries = raw && typeof raw === "object" ? raw : {};
  var current = Object.create(null);
  Object.keys(entries).forEach(function (id) {
    var slug = entries[id] && entries[id].slug;
    if (typeof slug === "string" && slug) current[slug] = true;
  });

  // A retired slug two identities both claim is dropped rather than resolved to
  // whichever key sorts later: two components can have carried the same name at
  // different times, and guessing between them resolves silently to an arbitrary
  // one. Ambiguous means unmapped, which fails the way it did before the ledger
  // existed instead of failing invisibly.
  var retired = Object.create(null);
  var ambiguous = Object.create(null);
  Object.keys(entries).forEach(function (id) {
    var e = entries[id] || {};
    var history = Array.isArray(e.previousSlugs) ? e.previousSlugs : [];
    history.forEach(function (was) {
      if (typeof was !== "string" || !was) return;
      if (typeof e.slug !== "string" || !e.slug) return;
      if (current[was]) return;
      if (retired[was] !== undefined && retired[was] !== e.slug) {
        ambiguous[was] = true;
        return;
      }
      retired[was] = e.slug;
    });
  });
  Object.keys(ambiguous).forEach(function (was) {
    delete retired[was];
  });
  return retired;
}

function buildPathsFromManifest(manifest, vendorRoot, ledger) {
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

  var renames = buildRenameIndex(ledger);

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
      (function (collDir, collRoot, name, declaredColl, renameMap) {
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

          // A slug the component was renamed away from resolves to the slug it
          // answers to now. Applied only in the {slug} branch: a {name}
          // collection above takes a path, not a component identity.
          var effective = renameMap[slug] || slug;

          // Substitute {slug}; if no other placeholders remain, join + return.
          var resolved = pattern.replace("{slug}", effective);
          if (!/\{[^}]+\}/.test(resolved)) {
            var mapped = path.join(collDir, resolved);
            if (effective === slug) return mapped;
            // Renaming must never LOSE a path that resolved before. Several
            // collections are named after the authored components/src/<slug>/
            // directory rather than the registry slug (guideline docs and the
            // usage notes derived from them), and a Figma rename moves only the
            // registry slug, so the file on disk keeps the old name. Prefer the
            // current name when it exists, fall back to the name asked for when
            // that is the one on disk, and otherwise return the current name so
            // the resulting ENOENT names the component as it is now called.
            if (fs.existsSync(mapped)) return mapped;
            var asAsked = path.join(collDir, pattern.replace("{slug}", slug));
            if (fs.existsSync(asAsked)) return asAsked;
            return mapped;
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
            var candidate = path.join(sub, effective + ".md");
            if (fs.existsSync(candidate)) return candidate;
          }
          return null;
        };
      })(
        dir,
        path.resolve(dir),
        collName,
        coll,
        // Rename history is applied ONLY to collections a manifest declares as
        // keyed by a component slug. The ledger's namespace is Figma components,
        // and 7 of the 15 {slug} collections key on something else (a11y topics,
        // app-context records, categories, content sections, foundations, icons).
        // Eight of those slugs already collide with component slugs (api-key,
        // dataset, field, lineage, scanner, suggestion, template, user-group), so
        // an unscoped map sends an unrelated, never-renamed file to the wrong path
        // or to null. Undeclared means untouched, which is the safe default.
        coll.slugNamespace === "component" ? renames : NO_RENAMES,
      ),
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
  return buildPathsFromManifest(manifest, vendorRoot, readLedger(vendorRoot));
}

// The identity ledger is optional on purpose: snapshots vendored before it
// existed have no such file, and resolution must carry on for them rather than
// throw. A malformed ledger is also non-fatal, for the same reason a stale
// snapshot should keep working, but it is not swallowed either: resolution
// proceeds with no renames and the reason is stated on stderr, because a
// consumer silently losing rename resolution would look identical to having no
// renames at all.
function readLedger(vendorRoot) {
  var ledgerPath = path.join(vendorRoot, "components", "dist", "identity.json");
  if (!fs.existsSync(ledgerPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
  } catch (err) {
    console.error(
      "resolve-paths.js: identity ledger at " +
        ledgerPath +
        " failed to parse (" +
        err.message +
        "). Resolving without rename history.",
    );
    return null;
  }
}

module.exports = {
  buildPaths: buildPaths,
  buildRenameIndex: buildRenameIndex,
  isResolvablePattern: isResolvablePattern,
  buildPathsFromManifest: buildPathsFromManifest,
  SUPPORTED_SCHEMA_VERSION: SUPPORTED_SCHEMA_VERSION,
};
