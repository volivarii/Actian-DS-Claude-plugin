"use strict";

// vendor-snapshot.js — canonical vendor-snapshot core (the substrate's reference
// reader, build-time half). Config-driven: a consumer passes
//   { knowledgeRepo, vendorDir, vendoredJsonPath, excludeTopLevel, postVendorHook }
// and runSnapshot() range-resolves a knowledge release → fetches the GitHub
// tarball → selects the distributable surface (inclusion-first via
// vendor-include.json, legacy exclude-set fallback) → copies it into vendorDir →
// writes vendoredJsonPath.
//
// Factored verbatim from the plugin's scripts/vendor/vendor-snapshot.js. The
// ONLY logic change is the module-constants → config parameterization: the
// per-consumer module constants (KNOWLEDGE_REPO / VENDOR_DIR / VENDORED_JSON_PATH
// / EXCLUDE_TOP_LEVEL) and the plugin-specific runComponentReferenceRenderer()
// are gone — values are threaded in via `config`, and the post-vendor step is a
// caller-supplied `config.postVendorHook`. The functions that consumed those
// constants (fetchTarball / readVendoredJson / writeVendoredJson /
// clearVendorDir / vendorContent) take the values as parameters instead. The
// pure helpers (range/semver/tag resolution, include/exclude selection,
// fetch/extract/copy) are byte-faithful.
//
// Adoption: a build tool must not import the bundle it produces (bootstrap), so
// consumers COPY this core and keep a drift-guard test against their vendored
// copy. See clients/README.md.

var fs = require("fs");
var path = require("path");
var os = require("os");
var { execFileSync } = require("child_process");

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
  var trimmed = String(range).trim();
  var reqMajor, reqMinor, reqPatch;
  if (trimmed.charAt(0) === "~") {
    var parts = parseV(trimmed.slice(1));
    reqMajor = parts[0];
    reqMinor = parts[1];
    reqPatch = parts[2] || 0;
    var v = parseV(version);
    return v[0] === reqMajor && v[1] === reqMinor && v[2] >= reqPatch;
  }
  if (trimmed.charAt(0) === "^") {
    var cparts = parseV(trimmed.slice(1));
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
  // Less-than operators (<X.Y.Z, <=X.Y.Z). Lets consumers opt into
  // "anything up to the next major" without per-minor re-pin (Design E in
  // project_sync_pipeline_improvements_2026_05_13.md). Compound ranges
  // (>=A.B.C <X.Y.Z) intentionally not supported — keep the parser small;
  // floors are theoretical for forward-only knowledge tags.
  var ltMatch = trimmed.match(/^<(=?)\s*(\d+\.\d+\.\d+)$/);
  if (ltMatch) {
    var inclusive = ltMatch[1] === "=";
    var cmp = compareSemver(version, ltMatch[2]);
    return inclusive ? cmp <= 0 : cmp < 0;
  }
  return version === trimmed;
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

// Compare the resolved tag against the highest available tag across ALL
// strict-semver tags (regardless of range). If a newer tag exists outside
// the range, emit a GitHub Actions ::warning:: directive so the workflow
// summary surfaces the gap. Designer can then decide whether to widen the
// range in vendored.json. No side effects beyond stdout.
//
// Returns true when a warning was emitted; false otherwise (useful for tests).
// Design E in project_sync_pipeline_improvements_2026_05_13.md +
// project_vendor_stable_channel_architecture.md.
function notifyIfNewerAvailable(tags, currentRange, resolvedTag) {
  var allVersions = tags
    .map(function (t) {
      return String(t).replace(/^v/, "");
    })
    .filter(function (v) {
      return /^[0-9]+\.[0-9]+\.[0-9]+$/.test(v);
    });
  if (allVersions.length === 0) return false;
  allVersions.sort(compareSemver);
  var highest = allVersions[allVersions.length - 1];
  var resolved = String(resolvedTag).replace(/^v/, "");
  if (highest === resolved) return false;
  process.stdout.write(
    "::warning::Newer knowledge release available: v" +
      highest +
      " (current range '" +
      currentRange +
      "' resolves to v" +
      resolved +
      "). Update vendored.json#knowledge_repo_version_range when ready to adopt.\n",
  );
  return true;
}

// Build curl args for a GitHub request: the shared flags, plus an
// Authorization header WHEN a token is present in the environment (GH_TOKEN,
// else GITHUB_TOKEN). Auth is OPTIONAL — public-repo reads work without it —
// but unauthenticated GitHub API requests are capped at 60/hr PER IP. A
// developer's own machine rarely hits that; CI runners SHARE egress IPs across
// tenants, so the budget is frequently already spent by neighbors, surfacing
// as an intermittent `GitHub tags API returned non-array: {"API rate limit
// exceeded ..."}` and a failed sync. A token raises the limit to 5,000/hr
// (PAT) or 15,000/hr (GitHub App installation). The token is passed as a
// discrete execFileSync arg — never interpolated into a shell string — so
// there is no shell-injection surface. curl drops the Authorization header on
// cross-host redirects by default (since 7.58 / CVE-2018-1000007), so the
// tarball fetch (github.com → codeload) does not leak it.
function githubCurlArgs(extraArgs) {
  var token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
  var authArgs = token ? ["-H", "Authorization: Bearer " + token] : [];
  return ["-sSL"].concat(authArgs, extraArgs);
}

// Fetch all tags from a GitHub repo via the API. Authenticated when a token is
// in the environment (see githubCurlArgs); unauthenticated fallback works for
// public repos. Uses curl, always available in CI runners.
function fetchTagsFromGitHub(repo) {
  var url = "https://api.github.com/repos/" + repo + "/tags?per_page=100";
  var raw = execFileSync("curl", githubCurlArgs([url]), { encoding: "utf8" });
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

// Resolve a tag name → COMMIT SHA via GitHub API. Tag must exist.
// Handles lightweight tags (object.type === "commit") AND annotated tags
// (object.type === "tag", requires a second hop to dereference to commit).
function resolveTagSha(repo, tag) {
  var versionOnly = tag.replace(/^v/, "");
  var refUrl =
    "https://api.github.com/repos/" + repo + "/git/refs/tags/v" + versionOnly;
  var rawRef = execFileSync("curl", githubCurlArgs([refUrl]), {
    encoding: "utf8",
  });
  var parsedRef = JSON.parse(rawRef);
  if (!parsedRef || !parsedRef.object || !parsedRef.object.sha) {
    throw new Error(
      "Cannot resolve tag '" +
        tag +
        "' to SHA. Response: " +
        rawRef.slice(0, 200),
    );
  }
  // Lightweight tag — points directly at a commit.
  if (parsedRef.object.type !== "tag") {
    return parsedRef.object.sha;
  }
  // Annotated tag — dereference the tag object to get the commit SHA.
  var tagUrl =
    "https://api.github.com/repos/" +
    repo +
    "/git/tags/" +
    parsedRef.object.sha;
  var rawTag = execFileSync("curl", githubCurlArgs([tagUrl]), {
    encoding: "utf8",
  });
  var parsedTag = JSON.parse(rawTag);
  if (!parsedTag || !parsedTag.object || !parsedTag.object.sha) {
    throw new Error(
      "Cannot dereference annotated tag '" +
        tag +
        "' to commit SHA. Response: " +
        rawTag.slice(0, 200),
    );
  }
  return parsedTag.object.sha;
}

// Read the pinned vendor manifest, or a minimal default if none exists yet.
// (Parameterized: vendoredJsonPath + knowledgeRepo come from config.)
function readVendoredJson(vendoredJsonPath, knowledgeRepo) {
  if (!fs.existsSync(vendoredJsonPath)) {
    return {
      knowledge_repo: knowledgeRepo,
      knowledge_repo_sha: null,
    };
  }
  return JSON.parse(fs.readFileSync(vendoredJsonPath, "utf8"));
}

// (Parameterized: vendoredJsonPath comes from config.)
function writeVendoredJson(vendoredJsonPath, data) {
  fs.writeFileSync(vendoredJsonPath, JSON.stringify(data, null, 2) + "\n");
}

// (Parameterized: repo comes from config.)
function fetchTarball(repo, sha, destPath) {
  // GitHub returns a tarball at this URL for any SHA on a public repo. Auth is
  // optional here (the github.com archive endpoint has its own, separate
  // budget), but we still pass githubCurlArgs for consistency; curl strips the
  // Authorization header on the cross-host redirect to codeload, so it is not
  // sent off-host. The .tar.gz contains a single top-level directory like
  // `actian-ds-knowledge-<full-sha>/` with the repo content inside.
  var url = "https://github.com/" + repo + "/archive/" + sha + ".tar.gz";
  process.stdout.write("[vendor] fetching " + url + "\n");
  execFileSync("curl", githubCurlArgs(["-o", destPath, url]), {
    stdio: "inherit",
  });
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

// (Parameterized: vendorDir comes from config.)
function clearVendorDir(vendorDir) {
  if (!fs.existsSync(vendorDir)) return;
  fs.rmSync(vendorDir, { recursive: true, force: true });
}

// Read the substrate's distributable-surface declaration from the extracted
// tarball. Returns a Set of allowed top-level entry names, or null if the
// declaration is absent/malformed (old pins pre vendor-include.json → caller
// falls back to the legacy excludeSet behavior).
function readVendorInclude(extractedRepoRoot) {
  var p = path.join(extractedRepoRoot, "vendor-include.json");
  if (!fs.existsSync(p)) return null;
  try {
    var decl = JSON.parse(fs.readFileSync(p, "utf8"));
    if (decl && Array.isArray(decl.include)) return new Set(decl.include);
  } catch (e) {
    /* malformed → fall back */
  }
  return null;
}

// Decide which top-level entries to vendor. Inclusion-first: if the substrate
// declared an include-set, copy ONLY those (tooling is structurally absent).
// Otherwise fall back to the legacy exclude-set.
function selectEntries(names, includeSet, excludeSet) {
  return names.filter(function (name) {
    // Inclusion-first. In the legacy exclude-fallback branch, tolerate an
    // absent excludeSet (a consumer that omits config.excludeTopLevel) — treat
    // it as "no exclusions" rather than throwing on excludeSet.has(...).
    return includeSet
      ? includeSet.has(name)
      : !(excludeSet && excludeSet.has(name));
  });
}

// (Parameterized: vendorDir + excludeSet come from config.)
function vendorContent(extractedRepoRoot, vendorDir, excludeSet) {
  fs.mkdirSync(vendorDir, { recursive: true });
  var includeSet = readVendorInclude(extractedRepoRoot);
  if (includeSet) {
    process.stdout.write(
      "[vendor] inclusion mode — copying " +
        includeSet.size +
        " declared entries (vendor-include.json)\n",
    );
  } else {
    process.stdout.write(
      "[vendor] exclusion mode (no vendor-include.json in snapshot — legacy pin)\n",
    );
  }
  var allNames = fs
    .readdirSync(extractedRepoRoot, { withFileTypes: true })
    .map(function (e) {
      return e.name;
    });
  var selected = selectEntries(allNames, includeSet, excludeSet);
  var vendored = [];
  for (var i = 0; i < selected.length; i++) {
    var name = selected[i];
    var srcPath = path.join(extractedRepoRoot, name);
    var destPath = path.join(vendorDir, name);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
    vendored.push(name);
  }
  return vendored;
}

// Config-driven entry. config = { knowledgeRepo, vendorDir, vendoredJsonPath,
// excludeTopLevel, postVendorHook }. argv defaults to process.argv.slice(2)
// (passed explicitly in tests).
//
// Contract (the consumer's thin wrapper owns the CLI shell — see clients/README):
//   - No require.main block + NO process.exit here. On a fatal condition
//     (no in-range tag, no resolvable SHA) the library THROWS; the wrapper's
//     try/catch prints "[vendor] FATAL: <msg>" and exits non-zero. (The plugin's
//     original main() exit(1)'d these inline; relocating the exit to the wrapper
//     is the design — non-zero abort is preserved, the message is unchanged.)
//   - postVendorHook() runs after a successful vendor copy, before "[vendor] OK":
//     throw from it to abort, or set process.exitCode inside it for the plugin's
//     "warn + non-zero exit, don't roll back" renderer semantics (respected — the
//     snapshot is already on disk).
//   - Returns { resolvedVersion, resolvedRange, sha } so a consumer (e.g. docs'
//     GITHUB_ENV append) can read the resolution without re-parsing vendored.json.
function runSnapshot(config, argv) {
  var args = parseArgs(argv || process.argv.slice(2));
  var current = readVendoredJson(config.vendoredJsonPath, config.knowledgeRepo);

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
    var tags = fetchTagsFromGitHub(config.knowledgeRepo);
    var matchedTag = resolveTargetTag(tags, resolvedRange);
    if (!matchedTag) {
      throw new Error(
        "[vendor] no tag matches range '" +
          resolvedRange +
          "'. Available: " +
          tags.join(", "),
      );
    }
    sha = resolveTagSha(config.knowledgeRepo, matchedTag);
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
    // Surface a workflow warning if a newer-tag exists outside the range.
    // Lets designers see range staleness in the CI summary instead of
    // discovering it via user-reported drift (today's failure mode).
    notifyIfNewerAvailable(tags, resolvedRange, matchedTag);
  }

  if (!sha) {
    sha = current.knowledge_repo_sha; // legacy fallback
  }

  if (!sha) {
    throw new Error(
      "[vendor] no SHA available — pass --sha, --range, or set knowledge_repo_version_range in vendored.json",
    );
  }

  if (args.resolveOnly) {
    process.stdout.write("range=" + (resolvedRange || "") + "\n");
    process.stdout.write("version=" + (resolvedVersion || "") + "\n");
    process.stdout.write("sha=" + sha + "\n");
    return {
      resolvedVersion: resolvedVersion,
      resolvedRange: resolvedRange,
      sha: sha,
    };
  }

  // Fetch + extract into a tempdir so we don't pollute the consumer tree on
  // failure.
  var tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vendor-snapshot-"));
  var tarballPath = path.join(tmpRoot, "snapshot.tar.gz");

  try {
    fetchTarball(config.knowledgeRepo, sha, tarballPath);
    var extractedRoot = extractTarball(tarballPath, tmpRoot);
    process.stdout.write("[vendor] extracted to " + extractedRoot + "\n");

    clearVendorDir(config.vendorDir);
    var vendored = vendorContent(
      extractedRoot,
      config.vendorDir,
      config.excludeTopLevel,
    );
    process.stdout.write(
      "[vendor] copied " + vendored.length + " top-level entries:\n",
    );
    vendored.forEach(function (e) {
      process.stdout.write("  - " + e + "\n");
    });

    var manifest = {
      knowledge_repo: config.knowledgeRepo,
      knowledge_repo_version_range: resolvedRange || null,
      knowledge_repo_resolved_version: resolvedVersion || null,
      knowledge_repo_resolved_sha: sha,
      vendored_at: new Date().toISOString(),
      vendored_entries: vendored.sort(),
      excluded_entries: Array.from(config.excludeTopLevel || []).sort(),
      vendor_url: resolvedVersion
        ? "https://github.com/" +
          config.knowledgeRepo +
          "/tree/" +
          resolvedVersion
        : "https://github.com/" + config.knowledgeRepo + "/tree/" + sha,
    };
    writeVendoredJson(config.vendoredJsonPath, manifest);
    process.stdout.write("[vendor] wrote " + config.vendoredJsonPath + "\n");

    // Consumer-specific post-vendor step (e.g. the plugin regenerates its
    // component mirrors). Replaces the plugin's runComponentReferenceRenderer().
    if (config.postVendorHook) config.postVendorHook();

    process.stdout.write("[vendor] OK\n");
    return {
      resolvedVersion: resolvedVersion,
      resolvedRange: resolvedRange,
      sha: sha,
    };
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

module.exports = {
  runSnapshot: runSnapshot,
  parseArgs: parseArgs,
  githubCurlArgs: githubCurlArgs,
  matchesRange: matchesRange,
  compareSemver: compareSemver,
  resolveTargetTag: resolveTargetTag,
  notifyIfNewerAvailable: notifyIfNewerAvailable,
  selectEntries: selectEntries,
  readVendorInclude: readVendorInclude,
  readVendoredJson: readVendoredJson,
};
