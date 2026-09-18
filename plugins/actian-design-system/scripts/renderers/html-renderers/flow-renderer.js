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
    (typeof require !== "undefined" &&
      require("../../lib/renderer.js").fmHtmlMap) ||
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

  // Hi-fi DS leaf map — used to render real DS chrome (global-header, side-nav,
  // page-header) for screens flagged library:"ds". Resolved the same dual-context
  // way; inert for lo-fi screens (the FM chrome path never touches it).
  var dsMap =
    (typeof window !== "undefined" && window.dsHtmlMap) ||
    (typeof require !== "undefined" &&
      require("../../lib/renderer.js").dsHtmlMap) ||
    {};

  // DS screen-tree builder — single source of truth for chrome node shapes,
  // consumed by both this HTML renderer and the Figma emitter (Task 2b).
  var chromeTree =
    (typeof window !== "undefined" && window.dsScreenTree) ||
    (typeof require !== "undefined" && require("./ds-screen-tree.js")) ||
    {};

  // resolveChrome is re-exported below for backward-compat with existing tests
  // and the FM chrome path; it's an alias of the shared implementation.
  var resolveChrome =
    chromeTree.resolveChrome ||
    function (s) {
      return { appHeaderType: s.appHeader || null, hasSidebar: !!s.sidebar };
    };

  function renderDS(slug, variant, props) {
    if (typeof dsMap.renderDSComponent !== "function") return "";
    return dsMap.renderDSComponent({
      type: "INSTANCE",
      library: "ds",
      dsSlug: slug,
      variant: variant || "",
      props: props || {},
    });
  }

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

  function navItemHtml(label, active) {
    // Keep each class attribute a complete string literal (never split a
    // class list across a ternary/concatenation) so the css-staleness
    // extractor doesn't capture stray expression tokens.
    var open = active
      ? '<div class="fm-nav-item fm-nav-item--active" data-name="'
      : '<div class="fm-nav-item" data-name="';
    return (
      open +
      esc(label) +
      '">' +
      '<div class="fm-nav-item__icon"></div>' +
      '<div class="fm-nav-item__label">' +
      esc(label) +
      "</div>" +
      "</div>"
    );
  }

  function sidebar(config) {
    if (!config) return "";
    var items = "";
    // Rich shape: config.items is an array of nav entries (string or
    // { label, state }). Render real labels — active = On-state or a label
    // matching config.activeItem (the generator passes a slug/id, so compare
    // case-insensitively). Falls back to the legacy count shape below.
    if (Array.isArray(config.items)) {
      for (var j = 0; j < config.items.length; j++) {
        var entry = config.items[j] || {};
        var label = typeof entry === "string" ? entry : entry.label || "";
        var onState =
          entry && entry.state && String(entry.state).toLowerCase() === "on";
        var matchesActive =
          config.activeItem &&
          label &&
          String(label).toLowerCase() ===
            String(config.activeItem).toLowerCase();
        items += navItemHtml(label, !!(onState || matchesActive));
      }
      return '<div class="fm-sidebar" data-name="Sidebar">' + items + "</div>";
    }
    // Legacy shape: numeric placeholder count + one labeled active item.
    var total = config.items || 6;
    for (var i = 0; i < total; i++) {
      if (i === 0 && config.activeItem) {
        items += navItemHtml(config.activeItem, true);
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
        // Actions arrive as a bare label string or a { label, variant } object.
        var label = typeof a === "string" ? a : (a && a.label) || "";
        html +=
          '<div class="fm-button fm-button--primary">' + esc(label) + "</div>";
      });
      html += "</div>";
    }
    html += "</div>";
    return html;
  }

  // -------------------------------------------------------------------------
  // Screen renderer
  // -------------------------------------------------------------------------

  // Chrome-aware loading placeholder for a screen whose content has not been
  // generated yet (status === "pending"). Deterministic markup (no timestamps/
  // randomness) so goldens stay stable; the shimmer is pure CSS animation.
  function skeletonBody(s) {
    return (
      '<div class="fm-skeleton" data-name="Loading">' +
      '<div class="fm-skeleton__caption">' +
      esc(s.name || "Screen") +
      "</div>" +
      '<div class="fm-skeleton__block fm-skeleton__block--title"></div>' +
      '<div class="fm-skeleton__block fm-skeleton__block--line"></div>' +
      '<div class="fm-skeleton__block fm-skeleton__block--line"></div>' +
      '<div class="fm-skeleton__block fm-skeleton__block--wide"></div>' +
      "</div>"
    );
  }

  // hasChrome — true unless the screen's template is one of the no-chrome
  // templates (bare/mobile/tablet/compact/custom), which screen() renders
  // with no header/sidebar wrapper at all. A "does this template take the
  // chrome wrapper?" question, not "did a header actually render?" (a
  // template screen() doesn't recognize also answers true here, though no
  // header renders for it) — renderLayered() does NOT reuse this check to
  // size a layer's header offset; it reads the base's own rendered HTML
  // instead, because that question needs the second answer, not this one.
  function hasChrome(s) {
    var template = s.template || "";
    return (
      template !== "bare" &&
      template !== "mobile" &&
      template !== "tablet" &&
      template !== "compact" &&
      template !== "custom"
    );
  }

  function screen(s) {
    var type = s.type || "standard";
    var w = 1440;
    var h = type === "compact" ? 700 : 960;

    var chrome = resolveChrome(s);

    var isPending = s.status === "pending";

    // Render content — skeleton when pending, else structured content[] over
    // legacy contentHtml.
    var contentHtml = "";
    if (isPending) {
      contentHtml = skeletonBody(s);
    } else if (s.content && s.content.length) {
      contentHtml = s.content.map(renderContentNode).join("");
    } else {
      contentHtml = s.contentHtml || "";
    }
    var pendingClass = isPending ? " screen--pending" : "";

    // Bare/mobile/tablet/compact/custom → no chrome wrapper
    var template = s.template || "";
    if (!hasChrome(s)) {
      return (
        '<div class="screen screen--' +
        esc(template) +
        pendingClass +
        '" data-name="' +
        esc(s.name) +
        '" style="width:' +
        w +
        "px;height:" +
        h +
        'px;">' +
        contentHtml +
        "</div>"
      );
    }

    var sidebarConfig = s.sidebar || {
      items: s.navItems || 6,
      activeItem: s.activeNavItem || null,
    };

    // Hi-fi branch: route chrome through the real DS leaves + theme the wrapper.
    // Same structural skeleton as the FM path (.screen__body / .screen__content /
    // .screen__content-area) so the layout CSS is shared; only the chrome leaves
    // and the data-theme / screen--hifi additions differ. The lo-fi path below
    // is untouched.
    if (s.library === "ds") {
      // Build chrome nodes via the shared builder (ds-screen-tree.js), then
      // render each to HTML via dsMap.renderDSComponent. This keeps the node
      // shape single-sourced for both HTML rendering and Figma emit (Task 2b).
      var dsNodes = chromeTree.chromeNodes(
        chrome,
        sidebarConfig,
        s.pageHeader || null,
        s.header || null,
      );
      var dsHeaderHtml = dsNodes.header
        ? dsMap.renderDSComponent(dsNodes.header)
        : "";
      var dsSidebarHtml = dsNodes.sidebar
        ? dsMap.renderDSComponent(dsNodes.sidebar)
        : "";
      var dsPageHeaderHtml = dsNodes.pageHeader
        ? dsMap.renderDSComponent(dsNodes.pageHeader)
        : "";

      // Build the shared inner chrome + content markup (header + body) once.
      var dsInnerHtml =
        dsHeaderHtml +
        '<div class="screen__body">' +
        dsSidebarHtml +
        '<div class="screen__content">' +
        dsPageHeaderHtml +
        '<div class="screen__content-area">' +
        contentHtml +
        "</div>" +
        "</div></div>";

      // Per-screen data attributes (theme, name, dimensions). The closing
      // double-quote of the class attribute is written inline in each return
      // below so the css-staleness regex terminates the capture cleanly
      // and never crosses into the next tag.
      var dsProf = chromeTree.appProfile(chrome.appHeaderType);
      var dsTheme = esc(dsProf.theme);
      var dsName = esc(s.name);
      var dsDims = "width:" + w + "px;height:" + h + "px;";

      // Steward descriptor — if present, build and wrap.
      var st = s.steward;
      if (st) {
        // st.size/st.state are flow-data; the leaf only compares them (never
        // writes them to HTML), but esc() defensively against a future direct use.
        var stSize = esc(
          st.size || (st.mode === "docked" ? "Drawer" : "Default"),
        );
        var stState = esc(st.state || "Answered");
        var stewardHtml = renderDS(
          "chat-with-ai-steward",
          "size=" + stSize + ", State=" + stState,
          {
            Title: st.title,
            State: st.state,
            Insight: st.insight,
            Source: st.source,
            Confidence: st.confidence,
            Context: st.context,
            Greeting: st.greeting,
          },
        );
        if (st.mode === "docked") {
          // 3-column reflow: screen__shell holds main-frame + docked steward layer.
          return (
            '<div class="screen screen--hifi screen--steward-docked' +
            pendingClass +
            '" data-theme="' +
            dsTheme +
            '" data-name="' +
            dsName +
            '" style="' +
            dsDims +
            '">' +
            '<div class="screen__shell">' +
            '<div class="screen__main-frame">' +
            dsInnerHtml +
            "</div>" +
            '<div class="ds-steward-layer ds-steward-layer--docked">' +
            stewardHtml +
            "</div>" +
            "</div>" +
            "</div>"
          );
        } else {
          // Overlay: keep original screen structure, append fixed layer inside.
          return (
            '<div class="screen screen--hifi' +
            pendingClass +
            '" data-theme="' +
            dsTheme +
            '" data-name="' +
            dsName +
            '" style="' +
            dsDims +
            '">' +
            dsInnerHtml +
            '<div class="ds-steward-layer ds-steward-layer--overlay">' +
            stewardHtml +
            "</div>" +
            "</div>"
          );
        }
      }

      // No steward — emit the unchanged original markup.
      return (
        '<div class="screen screen--hifi' +
        pendingClass +
        '" data-theme="' +
        dsTheme +
        '" data-name="' +
        dsName +
        '" style="' +
        dsDims +
        '">' +
        dsInnerHtml +
        "</div>"
      );
    }

    var headerHtml = chrome.appHeaderType
      ? appHeader(chrome.appHeaderType)
      : "";
    var sidebarHtml = chrome.hasSidebar ? sidebar(sidebarConfig) : "";

    return (
      '<div class="screen' +
      pendingClass +
      '" data-name="' +
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
      contentHtml +
      "</div>" +
      "</div></div></div>"
    );
  }

  // -------------------------------------------------------------------------
  // renderLayered renders a screen carrying `layer:{kind,over}` (Task 6.1
  // schema) as a surface (modal/drawer/toast/panel) floating over its base
  // screen. The base renders byte-identically underneath via screen(), and
  // the layer screen's own content[] is the layer body only (never mixed
  // with the base's content). FRAME/INSTANCE roots inside the body already
  // carry data-goto/flow-adds/data-adds via renderContentNode → render-node.js.
  // -------------------------------------------------------------------------

  function renderLayered(layerScreen, baseScreen) {
    var kind = (layerScreen.layer && layerScreen.layer.kind) || "";
    var isPending = layerScreen.status === "pending";
    var body;
    if (isPending) {
      body = skeletonBody(layerScreen);
    } else if (layerScreen.content && layerScreen.content.length) {
      body = layerScreen.content.map(renderContentNode).join("");
    } else {
      body = layerScreen.contentHtml || "";
    }
    var root = (layerScreen.content && layerScreen.content[0]) || null;
    var declaredWidth =
      root && root.sizing && typeof root.sizing.horizontal === "number"
        ? root.sizing.horizontal
        : null;
    // The captured surface knows its own width (studio-quick-edit-drawer is
    // 550): a stylesheet constant narrower than that clips the layer's action
    // row, because .screen--layered hides overflow. Cap at the frame so a
    // wider-than-the-page layer still fits.
    var bodyStyle = declaredWidth
      ? ' style="width:' + Math.min(declaredWidth, 1440) + 'px"'
      : "";
    // The layer must dock below whatever header the base actually renders,
    // not below what its template NAME implies: a base with no template, or
    // one screen() doesn't recognize, renders no header at all even though
    // hasChrome() (a "does this template take the chrome wrapper?" check)
    // would call it chromed; and an FM base's header is 70px tall where the
    // DS header is 64px, so one constant is wrong for one of the two. Render
    // the base once and read the offset off its own markup instead of
    // guessing from the template name.
    var baseHtml = screen(baseScreen);
    var headerPx =
      baseHtml.indexOf('class="ds-header"') !== -1
        ? 64
        : baseHtml.indexOf('class="fm-app-header"') !== -1
          ? 70
          : 0;
    var outerStyle = ' style="--flow-app-header:' + headerPx + 'px"';
    return (
      '<div class="screen screen--layered" data-name="' +
      esc(layerScreen.name || "") +
      '"' +
      outerStyle +
      ">" +
      '<div class="flow-layer-base">' +
      baseHtml +
      "</div>" +
      '<div class="flow-layer flow-layer--' +
      esc(kind) +
      '">' +
      (kind === "modal" ? '<div class="flow-layer__scrim"></div>' : "") +
      '<div class="flow-layer__body"' +
      bodyStyle +
      ">" +
      body +
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
      var screenById = {};
      screens.forEach(function (s) {
        if (s.id) screenById[s.id] = s;
      });
      screens.forEach(function (s) {
        // A layered screen whose `over` target is missing renders as a
        // plain screen rather than throwing; the validator (Task 6.2)
        // already reports the missing target as an error.
        if (s.layer && screenById[s.layer.over]) {
          html += renderLayered(s, screenById[s.layer.over]);
        } else {
          html += renderScreen(s);
        }
      });
      container.innerHTML =
        '<div class="flow-row" data-name="Flow: ' +
        esc(flowName) +
        '">' +
        html +
        "</div>";
    });
  }

  // Canonical shared name. renderScreen IS screen — the per-screen renderer is
  // the single source of truth used by both the strip preview (above) and the
  // flow-share deliverable assembler (server-side). Aliased, never forked.
  var renderScreen = screen;

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
      screen: screen,
      renderScreen: renderScreen,
      renderLayered: renderLayered,
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
      screen: screen,
      renderScreen: renderScreen,
      renderLayered: renderLayered,
      appHeader: appHeader,
    };
  }
})();
