"use strict";

// The media oracles (vendor/components/dist/media/<slug>/*.webp) are read by
// exactly one caller in this repo — scripts/fidelity/run-fidelity.js, via
// PATHS.components.media()/mediaDefault() — and that gate runs a hardcoded
// 19-slug PILOT in a continue-on-error job. Shipping 183 components' binaries
// for it costs 6.9 MB in every install and, because WebP does not delta-compress,
// tens of MB in git history that grows with every nightly re-vendor. See #310.
//
// They cannot be dropped upstream: vendor-include.json is shared with the docs
// site, which genuinely renders these files. So the plugin prunes its own copy
// after the vendor snapshot lands.

var test = require("node:test");
var after = require("node:test").after;
var assert = require("node:assert/strict");
var fs = require("node:fs");
var os = require("node:os");
var path = require("node:path");
var snapshot = require("../../scripts/vendor/vendor-snapshot.js");

// Every test builds its own throwaway media tree and passes that path in.
// This function DELETES directories: it must never be able to reach the real
// vendor/ tree from a test run.
var TEMP_ROOTS = [];

function tempRoot() {
  var root = fs.mkdtempSync(path.join(os.tmpdir(), "media-prune-"));
  TEMP_ROOTS.push(root);
  return root;
}

after(function () {
  TEMP_ROOTS.forEach(function (root) {
    fs.rmSync(root, { recursive: true, force: true });
  });
});

function fakeMediaDir() {
  var root = tempRoot();
  var media = path.join(root, "media");
  ["button", "checkbox", "alert-banner"].forEach(function (slug) {
    fs.mkdirSync(path.join(media, slug), { recursive: true });
    fs.writeFileSync(path.join(media, slug, "preview.webp"), "WEBP");
    fs.writeFileSync(path.join(media, slug, "default.webp"), "WEBP");
  });
  fs.writeFileSync(
    path.join(media, "_index.json"),
    JSON.stringify({ media: { button: { preview: "x" } } }),
  );
  fs.writeFileSync(path.join(media, "README.md"), "docs");
  return media;
}

test("pruneMediaOracles removes the per-slug binaries and keeps the index sidecar", function () {
  var media = fakeMediaDir();

  snapshot.pruneMediaOracles(media);

  assert.deepEqual(
    fs.readdirSync(media).sort(),
    ["README.md", "_index.json"],
    "only the top-level sidecars should survive",
  );
});

test("pruneMediaOracles refuses to run without an explicit directory", function () {
  // Confinement. A prune helper that can fall back to a repo-relative default is
  // one bad call away from deleting committed files, which has happened here
  // before. Missing argument must be a named refusal, not whatever readdirSync
  // happens to throw.
  assert.throws(
    function () {
      snapshot.pruneMediaOracles();
    },
    /pruneMediaOracles: mediaDir is required/,
  );
});

test("pruneMediaOracles is a no-op when the media directory is absent", function () {
  // If knowledge ever stops shipping media, or an older pin never had it, the
  // vendor run must still succeed rather than dying in the post-vendor hook.
  var root = tempRoot();

  assert.equal(snapshot.pruneMediaOracles(path.join(root, "nope")), 0);
});

test("the post-vendor hook prunes the oracles and still regenerates the mirrors", function () {
  // The prune has to run as part of the vendor snapshot, not merely exist. The
  // mirror step spawns a renderer process, so it is stubbed; the prune runs for
  // real against a throwaway tree.
  var media = fakeMediaDir();
  var mirrorsRan = false;

  var hook = snapshot.makePostVendorHook({
    mediaDir: media,
    mirrors: function () {
      mirrorsRan = true;
      return true;
    },
  });
  hook();

  assert.deepEqual(fs.readdirSync(media).sort(), ["README.md", "_index.json"]);
  assert.equal(mirrorsRan, true, "mirror regeneration must still happen");
});

test("the vendor entry point wires the prune at the vendored media directory", function () {
  // Guards the defect this whole change is about: a prune that is never called,
  // or called at the wrong path, leaves the oracles shipping while looking fixed.
  var media = fakeMediaDir();
  var config = snapshot.buildConfig({
    mediaDir: media,
    mirrors: function () {
      return true;
    },
  });

  // Invoke the hook the entry point actually installs, not a hand-built one.
  config.postVendorHook();

  assert.deepEqual(
    fs.readdirSync(media).sort(),
    ["README.md", "_index.json"],
    "the configured post-vendor hook must prune",
  );
  assert.equal(
    path.relative(config.vendorDir, snapshot.defaultMediaDir()),
    path.join("components", "dist", "media"),
    "and it must default at the vendored media directory",
  );
});

test("pruneMediaOracles removes the .webp oracles and leaves a sidecar it does not own", function () {
  // The prune is scoped to the oracle images, not to "every subdirectory".
  // knowledge's manifest describes components.media.ci as the home for future
  // per-component assets, so a slug directory that gains a file the plugin does
  // read must survive rather than disappear silently at vendor time.
  var media = fakeMediaDir();
  fs.writeFileSync(path.join(media, "button", "motion.webm"), "CLIP");

  snapshot.pruneMediaOracles(media);

  assert.deepEqual(
    fs.readdirSync(media).sort(),
    ["README.md", "_index.json", "button"],
    "the slug directory holding a non-oracle file must survive",
  );
  assert.deepEqual(fs.readdirSync(path.join(media, "button")), ["motion.webm"]);
});

test("a failing prune warns and still regenerates the mirrors", function () {
  // fs.rmSync's force:true suppresses ENOENT only. On EPERM/EBUSY the prune
  // throws, and an unguarded throw here aborts the run before the mirror step,
  // leaving vendored.json and a fresh tree on disk beside stale mirrors — the
  // exact state postVendorHook exists to prevent. Match the mirror step's own
  // warn-and-continue semantics instead.
  var mirrorsRan = false;
  var previousExitCode = process.exitCode;

  var hook = snapshot.makePostVendorHook({
    mediaDir: fakeMediaDir(),
    prune: function () {
      throw new Error("EPERM: operation not permitted");
    },
    mirrors: function () {
      mirrorsRan = true;
      return true;
    },
  });
  hook();

  assert.equal(mirrorsRan, true, "the mirror step must still run");
  assert.equal(process.exitCode, 1, "and the run must report non-zero");
  process.exitCode = previousExitCode;
});

test("the post-vendor hook targets the vendored media directory by default", function () {
  // Closes the gap the injected-mediaDir tests cannot reach: they never exercise
  // the default, so a default changed to any other path would keep them green
  // while the shipped vendor run pruned the wrong tree.
  var seen = null;

  snapshot.makePostVendorHook({
    prune: function (dir) {
      seen = dir;
      return 0;
    },
    mirrors: function () {
      return true;
    },
  })();

  assert.equal(seen, snapshot.defaultMediaDir());
});
