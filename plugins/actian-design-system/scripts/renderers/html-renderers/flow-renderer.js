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

  // -------------------------------------------------------------------------
  // Style builders for structured nodes
  // -------------------------------------------------------------------------

  var FONT_WEIGHT_MAP = {
    Regular: "400",
    Medium: "500",
    "Semi Bold": "600",
    SemiBold: "600",
    Bold: "700",
    Light: "300",
    Thin: "100",
    "Extra Bold": "800",
  };

  function buildFrameStyle(node) {
    var parts = [];
    var layout = node.layout || {};
    var sizing = node.sizing || {};

    // Flex layout
    if (layout.mode === "HORIZONTAL") {
      parts.push("display:flex", "flex-direction:row");
    } else if (layout.mode === "VERTICAL") {
      parts.push("display:flex", "flex-direction:column");
    }

    if (layout.spacing != null) {
      parts.push("gap:" + layout.spacing + "px");
    }

    // Primary axis alignment
    if (layout.primaryAxisAlignItems) {
      var alignMap = {
        SPACE_BETWEEN: "space-between",
        CENTER: "center",
        MIN: "flex-start",
        MAX: "flex-end",
      };
      var justifyVal = alignMap[layout.primaryAxisAlignItems];
      if (justifyVal) parts.push("justify-content:" + justifyVal);
    }

    // Counter axis alignment
    if (layout.counterAxisAlignItems) {
      var crossMap = {
        CENTER: "center",
        MIN: "flex-start",
        MAX: "flex-end",
      };
      var alignItemsVal = crossMap[layout.counterAxisAlignItems];
      if (alignItemsVal) parts.push("align-items:" + alignItemsVal);
    }

    if (layout.padding) {
      var p = layout.padding;
      if (Array.isArray(p)) {
        // [top, right, bottom, left]
        parts.push(
          "padding:" +
            (p[0] || 0) +
            "px " +
            (p[1] || 0) +
            "px " +
            (p[2] || 0) +
            "px " +
            (p[3] || 0) +
            "px",
        );
      } else if (typeof p === "object") {
        var t = p.top != null ? p.top : p.vertical != null ? p.vertical : 0;
        var r =
          p.right != null ? p.right : p.horizontal != null ? p.horizontal : 0;
        var b =
          p.bottom != null ? p.bottom : p.vertical != null ? p.vertical : 0;
        var l =
          p.left != null ? p.left : p.horizontal != null ? p.horizontal : 0;
        parts.push("padding:" + t + "px " + r + "px " + b + "px " + l + "px");
      } else {
        parts.push("padding:" + p + "px");
      }
    }

    // Horizontal sizing
    if (sizing.horizontal === "FILL") {
      parts.push("flex:1", "min-width:0");
    } else if (sizing.horizontal === "HUG") {
      // default — no extra CSS
    } else if (typeof sizing.horizontal === "number") {
      parts.push("width:" + sizing.horizontal + "px", "flex-shrink:0");
    } else if (node.width != null) {
      parts.push("width:" + node.width + "px");
    }

    // Vertical sizing
    if (sizing.vertical === "FILL") {
      parts.push("flex:1", "min-height:0");
    } else if (typeof sizing.vertical === "number") {
      parts.push("height:" + sizing.vertical + "px");
    } else if (node.height != null) {
      parts.push("height:" + node.height + "px");
    }

    // Fills
    if (node.fills && node.fills.length > 0) {
      parts.push("background:" + node.fills[0]);
    }

    // Corner radius
    if (node.cornerRadius != null) {
      if (typeof node.cornerRadius === "number") {
        parts.push("border-radius:" + node.cornerRadius + "px");
      } else if (typeof node.cornerRadius === "object") {
        var cr = node.cornerRadius;
        parts.push(
          "border-radius:" +
            (cr.topLeft || 0) +
            "px " +
            (cr.topRight || 0) +
            "px " +
            (cr.bottomRight || 0) +
            "px " +
            (cr.bottomLeft || 0) +
            "px",
        );
      }
    }

    // Stroke
    if (node.stroke) {
      var stroke = node.stroke;
      var weight = stroke.weight != null ? stroke.weight : 1;
      var color = stroke.color || "#000000";
      if (stroke.sides && typeof stroke.sides === "object") {
        if (stroke.sides.top)
          parts.push("border-top:" + weight + "px solid " + color);
        if (stroke.sides.right)
          parts.push("border-right:" + weight + "px solid " + color);
        if (stroke.sides.bottom)
          parts.push("border-bottom:" + weight + "px solid " + color);
        if (stroke.sides.left)
          parts.push("border-left:" + weight + "px solid " + color);
      } else {
        parts.push("border:" + weight + "px solid " + color);
      }
    }

    // Opacity
    if (node.opacity != null) {
      parts.push("opacity:" + node.opacity);
    }

    // Clips content
    if (node.clipsContent) {
      parts.push("overflow:hidden");
    }

    return parts.join(";");
  }

  function buildTextStyle(node) {
    var parts = [];

    // Font family + weight
    if (node.font) {
      var fontParts = node.font.split(":");
      var family = fontParts[0] ? fontParts[0].trim() : "Inter";
      var weightName = fontParts[1] ? fontParts[1].trim() : "Regular";
      var weight = FONT_WEIGHT_MAP[weightName] || "400";
      parts.push("font-family:" + family);
      parts.push("font-weight:" + weight);
    }

    if (node.size != null) {
      parts.push("font-size:" + node.size + "px");
    }

    if (node.color) {
      parts.push("color:" + node.color);
    }

    if (node.width != null) {
      parts.push("display:block", "width:" + node.width + "px");
      // Clamp overflow on fixed-width text so it can't blow out its container.
      // Multi-line text (contains \n) only clips; single-line text ellipsizes.
      // The renderer displays node.content; fall back to node.text for callers
      // (and the single-line unit test) that only supply node.text.
      var __txt = node.content != null ? node.content : node.text;
      var __multiline = typeof __txt === "string" && __txt.indexOf("\n") !== -1;
      if (__multiline) {
        parts.push("overflow:hidden");
      } else {
        parts.push(
          "overflow:hidden",
          "text-overflow:ellipsis",
          "white-space:nowrap",
        );
      }
    }

    if (node.letterSpacing != null) {
      parts.push("letter-spacing:" + node.letterSpacing + "px");
    }

    if (node.textAlign && node.textAlign.horizontal) {
      var align = node.textAlign.horizontal;
      if (align === "CENTER") parts.push("text-align:center");
      else if (align === "RIGHT") parts.push("text-align:right");
      else if (align === "LEFT") parts.push("text-align:left");
    }

    if (node.opacity != null) {
      parts.push("opacity:" + node.opacity);
    }

    return parts.join(";");
  }

  // -------------------------------------------------------------------------
  // renderContentNode — recursive structured node → HTML
  // -------------------------------------------------------------------------

  function renderContentNode(node) {
    if (!node) return "";

    switch (node.type) {
      case "FRAME": {
        var style = buildFrameStyle(node);
        var children = (node.children || []).map(renderContentNode).join("");
        return (
          '<div class="fm-frame" data-name="' +
          esc(node.name || "") +
          '"' +
          (style ? ' style="' + style + '"' : "") +
          ">" +
          children +
          "</div>"
        );
      }

      case "TEXT": {
        var style = buildTextStyle(node);
        return (
          '<span class="fm-text" data-name="' +
          esc(node.name || "") +
          '"' +
          (style ? ' style="' + style + '"' : "") +
          ">" +
          esc(node.content || "") +
          "</span>"
        );
      }

      case "INSTANCE": {
        return renderFMComponent(node);
      }

      case "ELLIPSE": {
        var bg = (node.fills && node.fills[0]) || "#CBD2E0";
        var ellipseStyle =
          "width:" +
          (node.width || 16) +
          "px;height:" +
          (node.height || 16) +
          "px;min-width:1px;min-height:1px;border-radius:50%;background:" +
          bg;
        if (node.opacity != null) ellipseStyle += ";opacity:" + node.opacity;
        return (
          '<div class="fm-ellipse" data-name="' +
          esc(node.name || "") +
          '" style="' +
          ellipseStyle +
          '"></div>'
        );
      }

      case "RECT": {
        var rectStyle =
          "width:" +
          (node.width || 32) +
          "px;height:" +
          (node.height || 32) +
          "px;min-width:1px;min-height:1px;";
        if (node.fills && node.fills[0])
          rectStyle += "background:" + node.fills[0] + ";";
        if (node.cornerRadius)
          rectStyle +=
            "border-radius:" +
            (typeof node.cornerRadius === "number"
              ? node.cornerRadius + "px"
              : "0") +
            ";";
        return (
          '<div class="fm-rect" data-name="' +
          esc(node.name || "") +
          '" style="' +
          rectStyle +
          '"></div>'
        );
      }

      case "DIVIDER": {
        return '<hr class="fm-divider">';
      }

      default: {
        // Unknown node type — render children if present, otherwise empty
        if (node.children && node.children.length) {
          return (node.children || []).map(renderContentNode).join("");
        }
        return "";
      }
    }
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
