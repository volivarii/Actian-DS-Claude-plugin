// scripts/html-renderers/brief-renderer.js
// Client-side renderer for component brief cards.
// Reads brief-data.json from #spec-data, builds all cards into #cards-container.
// The AI writes only componentHtml() for Cards 2-3 + component CSS.

(function () {
  "use strict";

  // --- Shared Helpers ---

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

  function genCard(meta) {
    return (
      '<div class="gen-card" data-name="Generation log">' +
      '<div class="gen-card__label">GENERATED</div>' +
      field("Skill", meta.skill) +
      field("Prompt", "component-brief " + esc(meta.component)) +
      field("Date", meta.generatedAt) +
      field("Duration", meta.duration) +
      field("Model", meta.model) +
      field("Plugin", "v" + meta.pluginVersion) +
      "</div>"
    );
  }

  function field(key, val) {
    return (
      '<div class="gen-card__field"><span class="gen-card__key">' +
      esc(key) +
      "</span> " +
      esc(val) +
      "</div>"
    );
  }

  function cardShell(title, subtitle, contentHtml, dataName) {
    return (
      '<div class="brief-card" data-name="' +
      esc(dataName || title) +
      '">' +
      '<div class="card-section-header">' +
      '<div class="card-section-header__title">' +
      esc(title) +
      "</div>" +
      (subtitle
        ? '<div class="card-section-header__subtitle">' +
          esc(subtitle) +
          "</div>"
        : "") +
      "</div>" +
      '<div class="card-content">' +
      contentHtml +
      "</div>" +
      "</div>"
    );
  }

  function sectionTitle(title) {
    return '<div class="section-title">' + esc(title) + "</div>";
  }

  function cardDivider() {
    return '<div class="card-divider"></div>';
  }

  function specTable(headers, rows, opts) {
    opts = opts || {};
    var html = '<table class="spec-table"><thead><tr>';
    headers.forEach(function (h) {
      html += "<th>" + esc(h) + "</th>";
    });
    html += "</tr></thead><tbody>";
    rows.forEach(function (row) {
      html += "<tr>";
      row.forEach(function (cell, i) {
        var cls = (opts.cellClasses && opts.cellClasses[i]) || "";
        html +=
          "<td" + (cls ? ' class="' + cls + '"' : "") + ">" + cell + "</td>";
      });
      html += "</tr>";
    });
    html += "</tbody></table>";
    return html;
  }

  function swatchDot(hex) {
    return (
      '<span class="swatch"><span class="swatch__dot" style="background:' +
      esc(hex) +
      ';"></span></span>'
    );
  }

  function contrastBadge(status) {
    if (status === "Pass")
      return '<span class="badge-pass">&#10003; Pass</span>';
    if (status === "Exempt")
      return '<span class="badge-exempt">&#9888; Exempt</span>';
    return '<span class="badge-exempt">&#10007; Fail</span>';
  }

  function reqBadge(required) {
    return required
      ? '<span class="prop-required">REQ</span>'
      : '<span class="prop-optional">OPT</span>';
  }

  function doDontPair(pair) {
    return (
      '<div class="do-dont-row">' +
      '<div class="do-dont-card">' +
      '<div class="do-dont-card__bar do-dont-card__bar--do"></div>' +
      '<div class="do-dont-card__label do-dont-card__label--do">Do</div>' +
      '<div class="do-dont-card__example">' +
      esc(pair.doLabel || pair.do || "") +
      (pair.doDetail ? "<br>" + esc(pair.doDetail) : "") +
      "</div>" +
      "</div>" +
      '<div class="do-dont-card">' +
      '<div class="do-dont-card__bar do-dont-card__bar--dont"></div>' +
      '<div class="do-dont-card__label do-dont-card__label--dont">Don\'t</div>' +
      '<div class="do-dont-card__example">' +
      esc(pair.dontLabel || pair.dont || "") +
      (pair.dontDetail ? "<br>" + esc(pair.dontDetail) : "") +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  var TOKEN_CLASS = {
    selector: "sel",
    property: "prop",
    value: "val",
    comment: "cm",
    keyword: "kw",
    string: "str",
    punctuation: "punc",
    tag: "tag",
    attribute: "attr",
    function: "fn",
  };

  function tokenizedCode(tokens) {
    return tokens
      .map(function (t) {
        if (t.type === "newline") return "\n";
        var cls = TOKEN_CLASS[t.type];
        return cls
          ? '<span class="' + cls + '">' + esc(t.text) + "</span>"
          : esc(t.text);
      })
      .join("");
  }

  function a11yCard(req) {
    return (
      '<div class="a11y-card">' +
      '<div class="a11y-card__icon a11y-card__icon--' +
      esc(req.icon) +
      '"></div>' +
      '<div class="a11y-card__title">' +
      esc(req.title) +
      "</div>" +
      '<div class="a11y-card__body">' +
      esc(req.body) +
      "</div>" +
      (req.code
        ? '<div class="a11y-card__code"><pre>' +
          tokenizedCode(req.code.tokens) +
          "</pre></div>"
        : "") +
      "</div>"
    );
  }

  // --- DS Card Renderers ---

  function renderCard1(header) {
    return (
      '<div class="brief-card--header" data-name="Page header">' +
      '<div class="card-title-row">' +
      '<div class="card-title" data-name="Component name">' +
      esc(header.name) +
      "</div>" +
      '<svg class="card-logo" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="4" fill="#0550DC"/></svg>' +
      "</div>" +
      '<p class="card-body">' +
      esc(header.description) +
      "</p>" +
      "</div>"
    );
  }

  function renderCard2(comp, componentHtml) {
    if (!comp) return "";
    var parts = [];

    // Variant matrix
    if (comp.variantMatrix && comp.variantMatrix.length) {
      var cols = comp.variantMatrix[0].columns;
      var matrixHtml = '<table class="variant-matrix"><thead><tr><th>Type</th>';
      cols.forEach(function (c) {
        matrixHtml += "<th>" + esc(c.label) + "</th>";
      });
      matrixHtml += "</tr></thead><tbody>";
      comp.variantMatrix.forEach(function (row) {
        matrixHtml +=
          '<tr><td style="font-weight:600;white-space:nowrap;">' +
          esc(row.row) +
          "</td>";
        row.columns.forEach(function (col) {
          matrixHtml +=
            '<td style="text-align:center;">' +
            componentHtml(col.variantName) +
            "</td>";
        });
        matrixHtml += "</tr>";
      });
      matrixHtml += "</tbody></table>";
      parts.push(
        '<div class="section" data-name="Variant matrix">' +
          matrixHtml +
          "</div>",
      );
    }

    // Theme comparison (HTML can't do Figma variable modes — show labeled placeholders)
    if (comp.themeComparison) {
      var themes = ["Actian", "Studio", "Explorer"];
      var themeHtml = '<div class="theme-row">';
      themes.forEach(function (theme) {
        themeHtml +=
          '<div class="theme-card">' +
          '<div class="theme-card__label">' +
          esc(theme) +
          "</div>" +
          '<div class="theme-card__states">' +
          componentHtml("default") +
          "</div>" +
          "</div>";
      });
      themeHtml += "</div>";
      themeHtml +=
        '<div class="section-note" style="margin-top:8px;font-size:12px;color:#888;">Theme colors shown in Figma output</div>';
      parts.push(
        cardDivider() +
          '<div class="section" data-name="Theme comparison">' +
          sectionTitle("Theme comparison") +
          themeHtml +
          "</div>",
      );
    }

    return cardShell(
      "Component",
      "Live component across all states and theme modes",
      parts.join(""),
    );
  }

  function renderCard3(anatomy, componentHtml) {
    if (!anatomy) return "";
    var parts = [];

    // Structure
    if (anatomy.parts && anatomy.parts.length) {
      var structHtml =
        '<div class="anatomy-box"><div class="anatomy-component">' +
        '<span class="anatomy-component__label">Default</span>' +
        componentHtml("default") +
        '</div><div class="anatomy-props">';
      anatomy.parts.forEach(function (p) {
        structHtml +=
          '<div class="anatomy-prop">' +
          '<div class="anatomy-badge">' +
          esc(p.letter) +
          "</div>" +
          '<div class="anatomy-prop__label">' +
          esc(p.name) +
          "</div></div>";
      });
      structHtml += "</div></div>";
      parts.push(
        '<div class="section" data-name="Structure">' +
          sectionTitle("Structure") +
          structHtml +
          "</div>",
      );
    }

    // Specs (dimension annotations — simplified for HTML preview)
    if (anatomy.specs && anatomy.specs.length) {
      var specsHtml =
        '<div class="anatomy-box">' +
        '<div class="anatomy-component">' +
        '<span class="anatomy-component__label">Specs</span>' +
        componentHtml("default") +
        '</div><div class="anatomy-props">';
      anatomy.specs.forEach(function (s) {
        specsHtml +=
          '<div class="anatomy-prop">' +
          '<div class="anatomy-badge anatomy-badge--dim">' +
          esc(s.value) +
          "</div>" +
          '<div class="anatomy-prop__label">' +
          esc(s.layerName || s.orientation || s.direction || "") +
          "</div></div>";
      });
      specsHtml += "</div></div>";
      parts.push(
        cardDivider() +
          '<div class="section" data-name="Specs">' +
          sectionTitle("Specs") +
          specsHtml +
          "</div>",
      );
    }

    // States
    if (anatomy.states && anatomy.states.length) {
      var statesHtml = '<div class="state-grid">';
      anatomy.states.forEach(function (state) {
        statesHtml +=
          '<div class="state-col"><div class="state-label">' +
          esc(state) +
          "</div>" +
          componentHtml(state) +
          "</div>";
      });
      statesHtml += "</div>";
      parts.push(
        cardDivider() +
          '<div class="section" data-name="States">' +
          sectionTitle("States") +
          statesHtml +
          "</div>",
      );
    }

    // Parts reference table
    if (anatomy.partsTable && anatomy.partsTable.length) {
      var pRows = anatomy.partsTable.map(function (r) {
        return [
          esc(r.part),
          esc(r.element),
          "<code>" + esc(r.token) + "</code>",
          esc(r.notes),
        ];
      });
      parts.push(
        cardDivider() +
          '<div class="section" data-name="Parts reference">' +
          sectionTitle("Parts reference") +
          specTable(["Part", "Element", "Token", "Notes"], pRows) +
          "</div>",
      );
    }

    return cardShell(
      "Anatomy",
      "Component structure, dimensions, interactive states, and part-level token mapping",
      parts.join(""),
    );
  }

  function renderCard4(tokens) {
    if (!tokens) return "";
    var parts = [];

    // Color tokens table
    if (tokens.colorTokens && tokens.colorTokens.length) {
      var headers = ["Variant · State"].concat(
        tokens.colorTokens[0].columns.map(function (c) {
          return c.header;
        }),
      );
      var rows = tokens.colorTokens.map(function (row) {
        return [esc(row.state)].concat(
          row.columns.map(function (col) {
            return swatchDot(col.hex) + " <code>" + esc(col.token) + "</code>";
          }),
        );
      });
      parts.push(
        '<div class="section" data-name="Color tokens">' +
          sectionTitle("Color tokens") +
          specTable(headers, rows) +
          "</div>",
      );
    }

    // Sizing tokens table
    if (tokens.sizingTokens && tokens.sizingTokens.length) {
      var sRows = tokens.sizingTokens.map(function (r) {
        return [
          esc(r.property),
          "<code>" + esc(r.token) + "</code>",
          esc(r.value),
        ];
      });
      parts.push(
        cardDivider() +
          '<div class="section" data-name="Sizing & spacing">' +
          sectionTitle("Sizing & spacing") +
          specTable(["Property", "Token", "Value"], sRows) +
          "</div>",
      );
    }

    // Typography
    if (tokens.typography && tokens.typography.length) {
      var tRows = tokens.typography.map(function (t) {
        return [
          esc(t.element),
          "<code>" + esc(t.token) + "</code>",
          esc(t.font),
          esc(t.tracking),
        ];
      });
      parts.push(
        cardDivider() +
          '<div class="section" data-name="Typography">' +
          sectionTitle("Typography") +
          specTable(["Element", "Token", "Font", "Tracking"], tRows) +
          "</div>",
      );
    }

    return cardShell(
      "Design tokens",
      "Color, sizing, spacing, and typography tokens",
      parts.join(""),
    );
  }

  function renderCard5(api) {
    if (!api || !api.props || !api.props.length) return "";
    var rows = api.props.map(function (p) {
      return [
        reqBadge(p.required),
        '<span class="prop-name">' + esc(p.name) + "</span>",
        '<span class="prop-type">' + esc(p.type) + "</span>",
        '<span class="prop-default">' + esc(p.default) + "</span>",
        '<span class="prop-values">' + esc(p.values) + "</span>",
        esc(p.notes),
      ];
    });
    return cardShell(
      "Component API",
      "Properties, types, defaults, and allowed values",
      specTable(["", "Property", "Type", "Default", "Values", "Notes"], rows),
    );
  }

  function renderCard6(usage) {
    if (!usage) return "";
    var parts = [];

    if (usage.whenToUse && usage.whenToUse.length) {
      parts.push(
        '<div class="section" data-name="When to use">' +
          sectionTitle("When to use") +
          '<div class="section-body"><ul>' +
          usage.whenToUse
            .map(function (item) {
              return '<li style="color:#047800;">' + esc(item) + "</li>";
            })
            .join("") +
          "</ul></div></div>",
      );
    }

    if (usage.whenNotToUse && usage.whenNotToUse.length) {
      parts.push(
        cardDivider() +
          '<div class="section" data-name="When NOT to use">' +
          sectionTitle("When NOT to use") +
          '<div class="section-body"><ul>' +
          usage.whenNotToUse
            .map(function (item) {
              return '<li style="color:#C10C0D;">' + esc(item) + "</li>";
            })
            .join("") +
          "</ul></div></div>",
      );
    }

    if (usage.doDont && usage.doDont.length) {
      parts.push(
        cardDivider() +
          usage.doDont
            .map(function (pair) {
              return doDontPair(pair);
            })
            .join(""),
      );
    }

    return cardShell(
      "Usage guidelines",
      "When and how to use this component",
      parts.join(""),
    );
  }

  function renderCard7(content) {
    if (!content) return "";
    var parts = [];

    if (content.rules && content.rules.length) {
      content.rules.forEach(function (rule, i) {
        if (i > 0) parts.push(cardDivider());
        parts.push(
          '<div class="section">' +
            sectionTitle(rule.title) +
            '<div class="section-body">' +
            esc(rule.description) +
            "</div>" +
            doDontPair({ doLabel: rule.do, dontLabel: rule.dont }) +
            "</div>",
        );
      });
    }

    if (content.terminology && content.terminology.length) {
      parts.push(cardDivider());
      var tRows = content.terminology.map(function (t) {
        return [esc(t.term), esc(t.use)];
      });
      parts.push(
        '<div class="section" data-name="Terminology">' +
          sectionTitle("Terminology") +
          specTable(["Term", "When to use"], tRows) +
          "</div>",
      );
    }

    return cardShell("Content guidelines", "Label copy rules", parts.join(""));
  }

  function renderCard8(a11y) {
    if (!a11y) return "";
    var parts = [];

    // Requirements grid (2x3)
    if (a11y.requirements && a11y.requirements.length) {
      parts.push(
        '<div class="section" data-name="Requirements">' +
          sectionTitle("Requirements") +
          '<div class="a11y-grid">' +
          a11y.requirements
            .map(function (req) {
              return a11yCard(req);
            })
            .join("") +
          "</div></div>",
      );
    }

    // ARIA table
    if (a11y.ariaTable && a11y.ariaTable.length) {
      var aRows = a11y.ariaTable.map(function (r) {
        return [
          esc(r.element),
          "<code>" + esc(r.role) + "</code>",
          esc(r.label),
          esc(r.focusOrder),
          esc(r.keyboard),
          esc(r.announcement),
        ];
      });
      parts.push(
        cardDivider() +
          '<div class="section" data-name="ARIA specification">' +
          sectionTitle("ARIA specification") +
          specTable(
            [
              "Element",
              "Role",
              "Label",
              "Focus Order",
              "Keyboard",
              "Announcement",
            ],
            aRows,
          ) +
          "</div>",
      );
    }

    // Contrast table
    if (a11y.contrastTable && a11y.contrastTable.length) {
      var cRows = a11y.contrastTable.map(function (r) {
        return [
          esc(r.element),
          swatchDot(r.foreground) + " " + esc(r.foreground),
          swatchDot(r.background) + " " + esc(r.background),
          esc(r.ratio),
          contrastBadge(r.wcag),
        ];
      });
      parts.push(
        cardDivider() +
          '<div class="section" data-name="Contrast ratios">' +
          sectionTitle("Contrast ratios") +
          specTable(
            ["Element", "Foreground", "Background", "Ratio", "WCAG AA"],
            cRows,
          ) +
          "</div>",
      );
    }

    return cardShell(
      "Accessibility",
      "WCAG 2.1 AA requirements, keyboard navigation, ARIA patterns, and contrast ratios",
      parts.join(""),
    );
  }

  function renderCard9(code) {
    if (!code || !code.tokens || !code.tokens.length) return "";
    return cardShell(
      "Code specification",
      "CSS custom properties",
      '<div class="code-block" data-name="Code block"><pre>' +
        tokenizedCode(code.tokens) +
        "</pre></div>",
    );
  }

  // --- FM Card Renderers ---

  function renderFmCard1(header) {
    return (
      '<div class="card card--dark" data-name="Page header">' +
      '<div class="page-header">' +
      '<div class="page-header__source">' +
      esc(header.source || "Fat Marker Wireframe Kit") +
      "</div>" +
      '<div class="page-header__title">' +
      esc(header.name) +
      "</div>" +
      '<div class="page-header__subtitle">' +
      esc(header.description) +
      "</div>" +
      "</div></div>"
    );
  }

  function renderFmCard2(comp, componentHtml) {
    if (!comp) return "";
    var gridCls =
      "variant-grid variant-grid--" + (comp.gridColumns || 3) + "col";
    var html = '<div class="' + gridCls + '">';
    (comp.variants || []).forEach(function (v) {
      html +=
        '<div class="variant-cell">' +
        componentHtml(v.variantName) +
        '<div class="variant-cell__label">' +
        esc(v.label) +
        "</div></div>";
    });
    html += "</div>";
    return (
      '<div class="card" data-name="Actual component">' +
      '<div class="card-header"><div class="card-header__title">Actual component</div>' +
      '<div class="card-header__subtitle">Locked component variants</div></div>' +
      '<div class="card-content">' +
      html +
      "</div></div>"
    );
  }

  function renderFmCard3(guidelines) {
    if (!guidelines || !guidelines.sections) return "";
    var html = guidelines.sections
      .map(function (s) {
        return (
          '<div class="section"><div class="section__title">' +
          esc(s.title) +
          "</div>" +
          '<div class="section__subtitle">' +
          esc(s.body) +
          "</div></div>"
        );
      })
      .join("");
    return (
      '<div class="card" data-name="Design guidelines">' +
      '<div class="card-header"><div class="card-header__title">Design guidelines</div></div>' +
      '<div class="card-content">' +
      html +
      "</div></div>"
    );
  }

  function renderFmCard4(content) {
    if (!content) return "";
    var parts = [];
    if (content.whenToUse) {
      parts.push(
        '<div class="section"><div class="section__title">When to use</div>' +
          '<div class="section__subtitle">' +
          esc(content.whenToUse) +
          "</div></div>",
      );
    }
    if (content.doDont && content.doDont.length) {
      content.doDont.forEach(function (pair) {
        parts.push(
          '<div class="do-dont-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
            '<div class="do-card"><div class="do-card__bar do-card__bar--do"></div><div class="do-card__body do-card__body--do">' +
            '<div class="do-card__label do-card__label--do">Do</div>' +
            esc(pair.do) +
            "</div></div>" +
            '<div class="do-card"><div class="do-card__bar do-card__bar--dont"></div><div class="do-card__body do-card__body--dont">' +
            '<div class="do-card__label do-card__label--dont">Don\'t</div>' +
            esc(pair.dont) +
            "</div></div>" +
            "</div>",
        );
      });
    }
    return (
      '<div class="card" data-name="Content guidelines">' +
      '<div class="card-header"><div class="card-header__title">Content guidelines</div></div>' +
      '<div class="card-content">' +
      parts.join("") +
      "</div></div>"
    );
  }

  function renderFmCard5(anatomy, componentHtml) {
    if (!anatomy) return "";
    var parts = [];
    // Diagram
    parts.push(
      '<div class="anatomy-diagram">' + componentHtml("default") + "</div>",
    );
    // Parts table
    if (anatomy.parts && anatomy.parts.length) {
      var pRows = anatomy.parts.map(function (p) {
        return [
          '<span class="pointer-badge">' + p.number + "</span>",
          esc(p.name),
          esc(p.description),
        ];
      });
      parts.push(specTable(["#", "Element", "Description"], pRows));
    }
    return (
      '<div class="card" data-name="Anatomy">' +
      '<div class="card-header"><div class="card-header__title">Anatomy</div></div>' +
      '<div class="card-content">' +
      parts.join("") +
      "</div></div>"
    );
  }

  // --- Entry Point ---

  document.addEventListener("DOMContentLoaded", function () {
    var dataEl = document.getElementById("spec-data");
    if (!dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var container = document.getElementById("cards-container");
    if (!container) return;

    var componentHtml =
      window.componentHtml ||
      function () {
        return '<div style="padding:20px;background:#f5f5f5;border-radius:8px;color:#888;text-align:center;">Component preview</div>';
      };
    var isFm =
      data.meta && (data.meta.library === "fm" || data.meta.mode === "fm");

    var cards;
    if (isFm) {
      cards = [
        renderFmCard1(data.card1_header),
        renderFmCard2(data.card2_component, componentHtml),
        renderFmCard3(data.card3_design_guidelines),
        renderFmCard4(data.card4_content_guidelines),
        renderFmCard5(data.card5_anatomy, componentHtml),
      ];
    } else {
      cards = [
        renderCard1(data.card1_header),
        renderCard2(data.card2_component, componentHtml),
        renderCard3(data.card3_anatomy, componentHtml),
        renderCard4(data.card4_tokens),
        renderCard5(data.card5_api),
        renderCard6(data.card6_usage),
        renderCard7(data.card7_content),
        renderCard8(data.card8_accessibility),
        renderCard9(data.card9_code),
      ];
    }

    // Insert gen card before the cards container (as sibling in brief-row)
    var briefRow = container.parentElement;
    if (briefRow && data.meta) {
      var genCardEl = document.createElement("div");
      genCardEl.innerHTML = genCard(data.meta);
      briefRow.insertBefore(genCardEl.firstChild, container);
    }

    container.innerHTML = cards.filter(Boolean).join("\n");
  });
})(); // end IIFE
