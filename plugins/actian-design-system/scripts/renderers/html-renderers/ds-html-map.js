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
    function () {
      return {};
    };
  var normalizeProps =
    fm.normalizeProps ||
    function (p) {
      return p || {};
    };

  // Inline icon glyphs (geometry in raw px — viewBox coords, not design tokens).
  var ICON_PLUS =
    '<span class="ds-button__icon"><svg viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.67" stroke-linecap="round"/></svg></span>';
  var ICON_CHEVRON_DOWN_BTN =
    '<span class="ds-button__icon"><svg viewBox="0 0 20 20" fill="none"><path d="M5 7.5l5 5 5-5" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  var ICON_CHEVRON_DOWN_INPUT =
    '<span class="ds-input__icon"><svg viewBox="0 0 20 20" fill="none"><path d="M5 7.5l5 5 5-5" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  var ICON_CHECK =
    '<span class="ds-checkbox__check"><svg viewBox="0 0 14 14" fill="none"><path d="M3 7.5l2.5 2.5 5.5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';

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
            "Critical primary": "primary",
            Icon: "primary",
          };
          var btnType = typeMap[v.Type] || "primary";
          var cls = "ds-button ds-button--" + btnType;
          if (v.Size === "Small") cls += " ds-button--small";
          if (v.State === "Disabled") cls += " is-disabled";
          var lead = props["Leading icon show"] ? ICON_PLUS : "";
          var trail = props["Trailing icon show"]
            ? ICON_CHEVRON_DOWN_BTN
            : "";
          var label = esc(props.Label || "");
          return (
            '<button class="' + cls + '">' + lead + label + trail + "</button>"
          );
        }

        case "input": {
          var inLabel = esc(props.Label || "Label");
          var inPlaceholder = esc(props["Placeholder text"] || "Placeholder text");
          return (
            '<div class="ds-field">' +
            '<div class="ds-field__label-row"><span class="ds-field__label">' +
            inLabel +
            "</span></div>" +
            '<div class="ds-input"><span class="ds-input__text">' +
            inPlaceholder +
            "</span>" +
            ICON_CHEVRON_DOWN_INPUT +
            "</div>" +
            "</div>"
          );
        }

        case "checkbox-with-label": {
          var cbCls = "ds-checkbox";
          if (v.Selected === "Yes") cbCls += " ds-checkbox--checked";
          var cbLabel = esc(props.Label || "Label");
          return (
            '<label class="' +
            cbCls +
            '"><span class="ds-checkbox__box">' +
            ICON_CHECK +
            '</span><span class="ds-checkbox__label">' +
            cbLabel +
            "</span></label>"
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

  exports.renderDSComponent = renderDSComponent;
  exports.esc = esc;
  exports.parseVariant = parseVariant;
})(
  typeof module !== "undefined"
    ? module.exports
    : (window.dsHtmlMap = window.dsHtmlMap || {}),
);
