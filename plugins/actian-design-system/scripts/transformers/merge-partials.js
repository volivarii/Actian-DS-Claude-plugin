#!/usr/bin/env node
"use strict";

/**
 * merge-partials.js — Merge partial JSON outputs into a single file.
 *
 * Usage:
 *   node merge-partials.js --type brief|flow|presentation --partials-dir <dir> --output <file> [--partial]
 *
 * Three merge strategies:
 *   brief:        flat object merge of card keys; validates all 7 DS card keys unless --partial
 *   flow:         sorts partials by _index, concatenates screens[] arrays
 *   presentation: sorts partials by _index, concatenates slides[] arrays
 *
 * Exits non-zero on: no partials found, missing meta, missing card keys (brief without --partial),
 * empty array (flow/presentation).
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DS_CARD_KEYS = [
  "card_header",
  "variants",
  "anatomy",
  "tokens",
  "usage",
  "card_content",
  "accessibility",
];

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--type") {
      args.type = argv[++i];
    } else if (argv[i] === "--partials-dir") {
      args.partialsDir = argv[++i];
    } else if (argv[i] === "--output") {
      args.output = argv[++i];
    } else if (argv[i] === "--partial") {
      args.partial = true;
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function die(msg) {
  process.stderr.write("merge-partials: ERROR — " + msg + "\n");
  process.exit(1);
}

function log(msg) {
  process.stderr.write("merge-partials: " + msg + "\n");
}

function readPartials(dir) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "output.json")
    .sort();
  if (files.length === 0) die("no partials found in " + dir);
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    return JSON.parse(raw);
  });
}

// ---------------------------------------------------------------------------
// Merge strategies
// ---------------------------------------------------------------------------

function mergeBrief(partials, partial) {
  const merged = {};
  let meta = null;

  for (const p of partials) {
    if (p.meta && !meta) meta = p.meta;
    for (const [key, value] of Object.entries(p)) {
      if (key === "meta") continue;
      merged[key] = value;
    }
  }

  if (!meta) die("no meta found in any partial");

  // Validate all card keys present unless --partial
  if (!partial) {
    const missing = DS_CARD_KEYS.filter((k) => !(k in merged));
    if (missing.length > 0) {
      die("missing card keys: " + missing.join(", "));
    }
  }

  const result = { meta, ...merged };
  const cardCount = Object.keys(result).length - 1; // minus meta
  log("Merged " + partials.length + " partials \u2192 " + cardCount + " cards");
  return result;
}

function mergeArray(partials, arrayKey) {
  // Sort by _index
  const sorted = partials
    .slice()
    .sort((a, b) => (a._index || 0) - (b._index || 0));

  let meta = null;
  const items = [];

  for (const p of sorted) {
    if (p.meta && !meta) meta = p.meta;
    const arr = p[arrayKey];
    if (Array.isArray(arr)) {
      items.push(...arr);
    }
  }

  if (!meta) die("no meta found in any partial");
  if (items.length === 0) die("empty " + arrayKey + " array after merge");

  const result = { meta, [arrayKey]: items };
  log(
    "Merged " +
      partials.length +
      " partials \u2192 " +
      items.length +
      " " +
      arrayKey,
  );
  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv);

  if (!args.type) die("--type is required (brief|flow|presentation)");
  if (!args.partialsDir) die("--partials-dir is required");
  if (!args.output) die("--output is required");

  const partials = readPartials(args.partialsDir);
  let result;

  switch (args.type) {
    case "brief":
      result = mergeBrief(partials, args.partial);
      break;
    case "flow":
      result = mergeArray(partials, "screens");
      break;
    case "presentation":
      result = mergeArray(partials, "slides");
      break;
    default:
      die("unknown type: " + args.type + " (expected brief|flow|presentation)");
  }

  // Ensure output directory exists
  const outDir = path.dirname(args.output);
  if (outDir && !fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(args.output, JSON.stringify(result, null, 2));
}

main();
