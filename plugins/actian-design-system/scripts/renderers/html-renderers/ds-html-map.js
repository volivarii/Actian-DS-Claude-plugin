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

  // renderIcon(slug, {rotate}) -> bare '<svg class="ds-icon[ ds-icon--rotN]" …>'.
  // Unknown slug -> '' (never throws; the orphan-ref gate prevents shipping one).
  function renderIcon(slug, opts) {
    var icon = dsIcons && dsIcons[slug];
    if (!icon || !icon.viewBox || !icon.body) return "";
    var cls = "ds-icon";
    if (opts && opts.rotate) cls += " ds-icon--rot" + opts.rotate;
    return (
      '<svg class="' +
      cls +
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
          // Top app bar (chrome). The brand app label defaults to the App-type
          // variant value (Studio/Explorer/Admin), then to "Studio".
          var headerApp = esc(props.App || v["App type"] || "Studio");
          var headerAvatar = esc(props.Account || "AU");
          return (
            '<header class="ds-header">' +
            '<div class="ds-header__brand">' +
            '<span class="ds-header__logo"></span>' +
            '<span class="ds-header__app">' +
            headerApp +
            "</span>" +
            "</div>" +
            '<div class="ds-header__spacer"></div>' +
            '<div class="ds-header__actions">' +
            '<span class="ds-header__avatar">' +
            headerAvatar +
            "</span>" +
            "</div>" +
            "</header>"
          );
        }

        case "side-nav": {
          // Left navigation rail (chrome). Items are a comma-separated label
          // list; the Active label's row is marked is-active (defaults to the
          // first item). Collapsed view hides labels via the CSS modifier.
          var navCls = "ds-sidenav";
          if (v.View === "Collapsed") navCls += " ds-sidenav--collapsed";
          var navItems = String(
            props.Items || "Catalog, Pipelines, Connections, Settings",
          )
            .split(",")
            .map(function (s) {
              return s.trim();
            })
            .filter(function (s) {
              return s.length > 0;
            });
          var navActive =
            (props.Active != null ? String(props.Active).trim() : "") ||
            navItems[0];
          var navRows = navItems
            .map(function (item) {
              var itemCls = "ds-sidenav__item";
              if (item === navActive) itemCls += " is-active";
              return (
                '<a class="' +
                itemCls +
                '"><span class="ds-sidenav__icon"></span>' +
                '<span class="ds-sidenav__label">' +
                esc(item) +
                "</span></a>"
              );
            })
            .join("");
          return '<nav class="' + navCls + '">' + navRows + "</nav>";
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

  exports.renderDSComponent = renderDSComponent;
  exports.renderIcon = renderIcon;
  exports.esc = esc;
  exports.parseVariant = parseVariant;
  exports.normalizeProps = normalizeProps;
})(
  typeof module !== "undefined"
    ? module.exports
    : (window.dsHtmlMap = window.dsHtmlMap || {}),
);
