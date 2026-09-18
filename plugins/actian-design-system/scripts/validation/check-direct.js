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

function checkDirect(o) {
  var f = [];
  var body = o.body || "", js = o.appJs || "", extra = o.extraCss || "";
  var defined = {};
  all(/(--[a-z0-9-]+)\s*:/gi, o.css || "").forEach(function (t) { defined[t] = true; });
  all(/(--[a-z0-9-]+)\s*:/gi, extra).forEach(function (t) { defined[t] = true; });
  var classes = {};
  all(/\.(ds-[a-z0-9_-]+)/gi, o.css || "").forEach(function (c) { classes[c] = true; });

  [["body.html", body], ["app.js", js], ["extra.css", extra]].forEach(function (pair) {
    if (/\b(?:src|href)\s*=\s*["']?(?:https?:)?\/\//i.test(pair[1]) || /url\(\s*["']?https?:/i.test(pair[1]))
      f.push(finding("error", "external-url", pair[0], "an external URL: the page must open offline"));
    if (pair[1].indexOf("{{") !== -1)
      f.push(finding("error", "unfilled-token", pair[0], "a {{placeholder}} was left in"));
  });
  uniq(all(/data-icon="([^"]+)"/g, body)).forEach(function (slug) {
    if (!(o.icons || {})[slug]) f.push(finding("error", "unknown-icon", "body.html", 'no icon "' + slug + '" in icons.json'));
  });
  uniq(all(/var\(\s*(--[a-z0-9-]+)/gi, body + extra)).forEach(function (t) {
    if (!defined[t]) f.push(finding("error", "unknown-token", "extra.css", t + " is not a design system token"));
  });
  uniq(all(/class="([^"]*)"/g, body).join(" ").split(/\s+/).filter(function (c) { return /^ds-/.test(c); })).forEach(function (c) {
    if (!classes[c]) f.push(finding("error", "unknown-ds-class", "body.html", "." + c + " has no rule in the stylesheet"));
  });
  if (/#[0-9a-f]{3,8}\b|rgba?\(/i.test(extra.replace(/var\([^)]*\)/g, "")))
    f.push(finding("warning", "raw-colour", "extra.css", "a colour typed by hand: use a token"));
  if (!/<div[^>]*\sdata-app-frame/.test(body))
    f.push(finding("error", "frame-missing", "body.html", "no <div data-app-frame> around the content area"));
  if (/\bds-header\b|\bds-side-nav\b/.test(body))
    f.push(finding("error", "frame-redrawn", "body.html", "the header and the side navigation are drawn by the assembler"));
  var want = ((o.brief.direct && o.brief.direct.steps) || []).map(function (s) { return s.id; });
  var m = js.match(/proto\.steps\s*=\s*\[([\s\S]*?)\];/);
  var got = m ? all(/\bid\s*:\s*["']([^"']+)["']/g, m[1]) : [];
  if (JSON.stringify(got) !== JSON.stringify(want))
    f.push(finding("error", "step-mismatch", "app.js", "proto.steps ids are [" + got.join(", ") + "], the screen list's are [" + want.join(", ") + "]"));
  var placed = uniq(all(/data-new="([^"]+)"/g, body));
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
