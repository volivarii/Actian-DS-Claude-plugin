#!/usr/bin/env node
"use strict";

/**
 * flow-renderer.test.js — Tests for flow-renderer.js
 *
 * Run with: node tests/flow-renderer.test.js
 * (from the plugins/actian-design-system directory)
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    process.stdout.write("  \u2713 " + message + "\n");
  } else {
    failed++;
    failures.push(message);
    process.stdout.write("  \u2717 FAIL: " + message + "\n");
  }
}

function assertContains(str, substr, message) {
  assert(
    typeof str === "string" && str.indexOf(substr) !== -1,
    message + " (expected to contain: " + JSON.stringify(substr) + ")",
  );
}

function assertNotContains(str, substr, message) {
  assert(
    typeof str === "string" && str.indexOf(substr) === -1,
    message + " (expected NOT to contain: " + JSON.stringify(substr) + ")",
  );
}

function section(name) {
  process.stdout.write("\n" + name + "\n");
}

// ---------------------------------------------------------------------------
// Load flow-renderer.js in a simulated browser environment
// ---------------------------------------------------------------------------

const RENDERER_PATH = path.join(
  __dirname,
  "../../scripts/renderers/html-renderers/flow-renderer.js",
);
const code = fs.readFileSync(RENDERER_PATH, "utf8");

// Minimal mock document so DOMContentLoaded listener doesn't blow up
const mockDocument = {
  _listeners: {},
  addEventListener: function (event, fn) {
    this._listeners[event] = fn;
  },
  getElementById: function () {
    return null;
  },
};

// Pre-load fm-html-map + render-node so flow-renderer can resolve shared
// functions. (The IIFE runs under `new Function`, whose global `require`
// cannot resolve flow-renderer's relative paths, so we provide both deps on
// the mocked window — mirroring how the browser bundle inlines them.)
const fmHtmlMap = require("../../scripts/lib/renderer.js").fmHtmlMap;
const renderNodeModule = require("../../scripts/renderers/html-renderers/render-node.js");
const dsHtmlMap = require("../../scripts/lib/renderer.js").dsHtmlMap;
const dsScreenTree = require("../../scripts/renderers/html-renderers/ds-screen-tree.js");
const mockWindow = {
  fmHtmlMap: fmHtmlMap,
  renderNode: renderNodeModule,
  dsHtmlMap: dsHtmlMap,
  dsScreenTree: dsScreenTree,
};

// Execute the IIFE with mocked globals
// We wrap in a function that provides window and document
const fn = new Function("window", "document", code);
fn(mockWindow, mockDocument);

// Access test exports
const {
  renderContentNode,
  renderFMComponent,
  parseVariant,
  buildFrameStyle,
  buildTextStyle,
  resolveChrome,
  screen,
  tierBadge,
} = mockWindow._testExports || {};

assert(typeof renderContentNode === "function", "renderContentNode exported");
assert(typeof renderFMComponent === "function", "renderFMComponent exported");
assert(typeof parseVariant === "function", "parseVariant exported");
assert(typeof buildFrameStyle === "function", "buildFrameStyle exported");
assert(typeof buildTextStyle === "function", "buildTextStyle exported");
assert(typeof resolveChrome === "function", "resolveChrome exported");
assert(typeof tierBadge === "function", "tierBadge exported");

// ---------------------------------------------------------------------------
// FRAME node
// ---------------------------------------------------------------------------

section("FRAME node");

const frameSimple = renderContentNode({
  type: "FRAME",
  name: "Container",
  layout: { mode: "HORIZONTAL", spacing: 16 },
  sizing: { horizontal: "FILL" },
});
assertContains(frameSimple, "fm-frame", "frame base class");
assertContains(frameSimple, 'data-name="Container"', "frame data-name");
assertContains(frameSimple, "display:flex", "flex display");
assertContains(frameSimple, "flex-direction:row", "row direction");
assertContains(frameSimple, "gap:16px", "gap spacing");
assertContains(frameSimple, "flex:1", "fill sizing");
assertContains(frameSimple, "min-width:0", "min-width for fill");

const frameVertical = renderContentNode({
  type: "FRAME",
  name: "Column",
  layout: { mode: "VERTICAL", spacing: 8 },
  sizing: { vertical: 200 },
  fills: ["#FFFFFF"],
  cornerRadius: 8,
});
assertContains(frameVertical, "flex-direction:column", "column direction");
assertContains(frameVertical, "gap:8px", "gap 8");
assertContains(frameVertical, "height:200px", "fixed height");
assertContains(frameVertical, "background:#FFFFFF", "fill color");
assertContains(frameVertical, "border-radius:8px", "corner radius");

const framePadded = renderContentNode({
  type: "FRAME",
  name: "Padded",
  layout: { padding: { top: 16, right: 24, bottom: 16, left: 24 } },
});
assertContains(framePadded, "padding:16px 24px 16px 24px", "padding applied");

const frameStroke = renderContentNode({
  type: "FRAME",
  name: "Bordered",
  stroke: { color: "#E2E8F0", weight: 1 },
});
assertContains(frameStroke, "border:1px solid #E2E8F0", "stroke applied");

const frameClip = renderContentNode({
  type: "FRAME",
  name: "Clipped",
  clipsContent: true,
});
assertContains(frameClip, "overflow:hidden", "clips content");

const frameOpacity = renderContentNode({
  type: "FRAME",
  name: "Faded",
  opacity: 0.5,
});
assertContains(frameOpacity, "opacity:0.5", "opacity applied");

const frameCornerObj = renderContentNode({
  type: "FRAME",
  name: "Mixed radius",
  cornerRadius: { topLeft: 8, topRight: 8, bottomRight: 0, bottomLeft: 0 },
});
assertContains(
  frameCornerObj,
  "border-radius:8px 8px 0px 0px",
  "individual corner radii",
);

const frameSideStrokes = renderContentNode({
  type: "FRAME",
  name: "Bottom border only",
  stroke: { color: "#CBD2E0", weight: 1, sides: { bottom: true } },
});
assertContains(
  frameSideStrokes,
  "border-bottom:1px solid #CBD2E0",
  "bottom stroke only",
);
assertNotContains(frameSideStrokes, "border-top:", "no top stroke");

// ---------------------------------------------------------------------------
// TEXT node
// ---------------------------------------------------------------------------

section("TEXT node");

const textNode = renderContentNode({
  type: "TEXT",
  name: "Heading",
  content: "Hello World",
  font: "Inter:Semi Bold",
  size: 24,
  color: "#1A202C",
});
assertContains(textNode, "fm-text", "text base class");
assertContains(textNode, 'data-name="Heading"', "text data-name");
assertContains(textNode, "Hello World", "text content");
assertContains(textNode, "font-family:Inter", "font family");
assertContains(textNode, "font-weight:600", "semi bold → 600");
assertContains(textNode, "font-size:24px", "font size");
assertContains(textNode, "color:#1A202C", "text color");

const textRegular = renderContentNode({
  type: "TEXT",
  name: "Body",
  content: "Paragraph text",
  font: "Inter:Regular",
  size: 14,
  color: "#4A5568",
});
assertContains(textRegular, "font-weight:400", "regular → 400");

const textMedium = renderContentNode({
  type: "TEXT",
  name: "Label",
  content: "Field",
  font: "Inter:Medium",
});
assertContains(textMedium, "font-weight:500", "medium → 500");

const textBold = renderContentNode({
  type: "TEXT",
  name: "Bold",
  content: "Title",
  font: "Inter:Bold",
});
assertContains(textBold, "font-weight:700", "bold → 700");

const textWidth = renderContentNode({
  type: "TEXT",
  name: "Fixed width",
  content: "Truncated",
  width: 200,
});
assertContains(textWidth, "width:200px", "text width");
assertContains(textWidth, "display:block", "block display for fixed width");

const textAlign = renderContentNode({
  type: "TEXT",
  name: "Centered",
  content: "Center",
  textAlign: { horizontal: "CENTER" },
});
assertContains(textAlign, "text-align:center", "center alignment");

const textXSS = renderContentNode({
  type: "TEXT",
  name: "Unsafe",
  content: "<script>evil()</script>",
});
assertNotContains(textXSS, "<script>", "script escaped in text content");
assertContains(textXSS, "&lt;script&gt;", "content properly escaped");

// ---------------------------------------------------------------------------
// INSTANCE node
// ---------------------------------------------------------------------------

section("INSTANCE node (delegates to renderFMComponent)");

const instanceNode = renderContentNode({
  type: "INSTANCE",
  ref: "fmButton",
  variant: "Type=Primary, Size=md",
  props: { Label: "Click me" },
});
assertContains(instanceNode, "fm-button", "button from instance");
assertContains(instanceNode, "fm-button--primary", "primary variant");
assertContains(instanceNode, "Click me", "button label");

const instanceDropdown = renderContentNode({
  type: "INSTANCE",
  ref: "fmDropdown",
  variant: "Type=Filled",
  props: { "Dropdown Text": "USA" },
});
assertContains(
  instanceDropdown,
  "fm-dropdown--filled",
  "dropdown via instance",
);
assertContains(instanceDropdown, "USA", "dropdown text");

// ---------------------------------------------------------------------------
// ELLIPSE node
// ---------------------------------------------------------------------------

section("ELLIPSE node");

const ellipse = renderContentNode({
  type: "ELLIPSE",
  name: "Avatar",
  width: 40,
  height: 40,
  fills: ["#4A90D9"],
});
assertContains(ellipse, "fm-ellipse", "ellipse class");
assertContains(ellipse, 'data-name="Avatar"', "ellipse name");
assertContains(ellipse, "width:40px", "ellipse width");
assertContains(ellipse, "height:40px", "ellipse height");
assertContains(ellipse, "border-radius:50%", "circle shape");
assertContains(ellipse, "background:#4A90D9", "fill color");

const ellipseOpacity = renderContentNode({
  type: "ELLIPSE",
  name: "Faded circle",
  width: 24,
  height: 24,
  opacity: 0.3,
});
assertContains(ellipseOpacity, "opacity:0.3", "ellipse opacity");

const ellipseDefault = renderContentNode({
  type: "ELLIPSE",
  name: "No fill",
});
assertContains(ellipseDefault, "#CBD2E0", "default fill color");
assertContains(ellipseDefault, "width:16px", "default width");

// ---------------------------------------------------------------------------
// RECT node
// ---------------------------------------------------------------------------

section("RECT node");

const rect = renderContentNode({
  type: "RECT",
  name: "Divider",
  width: 100,
  height: 2,
  fills: ["#E2E8F0"],
  cornerRadius: 4,
});
assertContains(rect, "fm-rect", "rect class");
assertContains(rect, 'data-name="Divider"', "rect name");
assertContains(rect, "width:100px", "rect width");
assertContains(rect, "height:2px", "rect height");
assertContains(rect, "background:#E2E8F0", "fill");
assertContains(rect, "border-radius:4px", "corner radius");

const rectDefaults = renderContentNode({
  type: "RECT",
  name: "Default",
});
assertContains(rectDefaults, "width:32px", "default width");
assertContains(rectDefaults, "height:32px", "default height");

// ---------------------------------------------------------------------------
// DIVIDER node
// ---------------------------------------------------------------------------

section("DIVIDER node");

const divider = renderContentNode({ type: "DIVIDER" });
assert(divider === '<hr class="fm-divider">', "divider renders hr");

// ---------------------------------------------------------------------------
// Nested children
// ---------------------------------------------------------------------------

section("Nested children");

const nested = renderContentNode({
  type: "FRAME",
  name: "Parent",
  layout: { mode: "VERTICAL" },
  children: [
    {
      type: "TEXT",
      name: "Child 1",
      content: "First",
    },
    {
      type: "TEXT",
      name: "Child 2",
      content: "Second",
    },
  ],
});
assertContains(nested, "First", "first child rendered");
assertContains(nested, "Second", "second child rendered");
assertContains(nested, "fm-frame", "parent frame");

const deepNested = renderContentNode({
  type: "FRAME",
  name: "Outer",
  children: [
    {
      type: "FRAME",
      name: "Inner",
      children: [{ type: "RECT", name: "Leaf", width: 10, height: 10 }],
    },
  ],
});
assertContains(deepNested, "fm-rect", "deeply nested rect");

// ---------------------------------------------------------------------------
// Unknown node type
// ---------------------------------------------------------------------------

section("Unknown node type");

const unknownNode = renderContentNode({
  type: "VECTOR",
  name: "Icon",
  children: [],
});
assert(
  unknownNode === "",
  "unknown node with no children returns empty string",
);

const unknownWithChildren = renderContentNode({
  type: "GROUP",
  name: "Group",
  children: [{ type: "RECT", name: "Rect", width: 20, height: 20 }],
});
assertContains(
  unknownWithChildren,
  "fm-rect",
  "children of unknown node rendered",
);

// ---------------------------------------------------------------------------
// Null / undefined handling
// ---------------------------------------------------------------------------

section("Null / undefined handling");

assert(renderContentNode(null) === "", "null returns empty string");
assert(renderContentNode(undefined) === "", "undefined returns empty string");

// ---------------------------------------------------------------------------
// resolveChrome — template-based chrome
// ---------------------------------------------------------------------------

section("resolveChrome — template mapping");

const adminChrome = resolveChrome({ template: "admin" });
assert(
  adminChrome.appHeaderType === "Administration",
  "admin → Administration header",
);
assert(adminChrome.hasSidebar === true, "admin → sidebar present");

const studioChrome = resolveChrome({ template: "studio" });
assert(studioChrome.appHeaderType === "Studio", "studio → Studio header");
assert(studioChrome.hasSidebar === true, "studio → sidebar present");

const explorerChrome = resolveChrome({ template: "explorer" });
assert(
  explorerChrome.appHeaderType === "Explorer",
  "explorer → Explorer header",
);
assert(explorerChrome.hasSidebar === true, "explorer → sidebar present");

const noSidebarChrome = resolveChrome({ template: "no-sidebar" });
assert(noSidebarChrome.appHeaderType !== null, "no-sidebar → has app header");
assert(noSidebarChrome.hasSidebar === false, "no-sidebar → no sidebar");

const bareChrome = resolveChrome({ template: "bare" });
assert(bareChrome.appHeaderType === null, "bare → no app header");
assert(bareChrome.hasSidebar === false, "bare → no sidebar");

const mobileChrome = resolveChrome({ template: "mobile" });
assert(mobileChrome.appHeaderType === null, "mobile → no app header");

const tabletChrome = resolveChrome({ template: "tablet" });
assert(tabletChrome.appHeaderType === null, "tablet → no app header");

// ---------------------------------------------------------------------------
// resolveChrome — backward compat with s.appHeader / s.sidebar
// ---------------------------------------------------------------------------

section("resolveChrome — backward compat");

const legacyChrome = resolveChrome({
  appHeader: "Studio",
  sidebar: { items: 5 },
});
assert(legacyChrome.appHeaderType === "Studio", "legacy appHeader respected");
assert(
  legacyChrome.hasSidebar === true,
  "legacy sidebar truthy → hasSidebar true",
);

const legacyNoSidebar = resolveChrome({ appHeader: "Studio" });
assert(
  legacyNoSidebar.hasSidebar === false,
  "no sidebar field → hasSidebar false",
);

// ---------------------------------------------------------------------------
// screen() — template-based chrome in rendered output
// ---------------------------------------------------------------------------

section("screen() — template chrome");

const adminScreen = screen({
  name: "Dashboard",
  template: "admin",
  contentHtml: "<p>Content</p>",
});
assertContains(adminScreen, "fm-app-header", "admin screen has app header");
assertContains(adminScreen, "Administration", "admin label in header");
assertContains(adminScreen, "fm-sidebar", "admin screen has sidebar");
assertContains(adminScreen, "Content", "content rendered");

const bareScreen = screen({
  name: "Login",
  template: "bare",
  contentHtml: "<p>Login form</p>",
});
assertNotContains(bareScreen, "fm-app-header", "bare has no app header");
assertNotContains(bareScreen, "fm-sidebar", "bare has no sidebar");
assertContains(bareScreen, "Login form", "bare content rendered");
assertContains(bareScreen, "screen--bare", "bare template class");

const noSidebarScreen = screen({
  name: "Settings",
  template: "no-sidebar",
  contentHtml: "<p>Settings</p>",
});
assertContains(noSidebarScreen, "fm-app-header", "no-sidebar has app header");
assertNotContains(noSidebarScreen, "fm-sidebar", "no-sidebar has no sidebar");

// ---------------------------------------------------------------------------
// screen() — hi-fi DS chrome branch (library:"ds") + per-app theming
// ---------------------------------------------------------------------------

section("screen() — hi-fi DS chrome + theming");

const hifiAdmin = screen({
  name: "Roles",
  template: "admin",
  library: "ds",
  pageHeader: { title: "Roles", subtitle: "Manage permissions" },
  sidebar: { items: ["Users", "Roles", "Settings"], activeItem: "Roles" },
  contentHtml: "<p>Admin body</p>",
});
assertContains(
  hifiAdmin,
  "screen--hifi",
  "hi-fi screen carries the hifi modifier",
);
assertContains(
  hifiAdmin,
  'data-theme="actian"',
  "admin hi-fi themes to actian",
);
assertContains(hifiAdmin, "ds-header", "hi-fi uses the DS global-header");
assertContains(hifiAdmin, "ds-sidenav", "hi-fi uses the DS side-nav");
assertContains(hifiAdmin, "ds-page-header", "hi-fi uses the DS page-header");
assertContains(hifiAdmin, "Roles", "hi-fi page-header title rendered");
assertContains(
  hifiAdmin,
  "Manage permissions",
  "hi-fi page-header subtitle rendered",
);
assertContains(hifiAdmin, "Admin body", "hi-fi content rendered");
assertNotContains(
  hifiAdmin,
  "fm-app-header",
  "hi-fi does NOT emit FM app header",
);
assertNotContains(hifiAdmin, "fm-sidebar", "hi-fi does NOT emit FM sidebar");

// side-nav reflects authored nav items + active selection
assertContains(hifiAdmin, "Users", "hi-fi sidebar renders authored item");
assertContains(hifiAdmin, "is-active", "hi-fi sidebar marks the active item");

const hifiStudio = screen({
  name: "Catalog",
  template: "studio",
  library: "ds",
  contentHtml: "<p>x</p>",
});
assertContains(
  hifiStudio,
  'data-theme="studio"',
  "studio hi-fi themes to studio",
);

const hifiExplorer = screen({
  name: "Browse",
  template: "explorer",
  library: "ds",
  contentHtml: "<p>x</p>",
});
assertContains(
  hifiExplorer,
  'data-theme="explorer"',
  "explorer hi-fi themes to explorer",
);

// Backward compat: a screen WITHOUT library:"ds" stays on the FM chrome path,
// no theme attribute, no DS chrome — the lo-fi pipeline is untouched.
const lofiAdmin = screen({
  name: "Dashboard",
  template: "admin",
  contentHtml: "<p>Content</p>",
});
assertContains(lofiAdmin, "fm-app-header", "lo-fi still uses FM app header");
assertNotContains(lofiAdmin, "ds-header", "lo-fi does NOT use DS chrome");
assertNotContains(lofiAdmin, "data-theme", "lo-fi has no theme attribute");
assertNotContains(lofiAdmin, "screen--hifi", "lo-fi has no hifi modifier");

// ---------------------------------------------------------------------------
// screen() — content[] takes priority over contentHtml
// ---------------------------------------------------------------------------

section("screen() — content[] vs contentHtml");

const screenWithContent = screen({
  name: "Structured",
  template: "studio",
  contentHtml: "LEGACY HTML",
  content: [
    {
      type: "TEXT",
      name: "Heading",
      content: "Structured Content",
      font: "Inter:Bold",
      size: 20,
    },
  ],
});
assertContains(screenWithContent, "Structured Content", "content[] rendered");
assertNotContains(
  screenWithContent,
  "LEGACY HTML",
  "contentHtml NOT used when content[] present",
);

const screenLegacy = screen({
  name: "Legacy",
  template: "studio",
  contentHtml: "LEGACY CONTENT",
});
assertContains(
  screenLegacy,
  "LEGACY CONTENT",
  "contentHtml used when no content[]",
);

// ---------------------------------------------------------------------------
// screen() — legacy s.appHeader / s.sidebar (no template)
// ---------------------------------------------------------------------------

section("screen() — legacy fields without template");

const legacyScreen = screen({
  name: "Old format",
  appHeader: "Explorer",
  sidebar: { items: 4, activeItem: "Jobs" },
  contentHtml: "<p>Old</p>",
});
assertContains(legacyScreen, "fm-app-header", "legacy screen has app header");
assertContains(legacyScreen, "fm-sidebar", "legacy screen has sidebar");
assertContains(legacyScreen, "Explorer", "explorer header label");
assertContains(legacyScreen, "Jobs", "active sidebar item");

// ---------------------------------------------------------------------------
// Tier badges
// ---------------------------------------------------------------------------

section("Tier badges");

// Tier 1 (recognized)
const screenTier1 = screen({
  name: "Catalog",
  template: "studio",
  pageHeader: { title: "Catalog" },
  tier: "recognized",
  matchedRecipe: "table-list",
  confidence: 0.92,
  content: [],
});
assertContains(screenTier1, 'class="tier-badge"', "tier-1 badge present");
assertContains(screenTier1, 'data-tier="recognized"', "tier-1 data attr");
assertContains(screenTier1, "tier 1", "tier-1 label");
assertContains(screenTier1, "table-list", "tier-1 includes recipe in title");
assertContains(screenTier1, "0.92", "tier-1 confidence in title");

// Tier 2 (adapted, composition)
const screenTier2 = screen({
  name: "Onboarding",
  template: "studio",
  pageHeader: { title: "Onboarding" },
  tier: "adapted",
  composition: ["form-create", "sticky-footer"],
  confidence: 0.78,
  justification: "Composition: form + sticky footer for confirmation.",
  content: [],
});
assertContains(screenTier2, 'data-tier="adapted"', "tier-2 data attr");
assertContains(
  screenTier2,
  "form-create+sticky-footer",
  "tier-2 composition in title",
);

// Tier 3 (improvised)
const screenTier3 = screen({
  name: "Permission denied",
  template: "studio",
  pageHeader: { title: "Permission denied" },
  tier: "improvised",
  confidence: 0.55,
  justification:
    "Considered detail-page; auth-pre-empts query. Improvising auth-block-with-cta.",
  content: [],
});
assertContains(screenTier3, 'data-tier="improvised"', "tier-3 data attr");
assertContains(screenTier3, "tier 3", "tier-3 label");

// No tier — no badge
const screenNoTier = screen({
  name: "Plain",
  template: "studio",
  pageHeader: { title: "Plain" },
  content: [],
});
assertNotContains(screenNoTier, "tier-badge", "no badge when tier missing");

// ---------------------------------------------------------------------------
// Contract drift regressions — screen-generator emits richer Figma-shaped data
// than the FM renderer historically consumed (sidebar count, string actions,
// string fills). These guard the three bugs found in the connection-setup-
// wizard hi-fi test (2026-06-08).
// ---------------------------------------------------------------------------

section("B3 — FRAME fills as Figma object shape {type,color}");

const frameFillObj = renderContentNode({
  type: "FRAME",
  name: "Toolbar",
  fills: [{ type: "SOLID", color: "var(--zen-color-bg-muted)" }],
});
assertContains(
  frameFillObj,
  "background:var(--zen-color-bg-muted)",
  "fills object → color string",
);
assertNotContains(
  frameFillObj,
  "[object Object]",
  "no [object Object] from fills object",
);
// String fills still work (backward compat).
assertContains(
  renderContentNode({ type: "FRAME", name: "Plain", fills: ["#FFFFFF"] }),
  "background:#FFFFFF",
  "string fill still works",
);

section("B1 — sidebar renders real navItems labels");

const navScreen = screen({
  name: "Connections list",
  template: "admin",
  activeNavItem: "connections",
  navItems: [
    { label: "Catalogs", state: "Off" },
    { label: "Connections", state: "On" },
    { label: "Scanners", state: "Off" },
  ],
  content: [],
});
assertContains(navScreen, "Catalogs", "nav label Catalogs rendered");
assertContains(navScreen, "Scanners", "nav label Scanners rendered");
assertNotContains(
  navScreen,
  '<div class="fm-sidebar" data-name="Sidebar"></div>',
  "sidebar is not empty when navItems present",
);
assertContains(
  navScreen,
  'fm-nav-item--active" data-name="Connections"',
  "active nav item is the on-state / activeNavItem match",
);

section("B2 — pageHeader action objects {label,variant}");

const actionScreen = screen({
  name: "Connections",
  template: "admin",
  pageHeader: {
    title: "Connections",
    actions: [{ label: "Create connection", variant: "Primary" }],
  },
  content: [],
});
assertContains(
  actionScreen,
  "Create connection",
  "action object label rendered",
);
assertNotContains(
  actionScreen,
  "[object Object]",
  "no [object Object] from action object",
);
// String actions still work (backward compat).
assertContains(
  screen({
    name: "Legacy actions",
    template: "admin",
    pageHeader: { title: "X", actions: ["Save"] },
    content: [],
  }),
  ">Save<",
  "string action still works",
);

section(
  "Task A — DS chrome pageHeader actions forwarded to ds-page-header__actions",
);

assertContains(
  screen({
    name: "DS Actions",
    template: "admin",
    library: "ds",
    pageHeader: {
      title: "Users",
      actions: [{ label: "Add user", variant: "primary" }, "Export"],
    },
    content: [],
  }),
  "ds-page-header__actions",
  "DS chrome pageHeader actions → ds-page-header__actions container",
);

// ---------------------------------------------------------------------------
// Task 5 — Steward overlay + docked wrapping
// ---------------------------------------------------------------------------

section("Task 5 — steward overlay layer");

const stewardOverlay = screen({
  name: "S",
  template: "studio",
  library: "ds",
  pageHeader: { title: "Catalog" },
  content: [],
  steward: {
    mode: "overlay",
    size: "Default",
    state: "Answered",
    title: "Data Steward",
    insight: "x",
  },
});
assertContains(
  stewardOverlay,
  "ds-steward-layer--overlay",
  "overlay steward: layer carries --overlay modifier",
);
assert(
  stewardOverlay.indexOf("screen--steward-docked") === -1,
  "overlay steward: no docked modifier on screen",
);

section("Task 5 — steward docked layer");

const stewardDocked = screen({
  name: "S",
  template: "studio",
  library: "ds",
  pageHeader: { title: "Catalog" },
  content: [],
  steward: {
    mode: "docked",
    size: "Drawer",
    state: "Answered",
    title: "Data Steward",
    insight: "x",
  },
});
assertContains(
  stewardDocked,
  "screen--steward-docked",
  "docked steward: screen carries --steward-docked modifier",
);
assertContains(
  stewardDocked,
  "screen__main-frame",
  "docked steward: screen__main-frame wrapper present",
);
assertContains(
  stewardDocked,
  "ds-steward-layer--docked",
  "docked steward: layer carries --docked modifier",
);
assertContains(
  stewardDocked,
  "ds-steward--drawer",
  "docked steward: drawer-size leaf rendered",
);

section("Task 5 — steward negative control (no steward)");

const noStewardScreen = screen({
  name: "S",
  template: "studio",
  library: "ds",
  pageHeader: { title: "Catalog" },
  content: [],
});
assert(
  noStewardScreen.indexOf("ds-steward-layer") === -1,
  "no steward: no steward layer emitted",
);
assert(
  noStewardScreen.indexOf("screen--steward-docked") === -1,
  "no steward: no docked modifier",
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

process.stdout.write("\n---\n");
process.stdout.write("Passed: " + passed + "  Failed: " + failed + "\n");

if (failures.length) {
  process.stdout.write("\nFailed tests:\n");
  failures.forEach(function (f) {
    process.stdout.write("  - " + f + "\n");
  });
  process.exit(1);
} else {
  process.stdout.write("All tests passed.\n");
  process.exit(0);
}
