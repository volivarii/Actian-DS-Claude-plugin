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
  it("a states row with fewer cells than the five states", () => assert.ok(checks(F("specs.good.md").replace("| Catalog | yes | n/a | yes | no | n/a |", "| Catalog | yes |")).includes("states-cell")));
  it("a States section with no table", () => assert.ok(checks(F("specs.good.md").replace(/\| Screen[\s\S]*?\| n\/a \|\n/, "Every state is covered.\n")).includes("states-table")));
  it("a States table missing a state column", () => assert.ok(checks(F("specs.good.md").replace("| Screen | Default | Loading | Empty | Error | Disabled |", "| Screen | Default | Loading | Empty | Error | Busy |")).includes("states-table")));
  it("an aligned separator row is not a data row", () => assert.deepEqual(checks(F("specs.good.md").replace("| --- | --- | --- | --- | --- | --- |", "| :--- | :---: | --- | --- | --- | ---: |")), []));
  it("a component line whose slug does not parse", () => assert.ok(checks(F("specs.good.md").replace("(button)", "(Buton)")).includes("component-line")));
  it("a component line with no slug", () => assert.ok(checks(F("specs.good.md").replace("- Button (button): the", "- Button: the")).includes("component-line")));
  it("copy from the prototype with no prototype to check it against", () => assert.ok(checks(F("specs.good.md"), { prototypeHtml: undefined }).includes("copy-unverified")));
  it("a template it cannot read fails instead of passing everything", () => {
    assert.ok(checks(F("specs.good.md"), { template: "---\nkind: specs\nsections:\n  - title: States\n---\n" }).includes("template-unreadable"));
    assert.ok(checks(F("specs.good.md"), { template: F("intent.template.md") }).includes("template-unreadable"));
  });
  it("reads a template and a file written with CRLF line ends", () => {
    const crlf = (t) => t.replace(/\n/g, "\r\n");
    assert.deepEqual(checks(crlf(F("specs.good.md")), { template: crlf(F("specs.template.md")) }), []);
  });
  it("copy written by a script with < and > comparisons in it is still found", () => {
    const proto = '<main><button>Write descriptions</button><script>if (n < 2) { t.textContent = n + " descriptions saved"; } else if (n > 5) {}</script></main>';
    assert.deepEqual(checks(F("specs.good.md"), { prototypeHtml: proto }), []);
  });
  it("copy in an attribute (placeholder, aria-label) is found", () => {
    const proto = F("prototype.html") + '<input placeholder="Search items">';
    assert.deepEqual(checks(F("specs.good.md").replace('- Confirmation: "3 descriptions saved"', '- Confirmation: "3 descriptions saved"\n- Search: "Search items"'), { prototypeHtml: proto }), []);
  });
  it("copy in curly quotes is checked, and a copy line with no quoted text is an error", () => {
    assert.ok(checks(F("specs.good.md").replace('"3 descriptions saved"', "\u201cNothing like this\u201d")).includes("copy-not-in-source"));
    assert.ok(checks(F("specs.good.md").replace('- Confirmation: "3 descriptions saved"', "- Confirmation: three saved")).includes("copy-line"));
  });
  it("the number fallback wants the fixed words in order, joined by a number or code", () => {
    const proto = "<main><button>Delete</button><button>Write descriptions</button></main>";
    assert.ok(checks(F("specs.good.md").replace('"3 descriptions saved"', '"Delete 3 descriptions"'), { prototypeHtml: proto }).includes("copy-not-in-source"));
    const built = '<main><button>Write descriptions</button><script>t.textContent = "Delete " + n + " descriptions";</script></main>';
    assert.ok(!checks(F("specs.good.md").replace('"3 descriptions saved"', '"Delete 3 descriptions"'), { prototypeHtml: built }).includes("copy-not-in-source"));
  });
  it("every Components Used line must be a component line, whatever its bullet", () => {
    assert.ok(checks(F("specs.good.md").replace("- Button (button): the", "* Buton (buton): the")).includes("component-line"));
  });
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

describe("checkHandover: round two (code-review high, #428)", () => {
  const { frontmatter, prototypePath } = require(path.join(P, "scripts/validation/check-handover.js"));
  const withCopy = (copy) => F("specs.good.md").replace('"3 descriptions saved"', JSON.stringify(copy));
  it("a count at the start or the end of the copy must be in the prototype too", () => {
    assert.ok(checks(F("specs.good.md"), { prototypeHtml: "<button>Write descriptions</button><p>No descriptions saved</p>" }).includes("copy-not-in-source"));
    assert.ok(checks(withCopy("Delete 3"), { prototypeHtml: F("prototype.html") + "<button>Delete</button>" }).includes("copy-not-in-source"));
    assert.deepEqual(checks(withCopy("Delete 3"), { prototypeHtml: F("prototype.html") + "<script>b.textContent = \"Delete \" + n;</script>" }), []);
  });
  it("stylesheet text is not copy", () => {
    assert.ok(checks(withCopy("flex"), { prototypeHtml: F("prototype.html") + "<style>a{display:flex}</style>" }).includes("copy-not-in-source"));
  });
  it("decodes typographic entities, and &amp; last", () => {
    assert.deepEqual(checks(withCopy("Don’t save"), { prototypeHtml: F("prototype.html") + "<p>Don&rsquo;t save</p>" }), []);
    assert.deepEqual(checks(withCopy("Don’t save"), { prototypeHtml: F("prototype.html") + "<p>Don&#8217;t save</p>" }), []);
    assert.ok(checks(withCopy("Use <tag>"), { prototypeHtml: F("prototype.html") + "<p>Use &amp;lt;tag&amp;gt;</p>" }).includes("copy-not-in-source"));
  });
  it("an out-of-range numeric entity is left as written, never thrown on", () => {
    assert.deepEqual(checks(F("specs.good.md"), { prototypeHtml: F("prototype.html") + "<p>&#x110000; &#9999999;</p>" }), []);
  });
  it("copy sourced from the intent is reported as unchecked", () => {
    const text = F("specs.good.md").replace(/(## Copy\n)Source: Prototype/, "$1Source: Intent");
    assert.ok(checkHandover("specs", text, opts).some((f) => f.check === "copy-intent-unverified"));
  });
  it("reads a quoted section title and an unquoted gap marker", () => {
    const fm = frontmatter('---\nkind: specs\ngapMarker: To fill by PM\nsections:\n  - { title: "States", owner: ux, required: true }\n---\n');
    assert.strictEqual(fm.sections[0].title, "States");
    assert.strictEqual(fm.gapMarker, "To fill by PM");
  });
  it("finds the prototype from a markdown link on the Prototype line", () => {
    assert.strictEqual(prototypePath("**Prototype:** [prototype](proto/p.html)\n", "/a/specs.md"), path.resolve("/a/proto/p.html"));
    assert.strictEqual(prototypePath("**Prototype:** p.html\n", "/a/specs.md"), path.resolve("/a/p.html"));
  });
  it("CLI: a --prototype that does not exist is a usage error, not a stack trace", () => {
    const cp = require("child_process");
    const r = cp.spawnSync(process.execPath, [path.join(P, "scripts/validation/check-handover.js"), "specs", path.join(__dirname, "../fixtures/handover/specs.good.md"), "--prototype", "/nope/p.html"], { encoding: "utf8" });
    assert.strictEqual(r.status, 2);
    assert.match(r.stderr, /not found/);
  });
});

describe("checkHandover intent: a section the skill owns left as the marker", () => {
  const t = F("intent.template.md");
  const heads = ["Summary", "Business Context & Problem", "Expected Value", "Stakeholders", "Target Users", "Goals & Success Metrics", "In Scope", "Out of Scope", "Constraints / Deadlines", "Expected Deliverables", "Design decisions", "Open questions", "Assumptions & Risks", "Insights & Resources"];
  const all = "# Intent: X\n\n**Design proposal:** p.html\n\n" + heads.map((h) => "## " + h + "\nTo fill by PM\n").join("\n");
  it("is a warning, never passed as a PM field", () => {
    const f = checkHandover("intent", all, { template: t });
    assert.ok(f.some((x) => x.check === "ux-to-fill" && x.where === "Summary" && x.severity === "warning"));
    assert.ok(!f.some((x) => x.check === "pm-to-fill" && x.where === "Summary"));
  });
});
