#!/usr/bin/env node
"use strict";
var { describe, it, test } = require("node:test");
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
var { renderAnatomy } = ar;

var GOOD = {
  slug: "x",
  quality: { ratio: 0.9 },
  root: {
    name: "root",
    kind: "container",
    id: "1:1",
    layout: {
      axis: "row",
      gap: "8px",
      padding: { top: "0px", right: "12px", bottom: "0px", left: "12px" },
      align: { main: "center", cross: "center" },
    },
    children: [
      { name: "label", kind: "text", id: "1:2" },
      { name: "icon", kind: "vector", id: "1:3" },
      { name: "chip", kind: "instance", id: "1:4" },
    ],
  },
};

var BINDINGS = {
  "1:1": [
    {
      property: "background-color",
      token: "--zen-color-bg-default",
      grade: "semantic",
    },
    { property: "padding", token: "--zen-spacing-sm", grade: "semantic" },
  ],
  "1:2": [
    {
      property: "font-family",
      token: "--zen-font-family-text",
      grade: "semantic",
    },
    { property: "color", token: "--zen-color-text-default", grade: "semantic" },
  ],
};

describe("anatomy-render", function () {
  var loader = function () {
    return GOOD;
  };
  it("renders a container with flex layout + nested text/vector parts", function () {
    var html = renderAnatomy("x", { loader: loader });
    assert.ok(html.indexOf("ds-anatomy") !== -1);
    assert.ok(
      html.indexOf("display:flex") !== -1 &&
        html.indexOf("flex-direction:row") !== -1,
    );
    assert.ok(
      html.indexOf("gap:8px") !== -1 &&
        html.indexOf("padding:0px 12px 0px 12px") !== -1,
    );
    assert.ok(
      html.indexOf("ds-anatomy__text") !== -1 &&
        html.indexOf("ds-anatomy__vector") !== -1,
    );
  });
  it("returns null when ratio < minRatio", function () {
    assert.strictEqual(
      renderAnatomy("x", {
        loader: function () {
          return { quality: { ratio: 0.4 }, root: GOOD.root };
        },
      }),
      null,
    );
  });
  it("returns null when missing/no root", function () {
    assert.strictEqual(
      renderAnatomy("x", {
        loader: function () {
          return null;
        },
      }),
      null,
    );
    assert.strictEqual(
      renderAnatomy("x", {
        loader: function () {
          return { quality: { ratio: 0.9 } };
        },
      }),
      null,
    );
  });
  it("escapes text content (XSS-safe)", function () {
    var html = renderAnatomy("x", {
      loader: function () {
        return {
          quality: { ratio: 0.9 },
          root: { kind: "text", text: "<script>" },
        };
      },
    });
    assert.ok(
      html.indexOf("<script>") === -1 && html.indexOf("&lt;script&gt;") !== -1,
    );
  });
  it("is deterministic", function () {
    assert.strictEqual(
      renderAnatomy("x", { loader: loader }),
      renderAnatomy("x", { loader: loader }),
    );
  });
  it("joins sidecar bindings by node id: container facts append after structural style", function () {
    var html = renderAnatomy("x", {
      loader: loader,
      bindingsLoader: function () {
        return { byNodeId: BINDINGS };
      },
    });
    assert.ok(
      html.indexOf("background-color:var(--zen-color-bg-default)") !== -1,
      "root node should carry the background-color token fact",
    );
    var structural = html.indexOf("padding:0px 12px 0px 12px");
    var fact = html.indexOf("padding:var(--zen-spacing-sm)");
    assert.ok(structural !== -1 && fact !== -1, "both paddings present");
    assert.ok(
      structural < fact,
      "token fact must come after the structural declaration so it wins the cascade",
    );
  });
  it("joins text-node bindings (font facts) onto the span", function () {
    var html = renderAnatomy("x", {
      loader: loader,
      bindingsLoader: function () {
        return { byNodeId: BINDINGS };
      },
    });
    var span = html.match(/<span[^>]*>/);
    assert.ok(span, "text span present");
    assert.ok(
      span[0].indexOf("font-family:var(--zen-font-family-text)") !== -1 &&
        span[0].indexOf("color:var(--zen-color-text-default)") !== -1,
      "text span should carry font-family + color token facts",
    );
  });
  it("leaves nodes without a sidecar entry untouched (instance stays token-free)", function () {
    var html = renderAnatomy("x", {
      loader: loader,
      bindingsLoader: function () {
        return { byNodeId: BINDINGS };
      },
    });
    var instance = html.match(/<div class="ds-anatomy__instance"[^>]*>/);
    assert.ok(instance, "instance div present");
    assert.ok(
      instance[0].indexOf("var(") === -1,
      "instance node (excluded from harvest) must carry no token fact",
    );
  });
  it("skips malformed bindings (property/token shape guards)", function () {
    var html = renderAnatomy("x", {
      loader: loader,
      bindingsLoader: function () {
        return {
          byNodeId: {
            "1:1": [
              { property: "background;evil", token: "--zen-color-bg-default" },
              { property: "color", token: "red" },
              { property: "color", token: "--zen-color-text-default" },
            ],
          },
        };
      },
    });
    assert.ok(html.indexOf("evil") === -1, "malformed property dropped");
    assert.ok(html.indexOf("var(red)") === -1, "non --zen token dropped");
    assert.ok(
      html.indexOf("color:var(--zen-color-text-default)") !== -1,
      "well-formed sibling binding still emitted",
    );
  });
  it("stays neutral when no sidecar exists (text span keeps no style attr)", function () {
    var html = renderAnatomy("x", {
      loader: loader,
      bindingsLoader: function () {
        return null;
      },
    });
    assert.ok(html.indexOf("var(") === -1, "no token facts without a sidecar");
    var span = html.match(/<span[^>]*>/);
    assert.ok(
      span && span[0].indexOf("style=") === -1,
      "text span should have no style attribute without bindings",
    );
  });
});

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

test("renderAnatomy: opts.variant selects the scoped token in the output", () => {
  const anatomy = {
    quality: { ratio: 1 },
    root: { id: "n1", kind: "container", layout: {}, children: [] },
  };
  const bindings = {
    variantDefaults: { Color: "Default" },
    byNodeId: {
      n1: [
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
      ],
    },
  };
  const html = ar.renderAnatomy("tag-default", {
    loader: () => anatomy,
    bindingsLoader: () => bindings,
    variant: { Color: "Pink" },
  });
  assert.ok(
    html.includes("background-color:var(--zen-pink)"),
    "renders the Pink token",
  );
  assert.ok(
    !html.includes("--zen-default"),
    "does not also emit the Default token",
  );
});

test("renderAnatomy: without opts.variant, output is unchanged (all decls)", () => {
  const anatomy = {
    quality: { ratio: 1 },
    root: { id: "n1", kind: "container", layout: {}, children: [] },
  };
  const bindings = {
    variantDefaults: { Color: "Default" },
    byNodeId: {
      n1: [
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
      ],
    },
  };
  const html = ar.renderAnatomy("tag-default", {
    loader: () => anatomy,
    bindingsLoader: () => bindings,
  });
  assert.ok(
    html.includes("--zen-default") && html.includes("--zen-pink"),
    "emits both (current behavior)",
  );
});
