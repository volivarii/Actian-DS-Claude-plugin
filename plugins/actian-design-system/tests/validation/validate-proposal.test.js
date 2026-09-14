"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var os = require("os");
var path = require("path");
var { spawnSync } = require("node:child_process");
var { validateProposal, extractText } = require("../../scripts/validation/validate-proposal.js");

var ROOT = path.resolve(__dirname, "..", "..");
var SCRIPT = path.join(ROOT, "scripts", "validation", "validate-proposal.js");
var FIXTURE = path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496-one-decision.json");
var EM_DASH = "\u2014";
function load() { return JSON.parse(fs.readFileSync(FIXTURE, "utf8")); }
function only(data, check) {
  return validateProposal(data).findings.filter(function (f) { return f.check === check; });
}
function withMutation(mutate) { var d = load(); mutate(d); return d; }
function find(findings, check) {
  return findings.filter(function (f) { return f.check === check; })[0];
}
// One P1 advisory stands on the clean fixture, and it is the advisory doing its job on
// real data rather than on a mutation: the ticket spans two apps and the fixture draws
// no terrain, so the gate asking for one is right. It is dropped by check AND path,
// never by check alone, so no other breadboard finding can hide behind it, and the
// count is asserted too, because anything else appearing here means the fixture drifted.
var STANDING = [
  { check: "breadboard", path: "breadboard" },
];
function withoutStandingAdvice(findings) {
  return findings.filter(function (f) {
    return !STANDING.some(function (k) { return k.check === f.check && k.path === f.path; });
  });
}

describe("extractText", function () {
  it("keeps visible text and alt, title, placeholder, aria-label; drops tags, script and style; decodes entities", function () {
    var t = extractText('<div title="Tip">Hello &amp; <b>world</b><img alt="Logo"><input placeholder="Search"><span aria-label="Close">x</span><style>.a{}</style><script>bad()</script></div>');
    assert.ok(/Hello & world/.test(t), t);
    ["Tip", "Logo", "Search", "Close"].forEach(function (w) { assert.ok(t.indexOf(w) !== -1, w + " in " + t); });
    assert.ok(t.indexOf("bad()") === -1 && t.indexOf(".a{}") === -1, "script/style dropped: " + t);
  });
});

describe("validateProposal (document)", function () {
  it("carries nothing on the clean fixture beyond the one advisory it earns", function () {
    var f = validateProposal(load()).findings;
    assert.deepEqual(withoutStandingAdvice(f), [], JSON.stringify(f, null, 1));
    assert.strictEqual(f.length, STANDING.length, JSON.stringify(f, null, 1));
    assert.deepEqual(f.map(function (x) { return x.severity; }), ["P1"], JSON.stringify(f, null, 1));
  });
  it("schema errors are P0 (check schema) and stop the other checks", function () {
    var f = validateProposal(withMutation(function (d) { delete d.decisions[0].comparison; })).findings;
    assert.ok(f.length >= 1 && f.every(function (x) { return x.check === "schema" && x.severity === "P0"; }), JSON.stringify(f));
  });
  it("missing scope is a P0", function () {
    var d = load();
    delete d.scope;
    assert.ok(validateProposal(d).findings.some(function (f) {
      return f.severity === "P0" && /scope/.test(f.path + " " + f.value);
    }), "missing scope is a P0");
  });
  it("more than four goals is a P0 naming scope.goals", function () {
    var d = load();
    d.scope = { goals: ["a", "b", "c", "d", "e"], nonGoals: ["x"] };
    assert.ok(validateProposal(d).findings.some(function (f) {
      return f.severity === "P0" && /scope.goals/.test(f.path + " " + f.value);
    }), "five goals is a P0");
  });
  it("more than four non-goals is a P0 naming scope.nonGoals", function () {
    var d = load();
    d.scope = { goals: ["a"], nonGoals: ["x", "y", "z", "w", "v"] };
    assert.ok(validateProposal(d).findings.some(function (f) {
      return f.severity === "P0" && /scope.nonGoals/.test(f.path + " " + f.value);
    }), "five non-goals is a P0");
  });
  it("an unknown anchor app or meta.apps entry is P0; an unknown screens[].app entry is P1 (check app-unknown)", function () {
    var f = only(withMutation(function (d) { d.decisions[0].options[0].anchor.app = "nope"; }), "app-unknown");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P0"); assert.strictEqual(f[0].screen, "a");
    f = only(withMutation(function (d) { d.meta.apps.push("nope"); }), "app-unknown");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P0"); assert.strictEqual(f[0].path, "meta.apps[2]");
    f = only(withMutation(function (d) { d.decisions[0].options[1].screens[0].app = "nope"; }), "app-unknown");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P1"); assert.strictEqual(f[0].screen, "b");
  });
  // A fifth option is caught by the schema, not by MAX_OPTIONS here: the schema pass runs
  // first and returns, so it is the schema message an author reads. Asserted on the message
  // they actually get, because a test pinned to the unreachable line would pass while the
  // reachable one drifted.
  it("a fifth option is a schema P0, the message an author actually gets", function () {
    var f = only(withMutation(function (d) { d.decisions[0].options.push(Object.assign({}, d.decisions[0].options[0], { id: "d" }), Object.assign({}, d.decisions[0].options[0], { id: "e" })); }), "schema");
    assert.strictEqual(f.length, 1, "one schema finding, got: " + JSON.stringify(f));
    assert.strictEqual(f[0].severity, "P0");
    assert.ok(/decisions\/\[0\]\/options: array has 5 items, maximum is 4/.test(f[0].value), f[0].value);
  });
  it("bounds are P0: more than 5 findings, more than 4 reasons, more than 4 flow screens, width outside 240 to 720, duplicate option or criterion ids, an unknown tone, cells for an unknown option, a cell for an unknown criterion", function () {
    function bounds(mutate) { return only(withMutation(mutate), "bounds"); }
    assert.ok(bounds(function (d) { for (var i = 0; i < 6; i++) d.research.findings.push({ claim: "c" + i, source: "s" }); }).some(function (f) { return /findings; at most 5/.test(f.value); }));
    assert.ok(bounds(function (d) { d.decisions[0].pick.reasons.push({ criterionId: "literal-ask", text: "w" }); }).some(function (f) { return /reasons; at most 4/.test(f.value); }));
    assert.ok(bounds(function (d) { for (var i = 0; i < 4; i++) d.decisions[0].options[0].screens.push(d.decisions[0].options[0].screens[0]); }).some(function (f) { return /screens; at most 4/.test(f.value); }));
    assert.ok(bounds(function (d) { d.decisions[0].options[0].screen.width = 900; }).some(function (f) { return /outside 240 to 720/.test(f.value); }));
    assert.ok(bounds(function (d) { d.decisions[0].options[1].id = "a"; }).some(function (f) { return /duplicate option id a/.test(f.value); }));
    assert.ok(bounds(function (d) { d.decisions[0].comparison.criteria[1].id = "literal-ask"; }).some(function (f) { return /duplicate criterion id/.test(f.value); }));
    assert.ok(bounds(function (d) { d.decisions[0].comparison.cells.a["literal-ask"].tone = "great"; }).some(function (f) { return /tone "great"/.test(f.value); }));
    assert.ok(bounds(function (d) { d.decisions[0].comparison.cells.zz = { "literal-ask": { text: "x", tone: "good" } }; }).some(function (f) { return /not in this decision/.test(f.value); }));
    assert.ok(bounds(function (d) { d.decisions[0].comparison.cells.a["ghost-criterion"] = { text: "x", tone: "good" }; }).some(function (f) { return /criterion that is not in this decision/.test(f.value) && f.screen === "a"; }));
  });
  it("a null cells entry for a known option does not crash the comparison pass", function () {
    var d = withMutation(function (d) { d.decisions[0].comparison.cells.a = null; });
    assert.doesNotThrow(function () { validateProposal(d); });
  });
  it("research that did not run must say why (check research, P0); with a reason it is quiet", function () {
    var f = only(withMutation(function (d) { d.research = { ran: false, findings: [] }; }), "research");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P0");
    assert.deepEqual(only(withMutation(function (d) { d.research = { ran: false, findings: [], skippedBecause: "--no-research" }; }), "research"), []);
  });
  it("findings present while research did not run is a P1 (check research); they are not rendered", function () {
    var f = only(withMutation(function (d) { d.research = { ran: false, findings: [{ claim: "x", source: "y" }], skippedBecause: "--no-research" }; }), "research");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P1");
  });
  it("a pick naming no option in its own decision is P0 (check pick)", function () {
    var f = only(withMutation(function (d) { d.decisions[0].pick.optionId = "zz"; }), "pick");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P0");
    assert.ok(/one of a, b, c/.test(f[0].suggestion), f[0].suggestion);
  });
  it("a flow screen with an unknown template or entity is P1 (checks template-unknown, entity-unknown); a known entity and null are quiet", function () {
    var f = only(withMutation(function (d) { d.decisions[0].options[0].screens[0].template = "wizard"; }), "template-unknown");
    assert.strictEqual(f.length, 1); assert.ok(/overlay/.test(f[0].suggestion), f[0].suggestion);
    f = only(withMutation(function (d) { d.decisions[0].options[0].screens[0].entity = "unicorn"; }), "entity-unknown");
    assert.strictEqual(f.length, 1);
    assert.deepEqual(only(withMutation(function (d) { d.decisions[0].options[0].screens[0].entity = "data-product"; }), "entity-unknown"), []);
  });
  it("terminology fires on a drawing's text and on a reason through the flow validator's own gate (check terminology)", function () {
    var f = only(withMutation(function (d) { d.decisions[0].options[0].screen.html += "<div>scope of the change</div>"; }), "terminology");
    assert.ok(f.length >= 1, "drawing: " + JSON.stringify(f));
    assert.strictEqual(f[0].screen, "a"); assert.strictEqual(f[0].path, "decisions[0].options[0].screen.html");
    f = only(withMutation(function (d) { d.decisions[0].pick.reasons[0].text += " The scope grows."; }), "terminology");
    assert.ok(f.length >= 1, "reason: " + JSON.stringify(f));
    assert.strictEqual(f[0].screen, ""); assert.strictEqual(f[0].path, "decisions[0].pick.reasons[0]");
  });
  it("an option id that shadows a document-level pseudo id does not swallow the document-level finding (check terminology)", function () {
    var f = withoutStandingAdvice(only(withMutation(function (d) {
      d.decisions[0].options[0].id = "context";
      d.decisions[0].comparison.cells.context = d.decisions[0].comparison.cells.a;
      delete d.decisions[0].comparison.cells.a;
      d.context.question += " The scope grows.";
    }), "terminology"));
    assert.strictEqual(f.length, 1, JSON.stringify(f));
    assert.strictEqual(f[0].path, "context.question");
    assert.strictEqual(f[0].screen, "");
  });
  it("avoid-words fire on the context and on a comparison cell (check avoid-word)", function () {
    var f = only(withMutation(function (d) { d.context.product[0] += " Please simply click here."; }), "avoid-word");
    assert.ok(f.length >= 1, JSON.stringify(f)); assert.strictEqual(f[0].path, "context.product[0]");
    f = only(withMutation(function (d) { d.decisions[0].comparison.cells.b["literal-ask"].text = "Please click here"; }), "avoid-word");
    assert.ok(f.length >= 1, JSON.stringify(f)); assert.strictEqual(f[0].path, "decisions[0].comparison.criteria[0]");
  });
  it("a hex or rgb colour in a drawing's style or in any prose field is P1 (check hardcoded-color)", function () {
    var f = only(withMutation(function (d) { d.decisions[0].options[0].screen.html += '<div style="color:#fff;background:rgb(1,2,3)">x</div>'; }), "hardcoded-color");
    assert.strictEqual(f.length, 2);
    f = only(withMutation(function (d) { d.answer += " Use #0F5FDC."; }), "hardcoded-color");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].path, "answer");
  });
  it("position:absolute in a drawing is P1 (check in-flow)", function () {
    var f = only(withMutation(function (d) { d.decisions[0].options[0].screen.html += '<div style="position:absolute;top:0">x</div>'; }), "in-flow");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "P1"); assert.ok(/in flow/.test(f[0].suggestion));
  });
  it("script, inline handlers, javascript: URLs, external loads and unbalanced tags are P0 on a drawing", function () {
    assert.strictEqual(only(withMutation(function (d) { d.decisions[0].options[0].screen.html += "<script>x()</script>"; }), "script").length, 1);
    assert.strictEqual(only(withMutation(function (d) { d.decisions[0].options[0].screen.html += '<div onclick="x()">x</div>'; }), "script").length, 1);
    assert.strictEqual(only(withMutation(function (d) { d.decisions[0].options[0].screen.html += '<a href="javascript:x()">x</a>'; }), "script").length, 1);
    assert.strictEqual(only(withMutation(function (d) { d.decisions[0].options[0].screen.html += '<img src="https://x.test/a.png">'; }), "external-load").length, 1);
    assert.strictEqual(only(withMutation(function (d) { d.decisions[0].options[0].screen.html += '<div style="background:url(https://x.test/a.png)">x</div>'; }), "external-load").length, 1);
    var f = only(withMutation(function (d) { d.decisions[0].options[2].screen.html = "<div><span>open"; }), "unbalanced");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].screen, "c");
  });
  it("a data-toggle without its id, and an id reused across options, are P1 (check toggle-target)", function () {
    var f = only(withMutation(function (d) { d.decisions[0].options[0].screen.html += '<div data-toggle="ghost">x</div>'; }), "toggle-target");
    assert.strictEqual(f.length, 1); assert.ok(/no id="ghost"/.test(f[0].value));
    f = only(withMutation(function (d) { d.decisions[0].options[0].screen.html += '<div id="access-panel-c">x</div>'; }), "toggle-target");
    assert.strictEqual(f.length, 1); assert.ok(/also appears in option "a"/.test(f[0].suggestion), f[0].suggestion);
  });
  it("a commented-out tag or id is not a finding", function () {
    assert.deepEqual(withoutStandingAdvice(validateProposal(withMutation(function (d) { d.decisions[0].options[0].screen.html += '<!-- <div id="access-panel-c"> -->'; })).findings), []);
    assert.deepEqual(only(withMutation(function (d) { d.decisions[0].options[0].screen.html += '<!-- <div data-toggle="ghost">x</div> -->'; }), "toggle-target"), []);
  });
  it("an em dash in a drawing, the title, a claim, a cell or a reason is P2 (check em-dash) with the field path", function () {
    [
      function (d) { d.decisions[0].options[0].screen.html += "<div>a " + EM_DASH + " b</div>"; },
      function (d) { d.meta.title += " " + EM_DASH + " x"; },
      function (d) { d.research.findings[0].claim += " " + EM_DASH; },
      function (d) { d.decisions[0].comparison.cells.a["literal-ask"].text += " " + EM_DASH; },
      function (d) { d.decisions[0].pick.reasons[1].text += " " + EM_DASH; },
    ].forEach(function (m, i) {
      var f = only(withMutation(m), "em-dash");
      assert.strictEqual(f.length, 1, "case " + i + ": " + JSON.stringify(f));
      assert.strictEqual(f[0].severity, "P2");
    });
    assert.strictEqual(only(withMutation(function (d) { d.decisions[0].pick.reasons[1].text += " " + EM_DASH; }), "em-dash")[0].path, "decisions[0].pick.reasons[1].text");
  });
  it("bounds open questions at four and rejects an unknown kind", function () {
    var d = load();
    d.openQuestions = [1, 2, 3, 4, 5].map(function (n) { return { kind: "open question", text: "q" + n }; });
    assert.ok(validateProposal(d).findings.some(function (f) {
      return f.severity === "P0" && /openQuestions/.test(f.path + " " + f.value);
    }), "five is a P0");

    d = load();
    d.openQuestions = [{ kind: "maybe", text: "q" }];
    // A schema check (validate-schema.js) always reports path "" and carries the
    // JSON-pointer-style location in .value instead: verified against the real
    // validator output, not assumed.
    assert.ok(validateProposal(d).findings.some(function (f) {
      return f.severity === "P0" && /openQuestions\/\[0\]\/kind/.test(f.value);
    }), "an unknown kind is a P0");
  });

  it("names the converter when handed a file that predates decisions[]", function () {
    var old = JSON.parse(fs.readFileSync(path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496-legacy.json"), "utf8"));
    var f = find(validateProposal(old).findings, "old-shape");
    assert.ok(f, "the old shape is recognised, not reported as twelve schema errors");
    assert.strictEqual(f.severity, "P0");
    assert.ok(f.suggestion.indexOf("proposal-approaches-to-decisions") !== -1, "the message names the converter");
  });

  it("names the retired keys on a half-converted file carrying both shapes", function () {
    var d = load();
    d.approaches = JSON.parse(fs.readFileSync(path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496-legacy.json"), "utf8")).approaches;
    var hits = validateProposal(d).findings.filter(function (x) { return x.check === "retired-key"; });
    assert.strictEqual(hits.length, 1, JSON.stringify(hits));
    assert.strictEqual(hits[0].severity, "P0");
    assert.ok(hits[0].path.indexOf("approaches") !== -1, hits[0].path);
    assert.ok(hits[0].suggestion.indexOf("delete") !== -1, hits[0].suggestion);
  });

  it("fails a pick that names an option outside its own decision", function () {
    var d = load();
    d.decisions[0].pick.optionId = "not-an-option";
    var f = find(validateProposal(d).findings, "pick");
    assert.ok(f && f.severity === "P0", "P0");
    assert.ok(f.path.indexOf("pick.optionId") !== -1, "the path names the field");
  });

  it("fails a reason that names a criterion outside its own decision", function () {
    var d = load();
    d.decisions[0].pick.reasons[0].criterionId = "not-a-criterion";
    var hits = validateProposal(d).findings.filter(function (x) {
      return x.check === "pick" && x.path.indexOf("criterionId") !== -1;
    });
    assert.strictEqual(hits.length, 1, "one finding, naming the one bad reason");
    assert.strictEqual(hits[0].severity, "P0");
  });

  // Criteria are walked decision by decision, so a document-wide map of criterion ids
  // would still reject a FORWARD reference (to a decision not yet walked) and silently
  // accept a BACKWARD one. Testing only forward proves nothing about the scoping: it
  // passes whether the map is per-decision or shared. Both directions are asserted, on
  // one document, so neither can be the only one covered.
  function twoDecisions() {
    var d = load();
    var second = JSON.parse(JSON.stringify(d.decisions[0]));
    second.id = "second";
    renameCriterion(d.decisions[0], "literal-ask", "first-only");
    renameCriterion(second, "literal-ask", "second-only");
    d.decisions.push(second);
    return d;
  }
  function renameCriterion(decision, from, to) {
    decision.comparison.criteria.forEach(function (c) { if (c.id === from) c.id = to; });
    Object.keys(decision.comparison.cells).forEach(function (oid) {
      var row = decision.comparison.cells[oid];
      row[to] = row[from];
      delete row[from];
    });
  }
  function criterionFindings(d, at) {
    return validateProposal(d).findings.filter(function (x) {
      return x.check === "pick" && x.path.indexOf("criterionId") !== -1 && x.path.indexOf(at) === 0;
    });
  }

  it("does not let a criterion from a LATER decision satisfy a reason", function () {
    var d = twoDecisions();
    d.decisions[0].pick.reasons[0].criterionId = "second-only";
    var hits = criterionFindings(d, "decisions[0]");
    assert.strictEqual(hits.length, 1, "reaching forward to a sibling is one P0");
    assert.strictEqual(hits[0].severity, "P0");
    assert.match(hits[0].value, /decision the-decision/, "and the message names the decision it had to stay inside");
  });

  it("does not let a criterion from an EARLIER decision satisfy a reason", function () {
    var d = twoDecisions();
    d.decisions[1].pick.reasons[0].criterionId = "first-only";
    var hits = criterionFindings(d, "decisions[1]");
    assert.strictEqual(hits.length, 1, "reaching back to a sibling already walked is one P0 too");
    assert.strictEqual(hits[0].severity, "P0");
    assert.match(hits[0].value, /decision second/);
  });

  it("still accepts each decision naming its own criterion", function () {
    var d = twoDecisions();
    d.decisions[0].pick.reasons[0].criterionId = "first-only";
    d.decisions[1].pick.reasons[0].criterionId = "second-only";
    assert.strictEqual(criterionFindings(d, "decisions[0]").length, 0);
    assert.strictEqual(criterionFindings(d, "decisions[1]").length, 0);
  });

  it("fails an empty cost", function () {
    var d = load();
    d.decisions[0].pick.cost = "   ";
    var f = find(validateProposal(d).findings, "pick");
    assert.ok(f && f.severity === "P0" && f.path.indexOf("cost") !== -1, "P0 naming cost");
  });

  it("fails a duplicate decision id and a duplicate option id", function () {
    var d = load();
    d.decisions.push(JSON.parse(JSON.stringify(d.decisions[0])));
    assert.ok(find(validateProposal(d).findings, "bounds"), "duplicate decision id");
    var e = load();
    e.decisions[0].options[1].id = e.decisions[0].options[0].id;
    assert.ok(find(validateProposal(e).findings, "bounds"), "duplicate option id");
  });

  it("fails a breadboard connection naming a place that does not exist", function () {
    var d = load();
    d.breadboard = {
      places: [
        { id: "a", name: "A", app: "explorer", affordances: ["one"] },
        { id: "b", name: "B", app: "explorer", affordances: ["one"] },
      ],
      connections: [{ from: "a", to: "nowhere" }],
    };
    var f = find(validateProposal(d).findings, "breadboard");
    assert.ok(f && f.severity === "P0", "P0");
    assert.ok(f.value.indexOf("nowhere") !== -1, "names the bad id");
  });

  it("fails a breadboard connection naming an affordance index that does not exist", function () {
    var d = load();
    d.breadboard = {
      places: [
        { id: "a", name: "A", app: "explorer", affordances: ["one"] },
        { id: "b", name: "B", app: "explorer", affordances: ["one"] },
      ],
      connections: [{ from: "a/4", to: "b" }],
    };
    var f = find(validateProposal(d).findings, "breadboard");
    assert.ok(f && f.severity === "P0", "P0");
    assert.ok(f.value.indexOf("a/4") !== -1, f.value);
  });

  it("asks for a breadboard when the ticket spans more than one app", function () {
    var d = load();
    delete d.breadboard;
    assert.ok(d.meta.apps.length > 1, "the fixture spans two apps");
    var f = find(validateProposal(d).findings, "breadboard");
    assert.ok(f && f.severity === "P1", "P1, not a blocker");
  });

  it("flags a comparison of fewer than three criteria", function () {
    var d = load();
    d.decisions[0].comparison.criteria = d.decisions[0].comparison.criteria.slice(0, 2);
    var keep = {};
    d.decisions[0].comparison.criteria.forEach(function (c) { keep[c.id] = true; });
    Object.keys(d.decisions[0].comparison.cells).forEach(function (oid) {
      Object.keys(d.decisions[0].comparison.cells[oid]).forEach(function (cid) {
        if (!keep[cid]) delete d.decisions[0].comparison.cells[oid][cid];
      });
    });
    d.decisions[0].pick.reasons.forEach(function (r) { r.criterionId = d.decisions[0].comparison.criteria[0].id; });
    var f = validateProposal(d).findings.filter(function (x) {
      return x.check === "decision" && x.path.indexOf("criteria") !== -1;
    })[0];
    assert.ok(f && f.severity === "P1", "P1 on a two-row table");
  });

  // The brief asked for a P1 here. The schema's own options.minItems of 2 refuses
  // the document first, so what an author actually reads is that P0: the document
  // is still stopped, and by the stricter of the two. The validator keeps its P1
  // as a safety net for the day the schema relaxes.
  it("refuses a decision with one option, the schema's own minimum reaching it first", function () {
    var d = load();
    d.decisions[0].options = [d.decisions[0].options[0]];
    d.decisions[0].pick.optionId = d.decisions[0].options[0].id;
    var f = validateProposal(d).findings.filter(function (x) { return x.severity === "P0"; })[0];
    assert.ok(f, "one option is not a decision");
    assert.ok(/decisions\/\[0\]\/options/.test(f.path + " " + f.value), f.path + " " + f.value);
  });

  it("reports unequal declared widths without blocking, since the renderer equalises", function () {
    var d = load();
    d.decisions[0].options[0].screen.width = 320;
    d.decisions[0].options[1].screen.width = 480;
    var f = find(validateProposal(d).findings, "option-width");
    assert.ok(f && f.severity === "P1", "P1");
    assert.ok(f.suggestion.indexOf("equalis") !== -1 || f.suggestion.indexOf("equaliz") !== -1, "says the renderer handles it");
  });

  it("asks for a latitude line when it is missing", function () {
    var d = load();
    d.latitude = "";
    assert.ok(find(validateProposal(d).findings, "latitude"), "P1 on an empty latitude");
  });

  it("runs the prose gates over every new field", function () {
    var d = load();
    d.answer = "An answer with an em dash \u2014 here.";
    d.decisions[0].pick.cost = "A cost with an em dash \u2014 here.";
    d.latitude = "Latitude with an em dash \u2014 here.";
    var paths = validateProposal(d).findings
      .filter(function (f) { return f.check === "em-dash"; })
      .map(function (f) { return f.path; });
    assert.ok(paths.indexOf("answer") !== -1, "answer is prose-checked");
    assert.ok(paths.some(function (p) { return p.indexOf("cost") !== -1; }), "cost is prose-checked");
    assert.ok(paths.indexOf("latitude") !== -1, "latitude is prose-checked");
  });
});

describe("validate-proposal.js CLI", function () {
  function run(args) { return spawnSync(process.execPath, [SCRIPT].concat(args), { encoding: "utf8" }); }
  function tmpWith(mutate) {
    var p = path.join(os.tmpdir(), "proposal-" + Date.now() + "-" + Math.random().toString(36).slice(2) + ".json");
    fs.writeFileSync(p, JSON.stringify(withMutation(mutate)));
    return p;
  }
  it("exits 0 on the clean fixture, printing the one advisory it earns", function () {
    var r = run([FIXTURE]);
    assert.strictEqual(r.status, 0, r.stderr + r.stdout);
    assert.ok(/1 findings \(P0 0, P1 1, P2 0\)/.test(r.stdout), r.stdout);
    assert.ok(/P1 \[breadboard\]/.test(r.stdout), r.stdout);
    assert.ok(!/P1 \[terminology\]/.test(r.stdout), "the fixture's own prose passes the terminology gate: " + r.stdout);
  });
  it("exits 1 on a P0 and prints the finding line with the option", function () {
    var r = run([tmpWith(function (d) { d.decisions[0].options[1].screen.html += "<script>x()</script>"; })]);
    assert.strictEqual(r.status, 1);
    assert.ok(/P0 \[script\] option "b"/.test(r.stdout), r.stdout);
  });
  it("exits 0 on P1 only, still printing it", function () {
    var r = run([tmpWith(function (d) { d.decisions[0].options[0].screen.html += '<div style="color:#fff">x</div>'; })]);
    assert.strictEqual(r.status, 0);
    assert.ok(/P1 \[hardcoded-color\]/.test(r.stdout), r.stdout);
  });
  it("--json prints the findings array; --help prints the contract", function () {
    var r = run([tmpWith(function (d) { d.decisions[0].pick.optionId = "zz"; }), "--json"]);
    var out = JSON.parse(r.stdout);
    assert.ok(Array.isArray(out.findings) && out.findings.some(function (f) { return f.check === "pick"; }), r.stdout);
    var h = JSON.parse(run(["--help"]).stdout);
    assert.strictEqual(h.name, "validate-proposal");
    assert.ok(h.flags.some(function (f) { return f.name === "--json"; }));
  });
  // The validator's header used to name which of its bounds the schema also declares.
  // It was wrong about three of six, and by the time that was found it had gone stale a
  // second time, because the schema moves. A list maintained by hand about another file
  // is a claim, so this makes it a gate: every bound below is checked in BOTH directions,
  // marker against schema. Add a bound to the schema without marking the constant, or
  // mark a constant the schema does not back, and this fails naming the one that drifted.
  describe("the schema markers on the bounds constants", function () {
    var SOURCE = fs.readFileSync(path.join(ROOT, "scripts", "validation", "validate-proposal.js"), "utf8");
    var SCHEMA = JSON.parse(fs.readFileSync(path.join(ROOT, "schemas", "proposal-data.schema.json"), "utf8"));
    var DECISION = SCHEMA.properties.decisions.items.properties;
    // constant name -> every schema node it must be backed by, and the keyword.
    // MAX_SCOPE governs two fields, so it is a net only if BOTH of them back it.
    var BOUNDS = [
      ["MAX_DECISIONS", [SCHEMA.properties.decisions], "maxItems"],
      ["MAX_OPTIONS", [DECISION.options], "maxItems"],
      ["MIN_OPTIONS", [DECISION.options], "minItems"],
      ["MAX_CRITERIA", [DECISION.comparison.properties.criteria], "maxItems"],
      ["MIN_CRITERIA", [DECISION.comparison.properties.criteria], "minItems"],
      ["MAX_REASONS", [DECISION.pick.properties.reasons], "maxItems"],
      ["MIN_REASONS", [DECISION.pick.properties.reasons], "minItems"],
      ["MAX_SCOPE", [SCHEMA.properties.scope.properties.goals, SCHEMA.properties.scope.properties.nonGoals], "maxItems"],
      ["MAX_OPEN_QUESTIONS", [SCHEMA.properties.openQuestions], "maxItems"],
    ];
    // A constant is a net rather than a gate only when the schema rejects FIRST, which
    // needs the schema bound to be at least as strict, not merely present. The schema
    // floors criteria at 1 where this file wants 3, so that constant is still the only
    // thing enforcing 3, and marking it "also schema" would be the misreading.
    function backedBy(node, keyword, value) {
      var s = node[keyword];
      if (s === undefined) return false;
      return keyword === "maxItems" ? s <= value : s >= value;
    }
    function declaration(name) {
      var m = new RegExp("^var " + name + " = (\\d+);(.*)$", "m").exec(SOURCE);
      assert.ok(m, "no declaration of " + name + " to read");
      return { value: Number(m[1]), marked: /also schema/.test(m[2]) };
    }

    BOUNDS.forEach(function (b) {
      var name = b[0], nodes = b[1], keyword = b[2];
      it(name + " says whether the schema rejects first, and is right", function () {
        var d = declaration(name);
        var backed = nodes.every(function (n) { return backedBy(n, keyword, d.value); });
        var says = nodes.map(function (n) { return String(n[keyword]); }).join(" and ");
        if (d.marked)
          assert.ok(backed,
            name + ' is marked "also schema", but the schema says ' + keyword + " " + says +
            " against this file's " + d.value + ", so this line is still the gate. Drop the marker.");
        else
          assert.ok(!backed,
            name + " carries no marker, but the schema says " + keyword + " " + says +
            " and runs first, so this line can never fire. Mark it, or the next reader takes a net for a gate.");
      });
    });
  });

  // The three-decision acceptance fixture is the branch's flagship artifact and was read
  // by the assembler tests alone, which validate the SCHEMA and nothing else. A word
  // neutral terminology regression or a hex colour in one of its drawings shipped green
  // through every suite. The validator runs over it here, where it does not.
  it("finds nothing at all in the three-decision acceptance document", function () {
    var acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, "tests", "fixtures", "proposal-dip-i-496.json"), "utf8"));
    var all = validateProposal(acceptance).findings;
    assert.deepStrictEqual(all, [],
      "the acceptance document must be clean at every severity, and is not: " +
      all.map(function (f) { return f.severity + " [" + f.check + "] " + f.path + ": " + f.value; }).join(" | "));
  });
  // Four gaps the whole-branch review found by running inputs nobody had run. Three of
  // them made this file's own header false: it says every case the renderer throws on is
  // reported here first, so an author reads a finding and never a stack trace.
  describe("the gaps between this file and what it says it covers", function () {
    var A = { id: "a", name: "A", app: "explorer", affordances: ["one"] };
    var B = { id: "b", name: "B", app: "administration", affordances: ["one"] };
    function board(places, connections) {
      var d = load();
      d.breadboard = { places: places, connections: connections };
      return d;
    }
    function at(place, row, col) {
      var copy = JSON.parse(JSON.stringify(place));
      copy.row = row;
      copy.col = col;
      return copy;
    }
    function breadboardP0s(d) {
      return only(d, "breadboard").filter(function (f) { return f.severity === "P0"; });
    }

    it("rejects a connection that leaves and arrives at the same place", function () {
      var hits = breadboardP0s(board([A, B], [{ from: "a", to: "a", label: "loops" }]));
      assert.strictEqual(hits.length, 1, "one P0, naming the connection");
      assert.match(hits[0].path, /connections\[0\]/);
    });

    it("rejects two places sharing one cell, which the renderer cannot route between", function () {
      var hits = breadboardP0s(board([at(A, 0, 0), at(B, 0, 0)], [{ from: "a", to: "b", label: "x" }]));
      assert.strictEqual(hits.length, 1);
      assert.match(hits[0].path, /places\[1\]/);
    });

    it("rejects a negative row or col, which the schema's minimum does not", function () {
      var hits = breadboardP0s(board([at(A, 0, 0), at(B, 0, -1)], [{ from: "a", to: "b", label: "x" }]));
      assert.strictEqual(hits.length, 1);
      assert.match(hits[0].path, /places\[1\]/);
    });

    it("advises when research ran and found nothing, which draws a heading over an empty list", function () {
      var d = load();
      d.research = { ran: true, findings: [] };
      var hits = only(d, "research");
      assert.strictEqual(hits.length, 1);
      assert.strictEqual(hits[0].severity, "P1");
    });

    it("runs terminology over a decision's question, which is its heading", function () {
      var d = load();
      d.decisions[0].question = "Which asset owner sees the workflow first?";
      var hits = validateProposal(d).findings.filter(function (f) {
        return f.check === "terminology" && f.path.indexOf("question") !== -1;
      });
      assert.strictEqual(hits.length, 1, 'the question reaches the gates, not just checkProse');
      assert.strictEqual(hits[0].found, "owner");
    });

    // The three P0s above are only worth having if the renderer really does die on them,
    // which is the claim in this file's header. Asserted, rather than taken on trust.
    it("names inputs the renderer genuinely throws on", function () {
      var assembleProposal = require("../../scripts/renderers/assemble-proposal.js").assembleProposal;
      assert.throws(function () { assembleProposal(board([A, B], [{ from: "a", to: "a", label: "loops" }])); }, /breadboard/);
      assert.throws(function () { assembleProposal(board([at(A, 0, 0), at(B, 0, 0)], [{ from: "a", to: "b", label: "x" }])); }, /breadboard/);
    });
  });
});
