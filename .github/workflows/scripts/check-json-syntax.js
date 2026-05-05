#!/usr/bin/env node
"use strict";

/**
 * check-json-syntax.js — PR gate that walks the plugin's checked-in JSON
 * files and fails fast on any file that doesn't parse. Catches malformed
 * JSON from manual edits or merge conflicts before merge.
 *
 * Scope: every .json file under plugins/actian-design-system/ except those
 * that live inside ignore prefixes (node_modules, .git). Includes registries,
 * recipes, schemas, fixtures, the plugin manifest, and the foundations
 * generated outputs.
 *
 * Output: one line per failing file with the parser message + position.
 * Exit 0 on success, 1 if any file fails.
 */

var fs = require("fs");
var path = require("path");

var PLUGIN_ROOT = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "plugins",
  "actian-design-system",
);

// Directories whose contents we never want to walk (huge, third-party, or
// not version-controlled). Path comparisons are name-based at any depth.
var IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".DS_Store",
]);

function walk(dir, out) {
  var entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    // Plugin layout may shift; surface but don't crash on missing dirs.
    if (err.code === "ENOENT") return;
    throw err;
  }
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      walk(full, out);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      out.push(full);
    }
  }
}

function relPath(p) {
  return path.relative(PLUGIN_ROOT, p);
}

function main() {
  if (!fs.existsSync(PLUGIN_ROOT)) {
    process.stderr.write(
      "[check-json-syntax] plugin root not found: " + PLUGIN_ROOT + "\n",
    );
    process.exit(2);
  }
  var files = [];
  walk(PLUGIN_ROOT, files);

  var failures = [];
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    var src;
    try {
      src = fs.readFileSync(f, "utf8");
    } catch (err) {
      failures.push({ file: f, message: "read error: " + err.message });
      continue;
    }
    try {
      JSON.parse(src);
    } catch (err) {
      failures.push({ file: f, message: err.message });
    }
  }

  process.stdout.write(
    "[check-json-syntax] checked " + files.length + " JSON files\n",
  );

  if (failures.length === 0) {
    process.stdout.write("[check-json-syntax] all files parse cleanly\n");
    return 0;
  }

  process.stderr.write(
    "[check-json-syntax] " + failures.length + " file(s) failed to parse:\n",
  );
  for (var j = 0; j < failures.length; j++) {
    process.stderr.write(
      "  " + relPath(failures[j].file) + " — " + failures[j].message + "\n",
    );
  }
  return 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { walk, main };
