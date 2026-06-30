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
  if (s.template && TEMPLATE_CHROME[s.template]) {
    return TEMPLATE_CHROME[s.template];
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
        Account: c.account || "VO",
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
      }
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

  // Content-area frame (innermost)
  // Padding mirrors the HTML reference `.screen__content-area` (24px 32px:
  // 24 vertical / 32 horizontal) so the Figma push and the HTML deliverable
  // share the same content inset. Inter-item spacing is intentionally NOT set
  // here: real content[] is a single wrapping frame carrying its own
  // layout.spacing (see fixtures/twin-emit/*.content.json), matching the
  // HTML content-area which has no gap.
  var contentArea = {
    type: "FRAME",
    name: "content-area",
    layout: { mode: "VERTICAL", padding: { vertical: 24, horizontal: 32 } },
    sizing: { horizontal: "FILL" },
    children: s.content || [],
  };

  // Content frame: page-header (if present) + content-area
  var contentChildren = [];
  if (nodes.pageHeader) {
    contentChildren.push(nodes.pageHeader);
  }
  contentChildren.push(contentArea);

  var contentFrame = {
    type: "FRAME",
    name: "content",
    layout: { mode: "VERTICAL" },
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
  TEMPLATE_CHROME: TEMPLATE_CHROME,
  resolveChrome: resolveChrome,
  chromeNodes: chromeNodes,
  screenTree: screenTree,
};
