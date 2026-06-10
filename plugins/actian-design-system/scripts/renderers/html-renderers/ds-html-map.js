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
          var typeMap = {
            Primary: "primary",
            Secondary: "secondary",
            Tertiary: "tertiary",
            "Critical primary": "critical",
            "Critical secondary": "critical-secondary",
            Icon: "primary",
          };
          var btnType = typeMap[v.Type] || "primary";
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

        case "input": {
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

        case "checkbox-with-label": {
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
          // Color variant axis exists in the kit (Default, Gray, Pink, …) but
          // this slice renders the Default palette for every Color; the
          // per-Color hue palette (<hue>/25 bg + <hue>/50 border) is deferred.
          var tagCls = "ds-tag";
          var tagIcon = "";
          if (props["Leading icon show"]) {
            tagCls += " ds-tag--with-icon";
            tagIcon =
              '<span class="ds-tag__icon">' +
              renderIcon("directory") +
              "</span>";
          }
          return (
            '<span class="' +
            tagCls +
            '">' +
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

        case "breadcrumbs": {
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

        default: {
          // Unmapped slug: a clean labeled chip using the human name.
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
    "input",
    "checkbox-with-label",
    "radio-button",
    "toggle",
    "tag-default",
    "badge",
    "search",
    "card-for-items",
    "global-header",
    "side-nav",
    "page-header",
    "breadcrumbs",
    "tabs",
    "table",
    "modal",
    "empty-state",
    "alert-banner",
    "chat-with-ai-steward",
  ];

  exports.renderDSComponent = renderDSComponent;
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
