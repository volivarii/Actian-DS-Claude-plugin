#!/usr/bin/env node
"use strict";

var { describe, it } = require("node:test");
var assert = require("node:assert");
var path = require("path");

var PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
var resolver = require(
  path.join(PLUGIN_ROOT, "scripts", "lib", "a11y", "resolve-a11y.js"),
);

describe("resolve-a11y (real vendored substrate)", function () {
  it("resolves button to its specific + cross-cutting a11y (real WCAG + icon-only/aria-label rule)", function () {
    var res = resolver.resolveA11y(["button"]);
    var b = res.slugs["button"];
    assert.ok(b && b.resolved === true, "button should resolve");
    var sections = b.a11y.map(function (e) {
      return e.section;
    });
    assert.ok(
      sections.indexOf("buttons") !== -1,
      "expected the specific 'buttons' section",
    );
    assert.ok(
      sections.indexOf("focus-keyboard") !== -1,
      "expected cross-cutting 'focus-keyboard'",
    );
    var wcag = b.a11y.reduce(function (a, e) {
      return a.concat(e.wcag);
    }, []);
    ["2.1.1", "2.4.3", "2.4.7"].forEach(function (c) {
      assert.ok(wcag.indexOf(c) !== -1, "expected WCAG " + c);
    });
    var rules = b.a11y.reduce(function (a, e) {
      return a.concat(e.rules);
    }, []);
    assert.ok(
      rules.some(function (r) {
        return /icon-only/i.test(r) && /aria-label/i.test(r);
      }),
      "expected an icon-only + aria-label rule from buttons.json",
    );
  });

  it("marks a junk slug resolved:false with empty a11y", function () {
    var res = resolver.resolveA11y(["zeenea-logo"]);
    var z = res.slugs["zeenea-logo"];
    assert.ok(z && z.resolved === false, "zeenea-logo should not resolve");
    assert.strictEqual(z.a11y.length, 0);
  });

  it("resolves the representative real-component surface", function () {
    var slugs = [
      "button",
      "modal",
      "tabs",
      "tooltip",
      "radio-button",
      "toggle",
      "segmented-control",
      "side-nav",
      "breadcrumbs",
      "table",
      "search",
      "stepper",
      "notification",
      "popover",
      "calendar",
      "toolbar",
      "loader",
      "empty-state",
      "error-state",
      "input",
    ];
    var res = resolver.resolveA11y(slugs);
    var missing = slugs.filter(function (s) {
      return !res.slugs[s].resolved;
    });
    assert.deepStrictEqual(
      missing,
      [],
      "all representative slugs should resolve; missing: " + missing.join(","),
    );
  });

  it("is deterministic across calls", function () {
    var a = JSON.stringify(resolver.resolveA11y(["button", "modal"]));
    var b = JSON.stringify(resolver.resolveA11y(["button", "modal"]));
    assert.strictEqual(a, b);
  });

  it("flattens table blocks into rule strings (F-B)", function () {
    var res = resolver.resolveA11y(["button"]);
    var b = res.slugs["button"];
    var colorContrast = b.a11y.find(function (e) {
      return e.section === "color-contrast";
    });
    assert.ok(
      colorContrast,
      "button should reach color-contrast via category:action",
    );
    assert.ok(
      colorContrast.rules.some(function (r) {
        return /4\.5:1/.test(r);
      }),
      "expected a table-derived rule mentioning a 4.5:1 contrast ratio",
    );
  });

  it("keeps the substantive note when a section is reached via both direct + category edges (F-A)", function () {
    var res = resolver.resolveA11y(["table"]);
    var entry = res.slugs["table"].a11y.find(function (e) {
      return e.section === "data-tables";
    });
    assert.ok(entry, "table should have a data-tables entry");
    assert.ok(entry.note, "note should not be empty");
    assert.ok(
      /reflow|scroll|clip/i.test(entry.note),
      "expected the substantive category note, got: " +
        JSON.stringify(entry.note),
    );
  });

  it("drops contentless section entries but keeps the slug resolved (F-C)", function () {
    var res = resolver.resolveA11y(["input"]);
    var input = res.slugs["input"];
    assert.strictEqual(input.resolved, true, "input should still resolve");
    assert.ok(
      input.a11y.every(function (e) {
        return e.wcag.length || e.rules.length || e.note;
      }),
      "every entry should carry wcag, rules, or a note",
    );
    assert.ok(
      !input.a11y.some(function (e) {
        return e.section === "states";
      }),
      "the contentless 'states' section should not appear",
    );
  });
});

describe("resolve-a11y (injected seam)", function () {
  it("unions direct + category a11y_ref and dedups a shared section", function () {
    var graph = {
      nodes: [
        { id: "component:widget", type: "component", title: "widget" },
        { id: "component:gadget", type: "component", title: "gadget" },
        { id: "category:demo", type: "category", title: "demo" },
        {
          id: "a11y:buttons",
          type: "a11y_criterion",
          title: "Buttons",
          wcag: ["4.1.2"],
        },
        {
          id: "a11y:focus-keyboard",
          type: "a11y_criterion",
          title: "Focus",
          wcag: ["2.1.1"],
        },
      ],
      edges: [
        {
          type: "in_category",
          source: "component:widget",
          target: "category:demo",
        },
        {
          type: "in_category",
          source: "component:gadget",
          target: "category:demo",
        },
        {
          type: "a11y_ref",
          source: "component:widget",
          target: "a11y:buttons",
          note: "name it",
        },
        {
          type: "a11y_ref",
          source: "category:demo",
          target: "a11y:focus-keyboard",
          note: "focus ring",
        },
      ],
    };
    var bundle = {
      components: {
        buttons: {
          id: "components/buttons",
          body: "WCAG criteria: 4.1.2",
          blocks: [{ type: "list", items: ["Use a native button element."] }],
        },
      },
      "focus-keyboard": {
        id: "focus-keyboard",
        body: "WCAG criteria: 2.1.1",
        blocks: [
          { type: "list", items: ["Every control is keyboard reachable."] },
        ],
      },
    };
    var res = resolver.resolveA11y(["widget", "gadget"], {
      graph: graph,
      bundle: bundle,
    });
    var w = res.slugs["widget"];
    assert.strictEqual(w.resolved, true);
    var sections = w.a11y
      .map(function (e) {
        return e.section;
      })
      .sort();
    assert.deepStrictEqual(
      sections,
      ["buttons", "focus-keyboard"],
      "widget gets direct + category sections",
    );
    var buttonsEntry = w.a11y.find(function (e) {
      return e.section === "buttons";
    });
    assert.deepStrictEqual(buttonsEntry.wcag, ["4.1.2"]);
    assert.strictEqual(buttonsEntry.rules[0], "Use a native button element.");
    assert.strictEqual(buttonsEntry.note, "name it");
    var gSections = res.slugs["gadget"].a11y.map(function (e) {
      return e.section;
    });
    assert.deepStrictEqual(
      gSections,
      ["focus-keyboard"],
      "gadget gets only the category section",
    );
    assert.ok(res.categories["buttons"] && res.categories["focus-keyboard"]);
    assert.strictEqual(Object.keys(res.categories).length, 2);
  });

  it("parses wcag from body when the node lacks a wcag array", function () {
    var graph = {
      nodes: [
        { id: "component:x", type: "component" },
        { id: "a11y:forms", type: "a11y_criterion", title: "Forms" },
      ],
      edges: [
        {
          type: "a11y_ref",
          source: "component:x",
          target: "a11y:forms",
          note: "",
        },
      ],
    };
    var bundle = {
      components: {
        forms: { body: "WCAG criteria: 1.3.1, 3.3.2", blocks: [] },
      },
    };
    var res = resolver.resolveA11y(["x"], { graph: graph, bundle: bundle });
    assert.deepStrictEqual(res.slugs["x"].a11y[0].wcag, ["1.3.1", "3.3.2"]);
  });
});
