const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const P = path.resolve(__dirname, "../../plugins/actian-design-system");
const { checkHandover } = require(path.join(P, "scripts/validation/check-handover.js"));
const F = (n) => fs.readFileSync(path.join(__dirname, "../fixtures/handover", n), "utf8");
const opts = { template: F("specs.template.md"), registrySlugs: ["button", "drawer"], prototypeHtml: F("prototype.html") };
const checks = (text, o) => checkHandover("specs", text, Object.assign({}, opts, o)).filter((f) => f.severity === "error").map((f) => f.check);

describe("checkHandover specs", () => {
  it("passes the good file", () => assert.deepEqual(checks(F("specs.good.md")), []));
  it("missing section", () => assert.ok(checks(F("specs.good.md").replace(/## Edge Cases[\s\S]*?(?=## Flagged)/, "")).includes("section-missing")));
  it("empty section", () => assert.ok(checks(F("specs.good.md").replace("- Clicking Write descriptions opens the drawer on the first item.", "")).includes("section-empty")));
  it("section with no Source line", () => assert.ok(checks(F("specs.good.md").replace("Source: Figma\n- Button", "- Button")).includes("source-missing")));
  it("section naming a source that is not one of the three", () => assert.ok(checks(F("specs.good.md").replace("Source: Intent\n- No item", "Source: Memory\n- No item")).includes("source-missing")));
  it("unknown component slug", () => assert.ok(checks(F("specs.good.md").replace("(button)", "(buton)")).includes("component-unknown")));
  it("copy not found in the prototype", () => assert.ok(checks(F("specs.good.md").replace('"3 descriptions saved"', '"Three saved"')).includes("copy-not-in-source")));
  it("copy with a count the prototype builds at run time matches its fixed words", () => {
    const proto = '<main><button>Write descriptions</button><script>t.textContent = n + " descriptions saved";</script></main>';
    assert.deepEqual(checks(F("specs.good.md"), { prototypeHtml: proto }), []);
    assert.ok(checks(F("specs.good.md").replace('"3 descriptions saved"', '"3 items dropped"'), { prototypeHtml: proto }).includes("copy-not-in-source"));
  });
  it("copy with an HTML entity in the prototype still matches", () => {
    const proto = F("prototype.html").replace("Write descriptions", "Write&nbsp;descriptions");
    assert.deepEqual(checks(F("specs.good.md"), { prototypeHtml: proto }), []);
  });
  it("blank states cell", () => assert.ok(checks(F("specs.good.md").replace("| yes | n/a | yes | no | n/a |", "| yes |  | yes | no | n/a |")).includes("states-cell")));
  it("no knowledge version", () => assert.ok(checks(F("specs.good.md").replace("**Knowledge:** v0.34.218\n", "")).includes("knowledge-version")));
});

describe("checkHandover intent", () => {
  const t = F("intent.template.md");
  const heads = ["Summary", "Business Context & Problem", "Expected Value", "Stakeholders", "Target Users", "Goals & Success Metrics", "In Scope", "Out of Scope", "Constraints / Deadlines", "Expected Deliverables", "Design decisions", "Open questions", "Assumptions & Risks", "Insights & Resources"];
  const good = "# Intent: X\n\n**Design proposal:** p.html\n\n" + heads.map((h) => "## " + h + "\n" + (["Expected Value", "Stakeholders", "Goals & Success Metrics", "Constraints / Deadlines", "Expected Deliverables"].includes(h) ? "To fill by PM" : "Text.") + "\n").join("\n");
  const ic = (s) => checkHandover("intent", s, { template: t }).filter((f) => f.severity === "error").map((f) => f.check);
  it("passes with PM fields marked", () => assert.deepEqual(ic(good), []));
  it("a PM field neither filled nor marked is empty", () => assert.ok(ic(good.replace("## Stakeholders\nTo fill by PM", "## Stakeholders\n")).includes("section-empty")));
  it("a missing section", () => assert.ok(ic(good.replace("## Open questions\nText.\n", "")).includes("section-missing")));
  it("no design proposal link", () => assert.ok(ic(good.replace("**Design proposal:** p.html\n", "")).includes("proposal-link")));
  it("reports PM fields still open as info, not error", () => {
    const f = checkHandover("intent", good, { template: t });
    assert.ok(f.some((x) => x.severity === "info" && x.check === "pm-to-fill"));
  });
});
