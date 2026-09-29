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
var STATES = ["Default", "Loading", "Empty", "Error", "Disabled"];

function lf(t) {
  return String(t || "").replace(/\r\n?/g, "\n");
}

function frontmatter(text) {
  var m = /^---\n([\s\S]*?)\n---/.exec(lf(text));
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
  lf(text)
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
  text = lf(text);
  var secs = sections(text);
  // A template read as no sections would pass any file: say so instead.
  if (!fm.sections.length || fm.kind !== kind) {
    add("error", "template-unreadable", "template", "kind " + (fm.kind || "none") + ", " + fm.sections.length + " sections");
    return f;
  }
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
    // Every list line is one component, `- <DS name> (<slug>): <where and how>`.
    ((secs["Components Used"] || "").match(/^- .*$/gm) || []).forEach(function (line) {
      var m = /^- .+? \(([a-z0-9-]+)\):/.exec(line);
      if (!m) return add("error", "component-line", "Components Used", line);
      if (slugs.indexOf(m[1]) === -1) add("error", "component-unknown", "Components Used", m[1]);
    });
    var visible = visibleText(opts.prototypeHtml);
    var copySource = (secs["Copy"] || "").split("\n")[0] || "";
    ((secs["Copy"] || "").match(/"([^"]+)"/g) || []).forEach(function (q) {
      var s = q.slice(1, -1);
      if (/Prototype/.test(copySource) && !opts.prototypeHtml) add("error", "copy-unverified", "Copy", s + " (no prototype to check it against)");
      else if (/Prototype/.test(copySource) && !copyFound(s, visible)) add("error", "copy-not-in-source", "Copy", s);
      if (/Figma/.test(copySource) && !/Prototype/.test(copySource)) add("info", "copy-figma-unverified", "Copy", s);
    });
    // A table: the screen, then the five states; every row five cells of yes, no or n/a.
    var lines = (secs["States"] || "").split("\n").filter(function (l) {
      return /^\|/.test(l);
    });
    var cells = function (l) {
      return l.split("|").slice(1, -1).map(function (c) {
        return c.trim();
      });
    };
    var head = lines.length ? cells(lines[0]) : [];
    var rows = lines.slice(1).filter(function (l) {
      return !/^\|(\s*:?-+:?\s*\|)+\s*$/.test(l);
    });
    if (!rows.length || head.slice(1).join("|") !== STATES.join("|"))
      add("error", "states-table", "States", "a table | Screen | " + STATES.join(" | ") + " | with one row per screen");
    rows.forEach(function (r) {
      var c = cells(r).slice(1);
      if (c.length !== STATES.length || c.some(function (x) { return !/^(yes|no|n\/a)$/.test(x); }))
        add("error", "states-cell", "States", r.trim());
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
  var text = fs.readFileSync(file, "utf8");
  var pi = argv.indexOf("--prototype");
  var proto = pi !== -1 ? argv[pi + 1] : null;
  if (pi !== -1 && !proto) {
    process.stderr.write("--prototype needs a path\n");
    return 2;
  }
  if (!proto) {
    // No flag: the file's own **Prototype:** line, relative to the file.
    var h = /^\*\*Prototype:\*\*\s*(\S+)/m.exec(text);
    var cand = h && path.resolve(path.dirname(file), h[1]);
    if (cand && fs.existsSync(cand)) proto = cand;
  }
  if (proto) opts.prototypeHtml = fs.readFileSync(proto, "utf8");
  if (kind === "specs")
    opts.registrySlugs = Object.keys(
      JSON.parse(fs.readFileSync(path.join(PATHS.vendor, "components", "dist", "registries", "dskit.json"), "utf8"))
        .components || {},
    );
  var f = checkHandover(kind, text, opts);
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
