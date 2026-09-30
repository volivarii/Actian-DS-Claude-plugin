const { it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const P = path.resolve(__dirname, "../../plugins/actian-design-system");
const { assembleIntent } = require(path.join(P, "scripts/renderers/assemble-intent.js"));
const { checkHandover } = require(path.join(P, "scripts/validation/check-handover.js"));
const tpl = fs.readFileSync(path.join(__dirname, "../fixtures/handover/intent.template.md"), "utf8");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../fixtures/proposal-dip-i-496.json"), "utf8"));

it("renders an intent.md that passes the handover check", () => {
  const md = assembleIntent(data, { template: tpl, proposalLink: "proposal.html" });
  const errors = checkHandover("intent", md, { template: tpl }).filter((f) => f.severity === "error");
  assert.deepEqual(errors, []);
});
it("writes one line per decision with its pick", () => {
  const md = assembleIntent(data, { template: tpl, proposalLink: "proposal.html" });
  const block = md.split("## Design decisions")[1].split("\n## ")[0];
  assert.equal((block.match(/^- /gm) || []).length, data.decisions.length);
  const d = data.decisions[0];
  const pick = d.options.find((o) => o.id === d.pick.optionId);
  assert.ok(block.includes("- " + d.question + ": " + pick.name + "."), "the first decision's pick is not on its line");
});
it("marks PM fields, never invents them", () => {
  const md = assembleIntent(data, { template: tpl, proposalLink: "proposal.html" });
  assert.match(md.split("## Expected Value")[1], /^\s*To fill by PM/);
});
it("writes None when there are no open questions and no blockers", () => {
  const d = JSON.parse(JSON.stringify(data)); delete d.openQuestions;
  d.decisions.forEach((x) => delete x.blocker);
  assert.match(assembleIntent(d, { template: tpl, proposalLink: "p" }).split("## Open questions")[1], /^\s*None\./);
});
it("lists open questions with their kind", () => {
  const d = Object.assign({}, data, { openQuestions: [{ kind: "open question", text: "Who names the groups?" }] });
  assert.match(assembleIntent(d, { template: tpl, proposalLink: "p" }).split("## Open questions")[1].split("\n## ")[0], /^- \(open question\) Who names the groups\?$/m);
});

it("puts the decisions' blockers under Open questions, where the proposal lists them before building", () => {
  const md = assembleIntent(data, { template: tpl, proposalLink: "p" });
  const oq = md.split("## Open questions")[1].split("\n## ")[0];
  const blocked = data.decisions.filter((d) => d.blocker);
  assert.ok(blocked.length > 0);
  blocked.forEach((d) => assert.ok(oq.includes(d.blocker), "missing blocker: " + d.blocker));
  assert.ok(!/None\./.test(oq));
});
it("lists each pick's cost under Assumptions & Risks", () => {
  const md = assembleIntent(data, { template: tpl, proposalLink: "p" });
  const ar = md.split("## Assumptions & Risks")[1].split("\n## ")[0];
  data.decisions.forEach((d) => assert.ok(ar.includes(d.pick.cost), "missing cost: " + d.pick.cost));
});
it("refuses a template it cannot read, and a section title it does not know", () => {
  assert.throws(() => assembleIntent(data, { template: "---\nkind: intent\n---\n", proposalLink: "p" }), /template/);
  assert.throws(() => assembleIntent(data, { template: tpl.replace("title: Design decisions", "title: Design Decisions"), proposalLink: "p" }), /Design Decisions/);
});
it("refuses a pick that names no option, as the proposal document does", () => {
  const d = JSON.parse(JSON.stringify(data)); d.decisions[0].pick.optionId = "optoin-b";
  assert.throws(() => assembleIntent(d, { template: tpl, proposalLink: "p" }), /optoin-b/);
});
it("names a rabbit hole a risk, as the proposal document does", () => {
  const d = Object.assign({}, data, { openQuestions: [{ kind: "rabbit hole", text: "Groups may need nesting." }] });
  assert.match(assembleIntent(d, { template: tpl, proposalLink: "p" }).split("## Open questions")[1].split("\n## ")[0], /^- \(risk\) Groups may need nesting\.$/m);
});
it("names a blocker's part as the proposal document does", () => {
  const { assembleProposal } = require(path.join(P, "scripts/renderers/assemble-proposal.js"));
  const html = JSON.stringify(assembleProposal(data));
  const md = assembleIntent(data, { template: tpl, proposalLink: "p" });
  const names = [...html.matchAll(/Blocker, (.+?)\.<\/b>/g)].map((m) => m[1]);
  assert.ok(names.length > 0);
  names.forEach((n) => assert.ok(md.includes("- (blocker) " + n + ": "), "missing blocker part " + n));
});
it("writes Target Users from context.users, so the ux section is filled and the check stays quiet", () => {
  const d = JSON.parse(JSON.stringify(data));
  d.context.users = ["Business user (personas/business-user.md): signed in to Explorer, looking for the guidelines of their group."];
  const md = assembleIntent(d, { template: tpl, proposalLink: "p" });
  assert.match(md.split("## Target Users")[1].split("\n## ")[0], /^\s*- Business user \(personas\/business-user\.md\): signed in/);
  const f = checkHandover("intent", md, { template: tpl }).filter((x) => JSON.stringify(x).includes("Target Users"));
  assert.deepEqual(f, []);
});
it("keeps the gap marker in Target Users when the data names no users", () => {
  const d = JSON.parse(JSON.stringify(data)); delete d.context.users;
  assert.match(assembleIntent(d, { template: tpl, proposalLink: "p" }).split("## Target Users")[1], /^\s*To fill by PM/);
});
