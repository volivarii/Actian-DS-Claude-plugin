#!/usr/bin/env node
"use strict";

/**
 * sync-doc-counts.js — rewrite the plugin's human-facing inventory counts
 * (README, marketplace.json, plugin.json, llms.txt, companion-context,
 * figma-push-patterns) to match the derived ground truth.
 *
 * Run by .github/workflows/vendor-snapshot.yml after a knowledge re-vendor:
 * when a refresh changes a registry component count, the doc-counts guard
 * (tests/integration/doc-counts.test.js) would otherwise fail and leave the
 * auto-merge vendor PR stuck. This step rewrites the prose so the guard passes
 * and the PR merges — the same fix a human would otherwise do by hand.
 *
 * Logic + the managed-doc list live in scripts/lib/doc-counts.js, SHARED with
 * the guard, so they can never disagree.
 *
 * Usage (from plugins/actian-design-system/):
 *   node scripts/vendor/sync-doc-counts.js          # rewrite docs in place
 *   node scripts/vendor/sync-doc-counts.js --check  # report only; exit 1 if stale
 */

var path = require("path");
var { syncDocCounts } = require("../lib/doc-counts.js");

// scripts/vendor → plugins/actian-design-system → <repo root>
var REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");

function main(argv) {
  var check = argv.indexOf("--check") !== -1;
  var res = syncDocCounts(REPO_ROOT, { write: !check });
  var c = res.counts;

  process.stdout.write(
    "[sync-doc-counts] ground truth: " +
      c.SKILLS +
      " skills / " +
      c.AGENTS +
      " agents / " +
      c.RECIPES +
      " recipes / DS " +
      c.DS.count +
      "(" +
      c.DS.sets +
      " sets) / FM " +
      c.FM.count +
      "(" +
      c.FM.sets +
      " sets) / Meta " +
      c.META.count +
      "(" +
      c.META.sets +
      " sets) / " +
      c.GUIDE.total +
      " guideline docs\n",
  );

  if (res.changed.length === 0) {
    process.stdout.write("[sync-doc-counts] all managed docs already in sync\n");
    return 0;
  }

  if (check) {
    process.stderr.write(
      "[sync-doc-counts] STALE — these docs do not match ground truth:\n",
    );
    res.changed.forEach(function (f) {
      process.stderr.write("  " + f + "\n");
    });
    process.stderr.write(
      "  Run `node scripts/vendor/sync-doc-counts.js` to fix.\n",
    );
    return 1;
  }

  process.stdout.write("[sync-doc-counts] rewrote:\n");
  res.changed.forEach(function (f) {
    process.stdout.write("  " + f + "\n");
  });
  return 0;
}

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

module.exports = { main: main };
