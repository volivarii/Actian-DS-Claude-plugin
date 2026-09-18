// tests/lib/direct-brief.test.js
"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { directBrief, toDirect } = require("../../scripts/lib/app-context/direct-brief.js");

const skeleton = { content: [{ type: "FRAME", children: [
  { type: "INSTANCE", dsSlug: "search-result-card" }, { type: "INSTANCE", ref: "fmSlider" } ] }] };
const brief = () => ({
  app: { slug: "studio" },
  glossary: { chrome: { app: "studio", header: { type: "Studio" }, sidebar: [
    { label: "Dashboard", id: "dashboard" }, { label: "Catalog", id: "catalog" } ] } },
  flow: [{ n: 1, id: "f-1", name: "List" }, { n: 2, id: "f-2", name: "Panel" }],
  screens: [
    { name: "List", template: "sidebar-list", pattern: { slug: "faceted-browse", label: "Faceted browse" },
      archetype: { archetype: "table-list", skeleton: {} }, propertyRules: { button: {} },
      pageRecipe: { slug: "faceted-browse", label: "Faceted browse", slots: { rail: "Filter rail" },
        renderNotes: ["n"], skeleton, sections: ["control-bar"] },
      components: ["button", "checkbox"], exit: { via: "clicks Describe", toId: "f-2", toName: "Panel" } },
    { name: "Panel", template: "sidebar-list", pattern: null, archetype: null, pageRecipe: null,
      components: [], propertyRules: {}, layer: { kind: "panel", over: 1, overId: "f-1", overName: "List" } },
  ],
});
const deps = {
  readRecipe: () => ({ derivedFrom: { screenshot: "captures/faceted-browse.png" } }),
  exists: () => true,
};

describe("direct brief", () => {
  it("names the frame, the active item and every step", () => {
    const d = directBrief(brief(), { nav: "catalog", deps });
    assert.deepStrictEqual(d.app.rail.map((r) => r.id), ["dashboard", "catalog"]);
    assert.strictEqual(d.app.headerType, "Studio");
    assert.strictEqual(d.app.activeNav, "catalog");
    assert.deepStrictEqual(d.steps.map((s) => s.id), ["f-1", "f-2"]);
    assert.deepStrictEqual(d.steps[1].layer, { kind: "panel", over: 1, overId: "f-1", overName: "List" });
    assert.strictEqual(d.steps[0].exit.via, "clicks Describe");
  });
  it("gives a captured step its slots, notes and an absolute screenshot path, never a skeleton", () => {
    const c = directBrief(brief(), { nav: "catalog", deps }).steps[0].capture;
    assert.strictEqual(c.slug, "faceted-browse");
    assert.deepStrictEqual(c.slots, { rail: "Filter rail" });
    assert.ok(path.isAbsolute(c.screenshot) && c.screenshot.endsWith("captures/faceted-browse.png"));
    assert.strictEqual(c.skeleton, undefined);
  });
  it("gives an uncaptured step null and keeps its pattern", () => {
    const s = directBrief(brief(), { nav: "catalog", deps }).steps[1];
    assert.strictEqual(s.capture, null);
  });
  it("lists the capture's components with the screen's, each with files that exist", () => {
    const d = directBrief(brief(), { nav: "catalog" }); // real fs for this one
    const slugs = d.components.map((c) => c.slug);
    assert.deepStrictEqual(slugs, ["button", "checkbox", "search-result-card"]);
    d.components.forEach((c) => assert.ok(fs.existsSync(c.fragment), c.fragment));
    ["renderContract", "icons", "tokensCss", "baseCss", "fontsCss"].forEach((k) =>
      assert.ok(fs.existsSync(d.assets[k]), k + " " + d.assets[k]));
  });
  it("drops what only the data-file route reads", () => {
    const t = toDirect(brief(), { nav: "catalog", deps });
    assert.ok(t.direct);
    t.screens.forEach((s) => {
      assert.strictEqual(s.archetype, undefined);
      assert.strictEqual(s.propertyRules, undefined);
      assert.ok(!s.pageRecipe || s.pageRecipe.skeleton === undefined);
    });
  });
});

const cp = require("node:child_process");
const os = require("os");
describe("prepare-flow --direct (CLI)", () => {
  const LIST = path.resolve(__dirname, "../fixtures/direct/screen-list.json");
  const run = (extra) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "direct-brief-"));
    const out = path.join(dir, ".brief.json");
    const r = cp.spawnSync(process.execPath, [
      path.resolve(__dirname, "../../scripts/lib/app-context/prepare-flow.js"),
      "--app", "studio", "--screen-list", LIST, "-o", out].concat(extra), { encoding: "utf8" });
    return { r, dir, out };
  };
  it("writes one brief with a direct block and no slices", () => {
    const { r, dir, out } = run(["--direct"]);
    assert.strictEqual(r.status, 0, r.stderr);
    const b = JSON.parse(fs.readFileSync(out, "utf8"));
    assert.strictEqual(b.direct.steps.length, 4);
    assert.ok(b.direct.steps[0].capture && b.direct.steps[0].capture.screenshot);
    assert.ok(!fs.existsSync(path.join(dir, ".brief")));
  });
  it("leaves the default run alone: slices written, no direct block", () => {
    const { r, dir, out } = run([]);
    assert.strictEqual(r.status, 0, r.stderr);
    assert.strictEqual(JSON.parse(fs.readFileSync(out, "utf8")).direct, undefined);
    assert.strictEqual(fs.readdirSync(path.join(dir, ".brief")).length, 4);
  });
});
