#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var PATHS = require(path.join(__dirname, "..", "paths.js"));

function loadAppContext() {
  try {
    return JSON.parse(fs.readFileSync(PATHS.appContext, "utf8"));
  } catch (e) {
    return null;
  }
}

function normalizeApp(appName) {
  if (typeof appName !== "string") return "";
  return appName.trim().toLowerCase();
}

function resolveChrome(appName) {
  var key = normalizeApp(appName);
  if (!key) return null;
  var ctx = loadAppContext();
  if (!ctx || !ctx.apps || !ctx.apps[key]) return null;
  var app = ctx.apps[key];
  var sidebar = Array.isArray(app.sidebar)
    ? app.sidebar.map(function (it) {
        return { label: it.label, id: it.id };
      })
    : [];
  var headerType = app.header && app.header.type ? app.header.type : "";
  return { app: key, header: { type: headerType }, sidebar: sidebar };
}

function listApps() {
  var ctx = loadAppContext();
  if (!ctx || !ctx.apps) return [];
  return Object.keys(ctx.apps);
}

function appSignals() {
  var ctx = loadAppContext();
  var out = {};
  if (!ctx || !ctx.apps) return out;
  Object.keys(ctx.apps).forEach(function (k) {
    out[k] = Array.isArray(ctx.apps[k].signals) ? ctx.apps[k].signals : [];
  });
  return out;
}

module.exports = {
  resolveChrome: resolveChrome,
  normalizeApp: normalizeApp,
  listApps: listApps,
  appSignals: appSignals,
};

// Thin CLI: `resolve-chrome.js --app studio` → canonical chrome JSON; `--apps` → {app: signals}
if (require.main === module) {
  var args = process.argv.slice(2);
  var appIdx = args.indexOf("--app");
  if (appIdx !== -1 && args[appIdx + 1]) {
    var chrome = resolveChrome(args[appIdx + 1]);
    process.stdout.write(JSON.stringify(chrome, null, 2) + "\n");
    process.exit(chrome ? 0 : 1);
  }
  if (args.indexOf("--apps") !== -1) {
    process.stdout.write(JSON.stringify(appSignals(), null, 2) + "\n");
    process.exit(0);
  }
  process.stderr.write("usage: resolve-chrome.js --app <name> | --apps\n");
  process.exit(2);
}
