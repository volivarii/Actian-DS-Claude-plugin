// scripts/html-renderers/ds-screen-tree.js
// Shared DS chrome-node builder and screen-tree builder (Task 2a).
//
// Exports:
//   appProfile(appHeaderType) → { theme, headerApp, navApp }
//   TEMPLATE_CHROME            — map of template name → { appHeaderType, hasSidebar }
//   resolveChrome(s)           → { appHeaderType, hasSidebar }
//   chromeNodes(chrome, sidebarConfig, pageHeaderConfig, headerConfig)
//                              → { header|null, sidebar|null, pageHeader|null }
//                                Pure DS INSTANCE node objects (no HTML).
//   screenTree(screen)         → FRAME node tree for the full DS screen.
//
// Design: all functions are ES5, CommonJS (no arrow functions, no transpile).
// This module is consumed by:
//   - flow-renderer.js   (HTML rendering, browser + Node)
//   - render-node-figma.js emit path (push, Node only)  [Task 2b]

"use strict";

// ---------------------------------------------------------------------------
// appProfile — maps DS app header type to theme + component axis values
// ---------------------------------------------------------------------------

// Global-header App type ∈ {Studio, Explorer, Admin}.
// Side-nav App ∈ {Studio, Admin} — Explorer reuses the Studio nav.
// Unknown/null falls back to Studio chrome + actian theme.
function appProfile(appHeaderType) {
  switch (appHeaderType) {
    case "Studio":
      return { theme: "studio", headerApp: "Studio", navApp: "Studio" };
    case "Explorer":
      return { theme: "explorer", headerApp: "Explorer", navApp: "Studio" };
    case "Administration":
    case "Admin":
      return { theme: "actian", headerApp: "Admin", navApp: "Admin" };
    default:
      return { theme: "actian", headerApp: "Studio", navApp: "Studio" };
  }
}

// ---------------------------------------------------------------------------
// App context injection
// ---------------------------------------------------------------------------
//
// This module runs in the browser as well as in Node (see the UMD dance in
// flow-renderer.js), so it cannot read app-context off disk itself. The caller
// injects it, the same way ds-html-map takes its icons and anatomy doc map.
//
// What it is for: each app's REAL navigation. app-context is the substrate's
// record of how Actian's products are actually laid out, and until this existed
// the render path had no way to reach it, so every screen of every app rendered
// the side-nav leaf's own four-item default ("Catalog, Pipelines, Connections,
// Settings"). Studio has seven items and none of them is Pipelines;
// Administration has eight; Explorer declares none at all.
var APP_CONTEXT = null;

function setAppContext(ctx) {
  APP_CONTEXT = ctx || null;
}

// The app a template speaks for, or null when the template describes a shape
// rather than a product. `administration` is here because TEMPLATE_CHROME only
// ever had `admin`, so a screen authored with the full app name fell through to
// no chrome at all.
var TEMPLATE_APP = {
  studio: "studio",
  explorer: "explorer",
  admin: "administration",
  administration: "administration",
};

// The app's sidebar labels, or null when we cannot ground them.
//
// null and [] mean different things and the caller must keep them apart:
//   []   the app is on record as having no side rail (Explorer)
//   null no app context was injected, so we do not know
// Neither is an invitation to fall back to the leaf's default. A rail we cannot
// ground is a rail we should not draw: four invented items read as product
// truth to anyone looking at the screen.
function appSidebarLabels(templateName) {
  var appKey = TEMPLATE_APP[templateName];
  if (!appKey) return null;
  if (!APP_CONTEXT || !APP_CONTEXT.apps || !APP_CONTEXT.apps[appKey]) {
    return null;
  }
  var entries = APP_CONTEXT.apps[appKey].sidebar;
  if (!Array.isArray(entries)) return null;
  var labels = [];
  for (var i = 0; i < entries.length; i++) {
    var label = entries[i] && entries[i].label;
    if (label) labels.push(label);
  }
  return labels;
}

// ---------------------------------------------------------------------------
// TEMPLATE_CHROME + resolveChrome
// ---------------------------------------------------------------------------

var TEMPLATE_CHROME = {
  admin: { appHeaderType: "Administration", hasSidebar: true },
  studio: { appHeaderType: "Studio", hasSidebar: true },
  explorer: { appHeaderType: "Explorer", hasSidebar: true },
  "no-sidebar": { appHeaderType: "Studio", hasSidebar: false },
  bare: { appHeaderType: null, hasSidebar: false },
  mobile: { appHeaderType: null, hasSidebar: false },
  tablet: { appHeaderType: null, hasSidebar: false },
  compact: { appHeaderType: null, hasSidebar: false },
  custom: { appHeaderType: null, hasSidebar: false },
};

function resolveChrome(s) {
  var tpl = s.template;

  // `administration` was never in TEMPLATE_CHROME, only `admin`, so a screen
  // authored with the app's full name got no chrome at all. Resolve the alias
  // before the lookup rather than adding a second entry that could drift.
  var tplKey =
    tpl === "administration" && !TEMPLATE_CHROME[tpl] ? "admin" : tpl;

  if (tplKey && TEMPLATE_CHROME[tplKey]) {
    var base = TEMPLATE_CHROME[tplKey];
    var labels = appSidebarLabels(tpl);

    // A template that names a real app defers to app-context on whether that
    // app has a rail, because app-context is the record of how the product is
    // laid out and this table is a hand-kept restatement of it. `labels` is
    // null when the template names no app or nothing was injected; then the
    // table stands, which keeps every existing non-app template unchanged.
    // Precedence: an authored screen wins. app-context is the DEFAULT for a
    // screen that says nothing about its rail, never an override of one that
    // does. A screen carrying `sidebar: { items: [...] }` has stated its own
    // navigation and must render it, including on an app the substrate records
    // as having no rail. Missing this is what suppressed the rail on the
    // explorer golden, which authors two items of its own.
    var authored =
      s.sidebar &&
      typeof s.sidebar === "object" &&
      ((Array.isArray(s.sidebar.items) && s.sidebar.items.length > 0) ||
        (Array.isArray(s.sidebar.groups) && s.sidebar.groups.length > 0));

    if (labels !== null && !authored) {
      return {
        appHeaderType: base.appHeaderType,
        hasSidebar: labels.length > 0,
        sidebarLabels: labels,
      };
    }
    return base;
  }

  // Backward compat: derive from legacy s.appHeader / s.sidebar
  return {
    appHeaderType: s.appHeader || null,
    hasSidebar: !!s.sidebar,
  };
}

// ---------------------------------------------------------------------------
// chromeNodes — build DS INSTANCE node objects for chrome components
// ---------------------------------------------------------------------------
//
// Returns { header, sidebar, pageHeader } where each is either a DS INSTANCE
// node (type:"INSTANCE", library:"ds", dsSlug, variant, props) or null when
// that chrome element is absent. No HTML is produced here; the caller passes
// these nodes to renderDSComponent (HTML) or emitInstance (Figma).

function chromeNodes(chrome, sidebarConfig, pageHeaderConfig, headerConfig) {
  var prof = appProfile(chrome.appHeaderType);

  // --- header ---
  var header = null;
  if (chrome.appHeaderType) {
    var c = headerConfig || {};
    header = {
      type: "INSTANCE",
      library: "ds",
      dsSlug: "global-header",
      variant: "App type=" + prof.headerApp + ", Breakpoints=XL",
      props: {
        App: prof.headerApp,
        Search: c.search !== false,
        Account: c.account || "JD",
        Context: c.context || "Catalog",
        ContextValue: c.contextValue || "Default",
      },
      sizing: { horizontal: "FILL" },
    };
  }

  // --- sidebar ---
  var sidebar = null;
  if (chrome.hasSidebar) {
    var sc = sidebarConfig || {};
    var active = sc.activeItem ? sc.activeItem : "";
    var sidebarProps = {};

    if (Array.isArray(sc.groups) && sc.groups.length) {
      // Groups branch: structured sidebar with icon groups
      sidebarProps = { Groups: JSON.stringify(sc.groups) };
      if (active) sidebarProps.Active = active;
    } else {
      // Items branch: either icon-bearing item objects or plain string labels
      var labels = [];
      var hasIcon = false;
      var items = [];
      if (Array.isArray(sc.items)) {
        for (var i = 0; i < sc.items.length; i++) {
          var entry = sc.items[i];
          var label =
            typeof entry === "string" ? entry : (entry && entry.label) || "";
          var icon = entry && typeof entry === "object" ? entry.icon : null;
          if (label) labels.push(label);
          if (icon) hasIcon = true;
          if (label) items.push({ label: label, icon: icon || null });
          if (
            !active &&
            entry &&
            entry.state &&
            String(entry.state).toLowerCase() === "on"
          ) {
            active = label;
          }
        }
      }
      if (hasIcon) {
        sidebarProps.Groups = JSON.stringify([{ items: items }]);
      } else if (labels.length) {
        sidebarProps.Items = labels.join(", ");
      } else if (chrome.sidebarLabels && chrome.sidebarLabels.length) {
        // Nothing authored on the screen, but the app is on record. Use the
        // product's own navigation rather than letting the leaf fall back to
        // its four-item default, which belongs to no app.
        sidebarProps.Items = chrome.sidebarLabels.join(", ");
      }
      // No else. When nothing is grounded the props stay empty and the leaf
      // uses its own default, which is what happened before this change and is
      // wrong. It is left alone deliberately: sending `Items: ""` does not stop
      // it (parseItems treats empty as absent, verified), and suppressing the
      // rail here would change the Figma emit path too, which does not inject.
      // The place this is made safe is the guard: a test asserts the real
      // assembler path renders the app's OWN labels, so a broken injection
      // fails CI rather than quietly reinstating the four invented items.
      if (active) sidebarProps.Active = active;
    }

    sidebar = {
      type: "INSTANCE",
      library: "ds",
      dsSlug: "side-nav",
      variant: "App=" + prof.navApp + ", View=Expanded",
      props: sidebarProps,
      sizing: { vertical: "FILL" },
    };
  }

  // --- pageHeader ---
  var pageHeader = null;
  if (pageHeaderConfig) {
    pageHeader = {
      type: "INSTANCE",
      library: "ds",
      dsSlug: "page-header",
      variant: "Type=Default",
      props: {
        Title: pageHeaderConfig.title,
        Description: pageHeaderConfig.subtitle,
        Actions: pageHeaderConfig.actions,
      },
      sizing: { horizontal: "FILL" },
    };
  }

  return { header: header, sidebar: sidebar, pageHeader: pageHeader };
}

// ---------------------------------------------------------------------------
// screenTree — build the full FRAME node tree for a DS hi-fi screen
// ---------------------------------------------------------------------------
//
// Mirrors the HTML .screen structure (flow-renderer.js L427-535) as a Figma
// node tree for whole-tree emit. Shape (from task-2 brief):
//
//   FRAME screen  (width 1440 FIXED, VERTICAL, height HUGS, min-height 960)
//   ├─ INSTANCE global-header   (sizing.horizontal FILL)  [if chrome.appHeaderType]
//   └─ FRAME body (HORIZONTAL, sizing.horizontal FILL, sizing.vertical FILL)
//      ├─ INSTANCE side-nav     (sizing.vertical FILL)    [if chrome.hasSidebar]
//      └─ FRAME content (VERTICAL, sizing.horizontal FILL)
//         ├─ INSTANCE page-header (sizing.horizontal FILL) [if screen.pageHeader]
//         └─ FRAME content-area (VERTICAL, padding 24, sizing.horizontal FILL)
//              └─ ...screen.content[]
//
// Note: steward overlay/docked is an edge case deferred to later; a
// steward-bearing screen should fall back to the existing path or omit the
// steward in v1.

function screenTree(s) {
  var chrome = resolveChrome(s);
  var sidebarConfig = s.sidebar || {
    items: s.navItems || 6,
    activeItem: s.activeNavItem || null,
  };
  var nodes = chromeNodes(
    chrome,
    sidebarConfig,
    s.pageHeader || null,
    s.header || null,
  );

  // App-shell spacing recipe. The DS Kit page-header component ships with
  // padding [0,0,0,0] — it does NOT carry its own surrounding spacing — so the
  // composition recipe must inset the content region. Values are the shared
  // --zen spacing tokens (lg=24, xl=32), mirrored by the HTML reference rules
  // `.screen__content` / `.screen__content-area` / `.ds-page-header` so Figma
  // and HTML stay consistent.
  var SP_LG = 24; // --zen-spacing-lg
  var SP_XL = 32; // --zen-spacing-xl

  // Content-area frame (innermost). No padding of its own: the content frame
  // provides the region inset; real content[] is a single wrapping frame
  // carrying its own layout.spacing (see fixtures/twin-emit/*.content.json).
  var contentArea = {
    type: "FRAME",
    name: "content-area",
    layout: { mode: "VERTICAL" },
    sizing: { horizontal: "FILL" },
    children: s.content || [],
  };

  // Content frame: page-header (if present) + content-area. The region padding
  // (lg vertical / xl horizontal) gives the zero-padding page-header band a top
  // gap from the global header and a horizontal inset that aligns its title
  // with the content below; the lg item-spacing separates the band from the
  // content.
  var contentChildren = [];
  if (nodes.pageHeader) {
    contentChildren.push(nodes.pageHeader);
  }
  contentChildren.push(contentArea);

  var contentFrame = {
    type: "FRAME",
    name: "content",
    layout: {
      mode: "VERTICAL",
      padding: { top: SP_LG, right: SP_XL, bottom: SP_LG, left: SP_XL },
      spacing: SP_LG,
    },
    sizing: { horizontal: "FILL" },
    children: contentChildren,
  };

  // Body frame: sidebar (if present) + content
  var bodyChildren = [];
  if (nodes.sidebar) {
    bodyChildren.push(nodes.sidebar);
  }
  bodyChildren.push(contentFrame);

  var bodyFrame = {
    type: "FRAME",
    name: "body",
    layout: { mode: "HORIZONTAL" },
    sizing: { horizontal: "FILL", vertical: "FILL" },
    children: bodyChildren,
  };

  // Root screen frame
  var rootChildren = [];
  if (nodes.header) {
    rootChildren.push(nodes.header);
  }
  rootChildren.push(bodyFrame);

  return {
    type: "FRAME",
    name: s.name || "Screen",
    layout: { mode: "VERTICAL" },
    sizing: { horizontal: 1440 },
    minHeight: 960,
    children: rootChildren,
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  appProfile: appProfile,
  setAppContext: setAppContext,
  TEMPLATE_APP: TEMPLATE_APP,
  TEMPLATE_CHROME: TEMPLATE_CHROME,
  resolveChrome: resolveChrome,
  chromeNodes: chromeNodes,
  screenTree: screenTree,
};
