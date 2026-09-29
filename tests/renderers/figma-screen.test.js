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
  it("defaults the library to ds", () => {
    const s = screen([]);
    prepareScreen(s, { tokensCss: CSS });
    assert.equal(s.library, undefined); // input not mutated
  });
});
