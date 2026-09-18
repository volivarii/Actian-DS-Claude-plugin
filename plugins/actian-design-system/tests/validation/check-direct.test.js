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
  it("step-mismatch", () => assert.ok(kinds({ appJs: 'proto.steps = [{ id: "f-2" }, { id: "f-1" }];' }).includes("step-mismatch")));
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
  it("step-mismatch: an inline array closed with a semicolon inside arrive() stays clean (review finding 1)", () => {
    const appJs =
      'proto.steps = [{ id: "f-1", arrive: function () { var xs = [1, 2]; return xs; } }, ' +
      '{ id: "f-2", arrive: function () {} }];';
    assert.deepStrictEqual(checkDirect(Object.assign({}, ok, { appJs })), []);
  });
  it("step-mismatch: an id-shaped key inside arrive() is not read as the step id", () => {
    const appJs = ok.appJs.replace("arrive: function () {}", 'arrive: function () { id: "zzz"; }');
    assert.deepStrictEqual(checkDirect(Object.assign({}, ok, { appJs })), []);
  });
  it("step-mismatch: a bracket inside a string inside arrive() does not break extraction", () => {
    const appJs = ok.appJs.replace("arrive: function () {}", 'arrive: function () { var s = "]"; }');
    assert.deepStrictEqual(checkDirect(Object.assign({}, ok, { appJs })), []);
  });
  it("step-mismatch: a genuinely reordered list is still reported", () => {
    assert.ok(kinds({ appJs: 'proto.steps = [{ id: "f-2" }, { id: "f-1" }];' }).includes("step-mismatch"));
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
