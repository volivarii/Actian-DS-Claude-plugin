#!/usr/bin/env node
"use strict";
// Checks a filled intent.md or specs.md against its template (vendored from the
// knowledge, app-context/src/handover/). The template's frontmatter lists the
// sections in document order, each with its owner; see the contract
// (project_simplify_contract_2026_09_29, "The handover templates").
var fs = require("fs");
var path = require("path");

var SOURCES = "(Figma|Prototype|Intent)";
var SOURCE_LINE = new RegExp("^Source:\\s*" + SOURCES + "(\\s*\\+\\s*" + SOURCES + ")*\\s*$");

function frontmatter(text) {
  var m = /^---\n([\s\S]*?)\n---/.exec(String(text || ""));
  var fm = { sections: [] };
  if (!m) return fm;
  m[1].split("\n").forEach(function (line) {
    var s = /^\s*-\s*\{\s*title:\s*(.+?),\s*owner:\s*(\w+),\s*required:\s*(true|false)\s*\}/.exec(line);
    if (s) fm.sections.push({ title: s[1].trim(), owner: s[2], required: s[3] === "true" });
    var g = /^gapMarker:\s*"(.*)"/.exec(line);
    if (g) fm.gapMarker = g[1];
    var k = /^kind:\s*(\w+)/.exec(line);
    if (k) fm.kind = k[1];
  });
  return fm;
}

// "## Title" -> the text under it, up to the next "## ".
function sections(text) {
  var out = {};
  String(text || "")
    .split(/^## /m)
    .slice(1)
    .forEach(function (p) {
      var nl = p.indexOf("\n");
      var title = (nl === -1 ? p : p.slice(0, nl)).trim();
      out[title] = nl === -1 ? "" : p.slice(nl + 1).trim();
    });
  return out;
}

// The prototype's text as a reader sees it, script bodies included: app.js
// writes most of a prototype's words at run time.
function visibleText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ");
}

// A copy string is in the prototype if it is there as written, or, when it
// carries a number, if every fixed run of words around the numbers is: the
// prototype builds "3 descriptions saved" from n + " descriptions saved".
function copyFound(s, visible) {
  if (visible.indexOf(s) !== -1) return true;
  if (!/\d/.test(s)) return false;
  var parts = s
    .split(/\d+/)
    .map(function (x) {
      return x.trim();
    })
    .filter(function (x) {
      return x.length >= 3;
    });
  return (
    parts.length > 0 &&
    parts.every(function (x) {
      return visible.indexOf(x) !== -1;
    })
  );
}

function checkHandover(kind, text, opts) {
  opts = opts || {};
  var f = [];
  var add = function (severity, check, where, value) {
    f.push({ severity: severity, check: check, where: where, value: value || "" });
  };
  var fm = frontmatter(opts.template);
  var secs = sections(text);
  fm.sections.forEach(function (s) {
    if (!(s.title in secs)) {
      if (s.required) add("error", "section-missing", s.title);
      return;
    }
    var body = secs[s.title];
    var content = kind === "specs" ? body.replace(/^Source:.*$/m, "").trim() : body;
    if (!content) add("error", "section-empty", s.title);
    if (kind === "intent" && fm.gapMarker && content.indexOf(fm.gapMarker) === 0)
      add("info", "pm-to-fill", s.title);
    if (kind === "specs" && !SOURCE_LINE.test(body.split("\n")[0]))
      add("error", "source-missing", s.title, body.split("\n")[0]);
  });
  if (kind === "intent" && !/^\*\*Design proposal:\*\*\s*\S+/m.test(text))
    add("error", "proposal-link", "header");
  if (kind === "specs") {
    if (!/^\*\*Knowledge:\*\*\s*v\d+\.\d+\.\d+/m.test(text)) add("error", "knowledge-version", "header");
    var slugs = opts.registrySlugs || [];
    ((secs["Components Used"] || "").match(/^- .+?\(([a-z0-9-]+)\):/gm) || []).forEach(function (line) {
      var slug = /\(([a-z0-9-]+)\):/.exec(line)[1];
      if (slugs.indexOf(slug) === -1) add("error", "component-unknown", "Components Used", slug);
    });
    var visible = visibleText(opts.prototypeHtml);
    var copySource = (secs["Copy"] || "").split("\n")[0] || "";
    ((secs["Copy"] || "").match(/"([^"]+)"/g) || []).forEach(function (q) {
      var s = q.slice(1, -1);
      if (/Prototype/.test(copySource) && opts.prototypeHtml && !copyFound(s, visible))
        add("error", "copy-not-in-source", "Copy", s);
      if (/Figma/.test(copySource) && !/Prototype/.test(copySource)) add("info", "copy-figma-unverified", "Copy", s);
    });
    var rows = (secs["States"] || "").split("\n").filter(function (l) {
      return /^\|/.test(l) && !/^\|\s*-/.test(l) && !/^\|\s*Screen\s*\|/.test(l);
    });
    rows.forEach(function (r) {
      r.split("|")
        .slice(2, -1)
        .forEach(function (c) {
          if (!/^\s*(yes|no|n\/a)\s*$/.test(c)) add("error", "states-cell", "States", r.trim());
        });
    });
  }
  return f;
}

function main(argv) {
  var kind = argv[2],
    file = argv[3];
  if (["intent", "specs"].indexOf(kind) === -1 || !file) {
    process.stderr.write("usage: check-handover.js intent|specs <file> [--prototype <html>]\n");
    return 2;
  }
  var PATHS = require(path.join(__dirname, "..", "lib", "paths.js"));
  var tpl = path.join(PATHS.vendor, "app-context", "src", "handover", kind + ".md");
  if (!fs.existsSync(tpl)) {
    process.stderr.write("template not vendored yet: " + tpl + "\n");
    return 2;
  }
  var opts = { template: fs.readFileSync(tpl, "utf8") };
  var pi = argv.indexOf("--prototype");
  if (pi !== -1) opts.prototypeHtml = fs.readFileSync(argv[pi + 1], "utf8");
  if (kind === "specs")
    opts.registrySlugs = Object.keys(
      JSON.parse(fs.readFileSync(path.join(PATHS.vendor, "components", "dist", "registries", "dskit.json"), "utf8"))
        .components || {},
    );
  var f = checkHandover(kind, fs.readFileSync(file, "utf8"), opts);
  f.forEach(function (x) {
    process.stdout.write(
      (x.severity === "error" ? "P0" : x.severity === "info" ? "info" : "P1") +
        " [" + x.check + "] " + x.where + (x.value ? ": " + x.value : "") + "\n",
    );
  });
  return f.some(function (x) {
    return x.severity === "error";
  })
    ? 1
    : 0;
}

module.exports = { checkHandover: checkHandover, frontmatter: frontmatter, sections: sections };
if (require.main === module) process.exit(main(process.argv));
