// tests/lib/direct-brief.test.js
"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const {
  directBrief,
  toDirect,
  LAYERS,
} = require("../../plugins/actian-design-system/scripts/lib/app-context/direct-brief.js");

const skeleton = {
  content: [
    {
      type: "FRAME",
      children: [
        { type: "INSTANCE", dsSlug: "search-result-card" },
        { type: "INSTANCE", ref: "fmSlider" },
      ],
    },
  ],
};
const brief = () => ({
  app: { slug: "studio" },
  glossary: {
    chrome: {
      app: "studio",
      header: { type: "Studio" },
      sidebar: [
        { label: "Dashboard", id: "dashboard" },
        { label: "Catalog", id: "catalog" },
      ],
    },
  },
  flow: [
    { n: 1, id: "f-1", name: "List" },
    { n: 2, id: "f-2", name: "Panel" },
  ],
  screens: [
    {
      name: "List",
      template: "sidebar-list",
      pattern: { slug: "faceted-browse", label: "Faceted browse" },
      archetype: { archetype: "table-list", skeleton: {} },
      propertyRules: { button: {} },
      pageRecipe: {
        slug: "faceted-browse",
        label: "Faceted browse",
        slots: { rail: "Filter rail" },
        renderNotes: ["n"],
        skeleton,
        sections: ["control-bar"],
      },
      components: ["button", "checkbox"],
      exit: { via: "clicks Describe", toId: "f-2", toName: "Panel" },
    },
    {
      name: "Panel",
      template: "sidebar-list",
      pattern: null,
      archetype: null,
      pageRecipe: null,
      components: [],
      propertyRules: {},
      layer: { kind: "panel", over: 1, overId: "f-1", overName: "List" },
    },
  ],
});
const deps = {
  readRecipe: () => ({
    derivedFrom: { screenshot: "captures/faceted-browse.png" },
  }),
  exists: () => true,
};

// A minimal brief with one plain screen plus one screen per layer kind, so
// a test can ask what components a declared layer brings in.
const briefWithLayers = (kinds) => ({
  screens: [{ name: "Plain" }].concat(
    kinds.map((k) => ({ name: k, layer: { kind: k } })),
  ),
});

describe("direct brief", () => {
  it("names the frame, the active item and every step", () => {
    const d = directBrief(brief(), { nav: "catalog", deps });
    assert.deepStrictEqual(
      d.app.rail.map((r) => r.id),
      ["dashboard", "catalog"],
    );
    assert.strictEqual(d.app.headerType, "Studio");
    assert.strictEqual(d.app.activeNav, "catalog");
    assert.deepStrictEqual(
      d.steps.map((s) => s.id),
      ["f-1", "f-2"],
    );
    assert.deepStrictEqual(d.steps[1].layer, {
      kind: "panel",
      over: 1,
      overId: "f-1",
      overName: "List",
    });
    assert.strictEqual(d.steps[0].exit.via, "clicks Describe");
  });
  it("names a captured step's capture by slug, and the slug's full capture carries the slots, notes and an absolute screenshot path, never a skeleton", () => {
    const d = directBrief(brief(), { nav: "catalog", deps });
    assert.strictEqual(d.steps[0].capture, "faceted-browse");
    const c = d.captures["faceted-browse"];
    assert.strictEqual(c.slug, "faceted-browse");
    assert.deepStrictEqual(c.slots, { rail: "Filter rail" });
    assert.ok(
      path.isAbsolute(c.screenshot) &&
        c.screenshot.endsWith("captures/faceted-browse.png"),
    );
    assert.strictEqual(c.skeleton, undefined);
  });
  it("direct.captures is keyed by slug, and a capture two steps share is stored once", () => {
    const b = brief();
    b.screens[1].pageRecipe = JSON.parse(JSON.stringify(b.screens[0].pageRecipe));
    const d = directBrief(b, { nav: "catalog", deps });
    assert.deepStrictEqual(Object.keys(d.captures), ["faceted-browse"]);
    assert.strictEqual(d.steps[0].capture, "faceted-browse");
    assert.strictEqual(d.steps[1].capture, "faceted-browse");
  });
  it("gives an uncaptured step null and keeps its pattern", () => {
    const s = directBrief(brief(), { nav: "catalog", deps }).steps[1];
    assert.strictEqual(s.capture, null);
  });
  it("lists the capture's components with the screen's, each with files that exist", () => {
    const d = directBrief(brief(), { nav: "catalog" }); // real fs for this one
    const slugs = d.components.map((c) => c.slug);
    assert.deepStrictEqual(slugs, ["button", "checkbox", "drawer", "search-result-card"]);
    d.components.forEach((c) =>
      assert.ok(fs.existsSync(c.fragment), c.fragment),
    );
    [
      "renderContract",
      "icons",
      "tokensCss",
      "baseCss",
      "fontsCss",
      "terminology",
    ].forEach((k) =>
      assert.ok(fs.existsSync(d.assets[k]), k + " " + d.assets[k]),
    );
    // frameCss is what the assembled page inlines, in order. The frame's own
    // layout lives in render-node.css and flow-renderer.css, which none of the
    // single-file entries above names, so a brief without this list cannot
    // draw a styled app frame.
    d.assets.frameCss.forEach((f) => assert.ok(fs.existsSync(f), f));
    assert.strictEqual(d.assets.frameCss[0], d.assets.tokensCss);
    ["render-node.css", "flow-renderer.css", "ds-base.css"].forEach((name) =>
      assert.ok(
        d.assets.frameCss.some((f) => f.endsWith(name)),
        "frameCss does not name " + name,
      ),
    );
    ["writing", "patterns", "product"].forEach((k) =>
      assert.ok(
        fs.existsSync(d.assets.content[k]),
        "content." + k + " " + d.assets.content[k],
      ),
    );
  });
  it("drops what only the data-file route reads", () => {
    const t = toDirect(brief(), { nav: "catalog", deps });
    assert.ok(t.direct);
    t.screens.forEach((s) => {
      assert.strictEqual(s.archetype, undefined);
      assert.strictEqual(s.propertyRules, undefined);
      assert.strictEqual(s.pageRecipe, undefined);
      assert.strictEqual(s.sections, undefined);
    });
  });
  it("replaces glossary.patterns with only the patterns a step declares", () => {
    const b = brief();
    b.glossary.patterns = [
      { slug: "faceted-browse", label: "Faceted browse" },
      { slug: "unused-pattern", label: "Never declared" },
    ];
    const t = toDirect(b, { nav: "catalog", deps });
    assert.deepStrictEqual(
      t.glossary.patterns.map((p) => p.slug),
      ["faceted-browse"],
    );
  });
});

describe("direct brief: a layer brings its component", () => {
  it("a declared layer brings the component it is drawn with", () => {
    const d = directBrief(briefWithLayers(["panel", "toast", "modal", "drawer"]), { deps });
    const slugs = d.components.map((c) => c.slug);
    ["drawer", "modal", "toast"].forEach((s) => assert.ok(slugs.includes(s), s + " missing"));
    assert.strictEqual(slugs.filter((s) => s === "drawer").length, 1, "panel and drawer share one entry");
  });
  it("the toast layer names the global-toast usage note", () => {
    const d = directBrief(briefWithLayers(["toast"]), { deps });
    assert.ok(/usage-notes\/global-toast\.md$/.test(d.layers.toast.usageNotes));
  });
  it("a flow with no layer lists no layer component it did not ask for", () => {
    const d = directBrief(briefWithLayers([]), { deps });
    assert.ok(!d.components.some((c) => c.slug === "toast"));
  });
  it("does not mutate the exported LAYERS constant across calls", () => {
    directBrief(briefWithLayers(["toast"]), { deps });
    directBrief(briefWithLayers(["toast"]), { deps });
    assert.ok(!("usageNotes" in LAYERS.toast));
  });
});

describe("direct brief: direct.fragments names every fragment on disk, not only what captures and screens name", () => {
  it("reads through deps.listFragments, stripping .html and sorting", () => {
    const injected = Object.assign({}, deps, {
      listFragments: () => ["zeta.html", "alpha.html", "not-a-fragment.txt"],
    });
    const d = directBrief(brief(), { nav: "catalog", deps: injected });
    assert.deepStrictEqual(d.fragments.slugs, ["alpha", "zeta"]);
  });
  it("dir and usageNotesDir are absolute, and text-area and tabs are among the real substrate's slugs", () => {
    const d = directBrief(brief(), { nav: "catalog" }); // real fs
    assert.ok(path.isAbsolute(d.fragments.dir));
    assert.ok(path.isAbsolute(d.fragments.usageNotesDir));
    assert.ok(fs.existsSync(d.fragments.dir));
    assert.ok(fs.existsSync(d.fragments.usageNotesDir));
    assert.ok(d.fragments.slugs.includes("text-area"));
    assert.ok(d.fragments.slugs.includes("tabs"));
    assert.deepStrictEqual(d.fragments.slugs, d.fragments.slugs.slice().sort());
  });
});

const cp = require("node:child_process");
const os = require("os");
describe("prepare-flow --direct (CLI)", () => {
  const LIST = path.resolve(__dirname, "../fixtures/direct/screen-list.json");
  const run = (extra) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "direct-brief-"));
    const out = path.join(dir, ".brief.json");
    const r = cp.spawnSync(
      process.execPath,
      [
        path.resolve(
          __dirname, "../../plugins/actian-design-system/scripts/lib/app-context/prepare-flow.js",
        ),
        "--app",
        "studio",
        "--screen-list",
        LIST,
        "-o",
        out,
      ].concat(extra),
      { encoding: "utf8" },
    );
    return { r, dir, out };
  };
  it("writes one brief with a direct block and no slices", () => {
    const { r, dir, out } = run(["--direct"]);
    assert.strictEqual(r.status, 0, r.stderr);
    const b = JSON.parse(fs.readFileSync(out, "utf8"));
    assert.strictEqual(b.direct.steps.length, 4);
    assert.strictEqual(typeof b.direct.steps[0].capture, "string");
    assert.ok(b.direct.captures[b.direct.steps[0].capture].screenshot);
    assert.ok(!fs.existsSync(path.join(dir, ".brief")));
  });
  it("a capture two steps share is one entry in direct.captures", () => {
    const { r, out } = run(["--direct"]);
    assert.strictEqual(r.status, 0, r.stderr);
    const b = JSON.parse(fs.readFileSync(out, "utf8"));
    assert.strictEqual(b.direct.steps[0].capture, b.direct.steps[1].capture);
    assert.strictEqual(Object.keys(b.direct.captures).length, 2);
  });
  it("glossary.patterns holds only the patterns the steps declare, and the written brief is far smaller", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "direct-brief-size-"));
    const out = path.join(dir, ".brief.json");
    const r = cp.spawnSync(
      process.execPath,
      [
        path.resolve(__dirname, "../../plugins/actian-design-system/scripts/lib/app-context/prepare-flow.js"),
        "--app",
        "studio",
        "--entity",
        "catalog-object",
        "--use-case",
        "steward",
        "--screen-list",
        LIST,
        "--direct",
        "-o",
        out,
      ],
      { encoding: "utf8" },
    );
    assert.strictEqual(r.status, 0, r.stderr);
    const size = fs.statSync(out).size;
    assert.ok(size < 70000, "expected under 70000 bytes, measured " + size);
    const b = JSON.parse(fs.readFileSync(out, "utf8"));
    const declared = new Set(
      b.direct.steps.map((s) => s.pattern && s.pattern.slug).filter(Boolean),
    );
    assert.deepStrictEqual(
      b.glossary.patterns.map((p) => p.slug).sort(),
      Array.from(declared).sort(),
    );
  });
  it("leaves the default run alone: slices written, no direct block", () => {
    const { r, dir, out } = run([]);
    assert.strictEqual(r.status, 0, r.stderr);
    assert.strictEqual(
      JSON.parse(fs.readFileSync(out, "utf8")).direct,
      undefined,
    );
    assert.strictEqual(fs.readdirSync(path.join(dir, ".brief")).length, 4);
  });
});
