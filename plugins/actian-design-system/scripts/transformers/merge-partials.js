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
    } else if (argv[i] === "--incremental") {
      args.incremental = true;
    } else if (argv[i] === "--screen-list") {
      args.screenList = argv[++i];
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

// A partial's screen name is sometimes authored with the agent's own
// "Screen N: " (or ". " / "- ") prefix rather than the screen list's plain
// name verbatim. Strip that prefix before matching so a partial named
// "Screen 2: Data product detail" still fills the list entry
// "Data product detail".
function canonicalName(s) {
  // Separator after the digits must be ":" or "-", or "." followed by
  // whitespace -- plain "." would also match the "." in a decimal
  // sub-numbering scheme like "Screen 2.1: Foo", over-stripping down to
  // "1: Foo". Requiring whitespace after "." keeps "2.1" intact while
  // still stripping "Screen 2. Foo".
  return String(s)
    .replace(/^\s*screen\s*\d+\s*(?::|-|\.(?=\s))\s*/i, "")
    .trim();
}

// Incremental skeleton-fill (flow only): given the ordered screen list and
// whatever partials exist so far, emit a renderable flow-data where present
// screens are ready (verbatim, NO status field) and not-yet-generated slots are
// { name, template, status:"pending" } placeholders. Tolerates an empty/missing
// partials dir (0 partials -> pure skeleton). With all screens present and the
// list in the same order as the partials, the screens array matches mergeArray.
function mergeIncrementalFlow(partialsDir, screenListPath) {
  if (!screenListPath) die("--incremental requires --screen-list <file>");
  // The screen list is machine-generated by the streaming skill: names are
  // assumed unique (a duplicate would map to the same partial) and authoritative
  // (a partial whose name is absent from the list is intentionally skipped).
  let list;
  try {
    list = JSON.parse(fs.readFileSync(screenListPath, "utf8"));
  } catch (e) {
    die("cannot parse screen-list JSON (" + screenListPath + "): " + e.message);
  }
  const listScreens = Array.isArray(list.screens) ? list.screens : [];

  const byName = {};
  let meta = list.meta || null;
  if (fs.existsSync(partialsDir)) {
    const files = fs
      .readdirSync(partialsDir)
      .filter((f) => f.endsWith(".json") && f !== "output.json")
      .sort();
    for (const f of files) {
      const p = JSON.parse(fs.readFileSync(path.join(partialsDir, f), "utf8"));
      if (p.meta && !meta) meta = p.meta;
      const arr = Array.isArray(p.screens) ? p.screens : [];
      for (const sc of arr) {
        if (sc && sc.name != null) byName[canonicalName(sc.name)] = sc;
      }
    }
  }

  const screens = listScreens.map((entry) => {
    const real = byName[canonicalName(entry.name)];
    if (real) return { ...real, name: entry.name };
    const stub = { name: entry.name, status: "pending" };
    if (entry.template != null) stub.template = entry.template;
    return stub;
  });

  if (!meta) meta = {};
  // Ids and layers are data from the screen list, not text an agent can
  // write or drop: every id is derived here from the LIST's own
  // meta.feature (never a partial's meta, so a list with no meta matches
  // what prepare-flow.js put in `flow`), unconditionally, so a clashing or
  // made-up agent-written id never survives merge and never shifts another
  // screen's id. This runs as its own full pass, before the layer pass
  // below, so a layer whose base comes later in the list still finds that
  // base's id already stamped.
  const { deriveScreenId } = require("../lib/screen-id.js");
  const idFeature = (list.meta && list.meta.feature) || "";
  listScreens.forEach((entry, i) => {
    if (!screens[i]) return;
    screens[i].id = deriveScreenId(idFeature, i);
  });
  // A layer is declared in the screen list and validated by prepare-flow, so
  // it is stamped here from data rather than trusted to each author agent.
  // over names a screen number there; the rendered flow needs the base's id,
  // stamped above. A screen the list does not layer keeps no layer, even if
  // an agent wrote one.
  listScreens.forEach((entry, i) => {
    if (!screens[i]) return;
    if (!entry.layer) {
      delete screens[i].layer;
      return;
    }
    const base = screens[entry.layer.over - 1];
    screens[i].layer = {
      kind: entry.layer.kind,
      over: base ? base.id : String(entry.layer.over),
    };
  });
  // A declared exit is data too: what the user does to move on, and the id it
  // leads to. The validator reads it from the screen to report a declared
  // exit no node carries a goto for.
  listScreens.forEach((entry, i) => {
    if (!screens[i]) return;
    const next = screens[i + 1];
    if (typeof entry.exit === "string" && entry.exit.trim() && next) {
      screens[i].exit = { via: entry.exit.trim(), to: next.id };
    } else {
      delete screens[i].exit;
    }
  });
  // The rail is the same on every screen of a flow, so it is stamped from the
  // list's chrome (a justified custom chrome included), never authored per
  // screen. A layer renders over its base and draws no chrome of its own. A
  // template that speaks for no app, or a list with no chrome, is left alone.
  const {
    TEMPLATE_APP,
  } = require("../renderers/html-renderers/ds-screen-tree.js");
  const listChrome =
    list.meta && list.meta._glossary && list.meta._glossary.chrome;
  const rail =
    listChrome && Array.isArray(listChrome.sidebar) ? listChrome.sidebar : [];
  listScreens.forEach((entry, i) => {
    const sc = screens[i];
    if (!sc) return;
    if (entry.layer) {
      delete sc.navItems;
      delete sc.activeNavItem;
      delete sc.sidebar;
      return;
    }
    if (!rail.length || !TEMPLATE_APP[entry.template]) return;
    const navId = entry.nav || (list.meta && list.meta.nav) || null;
    let active = null;
    sc.navItems = rail.map((it) => {
      const item = { label: it.label };
      if (navId && it.id === navId) {
        item.state = "On";
        active = it.label;
      }
      return item;
    });
    delete sc.sidebar;
    if (active) sc.activeNavItem = active;
    else delete sc.activeNavItem;
  });
  const pending = screens.filter((s) => s.status === "pending").length;
  log(
    "Incremental flow: " +
      (screens.length - pending) +
      " ready / " +
      pending +
      " pending of " +
      screens.length,
  );
  return { meta, screens };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv);

  if (!args.type) die("--type is required (brief|flow|presentation)");
  if (!args.partialsDir) die("--partials-dir is required");
  if (!args.output) die("--output is required");

  // Incremental skeleton-fill path (flow only) — does NOT require partials to exist.
  if (args.incremental) {
    if (args.type !== "flow")
      die("--incremental is only supported for --type flow");
    const result = mergeIncrementalFlow(args.partialsDir, args.screenList);
    // Stamp stable screen ids (feature-slug-index) onto every screen,
    // pending stubs included, so a later --scope single-unit:<id> refine
    // has a handle even before that screen is generated.
    require("../lib/screen-id.js").stampScreenIds(result);
    const outDir = path.dirname(args.output);
    if (outDir && !fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(args.output, JSON.stringify(result, null, 2));
    return;
  }

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

  // Stamp stable screen ids on the plain flow merge too, so every write
  // site (incremental and plain) leaves flow-data.json with ids to refine.
  if (args.type === "flow")
    require("../lib/screen-id.js").stampScreenIds(result);

  fs.writeFileSync(args.output, JSON.stringify(result, null, 2));
}

main();
