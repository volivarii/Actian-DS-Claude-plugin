// scripts/renderers/html-renderers/ds-html-map.js
// Hi-fi DS component → HTML mapping. Mirrors fm-html-map.js. Switches on node.dsSlug.
// Works in Node (testing) and browser (inlined, sets window.dsHtmlMap).
//
// Variant values arrive already mapped to the DS side (an upstream transformer
// maps FM→DS), so DS variant values are read directly. Leaf styles live in the
// sibling ds-base.css (100% bound to vendored --zen-* tokens).

(function (exports) {
  "use strict";

  var fm =
    (typeof window !== "undefined" && window.fmHtmlMap) ||
    (typeof require !== "undefined" && require("./fm-html-map")) ||
    {};
  // The `esc`/`parseVariant`/`normalizeProps` fallbacks below are intentional
  // inline mirrors of fm-html-map's helpers, kept for the browser-without-
  // preloaded-fm case (no window.fmHtmlMap and no require). Do NOT delete them
  // as "dead code" in a future cleanup — they are the only implementation when
  // `fm` resolves to {}.
  var esc =
    fm.esc ||
    function (s) {
      if (s == null) return "";
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    };
  var parseVariant =
    fm.parseVariant ||
    function (variantString) {
      if (!variantString) return {};
      var result = {};
      variantString.split(",").forEach(function (part) {
        var kv = part.trim().split("=");
        if (kv.length === 2) result[kv[0].trim()] = kv[1].trim();
      });
      return result;
    };
  var normalizeProps =
    fm.normalizeProps ||
    function (p) {
      return p || {};
    };

  // Composite-key helper (anatomyVariantKey) used by the tag-default
  // token-injection case below. Same guard-with-inline-fallback shape as fm
  // above: this module runs in BOTH Node (require works) and the browser
  // deliverable (require may be absent), so the fallback body is a verbatim
  // mirror of anatomy-variant-key.js kept here for the browser-without-require
  // case. Do NOT delete it as dead code — it is the only implementation when
  // `require` is unavailable.
  var anatomyKey =
    (typeof require !== "undefined" && require("./anatomy-variant-key.js")) ||
    {};
  var anatomyVariantKey =
    anatomyKey.anatomyVariantKey ||
    function (slug, variant) {
      if (!variant || typeof variant !== "object") return slug;
      var keys = Object.keys(variant).sort();
      if (!keys.length) return slug;
      var parts = [];
      for (var i = 0; i < keys.length; i++) {
        parts.push(keys[i] + "=" + variant[keys[i]]);
      }
      return slug + "|" + parts.join(",");
    };

  // Appearance renderer (Phase 1B): browser global (injected by the
  // assembler) or the sibling module in Node. Same guard-with-fallback shape
  // as `fm`/`anatomyKey`/`dsIcons` above — this file is inlined VERBATIM into
  // browser deliverables, so the require must stay guarded (never a bare
  // top-level `require`). Falls back to {} so the default: case below can
  // check for the method presence and degrade to gracefulChip() instead of
  // throwing.
  var appearanceRender =
    (typeof window !== "undefined" && window.appearanceRender) ||
    (typeof require !== "undefined" && require("../appearance-render.js")) ||
    {};

  // Icon geometry: browser global (injected by the assembler) or the vendored
  // read-surface in Node. Geometry-only { slug: {viewBox, body} }.
  var dsIcons =
    (typeof window !== "undefined" && window.dsIcons) ||
    (typeof require !== "undefined" &&
      (function () {
        try {
          var p = require("../../lib/paths.js").components.icons.svg;
          return p ? require(p).icons : null;
        } catch (e) {
          return null;
        }
      })()) ||
    {};

  // renderIcon(slug, {rotate}) -> bare <svg> carrying the ds-icon base class
  // (plus ds-icon--rotN when rotated). Unknown slug -> '' (never throws; the
  // orphan-ref gate prevents shipping one).
  function renderIcon(slug, opts) {
    var icon = dsIcons && dsIcons[slug];
    if (!icon || !icon.viewBox || !icon.body) return "";
    var iconCls = "ds-icon";
    if (opts && opts.rotate) iconCls += " ds-icon--rot" + opts.rotate;
    return (
      '<svg class="' +
      iconCls +
      '" viewBox="' +
      esc(icon.viewBox) +
      '" aria-hidden="true">' +
      icon.body +
      "</svg>"
    );
  }

  // Inline icon glyphs (geometry in raw px — viewBox coords, not design tokens).
  // The button/input/checkbox/tag/card glyphs now come from renderIcon() (real
  // vendored DS icons, orphan-ref gated). The search magnifier stays hardcoded
  // for now — no clean vendored slug match yet.
  var SVG_SEARCH =
    '<svg viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M14 14l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  // Bell outline — notification button icon (20×20, geometry from anatomy).
  // Stroke-only so it responds to currentColor on the action button.
  var SVG_BELL =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
    '<path d="M10 2a6 6 0 0 0-6 6v3.5l-1.5 2V15h15v-1.5L16 11.5V8a6 6 0 0 0-6-6z" stroke-linejoin="round"/>' +
    '<path d="M8 15a2 2 0 0 0 4 0" stroke-linecap="round"/>' +
    "</svg>";

  // 3×3 dot/square grid — app-switcher button icon (20×20, fill, geometry from anatomy).
  var SVG_APPS =
    '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
    '<rect x="3" y="3" width="4" height="4" rx="1"/>' +
    '<rect x="8" y="3" width="4" height="4" rx="1"/>' +
    '<rect x="13" y="3" width="4" height="4" rx="1"/>' +
    '<rect x="3" y="8" width="4" height="4" rx="1"/>' +
    '<rect x="8" y="8" width="4" height="4" rx="1"/>' +
    '<rect x="13" y="8" width="4" height="4" rx="1"/>' +
    '<rect x="3" y="13" width="4" height="4" rx="1"/>' +
    '<rect x="8" y="13" width="4" height="4" rx="1"/>' +
    '<rect x="13" y="13" width="4" height="4" rx="1"/>' +
    "</svg>";

  // Parse a comma-separated list prop (nav items, tabs, crumbs) into a trimmed,
  // empty-dropped array. `fallback` is used when raw is falsy (matches the prior
  // inline `String(props.Items || "default")` behavior exactly).
  function parseItems(raw, fallback) {
    return String(raw || fallback || "")
      .split(",")
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return s.length > 0;
      });
  }

  // Resolve the active item for a list prop: the trimmed Active value when it
  // matches an item (case-insensitive), else the first item. Falls back to
  // first on absent OR non-matching Active, so a stale/renamed Active never
  // yields zero-active. Case-insensitive matching aligns with flow-renderer.js.
  function resolveActive(items, active) {
    var a = active != null ? String(active).trim().toLowerCase() : "";
    for (var i = 0; i < items.length; i++) {
      if (items[i].toLowerCase() === a) return items[i];
    }
    return items[0];
  }

  // Anatomy DOC map (Phase 1B) for the default: seam — { slug → doc } where
  // doc is the captured-appearance anatomy doc (Task 4's
  // buildDsAnatomyDocMap output), rendered per-instance so the instance's own
  // variant selects the right colors. Two supply paths: window.__dsAnatomyDocs
  // (browser) or setAnatomyDocMap() (server-side Node render). (The former
  // slug→pre-rendered-HTML anatomy map and its setAnatomyMap setter —
  // "path c" — was retired in Group C; this doc map is now the only anatomy
  // supply path.)
  var _serverAnatomyDocs = null;

  /**
   * setAnatomyDocMap(map) — supply the assemble-time anatomy doc map for
   * server-side rendering. Pass a plain object { slug → doc }, or
   * null/undefined to clear it (callers MUST reset after a render so state
   * never leaks).
   */
  function setAnatomyDocMap(map) {
    _serverAnatomyDocs = map && typeof map === "object" ? map : null;
  }

  // Variant-style map for token-injection into delegated hand-authored
  // templates (slice 1: tag-default). Same two supply paths as the anatomy
  // map above: window.__dsVariantStyles (browser) or setVariantStyleMap()
  // (server-side Node render).
  var _serverVariantStyleMap = null;

  /**
   * setVariantStyleMap(map) — supply the assemble-time variant-style map for
   * server-side rendering. Pass a plain object
   * { anatomyVariantKey(slug, variant) → inline-style-string }, or
   * null/undefined to clear it (callers MUST reset after a render so state
   * never leaks).
   */
  function setVariantStyleMap(map) {
    _serverVariantStyleMap = map && typeof map === "object" ? map : null;
  }

  /**
   * renderDSComponent(node)
   * node = { type: 'INSTANCE', library: 'ds', dsSlug: 'button', variant: '...', props: {...}, name: '...' }
   * Returns an HTML string. Never throws — degrades to a graceful chip.
   */
  function renderDSComponent(node) {
    node = node || {};
    var slug = node.dsSlug || "";
    var name = node.name || slug;

    // Graceful labeled chip — used for unmapped slugs (default case) AND as the
    // never-throws fallback if any case throws on a hostile prop shape. A single
    // bad node must never blank the whole preview, so this interpreter (like
    // fm-html-map's) guarantees it never throws.
    function gracefulChip() {
      return (
        '<span class="ds-component" data-slug="' +
        esc(slug) +
        '" data-name="' +
        esc(name) +
        '">' +
        esc(name) +
        "</span>"
      );
    }

    try {
      var v = parseVariant(node.variant || "");
      var props = normalizeProps(node.props);

      switch (slug) {
        case "button": {
          // Button taxonomy is Intent×Emphasis as of knowledge v0.34.x. Map the
          // two axes onto the hand-authored emphasis classes; fall back to the
          // legacy single Type axis when Intent/Emphasis are absent (older
          // flow-data + the frozen ds-button goldens still feed Type=).
          var btnType;
          if (v.Intent || v.Emphasis) {
            var isCritical = v.Intent === "Critical";
            var emphasis = v.Emphasis || "Filled";
            if (emphasis === "Outlined") {
              btnType = isCritical ? "critical-secondary" : "secondary";
            } else if (emphasis === "Ghost") {
              btnType = isCritical ? "critical-secondary" : "tertiary";
            } else {
              // Filled or Icon-only (icon styling comes from props, as the
              // legacy Icon type did → primary base class).
              btnType = isCritical ? "critical" : "primary";
            }
          } else {
            var typeMap = {
              Primary: "primary",
              Secondary: "secondary",
              Tertiary: "tertiary",
              "Critical primary": "critical",
              "Critical secondary": "critical-secondary",
              Icon: "primary",
            };
            btnType = typeMap[v.Type] || "primary";
          }
          var btnCls = "ds-button ds-button--" + btnType;
          if (v.Size === "Small") btnCls += " ds-button--small";
          if (v.State === "Disabled") btnCls += " is-disabled";
          var lead = props["Leading icon show"]
            ? '<span class="ds-button__icon">' + renderIcon("add") + "</span>"
            : "";
          var trail = props["Trailing icon show"]
            ? '<span class="ds-button__icon">' +
              renderIcon("chevron-up", { rotate: 180 }) +
              "</span>"
            : "";
          var label = esc(props.Label || "");
          return (
            '<button class="' +
            btnCls +
            '"' +
            (v.State === "Disabled" ? " disabled" : "") +
            ">" +
            lead +
            label +
            trail +
            "</button>"
          );
        }

        case "text-input": {
          var inLabel = esc(props.Label || "Label");
          var inPlaceholder = esc(
            props["Placeholder text"] || "Placeholder text",
          );
          var fieldCls = "ds-field";
          if (v.States === "Disabled") fieldCls += " is-disabled";
          // Trailing chevron is for selects/dropdowns only — a plain text input
          // must not imply one. Render the icon span only when a trailing-icon
          // prop is present.
          var inTrail = props["Trailing icon"]
            ? '<span class="ds-input__icon">' +
              renderIcon("chevron-up", { rotate: 180 }) +
              "</span>"
            : "";
          return (
            '<div class="' +
            fieldCls +
            '">' +
            '<div class="ds-field__label-row"><span class="ds-field__label">' +
            inLabel +
            "</span></div>" +
            '<div class="ds-input"><span class="ds-input__text">' +
            inPlaceholder +
            "</span>" +
            inTrail +
            "</div>" +
            "</div>"
          );
        }

        case "checkbox": {
          var cbCls = "ds-checkbox";
          if (v.Selected === "Yes") cbCls += " ds-checkbox--checked";
          if (v.State === "Disabled") cbCls += " is-disabled";
          var cbLabel = esc(props.Label || "Label");
          return (
            '<label class="' +
            cbCls +
            '"><span class="ds-checkbox__box">' +
            '<span class="ds-checkbox__check">' +
            renderIcon("simple-check") +
            "</span>" +
            '</span><span class="ds-checkbox__label">' +
            cbLabel +
            "</span></label>"
          );
        }

        case "radio-button": {
          var rbCls = "ds-radio";
          if (v.Selected === "Yes") rbCls += " ds-radio--checked";
          if (v.Format === "Card format") rbCls += " ds-radio--card";
          if (v.State === "Disabled") rbCls += " is-disabled";
          var rbLabel = esc(props.Label || "Label");
          var rbHelper =
            props["Helper text"] && props["Show Helper text"] !== false
              ? '<span class="ds-radio__helper">' +
                esc(props["Helper text"]) +
                "</span>"
              : "";
          return (
            '<label class="' +
            rbCls +
            '">' +
            '<span class="ds-radio__circle"><span class="ds-radio__dot"></span></span>' +
            '<span class="ds-radio__text"><span class="ds-radio__label">' +
            rbLabel +
            "</span>" +
            rbHelper +
            "</span>" +
            "</label>"
          );
        }

        case "toggle": {
          var tgCls = "ds-toggle";
          if (v.Selected === "Yes") tgCls += " ds-toggle--on";
          if (v["Toggle location"] === "Right") tgCls += " ds-toggle--right";
          if (v.State === "Disabled") tgCls += " is-disabled";
          var tgLabel = esc(props.Label || "Label");
          var tgHelper =
            props["Helper text"] && props["Show Helper text"] !== false
              ? '<span class="ds-toggle__helper">' +
                esc(props["Helper text"]) +
                "</span>"
              : "";
          return (
            '<label class="' +
            tgCls +
            '">' +
            '<span class="ds-toggle__switch"><span class="ds-toggle__thumb"></span></span>' +
            '<span class="ds-toggle__text"><span class="ds-toggle__label">' +
            tgLabel +
            "</span>" +
            tgHelper +
            "</span>" +
            "</label>"
          );
        }

        case "tag-default": {
          // Token-injection (not anatomy replacement): the hand-authored
          // .ds-tag template (label + icon) stays intact; the harvested
          // per-Color root token style is injected as an inline style attr so
          // variant colors render correctly WITHOUT dropping the instance
          // label. See buildDsVariantStyleMap (appearance-sourced).
          var tagCls = "ds-tag";
          var tagIcon = "";
          if (props["Leading icon show"]) {
            tagCls += " ds-tag--with-icon";
            tagIcon =
              '<span class="ds-tag__icon">' +
              renderIcon("directory") +
              "</span>";
          }
          var _styleMap =
            (typeof window !== "undefined" && window.__dsVariantStyles) ||
            _serverVariantStyleMap ||
            {};
          var _tagStyle = _styleMap[anatomyVariantKey("tag-default", v)] || "";
          var _tagStyleAttr = _tagStyle
            ? ' style="' + esc(_tagStyle) + '"'
            : "";
          return (
            '<span class="' +
            tagCls +
            '"' +
            _tagStyleAttr +
            ">" +
            tagIcon +
            esc(props.Label || "") +
            "</span>"
          );
        }

        case "badge": {
          if (v.Type === "Dot") {
            return '<span class="ds-badge ds-badge--dot"></span>';
          }
          // Number (default): the count/text pill.
          return (
            '<span class="ds-badge ds-badge--number">' +
            esc(props.Label || "") +
            "</span>"
          );
        }

        case "search": {
          var searchCls = "ds-search";
          // Accept the kit's typo "Dsiabled" as well as the canonical spelling.
          if (v.State === "Disabled" || v.State === "Dsiabled") {
            searchCls += " is-disabled";
          }
          var searchText = esc(props["Placeholder text"] || "Search");
          return (
            '<div class="' +
            searchCls +
            '"><span class="ds-search__icon">' +
            SVG_SEARCH +
            '</span><span class="ds-search__text">' +
            searchText +
            "</span></div>"
          );
        }

        case "card-for-items": {
          // DS-native only — no FM mapping. Composite data-product card (Catalog
          // type). Reuses the shared .ds-tag classes for the eyebrow + category.
          var cardCls = "ds-card";
          if (v.State === "Selected") cardCls += " ds-card--selected";
          return (
            '<div class="' +
            cardCls +
            '">' +
            '<span class="ds-tag ds-card__eyebrow">' +
            esc(props.Eyebrow || "Dataset") +
            "</span>" +
            '<div class="ds-card__title">' +
            esc(props.Title || "Title") +
            "</div>" +
            '<span class="ds-tag ds-tag--with-icon ds-card__cat">' +
            '<span class="ds-tag__icon">' +
            renderIcon("directory") +
            "</span>" +
            esc(props.Category || "Catalog") +
            "</span>" +
            '<p class="ds-card__body">' +
            esc(props.Body || "") +
            "</p>" +
            "</div>"
          );
        }

        case "global-header": {
          // Top app bar (chrome) — real Studio header, authored from Figma anatomy.
          // anatomy: 1440×64, flex space-between, padding 0 24px.
          // Left  = logo mark + app name label.
          // Center = context dropdown + search bar (when props.Search truthy).
          // Right = What's new · divider · notifications · divider · apps · divider · avatar.
          // NO AI/sparkle trigger — Figma anatomy has none.
          var headerApp = esc(props.App || v["App type"] || "Studio");
          var headerAvatar = esc(props.Account || "AU");
          var headerContext = esc(props.Context || "Catalog");
          var headerContextValue = esc(props.ContextValue || "Default");
          var showSearch =
            props.Search !== false &&
            props.Search !== "false" &&
            props.Search !== 0;

          // Left brand block: logo mark + app name label.
          var brandBlock =
            '<div class="ds-header__brand">' +
            '<span class="ds-header__logo" aria-hidden="true"></span>' +
            '<span class="ds-header__app">' +
            headerApp +
            "</span>" +
            "</div>";

          // Context dropdown: micro label (Catalog) + value in --zen-color-primary-500.
          // chevron-up rotated 180° = chevron-down (anatomy: arrow-down).
          var contextBlock =
            '<div class="ds-header__context">' +
            '<span class="ds-header__context-label">' +
            headerContext +
            "</span>" +
            '<span class="ds-header__context-value">' +
            headerContextValue +
            "</span>" +
            renderIcon("chevron-up", { rotate: 180 }) +
            "</div>";

          // Search bar: left scope dropdown + magnifier + input + trailing info.
          // anatomy: 568px max-width, left "Default ▾" scope toggle (128px) then
          // the search input with SVG_SEARCH; a tooltip info icon trails the field.
          var searchBlock = showSearch
            ? '<div class="ds-header__search">' +
              '<span class="ds-header__search-scope">' +
              '<span class="ds-header__search-scope-value">' +
              headerContextValue +
              "</span>" +
              renderIcon("chevron-up", { rotate: 180 }) +
              "</span>" +
              '<span class="ds-header__search-field">' +
              '<span class="ds-header__search-icon">' +
              SVG_SEARCH +
              "</span>" +
              '<input class="ds-header__search-input" type="search"' +
              ' placeholder="Search items" aria-label="Search items">' +
              "</span>" +
              '<span class="ds-header__search-info" aria-hidden="true">' +
              renderIcon("info-filled") +
              "</span>" +
              "</div>"
            : "";

          var centerBlock =
            '<div class="ds-header__center">' +
            contextBlock +
            searchBlock +
            "</div>";

          // Right actions cluster: What's new · divider · bell · divider · apps · divider · avatar.
          // anatomy: gap 8px, vertical dividers between groups.
          var hdrDivider =
            '<span class="ds-header__divider" aria-hidden="true"></span>';
          var actionsBlock =
            '<div class="ds-header__actions">' +
            '<button class="ds-header__action ds-header__action--whatsnew" type="button">' +
            "What&#39;s new" +
            "</button>" +
            hdrDivider +
            '<button class="ds-header__action ds-header__action--notifications"' +
            ' type="button" aria-label="Notifications">' +
            SVG_BELL +
            "</button>" +
            hdrDivider +
            '<button class="ds-header__action ds-header__action--apps"' +
            ' type="button" aria-label="App switcher">' +
            SVG_APPS +
            "</button>" +
            hdrDivider +
            '<span class="ds-header__avatar">' +
            headerAvatar +
            "</span>" +
            "</div>";

          return (
            '<header class="ds-header">' +
            brandBlock +
            centerBlock +
            actionsBlock +
            "</header>"
          );
        }

        case "side-nav": {
          // Left navigation rail (chrome).
          // Grouped mode (props.Groups JSON string): real Studio sidebar from
          //   Figma anatomy — groups of {items:[{label,icon}]}, separators,
          //   collapse button. resolveActive matches across all group items.
          // Legacy mode (props.Items comma string): back-compat for existing
          //   flows that pass a flat item list with no icons.
          // anatomy: width:240px; padding:16px; flex-direction:column;
          //   justify-content:space-between; bg:--zen-color-bg-default;
          //   border-right:1px solid --zen-border-default.
          var navCls = "ds-sidenav";
          if (v.View === "Collapsed") navCls += " ds-sidenav--collapsed";

          // Helper: render a single nav item row.
          // icon may be null (legacy path) or a slug string (grouped path).
          function renderNavItem(label, icon, isActive) {
            var itemCls = "ds-sidenav__item";
            if (isActive) itemCls += " is-active";
            var iconHtml = icon
              ? '<span class="ds-sidenav__icon">' + renderIcon(icon) + "</span>"
              : '<span class="ds-sidenav__icon"></span>';
            return (
              '<a class="' +
              itemCls +
              '">' +
              iconHtml +
              '<span class="ds-sidenav__label">' +
              esc(label) +
              "</span></a>"
            );
          }

          // Separator bar between groups (and before the collapse button).
          // anatomy: 1px horizontal rule, --zen-border-default, 4px vertical margin.
          var navSeparator =
            '<div class="ds-sidenav__separator" aria-hidden="true"></div>';

          if (props.Groups) {
            // ── Grouped mode (Studio anatomy) ────────────────────────────
            var groups;
            try {
              groups = JSON.parse(props.Groups);
            } catch (e) {
              groups = [];
            }
            if (!Array.isArray(groups)) groups = [];

            // Flatten all group items to run resolveActive across the full set.
            var allLabels = [];
            groups.forEach(function (g) {
              (g.items || []).forEach(function (it) {
                allLabels.push(it.label || "");
              });
            });
            var navActive = resolveActive(allLabels, props.Active);

            // anatomy: primary groups at the top; the LAST group (utilities:
            // Access request / Catalog design / Analytics) is anchored to the
            // rail bottom. With a single group, keep it all at the top.
            var renderGroup = function (g) {
              var groupItems = (g.items || [])
                .map(function (it) {
                  return renderNavItem(
                    it.label || "",
                    it.icon || null,
                    (it.label || "") === navActive,
                  );
                })
                .join("");
              return '<div class="ds-sidenav__group">' + groupItems + "</div>";
            };
            var hasBottomGroup = groups.length >= 2;
            var topGroups = hasBottomGroup ? groups.slice(0, -1) : groups;
            var topHtml = topGroups.map(renderGroup).join(navSeparator);

            // Bottom section: the utilities group (if any) + separator + collapse.
            var bottomInner = "";
            if (hasBottomGroup) {
              bottomInner += renderGroup(groups[groups.length - 1]);
            }
            bottomInner +=
              navSeparator +
              '<button class="ds-sidenav__collapse" type="button" aria-label="Collapse sidebar">' +
              renderIcon("chevron-left") +
              "</button>";
            var collapseHtml =
              '<div class="ds-sidenav__bottom">' + bottomInner + "</div>";

            return (
              '<nav class="' +
              navCls +
              '">' +
              '<div class="ds-sidenav__top">' +
              topHtml +
              "</div>" +
              collapseHtml +
              "</nav>"
            );
          } else {
            // ── Legacy mode (comma Items list, no icons) ──────────────────
            var navItems = parseItems(
              props.Items,
              "Catalog, Pipelines, Connections, Settings",
            );
            var legacyActive = resolveActive(navItems, props.Active);
            var navRows = navItems
              .map(function (item) {
                return renderNavItem(item, null, item === legacyActive);
              })
              .join("");
            return '<nav class="' + navCls + '">' + navRows + "</nav>";
          }
        }

        case "page-header": {
          var phTitle = esc(props.Title || "Page title");
          var phDesc = props.Description
            ? '<p class="ds-page-header__desc">' +
              esc(props.Description) +
              "</p>"
            : "";
          var phActions = "";
          var actionsRaw = props.Actions;
          if (Array.isArray(actionsRaw) && actionsRaw.length) {
            phActions =
              '<div class="ds-page-header__actions">' +
              actionsRaw
                .map(function (a, i) {
                  var label = typeof a === "string" ? a : (a && a.label) || "";
                  var variant =
                    (a && a.variant) || (i === 0 ? "primary" : "secondary");
                  return (
                    '<button class="ds-button ds-button--' +
                    esc(variant) +
                    '">' +
                    esc(label) +
                    "</button>"
                  );
                })
                .join("") +
              "</div>";
          }
          return (
            '<header class="ds-page-header">' +
            '<div class="ds-page-header__text">' +
            '<h1 class="ds-page-header__title">' +
            phTitle +
            "</h1>" +
            phDesc +
            "</div>" +
            phActions +
            "</header>"
          );
        }

        case "breadcrumb": {
          var crumbItems = parseItems(props.Items, "Home, Section, Page");
          var crumbSep =
            '<span class="ds-breadcrumbs__sep">' +
            renderIcon("chevron-left", { rotate: 180 }) +
            "</span>";
          var crumbHtml = crumbItems
            .map(function (label, i) {
              var isLast = i === crumbItems.length - 1;
              var crumbCls = "ds-breadcrumbs__crumb";
              if (isLast) crumbCls += " ds-breadcrumbs__crumb--current";
              var tag = isLast ? "span" : "a";
              return (
                "<" +
                tag +
                ' class="' +
                crumbCls +
                '">' +
                esc(label) +
                "</" +
                tag +
                ">"
              );
            })
            .join(crumbSep);
          return (
            '<nav class="ds-breadcrumbs" aria-label="Breadcrumb">' +
            crumbHtml +
            "</nav>"
          );
        }

        case "tabs": {
          var tabItems = parseItems(props.Items, "Overview, Schema, Lineage");
          var tabActive = resolveActive(tabItems, props.Active);
          var tabHtml = tabItems
            .map(function (label) {
              var tabCls = "ds-tabs__tab";
              if (label === tabActive) tabCls += " is-active";
              return (
                '<button class="' +
                tabCls +
                '" role="tab">' +
                esc(label) +
                "</button>"
              );
            })
            .join("");
          return '<div class="ds-tabs" role="tablist">' + tabHtml + "</div>";
        }

        case "table": {
          var cols = parseItems(props.Columns, "Name, Status, Updated");
          var rowsRaw = props.Rows;
          var rows = Array.isArray(rowsRaw)
            ? rowsRaw
            : parseItems(rowsRaw, "").map(function (cell) {
                return [cell];
              });
          var thead =
            '<thead><tr class="ds-table__head-row">' +
            cols
              .map(function (c) {
                return '<th class="ds-table__th">' + esc(c) + "</th>";
              })
              .join("") +
            "</tr></thead>";
          var tbody =
            "<tbody>" +
            rows
              .map(function (r) {
                var cells = Array.isArray(r) ? r : [r];
                return (
                  '<tr class="ds-table__row">' +
                  cols
                    .map(function (_c, i) {
                      return (
                        '<td class="ds-table__td">' +
                        esc(cells[i] != null ? cells[i] : "") +
                        "</td>"
                      );
                    })
                    .join("") +
                  "</tr>"
                );
              })
              .join("") +
            "</tbody>";
          return '<table class="ds-table">' + thead + tbody + "</table>";
        }

        case "modal": {
          var modalTitle = esc(props.Title || "Dialog");
          var modalBody = props.Body
            ? '<div class="ds-modal__body">' + esc(props.Body) + "</div>"
            : "";
          var modalFooter = "";
          var modalActionsRaw = props.Actions;
          if (Array.isArray(modalActionsRaw) && modalActionsRaw.length) {
            modalFooter =
              '<div class="ds-modal__footer">' +
              modalActionsRaw
                .map(function (a, i) {
                  var label = typeof a === "string" ? a : (a && a.label) || "";
                  var variant =
                    (a && a.variant) || (i === 0 ? "primary" : "secondary");
                  return (
                    '<button class="ds-button ds-button--' +
                    esc(variant) +
                    '">' +
                    esc(label) +
                    "</button>"
                  );
                })
                .join("") +
              "</div>";
          } else if (typeof modalActionsRaw === "string" && modalActionsRaw) {
            // String Actions fallback: treat the whole string as a single
            // primary button label (mirrors page-header string-actions idiom).
            modalFooter =
              '<div class="ds-modal__footer">' +
              '<button class="ds-button ds-button--primary">' +
              esc(modalActionsRaw) +
              "</button>" +
              "</div>";
          }
          return (
            '<div class="ds-modal-backdrop">' +
            '<div class="ds-modal" role="dialog" aria-modal="true">' +
            '<h2 class="ds-modal__title">' +
            modalTitle +
            "</h2>" +
            modalBody +
            modalFooter +
            "</div>" +
            "</div>"
          );
        }

        case "empty-state": {
          var esHeadline = esc(props.Headline || "Nothing here yet");
          var esBody = props.Body
            ? '<p class="ds-empty-state__body">' + esc(props.Body) + "</p>"
            : "";
          var esCta = props.Cta
            ? '<button class="ds-button ds-button--primary ds-empty-state__cta">' +
              esc(props.Cta) +
              "</button>"
            : "";
          return (
            '<div class="ds-empty-state">' +
            '<p class="ds-empty-state__headline">' +
            esHeadline +
            "</p>" +
            esBody +
            esCta +
            "</div>"
          );
        }

        case "alert-banner": {
          // Registry variant axis: Type = Primary | Success | Warning | Danger
          // Primary → info-filled icon, role=status
          // Success → success-filled icon, role=status
          // Warning → warning-filled icon, role=status
          // Danger  → error-filled icon,   role=alert
          var alertIconMap = {
            primary: "info-filled",
            success: "success-filled",
            warning: "warning-filled",
            danger: "error-filled",
          };
          // Clamp Type to the known enum BEFORE it reaches the class attribute —
          // v.Type is user-supplied flow-data; an unclamped value would break out
          // of the class attribute and inject markup (XSS). Unknown/crafted values
          // fall back to "primary".
          var alertTypeRaw = (v.Type || "Primary").toLowerCase();
          var alertType = alertIconMap[alertTypeRaw] ? alertTypeRaw : "primary";
          var alertIconSlug = alertIconMap[alertType];
          var alertRole = alertType === "danger" ? "alert" : "status";
          var alertCls = "ds-alert ds-alert--" + alertType;
          var alertTitleHtml = props.Title
            ? '<p class="ds-alert__title">' + esc(props.Title) + "</p>"
            : "";
          var alertMsg = esc(props.Message || "");
          return (
            '<div class="' +
            alertCls +
            '" role="' +
            alertRole +
            '">' +
            '<span class="ds-alert__icon">' +
            renderIcon(alertIconSlug) +
            "</span>" +
            '<div class="ds-alert__content">' +
            alertTitleHtml +
            '<p class="ds-alert__message">' +
            alertMsg +
            "</p>" +
            "</div>" +
            "</div>"
          );
        }

        case "chat-with-ai-steward": {
          // Oracle: vendor/components/dist/media/chat-with-ai-steward/
          //   preview.webp — ~420px floating panel, bg-default, shadow-xl elevation
          //   behavior-0.webp — overlay/drawer/floating variants; this leaf = static open panel
          // Design guideline: surface elevation (shadow-xl), ai icon sparkle (16px),
          //   confidence = badge, streaming shimmer (2000ms), disclaimer footer.
          // Note: --zen-color-purple-* NOT in vendored tokens.css — using
          //   --zen-color-icon-primary as sparkle accent (nearest semantic match).
          // Task 4 (2026-06-10): re-modelled to full Figma anatomy:
          //   header controls (New chat + settings/expand/close), Welcome state,
          //   task-input footer, size=Drawer modifier.
          var stTitle = esc(props.Title || "AI Steward");
          // State: prefer variant key (v.State) but also accept props.State
          var stState = v.State || props.State || "";
          var generating = stState === "Generating";
          var welcome = stState === "Welcome";
          // Size: variant key (lowercase "size" from flow-data, e.g. "size=Drawer")
          var isDrawer = v.size === "Drawer";

          // SVG_EXPAND — two diagonal arrows (maximize), hardcoded inline per oracle;
          // no vendored glyph match for this geometry in the 37-glyph curated set.
          var SVG_EXPAND =
            '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">' +
            '<path d="M12 3h5v5M3 8V3h5M8 12H3v5M17 12v5h-5"/>' +
            "</svg>";

          // Header: sparkle + title + New chat dropdown + controls (settings/expand/close)
          var stHeader =
            '<div class="ds-steward__header">' +
            '<span class="ds-steward__spark" aria-label="Generated by AI">' +
            renderIcon("ai") +
            "</span>" +
            '<span class="ds-steward__title">' +
            stTitle +
            "</span>" +
            '<button class="ds-steward__newchat" type="button">New chat &#9660;</button>' +
            '<div class="ds-steward__controls">' +
            '<button class="ds-steward__control ds-steward__control--settings" type="button" aria-label="Settings">' +
            renderIcon("settings") +
            "</button>" +
            '<button class="ds-steward__control ds-steward__control--expand" type="button" aria-label="Expand">' +
            SVG_EXPAND +
            "</button>" +
            '<button class="ds-steward__control ds-steward__control--close" type="button" aria-label="Close">' +
            renderIcon("close") +
            "</button>" +
            "</div>" +
            "</div>";

          // Task-input footer (anatomy: input + context chip + Plan button).
          // Context may be an object {type,name} ("Dataset Customer Orders") or a
          // bare string; both render to a single esc'd chip label.
          var stCtxLabel = "";
          if (props.Context && typeof props.Context === "object") {
            stCtxLabel =
              String(props.Context.type || "") +
              (props.Context.name ? " " + props.Context.name : "");
          } else if (props.Context) {
            stCtxLabel = String(props.Context);
          }
          var stCtx = stCtxLabel.trim()
            ? '<span class="ds-steward__context-chip">' +
              esc(stCtxLabel) +
              "</span>"
            : "";
          var stTaskInput =
            '<div class="ds-steward__taskinput">' +
            '<input class="ds-steward__taskinput-field" type="text" placeholder="Give Steward a task" aria-label="Give Steward a task"/>' +
            stCtx +
            '<button class="ds-button ds-button--secondary ds-button--small" type="button">Plan</button>' +
            "</div>";

          var stBody;
          if (generating) {
            stBody =
              '<div class="ds-steward__body" aria-busy="true">' +
              '<span class="ds-steward__shimmer"></span>' +
              '<span class="ds-steward__shimmer ds-steward__shimmer--short"></span>' +
              '<button class="ds-button ds-button--tertiary ds-button--small">Stop</button>' +
              "</div>";
          } else if (welcome) {
            var stGreeting = props.Greeting
              ? '<p class="ds-steward__greeting">' +
                esc(props.Greeting) +
                "</p>"
              : "";
            stBody =
              '<div class="ds-steward__body" aria-live="polite">' +
              stGreeting +
              "</div>";
          } else {
            var stConf = props.Confidence
              ? '<span class="ds-badge ds-badge--number ds-steward__conf">' +
                esc(props.Confidence) +
                "</span>"
              : "";
            var stSrc = props.Source
              ? '<div class="ds-steward__source">Source: <a class="ds-steward__source-link">' +
                esc(props.Source) +
                "</a>" +
                stConf +
                "</div>"
              : "";
            stBody =
              '<div class="ds-steward__body" aria-live="polite">' +
              '<p class="ds-steward__insight">' +
              esc(props.Insight || "") +
              "</p>" +
              stSrc +
              '<div class="ds-steward__actions">' +
              '<button class="ds-button ds-button--secondary ds-button--small">Accept</button>' +
              '<button class="ds-button ds-button--tertiary ds-button--small">Regenerate</button>' +
              '<button class="ds-button ds-button--tertiary ds-button--small">Discard</button>' +
              "</div>" +
              "</div>";
          }
          var stFooter =
            '<div class="ds-steward__disclaimer">AI-generated content can contain errors. Verify important information.</div>';
          var stRootCls =
            "ds-steward" + (isDrawer ? " ds-steward--drawer" : "");
          return (
            '<aside class="' +
            stRootCls +
            '">' +
            stHeader +
            stBody +
            (generating ? "" : stTaskInput) +
            stFooter +
            "</aside>"
          );
        }

        // ── Hi-Fi Slice 1 (Task 4): transform-target leaves ──────────────
        // These 8 slugs chip-degraded before. Each renders a tokens-only leaf
        // from its registry variant axes + Figma anatomy part-tree.

        case "notification": {
          // Registry axis: Type = Default | Critical.
          // Anatomy: container[Type]{ text[message], instance[Button] } — an
          // inline banner with a message + a single action button. Mirrors the
          // alert-banner idiom; Critical → role=alert (like Danger).
          var notifTypeRaw = (v.Type || "Default").toLowerCase();
          var notifCritical = notifTypeRaw === "critical";
          var notifCls =
            "ds-notification" +
            (notifCritical ? " ds-notification--critical" : "");
          var notifRole = notifCritical ? "alert" : "status";
          var notifMsg = esc(props.Message || "");
          // Action button is optional — only render when an Action label exists.
          var notifAction = props.Action
            ? '<button class="ds-button ds-button--tertiary ds-button--small ds-notification__action" type="button">' +
              esc(props.Action) +
              "</button>"
            : "";
          return (
            '<div class="' +
            notifCls +
            '" role="' +
            notifRole +
            '">' +
            '<span class="ds-notification__icon">' +
            renderIcon(notifCritical ? "error-filled" : "info-filled") +
            "</span>" +
            '<p class="ds-notification__message">' +
            notifMsg +
            "</p>" +
            notifAction +
            "</div>"
          );
        }

        case "stepper": {
          // Registry axis: State = Complete | Active | Default (Incomplete) | …
          // Anatomy: container[State]{ container[Status]{number}, container[Text]
          // {Title, Body} } — a numbered status circle + title/body. Complete
          // swaps the number for a check glyph.
          var stepStateRaw = (v.State || "Default").toLowerCase();
          var stepComplete = stepStateRaw === "complete";
          var stepActive = stepStateRaw === "active";
          var stepperCls = "ds-stepper";
          if (stepComplete) stepperCls += " ds-stepper--complete";
          else if (stepActive) stepperCls += " ds-stepper--active";
          var stepStatus = stepComplete
            ? '<span class="ds-stepper__check">' +
              renderIcon("simple-check") +
              "</span>"
            : esc(props.Step || "");
          var stepBody = props.Body
            ? '<span class="ds-stepper__body">' + esc(props.Body) + "</span>"
            : "";
          return (
            '<div class="' +
            stepperCls +
            '">' +
            '<span class="ds-stepper__status">' +
            stepStatus +
            "</span>" +
            '<span class="ds-stepper__text">' +
            '<span class="ds-stepper__title">' +
            esc(props.Title || "") +
            "</span>" +
            stepBody +
            "</span>" +
            "</div>"
          );
        }

        case "tooltip": {
          // Registry axis: Type = Default. Anatomy: container[Type]{ text[Body] }
          // — a small text bubble. role=tooltip for assistive tech.
          return (
            '<div class="ds-tooltip" role="tooltip">' +
            '<span class="ds-tooltip__body">' +
            esc(props.Body || "") +
            "</span>" +
            '<span class="ds-tooltip__arrow" aria-hidden="true"></span>' +
            "</div>"
          );
        }

        case "input-date": {
          // Registry axes: Type = Single date | Date range; States = Enabled |
          // Disabled | Error | … . Anatomy: container{ container[Label]{text},
          // container[Input + icon button]{ inputfield, instance[Button] } } —
          // a labeled date input with a trailing calendar icon button. Mirrors
          // the .ds-field/.ds-input idiom; Date range adds a second input.
          var dateRange = v.Type === "Date range";
          var dateDisabled = v.States === "Disabled";
          var dateCls = "ds-input-date";
          if (dateRange) dateCls += " ds-input-date--range";
          if (dateDisabled) dateCls += " is-disabled";
          var datePlaceholder = esc(props["Placeholder text"] || "MM/DD/YYYY");
          function dateInput() {
            return (
              '<div class="ds-input-date__field">' +
              '<span class="ds-input-date__value">' +
              datePlaceholder +
              "</span>" +
              '<span class="ds-input-date__calendar" aria-hidden="true">' +
              renderIcon("calendar-2") +
              "</span>" +
              "</div>"
            );
          }
          var dateInputs = dateRange
            ? dateInput() +
              '<span class="ds-input-date__sep">–</span>' +
              dateInput()
            : dateInput();
          var dateHelper = props.Helper
            ? '<span class="ds-input-date__helper">' +
              esc(props.Helper) +
              "</span>"
            : "";
          return (
            '<div class="' +
            dateCls +
            '">' +
            '<div class="ds-input-date__label-row"><span class="ds-input-date__label">' +
            esc(props.Label || "Date") +
            "</span></div>" +
            '<div class="ds-input-date__inputs">' +
            dateInputs +
            "</div>" +
            dateHelper +
            "</div>"
          );
        }

        case "rich-text": {
          // Registry axis: State = Default | Expanded. Anatomy: container[State]{
          // container[Toolbar]{ container[Left toolbar], container[Right toolbar]
          // } } — an editor toolbar shell with grouped controls. Expanded shows
          // a content area below the toolbar.
          var rtExpanded = v.State === "Expanded";
          var rtCls =
            "ds-rich-text" + (rtExpanded ? " ds-rich-text--expanded" : "");
          function rtBtn(iconSlug, label) {
            return (
              '<button class="ds-rich-text__btn" type="button" aria-label="' +
              esc(label) +
              '">' +
              renderIcon(iconSlug) +
              "</button>"
            );
          }
          var rtLeft =
            '<div class="ds-rich-text__group ds-rich-text__group--left">' +
            rtBtn("text-type", "Text style") +
            rtBtn("list-bullets", "Bulleted list") +
            rtBtn("list-numbers", "Numbered list") +
            "</div>";
          var rtRight =
            '<div class="ds-rich-text__group ds-rich-text__group--right">' +
            rtBtn("link-type", "Insert link") +
            "</div>";
          var rtBody = rtExpanded
            ? '<div class="ds-rich-text__content" aria-label="Editor"></div>'
            : "";
          return (
            '<div class="' +
            rtCls +
            '">' +
            '<div class="ds-rich-text__toolbar">' +
            rtLeft +
            rtRight +
            "</div>" +
            rtBody +
            "</div>"
          );
        }

        case "dropdown-select-default": {
          // Registry axes: Type = Default | Search/Multiple | …; State = Default |
          // Disabled | Focus | … . Anatomy: container{ container[Label + desc],
          // container[input field]{ value, chevron }, text[helper] } — a labeled
          // select with an input field + optional helper. Mirrors .ds-field idiom.
          var ddDisabled = v.State === "Disabled";
          var ddCls = "ds-dropdown-select";
          if (ddDisabled) ddCls += " is-disabled";
          var ddDesc = props.Description
            ? '<span class="ds-dropdown-select__desc">' +
              esc(props.Description) +
              "</span>"
            : "";
          var ddValueText = props.Value;
          var ddValueCls =
            "ds-dropdown-select__value" +
            (ddValueText ? "" : " ds-dropdown-select__value--placeholder");
          var ddValue = esc(ddValueText || props.Placeholder || "Select…");
          var ddHelper = props.Helper
            ? '<span class="ds-dropdown-select__helper">' +
              esc(props.Helper) +
              "</span>"
            : "";
          return (
            '<div class="' +
            ddCls +
            '">' +
            '<div class="ds-dropdown-select__label-row">' +
            '<span class="ds-dropdown-select__label">' +
            esc(props.Label || "Label") +
            "</span>" +
            ddDesc +
            "</div>" +
            '<div class="ds-dropdown-select__field">' +
            '<span class="' +
            ddValueCls +
            '">' +
            ddValue +
            "</span>" +
            '<span class="ds-dropdown-select__chevron" aria-hidden="true">' +
            renderIcon("chevron-up", { rotate: 180 }) +
            "</span>" +
            "</div>" +
            ddHelper +
            "</div>"
          );
        }

        case "progress-bar-small": {
          // Registry axes: Size = Default | Large; Completeness = 0% | 50% | 100%.
          // Anatomy: container{ container[Bar]{ vector[fill] }, text[percent] } —
          // a track with a clamped fill + a percent label. Completeness drives the
          // default fill width; an explicit Percent prop overrides it.
          var pbLarge = v.Size === "Large";
          var pbCls = "ds-progress" + (pbLarge ? " ds-progress--large" : "");
          // Resolve percent: explicit prop wins, else the Completeness variant,
          // else 0. Parse to a number and clamp to [0, 100].
          var pbRaw =
            props.Percent != null && props.Percent !== ""
              ? props.Percent
              : v.Completeness;
          var pbNum = parseInt(
            String(pbRaw || "0").replace(/[^0-9.-]/g, ""),
            10,
          );
          if (isNaN(pbNum)) pbNum = 0;
          if (pbNum < 0) pbNum = 0;
          if (pbNum > 100) pbNum = 100;
          return (
            '<div class="' +
            pbCls +
            '">' +
            '<div class="ds-progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
            pbNum +
            '">' +
            '<span class="ds-progress__fill" style="width:' +
            pbNum +
            '%"></span>' +
            "</div>" +
            '<span class="ds-progress__percent">' +
            pbNum +
            "%</span>" +
            "</div>"
          );
        }

        case "tag-interactive": {
          // Registry axis: State = Default | Hovered | Selected | Disabled | …
          // Anatomy: container[State]{ instance[Leading icon], text[Tag-Name],
          // instance[Trailing icon] } — a tag/chip with optional leading + a
          // removable trailing control. Mirrors the .ds-tag idiom + state mods.
          var tiStateRaw = (v.State || "Default").toLowerCase();
          var tiCls = "ds-tag-interactive";
          if (tiStateRaw === "selected")
            tiCls += " ds-tag-interactive--selected";
          if (tiStateRaw === "disabled") tiCls += " is-disabled";
          // Leading icon defaults on (anatomy shows one); honor an explicit false.
          var tiShowLead = props["Leading icon show"] !== false;
          var tiLead = tiShowLead
            ? '<span class="ds-tag-interactive__icon ds-tag-interactive__icon--lead">' +
              renderIcon("directory") +
              "</span>"
            : "";
          // Trailing control defaults on (interactive = removable); honor false.
          var tiShowTrail = props["Trailing icon show"] !== false;
          var tiTrail = tiShowTrail
            ? '<button class="ds-tag-interactive__remove" type="button" aria-label="Remove">' +
              renderIcon("close") +
              "</button>"
            : "";
          return (
            '<span class="' +
            tiCls +
            '">' +
            tiLead +
            '<span class="ds-tag-interactive__label">' +
            esc(props.Label || "") +
            "</span>" +
            tiTrail +
            "</span>"
          );
        }

        // ---- Hi-Fi A1 (narrow) — degraded-slug overrides. Batch 1: overlays ----

        case "popover": {
          // Registry axis: Type = Interaction guide | Advanced search; prop
          // "Show info icon". A floating card: optional info icon + title +
          // body + arrow. role=dialog for assistive tech.
          var poAdvanced = v.Type === "Advanced search";
          var poCls =
            "ds-popover" + (poAdvanced ? " ds-popover--advanced-search" : "");
          // "Show info icon" is a default-TRUE registry boolean → shown unless
          // explicitly false (the file's default-true convention, cf. radio /
          // toggle / tag-interactive: `props[x] !== false`).
          var poInfo =
            props["Show info icon"] !== false
              ? '<span class="ds-popover__info" aria-hidden="true">' +
                renderIcon("help-circle") +
                "</span>"
              : "";
          var poTitle = props.Title
            ? '<span class="ds-popover__title">' + esc(props.Title) + "</span>"
            : "";
          var poBody = props.Body
            ? '<span class="ds-popover__body">' + esc(props.Body) + "</span>"
            : "";
          return (
            '<div class="' +
            poCls +
            '" role="dialog" aria-label="' +
            esc(props.Title || "Popover") +
            '">' +
            '<div class="ds-popover__header">' +
            poInfo +
            poTitle +
            "</div>" +
            poBody +
            '<span class="ds-popover__arrow" aria-hidden="true"></span>' +
            "</div>"
          );
        }

        case "account-dropdown": {
          // No registry variants/props (single-import; nested help-bubble /
          // arrow-down / exit baked into the Figma component). Render an account
          // menu overlay: identity header + default items (Items prop overrides).
          var acName = esc(props.Name || "Account user");
          var acEmail = props.Email
            ? '<span class="ds-account-menu__email">' +
              esc(props.Email) +
              "</span>"
            : "";
          var acIcons = {
            "account settings": "settings",
            help: "help-bubble",
            "sign out": "exit",
          };
          var acList = parseItems(props.Items, "Account settings,Help,Sign out")
            .map(function (label) {
              var ico = acIcons[label.toLowerCase()];
              var g = ico
                ? '<span class="ds-account-menu__icon" aria-hidden="true">' +
                  renderIcon(ico) +
                  "</span>"
                : "";
              return (
                '<span class="ds-account-menu__item" role="menuitem">' +
                g +
                '<span class="ds-account-menu__label">' +
                esc(label) +
                "</span></span>"
              );
            })
            .join("");
          return (
            '<div class="ds-account-menu" role="menu" aria-label="Account">' +
            '<div class="ds-account-menu__header">' +
            '<span class="ds-account-menu__name">' +
            acName +
            "</span>" +
            acEmail +
            "</div>" +
            '<div class="ds-account-menu__items">' +
            acList +
            "</div>" +
            "</div>"
          );
        }

        case "app-switcher-dropdown": {
          // No registry variants/props (single-import; nested settings /
          // arrow-down baked in). Render an app-switcher menu overlay: an app
          // list + a settings row (Items prop overrides the app list).
          var asList = parseItems(
            props.Items,
            "Data Studio,Data Catalog,Data Integration",
          )
            .map(function (label) {
              return (
                '<span class="ds-app-switcher__app" role="menuitem">' +
                '<span class="ds-app-switcher__tile" aria-hidden="true"></span>' +
                '<span class="ds-app-switcher__label">' +
                esc(label) +
                "</span></span>"
              );
            })
            .join("");
          return (
            '<div class="ds-app-switcher" role="menu" aria-label="Switch app">' +
            '<div class="ds-app-switcher__apps">' +
            asList +
            "</div>" +
            '<span class="ds-app-switcher__settings" role="menuitem">' +
            '<span class="ds-app-switcher__icon" aria-hidden="true">' +
            renderIcon("settings") +
            "</span>" +
            '<span class="ds-app-switcher__label">Settings</span></span>' +
            "</div>"
          );
        }

        // ---- Hi-Fi A1 (narrow) — degraded-slug overrides. Batch 2: controls ----

        case "segmented-control": {
          // Registry axis: Type = Default (no content props). Render a segmented
          // toggle from Segments/Items (comma list; Active picks the selected
          // segment, else the first). role=tablist for assistive tech.
          var segItems = parseItems(
            props.Segments || props.Items,
            "Option A,Option B",
          );
          var segActive = resolveActive(segItems, props.Active);
          var segList = segItems
            .map(function (label) {
              var on = label === segActive;
              // Compute the class into a variable (never inline a ternary inside
              // the class attribute literal — the css-staleness extractor scans
              // raw source and mis-parses an inline ternary there).
              var segCls = "ds-segmented__item" + (on ? " is-active" : "");
              return (
                '<span class="' +
                segCls +
                '" role="tab" aria-selected="' +
                (on ? "true" : "false") +
                '">' +
                esc(label) +
                "</span>"
              );
            })
            .join("");
          return (
            '<div class="ds-segmented" role="tablist">' + segList + "</div>"
          );
        }

        case "toolbar": {
          // Registry axes: Type = Single | Combined | Group; Orientation =
          // Horizontal | Vertical; prop "Show View scale". Representative action
          // bar (no content props) — a group of icon buttons + an optional
          // zoom/view-scale control. role=toolbar.
          var tbVertical = v.Orientation === "Vertical";
          var tbCls = "ds-toolbar";
          tbCls += tbVertical
            ? " ds-toolbar--vertical"
            : " ds-toolbar--horizontal";
          function tbBtn(iconSlug, label) {
            return (
              '<button class="ds-toolbar__btn" type="button" aria-label="' +
              esc(label) +
              '">' +
              renderIcon(iconSlug) +
              "</button>"
            );
          }
          var tbGroup =
            '<div class="ds-toolbar__group">' +
            tbBtn("filter", "Filter") +
            tbBtn("chevron-sort", "Sort") +
            tbBtn("view", "View") +
            tbBtn("more", "More") +
            "</div>";
          // "Show View scale" is a default-TRUE registry boolean → shown unless
          // explicitly false (the file's default-true convention).
          var tbScale =
            props["Show View scale"] !== false
              ? '<div class="ds-toolbar__scale">' +
                tbBtn("zoom-out", "Zoom out") +
                '<span class="ds-toolbar__scale-value">100%</span>' +
                tbBtn("zoom-in", "Zoom in") +
                "</div>"
              : "";
          return (
            '<div class="' +
            tbCls +
            '" role="toolbar">' +
            tbGroup +
            tbScale +
            "</div>"
          );
        }

        case "sticky-footer": {
          // Registry axis: Property 1 = Default (no content props). Persistent
          // bottom action bar; right-aligned DS buttons (reuses .ds-button) —
          // defaults Cancel (secondary) + Save (primary); Primary/Secondary
          // props override the labels.
          var sfPrimary = esc(props.Primary || "Save");
          var sfSecondary = esc(props.Secondary || "Cancel");
          return (
            '<div class="ds-sticky-footer">' +
            '<div class="ds-sticky-footer__actions">' +
            '<button class="ds-button ds-button--secondary">' +
            sfSecondary +
            "</button>" +
            '<button class="ds-button ds-button--primary">' +
            sfPrimary +
            "</button>" +
            "</div>" +
            "</div>"
          );
        }

        // ---- Hi-Fi A1 (narrow) — degraded-slug overrides. Batch 3: feedback + date ----

        case "loader": {
          // Registry axis: Percent (auto-named variants). "loader" is the
          // indeterminate activity spinner (determinate progress is the
          // progress-bar-small leaf). Optional visible Label; role=status +
          // aria-live for assistive tech.
          var ldLabel = props.Label
            ? '<span class="ds-loader__label">' + esc(props.Label) + "</span>"
            : "";
          return (
            '<div class="ds-loader" role="status" aria-live="polite" aria-label="' +
            esc(props.Label || "Loading") +
            '">' +
            '<span class="ds-loader__spinner" aria-hidden="true"></span>' +
            ldLabel +
            "</div>"
          );
        }

        case "calendar": {
          // Registry axes: Type = Single date select | Date | Month | Single;
          // Selection = Single | Range | Year. A static month grid
          // (DETERMINISTIC — no Date()): header (month/year + prev/next nav) +
          // weekday row + day cells. Range renders a start→end band; else a
          // single selected day. Month label is overridable via props.Month.
          var calRange = v.Selection === "Range";
          var calMonth = esc(props.Month || "June 2026");
          var calWeek = ["S", "M", "T", "W", "T", "F", "S"]
            .map(function (d) {
              return (
                '<span class="ds-calendar__weekday" aria-hidden="true">' +
                d +
                "</span>"
              );
            })
            .join("");
          // Static month layout: 2 leading blanks, then days 1..30.
          var calCells = [
            '<span class="ds-calendar__day is-blank" aria-hidden="true"></span>',
            '<span class="ds-calendar__day is-blank" aria-hidden="true"></span>',
          ];
          for (var cd = 1; cd <= 30; cd++) {
            var cdCls = "ds-calendar__day";
            var cdSel = false; // selected → aria-pressed (non-visual selection state)
            if (calRange) {
              if (cd >= 12 && cd <= 16) {
                cdCls += " is-range";
                cdSel = true;
              }
              if (cd === 12) cdCls += " is-range-start";
              if (cd === 16) cdCls += " is-range-end";
            } else if (cd === 15) {
              cdCls += " is-selected";
              cdSel = true;
            }
            calCells.push(
              '<button class="' +
                cdCls +
                '" type="button"' +
                (cdSel ? ' aria-pressed="true"' : "") +
                ">" +
                cd +
                "</button>",
            );
          }
          return (
            '<div class="ds-calendar">' +
            '<div class="ds-calendar__header">' +
            '<button class="ds-calendar__nav" type="button" aria-label="Previous month">' +
            renderIcon("chevron-left") +
            "</button>" +
            '<span class="ds-calendar__month">' +
            calMonth +
            "</span>" +
            '<button class="ds-calendar__nav" type="button" aria-label="Next month">' +
            renderIcon("chevron-left", { rotate: 180 }) +
            "</button>" +
            "</div>" +
            '<div class="ds-calendar__weekdays">' +
            calWeek +
            "</div>" +
            // No role="grid": a real grid requires row/gridcell descendants,
            // which this static month strip does not provide; claiming the role
            // without them is invalid ARIA (axe aria-required-children). Left as
            // a styled group of day buttons; selection carried via aria-pressed.
            '<div class="ds-calendar__grid">' +
            calCells.join("") +
            "</div>" +
            "</div>"
          );
        }

        default: {
          // Phase 1B: PREFER rendering the component per-instance from its
          // captured appearance doc so the instance's own variant selects the
          // right colors. Docs are injected server-side via setAnatomyDocMap()
          // and embedded as window.__dsAnatomyDocs in browser deliverables.
          var docs =
            (typeof window !== "undefined" && window.__dsAnatomyDocs) ||
            _serverAnatomyDocs ||
            {};
          var doc = docs[slug];
          if (
            doc &&
            appearanceRender &&
            appearanceRender.renderAppearanceComponent
          ) {
            var out = appearanceRender.renderAppearanceComponent(doc, {
              variant: v,
              props: props,
            });
            if (out) return out;
          }
          // No appearance doc for this slug (or it rendered empty): a clean
          // labeled chip. Total tolerance — this seam never throws. (The
          // legacy slug→pre-rendered-HTML anatomy map fallback — "path c",
          // formerly exposed as a window global — was retired in Group C.)
          return gracefulChip();
        }
      }
    } catch (e) {
      // Defense in depth: any case throwing on a hostile prop shape degrades to
      // the same graceful chip rather than propagating. The seam never throws.
      return gracefulChip();
    }
  }

  // Slugs with a real leaf (everything else chip-degrades). Gated against the
  // switch cases by tests/renderers/ds-built-slugs.test.js — update BOTH.
  var BUILT_SLUGS = [
    "button",
    "text-input",
    "checkbox",
    "radio-button",
    "toggle",
    "tag-default",
    "badge",
    "search",
    "card-for-items",
    "global-header",
    "side-nav",
    "page-header",
    "breadcrumb",
    "tabs",
    "table",
    "modal",
    "empty-state",
    "alert-banner",
    "chat-with-ai-steward",
    // Hi-Fi Slice 1 (Task 4): transform-target leaves
    "notification",
    "stepper",
    "tooltip",
    "input-date",
    "rich-text",
    "dropdown-select-default",
    "progress-bar-small",
    "tag-interactive",
    // Hi-Fi A1 (narrow) — degraded-slug overrides. Batch 1: overlays.
    "popover",
    "account-dropdown",
    "app-switcher-dropdown",
    // Hi-Fi A1 (narrow) — degraded-slug overrides. Batch 2: controls.
    "segmented-control",
    "toolbar",
    "sticky-footer",
    // Hi-Fi A1 (narrow) — degraded-slug overrides. Batch 3: feedback + date.
    "loader",
    "calendar",
  ];

  exports.renderDSComponent = renderDSComponent;
  exports.setAnatomyDocMap = setAnatomyDocMap;
  exports.setVariantStyleMap = setVariantStyleMap;
  exports.renderIcon = renderIcon;
  exports.esc = esc;
  exports.parseVariant = parseVariant;
  exports.normalizeProps = normalizeProps;
  exports.BUILT_SLUGS = BUILT_SLUGS;
})(
  typeof module !== "undefined"
    ? module.exports
    : (window.dsHtmlMap = window.dsHtmlMap || {}),
);
