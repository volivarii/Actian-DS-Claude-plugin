#!/usr/bin/env node
"use strict";

/**
 * proposal-to-flow.js: composes a proposals/proposal-data.json into the seed
 * /generate-flow already takes, a screen list and a brief.
 *
 * Every option in a proposal carries a screens[] list naming a flow archetype (its
 * `template`, from recipes/flow/_index.json: overlay, form-create, detail-view), an app
 * and an entity, and until this script nothing read it: a person read the document and
 * retyped it, so the most expensive judgement in the pipeline was made twice. That
 * archetype is not generate-flow's own screen-list `template`, which names chrome
 * (studio, explorer, administration, ...): toScreen() below carries the app forward as
 * `template` and keeps the archetype under its own `archetype` key.
 *
 * The composition is the part with rules, which is why this is a function and not prose in
 * a skill. On the acceptance document three picks resolve to two screens across two apps,
 * one of them carrying a change from each of two decisions. A bridge that concatenated
 * screens[] would emit the account menu twice, as two screens differing only in a note,
 * and a reader would hunt for a difference that is not there.
 *
 * Order follows the breadboard when the document draws one, and declaration order when it
 * does not. The link is anchor.place, declared, because guessing it from anchor.surface
 * reading like place.name holds on the acceptance document by coincidence, not contract.
 *
 * placeOrder is exported alongside compose because the cycle rule (every place kept, none
 * repeated, a cycle falling back to declaration order) is an invariant over the whole place
 * list, and testing it through compose cannot see it.
 *
 * No side effects at load.
 * Usage: proposal-to-flow.js <proposal-data.json> [--decision <id>] [--option <id>] [-o <out.json>]
 */

var fs = require("fs");
var path = require("path");

function finding(severity, check, p, value, suggestion) {
  var f = { severity: severity, check: check, path: p, value: value };
  if (suggestion !== undefined) f.suggestion = suggestion;
  return f;
}

function ids(list) {
  return (list || []).map(function (x) { return x && x.id; }).filter(Boolean).join(", ");
}

// undefined and null both say "no entity" and the schema allows either, so two screens
// differing only in which one they wrote are not in disagreement.
function entityOf(screen) {
  return screen.entity === undefined || screen.entity === null ? null : screen.entity;
}

// Which {decision, option} pairs this run draws. No --decision is every decision's picked
// option, which is the question a reader actually has: what does the product look like if
// we do what this proposal says.
function select(data, opts, findings) {
  var decisions = (data && data.decisions) || [];
  if (!decisions.length) {
    findings.push(finding("P0", "selection", "decisions",
      "the file carries no decisions, so there is nothing to build a flow from",
      "a proposal that was never finished, or a file that is not a proposal at all"));
    return [];
  }
  if (opts.option && !opts.decision) {
    findings.push(finding("P0", "selection", "--option",
      "names an option without naming its decision",
      "an option id is unique only inside its decision; pass --decision <id> as well"));
    return [];
  }
  var chosen = decisions;
  if (opts.decision) {
    chosen = decisions.filter(function (d) { return d.id === opts.decision; });
    if (!chosen.length) {
      findings.push(finding("P0", "selection", "--decision",
        opts.decision + " names no decision in this proposal",
        "one of " + ids(decisions)));
      return [];
    }
  }
  var selected = [];
  chosen.forEach(function (d) {
    var pickId = d.pick && d.pick.optionId;
    var wanted = opts.option || pickId;
    var option = (d.options || []).filter(function (o) { return o.id === wanted; })[0];
    if (!option) {
      findings.push(finding("P0", "selection",
        opts.option ? "--option" : "decisions[" + d.id + "].pick.optionId",
        String(wanted) + " names no option in decision " + d.id,
        "one of " + ids(d.options)));
      return;
    }
    if (!Array.isArray(option.screens) || !option.screens.length) {
      findings.push(finding("P1", "screens",
        "decisions[" + d.id + "].options[" + option.id + "].screens",
        "the option this decision contributes draws no screens, so it seeds nothing",
        "give the option one to four screens, or leave the decision out with --decision"));
    }
    selected.push({ decision: d, option: option, isPick: option.id === pickId });
  });
  return selected;
}

// Merge by screen.name. Two picks naming one screen are one screen carrying both notes.
// template, app and entity are the values every source agrees on, which is not a tiebreak:
// disagreement is the P0 below, so by the time a screen merges there is one value left.
function merge(selected, findings) {
  var byName = Object.create(null);
  var merged = [];
  selected.forEach(function (sel) {
    (sel.option.screens || []).forEach(function (screen) {
      var m = byName[screen.name];
      if (!m) {
        m = byName[screen.name] = {
          name: screen.name,
          template: screen.template,
          app: screen.app,
          entity: entityOf(screen),
          notes: [],
          places: [],
          firstDecisionId: sel.decision.id,
        };
        merged.push(m);
      } else {
        [["template", screen.template], ["app", screen.app], ["entity", entityOf(screen)]]
          .forEach(function (pair) {
            if (m[pair[0]] === pair[1]) return;
            findings.push(finding("P0", "merge",
              'screens["' + screen.name + '"].' + pair[0],
              "decision " + m.firstDecisionId + " says " + JSON.stringify(m[pair[0]]) +
                " and decision " + sel.decision.id + " says " + JSON.stringify(pair[1]),
              "one screen has one " + pair[0] + "; give the two changes two screen names, or agree on one"));
          });
      }
      if (screen.note) {
        m.notes.push({ question: sel.decision.question, note: screen.note, decisionId: sel.decision.id });
      }
      var place = sel.option.anchor && sel.option.anchor.place;
      if (place && m.places.indexOf(place) === -1) m.places.push(place);
    });
  });
  return merged;
}

// A merged screen's notes are attributed, because a screen carrying two changes from two
// decisions is exactly where a reader needs to know which change answers which question.
// The count that matters is distinct decisions, not notes: one option can list the same
// screen name twice (the schema allows it), and two notes from the same decision are not
// two questions, so prefixing them would print the same question twice.
//
// The proposal's screens[].template names a flow archetype (recipes/flow/_index.json:
// overlay, form-create, detail-view). generate-flow's own screen-list template names chrome
// instead (studio, explorer, administration, ...; SKILL.md's Flags table + ds-screen-tree.js
// TEMPLATE_CHROME). Those are two different vocabularies over the same key, so the emitted
// screen carries the app as template, which resolveChrome() already knows how to render, and
// keeps the proposal's archetype under its own key rather than dropping it.
function toScreen(m) {
  var seenDecisions = Object.create(null);
  var distinctDecisions = 0;
  m.notes.forEach(function (n) {
    if (seenDecisions[n.decisionId]) return;
    seenDecisions[n.decisionId] = true;
    distinctDecisions += 1;
  });
  var note = distinctDecisions > 1
    ? m.notes.map(function (n) { return n.question + " " + n.note; }).join(" ")
    : m.notes.map(function (n) { return n.note; }).join(" ");
  var screen = { name: m.name, template: m.app, archetype: m.template, app: m.app, entity: m.entity };
  if (note) screen.note = note;
  return screen;
}

// Composed from what the proposal already argued. The labels are structure; every sentence
// in it is the author's. A thin proposal makes a thin brief, and that is honest.
function composeBrief(data, selected) {
  var lines = [];
  // The answer argues for the pick, the same way the pick's reasons do below: printing it
  // above a run that draws no pick at all would read as a case for something this run is
  // not building. Left out unless at least one selected option is actually the pick.
  var anyPick = selected.some(function (sel) { return sel.isPick; });
  if (anyPick && data && data.answer) lines.push(String(data.answer).trim());
  selected.forEach(function (sel) {
    if (lines.length) lines.push("");
    lines.push(sel.decision.question);
    if (sel.isPick) {
      ((sel.decision.pick && sel.decision.pick.reasons) || []).forEach(function (r) {
        if (r && r.text) lines.push("- " + r.text);
      });
      if (sel.decision.pick && sel.decision.pick.cost) lines.push("Cost: " + sel.decision.pick.cost);
    } else {
      // The pick's reasons argue for the option this run is not drawing, so they stay out;
      // printing them under a rejected option would read as a case for it.
      lines.push("- Drawn instead of the pick: " + sel.option.name + ".");
      if (sel.option.whatItIs) lines.push("- " + sel.option.whatItIs);
      if (sel.option.breaksWhen) lines.push("- Breaks when: " + sel.option.breaksWhen);
    }
  });
  return lines.join("\n");
}

// The order the terrain implies: Kahn over the connections, declaration order breaking
// every tie so the same document always composes the same way. A connection endpoint is
// "<placeId>" or "<placeId>/<1-based affordance>", the spelling validate-proposal.js
// already resolves. Places a cycle leaves unemitted keep declaration order and follow: a
// breadboard with a loop in it is still a terrain, and refusing to order it helps nobody.
function placeOrder(board) {
  var places = (board && board.places) || [];
  var index = Object.create(null);
  places.forEach(function (pl, i) { index[pl.id] = i; });
  var indegree = places.map(function () { return 0; });
  var edges = places.map(function () { return []; });
  ((board && board.connections) || []).forEach(function (c) {
    var from = index[String(c.from == null ? "" : c.from).split("/")[0]];
    var to = index[String(c.to == null ? "" : c.to).split("/")[0]];
    if (from === undefined || to === undefined || from === to) return;
    edges[from].push(to);
    indegree[to] += 1;
  });
  var ready = [];
  var seen = places.map(function () { return false; });
  var out = [];
  places.forEach(function (pl, i) { if (indegree[i] === 0) ready.push(i); });
  while (ready.length) {
    ready.sort(function (a, b) { return a - b; });
    var i = ready.shift();
    if (seen[i]) continue;
    seen[i] = true;
    out.push(places[i].id);
    edges[i].forEach(function (j) {
      indegree[j] -= 1;
      if (indegree[j] === 0) ready.push(j);
    });
  }
  places.forEach(function (pl, i) { if (!seen[i]) out.push(pl.id); });
  return out;
}

// The anchor resolves to a place explicitly. A place naming nothing is a P0, the same
// defect a connection naming nothing is. An anchor with no place while a board is drawn is
// a P1, because the ordering then degrades silently to declaration order and the author
// should know that it did.
function checkAnchors(data, selected, findings) {
  var board = data && data.breadboard;
  var places = (board && board.places) || [];
  // No breadboard at all is not a defect this check owns: there is no terrain to be wrong
  // about yet, so an anchor.place here is neither confirmed nor contradicted.
  if (!places.length) return;
  var known = Object.create(null);
  places.forEach(function (pl) { known[pl.id] = true; });
  selected.forEach(function (sel) {
    var p = "decisions[" + sel.decision.id + "].options[" + sel.option.id + "].anchor.place";
    var place = sel.option.anchor && sel.option.anchor.place;
    if (place) {
      if (!known[place]) {
        findings.push(finding("P0", "anchor", p, place + " names no place in the breadboard",
          "one of " + ids(places)));
      }
    } else {
      findings.push(finding("P1", "anchor", p,
        "the document draws a terrain and this anchor names no place on it",
        "set anchor.place to a breadboard place id; without it this option does not help order " +
          "the screen, which then follows a place another source names, or declaration order if none does"));
    }
  });
}

function compose(data, options) {
  var opts = options || {};
  var findings = [];
  var stage = (data && data.meta && data.meta.stage) || "proposal";
  if (stage === "evaluation") {
    findings.push(finding("P0", "stage", "meta.stage",
      "an evaluation has no options, so there are no screens to build from",
      "resume it first: /design-proposal --from <this file>"));
    return { screens: [], brief: "", findings: findings };
  }
  var selected = select(data, opts, findings);
  if (!selected.length) return { screens: [], brief: "", findings: findings };
  checkAnchors(data, selected, findings);
  var merged = merge(selected, findings);
  // Every picked option can carry an empty screens[] (the P1 above), and when every one of
  // them does, merged is empty: not thin, nothing. That is the same silent pass already
  // closed for the no-decisions case, at the other entrance, so it gets the same severity.
  if (!merged.length) {
    findings.push(finding("P0", "screens", "screens",
      "the proposal's picks draw no screens between them, so there is no flow to seed",
      "give at least one picked option a screens[] entry, or pick decisions that do"));
  }
  // A P0 anywhere above (selection, merge conflict, a dangling anchor.place, or the empty
  // list just above) means the seed is wrong, not thin: guessing a partial flow out of it
  // builds something nobody asked for, so the whole seed comes back empty and the caller
  // reads why from findings instead of from a flow that was never asked for.
  if (findings.some(function (f) { return f.severity === "P0"; })) {
    return { screens: [], brief: "", findings: findings };
  }
  var rank = Object.create(null);
  placeOrder(data && data.breadboard).forEach(function (id, i) { rank[id] = i; });
  // A merged screen ranks by the earliest place any of its sources anchors to. Screens that
  // resolve to no place rank Infinity and keep declaration order among themselves.
  var ordered = merged.map(function (m, i) {
    var r = Infinity;
    m.places.forEach(function (id) { if (rank[id] !== undefined && rank[id] < r) r = rank[id]; });
    return { m: m, rank: r, i: i };
  }).sort(function (a, b) { return a.rank === b.rank ? a.i - b.i : a.rank - b.rank; });
  return {
    screens: ordered.map(function (o) { return toScreen(o.m); }),
    brief: composeBrief(data, selected),
    findings: findings,
  };
}

module.exports = { compose: compose, placeOrder: placeOrder };

if (require.main === module) {
  var args = process.argv.slice(2);
  var USAGE = "Usage: proposal-to-flow.js <proposal-data.json> [--decision <id>] [--option <id>] [-o <out.json>]\n" +
    "A flag given more than once keeps its first occurrence.\n";
  if (!args.length || args.indexOf("--help") !== -1) {
    process.stdout.write(USAGE);
    process.exit(args.length ? 0 : 1);
  }
  function valueOf(flag) {
    var i = args.indexOf(flag);
    if (i === -1) return undefined;
    var next = args[i + 1];
    if (next === undefined || next.indexOf("-") === 0) {
      process.stderr.write(flag + " needs a value after it\n");
      process.exit(1);
    }
    return next;
  }
  var inPath = path.resolve(args[0]);
  var outVal = valueOf("-o");
  var outPath = outVal ? path.resolve(outVal) : null;
  if (outPath && fs.existsSync(outPath)) {
    process.stderr.write(outPath + " already exists; remove it or drop -o to print the seed\n");
    process.exit(1);
  }
  var decisionVal = valueOf("--decision");
  var optionVal = valueOf("--option");
  var data;
  try {
    data = JSON.parse(fs.readFileSync(inPath, "utf8"));
  } catch (e) {
    process.stderr.write("Error reading " + inPath + ": " + e.message + "\n");
    process.exit(1);
  }
  var seed = compose(data, { decision: decisionVal, option: optionVal });
  var hasP0 = seed.findings.some(function (f) { return f.severity === "P0"; });
  var json = JSON.stringify(seed, null, 2) + "\n";
  // A P0 refuses outright: no file, no success line. The findings on stderr and a non-zero
  // exit are the whole output, so a caller cannot mistake a guess for an answer.
  if (outPath) {
    if (!hasP0) {
      try {
        fs.writeFileSync(outPath, json);
      } catch (e) {
        process.stderr.write("Error writing " + outPath + ": " + e.message + "\n");
        process.exit(1);
      }
      process.stdout.write("Wrote " + seed.screens.length + " screen(s) and a brief to " + outPath + ".\n");
    }
  } else {
    process.stdout.write(json);
  }
  // Findings go to stderr so they stay visible when stdout is piped into a file or a
  // reader, which is the normal way this is called.
  seed.findings.forEach(function (f) {
    process.stderr.write(f.severity + " [" + f.check + "] " + f.path + ": " + f.value +
      (f.suggestion ? ", " + f.suggestion : "") + "\n");
  });
  process.exit(hasP0 ? 1 : 0);
}
