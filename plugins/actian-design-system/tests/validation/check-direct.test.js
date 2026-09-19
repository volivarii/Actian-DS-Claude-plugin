// tests/validation/check-direct.test.js
"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert");
const { checkDirect } = require("../../scripts/validation/check-direct.js");

const brief = { direct: { steps: [{ n: 1, id: "f-1" }, { n: 2, id: "f-2" }] } };
const css = ":root{--zen-a:1px}.ds-button{}.ds-button--primary{}";
const icons = { edit: { viewBox: "0 0 16 16", body: "" } };
const ok = {
  brief, css, icons,
  body: '<div data-app-frame><button class="ds-button" data-new="X"><span data-icon="edit"></span></button></div>',
  appJs: 'proto.steps = [{ id: "f-1", arrive: function () {} }, { id: "f-2", arrive: function () {} }];',
  extraCss: ".p{padding:var(--zen-a)}",
  meta: { adds: [{ name: "X", composedFrom: ["button"], why: "w" }] },
};
const kinds = (o) => checkDirect(Object.assign({}, ok, o)).map((f) => f.check);

describe("check-direct", () => {
  it("passes the clean fixture", () => assert.deepStrictEqual(checkDirect(ok), []));
  it("external-url", () => assert.ok(kinds({ body: ok.body + '<img src="https://x.y/a.png">' }).includes("external-url")));
  it("unfilled-token", () => assert.ok(kinds({ body: ok.body + "<p>{{count}}</p>" }).includes("unfilled-token")));
  it("unknown-icon", () => assert.ok(kinds({ body: ok.body.replace('"edit"', '"nope"') }).includes("unknown-icon")));
  it("unknown-token", () => assert.ok(kinds({ extraCss: ".p{color:var(--made-up)}" }).includes("unknown-token")));
  it("unknown-ds-class", () => assert.ok(kinds({ body: ok.body.replace("ds-button", "ds-buton") }).includes("unknown-ds-class")));
  it("raw-colour is a warning", () => {
    const f = checkDirect(Object.assign({}, ok, { extraCss: ".p{color:#ff0000}" })).filter((x) => x.check === "raw-colour");
    assert.strictEqual(f.length, 1); assert.strictEqual(f[0].severity, "warning");
  });
  it("frame-redrawn", () => assert.ok(kinds({ body: ok.body + '<nav class="ds-side-nav"></nav>' }).includes("frame-redrawn")));
  it("frame-missing", () => assert.ok(kinds({ body: "<p>x</p>" }).includes("frame-missing")));
  it("new-undeclared and add-unplaced", () => {
    assert.ok(kinds({ meta: { adds: [] } }).includes("new-undeclared"));
    assert.ok(kinds({ body: ok.body.replace(' data-new="X"', "") }).includes("add-unplaced"));
  });
  it("unsafe-embed: a literal </style in extra.css would close the assembler's style element early", () => {
    const f = checkDirect(
      Object.assign({}, ok, { extraCss: ok.extraCss + "</style><script>alert(1)</script>" }),
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
    const appJs = ok.appJs.replace("arrive: function () {}", 'arrive: function () { id: "zzz"; }');
    assert.deepStrictEqual(checkDirect(Object.assign({}, ok, { appJs })), []);
  });
  it("step-mismatch: steps built programmatically are read correctly, which no text scanner could do", () => {
    const appJs = 'proto.steps = ["f-1", "f-2"].map(function (id) { return { id: id, arrive: function () {} }; });';
    assert.deepStrictEqual(checkDirect(Object.assign({}, ok, { appJs })), []);
  });
  it("step-mismatch: a genuinely reordered list is reported as an error", () => {
    const f = checkDirect(Object.assign({}, ok, { appJs: 'proto.steps = [{ id: "f-2" }, { id: "f-1" }];' }));
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
  it("unknown-ds-class: a class named only inside a CSS comment is not defined (review finding 2)", () => {
    const found = kinds({
      css: css + "/* .ds-comment-only { color: red; } */",
      body: ok.body.replace('class="ds-button"', 'class="ds-button ds-comment-only"'),
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
