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
    // Move A2: resolve via semver range (e.g., "~0.1.0") instead of SHA.
    // Range is read from vendored.json.knowledge_repo_version_range when
    // --range is passed without a value (or omit --range entirely).
    else if (argv[i] === "--range") out.range = argv[++i];
    // Resolve-only mode: print the resolved tag + SHA and exit. Used by
    // vendor-snapshot.yml to log which tag it's about to pull.
    else if (argv[i] === "--resolve-only") out.resolveOnly = true;
  }
  return out;
}

// Pure semver range resolver. Supports tilde (~), caret (^), and exact
// version strings. Pre-1.0 caret behaves like tilde (patches only) per
// npm convention.
function matchesRange(version, range) {
  var parseV = function (v) {
    return String(v).split(".").map(Number);
  };
  var reqMajor, reqMinor, reqPatch;
  if (range.charAt(0) === "~") {
    var parts = parseV(range.slice(1));
    reqMajor = parts[0];
    reqMinor = parts[1];
    reqPatch = parts[2] || 0;
    var v = parseV(version);
    return v[0] === reqMajor && v[1] === reqMinor && v[2] >= reqPatch;
  }
  if (range.charAt(0) === "^") {
    var cparts = parseV(range.slice(1));
    reqMajor = cparts[0];
    reqMinor = cparts[1];
    reqPatch = cparts[2] || 0;
    var cv = parseV(version);
    if (reqMajor === 0) {
      // Pre-1.0: caret = tilde (only patches)
      return cv[0] === reqMajor && cv[1] === reqMinor && cv[2] >= reqPatch;
    }
    return (
      cv[0] === reqMajor &&
      (cv[1] > reqMinor || (cv[1] === reqMinor && cv[2] >= reqPatch))
    );
  }
  return version === range;
}

// Compare two semver strings; returns -1, 0, or 1.
function compareSemver(a, b) {
  var pa = String(a).split(".").map(Number);
  var pb = String(b).split(".").map(Number);
  for (var i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i] < 0 ? -1 : 1;
  }
  return 0;
}

// Filter, validate, and select the highest tag matching a range.
// Returns the tag name (with "v" prefix) or null.
function resolveTargetTag(tags, range) {
  var candidates = tags
    .map(function (t) {
      return String(t).replace(/^v/, "");
    })
    .filter(function (v) {
      // Strict semver (X.Y.Z numeric), no pre-release suffix
      return /^[0-9]+\.[0-9]+\.[0-9]+$/.test(v);
    })
    .filter(function (v) {
      return matchesRange(v, range);
    });
  if (candidates.length === 0) return null;
  candidates.sort(compareSemver);
  return "v" + candidates[candidates.length - 1];
}

// Fetch all tags from a public GitHub repo via the API. No auth needed
// for public repos; uses curl which is always available in CI runners.
function fetchTagsFromGitHub(repo) {
  var url = "https://api.github.com/repos/" + repo + "/tags?per_page=100";
  var raw = execFileSync("curl", ["-sSL", url], { encoding: "utf8" });
  var parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(
      "GitHub tags API returned non-array: " +
        JSON.stringify(parsed).slice(0, 200),
    );
  }
  return parsed.map(function (t) {
    return t.name;
  });
}

// Resolve a tag name → SHA via GitHub API. Tag must exist.
function resolveTagSha(repo, tag) {
  var versionOnly = tag.replace(/^v/, "");
  var url =
    "https://api.github.com/repos/" + repo + "/git/refs/tags/v" + versionOnly;
  var raw = execFileSync("curl", ["-sSL", url], { encoding: "utf8" });
  var parsed = JSON.parse(raw);
  if (!parsed || !parsed.object || !parsed.object.sha) {
    throw new Error(
      "Cannot resolve tag '" + tag + "' to SHA. Response: " + raw.slice(0, 200),
    );
  }
  return parsed.object.sha;
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

  // Move A2: tag-range resolution. Precedence:
  //   1. --sha <sha>     → use SHA directly (back-compat for manual override)
  //   2. --range <range> → resolve via that range
  //   3. vendored.json.knowledge_repo_version_range → resolve via stored range
  //   4. vendored.json.knowledge_repo_sha → legacy fallback (deprecated)
  var sha = args.sha;
  var resolvedVersion = null;
  var resolvedRange =
    args.range || current.knowledge_repo_version_range || null;

  if (!sha && resolvedRange) {
    var tags = fetchTagsFromGitHub(KNOWLEDGE_REPO);
    var matchedTag = resolveTargetTag(tags, resolvedRange);
    if (!matchedTag) {
      process.stderr.write(
        "[vendor] no tag matches range '" +
          resolvedRange +
          "'. Available: " +
          tags.join(", ") +
          "\n",
      );
      process.exit(1);
    }
    sha = resolveTagSha(KNOWLEDGE_REPO, matchedTag);
    resolvedVersion = matchedTag;
    process.stdout.write(
      "[vendor] resolved range '" +
        resolvedRange +
        "' → " +
        matchedTag +
        " (" +
        sha.slice(0, 7) +
        ")\n",
    );
  }

  if (!sha) {
    sha = current.knowledge_repo_sha; // legacy fallback
  }

  if (!sha) {
    process.stderr.write(
      "[vendor] no SHA available — pass --sha, --range, or set knowledge_repo_version_range in vendored.json\n",
    );
    process.exit(1);
  }

  if (args.resolveOnly) {
    process.stdout.write("range=" + (resolvedRange || "") + "\n");
    process.stdout.write("version=" + (resolvedVersion || "") + "\n");
    process.stdout.write("sha=" + sha + "\n");
    return;
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
      knowledge_repo_version_range: resolvedRange || null,
      knowledge_repo_resolved_version: resolvedVersion || null,
      knowledge_repo_resolved_sha: sha,
      vendored_at: new Date().toISOString(),
      vendored_entries: vendored.sort(),
      excluded_entries: Array.from(EXCLUDE_TOP_LEVEL).sort(),
      vendor_url: resolvedVersion
        ? "https://github.com/" + KNOWLEDGE_REPO + "/tree/" + resolvedVersion
        : "https://github.com/" + KNOWLEDGE_REPO + "/tree/" + sha,
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

module.exports = {
  main: main,
  matchesRange: matchesRange,
  compareSemver: compareSemver,
  resolveTargetTag: resolveTargetTag,
};
