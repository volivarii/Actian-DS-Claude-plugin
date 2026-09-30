#!/usr/bin/env node
"use strict";
// Proposal data -> intent.md. One source (the proposal data) renders both the
// proposal document and this file, so the two never disagree. Business fields
// no tool knows (the template's `pm` sections) are written as the template's
// gapMarker, never invented; a `ux` section the data leaves empty is too.
var fs = require("fs");
var path = require("path");
var frontmatter = require("../validation/check-handover.js").frontmatter;
var partName = require("./assemble-proposal.js").partName;

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
  if (fm.kind !== "intent" || !fm.sections.length)
    throw new Error("assemble-intent: the template reads as kind " + (fm.kind || "none") + " with " + fm.sections.length + " sections");
  var gap = fm.gapMarker || "To fill by PM";
  var m = data.meta || {},
    c = data.context || {},
    s = data.scope || {};
  var body = {
    Summary: text(data.answer),
    "Business Context & Problem": [text(c.question), text(c.ask), list(c.product), text(c.gap)]
      .filter(Boolean)
      .join("\n\n"),
    "Target Users": list(c.users),
    "In Scope": list(s.goals),
    "Out of Scope": list(s.nonGoals),
    "Design decisions": (data.decisions || [])
      .map(function (d) {
        var pick = d.pick || {};
        var o = (d.options || []).filter(function (x) {
          return x.id === pick.optionId;
        })[0];
        // As assemble-proposal does: a pick that names no option is an error.
        if (!o) throw new Error("assemble-intent: decision " + d.id + " picks " + pick.optionId + ", which is none of its options");
        return "- " + d.question + ": " + o.name + ". " + text(pick.reasons);
      })
      .join("\n"),
    // The proposal document lists the decisions' blockers first under
    // "Before we build"; here they lead the open questions, so the two agree.
    "Open questions":
      (data.decisions || [])
        .filter(function (d) {
          return d.blocker;
        })
        .map(function (d) {
          return "- (blocker) " + partName(d) + ": " + text(d.blocker);
        })
        .concat(
          (data.openQuestions || []).map(function (q) {
            // The proposal document calls a rabbit hole a risk.
            return "- (" + (q.kind === "rabbit hole" ? "risk" : q.kind) + ") " + q.text;
          }),
        )
        .join("\n") || "None.",
    "Assumptions & Risks":
      (data.decisions || [])
        .filter(function (d) {
          return d.pick && d.pick.cost;
        })
        .map(function (d) {
          return "- " + partName(d) + ": " + text(d.pick.cost);
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
    if (sec.owner !== "pm" && !(sec.title in body))
      throw new Error("assemble-intent: the template's section " + sec.title + " is not one this script knows");
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
