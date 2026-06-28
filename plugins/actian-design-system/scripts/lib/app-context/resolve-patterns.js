#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var PATHS = require(path.join(__dirname, "..", "paths.js"));

// Optional injection seam (testing): `ctx` may be a pre-loaded context object
// (used as-is) or a path string. Production calls omit it → reads
// PATHS.appContext. Mirrors resolve-chrome.js loadAppContext().
function loadAppContext(ctx) {
  if (ctx && typeof ctx === "object") return ctx;
  var p = ctx && typeof ctx === "string" ? ctx : PATHS.appContext;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

function normalizeApp(appName) {
  if (typeof appName !== "string") return "";
  return appName.trim().toLowerCase();
}

// "search-filtered-table" → ["search","filtered","table"]
function slugTags(slug) {
  if (typeof slug !== "string") return [];
  return slug
    .toLowerCase()
    .split("-")
    .filter(function (t) {
      return t.length > 0;
    });
}

function resolvePatterns(appName, ctx) {
  var key = normalizeApp(appName);
  if (!key) return [];
  var data = loadAppContext(ctx);
  if (!data || !data.patterns) return [];
  var out = [];
  Object.keys(data.patterns).forEach(function (slug) {
    var p = data.patterns[slug] || {};
    var apps = Array.isArray(p.apps) ? p.apps : [];
    if (apps.indexOf(key) === -1) return;
    out.push({
      slug: slug,
      label: p.label || "",
      description: p.description || "",
      tags: slugTags(slug),
    });
  });
  return out;
}

function resolveUseCases(appName, ctx) {
  var key = normalizeApp(appName);
  if (!key) return [];
  var data = loadAppContext(ctx);
  if (!data || !data.apps || !data.apps[key]) return [];
  var uc = data.apps[key].useCases;
  return Array.isArray(uc) ? uc : [];
}

function listApps(ctx) {
  var data = loadAppContext(ctx);
  if (!data || !data.apps) return [];
  return Object.keys(data.apps);
}

module.exports = {
  resolvePatterns: resolvePatterns,
  resolveUseCases: resolveUseCases,
  normalizeApp: normalizeApp,
  listApps: listApps,
  slugTags: slugTags,
};

// Thin CLI: `resolve-patterns.js --app studio` → { app, patterns, useCases }.
// Parity with resolve-chrome.js --app.
if (require.main === module) {
  var args = process.argv.slice(2);
  var appIdx = args.indexOf("--app");
  if (appIdx !== -1 && args[appIdx + 1]) {
    var app = args[appIdx + 1];
    var key = normalizeApp(app);
    var known = listApps().indexOf(key) !== -1;
    process.stdout.write(
      JSON.stringify(
        {
          app: key,
          patterns: resolvePatterns(app),
          useCases: resolveUseCases(app),
        },
        null,
        2,
      ) + "\n",
    );
    process.exit(known ? 0 : 1);
  }
  process.stderr.write("usage: resolve-patterns.js --app <name>\n");
  process.exit(2);
}
