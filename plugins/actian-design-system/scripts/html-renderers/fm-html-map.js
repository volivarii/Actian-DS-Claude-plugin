// scripts/html-renderers/fm-html-map.js
// FM component → HTML mapping table.
// Works in both Node.js (for testing) and the browser (inlined in flow-renderer.js).

(function (exports) {
  "use strict";

  function esc(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * parseVariant('Type=Primary, Size=md, State=Default')
   * → { Type: 'Primary', Size: 'md', State: 'Default' }
   */
  function parseVariant(variantString) {
    if (!variantString) return {};
    var result = {};
    variantString.split(",").forEach(function (part) {
      var kv = part.trim().split("=");
      if (kv.length === 2) {
        result[kv[0].trim()] = kv[1].trim();
      }
    });
    return result;
  }

  /**
   * renderFMComponent(node)
   * node = { type: 'INSTANCE', ref: 'fmButton', variant: '...', props: {...}, name: '...' }
   * Returns an HTML string.
   */
  function renderFMComponent(node) {
    var ref = node.ref || "";
    var v = parseVariant(node.variant || "");
    var props = node.props || {};
    var name = node.name || ref;

    switch (ref) {
      case "fmButton": {
        var typeMap = {
          Primary: "primary",
          Secondary: "secondary",
          Outline: "outline",
          Destructive: "destructive",
        };
        var sizeMap = { md: "md", sm: "sm", MD: "md", SM: "sm" };
        var btnType = typeMap[v.Type] || "primary";
        var btnSize = sizeMap[v.Size] || "md";
        var label = esc(props.Label || "");
        return (
          '<div class="fm-button fm-button--' +
          btnType +
          " fm-button--" +
          btnSize +
          '">' +
          label +
          "</div>"
        );
      }

      case "fmTextInput": {
        var stateMap = {
          Empty: "empty",
          Placeholder: "placeholder",
          Default: "default",
          Disabled: "disabled",
        };
        var inputType = stateMap[v.Type] || stateMap[v.State] || "default";
        var text = esc(props["Input Text"] || "");
        var inputHtml =
          '<div class="fm-input fm-input--' +
          inputType +
          '"><span class="fm-input__text">' +
          text +
          "</span></div>";
        if (props["Show label"] !== false && props["Label Text"]) {
          var labelHtml =
            '<div class="fm-input-label">' +
            '<span class="fm-input-label__text">' +
            esc(props["Label Text"]) +
            "</span>";
          if (props["Caption"] !== false && props["Caption Text"]) {
            labelHtml +=
              '<span class="fm-input-label__caption">' +
              esc(props["Caption Text"]) +
              "</span>";
          }
          labelHtml += "</div>";
          return (
            '<div class="fm-field-group">' + labelHtml + inputHtml + "</div>"
          );
        }
        return inputHtml;
      }

      case "fmDropdown": {
        var ddMap = {
          Placeholder: "placeholder",
          Open: "open",
          Filled: "filled",
          Disabled: "disabled",
        };
        var ddType = ddMap[v.Type] || ddMap[v.State] || "placeholder";
        var ddText = esc(props["Dropdown Text"] || "");
        var ddHtml =
          '<div class="fm-dropdown fm-dropdown--' +
          ddType +
          '"><span>' +
          ddText +
          '</span><span class="fm-dropdown__arrow">&#9662;</span></div>';
        if (props["Show label"] !== false && props["Label Text"]) {
          var ddLabelHtml =
            '<div class="fm-input-label">' +
            '<span class="fm-input-label__text">' +
            esc(props["Label Text"]) +
            "</span>";
          if (props["Caption"] !== false && props["Caption Text"]) {
            ddLabelHtml +=
              '<span class="fm-input-label__caption">' +
              esc(props["Caption Text"]) +
              "</span>";
          }
          ddLabelHtml += "</div>";
          return (
            '<div class="fm-field-group">' + ddLabelHtml + ddHtml + "</div>"
          );
        }
        return ddHtml;
      }

      case "fmSearchInput": {
        var searchType = (v.Type || v.State || "default").toLowerCase();
        var searchText = esc(props["Input Text"] || "");
        return (
          '<div class="fm-search-input fm-search-input--' +
          searchType +
          '"><span>' +
          searchText +
          "</span></div>"
        );
      }

      case "fmTextArea": {
        var taContent =
          (v.Content || "").toLowerCase().replace(/\s+/g, "-") || "empty";
        return '<div class="fm-textarea fm-textarea--' + taContent + '"></div>';
      }

      case "fmDateInput": {
        var dateState = (v.State || "default").toLowerCase();
        var dateText = esc(props["Input Text"] || "");
        return (
          '<div class="fm-date-input fm-date-input--' +
          dateState +
          '"><span>' +
          dateText +
          "</span></div>"
        );
      }

      case "fmInputLabel": {
        var labelText = esc(props["Label Text"] || "");
        var captionText = esc(props["Caption Text"] || "");
        return (
          '<div class="fm-input-label">' +
          '<span class="fm-input-label__text">' +
          labelText +
          "</span>" +
          '<span class="fm-input-label__caption">' +
          captionText +
          "</span>" +
          "</div>"
        );
      }

      case "fmTableCell": {
        var cellTypeMap = {
          Header: "header",
          Text: "text",
          Pill: "pill",
          Placeholder: "placeholder",
        };
        var cellType = cellTypeMap[v.Type] || "text";
        var cellText = esc(props["Cell Text"] || props["Text"] || name || "");
        return (
          '<div class="fm-table-cell fm-table-cell--' +
          cellType +
          '">' +
          cellText +
          "</div>"
        );
      }

      case "fmCheckbox": {
        var cbStateMap = {
          Off: "off",
          On: "on",
          Indeterminate: "indeterminate",
          Disabled: "disabled",
        };
        var cbState = cbStateMap[v.State] || "off";
        return '<div class="fm-checkbox fm-checkbox--' + cbState + '"></div>';
      }

      case "fmRadioButton": {
        var rbStateMap = { On: "on", Off: "off", Disabled: "disabled" };
        var rbState = rbStateMap[v.State] || "off";
        return '<div class="fm-radio fm-radio--' + rbState + '"></div>';
      }

      case "fmToggle": {
        var tgStateMap = { Off: "off", On: "on", Disabled: "disabled" };
        var tgState = tgStateMap[v.State] || "off";
        return '<div class="fm-toggle fm-toggle--' + tgState + '"></div>';
      }

      case "fmAlert": {
        var alertTypeMap = {
          Success: "success",
          Error: "error",
          Warning: "warning",
          Info: "info",
        };
        var alertType = alertTypeMap[v.Type] || "info";
        var alertText = esc(props["Alert Text"] || props["Message"] || "");
        return (
          '<div class="fm-alert fm-alert--' +
          alertType +
          '">' +
          '<div class="fm-alert__bar"></div>' +
          '<div class="fm-alert__content">' +
          alertText +
          "</div>" +
          "</div>"
        );
      }

      case "fmBanner": {
        var bannerText = esc(props["Banner Text"] || props["Text"] || "");
        return '<div class="fm-banner">' + bannerText + "</div>";
      }

      case "fmDialog": {
        return (
          '<div class="fm-dialog">' +
          '<div class="fm-dialog__title">Dialog</div>' +
          '<div class="fm-dialog__body"></div>' +
          "</div>"
        );
      }

      case "fmStepper": {
        var stepStateMap = {
          Active: "active",
          Complete: "complete",
          Upcoming: "upcoming",
        };
        var stepState = stepStateMap[v.State] || "upcoming";
        var stepNum = esc(props["Step"] || props["Number"] || "");
        return (
          '<div class="fm-stepper fm-stepper--' +
          stepState +
          '">' +
          stepNum +
          "</div>"
        );
      }

      case "fmBadge": {
        var badgeSizeMap = {
          Small: "small",
          Medium: "medium",
          Large: "large",
          sm: "small",
          md: "medium",
          lg: "large",
        };
        var badgeSize = badgeSizeMap[v.Size] || "medium";
        var badgeText = esc(
          props["Badge Text"] || props["Text"] || props["Label"] || "",
        );
        return (
          '<div class="fm-badge fm-badge--' +
          badgeSize +
          '">' +
          badgeText +
          "</div>"
        );
      }

      case "fmTag": {
        var tagStyleMap = {
          Filled: "filled",
          Outline: "outline",
          Light: "light",
        };
        var tagStyle = tagStyleMap[v.Style] || tagStyleMap[v.Type] || "filled";
        var tagText = esc(
          props["Tag Text"] || props["Label"] || props["Text"] || "",
        );
        return (
          '<div class="fm-tag fm-tag--' + tagStyle + '">' + tagText + "</div>"
        );
      }

      case "fmChip": {
        var chipText = esc(
          props["Chip Text"] || props["Label"] || props["Text"] || "",
        );
        return '<div class="fm-chip">' + chipText + "</div>";
      }

      case "fmTab": {
        var tabStateMap = { On: "on", Off: "off", Placeholder: "placeholder" };
        var tabState = tabStateMap[v.State] || "off";
        var tabText = esc(
          props["Tab Text"] || props["Label"] || props["Text"] || "",
        );
        return (
          '<div class="fm-tab fm-tab--' + tabState + '">' + tabText + "</div>"
        );
      }

      case "fmToast": {
        var toastStyleMap = { Standard: "standard", Outline: "outline" };
        var toastStyle =
          toastStyleMap[v.Style] || toastStyleMap[v.Type] || "standard";
        var toastText = esc(
          props["Toast Text"] || props["Message"] || props["Text"] || "",
        );
        return (
          '<div class="fm-toast fm-toast--' +
          toastStyle +
          '">' +
          toastText +
          "</div>"
        );
      }

      case "fmEmptyState": {
        return (
          '<div class="fm-empty-state">' +
          '<div class="fm-empty-state__icon"></div>' +
          '<div class="fm-empty-state__text">No items</div>' +
          "</div>"
        );
      }

      case "fmPlaceholder": {
        var phTypeMap = {
          "Label+1line": "label+1line",
          "Label+3lines": "label+3lines",
          "Label+6lines": "label+6lines",
          "Label+Avatars": "label+avatars",
          Metric: "metric",
        };
        var phType =
          phTypeMap[v.Type] || (v.Type || "label+1line").toLowerCase();
        return (
          '<div class="fm-placeholder fm-placeholder--' + phType + '"></div>'
        );
      }

      case "fmAppHeader": {
        var appHeaderLabels = {
          Admin: "Administration",
          Administration: "Administration",
          Studio: "Studio",
          Explorer: "Explorer",
          Actian: "Actian",
        };
        var appLabel =
          appHeaderLabels[v.Type] || appHeaderLabels[v.Theme] || "Studio";
        return (
          '<div class="fm-app-header" data-name="App header">' +
          '<div class="fm-app-header__logo"></div>' +
          '<div class="fm-app-header__label">' +
          esc(appLabel) +
          "</div>" +
          '<div class="fm-app-header__spacer"></div>' +
          '<div class="fm-app-header__avatar"></div>' +
          "</div>"
        );
      }

      case "fmNavItem": {
        var navStateMap = {
          On: "active",
          Off: "off",
          Placeholder: "placeholder",
        };
        var navState = navStateMap[v.State] || "off";
        if (navState === "placeholder") {
          return (
            '<div class="fm-nav-item fm-nav-item--placeholder">' +
            '<div class="fm-nav-item__icon"></div>' +
            '<div class="fm-nav-item__bar"></div>' +
            "</div>"
          );
        }
        var navLabel = esc(props.Label || "");
        return (
          '<div class="fm-nav-item fm-nav-item--' +
          navState +
          '">' +
          '<div class="fm-nav-item__icon"></div>' +
          '<div class="fm-nav-item__label">' +
          navLabel +
          "</div>" +
          "</div>"
        );
      }

      case "fmPageHeader": {
        var phTitle = esc(props.Title || "");
        var phSubtitle = props.Subtitle ? esc(props.Subtitle) : null;
        var phTypeVal = v.Type || "";
        var hasActions =
          phTypeVal.indexOf("actions") !== -1 ||
          phTypeVal.indexOf("Actions") !== -1;
        var html =
          '<div class="fm-page-header" data-name="Page header">' +
          '<div class="fm-page-header__title">' +
          phTitle +
          "</div>";
        if (phSubtitle) {
          html +=
            '<div class="fm-page-header__subtitle">' + phSubtitle + "</div>";
        }
        if (hasActions && props.Actions) {
          html += '<div class="fm-page-header__actions">';
          var actions = Array.isArray(props.Actions)
            ? props.Actions
            : [props.Actions];
          actions.forEach(function (a) {
            html +=
              '<div class="fm-button fm-button--primary">' + esc(a) + "</div>";
          });
          html += "</div>";
        }
        html += "</div>";
        return html;
      }

      case "fmIconButtons": {
        var iconTypeMap = {
          Primary: "primary",
          Secondary: "secondary",
          Outline: "outline",
        };
        var iconType = iconTypeMap[v.Type] || "secondary";
        return (
          '<div class="fm-icon-button fm-icon-button--' + iconType + '"></div>'
        );
      }

      case "fmSpinner": {
        return '<div class="fm-spinner"></div>';
      }

      case "fmProgressBar": {
        var progressVal = v.Completion || v.Progress || "0%";
        return (
          '<div class="fm-progress-bar">' +
          '<div class="fm-progress-bar__fill" style="width:' +
          esc(progressVal) +
          '"></div>' +
          "</div>"
        );
      }

      case "fmMultiSelectDropdown": {
        var msText = esc(props["Dropdown Text"] || "");
        return (
          '<div class="fm-dropdown fm-dropdown--multi"><span>' +
          msText +
          "</span></div>"
        );
      }

      case "fmMenuItem": {
        var miStateMap = {
          Default: "default",
          Hover: "hover",
          Active: "active",
        };
        var miState = miStateMap[v.State] || "default";
        var miText = esc(
          props["Menu Item Text"] || props["Label"] || props["Text"] || "",
        );
        return (
          '<div class="fm-menu-item fm-menu-item--' +
          miState +
          '">' +
          miText +
          "</div>"
        );
      }

      case "fmTooltip": {
        var ttText = esc(props["Tooltip Text"] || props["Text"] || "");
        return '<div class="fm-tooltip">' + ttText + "</div>";
      }

      case "fmRichTextField": {
        var rtText = esc(props["Input Text"] || "");
        return (
          '<div class="fm-textarea fm-textarea--rich">' + rtText + "</div>"
        );
      }

      case "fmSlider": {
        var sliderVal = v.Progress || v.Value || "0%";
        return (
          '<div class="fm-slider">' +
          '<div class="fm-slider__fill" style="width:' +
          esc(sliderVal) +
          '"></div>' +
          "</div>"
        );
      }

      default: {
        return (
          '<div class="fm-component" data-ref="' +
          esc(ref) +
          '" data-name="' +
          esc(name) +
          '">[' +
          esc(ref) +
          "]</div>"
        );
      }
    }
  }

  exports.esc = esc;
  exports.renderFMComponent = renderFMComponent;
  exports.parseVariant = parseVariant;

  exports.genCard = function (meta, promptFallback) {
    var prompt = meta.prompt || promptFallback || "";
    if (prompt.length > 200) prompt = prompt.substring(0, 200) + "...";
    return (
      '<div class="gen-card" data-name="Generation log">' +
      '<div class="gen-card__label">GENERATED</div>' +
      '<div class="gen-card__field"><span>Skill</span>' +
      esc(meta.skill || "") +
      "</div>" +
      '<div class="gen-card__field"><span>Prompt</span>' +
      esc(prompt) +
      "</div>" +
      '<div class="gen-card__field"><span>Date</span>' +
      esc(meta.generatedAt || meta.date || "") +
      "</div>" +
      '<div class="gen-card__field"><span>Duration</span>' +
      esc(meta.duration || "") +
      "</div>" +
      '<div class="gen-card__field"><span>Model</span>' +
      esc(meta.model || "") +
      "</div>" +
      '<div class="gen-card__field"><span>Plugin</span>' +
      esc(meta.pluginVersion || "") +
      "</div>" +
      "</div>"
    );
  };
})(
  typeof module !== "undefined"
    ? module.exports
    : (window.fmHtmlMap = window.fmHtmlMap || {}),
);
