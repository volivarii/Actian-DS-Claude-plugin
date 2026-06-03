// scripts/html-renderers/flow-renderer.js
// Client-side renderer for generate-flow screen chrome.
// Reads flow-data.json from #spec-data, builds screen frames into #flow-container.
// The AI writes either contentHtml (legacy) or content[] (structured nodes).

(function () {
  "use strict";

  // -------------------------------------------------------------------------
  // Shared functions from fm-html-map (loaded via <script> in browser, require in Node)
  // -------------------------------------------------------------------------

  var fmMap =
    (typeof window !== "undefined" && window.fmHtmlMap) ||
    (typeof require !== "undefined" && require("./fm-html-map")) ||
    {};
  var esc =
    fmMap.esc ||
    function (str) {
      if (str == null) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    };
  var parseVariant =
    fmMap.parseVariant ||
    function () {
      return {};
    };
  var renderFMComponent =
    fmMap.renderFMComponent ||
    function () {
      return "";
    };

  // Shared structural-node renderer (single source of truth for the
  // Figma-node → HTML mapping). Resolved the same way as fm-html-map.
  var nodeRenderer =
    (typeof window !== "undefined" && window.renderNode) ||
    (typeof require !== "undefined" && require("./render-node.js")) ||
    {};

  // -------------------------------------------------------------------------
  // Style builders — delegate to the shared module (re-exported below so
  // existing callers/tests that reach for flow.buildFrameStyle etc. resolve).
  // -------------------------------------------------------------------------

  function buildFrameStyle(node) {
    return nodeRenderer.buildFrameStyle(node);
  }

  function buildTextStyle(node) {
    return nodeRenderer.buildTextStyle(node, { defaultFont: "Inter" });
  }

  // -------------------------------------------------------------------------
  // renderContentNode — recursive structured node → HTML.
  // Now a thin wrapper over the shared render-node.js module (flow uses the
  // Inter default font). The function name + export are kept so existing
  // callers/tests continue to resolve.
  // -------------------------------------------------------------------------

  function renderContentNode(node) {
    return nodeRenderer.renderNode(node, { defaultFont: "Inter" });
  }

  // -------------------------------------------------------------------------
  // Chrome helpers
  // -------------------------------------------------------------------------

  var genCard =
    fmMap.genCard ||
    function () {
      return "";
    };

  function appHeader(type) {
    var labels = {
      Studio: "Studio",
      Explorer: "Explorer",
      Administration: "Administration",
      Actian: "Actian",
    };
    var label = labels[type] || "Studio";
    return (
      '<div class="fm-app-header" data-name="App header">' +
      '<div class="fm-app-header__logo"></div>' +
      '<div class="fm-app-header__label">' +
      esc(label) +
      "</div>" +
      '<div class="fm-app-header__spacer"></div>' +
      '<div class="fm-app-header__avatar"></div>' +
      "</div>"
    );
  }

  function sidebar(config) {
    if (!config) return "";
    var items = "";
    var total = config.items || 6;
    for (var i = 0; i < total; i++) {
      if (i === 0 && config.activeItem) {
        items +=
          '<div class="fm-nav-item fm-nav-item--active" data-name="' +
          esc(config.activeItem) +
          '">' +
          '<div class="fm-nav-item__icon"></div>' +
          '<div class="fm-nav-item__label">' +
          esc(config.activeItem) +
          "</div>" +
          "</div>";
      } else {
        items +=
          '<div class="fm-nav-item fm-nav-item--placeholder">' +
          '<div class="fm-nav-item__icon"></div>' +
          '<div class="fm-nav-item__bar"></div>' +
          "</div>";
      }
    }
    return '<div class="fm-sidebar" data-name="Sidebar">' + items + "</div>";
  }

  function pageHeader(config) {
    if (!config) return "";
    var html =
      '<div class="fm-page-header" data-name="Page header">' +
      '<div class="fm-page-header__title">' +
      esc(config.title) +
      "</div>";
    if (config.subtitle)
      html +=
        '<div class="fm-page-header__subtitle">' +
        esc(config.subtitle) +
        "</div>";
    if (config.actions && config.actions.length) {
      html += '<div class="fm-page-header__actions">';
      config.actions.forEach(function (a) {
        html +=
          '<div class="fm-button fm-button--primary">' + esc(a) + "</div>";
      });
      html += "</div>";
    }
    html += "</div>";
    return html;
  }

  // -------------------------------------------------------------------------
  // Template → chrome config resolution
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Tier badge
  // -------------------------------------------------------------------------

  function tierBadge(s) {
    if (!s.tier) return "";
    var num = s.tier === "recognized" ? 1 : s.tier === "adapted" ? 2 : 3;
    var conf = typeof s.confidence === "number" ? s.confidence.toFixed(2) : "?";
    var recipe =
      s.matchedRecipe ||
      (s.composition && s.composition.length
        ? s.composition.join("+")
        : "custom");
    var hasJustification = s.justification ? "yes" : "no";
    var title =
      "tier " +
      num +
      " • " +
      recipe +
      " • conf " +
      conf +
      " • justification: " +
      hasJustification;
    return (
      '<span class="tier-badge" data-tier="' +
      esc(s.tier) +
      '" title="' +
      esc(title) +
      '">tier ' +
      num +
      "</span>"
    );
  }

  // -------------------------------------------------------------------------
  // Screen renderer
  // -------------------------------------------------------------------------

  function screen(s) {
    var type = s.type || "standard";
    var w = 1440;
    var h = type === "compact" ? 700 : 960;

    var chrome = resolveChrome(s);

    // Render content — prefer structured content[] over legacy contentHtml
    var contentHtml = "";
    if (s.content && s.content.length) {
      contentHtml = s.content.map(renderContentNode).join("");
    } else {
      contentHtml = s.contentHtml || "";
    }

    // Bare/mobile/tablet/compact/custom → no chrome wrapper
    var template = s.template || "";
    if (
      template === "bare" ||
      template === "mobile" ||
      template === "tablet" ||
      template === "compact" ||
      template === "custom"
    ) {
      return (
        '<div class="screen screen--' +
        esc(template) +
        '" data-name="' +
        esc(s.name) +
        '" style="width:' +
        w +
        "px;height:" +
        h +
        'px;">' +
        tierBadge(s) +
        contentHtml +
        "</div>"
      );
    }

    var headerHtml = chrome.appHeaderType
      ? appHeader(chrome.appHeaderType)
      : "";
    var sidebarConfig = s.sidebar || {
      items: s.navItems || 6,
      activeItem: s.activeNavItem || null,
    };
    var sidebarHtml = chrome.hasSidebar ? sidebar(sidebarConfig) : "";

    return (
      '<div class="screen" data-name="' +
      esc(s.name) +
      '" style="width:' +
      w +
      "px;height:" +
      h +
      'px;">' +
      headerHtml +
      '<div class="screen__body">' +
      sidebarHtml +
      '<div class="screen__content">' +
      pageHeader(s.pageHeader) +
      '<div class="screen__content-area">' +
      tierBadge(s) +
      contentHtml +
      "</div>" +
      "</div></div></div>"
    );
  }

  // -------------------------------------------------------------------------
  // Entry Point
  // -------------------------------------------------------------------------

  // Reads the same flat format as flow-to-figma.js: { meta, screens[] }
  // No flows[] wrapper needed.

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", function () {
      var dataEl = document.getElementById("spec-data");
      if (!dataEl) return;
      var data = JSON.parse(dataEl.textContent);
      var container = document.getElementById("flow-container");
      if (!container) return;

      var meta = data.meta || {};
      var screens = data.screens || [];
      var flowName = meta.feature || meta.flow || "Flow";

      // Cover card uses meta fields directly
      var coverHtml =
        '<div class="screen cover-card" data-name="Cover: ' +
        esc(flowName) +
        '">' +
        '<div class="cover-card__content">' +
        '<div class="cover-card__label">FEATURE</div>' +
        '<div class="cover-card__title">' +
        esc(flowName) +
        "</div>" +
        '<div class="cover-card__meta">' +
        "<div>User: " +
        esc(meta.user || "User") +
        "</div>" +
        "<div>Screens: " +
        screens.length +
        "</div>" +
        "</div></div></div>";

      var html = genCard(meta) + coverHtml;
      screens.forEach(function (s) {
        html += screen(s);
      });
      container.innerHTML =
        '<div class="flow-row" data-name="Flow: ' +
        esc(flowName) +
        '">' +
        html +
        "</div>";
    });
  }

  // -------------------------------------------------------------------------
  // Test exports (browser only)
  // -------------------------------------------------------------------------

  if (typeof window !== "undefined") {
    window._testExports = {
      renderContentNode: renderContentNode,
      renderFMComponent: renderFMComponent,
      parseVariant: parseVariant,
      buildFrameStyle: buildFrameStyle,
      buildTextStyle: buildTextStyle,
      resolveChrome: resolveChrome,
      tierBadge: tierBadge,
      screen: screen,
    };
  }

  // -------------------------------------------------------------------------
  // Node exports (UMD tail — mirrors fm-html-map.js; browser behavior above is
  // untouched, so this file still works inlined by assemble-preview.js)
  // -------------------------------------------------------------------------

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      renderContentNode: renderContentNode,
      renderFMComponent: renderFMComponent,
      parseVariant: parseVariant,
      buildFrameStyle: buildFrameStyle,
      buildTextStyle: buildTextStyle,
      resolveChrome: resolveChrome,
      tierBadge: tierBadge,
      screen: screen,
    };
  }
})();
