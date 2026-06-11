// scripts/fidelity/resolve-binaries.js
"use strict";
var fs = require("node:fs");
var cp = require("node:child_process");

// Default existence check: absolute path → fs; bare name → PATH lookup via `command -v`.
// `p` must be a trusted binary name/path (resolver constants) — never user-supplied
// input, since the bare-name branch interpolates it into a shell command.
function defaultExists(p) {
  if (p.indexOf("/") >= 0) {
    try {
      fs.accessSync(p, fs.constants.X_OK);
      return true;
    } catch (e) {
      return false;
    }
  }
  try {
    cp.execSync("command -v " + JSON.stringify(p), { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

function resolveBinary(candidates, opts) {
  opts = opts || {};
  var exists = opts.exists || defaultExists;
  for (var i = 0; i < candidates.length; i++) {
    if (candidates[i] && exists(candidates[i])) return candidates[i];
  }
  return null;
}

function resolveChrome(opts) {
  opts = opts || {};
  var env = opts.env || process.env;
  var candidates = [];
  if (env.CHROME_BIN) candidates.push(env.CHROME_BIN);
  candidates.push(
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
    "chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  );
  return resolveBinary(candidates, { exists: opts.exists });
}

// Chrome is the ONLY external tool the gate needs (rendering requires a browser
// engine; there is no pure-JS substitute). Image decode + diff are pure-JS
// (vendored pngjs + pixelmatch), so no system image tool is required.
function requireAll(resolved) {
  if (!resolved.chrome) {
    throw new Error(
      "[fidelity] missing required tool:\n  - " +
        "Chrome/Chromium (set CHROME_BIN, or install Google Chrome)",
    );
  }
  return resolved;
}

function resolveAll(opts) {
  return { chrome: resolveChrome(opts) };
}

module.exports = {
  resolveBinary: resolveBinary,
  resolveChrome: resolveChrome,
  requireAll: requireAll,
  resolveAll: resolveAll,
  defaultExists: defaultExists,
};
