// tests/renderers/ds-screen-tree.test.js
// TDD for ds-screen-tree.js (Task 2a).
//
// Phase RED: the module does not exist yet — require() throws MODULE_NOT_FOUND.
// Phase GREEN: all assertions pass after the module is created and
//              flow-renderer.js is refactored to consume it.
//
// Test plan:
//   (1) appProfile()  — maps header type to { theme, headerApp, navApp }
//   (2) resolveChrome() — derives chrome config from screen object
//   (3) chromeNodes() — returns { header, sidebar, pageHeader } DS INSTANCE nodes
//   (4) screenTree()  — returns a FRAME tree matching the task-2 brief shape
//   (5) HTML golden   — byte-identical to pre-refactor output after refactor
//
// node:test style; run via: node --test tests/renderers/ds-screen-tree.test.js

"use strict";

var test = require("node:test");
var assert = require("node:assert/strict");
var fs = require("fs");
var path = require("path");

// ---------------------------------------------------------------------------
// Load the module under test
// ---------------------------------------------------------------------------

var chromeTree = require("../../scripts/renderers/html-renderers/ds-screen-tree.js");

// ---------------------------------------------------------------------------
// Golden fixture + its regeneration seam
// ---------------------------------------------------------------------------
// The golden embeds inline SVG geometry from the vendored icons.json, so a
// Figma glyph redraw legitimately invalidates it (a true signal, not a
// regression). Without a regen path the only remediation was hand-editing
// 25 KB of JSON, which is how this fixture jammed the vendor refresh queue for
// three days in July 2026. Mirrors the seam in golden-snapshot.test.js.

var GOLDEN_PATH = path.join(__dirname, "fixtures/ds-screen-chrome-golden.json");

// Read from process.env at call time rather than caching at module load, so the
// seam's own test can exercise both branches in one run.
function readGolden() {
  return JSON.parse(fs.readFileSync(GOLDEN_PATH, "utf8"));
}

function assertGolden(key, actual) {
  if (process.env.UPDATE_GOLDENS === "1") {
    var current = readGolden();
    current[key] = actual;
    // No trailing newline: matches how the fixture was originally captured, so
    // a regeneration diff is confined to what actually changed rather than
    // reformatting the whole file.
    fs.writeFileSync(GOLDEN_PATH, JSON.stringify(current, null, 2));
    return;
  }
  assert.equal(
    actual,
    readGolden()[key],
    key +
      " golden byte-identical (if a Figma glyph changed, re-capture with " +
      "`npm run update-snapshots` and review the diff)",
  );
}

// ---------------------------------------------------------------------------
// (1) appProfile()
// ---------------------------------------------------------------------------

test("appProfile — Studio", function () {
  var p = chromeTree.appProfile("Studio");
  assert.equal(p.theme, "studio");
  assert.equal(p.headerApp, "Studio");
  assert.equal(p.navApp, "Studio");
});

test("appProfile — Explorer", function () {
  var p = chromeTree.appProfile("Explorer");
  assert.equal(p.theme, "explorer");
  assert.equal(p.headerApp, "Explorer");
  assert.equal(p.navApp, "Studio");
});

test("appProfile — Administration", function () {
  var p = chromeTree.appProfile("Administration");
  assert.equal(p.theme, "actian");
  assert.equal(p.headerApp, "Admin");
  assert.equal(p.navApp, "Admin");
});

test("appProfile — Admin alias", function () {
  var p = chromeTree.appProfile("Admin");
  assert.equal(p.theme, "actian");
  assert.equal(p.headerApp, "Admin");
  assert.equal(p.navApp, "Admin");
});

test("appProfile — unknown falls back to Studio chrome", function () {
  var p = chromeTree.appProfile(null);
  assert.equal(p.theme, "actian");
  assert.equal(p.headerApp, "Studio");
  assert.equal(p.navApp, "Studio");
});

// ---------------------------------------------------------------------------
// (2) resolveChrome()
// ---------------------------------------------------------------------------

test("resolveChrome — studio template", function () {
  var c = chromeTree.resolveChrome({ template: "studio" });
  assert.equal(c.appHeaderType, "Studio");
  assert.equal(c.hasSidebar, true);
});

test("resolveChrome — admin template", function () {
  var c = chromeTree.resolveChrome({ template: "admin" });
  assert.equal(c.appHeaderType, "Administration");
  assert.equal(c.hasSidebar, true);
});

test("resolveChrome — no-sidebar template", function () {
  var c = chromeTree.resolveChrome({ template: "no-sidebar" });
  assert.equal(c.appHeaderType, "Studio");
  assert.equal(c.hasSidebar, false);
});

test("resolveChrome — bare template", function () {
  var c = chromeTree.resolveChrome({ template: "bare" });
  assert.equal(c.appHeaderType, null);
  assert.equal(c.hasSidebar, false);
});

test("resolveChrome — legacy appHeader/sidebar fields", function () {
  var c = chromeTree.resolveChrome({ appHeader: "Explorer", sidebar: true });
  assert.equal(c.appHeaderType, "Explorer");
  assert.equal(c.hasSidebar, true);
});

// ---------------------------------------------------------------------------
// (3) chromeNodes()
// ---------------------------------------------------------------------------

test("chromeNodes — studio: header + sidebar + pageHeader nodes", function () {
  var chrome = { appHeaderType: "Studio", hasSidebar: true };
  var sidebarConfig = { items: ["Catalog", "Lineage"], activeItem: "Catalog" };
  var pageHeaderConfig = { title: "Catalog", subtitle: "Browse" };
  var headerConfig = {};
  var nodes = chromeTree.chromeNodes(
    chrome,
    sidebarConfig,
    pageHeaderConfig,
    headerConfig,
  );

  // Header node
  assert.ok(nodes.header, "header node present");
  assert.equal(nodes.header.type, "INSTANCE");
  assert.equal(nodes.header.library, "ds");
  assert.equal(nodes.header.dsSlug, "global-header");
  assert.ok(
    nodes.header.variant.indexOf("Studio") >= 0,
    "header variant includes Studio",
  );

  // Sidebar node
  assert.ok(nodes.sidebar, "sidebar node present");
  assert.equal(nodes.sidebar.type, "INSTANCE");
  assert.equal(nodes.sidebar.dsSlug, "side-nav");
  assert.ok(
    nodes.sidebar.variant.indexOf("Studio") >= 0,
    "sidebar variant includes navApp",
  );

  // PageHeader node
  assert.ok(nodes.pageHeader, "pageHeader node present");
  assert.equal(nodes.pageHeader.type, "INSTANCE");
  assert.equal(nodes.pageHeader.dsSlug, "page-header");
});

test("chromeNodes — admin: uses Admin navApp", function () {
  var chrome = { appHeaderType: "Administration", hasSidebar: true };
  var sidebarConfig = { items: ["Users", "Roles"] };
  var nodes = chromeTree.chromeNodes(chrome, sidebarConfig, null, {});
  assert.ok(
    nodes.sidebar.variant.indexOf("Admin") >= 0,
    "admin uses Admin nav",
  );
  assert.equal(nodes.pageHeader, null, "pageHeader null when config absent");
});

test("chromeNodes — no sidebar: sidebar is null", function () {
  var chrome = { appHeaderType: "Studio", hasSidebar: false };
  var nodes = chromeTree.chromeNodes(chrome, null, null, {});
  assert.equal(nodes.sidebar, null, "sidebar null when hasSidebar false");
});

test("chromeNodes — no header: header is null", function () {
  var chrome = { appHeaderType: null, hasSidebar: false };
  var nodes = chromeTree.chromeNodes(chrome, null, null, {});
  assert.equal(nodes.header, null, "header null when appHeaderType absent");
});

test("chromeNodes — sidebar groups branch", function () {
  var chrome = { appHeaderType: "Explorer", hasSidebar: true };
  var sidebarConfig = {
    groups: [{ items: [{ label: "Datasets", icon: "database" }] }],
    activeItem: "Datasets",
  };
  var nodes = chromeTree.chromeNodes(chrome, sidebarConfig, null, {});
  assert.ok(nodes.sidebar, "sidebar present");
  var props = nodes.sidebar.props;
  assert.ok(props.Groups, "Groups prop set for groups branch");
  assert.equal(props.Active, "Datasets");
});

test("chromeNodes — sidebar items-with-icons branch", function () {
  var chrome = { appHeaderType: "Studio", hasSidebar: true };
  var sidebarConfig = {
    items: [{ label: "Catalog", icon: "grid" }, { label: "Lineage" }],
  };
  var nodes = chromeTree.chromeNodes(chrome, sidebarConfig, null, {});
  assert.ok(nodes.sidebar, "sidebar present");
  // icon present on first item → should use Groups prop
  assert.ok(
    nodes.sidebar.props.Groups,
    "Groups prop set when items have icons",
  );
});

test("chromeNodes — sidebar comma-list branch (no icons)", function () {
  var chrome = { appHeaderType: "Studio", hasSidebar: true };
  var sidebarConfig = { items: ["Catalog", "Lineage"] };
  var nodes = chromeTree.chromeNodes(chrome, sidebarConfig, null, {});
  assert.ok(nodes.sidebar, "sidebar present");
  assert.ok(nodes.sidebar.props.Items, "Items prop set for comma-list");
  assert.ok(nodes.sidebar.props.Items.indexOf("Catalog") >= 0);
});

// ---------------------------------------------------------------------------
// (4) screenTree()
// ---------------------------------------------------------------------------

test("screenTree — returns root FRAME with expected shape", function () {
  var s = {
    name: "Studio Screen",
    template: "studio",
    library: "ds",
    header: {},
    sidebar: { items: ["Catalog"], activeItem: "Catalog" },
    pageHeader: { title: "Catalog" },
    content: [],
  };
  var tree = chromeTree.screenTree(s);

  // Root frame
  assert.equal(tree.type, "FRAME", "root is FRAME");
  assert.equal(tree.sizing.horizontal, 1440, "root width 1440");
  assert.equal(tree.layout.mode, "VERTICAL", "root layout VERTICAL");
  assert.ok(
    tree.minHeight >= 960 || tree.sizing.minHeight >= 960,
    "root min-height 960",
  );

  // First child: global-header INSTANCE
  assert.ok(tree.children, "root has children");
  var header = tree.children[0];
  assert.equal(header.type, "INSTANCE", "first child INSTANCE");
  assert.equal(header.dsSlug, "global-header");
  assert.equal(header.sizing.horizontal, "FILL");

  // Second child: body FRAME
  var body = tree.children[1];
  assert.equal(body.type, "FRAME", "body is FRAME");
  assert.equal(body.layout.mode, "HORIZONTAL", "body HORIZONTAL");
  assert.equal(body.sizing.horizontal, "FILL");
  assert.equal(body.sizing.vertical, "FILL");

  // Body children: sidebar + content
  var sidebar = body.children[0];
  assert.equal(sidebar.type, "INSTANCE", "sidebar INSTANCE");
  assert.equal(sidebar.dsSlug, "side-nav");
  assert.equal(sidebar.sizing.vertical, "FILL");

  var content = body.children[1];
  assert.equal(content.type, "FRAME", "content FRAME");
  assert.equal(content.layout.mode, "VERTICAL");
  assert.equal(content.sizing.horizontal, "FILL");
  // The content frame carries the app-shell region inset (lg vertical / xl
  // horizontal = 24/32, the --zen spacing tokens) + lg item-spacing — this is
  // where the zero-padding page-header gets its top gap + horizontal inset.
  assert.deepEqual(content.layout.padding, {
    top: 24,
    right: 32,
    bottom: 24,
    left: 32,
  });
  assert.equal(content.layout.spacing, 24);

  // Content children: page-header + content-area
  var ph = content.children[0];
  assert.equal(ph.type, "INSTANCE", "page-header INSTANCE");
  assert.equal(ph.dsSlug, "page-header");
  assert.equal(ph.sizing.horizontal, "FILL");

  var ca = content.children[1];
  assert.equal(ca.type, "FRAME", "content-area FRAME");
  assert.equal(ca.layout.mode, "VERTICAL");
  // content-area has no padding of its own; the content frame provides the inset
  assert.ok(
    !ca.layout.padding,
    "content-area has no padding (content frame insets)",
  );
  assert.equal(ca.sizing.horizontal, "FILL");
});

test("screenTree — no-sidebar: body has no sidebar child", function () {
  var s = {
    name: "No Sidebar",
    template: "no-sidebar",
    library: "ds",
    header: {},
    pageHeader: { title: "Overview" },
    content: [],
  };
  var tree = chromeTree.screenTree(s);
  var body = tree.children[1];
  // Body first child should be content frame (no side-nav)
  assert.equal(
    body.children[0].type,
    "FRAME",
    "body first child is content frame when no sidebar",
  );
  assert.ok(
    !body.children.some(function (c) {
      return c.dsSlug === "side-nav";
    }),
    "no side-nav when hasSidebar false",
  );
});

test("screenTree — no header: root has no global-header child", function () {
  var s = {
    name: "Bare",
    template: "bare",
    library: "ds",
    content: [],
  };
  var tree = chromeTree.screenTree(s);
  assert.ok(
    !tree.children.some(function (c) {
      return c.dsSlug === "global-header";
    }),
    "no global-header when appHeaderType null",
  );
});

// ---------------------------------------------------------------------------
// (5) HTML golden — byte-identical after refactor
// ---------------------------------------------------------------------------
// After the refactor, flow-renderer.js consumes chromeTree.chromeNodes()
// and chromeTree.appProfile() instead of its own inline functions.
// The rendered HTML must be byte-identical to the pre-refactor golden.
// We load flow-renderer in a simulated browser context (same pattern as
// flow-renderer.test.js) with dsScreenTree in the mock window.

test("HTML golden — studio screen byte-identical after refactor", function () {
  var fmHtmlMap = require("../../scripts/renderers/html-renderers/fm-html-map");
  var renderNodeModule = require("../../scripts/renderers/html-renderers/render-node.js");
  var dsHtmlMap = require("../../scripts/renderers/html-renderers/ds-html-map.js");

  var mockDoc = {
    addEventListener: function () {},
    getElementById: function () {
      return null;
    },
  };
  var mockWin = {
    fmHtmlMap: fmHtmlMap,
    renderNode: renderNodeModule,
    dsHtmlMap: dsHtmlMap,
    dsScreenTree: chromeTree,
  };

  var code = fs.readFileSync(
    path.join(
      __dirname,
      "../../scripts/renderers/html-renderers/flow-renderer.js",
    ),
    "utf8",
  );
  var fn = new Function("window", "document", code);
  fn(mockWin, mockDoc);

  var screenFn = mockWin._testExports.screen;

  var actual = screenFn({
    name: "Studio Screen",
    template: "studio",
    library: "ds",
    header: {
      search: true,
      account: "VO",
      context: "Catalog",
      contextValue: "Default",
    },
    sidebar: {
      items: [{ label: "Catalog", state: "On" }, { label: "Lineage" }],
      activeItem: "Catalog",
    },
    pageHeader: {
      title: "Catalog",
      subtitle: "Browse data assets",
      actions: ["Import"],
    },
    content: [
      {
        type: "TEXT",
        name: "H1",
        content: "Hello",
        font: "Inter:Bold",
        size: 16,
      },
    ],
  });

  assertGolden("studio", actual);
});

test("HTML golden — explorer screen byte-identical after refactor", function () {
  var fmHtmlMap = require("../../scripts/renderers/html-renderers/fm-html-map");
  var renderNodeModule = require("../../scripts/renderers/html-renderers/render-node.js");
  var dsHtmlMap = require("../../scripts/renderers/html-renderers/ds-html-map.js");
  var mockDoc = {
    addEventListener: function () {},
    getElementById: function () {
      return null;
    },
  };
  var mockWin = {
    fmHtmlMap,
    renderNode: renderNodeModule,
    dsHtmlMap,
    dsScreenTree: chromeTree,
  };
  var code = fs.readFileSync(
    path.join(
      __dirname,
      "../../scripts/renderers/html-renderers/flow-renderer.js",
    ),
    "utf8",
  );
  new Function("window", "document", code)(mockWin, mockDoc);

  var actual = mockWin._testExports.screen({
    name: "Explorer Screen",
    template: "explorer",
    library: "ds",
    header: {
      search: true,
      account: "VO",
      context: "Catalog",
      contextValue: "Default",
    },
    sidebar: {
      groups: [{ items: [{ label: "Datasets", icon: "database" }] }],
      activeItem: "Datasets",
    },
    pageHeader: { title: "Browse" },
  });
  assertGolden("explorer", actual);
});

test("HTML golden — admin screen byte-identical after refactor", function () {
  var fmHtmlMap = require("../../scripts/renderers/html-renderers/fm-html-map");
  var renderNodeModule = require("../../scripts/renderers/html-renderers/render-node.js");
  var dsHtmlMap = require("../../scripts/renderers/html-renderers/ds-html-map.js");
  var mockDoc = {
    addEventListener: function () {},
    getElementById: function () {
      return null;
    },
  };
  var mockWin = {
    fmHtmlMap,
    renderNode: renderNodeModule,
    dsHtmlMap,
    dsScreenTree: chromeTree,
  };
  var code = fs.readFileSync(
    path.join(
      __dirname,
      "../../scripts/renderers/html-renderers/flow-renderer.js",
    ),
    "utf8",
  );
  new Function("window", "document", code)(mockWin, mockDoc);

  var actual = mockWin._testExports.screen({
    name: "Admin Screen",
    template: "admin",
    library: "ds",
    header: {
      search: true,
      account: "VO",
      context: "Catalog",
      contextValue: "Default",
    },
    sidebar: { items: ["Users", "Roles", "Settings"], activeItem: "Users" },
    pageHeader: { title: "Users", subtitle: "Manage permissions" },
  });
  assertGolden("admin", actual);
});

test("HTML golden — no-sidebar screen byte-identical after refactor", function () {
  var fmHtmlMap = require("../../scripts/renderers/html-renderers/fm-html-map");
  var renderNodeModule = require("../../scripts/renderers/html-renderers/render-node.js");
  var dsHtmlMap = require("../../scripts/renderers/html-renderers/ds-html-map.js");
  var mockDoc = {
    addEventListener: function () {},
    getElementById: function () {
      return null;
    },
  };
  var mockWin = {
    fmHtmlMap,
    renderNode: renderNodeModule,
    dsHtmlMap,
    dsScreenTree: chromeTree,
  };
  var code = fs.readFileSync(
    path.join(
      __dirname,
      "../../scripts/renderers/html-renderers/flow-renderer.js",
    ),
    "utf8",
  );
  new Function("window", "document", code)(mockWin, mockDoc);

  var actual = mockWin._testExports.screen({
    name: "No Sidebar Screen",
    template: "no-sidebar",
    library: "ds",
    header: {
      search: true,
      account: "VO",
      context: "Catalog",
      contextValue: "Default",
    },
    pageHeader: { title: "Overview" },
  });
  assertGolden("noSidebar", actual);
});

// ---------------------------------------------------------------------------
// (6) The regeneration seam itself
// ---------------------------------------------------------------------------

test("golden fixture has a regeneration path", function () {
  var before = fs.readFileSync(GOLDEN_PATH, "utf8");
  process.env.UPDATE_GOLDENS = "1";
  var after;
  try {
    assertGolden("studio", "SENTINEL");
    after = readGolden();
  } finally {
    // Restore before asserting so a failure can never leave the fixture
    // corrupted for the rest of the suite.
    fs.writeFileSync(GOLDEN_PATH, before);
    delete process.env.UPDATE_GOLDENS;
  }
  assert.equal(
    after.studio,
    "SENTINEL",
    "UPDATE_GOLDENS=1 must rewrite the fixture",
  );
});
