#!/usr/bin/env node
"use strict";
// One screen JSON -> one Figma screen tree -> Plugin API JS for one use_figma call.
// Replaces the documented push's array wrapper; drops keys the emitter refuses
// (slot, focus, goto come from authored content); resolves var(--token) to hex.
var fs = require("fs");
var path = require("path");
var dsTree = require("./html-renderers/ds-screen-tree.js");
var DROP = ["slot", "focus", "goto"];
var COLOUR_KEYS = ["fills", "color"]; // stroke colours arrive as stroke.color
var HEX = /^#[0-9a-f]{3,8}$/i;
var PX = /^-?\d+(\.\d+)?(px)?$/;

// The tokens a screen of this theme sees: the :root block, then the theme's own
// block over it (tokens.css defines `:root, [data-theme="actian"]` first, then
// one override block per app theme).
function tokenMap(css, theme) {
  var base = {},
    over = {};
  String(css)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/([^{}]+)\{([^{}]*)\}/g, function (m, sel, body) {
      var sels = sel.split(",").map(function (x) {
        return x.trim();
      });
      var target = sels.indexOf(":root") !== -1 ? base : theme && sels.indexOf('[data-theme="' + theme + '"]') !== -1 ? over : null;
      if (target)
        body.replace(/(--[\w-]+)\s*:\s*([^;]+)/g, function (d, k, v) {
          if (!(k in target)) target[k] = v.trim();
          return d;
        });
      return m;
    });
  return Object.assign(base, over);
}

// Replaces every var(--name[, fallback]) in v, with balanced parentheses so a
// fallback may itself be a var() or an rgb(); a name with neither a value nor
// a fallback is reported and left as written.
function resolveVars(v, tokens, unresolved, depth) {
  var out = "",
    i = 0;
  for (;;) {
    var at = v.indexOf("var(", i);
    if (at === -1) return out + v.slice(i);
    var d = 0,
      j = at + 3,
      comma = -1;
    for (; j < v.length; j++) {
      if (v[j] === "(") d++;
      else if (v[j] === ")" && --d === 0) break;
      else if (v[j] === "," && d === 1 && comma === -1) comma = j;
    }
    var inner = v.slice(at + 4, j);
    var name = (comma === -1 ? inner : v.slice(at + 4, comma)).trim();
    var fb = comma === -1 ? null : v.slice(comma + 1, j).trim();
    var t = tokens[name] != null ? tokens[name] : fb;
    var r;
    if (t == null || depth > 5) {
      if (unresolved.indexOf(name) === -1) unresolved.push(name);
      r = v.slice(at, j + 1);
    } else r = t.indexOf("var(") !== -1 ? resolveVars(t, tokens, unresolved, depth + 1) : t;
    out += v.slice(i, at) + r;
    i = j + 1;
  }
}

function prepareScreen(screen, opts) {
  opts = opts || {};
  var input = Object.assign({ library: "ds" }, screen);
  var theme = dsTree.appProfile(dsTree.resolveChrome(input).appHeaderType).theme;
  var tokens = tokenMap(opts.tokensCss || "", theme);
  var unresolved = [];
  function clean(n, key) {
    if (Array.isArray(n))
      return n.map(function (x) {
        return clean(x, key);
      });
    if (n && typeof n === "object") {
      var o = {};
      Object.keys(n).forEach(function (k) {
        if (DROP.indexOf(k) === -1) o[k] = clean(n[k], k);
      });
      return o;
    }
    if (typeof n !== "string" || n.indexOf("var(") === -1) return n;
    var r = resolveVars(n, tokens, unresolved, 0);
    if (r.indexOf("var(") !== -1) return r;
    if (COLOUR_KEYS.indexOf(key) !== -1) {
      if (!HEX.test(r) && unresolved.indexOf(n) === -1) unresolved.push(n + " is not a colour (" + r + ")");
      return r;
    }
    // A spacing, padding or radius token is a CSS length; the emitter wants a number.
    return PX.test(r) ? parseFloat(r) : r;
  }
  // A top-level layer (drawer, toast) is placed on the screen, not in the
  // content area, so its x and y are screen coordinates.
  var content = input.content || [];
  var layers = content.filter(function (c) {
    return c && c.positioning === "absolute";
  });
  input.content = content.filter(function (c) {
    return !(c && c.positioning === "absolute");
  });
  dsTree.setAppContext(opts.appContext || null);
  var tree;
  try {
    tree = dsTree.screenTree(input);
  } finally {
    dsTree.setAppContext(null);
  }
  tree.children = (tree.children || []).concat(layers);
  return { tree: clean(tree), unresolved: unresolved };
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
  var appContext = JSON.parse(fs.readFileSync(PATHS.appContext, "utf8"));
  var r = prepareScreen(screen, { tokensCss: css, appContext: appContext });
  if (r.unresolved.length) {
    process.stderr.write(
      JSON.stringify({
        ok: false,
        errors: r.unresolved.map(function (k) {
          return { path: k, message: "token not resolved against tokens.css" };
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
