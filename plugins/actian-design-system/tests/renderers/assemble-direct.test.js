// tests/renderers/assemble-direct.test.js
"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("node:child_process");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
const FIX = path.join(ROOT, "tests/fixtures/direct");

function briefFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "assemble-direct-"));
  const out = path.join(dir, ".brief.json");
  const r = cp.spawnSync(
    process.execPath,
    [
      path.join(ROOT, "scripts/lib/app-context/prepare-flow.js"),
      "--app",
      "studio",
      "--screen-list",
      path.join(FIX, "screen-list.json"),
      "-o",
      out,
      "--direct",
    ],
    { encoding: "utf8" },
  );
  assert.strictEqual(r.status, 0, r.stderr);
  return { dir, out };
}

describe("assemble-direct", () => {
  const { dir, out } = briefFile();
  const page = path.join(dir, "flow.html");
  const r = cp.spawnSync(
    process.execPath,
    [
      path.join(ROOT, "scripts/renderers/assemble-direct.js"),
      out,
      "--author",
      path.join(FIX, "author"),
      "-o",
      page,
    ],
    { encoding: "utf8" },
  );
  const html = r.status === 0 ? fs.readFileSync(page, "utf8") : "";

  it("exits 0 and writes one self-contained page", () => {
    assert.strictEqual(r.status, 0, r.stderr);
    assert.ok(
      !/(src|href)="https?:/.test(html),
      "an external URL reached the page",
    );
    assert.ok(!/<link /.test(html));
  });
  it("draws the app frame itself, with the declared rail item active", () => {
    assert.ok(/\bds-header\b/.test(html), "no DS global header");
    assert.ok(html.includes("Catalog design"), "rail items missing");
    assert.ok(!html.includes("data-app-frame"), "the placeholder survived");
    // The real marker the side-nav leaf emits, read off a render:
    // <a class="ds-sidenav__item is-active">...<span class="ds-sidenav__label">Catalog</span></a>
    const active = html.match(
      /class="ds-sidenav__item is-active"[^>]*>[\s\S]{0,200}?ds-sidenav__label">Catalog</,
    );
    assert.ok(active, "Catalog is not the active rail item");
    assert.ok(
      html.indexOf("2 results") > html.indexOf("ds-header"),
      "author content is not inside the frame",
    );
  });
  it("styles the frame with the same stylesheets a rendered screen gets", () => {
    // One class per stylesheet the frame needs, each defined in that file and
    // NO other one the page inlines (checked with grep across all six), so
    // dropping a stylesheet fails here. .screen__body is the flex row that
    // puts the rail beside the content; without it the rail stacks on top.
    assert.ok(/\.screen__body\s*\{/.test(html), "no flow-renderer.css");
    assert.ok(/\.fm-frame\s*\{/.test(html), "no render-node.css");
    assert.ok(/\.ds-sidenav\b/.test(html), "no ds-base.css");
    assert.ok(/--zen-spacing-lg\s*:/.test(html), "no tokens.css");
  });
  it("inlines icons and leaves no data-icon behind", () => {
    assert.ok(!/data-icon=/.test(html));
    assert.ok(/<svg[^>]*class="proto-icon"/.test(html));
  });
  it("adds the strip: one button per step, the what-is-new toggle, the adds list", () => {
    assert.strictEqual((html.match(/data-proto-step="/g) || []).length, 4);
    assert.ok(html.includes("Show what is new"));
    assert.ok(html.includes("Describe action"));
  });
  it("carries the runtime: proto.go and the ?step hook, before the author's script", () => {
    assert.ok(html.indexOf("window.proto") !== -1);
    assert.ok(html.indexOf("window.proto") < html.indexOf("proto.steps = ["));
    assert.ok(/URLSearchParams/.test(html));
  });
  it("wraps a layer in the docking markup", () => {
    assert.ok(/class="proto-layer proto-layer--panel"/.test(html));
  });
  it("reports a usage error and an input error on stderr, exit 1", () => {
    const usage = cp.spawnSync(
      process.execPath,
      [path.join(ROOT, "scripts/renderers/assemble-direct.js"), out],
      { encoding: "utf8" },
    );
    assert.strictEqual(usage.status, 1);
    assert.match(usage.stderr, /usage: assemble-direct.js/);
    const plain = path.join(dir, "plain.json");
    fs.writeFileSync(plain, JSON.stringify({ screens: [] }));
    const noDirect = cp.spawnSync(
      process.execPath,
      [
        path.join(ROOT, "scripts/renderers/assemble-direct.js"),
        plain,
        "--author",
        path.join(FIX, "author"),
        "-o",
        path.join(dir, "no.html"),
      ],
      { encoding: "utf8" },
    );
    assert.strictEqual(noDirect.status, 1);
    assert.match(noDirect.stderr, /no direct block/);
  });
  it("--run <file>: the written page opens with the run's provenance comment", () => {
    const runPath = path.join(dir, "run.json");
    fs.writeFileSync(
      runPath,
      JSON.stringify({
        skill: "generate-flow --direct",
        feature: "Describe items",
        prompt: "describe items",
        date: "2026-09-19",
        duration: "1m",
        model: "claude-sonnet-5",
        pluginVersion: "2026.9.54",
      }),
    );
    const withRun = path.join(dir, "flow-run.html");
    const withRunResult = cp.spawnSync(
      process.execPath,
      [
        path.join(ROOT, "scripts/renderers/assemble-direct.js"),
        out,
        "--author",
        path.join(FIX, "author"),
        "-o",
        withRun,
        "--run",
        runPath,
      ],
      { encoding: "utf8" },
    );
    assert.strictEqual(withRunResult.status, 0, withRunResult.stderr);
    assert.ok(fs.readFileSync(withRun, "utf8").startsWith("<!--\n"));
  });
  it("--run <file> missing or unparsable: one sentence on stderr, exit 1", () => {
    const badRun = cp.spawnSync(
      process.execPath,
      [
        path.join(ROOT, "scripts/renderers/assemble-direct.js"),
        out,
        "--author",
        path.join(FIX, "author"),
        "-o",
        path.join(dir, "never.html"),
        "--run",
        path.join(dir, "does-not-exist.json"),
      ],
      { encoding: "utf8" },
    );
    assert.strictEqual(badRun.status, 1);
    assert.match(badRun.stderr, /assemble-direct: --run/);
  });
});

describe("assemble-direct: a modal on a scrim, and an author's own script", () => {
  const { assemble } = require(
    path.join(ROOT, "scripts/renderers/assemble-direct.js"),
  );
  const brief = JSON.parse(fs.readFileSync(briefFile().out, "utf8"));
  const page = (body, appJs, b) =>
    assemble({
      brief: b || brief,
      body,
      appJs: appJs || "",
      extraCss: "",
      meta: {},
      icons: {},
      css: "",
    });
  const FRAME = "<div data-app-frame><p>2 results</p></div>";
  const MODAL =
    FRAME +
    '<aside data-layer="modal" id="confirm" hidden><h2>Save 2 descriptions?</h2></aside>';

  it("draws the scrim a modal sits on, which no author writes", () => {
    const html = page(MODAL);
    assert.ok(
      /class="proto-layer proto-layer--modal"/.test(html),
      "the modal is not docked",
    );
    assert.strictEqual((html.match(/class="proto-scrim"/g) || []).length, 1);
    // It covers the stage (so the app, never the strip) and sits under the
    // modal: the modal's z-index is 20, the scrim's is below it.
    assert.match(
      html,
      /\.proto-scrim\{[^}]*position:absolute[^}]*inset:0[^}]*\}/,
    );
    assert.match(html, /\.proto-scrim\{[^}]*z-index:19[^}]*\}/);
    // And it follows the modal's own hidden attribute, which is the only
    // thing the author toggles.
    assert.ok(
      html.includes(".proto-layer--modal:not([hidden])"),
      "nothing ties the scrim to the modal's hidden state",
    );
  });
  it("draws no scrim when no layer is a modal", () => {
    const html = page(
      FRAME + '<aside data-layer="panel" hidden><p>Item 1 of 2</p></aside>',
    );
    assert.ok(!/class="proto-scrim"/.test(html));
  });
  it("an author's script cannot end its own element", () => {
    const appJs = 'var truncator = "</script>";\nwindow.afterTruncator = 1;';
    const html = page(MODAL, appJs);
    assert.ok(
      !html.includes('"</script>"'),
      "the author's raw </script> reached the page",
    );
    assert.ok(
      html.includes('"<\\/script>"'),
      "the author's </script> was not escaped",
    );
    // The closing tag is what ends a script element, so counting closers
    // counts elements: hints + runtime, the author's, boot.
    assert.strictEqual((html.match(/<\/script>/g) || []).length, 3);
    assert.ok(
      html.indexOf("URLSearchParams") > html.indexOf("afterTruncator"),
      "the boot script did not survive the author's",
    );
  });
  it("a step hint cannot end the script element either", () => {
    const b = JSON.parse(JSON.stringify(brief));
    b.direct.steps[0].exit = { via: "Describe</script><script>x=1" };
    const html = page(FRAME, "", b);
    assert.ok(!html.includes("Describe</script>"));
    assert.strictEqual((html.match(/<\/script>/g) || []).length, 3);
  });
});

describe("assemble-direct: dockLayers keeps the author's own class and data-layer", () => {
  const { dockLayers } = require(
    path.join(ROOT, "scripts/renderers/assemble-direct.js"),
  );
  const oneClassAttr = (html) => (html.match(/class="/g) || []).length;

  it("class attribute before data-layer: both proto classes and the author's class survive, one class attribute", () => {
    const html = dockLayers(
      '<aside class="ds-drawer" data-layer="drawer">x</aside>',
    );
    assert.strictEqual(oneClassAttr(html), 1);
    assert.ok(
      html.includes('class="proto-layer proto-layer--drawer ds-drawer"'),
    );
    assert.ok(html.includes('data-layer="drawer"'), "data-layer was dropped");
  });
  it("class attribute after data-layer: both proto classes and the author's class survive, one class attribute", () => {
    const html = dockLayers(
      '<aside data-layer="panel" class="ds-panel" id="p">x</aside>',
    );
    assert.strictEqual(oneClassAttr(html), 1);
    assert.ok(html.includes('class="proto-layer proto-layer--panel ds-panel"'));
    assert.ok(html.includes('data-layer="panel"'), "data-layer was dropped");
    assert.ok(html.includes('id="p"'));
  });
  it("single-quoted class attribute is read the same as double-quoted", () => {
    const html = dockLayers(
      "<aside data-layer=\"modal\" class='ds-modal'>x</aside>",
    );
    assert.strictEqual(oneClassAttr(html), 1);
    assert.ok(html.includes('class="proto-layer proto-layer--modal ds-modal"'));
    assert.ok(html.includes('data-layer="modal"'));
  });
  it("single-quoted data-layer is docked like a double-quoted one", () => {
    const html = dockLayers("<aside data-layer='drawer' id=\"d\">x</aside>");
    assert.strictEqual(oneClassAttr(html), 1);
    assert.ok(html.includes('class="proto-layer proto-layer--drawer"'));
    assert.ok(html.includes('data-layer="drawer"'));
    assert.ok(html.includes('id="d"'));
  });
  it("a kind the assembler does not know is left as written", () => {
    const src = '<aside data-layer="sheet">x</aside>';
    assert.strictEqual(dockLayers(src), src);
  });
  it("no class attribute: the proto classes are added as today, and data-layer survives", () => {
    const html = dockLayers(
      '<aside data-layer="toast" id="t" hidden>x</aside>',
    );
    assert.strictEqual(oneClassAttr(html), 1);
    assert.ok(html.includes('class="proto-layer proto-layer--toast"'));
    assert.ok(html.includes('data-layer="toast"'), "data-layer was dropped");
    assert.ok(html.includes('id="t"'));
    assert.ok(html.includes("hidden"));
  });
});

describe("assemble-direct: frameEnd finds the frame's matching close by depth", () => {
  const { frameEnd } = require(
    path.join(ROOT, "scripts/renderers/assemble-direct.js"),
  );

  it("nested divs inside the frame do not end it early", () => {
    const body =
      '<div data-app-frame><div class="a"><div class="b">x</div></div>SOMETHING</div>trailing';
    const start = body.indexOf(">") + 1;
    const end = frameEnd(body, start);
    assert.strictEqual(
      body.slice(start, end),
      '<div class="a"><div class="b">x</div></div>SOMETHING',
    );
    assert.strictEqual(body.slice(end, end + 6), "</div>");
  });

  it("a </div> or a <div inside an HTML comment does not count", () => {
    const body =
      "<div data-app-frame><!-- the old </div> went here --><p>x</p><!-- <div> --></div>TAIL";
    const start = body.indexOf(">") + 1;
    const end = frameEnd(body, start);
    assert.strictEqual(body.slice(end), "</div>TAIL");
  });

  it("throws when the frame is never closed", () => {
    const body = "<div data-app-frame><p>unclosed";
    const start = body.indexOf(">") + 1;
    assert.throws(
      () => frameEnd(body, start),
      /assemble-direct: <div data-app-frame> is never closed/,
    );
  });
});

describe("assemble-direct: the frame end is found by depth, not by guessing near the first aside", () => {
  const { assemble } = require(
    path.join(ROOT, "scripts/renderers/assemble-direct.js"),
  );
  const brief = JSON.parse(fs.readFileSync(briefFile().out, "utf8"));
  const page = (body, appJs) =>
    assemble({
      brief,
      body,
      appJs: appJs || "",
      extraCss: "",
      meta: {},
      icons: {},
      css: "",
    });

  it("a close written </div > leaves no stray character behind", () => {
    const html = page("<div data-app-frame><p>Results here</p></div >");
    assert.ok(html.includes("Results here"));
    assert.ok(!/<\/div>\s*>/.test(html), "a stray > followed the frame");
    assert.ok(!html.includes("</p>>"), "a stray > followed the content");
  });

  it("content using an aside inside the frame (a filter rail) is not cut off", () => {
    const body =
      '<div data-app-frame><aside class="filters">Filter rail</aside><p>Results here</p></div>' +
      '<aside data-layer="panel" hidden>Queue</aside>';
    const html = page(body);
    assert.ok(html.includes("Filter rail"), "the filter rail was lost");
    assert.ok(
      html.includes("Results here"),
      "content after the aside was cut off",
    );
    // Both proto-layer and proto-layer--panel also name a CSS rule up in
    // <head>, so comparing against the bare substring would always be true;
    // the docked layer's own class ATTRIBUTE only appears once, in <body>.
    assert.ok(
      html.indexOf("Filter rail") <
        html.indexOf('class="proto-layer proto-layer--panel"'),
      "the filter rail did not land inside the frame, ahead of the docked layer",
    );
    assert.ok(
      !html.includes("data-app-frame>"),
      "the placeholder text leaked into the page",
    );
  });

  it("a layer written after the frame stays outside it", () => {
    const body =
      "<div data-app-frame><p>Results</p></div>" +
      '<aside data-layer="drawer" hidden>Detail</aside>';
    const html = page(body);
    assert.ok(
      html.indexOf("Results") <
        html.indexOf('class="proto-layer proto-layer--drawer"'),
    );
  });
});

describe("assemble-direct: PROTO_NAV moves the active rail item as a flow crosses rail sections", () => {
  const { assemble, renderFrame } = require(
    path.join(ROOT, "scripts/renderers/assemble-direct.js"),
  );
  const shell = require(path.join(ROOT, "scripts/renderers/direct-shell.js"));
  const briefBase = JSON.parse(fs.readFileSync(briefFile().out, "utf8"));
  const BODY = "<div data-app-frame><p>x</p></div>";

  it("renderFrame draws the active rail label inside .ds-sidenav__label, which is what the runtime matches on", () => {
    // Pinned to a REAL render of the fixture's own rail (direct.app.rail),
    // not a string this test typed, so a renderer change breaks this test
    // rather than a user's rail.
    const frame = renderFrame(briefBase);
    const html = frame.before + frame.after;
    const activeLabel = briefBase.direct.app.rail.filter(
      (r) => r.id === briefBase.direct.app.activeNav,
    )[0].label;
    const re = new RegExp(
      'class="ds-sidenav__item is-active">[\\s\\S]{0,200}?ds-sidenav__label">' +
        activeLabel +
        "<",
    );
    assert.ok(
      re.test(html),
      ".ds-sidenav__label does not carry the active rail item's label text",
    );
  });

  it("PROTO_NAV carries the rail label per step, and null when the step names no nav or an unknown one", () => {
    const b = JSON.parse(JSON.stringify(briefBase));
    b.direct.steps[0].nav = "catalog";
    b.direct.steps[1].nav = "catalog";
    b.direct.steps[2].nav = "topics";
    b.direct.steps[3].nav = "not-a-real-rail-id";
    const html = assemble({
      brief: b,
      body: BODY,
      appJs: "",
      extraCss: "",
      meta: {},
      icons: {},
      css: "",
    });
    const m = html.match(/window\.PROTO_NAV=(\[[^\]]*\]);/);
    assert.ok(m, "PROTO_NAV was not embedded");
    assert.deepStrictEqual(JSON.parse(m[1]), [
      "Catalog",
      "Catalog",
      "Topics",
      null,
    ]);
  });

  it("PROTO_NAV is null for a step that names no nav at all", () => {
    const b = JSON.parse(JSON.stringify(briefBase));
    b.direct.steps.forEach((s) => {
      delete s.nav;
    });
    const html = assemble({
      brief: b,
      body: BODY,
      appJs: "",
      extraCss: "",
      meta: {},
      icons: {},
      css: "",
    });
    const m = html.match(/window\.PROTO_NAV=(\[[^\]]*\]);/);
    assert.deepStrictEqual(JSON.parse(m[1]), [null, null, null, null]);
  });

  // A minimal fake DOM: sidenav items with a real classList (add/remove/
  // contains) and a queryable .ds-sidenav__label child, so the RUNTIME string
  // runs unmodified in node:vm exactly as it will run in a browser.
  function fakeSidenavItem(label, active) {
    const classes = active
      ? ["ds-sidenav__item", "is-active"]
      : ["ds-sidenav__item"];
    return {
      classList: {
        add: (c) => {
          if (classes.indexOf(c) === -1) classes.push(c);
        },
        remove: (c) => {
          const i = classes.indexOf(c);
          if (i !== -1) classes.splice(i, 1);
        },
        contains: (c) => classes.indexOf(c) !== -1,
      },
      querySelector: (sel) =>
        sel === ".ds-sidenav__label" ? { textContent: label } : null,
    };
  }

  function runRuntime(navSequence) {
    const items = [
      fakeSidenavItem("Catalog", true),
      fakeSidenavItem("Topics", false),
    ];
    const fakeDocument = {
      querySelectorAll: (sel) => {
        if (sel === "[data-proto-step]") return [];
        if (sel === ".ds-sidenav__item") return items;
        return [];
      },
      querySelector: () => null,
    };
    const sandbox = { document: fakeDocument, PROTO_NAV: navSequence };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(shell.RUNTIME, sandbox);
    sandbox.proto.steps = navSequence.map(() => ({}));
    return { proto: sandbox.proto, items };
  }

  it("go(n) moves is-active to the rail item whose label matches PROTO_NAV[n-1]", () => {
    const { proto, items } = runRuntime(["Topics", null]);
    proto.go(1);
    assert.ok(
      !items[0].classList.contains("is-active"),
      "Catalog should no longer be active",
    );
    assert.ok(
      items[1].classList.contains("is-active"),
      "Topics should now be active",
    );
  });

  it("go(n) leaves the rail alone when PROTO_NAV[n-1] is null", () => {
    const { proto, items } = runRuntime(["Topics", null]);
    proto.go(1);
    proto.go(2);
    assert.ok(
      !items[0].classList.contains("is-active"),
      "a null nav entry must not touch the rail",
    );
    assert.ok(
      items[1].classList.contains("is-active"),
      "a null nav entry must not touch the rail",
    );
  });
});

describe("assemble-direct: F7 regression - a layer aside written inside the frame", () => {
  const { assemble } = require(
    path.join(ROOT, "scripts/renderers/assemble-direct.js"),
  );
  const brief = JSON.parse(fs.readFileSync(briefFile().out, "utf8"));
  const page = (body) =>
    assemble({
      brief,
      body,
      appJs: "",
      extraCss: "",
      meta: {},
      icons: {},
      css: "",
    });

  // Before F3, a nearest-</div>-before-the-first-<aside search on this exact
  // shape found no </div> ahead of the aside at all (the frame had just
  // opened), so lastIndexOf returned -1: the content duplicated and the
  // literal text "data-app-frame>" leaked into the page (reproduced through
  // the CLI in the final whole-branch review). F3's depth scan ends it: this
  // pins the fix at the assemble level, on the exact shape that broke.
  it("does not duplicate content or leak the placeholder text", () => {
    const body =
      '<div data-app-frame><aside data-layer="panel" hidden><p>Item 1 of 2</p></aside><p>2 results</p></div>';
    const html = page(body);
    assert.strictEqual(
      (html.match(/2 results/g) || []).length,
      1,
      "content was duplicated",
    );
    assert.ok(
      !html.includes("data-app-frame>"),
      "the placeholder text leaked into the page",
    );
  });
});

describe("assemble-direct: the page carries its provenance", () => {
  const { assemble } = require(
    path.join(ROOT, "scripts/renderers/assemble-direct.js"),
  );
  const brief = JSON.parse(fs.readFileSync(briefFile().out, "utf8"));
  const BODY_OK = "<div data-app-frame><p>2 results</p></div>";
  const page = (body, appJs, run) =>
    assemble({
      brief,
      body,
      appJs: appJs || "",
      extraCss: "",
      meta: {},
      icons: {},
      css: "",
      run,
    });

  it("the page opens with its provenance, and a comment cannot be closed from inside", () => {
    const html = page(BODY_OK, "", {
      skill: "generate-flow --direct",
      feature: "Describe items",
      prompt: "describe --> <script>x</script>",
      date: "2026-09-19",
      duration: "6m 10s",
      model: "claude-sonnet-5",
      pluginVersion: "2026.9.54",
    });
    assert.ok(html.startsWith("<!--\n"));
    const end = html.indexOf("-->");
    assert.ok(html.slice(0, end).includes("prompt:"));
    assert.ok(html.slice(0, end).includes("2026.9.54"));
    assert.strictEqual(
      html.slice(end + 3).trimStart().indexOf("<!doctype html>"),
      0,
    );
    assert.ok(
      !html.slice(0, end).includes("<script>"),
      "the prompt reached the comment unmasked",
    );
  });
  it("no run file: no comment, the page starts at the doctype", () => {
    assert.ok(page(BODY_OK).startsWith("<!doctype html>"));
  });
});
