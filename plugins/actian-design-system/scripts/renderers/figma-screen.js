#!/usr/bin/env node
"use strict";
// One screen JSON -> one Figma screen tree -> Plugin API JS for one use_figma call.
// Replaces the documented push's array wrapper; drops keys the emitter refuses
// (slot, focus, goto come from authored content); resolves var(--token) to hex.
var fs = require("fs");
var path = require("path");
var screenTree = require("./html-renderers/ds-screen-tree.js").screenTree;
var DROP = ["slot", "focus", "goto"];

function tokenMap(css) {
  var t = {};
  String(css).replace(/(--[\w-]+)\s*:\s*([^;}]+)[;}]/g, function (m, k, v) {
    if (!(k in t)) t[k] = v.trim();
    return m;
  });
  return t;
}

function prepareScreen(screen, opts) {
  var tokens = tokenMap((opts && opts.tokensCss) || "");
  var unresolved = [];
  function resolve(v, depth) {
    return v.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/g, function (m, k, fb) {
      var t = tokens[k] != null ? tokens[k] : fb != null ? fb.trim() : null;
      if (t == null) {
        if (unresolved.indexOf(k) === -1) unresolved.push(k);
        return m;
      }
      return depth < 5 && /var\(/.test(t) ? resolve(t, depth + 1) : t;
    });
  }
  function clean(n) {
    if (Array.isArray(n)) return n.map(clean);
    if (n && typeof n === "object") {
      var o = {};
      Object.keys(n).forEach(function (k) {
        if (DROP.indexOf(k) === -1) o[k] = clean(n[k]);
      });
      return o;
    }
    return typeof n === "string" && n.indexOf("var(") !== -1 ? resolve(n, 0) : n;
  }
  var input = Object.assign({ library: "ds" }, screen);
  return { tree: clean(screenTree(input)), unresolved: unresolved };
}

function main(argv) {
  var file = argv[2];
  var i = argv.indexOf("--parent-id");
  if (!file || i === -1 || !argv[i + 1]) {
    process.stderr.write("usage: figma-screen.js <screen.json> --parent-id <node id>\n");
    return 2;
  }
  var PATHS = require(path.join(__dirname, "..", "lib", "paths.js"));
  var screen = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
  var css = fs.readFileSync(PATHS.tokens.css, "utf8");
  var r = prepareScreen(screen, { tokensCss: css });
  if (r.unresolved.length) {
    process.stderr.write(
      JSON.stringify({
        ok: false,
        errors: r.unresolved.map(function (k) {
          return { path: k, message: "token not defined in tokens.css" };
        }),
      }) + "\n",
    );
    return 1;
  }
  var cp = require("child_process");
  var out = cp.spawnSync(
    process.execPath,
    [path.join(__dirname, "html-renderers", "render-node-figma.js"), "--parent-id", argv[i + 1]],
    { input: JSON.stringify(r.tree), stdio: ["pipe", "inherit", "inherit"] },
  );
  return out.status == null ? 1 : out.status;
}

module.exports = { prepareScreen: prepareScreen, tokenMap: tokenMap };
if (require.main === module) process.exit(main(process.argv));
