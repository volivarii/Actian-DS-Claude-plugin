#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var rules = require(
  path.join(__dirname, "..", "validation", "component-property-rules.js"),
);

// ---------------------------------------------------------------------------
// Component key diffing
// ---------------------------------------------------------------------------

function diffComponentKeys(prevKeys, currKeys) {
  var prevSet = {};
  var currSet = {};
  var i;
  for (i = 0; i < prevKeys.length; i++) prevSet[prevKeys[i]] = true;
  for (i = 0; i < currKeys.length; i++) currSet[currKeys[i]] = true;

  var added = currKeys.filter(function (k) {
    return !prevSet[k];
  });
  var removed = prevKeys.filter(function (k) {
    return !currSet[k];
  });
  return { added: added, removed: removed };
}

// ---------------------------------------------------------------------------
// Resolve component key → human-readable name
// ---------------------------------------------------------------------------

var _keyNameCache = null;

function buildKeyNameCache() {
  if (_keyNameCache) return _keyNameCache;
  _keyNameCache = {};
  var registries = ["fmkit", "dskit", "metakit"];
  for (var r = 0; r < registries.length; r++) {
    var filePath = path.join(
      PLUGIN_ROOT,
      "docs",
      "generated",
      registries[r] + ".json",
    );
    try {
      var registry = JSON.parse(fs.readFileSync(filePath, "utf8"));
      var store = registry.components || {};
      var slugs = Object.keys(store);
      for (var s = 0; s < slugs.length; s++) {
        var entry = store[slugs[s]];
        if (entry.key) {
          _keyNameCache[entry.key] = entry.name || slugs[s];
        }
      }
    } catch (e) {
      // registry not found — skip
    }
  }
  return _keyNameCache;
}

function resolveKeyName(key) {
  var cache = buildKeyNameCache();
  return cache[key] || key.substring(0, 8) + "...";
}

// ---------------------------------------------------------------------------
// Build changelog
// ---------------------------------------------------------------------------

function buildChangelog(
  prevManifest,
  currSourceHash,
  currTokenHash,
  currComponentKeys,
  currPropertyDefaultsHashes,
) {
  var sourceChanged = prevManifest.sourceHash !== currSourceHash;
  var tokensChanged = prevManifest.tokenHash !== currTokenHash;
  var components = diffComponentKeys(
    prevManifest.componentKeys || [],
    currComponentKeys,
  );

  // Per-kit property-defaults hash comparison
  var propertyDefaultsChanged = { fm: false, ds: false, meta: false };
  if (currPropertyDefaultsHashes && prevManifest.propertyDefaultsHash) {
    var kits = ["fm", "ds", "meta"];
    for (var k = 0; k < kits.length; k++) {
      propertyDefaultsChanged[kits[k]] =
        prevManifest.propertyDefaultsHash[kits[k]] !==
        currPropertyDefaultsHashes[kits[k]];
    }
  }

  var anyDefaultsChanged =
    propertyDefaultsChanged.fm ||
    propertyDefaultsChanged.ds ||
    propertyDefaultsChanged.meta;

  var hasChanges =
    sourceChanged ||
    tokensChanged ||
    components.added.length > 0 ||
    components.removed.length > 0 ||
    anyDefaultsChanged;

  return {
    sourceChanged: sourceChanged,
    tokensChanged: tokensChanged,
    components: components,
    propertyDefaultsChanged: propertyDefaultsChanged,
    hasChanges: hasChanges,
  };
}

// ---------------------------------------------------------------------------
// Format output
// ---------------------------------------------------------------------------

function formatChangelog(result) {
  if (!result.hasChanges) {
    return "Design changelog: no changes since last push\n";
  }

  var lines = ["Design changelog:"];
  lines.push(
    "  Source: " +
      (result.sourceChanged ? "changed (hash mismatch)" : "unchanged"),
  );
  lines.push(
    "  Tokens: " +
      (result.tokensChanged ? "changed (hash mismatch)" : "unchanged"),
  );

  var added = result.components.added;
  var removed = result.components.removed;
  if (added.length === 0 && removed.length === 0) {
    lines.push("  Components: unchanged");
  } else {
    lines.push(
      "  Components: +" +
        added.length +
        " added, -" +
        removed.length +
        " removed",
    );
    for (var i = 0; i < added.length; i++) {
      lines.push(
        "    + " +
          resolveKeyName(added[i]) +
          " (" +
          added[i].substring(0, 8) +
          ")",
      );
    }
    for (var j = 0; j < removed.length; j++) {
      lines.push(
        "    - " +
          resolveKeyName(removed[j]) +
          " (" +
          removed[j].substring(0, 8) +
          ")",
      );
    }
  }

  var defaultsKits = ["fm", "ds", "meta"];
  var changedDefaultsKits = [];
  for (var dk = 0; dk < defaultsKits.length; dk++) {
    if (
      result.propertyDefaultsChanged &&
      result.propertyDefaultsChanged[defaultsKits[dk]]
    ) {
      changedDefaultsKits.push(defaultsKits[dk]);
    }
  }
  if (changedDefaultsKits.length > 0) {
    lines.push(
      "  Property defaults: changed in " + changedDefaultsKits.join(", "),
    );
  } else {
    lines.push("  Property defaults: unchanged");
  }

  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Property defaults hashing + diffing
// ---------------------------------------------------------------------------
//
// Surfaces designer-side edits to Figma component default values that occur
// between syncs. Used at parity-check time to emit a per-component diff line
// when a default text or boolean changes upstream.
// ---------------------------------------------------------------------------

function computePropertyDefaultsHashes(registries) {
  var kits = ["fm", "ds", "meta"];
  var out = {};
  for (var i = 0; i < kits.length; i++) {
    out[kits[i]] = rules.propertyDefaultsHash(
      registries[kits[i]] || { components: {} },
    );
  }
  return out;
}

function diffPropertyDefaults(before, after) {
  var kits = ["fm", "ds", "meta"];
  var out = {};
  for (var i = 0; i < kits.length; i++) {
    var kit = kits[i];
    out[kit] = [];
    var beforeKit = (before && before[kit] && before[kit].components) || {};
    var afterKit = (after && after[kit] && after[kit].components) || {};
    var allSlugs = Object.keys(beforeKit).concat(Object.keys(afterKit));
    var seen = {};
    for (var s = 0; s < allSlugs.length; s++) {
      var slug = allSlugs[s];
      if (seen[slug]) continue;
      seen[slug] = true;
      var beforeProps = (beforeKit[slug] && beforeKit[slug].properties) || {};
      var afterProps = (afterKit[slug] && afterKit[slug].properties) || {};
      var allProps = Object.keys(beforeProps).concat(Object.keys(afterProps));
      var seenProps = {};
      for (var pi = 0; pi < allProps.length; pi++) {
        var p = allProps[pi];
        if (seenProps[p]) continue;
        seenProps[p] = true;
        var bDefault = beforeProps[p] && beforeProps[p].default;
        var aDefault = afterProps[p] && afterProps[p].default;
        if (JSON.stringify(bDefault) !== JSON.stringify(aDefault)) {
          out[kit].push({
            component: slug,
            propName: p,
            before: bDefault === undefined ? null : bDefault,
            after: aDefault === undefined ? null : aDefault,
          });
        }
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  diffComponentKeys: diffComponentKeys,
  resolveKeyName: resolveKeyName,
  buildChangelog: buildChangelog,
  formatChangelog: formatChangelog,
  computePropertyDefaultsHashes: computePropertyDefaultsHashes,
  diffPropertyDefaults: diffPropertyDefaults,
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (require.main === module) {
  var crypto = require("crypto");

  var args = process.argv.slice(2);
  var prevPath = null;
  var sourcePath = null;
  var tokensPath = null;

  for (var a = 0; a < args.length; a++) {
    if (args[a] === "--previous" && args[a + 1]) {
      prevPath = args[++a];
    } else if (args[a] === "--source" && args[a + 1]) {
      sourcePath = args[++a];
    } else if (args[a] === "--tokens" && args[a + 1]) {
      tokensPath = args[++a];
    } else if (args[a] === "--help") {
      process.stdout.write(
        JSON.stringify(
          {
            name: "changelog",
            description:
              "Compare current push state against previous .last-push.json manifest",
            usage:
              "changelog.js --previous <.last-push.json> --source <data.json> --tokens <tokens.json>",
            flags: [
              {
                name: "--previous",
                description: "Path to existing .last-push.json",
              },
              {
                name: "--source",
                description: "Path to current source data file",
              },
              { name: "--tokens", description: "Path to tokens JSON file" },
              { name: "--help", description: "Show this help" },
            ],
          },
          null,
          2,
        ) + "\n",
      );
      process.exit(0);
    }
  }

  if (!prevPath || !sourcePath || !tokensPath) {
    process.stderr.write(
      "Usage: changelog.js --previous <.last-push.json> --source <data.json> --tokens <tokens.json>\n",
    );
    process.exit(1);
  }

  if (!fs.existsSync(prevPath)) {
    process.stderr.write("First push — no changelog\n");
    process.exit(0);
  }

  var prevManifest;
  try {
    prevManifest = JSON.parse(fs.readFileSync(prevPath, "utf8"));
  } catch (e) {
    process.stderr.write(
      "Error reading previous manifest: " + e.message + "\n",
    );
    process.exit(1);
  }

  function hashFile(filePath) {
    return crypto
      .createHash("sha256")
      .update(fs.readFileSync(filePath))
      .digest("hex");
  }

  var currSourceHash = hashFile(sourcePath);
  var currTokenHash = hashFile(tokensPath);
  var currComponentKeys = prevManifest.componentKeys || [];

  var result = buildChangelog(
    prevManifest,
    currSourceHash,
    currTokenHash,
    currComponentKeys,
  );
  process.stderr.write(formatChangelog(result));
  process.exit(0);
}
