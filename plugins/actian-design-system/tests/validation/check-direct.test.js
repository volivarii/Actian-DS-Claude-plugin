// tests/validation/check-direct.test.js
"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  checkDirect,
  main,
} = require("../../scripts/validation/check-direct.js");

const brief = {
  direct: {
    steps: [
      { n: 1, id: "f-1" },
      { n: 2, id: "f-2" },
    ],
  },
};
const css = ":root{--zen-a:1px}.ds-button{}.ds-button--primary{}";
const icons = { edit: { viewBox: "0 0 16 16", body: "" } };
const ok = {
  brief,
  css,
  icons,
  body: '<div data-app-frame><button class="ds-button" data-new="X"><span data-icon="edit"></span></button></div>',
  appJs:
    'proto.steps = [{ id: "f-1", arrive: function () {} }, { id: "f-2", arrive: function () {} }];',
  extraCss: ".p{padding:var(--zen-a)}",
  meta: { adds: [{ name: "X", composedFrom: ["button"], why: "w" }] },
};
const kinds = (o) => checkDirect(Object.assign({}, ok, o)).map((f) => f.check);

describe("check-direct", () => {
  it("passes the clean fixture", () =>
    assert.deepStrictEqual(checkDirect(ok), []));
  it("external-url", () =>
    assert.ok(
      kinds({ body: ok.body + '<img src="https://x.y/a.png">' }).includes(
        "external-url",
      ),
    ));
  it("unfilled-token", () =>
    assert.ok(
      kinds({ body: ok.body + "<p>{{count}}</p>" }).includes("unfilled-token"),
    ));
  it("unknown-icon", () =>
    assert.ok(
      kinds({ body: ok.body.replace('"edit"', '"nope"') }).includes(
        "unknown-icon",
      ),
    ));
  it("unknown-token", () =>
    assert.ok(
      kinds({ extraCss: ".p{color:var(--made-up)}" }).includes("unknown-token"),
    ));
  it("unknown-token: reports the file it was found in, not always extra.css", () => {
    const f = checkDirect(
      Object.assign({}, ok, {
        body: ok.body + '<p style="top:var(--made-up-in-body)">x</p>',
      }),
    ).filter((x) => x.check === "unknown-token");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].path, "body.html");
  });
  it("unknown-token: direct-shell.js's own CSS (--proto-app-header) is a defined token, not a false positive", () => {
    const f = checkDirect(
      Object.assign({}, ok, {
        extraCss: ".p{top:var(--proto-app-header)}",
      }),
    ).filter((x) => x.check === "unknown-token");
    assert.deepStrictEqual(f, []);
  });
  it("unknown-ds-class: a class a named fragment carries is known, rule or no rule", () => {
    const body = ok.body.replace("</div>", '<span class="ds-tag ds-tag--hook-only">x</span></div>');
    const css2 = css + "\n.ds-tag{display:inline-flex}";
    assert.ok(kinds({ body, css: css2 }).includes("unknown-ds-class"), "fires without the fragment");
    assert.ok(
      !kinds({ body, css: css2, fragments: ['<span class="ds-tag ds-tag--hook-only">Label</span>'] }).includes("unknown-ds-class"),
      "a class from the design system's own markup was reported",
    );
    assert.ok(
      kinds({ body: body.replace("ds-tag--hook-only", "ds-tag--invented"), css: css2, fragments: ["<span class='ds-tag ds-tag--hook-only'>Label</span>"] }).includes("unknown-ds-class"),
      "an invented class passed because a fragment was given",
    );
  });
  it("unknown-ds-class: the CLI reads the fragments the brief names", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cd-frag-"));
    const frag = path.join(dir, "tag.html");
    fs.writeFileSync(frag, '<span class="ds-tag--hook-only">Label</span>');
    const b = JSON.parse(JSON.stringify(brief));
    b.direct.components = [{ slug: "tag", fragment: frag, usageNotes: null }];
    const cssFile = path.join(dir, "page.css");
    const iconFile = path.join(dir, "icons.json");
    fs.writeFileSync(cssFile, css);
    fs.writeFileSync(iconFile, JSON.stringify({ icons }));
    b.direct.assets = { frameCss: [cssFile], icons: iconFile };
    fs.writeFileSync(path.join(dir, "brief.json"), JSON.stringify(b));
    const author = path.join(dir, "author");
    fs.mkdirSync(author);
    fs.writeFileSync(path.join(author, "body.html"), '<div data-app-frame><span class="ds-tag--hook-only">x</span></div>');
    fs.writeFileSync(path.join(author, "app.js"), ok.appJs);
    const cp = require("child_process");
    const r = cp.spawnSync(process.execPath, [path.join(__dirname, "../../scripts/validation/check-direct.js"), path.join(dir, "brief.json"), "--author", author], { encoding: "utf8" });
    assert.strictEqual(r.stdout, "check-direct: clean\n", r.stdout + r.stderr);
  });
  it("unknown-ds-class", () =>
    assert.ok(
      kinds({ body: ok.body.replace("ds-button", "ds-buton") }).includes(
        "unknown-ds-class",
      ),
    ));
  it("raw-colour is a warning", () => {
    const f = checkDirect(
      Object.assign({}, ok, { extraCss: ".p{color:#ff0000}" }),
    ).filter((x) => x.check === "raw-colour");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].severity, "warning");
  });
  it("frame-redrawn: the real side-nav block class fires", () =>
    assert.ok(
      kinds({ body: ok.body + '<nav class="ds-sidenav"></nav>' }).includes(
        "frame-redrawn",
      ),
    ));
  it("frame-redrawn: a side-nav element class fires, single-quoted", () =>
    assert.ok(
      kinds({
        body: ok.body + "<a class='ds-sidenav__item is-active'></a>",
      }).includes("frame-redrawn"),
    ));
  it("frame-redrawn: the header block class fires", () =>
    assert.ok(
      kinds({ body: ok.body + '<header class="ds-header"></header>' }).includes(
        "frame-redrawn",
      ),
    ));
  it("frame-redrawn: a class that only starts with the same letters is not the header or side-nav block", () =>
    assert.ok(
      !kinds({ body: ok.body + '<div class="ds-headerless"></div>' }).includes(
        "frame-redrawn",
      ),
    ));
  it("frame-redrawn: pinned to the real side-nav fragment markup, not a string this test typed", () => {
    const PATHS = require("../../scripts/lib/paths.js");
    const fragment = fs.readFileSync(
      PATHS.components.render.fragments("side-nav"),
      "utf8",
    );
    assert.ok(kinds({ body: ok.body + fragment }).includes("frame-redrawn"));
  });
  it("frame-missing", () =>
    assert.ok(kinds({ body: "<p>x</p>" }).includes("frame-missing")));
  it("layer-misplaced: a kind the assembler does not dock", () => {
    const f = checkDirect(
      Object.assign({}, ok, {
        body: ok.body + "<aside data-layer='sheet' hidden>x</aside>",
      }),
    );
    const m = f.filter((x) => x.check === "layer-misplaced");
    assert.strictEqual(m.length, 1);
    assert.strictEqual(
      m[0].value,
      '"sheet" is not a kind of layer (drawer, panel, modal, toast): it is never docked',
    );
  });
  it("layer-misplaced: a single-quoted layer of a known kind, after the frame, does not fire", () => {
    const f = checkDirect(
      Object.assign({}, ok, {
        body: ok.body + "<aside data-layer='toast' hidden>x</aside>",
      }),
    );
    assert.ok(!f.some((x) => x.check === "layer-misplaced"));
  });
  it("layer-misplaced: any element other than aside carrying data-layer is never docked", () => {
    const f = checkDirect(
      Object.assign({}, ok, {
        body: ok.body + '<div data-layer="panel" hidden>x</div>',
      }),
    );
    const m = f.filter((x) => x.check === "layer-misplaced");
    assert.strictEqual(m.length, 1);
    assert.strictEqual(m[0].severity, "error");
    assert.strictEqual(
      m[0].value,
      "a layer is an <aside data-layer>: div is never docked",
    );
  });
  it("layer-misplaced: an aside layer written inside the frame div", () => {
    const body =
      '<div data-app-frame><aside data-layer="panel" hidden>x</aside></div>';
    const f = checkDirect(Object.assign({}, ok, { body }));
    const m = f.filter((x) => x.check === "layer-misplaced");
    assert.strictEqual(m.length, 1);
    assert.strictEqual(m[0].severity, "error");
    assert.strictEqual(
      m[0].value,
      "a layer inside <div data-app-frame>: write it after the frame closes",
    );
  });
  it("layer-misplaced: a correctly placed aside layer, outside the frame, does not fire", () => {
    const body = ok.body + '<aside data-layer="panel" hidden>x</aside>';
    const f = checkDirect(Object.assign({}, ok, { body }));
    assert.ok(!f.some((x) => x.check === "layer-misplaced"));
  });
  it("new-undeclared and add-unplaced", () => {
    assert.ok(kinds({ meta: { adds: [] } }).includes("new-undeclared"));
    assert.ok(
      kinds({ body: ok.body.replace(' data-new="X"', "") }).includes(
        "add-unplaced",
      ),
    );
  });
  it("a data-new only app.js writes satisfies a declared add, and is never add-unplaced", () => {
    const appJs =
      ok.appJs + "\n" + "el.innerHTML = '<span data-new=\"Z\"></span>';";
    const body = ok.body.replace(' data-new="X"', "");
    const meta = { adds: [{ name: "Z", composedFrom: ["button"], why: "w" }] };
    const f = checkDirect(Object.assign({}, ok, { appJs, body, meta }));
    assert.ok(!f.some((x) => x.check === "add-unplaced"));
    assert.ok(!f.some((x) => x.check === "new-undeclared"));
  });
  it("a data-new only app.js writes and never declares reports new-undeclared against app.js, in each of the four spellings", () => {
    const spellings = [
      "el.innerHTML = '<span data-new=\"Z\"></span>';",
      "el.innerHTML = \"<span data-new='Z'></span>\";",
      "el.innerHTML = \"<span data-new=\\\"Z\\\"></span>\";",
      "el.innerHTML = '<span data-new=\\'Z\\'></span>';",
    ];
    spellings.forEach((line) => {
      const appJs = ok.appJs + "\n" + line;
      const body = ok.body.replace(' data-new="X"', "");
      const f = checkDirect(
        Object.assign({}, ok, { appJs, body, meta: { adds: [] } }),
      );
      const m = f.filter(
        (x) => x.check === "new-undeclared" && x.path === "app.js",
      );
      assert.strictEqual(m.length, 1, "spelling: " + line);
    });
  });
  it("unsafe-embed: a literal </style in extra.css would close the assembler's style element early", () => {
    const f = checkDirect(
      Object.assign({}, ok, {
        extraCss: ok.extraCss + "</style><script>alert(1)</script>",
      }),
    ).filter((x) => x.check === "unsafe-embed");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].severity, "error");
    assert.strictEqual(f[0].path, "extra.css");
  });
  it("unsafe-embed: a literal <!-- in app.js is left unescaped by the assembler", () => {
    const f = checkDirect(
      Object.assign({}, ok, { appJs: ok.appJs + "\n<!-- old browsers -->" }),
    ).filter((x) => x.check === "unsafe-embed");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].severity, "error");
    assert.strictEqual(f[0].path, "app.js");
  });
  it("step-mismatch: a regex literal's own character class does not confuse evaluation (review round 2)", () => {
    const appJs =
      'proto.steps = [{ id: "f-1", arrive: function () { var re = /[\\]]/; } }, ' +
      '{ id: "f-2", arrive: function () {} }];';
    assert.deepStrictEqual(checkDirect(Object.assign({}, ok, { appJs })), []);
  });
  it("step-mismatch: an inline array closed with a semicolon inside arrive() stays clean", () => {
    const appJs =
      'proto.steps = [{ id: "f-1", arrive: function () { var xs = [1, 2]; return xs; } }, ' +
      '{ id: "f-2", arrive: function () {} }];';
    assert.deepStrictEqual(checkDirect(Object.assign({}, ok, { appJs })), []);
  });
  it("step-mismatch: an id-shaped key inside arrive() is not read as the step id", () => {
    const appJs = ok.appJs.replace(
      "arrive: function () {}",
      'arrive: function () { id: "zzz"; }',
    );
    assert.deepStrictEqual(checkDirect(Object.assign({}, ok, { appJs })), []);
  });
  it("step-mismatch: steps built programmatically are read correctly, which no text scanner could do", () => {
    const appJs =
      'proto.steps = ["f-1", "f-2"].map(function (id) { return { id: id, arrive: function () {} }; });';
    assert.deepStrictEqual(checkDirect(Object.assign({}, ok, { appJs })), []);
  });
  it("step-mismatch: a genuinely reordered list is reported as an error", () => {
    const f = checkDirect(
      Object.assign({}, ok, {
        appJs: 'proto.steps = [{ id: "f-2" }, { id: "f-1" }];',
      }),
    );
    const m = f.filter((x) => x.check === "step-mismatch");
    assert.strictEqual(m.length, 1);
    assert.strictEqual(m[0].severity, "error");
  });
  it("step-mismatch: proto.steps never assigned is reported as an error", () => {
    const f = checkDirect(Object.assign({}, ok, { appJs: "var x = 1;" }));
    const m = f.filter((x) => x.check === "step-mismatch");
    assert.strictEqual(m.length, 1);
    assert.strictEqual(m[0].severity, "error");
  });
  it("steps-unread: a syntax error in app.js is exactly one warning, never also a step-mismatch", () => {
    const f = checkDirect(Object.assign({}, ok, { appJs: "function ( {" }));
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].check, "steps-unread");
    assert.strictEqual(f[0].severity, "warning");
    assert.strictEqual(f[0].path, "app.js");
  });
  it("steps-unread: an infinite loop at top level times out in about a second instead of hanging", () => {
    const start = Date.now();
    const f = checkDirect(Object.assign({}, ok, { appJs: "while (true) {}" }));
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 3000, "took " + elapsed + "ms");
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].check, "steps-unread");
    assert.strictEqual(f[0].severity, "warning");
  });
  it("steps-unread: a throwing getter on a step's id does not escape checkDirect as an exception (review round 3)", () => {
    const appJs = 'proto.steps = [{ get id() { throw new Error("boom"); } }];';
    let f;
    assert.doesNotThrow(() => {
      f = checkDirect(Object.assign({}, ok, { appJs }));
    });
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].check, "steps-unread");
    assert.strictEqual(f[0].severity, "warning");
    assert.strictEqual(f[0].path, "app.js");
  });
  it("step-mismatch: proto.steps set to a non-array value is reported, not a crash (review round 3)", () => {
    const f = checkDirect(
      Object.assign({}, ok, { appJs: 'proto.steps = "nope";' }),
    );
    assert.strictEqual(f.length, 1);
    assert.strictEqual(f[0].check, "step-mismatch");
    assert.strictEqual(f[0].severity, "error");
  });
  it("unknown-ds-class: a class named only inside a CSS comment is not defined (review finding 2)", () => {
    const found = kinds({
      css: css + "/* .ds-comment-only { color: red; } */",
      body: ok.body.replace(
        'class="ds-button"',
        'class="ds-button ds-comment-only"',
      ),
    });
    assert.ok(found.includes("unknown-ds-class"));
  });
  it("accepts single-quoted attributes the same as double-quoted (review minor)", () => {
    const body =
      "<div data-app-frame><button class='ds-button' data-new='X'>" +
      "<span data-icon='edit'></span></button></div>";
    assert.deepStrictEqual(checkDirect(Object.assign({}, ok, { body })), []);
  });
});

describe("check-direct: main() fails on one sentence, no stack (F8)", () => {
  function captureStderr(fn) {
    const orig = process.stderr.write;
    let out = "";
    process.stderr.write = (chunk) => {
      out += chunk;
      return true;
    };
    let code;
    try {
      code = fn();
    } finally {
      process.stderr.write = orig;
    }
    return { code, out };
  }

  function tempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), "check-direct-main-"));
  }

  it("a brief with no direct block prints one sentence and returns 1, as assemble-direct.js does", () => {
    const dir = tempDir();
    const briefPath = path.join(dir, "brief.json");
    fs.writeFileSync(briefPath, JSON.stringify({ screens: [] }));
    const { code, out } = captureStderr(() =>
      main([briefPath, "--author", dir]),
    );
    assert.strictEqual(code, 1);
    assert.ok(
      out.indexOf(
        "check-direct: " +
          briefPath +
          " has no direct block (run prepare-flow.js --direct)",
      ) !== -1,
    );
    assert.strictEqual(
      out.split("\n").filter(Boolean).length,
      1,
      "expected exactly one sentence, got: " + out,
    );
  });

  it("a missing brief file prints one sentence and returns 1, not a thrown stack", () => {
    const dir = tempDir();
    const missing = path.join(dir, "does-not-exist.json");
    const { code, out } = captureStderr(() => main([missing, "--author", dir]));
    assert.strictEqual(code, 1);
    assert.ok(out.indexOf("check-direct: ") === 0);
    assert.strictEqual(
      out.split("\n").filter(Boolean).length,
      1,
      "expected exactly one sentence, got: " + out,
    );
  });

  it("an unreadable (invalid JSON) brief file prints one sentence and returns 1, not a thrown stack", () => {
    const dir = tempDir();
    const briefPath = path.join(dir, "bad.json");
    fs.writeFileSync(briefPath, "{not json");
    const { code, out } = captureStderr(() =>
      main([briefPath, "--author", dir]),
    );
    assert.strictEqual(code, 1);
    assert.ok(out.indexOf("check-direct: ") === 0);
    assert.strictEqual(
      out.split("\n").filter(Boolean).length,
      1,
      "expected exactly one sentence, got: " + out,
    );
  });
});
