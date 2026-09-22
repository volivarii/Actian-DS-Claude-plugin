"use strict";

// The direct route's prose (the author agent, direct.md, the skill's flag
// row) names things the scripts own: layer kinds, finding kinds, script flags.
// Each is read from the script's source here, so prose and code cannot drift.

const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const { LAYER_KINDS } = require(
  path.join(ROOT, "scripts/renderers/assemble-direct.js"),
);

// Every `--flag` (or `-o`) written on a line that runs a plugin script must be
// a quoted literal in that script's source.
function flagsExist(doc, where) {
  const lines = doc
    .split("\n")
    .filter((l) => /"\$NODE_BIN"/.test(l) && /scripts\/[a-z/-]+\.js/.test(l));
  lines.forEach((l) => {
    const script = l.match(/scripts\/[a-z/-]+\.js/)[0];
    const src = read(script);
    const tail = l.slice(l.indexOf(script) + script.length);
    (tail.match(/(?:^|\s)(--?[a-z][a-z-]*)(?=\s|$)/g) || [])
      .map((f) => f.trim())
      .forEach((flag) =>
        assert.ok(
          src.includes('"' + flag + '"'),
          where + ": " + script + " has no " + flag,
        ),
      );
  });
  return lines.length;
}

describe("prototype-author: the agent file agrees with the scripts", () => {
  const agent = read("agents/prototype-author.md");

  it("frontmatter: name, inherited model, Read Write Bash", () => {
    assert.match(agent, /^name: prototype-author$/m);
    assert.match(agent, /^model: inherit$/m);
    assert.match(agent, /^tools: \["Read", "Write", "Bash"\]$/m);
  });

  it("names the four files and the author's markers", () => {
    [
      "body.html",
      "app.js",
      "extra.css",
      "meta.json",
      "data-app-frame",
      "data-icon",
      "data-layer",
      "data-new",
      "proto.steps",
      "arrive()",
      "proto.go(",
      "direct.steps",
    ].forEach((s) => assert.ok(agent.includes(s), s));
  });

  it("names every layer kind the assembler docks, and no other", () => {
    LAYER_KINDS.forEach((k) => assert.ok(agent.includes("`" + k + "`"), k));
    const listed = (agent.match(/data-layer="([a-z|]+)"/) || [])[1];
    assert.strictEqual(listed, LAYER_KINDS.join("|"));
  });

  it("the classes it forbids are the ones check-direct reports as frame-redrawn", () => {
    const src = read("scripts/validation/check-direct.js");
    ["ds-header", "ds-sidenav"].forEach((c) => {
      assert.ok(agent.includes("`" + c + "`"), c + " not in the agent file");
      assert.ok(src.includes('"' + c + '"'), c + " not in check-direct.js");
    });
  });

  it("runs the three scripts through the resolved node, with flags that exist", () => {
    ["assemble-direct.js", "check-direct.js", "look-direct.js"].forEach((s) =>
      assert.ok(agent.includes(s), s),
    );
    assert.strictEqual(flagsExist(agent, "prototype-author.md"), 3);
    agent
      .split("\n")
      .filter((l) => /"\$NODE_BIN"/.test(l))
      .forEach((l) => assert.ok(l.includes("resolve-node.sh"), l));
    assert.doesNotMatch(agent, /^\s*node\s/m);
  });

  it("the brief fields it names are fields the brief has", () => {
    const { directBrief } = require(
      path.join(ROOT, "scripts/lib/app-context/direct-brief.js"),
    );
    const d = directBrief(
      { screens: [{ name: "a", layer: { kind: "toast" } }], flow: [{ id: "a-1" }] },
      { deps: { exists: () => true, readRecipe: () => null } },
    );
    const named = [...agent.matchAll(/`direct\.([a-zA-Z.[\]]+)`/g)].map((m) => m[1]);
    assert.ok(named.length >= 10, "derived " + named.length + " field names");
    named.forEach((p) => {
      let cur = d;
      p.replace(/\[\]/g, ".0").split(".").forEach((k) => {
        assert.ok(cur != null && k in Object(cur), "direct." + p + " is not in the brief (at " + k + ")");
        cur = cur[k];
      });
    });
  });

  it("says what it never reads, and what a look that did not happen is called", () => {
    ["html-reference.md", "ds-components-authoring.md", "not looked at", "scripts: not run"].forEach(
      (s) => assert.ok(agent.includes(s), s),
    );
  });
});

describe("actian-ux-prototype --direct: the skill routes to direct.md, and direct.md agrees with the scripts", () => {
  const skill = read("skills/actian-ux-prototype/SKILL.md");
  const direct = read("references/actian-ux-prototype/direct.md");

  it("SKILL.md has the flag row, the routing line and the reference", () => {
    assert.ok(skill.split("\n").some((l) => l.indexOf("| `--direct`") === 0));
    assert.ok(skill.split("\n").some((l) => l.indexOf("- `--direct`: read `references/actian-ux-prototype/direct.md`") === 0));
  });

  it("direct.md names every kind of finding check-direct can report, and no other", () => {
    const src = read("scripts/validation/check-direct.js");
    const kinds = [
      ...new Set(
        [...src.matchAll(/"(?:error|warning)",\s*"([a-z-]+)"/g)].map((m) => m[1]),
      ),
    ];
    assert.ok(kinds.length >= 14, "derived " + kinds.length + " kinds");
    const rows = [...direct.matchAll(/^\| `([a-z-]+)` \| (P0|P1) \|/gm)];
    assert.deepStrictEqual(rows.map((r) => r[1]).sort(), kinds.slice().sort());
    rows.forEach((r) => {
      const sev = new RegExp('"(error|warning)",\\s*"' + r[1] + '"').exec(src)[1];
      assert.strictEqual(r[2], sev === "error" ? "P0" : "P1", r[1] + " level");
    });
  });

  it("direct.md refuses the flags the route does not combine with, and each is a flag the skill has", () => {
    ["--push", "--fm", "--lofi", "--audit", "--variants", "--breakpoints", "--states", "--from", "--branch"].forEach((f) => {
      assert.ok(direct.includes("`" + f + "`"), f + " not refused in direct.md");
      assert.ok(skill.split("\n").some((l) => l.indexOf("| `" + f) === 0), f + " is not a flag of the skill");
    });
  });

  it("every flag on a script line in direct.md exists in that script's source", () => {
    assert.ok(flagsExist(direct, "direct.md") >= 5);
  });

  it("the inputs direct.md hands the agent are the inputs the agent file names", () => {
    const agent = read("agents/prototype-author.md");
    // The inputs are D4's own bullets, so an input added there and not to the
    // agent file fails here.
    const inputs = [...direct.matchAll(/^- `([a-zA-Z]+)` = /gm)].map((m) => m[1]);
    assert.ok(inputs.length >= 7, "derived " + inputs.length + " inputs from D4");
    inputs.forEach((k) =>
      assert.ok(agent.includes("`" + k + "`"), k + " is handed over by direct.md and not named in the agent file"),
    );
    assert.ok(direct.includes("`scripts: not run`") && agent.includes("`scripts: not run`"));
  });

  it("direct.md states check-direct's trust assumption and the handover's look line", () => {
    assert.match(direct, /wrote in this session/);
    assert.match(direct, /Not looked at/);
    assert.match(direct, /differ in structure/);
  });
});
