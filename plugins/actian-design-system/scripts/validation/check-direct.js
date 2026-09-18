#!/usr/bin/env node
"use strict";

// check-direct.js: what a script can know about a direct prototype's source,
// in the validator's finding shape. Reads the author's files, not the page.
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

// Advances past one string literal (', ", `) or comment (//, /* */) starting
// at s[i], returning the index just after it, or -1 if s[i] starts neither.
// Every bracket-depth walk below calls this first so a stray [ ] { } inside
// a quoted string or a comment is never mistaken for real nesting.
function skipStringOrComment(s, i) {
  var n = s.length, c = s[i];
  if (c === '"' || c === "'" || c === "`") {
    var quote = c, j = i + 1;
    while (j < n) {
      if (s[j] === "\\") { j += 2; continue; }
      if (s[j] === quote) { j++; break; }
      j++;
    }
    return j;
  }
  if (c === "/" && s[i + 1] === "/") {
    var nl = s.indexOf("\n", i);
    return nl === -1 ? n : nl + 1;
  }
  if (c === "/" && s[i + 1] === "*") {
    var end = s.indexOf("*/", i + 2);
    return end === -1 ? n : end + 2;
  }
  return -1;
}

// The naive /proto\.steps\s*=\s*\[([\s\S]*?)\];/ is non-greedy up to the
// FIRST literal "];", so an arrive() body containing its own array
// terminated by a semicolon (e.g. "var xs = [1, 2]; return xs;") truncates
// the capture there and reports a false step-mismatch on a clean file.
// Walk the source instead, tracking [ ] { } nesting depth (skipping strings
// and comments) so only the array's own matching "]" ends it. Depth 1 is
// "inside the steps array"; a "{" there opens one top-level step object
// (depth 2); arrive()'s own body is a further brace (depth 3+), so it never
// gets mistaken for a second array element.
function topLevelStepObjects(js) {
  var i = js.indexOf("proto.steps");
  if (i === -1) return [];
  var eq = js.indexOf("=", i);
  var open = eq === -1 ? -1 : js.indexOf("[", eq);
  if (open === -1) return [];
  var n = js.length, depth = 0, objStart = -1, objects = [];
  var j = open;
  while (j < n) {
    var skip = skipStringOrComment(js, j);
    if (skip !== -1) { j = skip; continue; }
    var c = js[j];
    if (c === "[" || c === "{") {
      depth++;
      if (c === "{" && depth === 2) objStart = j;
      j++;
      continue;
    }
    if (c === "]" || c === "}") {
      if (c === "}" && depth === 2 && objStart !== -1) {
        objects.push(js.slice(objStart, j + 1));
        objStart = -1;
      }
      depth--;
      j++;
      if (depth === 0) break;
      continue;
    }
    j++;
  }
  return objects;
}

// The id: key belongs to a step object only when it sits directly inside
// that object's own braces (structural depth 1, counted from the object's
// own opening "{"); anything nested deeper - arrive()'s function body and
// everything inside it - is masked to spaces first (character for
// character, strings and comments skipped the same way as above) so an
// id-shaped key written inside arrive() is never read as the step's id.
function topLevelIdOf(objSrc) {
  var n = objSrc.length, depth = 0, out = "", i = 0;
  while (i < n) {
    var skip = skipStringOrComment(objSrc, i);
    if (skip !== -1) {
      var chunk = objSrc.slice(i, skip);
      out += depth <= 1 ? chunk : chunk.replace(/[^\n]/g, " ");
      i = skip;
      continue;
    }
    var c = objSrc[i];
    if (c === "[" || c === "{") { depth++; out += depth <= 1 ? c : " "; i++; continue; }
    if (c === "]" || c === "}") { out += depth <= 1 ? c : " "; depth--; i++; continue; }
    out += depth <= 1 ? c : " ";
    i++;
  }
  var m = /\bid\s*:\s*["'`]([^"'`]+)["'`]/.exec(out);
  return m ? m[1] : null;
}

function extractProtoStepIds(js) {
  return topLevelStepObjects(js).map(topLevelIdOf);
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
  var got = extractProtoStepIds(js);
  if (JSON.stringify(got) !== JSON.stringify(want))
    f.push(finding("error", "step-mismatch", "app.js", "proto.steps ids are [" + got.join(", ") + "], the screen list's are [" + want.join(", ") + "]"));
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
