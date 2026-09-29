"use strict";
// The skill cards and the contract files beside them: what a model needs to run
// each card end to end, now that the agents and references/ are gone.
const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "../../plugins/actian-design-system");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

describe("the prototype card and its contracts", () => {
  const card = read("skills/actian-ux-prototype/SKILL.md");
  it("points to the author-file contract and the Figma screen contract beside it", () => {
    ["prototype-files.md", "figma-screen.md"].forEach((f) => {
      assert.ok(card.includes("`" + f + "`"), "the card does not name " + f);
      assert.ok(fs.existsSync(path.join(ROOT, "skills/actian-ux-prototype", f)), f + " is missing");
    });
  });
  it("prototype-files.md names every kind of finding check-direct can report, at its level, and no other", () => {
    const src = read("scripts/validation/check-direct.js");
    const kinds = [...new Set([...src.matchAll(/"(?:error|warning)",\s*"([a-z-]+)"/g)].map((m) => m[1]))];
    assert.ok(kinds.length >= 14, "derived " + kinds.length + " kinds");
    const rows = [...read("skills/actian-ux-prototype/prototype-files.md").matchAll(/^\| `([a-z-]+)` \| (P0|P1) \|/gm)];
    assert.deepStrictEqual(rows.map((r) => r[1]).sort(), kinds.slice().sort());
    rows.forEach((r) => {
      const sev = new RegExp('"(error|warning)",\\s*"' + r[1] + '"').exec(src)[1];
      assert.strictEqual(r[2], sev === "error" ? "P0" : "P1", r[1] + " level");
    });
  });
});

describe("the proposal card", () => {
  const card = read("skills/actian-ux-proposal/SKILL.md");
  it("draws options as Fat Marker fragments and names their class list", () => {
    assert.match(card, /Fat Marker/);
    assert.ok(card.includes("vendor/components/render/renderer/fm-base.css"));
    assert.ok(fs.existsSync(path.join(ROOT, "vendor/components/render/renderer/fm-base.css")));
  });
});

describe("the handover cards before the templates are vendored", () => {
  ["actian-ux-proposal", "actian-ux-prototype", "actian-ux-audit"].forEach((n) => {
    it(n + " says what to do when check-handover finds no template", () => {
      assert.match(read("skills/" + n + "/SKILL.md"), /template not vendored/);
    });
  });
});
