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
  // Make the hand-written renderers tolerant of the prop-key shapes the data
  // actually ships. Authoring may carry Figma "#id" suffixes (e.g.
  // "Label#1411:32") that the Figma push resolves at runtime (split('#')[0])
  // but the HTML renderer historically could not — so a suffixed key rendered
  // blank in HTML while Figma rendered it correctly (a twin divergence). This
  // aliases each suffixed key to its base name, without clobbering an exact
  // key, so a case reading props["Label"] also finds "Label#1411:32".
  function normalizeProps(props) {
    var out = {};
    var keys = Object.keys(props || {});
    keys.forEach(function (k) {
      out[k] = props[k];
    });
    keys.forEach(function (k) {
      var base = k.split("#")[0];
      if (base !== k && !(base in out)) out[base] = props[k];
    });
    return out;
  }

  function renderFMComponent(node) {
    node = node || {};
    var ref = node.ref || "";
    var name = node.name || ref;

    // Graceful labeled chip — used for unmapped refs (default case) AND as the
    // never-throws fallback if any case throws on a hostile prop shape. A single
    // bad node must never blank the whole preview (the browser render loop has
    // no try/catch), so the interpreter itself guarantees it never throws.
    function gracefulChip() {
      return (
        '<span class="fm-component" data-ref="' +
        esc(ref) +
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
          return (
            '<div class="fm-textarea fm-textarea--' + taContent + '"></div>'
          );
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
          // A single fmTableCell instance can model a whole row via numbered
          // "Label", "Label 2"… "Label 5" columns (how the FM set authors a
          // header/data row). Render each present column as a cell so the row
          // shows its real content instead of just the node name.
          var cols = [];
          ["Label", "Label 2", "Label 3", "Label 4", "Label 5"].forEach(
            function (k) {
              if (props[k] != null && props[k] !== "") cols.push(esc(props[k]));
            },
          );
          if (cols.length > 1) {
            return (
              '<div class="fm-table-cell fm-table-cell--' +
              cellType +
              ' fm-table-cell--row">' +
              cols
                .map(function (c) {
                  return '<span class="fm-table-cell__col">' + c + "</span>";
                })
                .join("") +
              "</div>"
            );
          }
          var cellText = esc(
            props["Cell Text"] ||
              props["Text"] ||
              props["Label"] ||
              cols[0] ||
              name ||
              "",
          );
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
          var stepNum = esc(
            props["Step number"] || props["Step"] || props["Number"] || "",
          );
          var stepLabel = esc(props["Label"] || props["Text"] || "");
          var dot =
            '<span class="fm-stepper__dot fm-stepper__dot--' +
            stepState +
            '">' +
            (stepState === "complete" ? "&#10003;" : stepNum) +
            "</span>";
          var lbl = stepLabel
            ? '<span class="fm-stepper__label">' + stepLabel + "</span>"
            : "";
          return (
            '<div class="fm-stepper fm-stepper--' +
            stepState +
            '">' +
            dot +
            lbl +
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
          var tagStyle =
            tagStyleMap[v.Style] || tagStyleMap[v.Type] || "filled";
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
          var tabStateMap = {
            On: "on",
            Off: "off",
            Placeholder: "placeholder",
          };
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
                '<div class="fm-button fm-button--primary">' +
                esc(a) +
                "</div>";
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
            '<div class="fm-icon-button fm-icon-button--' +
            iconType +
            '"></div>'
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

        case "fmTabs": {
          var tabsRaw = props.Tabs || props.Labels;
          var tabs = (
            Array.isArray(tabsRaw)
              ? tabsRaw.map(function (x) {
                  return String(x);
                })
              : String(tabsRaw == null ? "Tab 1, Tab 2, Tab 3" : tabsRaw).split(
                  ",",
                )
          ).map(function (t) {
            return t.trim();
          });
          var active = props.Active || tabs[0];
          return (
            '<div class="fm-tabs">' +
            tabs
              .map(function (t) {
                var tabCls = t === active ? "fm-tab fm-tab--active" : "fm-tab";
                return '<div class="' + tabCls + '">' + esc(t) + "</div>";
              })
              .join("") +
            "</div>"
          );
        }
        case "fmMenu": {
          var menuRaw = props.Items;
          var items = (
            Array.isArray(menuRaw)
              ? menuRaw.map(function (x) {
                  return String(x);
                })
              : String(
                  menuRaw == null ? "Item 1, Item 2, Item 3" : menuRaw,
                ).split(",")
          ).map(function (s) {
            return s.trim();
          });
          return (
            '<div class="fm-menu">' +
            items
              .map(function (it) {
                return '<div class="fm-menu-item">' + esc(it) + "</div>";
              })
              .join("") +
            "</div>"
          );
        }
        case "fmMultiSelectMenuItem": {
          var checked =
            v.State === "Selected" ||
            props.Selected === true ||
            props.Selected === "true";
          var cbCls = checked
            ? "fm-checkbox fm-checkbox--on"
            : "fm-checkbox fm-checkbox--off";
          return (
            '<div class="fm-menu-item fm-menu-item--multi">' +
            '<span class="' +
            cbCls +
            '"></span>' +
            "<span>" +
            esc(props.Label || "Option") +
            "</span></div>"
          );
        }
        case "fmNavBar": {
          var navRaw = props.Items;
          var navItems = (
            Array.isArray(navRaw)
              ? navRaw.map(function (x) {
                  return String(x);
                })
              : String(
                  navRaw == null ? "Home, Reports, Settings" : navRaw,
                ).split(",")
          ).map(function (s) {
            return s.trim();
          });
          return (
            '<div class="fm-nav-bar">' +
            navItems
              .map(function (it) {
                return '<div class="fm-nav-item">' + esc(it) + "</div>";
              })
              .join("") +
            "</div>"
          );
        }
        case "fmUser": {
          var uname = String(props.Name || props.Label || "User");
          var initials = uname
            .split(/\s+/)
            .map(function (w) {
              return w.charAt(0);
            })
            .join("")
            .slice(0, 2)
            .toUpperCase();
          return (
            '<div class="fm-user"><span class="fm-user__avatar">' +
            esc(initials) +
            '</span><span class="fm-user__name">' +
            esc(uname) +
            "</span></div>"
          );
        }

        default: {
          // Graceful fallback for icons (no glyph data in the registry) and any
          // unmapped ref: a clean labeled chip using the human name. Never a raw [ref].
          return gracefulChip();
        }
      }
    } catch (e) {
      // Defense in depth: any case throwing on a hostile prop shape degrades to
      // the same graceful chip rather than propagating (which would blank the
      // entire preview). The seam never throws.
      return gracefulChip();
    }
  }

  exports.esc = esc;
  exports.renderFMComponent = renderFMComponent;
  exports.parseVariant = parseVariant;
  exports.normalizeProps = normalizeProps;

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
