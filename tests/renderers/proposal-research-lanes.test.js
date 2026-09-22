"use strict";
var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");
var { assembleProposal } = require("../../plugins/actian-design-system/scripts/renderers/assemble-proposal.js");

var ROOT = path.resolve(__dirname, "..", "..", "plugins", "actian-design-system");
var FIXTURE = path.join(__dirname, "..", "fixtures", "proposal-dip-i-496.json");
function load() { return JSON.parse(fs.readFileSync(FIXTURE, "utf8")); }
function at(h, n) { return h.indexOf(n); }
function count(h, n) { return h.split(n).length - 1; }

function withResearch(research) {
  var d = load();
  d.research = research;
  return d;
}
var THREE = {
  lanes: ["competitors", "designSystems", "ours"],
  ran: true,
  findings: [
    { lane: "competitors", claim: "Atlan puts effective access on the profile.", source: "Atlan, User profiles" },
    { lane: "designSystems", claim: "Carbon sets a role as secondary identity, never as a heading.", source: "Carbon, Account menu" },
    { lane: "ours", claim: "A read-only tag is the existing mark for access a user cannot change.", source: "guideline: read-only-tag" },
  ],
};

// 2026-09-15. The research was one undifferentiated list rendered inside the briefing under
// "What comparable products do", which is one of the four things a reader needs and the
// only one it could say. It is now four lanes with a section of its own.
describe("the research section", function () {
  it("is a section of the document, not a column of the background", function () {
    var out = assembleProposal(withResearch(THREE));
    var background = out.slice(at(out, ">Background<"), at(out, ">Research<"));
    assert.notStrictEqual(at(out, ">Research<"), -1, "there is no research section");
    assert.strictEqual(at(background, "Atlan puts"), -1, "the background carries a finding");
  });

  // 2026-09-16. It is evidence for the design, read by whoever wants to check it, so it
  // follows the design and the options it was chosen over, and precedes the sources.
  it("sits after the other options and before the sources", function () {
    var d = withResearch(THREE);
    var out = assembleProposal(d);
    assert.ok(at(out, 'id="' + d.decisions[0].id + '"') < at(out, ">Research<"), "the design comes first");
    assert.ok(at(out, ">Other options<") < at(out, ">Research<"), "then what it was chosen over");
    assert.ok(at(out, ">Research<") < at(out, 'class="citations"'), "then the research, then the sources");
  });

  it("groups the findings under the lane each came from", function () {
    var out = assembleProposal(withResearch(THREE));
    var sec = out.slice(at(out, ">Research<"));
    ["Competitors", "Design systems", "Our product and design system"].forEach(function (label) {
      assert.notStrictEqual(at(sec, label), -1, "no group for " + label);
    });
    assert.ok(at(sec, "Atlan puts") > at(sec, "Competitors"), "a competitor finding is outside its group");
    assert.ok(at(sec, "read-only tag") > at(sec, "Our product and design system"), "an ours finding is outside its group");
  });

  it("prints no group for a lane that found nothing", function () {
    var one = { lanes: ["ours"], ran: true, findings: [THREE.findings[2]] };
    var sec = assembleProposal(withResearch(one));
    sec = sec.slice(at(sec, ">Research<"));
    sec = sec.slice(0, at(sec, "</section>"));
    assert.notStrictEqual(at(sec, "Our product and design system"), -1, "the lane that ran has no group");
    assert.strictEqual(at(sec, "Competitors"), -1, "a lane nobody asked for got a heading");
    assert.strictEqual(at(sec, "Design systems"), -1, "a lane nobody asked for got a heading");
  });

  // A file written before the lanes existed carries findings with no lane at all. Refusing it
  // would strand every proposal already on disk, and what that research was is not a mystery:
  // it was the competitor sweep, because that was the only lane there was.
  it("reads a finding with no lane as a competitor finding", function () {
    var old = { ran: true, findings: [{ claim: "Account menus put the role under the name.", source: "SaaSUI" }] };
    var out = assembleProposal(withResearch(old));
    var sec = out.slice(at(out, ">Research<"));
    sec = sec.slice(0, at(sec, "</section>"));
    assert.notStrictEqual(at(sec, "Competitors"), -1, "the old findings landed in no group");
    assert.notStrictEqual(at(sec, "Account menus put"), -1, "the old finding is not rendered at all");
  });

  it("gives the reader's own refs a group of their own, after the sweeps", function () {
    var d = withResearch({
      lanes: ["competitors", "yours"],
      ran: true,
      refs: ["the Okta admin console, groups page"],
      findings: [
        THREE.findings[0],
        { lane: "yours", claim: "Okta prints the groups above the permissions they grant.", source: "the Okta admin console, groups page" },
      ],
    });
    var sec = assembleProposal(d);
    sec = sec.slice(at(sec, ">Research<"));
    sec = sec.slice(0, at(sec, "</section>"));
    assert.notStrictEqual(at(sec, "Your references"), -1, "no group for the refs the reader gave");
    assert.ok(at(sec, "Your references") > at(sec, "Competitors"), "the reader's own refs are buried above the sweep");
    assert.ok(at(sec, "Okta prints") > at(sec, "Your references"), "a yours finding is outside its group");
  });

  it("says what it did not do, and draws no empty groups, when nothing ran", function () {
    var none = { lanes: [], ran: false, findings: [], skippedBecause: "the request said skip research" };
    var out = assembleProposal(withResearch(none));
    var sec = out.slice(at(out, ">Research<"));
    sec = sec.slice(0, at(sec, "</section>"));
    assert.notStrictEqual(at(sec, "Not researched: the request said skip research"), -1, "it does not say why");
    assert.strictEqual(count(sec, "research__lane"), 0, "it drew a group anyway");
    assert.strictEqual(at(sec, "<details"), -1, "one line is folded behind a click");
  });

  // 2026-09-16. Research argues for the design; it is not the design. It sits folded under its
  // heading, like the options not chosen, and the summary says how much is inside.
  it("sits folded under its heading, every finding inside, counted in the summary", function () {
    var out = assembleProposal(withResearch(THREE));
    var sec = out.slice(at(out, "<h2>Research</h2>"));
    sec = sec.slice(0, at(sec, "</section>"));
    assert.strictEqual(count(sec, '<details class="doc__more">'), 1, "one fold, closed");
    assert.ok(at(sec, "<details") > at(sec, "<h2>Research</h2>"), "the heading stays outside the fold");
    var inside = sec.slice(at(sec, "</summary>"), sec.lastIndexOf("</details>"));
    THREE.findings.forEach(function (f) { assert.notStrictEqual(at(inside, f.claim), -1, "outside the fold: " + f.claim); });
    assert.notStrictEqual(at(sec, "<summary>3 findings</summary>"), -1, sec.slice(at(sec, "<summary>"), at(sec, "</summary>")));
  });

  it("counts a single finding in the singular", function () {
    var one = JSON.parse(JSON.stringify(THREE));
    one.lanes = ["competitors"];
    one.findings = one.findings.slice(0, 1);
    var out = assembleProposal(withResearch(one));
    assert.notStrictEqual(at(out, "<summary>1 finding</summary>"), -1);
  });
});
