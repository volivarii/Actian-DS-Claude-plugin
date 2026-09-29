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
it("writes None when there are no open questions", () => {
  const d = Object.assign({}, data); delete d.openQuestions;
  assert.match(assembleIntent(d, { template: tpl, proposalLink: "p" }).split("## Open questions")[1], /^\s*None\./);
});
it("lists open questions with their kind", () => {
  const d = Object.assign({}, data, { openQuestions: [{ kind: "open question", text: "Who names the groups?" }] });
  assert.match(assembleIntent(d, { template: tpl, proposalLink: "p" }).split("## Open questions")[1], /^\s*- \(open question\) Who names the groups\?/);
});
