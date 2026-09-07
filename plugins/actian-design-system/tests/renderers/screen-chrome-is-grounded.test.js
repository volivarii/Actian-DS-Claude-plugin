#!/usr/bin/env node
"use strict";

/**
 * screen-chrome-is-grounded.test.js
 *
 * Every generated screen used to render the same four navigation items, in
 * every app: "Catalog, Pipelines, Connections, Settings". They are the side-nav
 * leaf's own specimen default and they belong to no Actian product. Studio's
 * real navigation is seven items and does not include Pipelines,
 * Administration's is eight, and Explorer is on record as having no rail.
 *
 * The chain that produced it: ds-screen-tree kept its own hardcoded
 * TEMPLATE_CHROME and never read app-context, screenTree defaulted the sidebar
 * config to the NUMBER 6, chromeNodes tested Array.isArray on it and set
 * nothing, and the leaf substituted its default for the empty props. Nothing
 * errored at any step.
 *
 * This guard asserts the JOIN, on the real render path, in both directions:
 *
 *   1. the rendered rail carries the app's OWN labels, read from app-context
 *      rather than typed here, so this file cannot drift from the substrate;
 *   2. it does NOT carry the leaf's default.
 *
 * Both halves are needed. (1) alone passes if the leaf's default happened to
 * contain the label being looked for ("Catalog" is in both Studio's list and
 * the default, which is exactly how this went unnoticed). (2) alone passes if
 * the rail stopped rendering altogether.
 *
 * 🔑 The injection is what makes this work, and it is easy to lose: it lives in
 * scripts/lib/renderer.js and is armed by requiring that module. If someone
 * removes it, chromeNodes silently falls back to the leaf default again. That
 * is why this test drives the real modules rather than calling setAppContext
 * itself: a test that injects its own context would pass while production
 * shipped the four invented items.
 */

var { describe, it } = require("node:test");
var assert = require("node:assert");
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..", "..");
var PATHS = require(path.join(ROOT, "scripts", "lib", "paths.js"));

// Requiring lib/renderer.js is what arms the injection. Ordering matters and is
// the point: this is the production entry point, not a test fixture.
require(path.join(ROOT, "scripts", "lib", "renderer.js"));

var screenTree = require(
  path.join(ROOT, "scripts", "renderers", "html-renderers", "ds-screen-tree.js"),
);
var dsHtmlMap = require(
  path.join(
    ROOT, "vendor", "components", "render", "renderer",
    "html-renderers", "ds-html-map.js",
  ),
);

// The leaf's specimen default, quoted from the renderer it lives in
// (ds-html-map.js, the Items-mode branch). Named here so the assertion says
// what it is rather than testing an anonymous string.
var LEAF_DEFAULT = ["Catalog", "Pipelines", "Connections", "Settings"];

var appContext = JSON.parse(fs.readFileSync(PATHS.appContext, "utf8"));

function labelsFor(appKey) {
  var app = appContext.apps[appKey];
  return (app.sidebar || []).map(function (e) {
    return e.label;
  });
}

// Render a screen's rail through the real chrome builder + the real leaf.
function renderRail(template) {
  var chrome = screenTree.resolveChrome({ template: template });
  if (!chrome.hasSidebar) return null;
  var nodes = screenTree.chromeNodes(
    chrome,
    { items: 6, activeItem: null }, // the default screenTree() itself passes
    null,
    null,
  );
  var html = dsHtmlMap.renderDSComponent({
    dsSlug: "side-nav",
    name: "Side nav",
    props: nodes.sidebar.props,
  });
  return (html.match(/ds-sidenav__label">[^<]*/g) || []).map(function (s) {
    return s.split(">")[1];
  });
}

describe("generated screen chrome is grounded in app-context", function () {
  it("fixture sanity: app-context declares distinct navigation per app", function () {
    var studio = labelsFor("studio");
    var admin = labelsFor("administration");
    assert.ok(
      studio.length > 0 && admin.length > 0,
      "app-context has no sidebar entries for studio/administration, so every " +
        "assertion below would be vacuous. Check the vendored app-context " +
        "rather than deleting this test.",
    );
    assert.notDeepEqual(
      studio,
      LEAF_DEFAULT,
      "fixture sanity: Studio's real navigation must differ from the leaf's " +
        "default, or this file cannot tell a grounded rail from an ungrounded " +
        "one.",
    );
  });

  it("Studio renders Studio's own navigation, not the leaf default", function () {
    var rendered = renderRail("studio");
    assert.deepEqual(
      rendered,
      labelsFor("studio"),
      "The Studio rail must carry app-context's labels. Expected the " +
        "substrate's list; got " + JSON.stringify(rendered) + ". If this is " +
        "the leaf's four-item default, the app-context injection in " +
        "scripts/lib/renderer.js is not reaching ds-screen-tree.",
    );
  });

  it("Administration renders its own navigation, under either template name", function () {
    var expected = labelsFor("administration");
    assert.deepEqual(renderRail("admin"), expected);
    assert.deepEqual(
      renderRail("administration"),
      expected,
      "`administration` was never in TEMPLATE_CHROME, only `admin`, so a " +
        "screen authored with the app's full name fell through to no chrome " +
        "at all. It must resolve to the same rail as `admin`.",
    );
  });

  it("no app renders the leaf's specimen default", function () {
    var offenders = [];
    ["studio", "explorer", "admin", "administration"].forEach(function (tpl) {
      var rendered = renderRail(tpl);
      if (rendered && JSON.stringify(rendered) === JSON.stringify(LEAF_DEFAULT)) {
        offenders.push(tpl);
      }
    });
    assert.deepEqual(
      offenders,
      [],
      "These templates render " + JSON.stringify(LEAF_DEFAULT) + ", which is " +
        "the side-nav leaf's own specimen content and is not any Actian " +
        "product's navigation.",
    );
  });

  it("an authored sidebar wins over app-context, on every app", function () {
    // Found by this change breaking the explorer HTML golden, which authors two
    // items of its own and had its rail suppressed. app-context is the DEFAULT
    // for a screen that says nothing about its navigation, never an override of
    // one that does. Asserted on Explorer specifically because that is the app
    // whose app-context record is empty, so it is the only place the two can
    // disagree today.
    var authored = screenTree.resolveChrome({
      template: "explorer",
      sidebar: { items: [{ label: "Marketplace" }, { label: "My requests" }] },
    });
    assert.equal(
      authored.hasSidebar,
      true,
      "A screen that authors sidebar items must render them even where " +
        "app-context records no standing rail.",
    );

    var nodes = screenTree.chromeNodes(
      authored,
      { items: [{ label: "Marketplace" }, { label: "My requests" }] },
      null,
      null,
    );
    var html = dsHtmlMap.renderDSComponent({
      dsSlug: "side-nav",
      name: "Side nav",
      props: nodes.sidebar.props,
    });
    var labels = (html.match(/ds-sidenav__label">[^<]*/g) || []).map(
      function (x) {
        return x.split(">")[1];
      },
    );
    assert.deepEqual(
      labels,
      ["Marketplace", "My requests"],
      "The authored labels must reach the markup, not just flip hasSidebar.",
    );
  });

  it("Explorer renders no rail, because app-context records none", function () {
    // Deliberately asserted rather than left implicit: `sidebar: []` for
    // Explorer is an explicit empty array in app-context/src/apps/explorer.md,
    // next to two apps whose lists are fully populated, so it reads as a
    // statement rather than an unfilled field. If Explorer turns out to have a
    // rail, the fix is to author it in app-context and this test follows.
    assert.deepEqual(
      appContext.apps.explorer.sidebar,
      [],
      "fixture sanity: this test encodes Explorer having no sidebar entries.",
    );
    assert.equal(
      screenTree.resolveChrome({ template: "explorer" }).hasSidebar,
      false,
      "Explorer must not render a rail while app-context records none. It " +
        "previously rendered one, filled with Studio's items.",
    );
  });
});
