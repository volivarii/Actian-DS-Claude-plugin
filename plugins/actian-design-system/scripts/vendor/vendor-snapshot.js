#!/usr/bin/env node
"use strict";

// Federation Phase 1.4a — vendor a snapshot of the actian-ds-knowledge repo
// into plugins/actian-design-system/vendor/. Reads the pinned SHA from
// vendored.json, downloads the GitHub tarball at that SHA, extracts the
// content (excluding the knowledge repo's own scripts/, .github/, package
// manifests, and meta files), and copies it into vendor/.
//
// Usage:
//   node scripts/vendor/vendor-snapshot.js               (pulls SHA from vendored.json)
//   node scripts/vendor/vendor-snapshot.js --sha <sha>   (override SHA, also rewrites vendored.json)
//
// Phase 1.5 (shipped) rewrote all consumer paths to read from vendor/
// — the plugin no longer maintains its own docs/ or tokens/ trees.
// vendored.json#knowledge_repo_sha pins the snapshot; vendor-snapshot.yml
// refreshes it nightly and bumps plugin.json patch on diff.

var fs = require("fs");
var path = require("path");
var os = require("os");
var { execFileSync } = require("child_process");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var VENDORED_JSON_PATH = path.join(PLUGIN_ROOT, "vendored.json");
var VENDOR_DIR = path.join(PLUGIN_ROOT, "vendor");
var KNOWLEDGE_REPO = "volivarii/actian-ds-knowledge";

// Top-level entries in the knowledge repo NOT to vendor — knowledge-repo's
// own infrastructure (CI scripts, workflows, package manifests, meta files)
// has no place inside the plugin.
var EXCLUDE_TOP_LEVEL = new Set([
  ".git",
  ".github",
  ".gitignore",
  "node_modules",
  "scripts",
  "package.json",
  "package-lock.json",
  ".figma-keys.json.example",
  "SMOKE_LOG.md",
  "LICENSE.txt",
  "README.md",
]);

function parseArgs(argv) {
  var out = {};
  for (var i = 0; i < argv.length; i++) {
    if (argv[i] === "--sha") out.sha = argv[++i];
  }
  return out;
}

function readVendoredJson() {
  if (!fs.existsSync(VENDORED_JSON_PATH)) {
    return {
      knowledge_repo: KNOWLEDGE_REPO,
      knowledge_repo_sha: null,
    };
  }
  return JSON.parse(fs.readFileSync(VENDORED_JSON_PATH, "utf8"));
}

function writeVendoredJson(data) {
  fs.writeFileSync(VENDORED_JSON_PATH, JSON.stringify(data, null, 2) + "\n");
}

function fetchTarball(sha, destPath) {
  // GitHub returns a tarball at this URL for any SHA on a public repo. No auth
  // needed. The .tar.gz contains a single top-level directory like
  // `actian-ds-knowledge-<full-sha>/` with the repo content inside.
  var url =
    "https://github.com/" + KNOWLEDGE_REPO + "/archive/" + sha + ".tar.gz";
  process.stdout.write("[vendor] fetching " + url + "\n");
  execFileSync("curl", ["-sSL", "-o", destPath, url], { stdio: "inherit" });
}

function extractTarball(tarballPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  execFileSync("tar", ["-xzf", tarballPath, "-C", destDir], {
    stdio: "inherit",
  });
  // After extraction, destDir contains a single subdir like
  // `actian-ds-knowledge-<sha>/`. Return its absolute path.
  var entries = fs.readdirSync(destDir).filter(function (e) {
    return fs.statSync(path.join(destDir, e)).isDirectory();
  });
  if (entries.length !== 1) {
    throw new Error(
      "[vendor] expected exactly one top-level dir in tarball, got " +
        entries.length,
    );
  }
  return path.join(destDir, entries[0]);
}

function copyDirectory(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  var entries = fs.readdirSync(src, { withFileTypes: true });
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var srcPath = path.join(src, entry.name);
    var destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function clearVendorDir() {
  if (!fs.existsSync(VENDOR_DIR)) return;
  fs.rmSync(VENDOR_DIR, { recursive: true, force: true });
}

function vendorContent(extractedRepoRoot) {
  fs.mkdirSync(VENDOR_DIR, { recursive: true });
  var entries = fs.readdirSync(extractedRepoRoot, { withFileTypes: true });
  var vendored = [];
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (EXCLUDE_TOP_LEVEL.has(entry.name)) continue;
    var srcPath = path.join(extractedRepoRoot, entry.name);
    var destPath = path.join(VENDOR_DIR, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
    vendored.push(entry.name);
  }
  return vendored;
}

function main() {
  var args = parseArgs(process.argv.slice(2));
  var current = readVendoredJson();
  var sha = args.sha || current.knowledge_repo_sha;

  if (!sha) {
    process.stderr.write(
      "[vendor] no SHA available — pass --sha <sha> or populate vendored.json\n",
    );
    process.exit(1);
  }

  // Fetch + extract into a tempdir so we don't pollute the plugin tree on
  // failure.
  var tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vendor-snapshot-"));
  var tarballPath = path.join(tmpRoot, "snapshot.tar.gz");

  try {
    fetchTarball(sha, tarballPath);
    var extractedRoot = extractTarball(tarballPath, tmpRoot);
    process.stdout.write("[vendor] extracted to " + extractedRoot + "\n");

    clearVendorDir();
    var vendored = vendorContent(extractedRoot);
    process.stdout.write(
      "[vendor] copied " + vendored.length + " top-level entries:\n",
    );
    vendored.forEach(function (e) {
      process.stdout.write("  - " + e + "\n");
    });

    var manifest = {
      knowledge_repo: KNOWLEDGE_REPO,
      knowledge_repo_sha: sha,
      knowledge_repo_short_sha: sha.slice(0, 7),
      vendored_at: new Date().toISOString(),
      vendored_entries: vendored.sort(),
      excluded_entries: Array.from(EXCLUDE_TOP_LEVEL).sort(),
      vendor_url: "https://github.com/" + KNOWLEDGE_REPO + "/tree/" + sha,
    };
    writeVendoredJson(manifest);
    process.stdout.write("[vendor] wrote " + VENDORED_JSON_PATH + "\n");
    process.stdout.write("[vendor] OK\n");
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write("[vendor] FATAL: " + err.message + "\n");
    process.exit(2);
  }
}

module.exports = { main: main };
