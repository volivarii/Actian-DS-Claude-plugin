const { describe, it } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const P = path.resolve(__dirname, "../../plugins/actian-design-system");
const { prepareScreen } = require(path.join(P, "scripts/renderers/figma-screen.js"));

const CSS = ":root{--zen-a:#112233;--zen-b:var(--zen-a);--zen-font-family-text:Roboto;}";
const screen = (content) => ({ id: "s1", name: "S1", template: "list", content });

describe("prepareScreen", () => {
  it("returns one object, not an array", () => {
    const { tree } = prepareScreen(screen([]), { tokensCss: CSS });
    assert.equal(Array.isArray(tree), false);
    assert.equal(tree.type, "FRAME");
  });
  it("drops slot, focus and goto at every depth", () => {
    const { tree } = prepareScreen(screen([{ type: "TEXT", text: "Hi", slot: "a", focus: true, goto: "s2", children: [] }]), { tokensCss: CSS });
    const s = JSON.stringify(tree);
    assert.ok(!/"slot"|"focus"|"goto"/.test(s));
  });
  it("resolves var() through nested tokens to hex", () => {
    const { tree } = prepareScreen(screen([{ type: "FRAME", fills: ["var(--zen-b)"], children: [] }]), { tokensCss: CSS });
    assert.ok(JSON.stringify(tree).includes("#112233"));
  });
  it("uses the fallback of an unknown token", () => {
    const { tree, unresolved } = prepareScreen(screen([{ type: "FRAME", fills: ["var(--zen-x, #ffffff)"], children: [] }]), { tokensCss: CSS });
    assert.ok(JSON.stringify(tree).includes("#ffffff"));
    assert.deepEqual(unresolved, []);
  });
  it("reports an unknown token with no fallback instead of passing var() on", () => {
    const { unresolved } = prepareScreen(screen([{ type: "FRAME", fills: ["var(--zen-x)"], children: [] }]), { tokensCss: CSS });
    assert.deepEqual(unresolved, ["--zen-x"]);
  });
  it("resolves a var() fallback that is itself a var()", () => {
    const { tree, unresolved } = prepareScreen(screen([{ type: "FRAME", fills: ["var(--zen-x, var(--zen-a))"], children: [] }]), { tokensCss: CSS });
    assert.ok(JSON.stringify(tree).includes('"#112233"'));
    assert.deepEqual(unresolved, []);
  });
  it("reports the unknown token inside a nested fallback", () => {
    const { unresolved } = prepareScreen(screen([{ type: "FRAME", fills: ["var(--zen-x, var(--zen-nope))"], children: [] }]), { tokensCss: CSS });
    assert.ok(unresolved.includes("--zen-nope"), JSON.stringify(unresolved));
  });
  it("keeps a fallback's own parentheses out of the result", () => {
    const { tree } = prepareScreen(screen([{ type: "FRAME", fills: ["var(--zen-a, rgb(0 0 0))"], children: [] }]), { tokensCss: CSS });
    assert.ok(JSON.stringify(tree).includes('"#112233"'));
    assert.ok(!JSON.stringify(tree).includes("#112233)"));
  });
  it("turns a px token into a number", () => {
    const { tree } = prepareScreen(screen([{ type: "FRAME", layout: { mode: "VERTICAL", spacing: "var(--zen-s)", padding: "var(--zen-s)" }, children: [] }]), { tokensCss: CSS + ":root{--zen-s:24px}" });
    const s = JSON.stringify(tree);
    assert.ok(s.includes('"spacing":24'), s.slice(0, 400));
    assert.ok(!s.includes('"24px"'));
  });
  it("reports a colour field whose token is not a colour", () => {
    const { unresolved } = prepareScreen(screen([{ type: "FRAME", fills: ["var(--zen-s)"], children: [] }]), { tokensCss: CSS + ":root{--zen-s:24px}" });
    assert.ok(unresolved.some((u) => /--zen-s|24/.test(u)), JSON.stringify(unresolved));
  });
  it("reads a stroke's colour as a colour and its weight as a number", () => {
    const { tree, unresolved } = prepareScreen(screen([{ type: "FRAME", stroke: { color: "var(--zen-a)", weight: "var(--zen-w)" }, children: [] }]), { tokensCss: CSS + ":root{--zen-w:1px}" });
    assert.deepEqual(unresolved, []);
    assert.ok(JSON.stringify(tree).includes('"stroke":{"color":"#112233","weight":1}'));
  });
  it("uses the screen's app theme over the base tokens", () => {
    const css = ':root,[data-theme="actian"]{--zen-c:#111111}[data-theme="studio"]{--zen-c:#222222}';
    const node = [{ type: "FRAME", fills: ["var(--zen-c)"], children: [] }];
    assert.ok(JSON.stringify(prepareScreen({ id: "s", name: "S", template: "studio", content: node }, { tokensCss: css }).tree).includes("#222222"));
    assert.ok(JSON.stringify(prepareScreen({ id: "s", name: "S", template: "administration", content: node }, { tokensCss: css }).tree).includes("#111111"));
  });
  it("lifts a top-level absolute layer to the screen frame, so x and y are screen coordinates", () => {
    const { tree } = prepareScreen(screen([{ type: "FRAME", name: "list", children: [] }, { type: "FRAME", name: "drawer", positioning: "absolute", x: 890, y: 0, children: [] }]), { tokensCss: CSS });
    assert.ok(tree.children.some((c) => c.name === "drawer"), "the layer is not a child of the screen frame");
    const inner = JSON.stringify(tree.children.filter((c) => c.name !== "drawer"));
    assert.ok(!inner.includes('"drawer"'), "the layer is still inside the content area");
    assert.ok(inner.includes('"list"'));
  });
  it("draws the rail from the app context it is given", () => {
    const appContext = { apps: { studio: { sidebar: [{ label: "Zeta dashboard", id: "z" }] } } };
    const { tree } = prepareScreen({ id: "s", name: "S", template: "studio", content: [] }, { tokensCss: CSS, appContext });
    assert.ok(JSON.stringify(tree).includes("Zeta dashboard"));
  });
  it("defaults the library to ds", () => {
    const s = screen([]);
    prepareScreen(s, { tokensCss: CSS });
    assert.equal(s.library, undefined); // input not mutated
  });
});

describe("prepareScreen: second review (code-review high, #426)", () => {
  it("drops the authored adds key the emitter refuses", () => {
    const { tree } = prepareScreen(screen([{ type: "FRAME", adds: ["x"], children: [] }]), { tokensCss: CSS });
    assert.ok(!JSON.stringify(tree).includes('"adds"'));
  });
  it("reports a five- or seven-digit hex as not a colour", () => {
    const { unresolved } = prepareScreen(screen([{ type: "FRAME", fills: ["var(--zen-h)"], children: [] }]), { tokensCss: CSS + ":root{--zen-h:#12345}" });
    assert.ok(unresolved.length === 1, JSON.stringify(unresolved));
  });
  it("reads a font token as its first family", () => {
    const { tree, unresolved } = prepareScreen(screen([{ type: "TEXT", content: "Hi", font: "var(--zen-f):Bold" }]), { tokensCss: CSS + ':root{--zen-f:"Roboto", sans-serif}' });
    assert.deepEqual(unresolved, []);
    assert.ok(JSON.stringify(tree).includes('"font":"Roboto:Bold"'), JSON.stringify(tree).slice(-300));
  });
  it("reports a letter-spacing or line-height token the emitter cannot take", () => {
    const { unresolved } = prepareScreen(screen([{ type: "TEXT", content: "Hi", letterSpacing: "var(--zen-ls)" }]), { tokensCss: CSS + ":root{--zen-ls:0.1}" });
    assert.ok(unresolved.some((u) => /letterSpacing/.test(u)), JSON.stringify(unresolved));
  });
  it("reports each bad token once", () => {
    const n = { type: "FRAME", fills: ["var(--zen-s)"], children: [] };
    const { unresolved } = prepareScreen(screen([n, n]), { tokensCss: CSS + ":root{--zen-s:24px}" });
    assert.strictEqual(unresolved.length, 1);
  });
});

describe("prepareScreen: round two (code-review high, #426)", () => {
  const fs = require("fs");
  const dsTree = require(path.join(P, "scripts/renderers/html-renderers/ds-screen-tree.js"));
  const PATHS = require(path.join(P, "scripts/lib/paths.js"));
  const ctx = JSON.parse(fs.readFileSync(PATHS.appContext, "utf8"));
  it("leaves the process's app context as it found it", () => {
    dsTree.setAppContext(ctx);
    const before = JSON.stringify(dsTree.screenTree({ template: "studio" }));
    prepareScreen(screen([]), { tokensCss: CSS, appContext: { apps: {} } });
    assert.strictEqual(JSON.stringify(dsTree.screenTree({ template: "studio" })), before);
    dsTree.setAppContext(null);
  });
  it("uses the loaded app context when none is passed", () => {
    dsTree.setAppContext(ctx);
    const withCtx = JSON.stringify(prepareScreen({ id: "s", name: "S", template: "studio", content: [] }, { tokensCss: CSS, appContext: ctx }).tree);
    const without = JSON.stringify(prepareScreen({ id: "s", name: "S", template: "studio", content: [] }, { tokensCss: CSS }).tree);
    assert.strictEqual(without, withCtx);
    dsTree.setAppContext(null);
  });
  it("reads a font weight token as a Figma style name", () => {
    const { tree, unresolved } = prepareScreen(screen([{ type: "TEXT", content: "Hi", font: "var(--zen-font-family-text):var(--zen-w)" }]), { tokensCss: CSS + ":root{--zen-w:700}" });
    assert.deepEqual(unresolved, []);
    assert.ok(JSON.stringify(tree).includes('"font":"Roboto:Bold"'));
  });
  it("reports a font weight no Figma style has", () => {
    const { unresolved } = prepareScreen(screen([{ type: "TEXT", content: "Hi", font: "Roboto:var(--zen-w)" }]), { tokensCss: CSS + ":root{--zen-w:650}" });
    assert.strictEqual(unresolved.length, 1, JSON.stringify(unresolved));
  });
  it("CLI: a missing screen file gives the ok:false JSON, not a stack trace", () => {
    const cp = require("child_process");
    const r = cp.spawnSync(process.execPath, [path.join(P, "scripts/renderers/figma-screen.js"), "/nope/screen.json", "--parent-id", "1:2"], { encoding: "utf8" });
    assert.strictEqual(r.status, 1);
    const j = JSON.parse(r.stderr.trim());
    assert.strictEqual(j.ok, false);
    assert.ok(j.errors[0].message.length > 0);
  });
});
