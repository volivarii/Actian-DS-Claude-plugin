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

// Every card and every file beside it: a bare `name.md` is a sibling, a
// `name.js` (bare or with its path) is one script under scripts/, and each
// --flag a span passes to a script is one that script reads. No retired
// agent is named. Siblings are read too, not only SKILL.md.
describe("every file the cards name, and every flag they pass, exists", () => {
  const SKILLS = path.join(ROOT, "skills");
  const files = [];
  fs.readdirSync(SKILLS).forEach((d) =>
    fs.readdirSync(path.join(SKILLS, d)).filter((f) => f.endsWith(".md")).forEach((f) => files.push(path.join(d, f))),
  );
  const scripts = [];
  (function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".js")) scripts.push(p);
    });
  })(path.join(ROOT, "scripts"));
  // Files a card writes, not files beside it.
  const OUTPUTS = ["intent.md", "specs.md", "app.js"];
  const spans = (text) => [...text.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
  const scriptFor = (word) => {
    const rel = word.replace(/^\$\{?CLAUDE_PLUGIN_ROOT\}?\//, "");
    if (rel.includes("/")) {
      const p = path.join(ROOT, rel.startsWith("scripts/") ? rel : path.join("scripts", rel));
      return fs.existsSync(p) ? [p] : [];
    }
    return scripts.filter((s) => path.basename(s) === rel);
  };
  it("reads a span in every file", () => assert.ok(files.length >= 8, files.join(", ")));
  files.forEach((f) => {
    const text = fs.readFileSync(path.join(SKILLS, f), "utf8");
    it(f + ": its .md names and .js scripts exist, and its flags are read", () => {
      spans(text).forEach((s) => {
        const first = s.split(/\s+/)[0];
        if (/^[\w-]+\.md$/.test(first) && !OUTPUTS.includes(first))
          assert.ok(fs.existsSync(path.join(SKILLS, path.dirname(f), first)), f + ": `" + first + "` is not beside it");
        if (/^[\w./${}-]+\.js$/.test(first) && !/[<>*]/.test(first) && !OUTPUTS.includes(first)) {
          const hit = scriptFor(first);
          assert.strictEqual(hit.length, 1, f + ": `" + first + "` names " + hit.length + " scripts");
          const src = fs.readFileSync(hit[0], "utf8");
          (s.match(/(^|\s)--[a-z][\w-]*/g) || []).map((x) => x.trim()).forEach((flag) =>
            assert.ok(src.includes('"' + flag + '"') || src.includes("'" + flag + "'"), f + ": " + first + " does not read " + flag),
          );
        }
      });
    });
    it(f + ": names no retired agent", () => {
      ["screen-generator", "prototype-author", "ds-researcher", "flow-researcher", "wiring-analyzer", "flow-consistency"].forEach((a) =>
        assert.ok(!text.includes(a), f + " names " + a),
      );
    });
  });
});
