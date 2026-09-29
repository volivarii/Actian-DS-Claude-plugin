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

// YAML allows a scalar quoted or not; the value is the same.
function unquote(v) {
  v = v.trim();
  return /^(["']).*\1$/.test(v) ? v.slice(1, -1) : v;
}

function frontmatter(text) {
  var m = /^---\n([\s\S]*?)\n---/.exec(lf(text));
  var fm = { sections: [] };
  if (!m) return fm;
  m[1].split("\n").forEach(function (line) {
    var s = /^\s*-\s*\{\s*title:\s*(.+?),\s*owner:\s*(\w+),\s*required:\s*(true|false)\s*\}/.exec(line);
    if (s) fm.sections.push({ title: unquote(s[1]), owner: s[2], required: s[3] === "true" });
    var g = /^gapMarker:\s*(.*?)\s*$/.exec(line);
    if (g) fm.gapMarker = unquote(g[1]);
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

var ENTITIES = {
  nbsp: " ", lt: "<", gt: ">", quot: '"', apos: "'",
  lsquo: "\u2018", rsquo: "\u2019", ldquo: "\u201c", rdquo: "\u201d",
  hellip: "\u2026", mdash: "\u2014", ndash: "\u2013",
};
// One pass, so an &amp; never becomes the start of a second entity.
function decode(t) {
  return t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, function (all, e) {
    if (e[0] === "#") return String.fromCodePoint(parseInt(e[1] === "x" || e[1] === "X" ? e.slice(2) : e.slice(1), e[1] === "x" || e[1] === "X" ? 16 : 10));
    if (e === "amp") return "&";
    return ENTITIES[e] != null ? ENTITIES[e] : all;
  });
}

// The prototype's words: the text a reader sees, the words in attributes a
// reader meets (placeholder, aria-label, title, alt, value), and script bodies
// kept whole (app.js writes most of a prototype's words at run time, and a
// `n < 2` there is code, not a tag to strip).
function visibleText(html) {
  var scripts = [];
  var rest = String(html || "")
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, function (m, js) {
      scripts.push(js);
      return " ";
    })
    // A stylesheet's words are CSS, never copy.
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  var attrs = [];
  rest.replace(/\s(?:placeholder|aria-label|title|alt|value)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, function (m, a, b) {
    attrs.push(a != null ? a : b);
    return m;
  });
  return decode([rest.replace(/<[^>]+>/g, " ")].concat(attrs, scripts).join(" ")).replace(/\s+/g, " ");
}

function escapeRe(t) {
  return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// A copy string is in the prototype as written, or, when it carries numbers,
// with each number replaced by a number or by the code that builds one
// (`"Delete " + n + " descriptions"`, `${n}`), its fixed words in order.
function copyFound(s, visible) {
  if (visible.indexOf(s) !== -1) return true;
  if (!/\d/.test(s)) return false;
  var expr = "[\\w.$()\\[\\]]+";
  var gap = "\\s*(?:\\d+|[\"'`]?\\s*\\+\\s*" + expr + "\\s*\\+\\s*[\"'`]?|\\$\\{[^}]*\\})\\s*";
  // A number that opens or closes the copy is joined on one side only:
  // `n + " saved"`, `"Delete " + n`.
  var head = "(?:\\d+|\\$\\{[^}]*\\}|" + expr + "\\s*\\+\\s*[\"'`])\\s*";
  var tail = "\\s*(?:\\d+|\\$\\{[^}]*\\}|[\"'`]\\s*\\+\\s*" + expr + ")";
  var parts = s.split(/\d+/).map(function (x) {
    return x.trim();
  });
  var words = parts.filter(Boolean).join("");
  if (words.length < 3) return false;
  var inner = "";
  parts.forEach(function (x, i) {
    if (i === 0) inner = x ? escapeRe(x) : head;
    else if (i === parts.length - 1 && !x) inner += tail;
    else inner += (inner === head ? "" : gap) + escapeRe(x);
  });
  return new RegExp(inner).test(visible);
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
    // The marker is the PM's to replace; in a section the skill fills, it is a gap.
    if (kind === "intent" && fm.gapMarker && content.indexOf(fm.gapMarker) === 0)
      add(s.owner === "pm" ? "info" : "warning", s.owner === "pm" ? "pm-to-fill" : "ux-to-fill", s.title);
    if (kind === "specs" && !SOURCE_LINE.test(body.split("\n")[0]))
      add("error", "source-missing", s.title, body.split("\n")[0]);
  });
  if (kind === "intent" && !/^\*\*Design proposal:\*\*\s*\S+/m.test(text))
    add("error", "proposal-link", "header");
  if (kind === "specs") {
    if (!/^\*\*Knowledge:\*\*\s*v\d+\.\d+\.\d+/m.test(text)) add("error", "knowledge-version", "header");
    var slugs = opts.registrySlugs || [];
    // Every line is one component, `- <DS name> (<slug>): <where and how>`,
    // whatever bullet it was written with.
    (secs["Components Used"] || "")
      .split("\n")
      .filter(function (l) {
        return l.trim() && !/^Source:/.test(l);
      })
      .forEach(function (line) {
        var m = /^- .+? \(([a-z0-9-]+)\):/.exec(line);
        if (!m) return add("error", "component-line", "Components Used", line);
        if (slugs.indexOf(m[1]) === -1) add("error", "component-unknown", "Components Used", m[1]);
      });
    var visible = visibleText(opts.prototypeHtml);
    var copySource = (secs["Copy"] || "").split("\n")[0] || "";
    // Every line is `- <element>: "<exact text>"` (straight or curly quotes).
    (secs["Copy"] || "")
      .split("\n")
      .filter(function (l) {
        return l.trim() && !/^Source:/.test(l);
      })
      .forEach(function (line) {
        var q = /:\s*(?:"([^"]+)"|\u201c([^\u201d]+)\u201d)\s*$/.exec(line);
        if (!q) return add("error", "copy-line", "Copy", line);
        var t = q[1] != null ? q[1] : q[2];
        if (/Prototype/.test(copySource) && !opts.prototypeHtml) add("error", "copy-unverified", "Copy", t + " (no prototype to check it against)");
        else if (/Prototype/.test(copySource) && !copyFound(t, visible)) add("error", "copy-not-in-source", "Copy", t);
        if (/Figma/.test(copySource) && !/Prototype/.test(copySource)) add("info", "copy-figma-unverified", "Copy", t);
        else if (!/Prototype/.test(copySource)) add("info", "copy-intent-unverified", "Copy", t);
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

// The file's own **Prototype:** line, a path or a markdown link, relative to the file.
function prototypePath(text, file) {
  var h = /^\*\*Prototype:\*\*\s*(?:\[[^\]]*\]\(([^)\s]+)\)|(\S+))/m.exec(text);
  return h ? path.resolve(path.dirname(file), h[1] || h[2]) : null;
}

function main(argv) {
  var kind = argv[2];
  var pi = argv.indexOf("--prototype");
  var proto = pi !== -1 ? argv[pi + 1] : null;
  var file = argv.slice(3).filter(function (a, i) {
    return a !== "--prototype" && argv[i + 2] !== "--prototype";
  })[0];
  if (["intent", "specs"].indexOf(kind) === -1 || !file || (pi !== -1 && !proto)) {
    process.stderr.write("usage: check-handover.js intent|specs <file> [--prototype <html>]\n");
    return 2;
  }
  if (proto && !fs.existsSync(proto)) {
    process.stderr.write("prototype not found: " + proto + "\n");
    return 2;
  }
  var PATHS = require(path.join(__dirname, "..", "lib", "paths.js"));
  // Not in the paths manifest until the knowledge ships the templates (its C7).
  var tpl = path.join(PATHS.vendor, "app-context", "src", "handover", kind + ".md");
  if (!fs.existsSync(tpl)) {
    process.stderr.write("template not vendored yet: " + tpl + "\n");
    return 2;
  }
  var opts = { template: fs.readFileSync(tpl, "utf8") };
  var text = fs.readFileSync(file, "utf8");
  if (!proto) {
    var cand = prototypePath(text, file);
    if (cand && fs.existsSync(cand)) proto = cand;
  }
  if (proto) opts.prototypeHtml = fs.readFileSync(proto, "utf8");
  if (kind === "specs")
    opts.registrySlugs = Object.keys(
      JSON.parse(fs.readFileSync(PATHS.components.registries.dskit, "utf8"))
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

module.exports = { checkHandover: checkHandover, frontmatter: frontmatter, sections: sections, prototypePath: prototypePath };
if (require.main === module) process.exit(main(process.argv));
