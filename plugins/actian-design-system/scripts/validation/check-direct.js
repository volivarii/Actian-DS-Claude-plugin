#!/usr/bin/env node
"use strict";

// check-direct.js: what a script can know about a direct prototype's source,
// in the validator's finding shape. Reads the author's files, not the page -
// except app.js's proto.steps, which no text scan can read reliably (a regex
// literal's own character class, an array built with .map(), and plenty more
// all look enough like object/array syntax to fool a bracket counter). That
// one part is EVALUATED: app.js runs for real, inside a throwaway node:vm
// context with a permissive browser-global stub and a 1-second timeout, and
// checkDirect reads whatever the script actually left on proto.steps.
// checkDirect itself stays synchronous and pure apart from that evaluation.
// Twelve checks: eleven read what the four files declare or omit; the
// twelfth (unsafe-embed) reads for the two escape sequences assemble-direct.js
// deliberately does not rewrite when it embeds extra.css in a <style> element
// and app.js in a <script> element (it escapes </script, nothing else).
//
// Terminology is not checked here on purpose: knowledge #720 shows
// terminology.yml contradicts the running product on "item", so wiring a
// terminology check now would print a false finding on every run. It joins
// once roadmap 323 settles the word.

var fs = require("fs");
var path = require("path");
var vm = require("vm");

function finding(sev, check, p, value) {
  return { severity: sev, check: check, path: p, value: value };
}
function uniq(a) {
  return a.filter(function (x, i) { return a.indexOf(x) === i; });
}
function all(re, s) {
  var out = [], m;
  while ((m = re.exec(s))) out.push(m[1]);
  return out;
}

// CSS comments can name a class, a token or a colour that has no real rule
// behind it; masked to spaces (never stripped, so no offset ever shifts -
// this codebase has had CSS-comment stripping break the same parser three
// times), so a mention inside a comment never counts as a definition.
function maskCssComments(s) {
  return String(s || "").replace(/\/\*[\s\S]*?\*\//g, function (m) {
    return m.replace(/[^\n]/g, " ");
  });
}

// Attribute value reader that accepts either quote style, since an author
// may write class='x' as freely as class="x". Two alternatives share one
// capture slot: whichever quote matched is the one with a defined group.
function allAttr(name, s) {
  var re = new RegExp(name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')", "g");
  var out = [], m;
  while ((m = re.exec(s))) out.push(m[1] !== undefined ? m[1] : m[2]);
  return out;
}

// A permissive stand-in for a browser global this checker does not model
// itself (document, navigator, localStorage, ...): every property read,
// call, or construct on it just returns the same stub, so an author's
// top-level DOM code (document.getElementById(...).addEventListener(...),
// for instance) runs to completion instead of throwing on the first access
// into a plain {}. Symbol.toPrimitive/Symbol.iterator/length/then are given
// harmless real values so the stub is never coerced into something odd or
// mistaken for a promise or a non-empty iterable.
function browserStub() {
  var stub;
  var handler = {
    get: function (target, prop) {
      if (prop === Symbol.toPrimitive) return function () { return ""; };
      if (prop === Symbol.iterator)
        return function () { return { next: function () { return { done: true, value: undefined }; } }; };
      if (prop === "then") return undefined;
      if (prop === "length") return 0;
      return stub;
    },
    apply: function () { return stub; },
    construct: function () { return stub; },
  };
  stub = new Proxy(function () {}, handler);
  return stub;
}

// Reads proto.steps by actually RUNNING app.js, not by scanning its text -
// see the file header for why a text scan cannot do this reliably. Runs in
// a throwaway node:vm context stocked with a real proto object and window
// pointing at the same sandbox (so window.proto and the bare identifier
// proto are the same object, matching how the assembled page's own runtime
// script sets window.proto before app.js runs - see direct-shell.js's
// RUNTIME), plus a permissive stub for whatever other browser globals
// top-level code touches. A 1-second timeout keeps a script that loops
// forever from hanging the checker.
//
// Returns PLAIN data only, never a sandbox object: every read off proto.steps
// (including each step's own .id, which can be a getter written by the
// author's script) happens inside the same try this function's evaluation
// runs in, so a throwing getter - or any other surprise a live object from
// the sandbox could spring on its caller - becomes this function's own
// { error } result instead of an exception checkDirect would have to catch
// a second time. checkDirect never touches proto or its steps directly.
function evaluateProtoSteps(js) {
  var proto = { steps: [], current: 0, go: function () {} };
  var sandbox = {};
  sandbox.proto = proto;
  sandbox.window = sandbox;
  sandbox.document = browserStub();
  sandbox.location = { search: "", pathname: "/" };
  sandbox.localStorage = browserStub();
  sandbox.navigator = browserStub();
  sandbox.console = {
    log: function () {}, warn: function () {}, error: function () {}, info: function () {}, debug: function () {},
  };
  sandbox.setTimeout = function () { return 0; };
  sandbox.setInterval = function () { return 0; };
  sandbox.clearTimeout = function () {};
  sandbox.clearInterval = function () {};
  sandbox.requestAnimationFrame = function () { return 0; };
  sandbox.URLSearchParams = URLSearchParams;
  try {
    vm.runInNewContext(js, sandbox, { timeout: 1000 });
    var steps = Array.isArray(proto.steps) ? proto.steps : [];
    var ids = steps.map(function (s) {
      var id = s && s.id; // the property read stays inside this try
      if (id === undefined || id === null) return "";
      return String(id);
    });
    return { ids: ids };
  } catch (e) {
    return { error: e && e.message ? e.message : String(e) };
  }
}

function checkDirect(o) {
  var f = [];
  var body = o.body || "", js = o.appJs || "", extra = o.extraCss || "";
  var cssM = maskCssComments(o.css || "");
  var extraM = maskCssComments(extra);
  var defined = {};
  all(/(--[a-z0-9-]+)\s*:/gi, cssM).forEach(function (t) { defined[t] = true; });
  all(/(--[a-z0-9-]+)\s*:/gi, extraM).forEach(function (t) { defined[t] = true; });
  var classes = {};
  all(/\.(ds-[a-z0-9_-]+)/gi, cssM).forEach(function (c) { classes[c] = true; });

  [["body.html", body], ["app.js", js], ["extra.css", extra]].forEach(function (pair) {
    if (/\b(?:src|href)\s*=\s*["']?(?:https?:)?\/\//i.test(pair[1]) || /url\(\s*["']?https?:/i.test(pair[1]))
      f.push(finding("error", "external-url", pair[0], "an external URL: the page must open offline"));
    if (pair[1].indexOf("{{") !== -1)
      f.push(finding("error", "unfilled-token", pair[0], "a {{placeholder}} was left in"));
  });
  uniq(allAttr("data-icon", body)).forEach(function (slug) {
    if (!(o.icons || {})[slug]) f.push(finding("error", "unknown-icon", "body.html", 'no icon "' + slug + '" in icons.json'));
  });
  uniq(all(/var\(\s*(--[a-z0-9-]+)/gi, body + extraM)).forEach(function (t) {
    if (!defined[t]) f.push(finding("error", "unknown-token", "extra.css", t + " is not a design system token"));
  });
  uniq(allAttr("class", body).join(" ").split(/\s+/).filter(function (c) { return /^ds-/.test(c); })).forEach(function (c) {
    if (!classes[c]) f.push(finding("error", "unknown-ds-class", "body.html", "." + c + " has no rule in the stylesheet"));
  });
  if (/#[0-9a-f]{3,8}\b|rgba?\(/i.test(extraM.replace(/var\([^)]*\)/g, "")))
    f.push(finding("warning", "raw-colour", "extra.css", "a colour typed by hand: use a token"));
  if (!/<div[^>]*\sdata-app-frame/.test(body))
    f.push(finding("error", "frame-missing", "body.html", "no <div data-app-frame> around the content area"));
  if (/\bds-header\b|\bds-side-nav\b/.test(body))
    f.push(finding("error", "frame-redrawn", "body.html", "the header and the side navigation are drawn by the assembler"));
  var want = ((o.brief.direct && o.brief.direct.steps) || []).map(function (s) { return s.id; });
  var evaluated = evaluateProtoSteps(js);
  if (evaluated.error) {
    f.push(finding("warning", "steps-unread", "app.js", "app.js could not be evaluated to read proto.steps: " + evaluated.error));
  } else {
    var got = evaluated.ids;
    if (JSON.stringify(got) !== JSON.stringify(want))
      f.push(finding("error", "step-mismatch", "app.js", "proto.steps ids are [" + got.join(", ") + "], the screen list's are [" + want.join(", ") + "]"));
  }
  var placed = uniq(allAttr("data-new", body));
  var declared = (((o.meta || {}).adds) || []).map(function (a) { return a.name; });
  placed.forEach(function (n) {
    if (declared.indexOf(n) === -1) f.push(finding("warning", "new-undeclared", "body.html", 'data-new "' + n + '" has no entry in meta.adds'));
  });
  declared.forEach(function (n) {
    if (placed.indexOf(n) === -1) f.push(finding("warning", "add-unplaced", "meta.json", 'meta.adds "' + n + '" marks nothing on the page'));
  });
  if (/<\/style/i.test(extra))
    f.push(finding("error", "unsafe-embed", "extra.css", "a literal </style would close the assembler's style element early"));
  if (js.indexOf("<!--") !== -1)
    f.push(finding("error", "unsafe-embed", "app.js", "a literal <!-- is left unescaped inside the assembler's script element"));
  return f;
}

function main(argv) {
  var a = argv.indexOf("--author");
  if (!argv[0] || a === -1) {
    process.stderr.write("usage: check-direct.js <brief.json> --author <dir>\n");
    return 1;
  }
  var dir = argv[a + 1];
  var rd = function (p) { return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : ""; };
  var brief = JSON.parse(fs.readFileSync(argv[0], "utf8"));
  var as = brief.direct.assets;
  var meta = rd(path.join(dir, "meta.json"));
  // The page's own stylesheet is every file in assets.frameCss joined, so
  // "defined token" and "defined ds-* class" mean "defined in what the page
  // ships" (assemble-direct.js reads the same list, in the same order).
  // Older briefs that predate frameCss fall back to the two single-file
  // entries an author reads.
  var css = Array.isArray(as.frameCss) && as.frameCss.length
    ? as.frameCss.map(function (p) { return rd(p); }).join("\n")
    : rd(as.tokensCss) + "\n" + rd(as.baseCss);
  // icons.json is {_schema_version, _meta, icons: {<slug>: {...}}}; unwrap to
  // the flat slug map checkDirect takes. A file that is already a flat map
  // (no top-level "icons" key) is accepted as-is.
  var iconDoc = JSON.parse(rd(as.icons) || "{}");
  var icons = iconDoc.icons && typeof iconDoc.icons === "object" ? iconDoc.icons : iconDoc;
  var findings = checkDirect({
    brief: brief, body: rd(path.join(dir, "body.html")), appJs: rd(path.join(dir, "app.js")),
    extraCss: rd(path.join(dir, "extra.css")), meta: meta ? JSON.parse(meta) : {},
    css: css, icons: icons,
  });
  findings.forEach(function (x) {
    process.stdout.write((x.severity === "error" ? "P0" : "P1") + " [" + x.check + "] " + x.path + " → " + x.value + "\n");
  });
  process.stdout.write(findings.length ? "" : "check-direct: clean\n");
  return findings.some(function (x) { return x.severity === "error"; }) ? 1 : 0;
}

module.exports = { checkDirect: checkDirect, main: main };
if (require.main === module) process.exitCode = main(process.argv.slice(2));
