const { it } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const P = path.resolve(__dirname, "../../plugins/actian-design-system");
const { railGroups, headerProps, readApp } = require(path.join(P, "scripts/lib/app-record.js"));

const flat = [{ label: "Dashboard", id: "dashboard" }, { label: "Catalog", id: "catalog" }];
const full = [
  { label: "Dashboard", id: "dashboard", icon: "dashboard", group: "main" },
  { label: "Catalog", id: "catalog", icon: "catalog", group: "main" },
  { label: "Import", id: "import", group: "create", children: [{ label: "Select a file", id: "import-file" }] },
  { label: "New Item", id: "new-item", icon: "add", group: "create", kind: "action" },
  { label: "Analytics", id: "analytics", icon: "analytics", group: "admin", position: "bottom" },
];

it("an old flat record is one group, nothing at the bottom", () => {
  const g = railGroups(flat, "catalog");
  assert.equal(g.length, 1);
  assert.equal(g[0].bottom, false);
  assert.deepEqual(g[0].items.map((i) => i.label), ["Dashboard", "Catalog"]);
});
it("groups split where group changes; bottom items last", () => {
  const g = railGroups(full, "catalog");
  assert.deepEqual(g.map((x) => x.items.map((i) => i.label)), [["Dashboard", "Catalog"], ["Import", "New Item"], ["Analytics"]]);
  assert.deepEqual(g.map((x) => x.bottom), [false, false, true]);
});
it("keeps icon and kind; no icon stays absent", () => {
  const g = railGroups(full, "catalog");
  assert.equal(g[1].items[0].icon, undefined);
  assert.equal(g[1].items[1].kind, "action");
  assert.equal(g[0].items[0].icon, "dashboard");
});
it("children only while the parent or one of its children is active (contract amendment 2026-09-29)", () => {
  assert.equal(railGroups(full, "catalog")[1].items[0].children, undefined);
  assert.equal(railGroups(full, "import")[1].items[0].children[0].label, "Select a file");
  assert.equal(railGroups(full, "import-file")[1].items[0].children[0].label, "Select a file");
});
it("bottom items that are not consecutive still form one bottom block, in order", () => {
  const s = [{ label: "A", id: "a", position: "bottom" }, { label: "B", id: "b" }, { label: "C", id: "c", position: "bottom" }];
  const g = railGroups(s, null);
  assert.deepEqual(g.map((x) => [x.bottom, x.items.map((i) => i.label)]), [[false, ["B"]], [true, ["A", "C"]]]);
});
it("an empty or missing sidebar gives no groups", () => {
  assert.deepEqual(railGroups([], null), []);
  assert.deepEqual(railGroups(undefined, null), []);
});
it("header props only for fields present", () => {
  assert.deepEqual(headerProps({ type: "Studio" }), {});
  assert.deepEqual(headerProps(undefined), {});
  assert.deepEqual(
    headerProps({ type: "Studio", context: { label: "Catalog", value: "Default" }, search: { scope: "Default", placeholder: "Search your items..." } }),
    { Context: "Catalog", ContextValue: "Default", SearchScope: "Default", SearchPlaceholder: "Search your items..." },
  );
});
it("reads the vendored record of a real app, and null for an unknown one", () => {
  const a = readApp("studio");
  assert.ok(a && Array.isArray(a.sidebar) && a.sidebar.length > 0);
  assert.ok(a.sidebar.every((s) => s.label && s.id));
  assert.equal(readApp("nope"), null);
});

it("readApp: a missing snapshot is no record; a corrupt one is an error, never a silent skip", () => {
  const fs = require("fs"), os = require("os");
  const bad = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "rec-")), "app-context.json");
  assert.strictEqual(readApp("studio", bad), null);
  fs.writeFileSync(bad, "{ not json");
  assert.throws(() => readApp("studio", bad), /app-context/);
  fs.writeFileSync(bad, JSON.stringify({ apps: { studio: { sidebar: { label: "x" } } } }));
  assert.deepStrictEqual(readApp("studio", bad).sidebar, []);
});
