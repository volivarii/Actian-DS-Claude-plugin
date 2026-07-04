#!/usr/bin/env node
"use strict";
// anatomy-render.js — Group C retired the slug→html tree renderer
// (renderAnatomy/renderNode/tokenDecls, "path c"); it's superseded by
// appearance-render.js's captured-appearance renderer (Phase 1B). This file
// now only exercises the surviving token-injection join mechanism
// (resolveTokenDecls, resolveRootTokenStyle) that path b still depends on.
var { test } = require("node:test");
var assert = require("node:assert");
var path = require("path");
var ar = require(
  path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "renderers",
    "anatomy-render.js",
  ),
);

test("resolveTokenDecls: no target variant returns all valid decls in order", () => {
  const list = [
    {
      property: "background-color",
      token: "--zen-a",
      variant: { prop: "Color", values: ["Default"] },
    },
    {
      property: "background-color",
      token: "--zen-b",
      variant: { prop: "Color", values: ["Pink"] },
    },
  ];
  assert.deepStrictEqual(ar.resolveTokenDecls(list, null, null), [
    "background-color:var(--zen-a)",
    "background-color:var(--zen-b)",
  ]);
});

test("resolveTokenDecls: target variant picks the scoped match, one per property", () => {
  const list = [
    {
      property: "background-color",
      token: "--zen-default",
      variant: { prop: "Color", values: ["Default"] },
    },
    {
      property: "background-color",
      token: "--zen-pink",
      variant: { prop: "Color", values: ["Pink"] },
    },
    {
      property: "border-color",
      token: "--zen-border-pink",
      variant: { prop: "Color", values: ["Pink"] },
    },
  ];
  assert.deepStrictEqual(
    ar.resolveTokenDecls(list, { Color: "Pink" }, { Color: "Default" }),
    ["background-color:var(--zen-pink)", "border-color:var(--zen-border-pink)"],
  );
});

test("resolveTokenDecls: unknown target value falls back to variantDefaults binding", () => {
  const list = [
    {
      property: "background-color",
      token: "--zen-default",
      variant: { prop: "Color", values: ["Default"] },
    },
    {
      property: "background-color",
      token: "--zen-pink",
      variant: { prop: "Color", values: ["Pink"] },
    },
  ];
  assert.deepStrictEqual(
    ar.resolveTokenDecls(list, { Color: "Nonexistent" }, { Color: "Default" }),
    ["background-color:var(--zen-default)"],
  );
});

test("resolveTokenDecls: unscoped binding is always kept under a target variant", () => {
  const list = [
    { property: "padding", token: "--zen-spacing-sm" },
    {
      property: "background-color",
      token: "--zen-pink",
      variant: { prop: "Color", values: ["Pink"] },
    },
  ];
  assert.deepStrictEqual(
    ar.resolveTokenDecls(list, { Color: "Pink" }, { Color: "Default" }),
    ["padding:var(--zen-spacing-sm)", "background-color:var(--zen-pink)"],
  );
});

test("resolveTokenDecls: invalid property/token entries are dropped", () => {
  const list = [
    { property: "content!", token: "--zen-x" }, // property not in PROP_RE
    { property: "padding", token: "red" }, // token not in TOKEN_RE
    { property: "padding", token: "--zen-spacing-sm" },
  ];
  assert.deepStrictEqual(ar.resolveTokenDecls(list, null, null), [
    "padding:var(--zen-spacing-sm)",
  ]);
});

test("resolveRootTokenStyle: returns the root node's variant-resolved decls string", () => {
  const anatomy = {
    quality: { ratio: 1 },
    root: { id: "r", kind: "container" },
  };
  const bindings = {
    variantDefaults: { Color: "Default" },
    byNodeId: {
      r: [
        {
          property: "background-color",
          token: "--zen-pink",
          variant: { prop: "Color", values: ["Pink"] },
        },
        {
          property: "background-color",
          token: "--zen-default",
          variant: { prop: "Color", values: ["Default"] },
        },
      ],
    },
  };
  const style = ar.resolveRootTokenStyle("tag-default", {
    variant: { Color: "Pink" },
    loader: () => anatomy,
    bindingsLoader: () => bindings,
  });
  assert.strictEqual(style, "background-color:var(--zen-pink)");
});
test("resolveRootTokenStyle: returns '' when anatomy quality is below minRatio", () => {
  const anatomy = { quality: { ratio: 0.1 }, root: { id: "r" } };
  assert.strictEqual(
    ar.resolveRootTokenStyle("x", {
      loader: () => anatomy,
      bindingsLoader: () => ({ byNodeId: {} }),
    }),
    "",
  );
});
