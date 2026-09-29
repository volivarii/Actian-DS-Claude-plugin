#!/usr/bin/env node
"use strict";
// Proposal data -> intent.md. One source (the proposal data) renders both the
// proposal document and this file, so the two never disagree. Business fields
// no tool knows (the template's `pm` sections) are written as the template's
// gapMarker, never invented; a `ux` section the data leaves empty is too.
var fs = require("fs");
var path = require("path");
var frontmatter = require("../validation/check-handover.js").frontmatter;

function text(v) {
  if (Array.isArray(v)) return v.map(text).filter(Boolean).join(" ");
  if (v && typeof v === "object") return v.text || v.name || v.label || "";
  return v || "";
}
function list(v) {
  return (Array.isArray(v) ? v : v ? [v] : [])
    .map(function (x) {
      return "- " + text(x);
    })
    .join("\n");
}

function assembleIntent(data, opts) {
  var fm = frontmatter(opts.template);
  var gap = fm.gapMarker || "To fill by PM";
  var m = data.meta || {},
    c = data.context || {},
    s = data.scope || {};
  var body = {
    Summary: text(data.answer),
    "Business Context & Problem": [text(c.question), text(c.ask), list(c.product), text(c.gap)]
      .filter(Boolean)
      .join("\n\n"),
    "In Scope": list(s.goals),
    "Out of Scope": list(s.nonGoals),
    "Design decisions": (data.decisions || [])
      .map(function (d) {
        var pick = d.pick || {};
        var o =
          (d.options || []).filter(function (x) {
            return x.id === pick.optionId;
          })[0] || {};
        return "- " + d.question + ": " + (o.name || pick.optionId) + ". " + text(pick.reasons);
      })
      .join("\n"),
    "Open questions": (data.openQuestions || []).length
      ? data.openQuestions
          .map(function (q) {
            return "- (" + q.kind + ") " + q.text;
          })
          .join("\n")
      : "None.",
    "Assumptions & Risks":
      (data.decisions || [])
        .filter(function (d) {
          return d.blocker;
        })
        .map(function (d) {
          return "- " + d.question + " " + text(d.blocker);
        })
        .join("\n") || "None identified by the proposal.",
    "Insights & Resources": list(c.sources),
  };
  var out = [
    "# Intent: " + (m.title || ""),
    "",
    "**Owner (PM):** " + gap,
    "**Jira ticket:** " + (m.ticket || gap),
    "**Design proposal:** " + opts.proposalLink,
    "",
  ];
  fm.sections.forEach(function (sec) {
    var v = sec.owner === "pm" ? gap : body[sec.title];
    out.push("## " + sec.title, v && String(v).trim() ? String(v).trim() : gap, "");
  });
  return out.join("\n");
}

function main(argv) {
  var file = argv[2];
  var pi = argv.indexOf("--proposal"),
    oi = argv.indexOf("-o");
  if (!file || pi === -1 || !argv[pi + 1] || oi === -1 || !argv[oi + 1]) {
    process.stderr.write("usage: assemble-intent.js <proposal-data.json> --proposal <link> -o intent.md\n");
    return 2;
  }
  var PATHS = require(path.join(__dirname, "..", "lib", "paths.js"));
  var tpl = path.join(PATHS.vendor, "app-context", "src", "handover", "intent.md");
  if (!fs.existsSync(tpl)) {
    process.stderr.write("template not vendored yet: " + tpl + "\n");
    return 2;
  }
  var md = assembleIntent(JSON.parse(fs.readFileSync(file, "utf8")), {
    template: fs.readFileSync(tpl, "utf8"),
    proposalLink: argv[pi + 1],
  });
  fs.writeFileSync(argv[oi + 1], md);
  return 0;
}

module.exports = { assembleIntent: assembleIntent };
if (require.main === module) process.exit(main(process.argv));
