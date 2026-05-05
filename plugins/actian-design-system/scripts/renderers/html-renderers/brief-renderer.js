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

  function renderSourceBadge(card) {
    if (!card || !card._source) return "";
    if (card._source === "figma") {
      return '<span class="brief-source-badge brief-source-badge--figma" title="Source: Figma component description">Source: Figma</span>';
    }
    if (card._source === "generated" && card._fallback === true) {
      var reason = card._fallbackReason
        ? " — " + esc(card._fallbackReason)
        : "";
      return (
        '<span class="brief-source-badge brief-source-badge--fallback" title="Auto-generated fallback">Source: Claude (placeholder)' +
        reason +
        "</span>"
      );
    }
    if (card._source === "generated") {
      return '<span class="brief-source-badge brief-source-badge--generated" title="Generated, grounded in source files">Source: Claude</span>';
    }
    return "";
  }

  function renderResearchInsights(card) {
    if (!card || card._research_applied !== true) return "";
    var ri = card.research_insights;
    if (!ri) return "";
    var html = '<div class="research-insights"><h4>Cross-DS research</h4>';
    if (Array.isArray(ri.patterns_observed) && ri.patterns_observed.length) {
      html += "<h5>Patterns observed</h5><ul>";
      for (var i = 0; i < ri.patterns_observed.length; i++)
        html += "<li>" + esc(ri.patterns_observed[i]) + "</li>";
      html += "</ul>";
    }
    if (Array.isArray(ri.recommendations) && ri.recommendations.length) {
      html += "<h5>Recommendations</h5><ul>";
      for (var j = 0; j < ri.recommendations.length; j++)
        html += "<li>" + esc(ri.recommendations[j]) + "</li>";
      html += "</ul>";
    }
    if (Array.isArray(ri._divergences) && ri._divergences.length) {
      html +=
        '<div class="research-divergences"><h5>Designer review needed</h5><ul>';
      for (var k = 0; k < ri._divergences.length; k++) {
        var d = ri._divergences[k];
        html +=
          "<li><strong>" +
          esc(d.field) +
          ":</strong> existing — " +
          esc(d.existing) +
          "; research — " +
          esc(d.research) +
          " <em>(" +
          esc(d.note) +
          ")</em></li>";
      }
      html += "</ul></div>";
    }
    if (Array.isArray(ri.sources) && ri.sources.length) {
      html += '<p class="research-sources">Sources: ';
      for (var m = 0; m < ri.sources.length; m++) {
        var s = ri.sources[m];
        html +=
          (m ? ", " : "") +
          '<a href="' +
          esc(s.url) +
          '">' +
          esc(s.ds) +
          "</a>";
      }
      html += "</p>";
    }
    html += "</div>";
    return html;
  }

  function cardShell(title, subtitle, contentHtml, dataName, card) {
    return (
      '<div class="brief-card" data-name="' +
      esc(dataName || title) +
      '">' +
      '<div class="card-section-header">' +
      '<div class="card-section-header__title">' +
      esc(title) +
      (card ? renderSourceBadge(card) : "") +
      "</div>" +
      (subtitle
        ? '<div class="card-section-header__subtitle">' +
          esc(subtitle) +
          "</div>"
        : "") +
      "</div>" +
      '<div class="card-content">' +
      contentHtml +
      (card ? renderResearchInsights(card) : "") +
      "</div>" +
      "</div>"
    );
  }

  function sectionTitle(title) {
    return '<div class="section-title">' + esc(title) + "</div>";
  }

  // Sub-section heading with optional Draft badge. The badge appears only
  // when the source card is AI-generated AND not flagged as human-authored.
  // Hybrid contract from spec Q8=C.
  function subsectionTitle(label, sourceCard) {
    var draft = "";
    if (
      sourceCard &&
      sourceCard._source === "generated" &&
      sourceCard._authored !== true
    ) {
      // Spacing handled by .subsection-draft-badge { margin-left: 8px }.
      draft =
        '<span class="subsection-draft-badge" ' +
        'title="AI-drafted; not yet human-authored">Draft</span>';
    }
    return '<div class="section-title">' + esc(label) + draft + "</div>";
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
      renderSourceBadge(header) +
      "</div>" +
      '<svg class="card-logo" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="4" fill="#0550DC"/></svg>' +
      "</div>" +
      '<p class="card-body">' +
      esc(header.description) +
      "</p>" +
      renderResearchInsights(header) +
      "</div>"
    );
  }

  // Section 1 sub-section: Variation. Returns the inner content body — no
  // cardShell wrapper. Reused by renderCard2 (back-compat) and renderSection1.
  function renderVariationContent(comp, componentHtml) {
    if (!comp) return "";
    var parts = [];

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
          subsectionTitle("Variation", comp) +
          matrixHtml +
          "</div>",
      );
    }

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

    return parts.join("");
  }

  function renderCard2(comp, componentHtml) {
    if (!comp) return "";
    return cardShell(
      (comp && comp.cardTitle) || "Component",
      (comp && comp.cardSubtitle) ||
        "Live component across all states and theme modes",
      renderVariationContent(comp, componentHtml),
      null,
      comp,
    );
  }

  // Section 1 sub-section: Anatomy (parts diagram + parts table + states).
  // Specs are intentionally separated — see renderSpecsContent.
  function renderAnatomyContent(anatomy, componentHtml) {
    if (!anatomy) return "";
    var parts = [];

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
        '<div class="section" data-name="Anatomy">' +
          subsectionTitle("Anatomy", anatomy) +
          structHtml +
          "</div>",
      );
    }

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

    return parts.join("");
  }

  // Section 1 sub-section: Specs (dimension annotations).
  // Reads anatomy.specs; previously nested inside renderCard3, now its own helper.
  function renderSpecsContent(anatomy, componentHtml) {
    if (!anatomy || !anatomy.specs || !anatomy.specs.length) return "";
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
    return (
      '<div class="section" data-name="Specs">' +
      subsectionTitle("Specs", anatomy) +
      specsHtml +
      "</div>"
    );
  }

  // Back-compat wrapper. Pre-refactor renderCard3 emitted Specs BETWEEN
  // States and Parts reference (middle of the card). Post-refactor Specs
  // renders at the end of the card. This positional change is acceptable
  // because (a) Task 4 replaces renderCard3 in the default DOM array with
  // renderSection1, where Specs is intentionally the 4th sub-section
  // (last), and (b) renderCard3 is only on a back-compat code path. If a
  // future caller relies on the historical mid-card Specs position, split
  // renderAnatomyContent into Structure / States / Parts helpers and
  // interleave Specs between States and Parts here.
  function renderCard3(anatomy, componentHtml) {
    if (!anatomy) return "";
    var anatomyParts = renderAnatomyContent(anatomy, componentHtml);
    var specsParts = renderSpecsContent(anatomy, componentHtml);
    var parts = [anatomyParts];
    if (specsParts) parts.push(cardDivider() + specsParts);
    return cardShell(
      (anatomy && anatomy.cardTitle) || "Anatomy",
      (anatomy && anatomy.cardSubtitle) ||
        "Component structure, dimensions, interactive states, and part-level token mapping",
      parts.join(""),
      null,
      anatomy,
    );
  }

  // Section 1 sub-section: Tokens (color + sizing + typography tables).
  function renderTokensContent(tokens) {
    if (!tokens) return "";
    var parts = [];

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
        '<div class="section" data-name="Tokens">' +
          subsectionTitle("Tokens", tokens) +
          specTable(headers, rows) +
          "</div>",
      );
    }

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

    return parts.join("");
  }

  function renderCard4(tokens) {
    if (!tokens) return "";
    return cardShell(
      (tokens && tokens.cardTitle) || "Design tokens",
      (tokens && tokens.cardSubtitle) ||
        "Color, sizing, spacing, and typography tokens",
      renderTokensContent(tokens),
      null,
      tokens,
    );
  }

  // Section 1 supercard — Brief Refresh v2 / Kristina's must-have list.
  // Composes Anatomy + Variation + Tokens + Specs into a single card frame.
  // Sub-sections separated by cardDivider(); each one only renders if the
  // corresponding input data is populated.
  function renderSection1(component, anatomy, tokens, componentHtml) {
    var anatomyHtml = renderAnatomyContent(anatomy, componentHtml);
    var variationHtml = renderVariationContent(component, componentHtml);
    var tokensHtml = renderTokensContent(tokens);
    var specsHtml = renderSpecsContent(anatomy, componentHtml);

    if (!anatomyHtml && !variationHtml && !tokensHtml && !specsHtml) return "";

    var parts = [];
    function appendSubsection(html) {
      if (!html) return;
      if (parts.length) parts.push(cardDivider());
      parts.push(html);
    }
    appendSubsection(anatomyHtml);
    appendSubsection(variationHtml);
    appendSubsection(tokensHtml);
    appendSubsection(specsHtml);

    // Pick a representative card object for source-badge / research insights.
    // Per spec: "most permissive wins" — figma > generated > generated+fallback.
    var representative = pickSection1Provenance(component, anatomy, tokens);

    // Default title and subtitle. If the representative card (the provenance
    // winner from pickSection1Provenance) carries cardTitle/cardSubtitle from
    // its recipe, those override the defaults below.
    var title =
      (representative && representative.cardTitle) ||
      "Anatomy, variation, tokens & specs";
    var subtitle =
      (representative && representative.cardSubtitle) ||
      "Structural breakdown, variants, token bindings, and dimension specs";

    return cardShell(title, subtitle, parts.join(""), null, representative);
  }

  // Pick the "most permissive" provenance among Section 1's three input cards.
  // Used to drive the single source badge on the supercard.
  function pickSection1Provenance(component, anatomy, tokens) {
    var inputs = [component, anatomy, tokens].filter(Boolean);
    if (!inputs.length) return null;

    // figma wins
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i]._source === "figma") return inputs[i];
    }
    // all fallback?
    var allFallback = inputs.every(function (c) {
      return c._fallback === true;
    });
    if (allFallback) return inputs[0];
    // pick any generated (non-fallback)
    for (var j = 0; j < inputs.length; j++) {
      if (inputs[j]._source === "generated" && !inputs[j]._fallback)
        return inputs[j];
    }
    return inputs[0]; // default: first input — covers cards with no _source set
  }

  // Card 5 (numbered) — Behavior & motion. Conditional: returns "" when the
  // component has no curated motion pattern. Source data comes from
  // foundations/interaction-motion.json#patterns.<slug>; component-guideline
  // declares the slug + optional overrides.
  function renderCardMotion(motion) {
    if (!motion) return "";
    var phases = Array.isArray(motion.phases) ? motion.phases : [];
    if (phases.length === 0 && !motion.overrides) return "";
    var parts = [];

    // Pattern reference line
    if (motion.patternName || motion.patternSlug) {
      parts.push(
        '<div class="section" data-name="Pattern">' +
          sectionTitle("Pattern reference") +
          '<div class="section-body"><p>' +
          esc(motion.patternName || motion.patternSlug) +
          (motion.patternSlug
            ? ' &nbsp;<code class="pattern-slug">' +
              esc(motion.patternSlug) +
              "</code>"
            : "") +
          "</p></div></div>",
      );
    }

    // Phase rows — table headers derived from row keys (patterns have varying
    // shapes: Phase/Duration/Easing/Behavior is most common, but skeleton +
    // staggered-entrance use different columns)
    if (phases.length) {
      var headers = Object.keys(phases[0]);
      var rows = phases.map(function (p) {
        return headers.map(function (h) {
          var v = p[h];
          // Token slugs follow `category-name` shape (duration-slow,
          // ease-entrance, delay-stagger). Require at least one hyphen so
          // bare CSS keywords like `linear` aren't wrapped in <code>.
          if (typeof v === "string" && /^[a-z][\w-]*-[\w-]+$/.test(v)) {
            return "<code>" + esc(v) + "</code>";
          }
          return esc(typeof v === "string" ? v : "");
        });
      });
      parts.push(
        cardDivider() +
          '<div class="section" data-name="Phases">' +
          sectionTitle("Phases") +
          specTable(headers, rows) +
          "</div>",
      );
    }

    // Optional notes
    if (Array.isArray(motion.notes) && motion.notes.length) {
      parts.push(
        cardDivider() +
          '<div class="section" data-name="Notes">' +
          sectionTitle("Notes") +
          '<div class="section-body"><ul>' +
          motion.notes
            .map(function (n) {
              return "<li>" + esc(n) + "</li>";
            })
            .join("") +
          "</ul></div></div>",
      );
    }

    // Optional logic & accessibility
    if (
      Array.isArray(motion.logic_and_accessibility) &&
      motion.logic_and_accessibility.length
    ) {
      parts.push(
        cardDivider() +
          '<div class="section" data-name="Logic and accessibility">' +
          sectionTitle("Logic & accessibility") +
          '<div class="section-body"><ul>' +
          motion.logic_and_accessibility
            .map(function (n) {
              return "<li>" + esc(n) + "</li>";
            })
            .join("") +
          "</ul></div></div>",
      );
    }

    // Optional component-specific overrides
    if (typeof motion.overrides === "string" && motion.overrides.length) {
      parts.push(
        cardDivider() +
          '<div class="section" data-name="Overrides">' +
          sectionTitle("Component-specific overrides") +
          '<div class="section-body"><p>' +
          esc(motion.overrides) +
          "</p></div></div>",
      );
    }

    return cardShell(
      (motion && motion.cardTitle) || "Behavior & motion",
      (motion && motion.cardSubtitle) ||
        "Phases, durations, easings, and accessibility behavior",
      parts.join(""),
      null,
      motion,
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
      (usage && usage.cardTitle) || "Usage guidelines",
      (usage && usage.cardSubtitle) || "When and how to use this component",
      parts.join(""),
      null,
      usage,
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

    return cardShell(
      (content && content.cardTitle) || "Content guidelines",
      (content && content.cardSubtitle) || "Label copy rules",
      parts.join(""),
      null,
      content,
    );
  }

  function renderCard8(a11y) {
    if (!a11y) return "";
    var parts = [];

    // Requirements as a plain bulleted list (Brief Refresh v2 Phase 1: dropped
    // the dense 2x3 a11y-card grid in favor of plain text). The data still
    // carries `icon` + `code` for any future re-elevation, but the renderer
    // ignores them — keep the JSON shape stable.
    if (a11y.requirements && a11y.requirements.length) {
      var reqHtml = '<ul class="a11y-req-list">';
      a11y.requirements.forEach(function (req) {
        reqHtml +=
          "<li>" +
          '<span class="a11y-req-list__title">' +
          esc(req.title) +
          "</span>" +
          (req.body
            ? ' <span class="a11y-req-list__body">' + esc(req.body) + "</span>"
            : "") +
          "</li>";
      });
      reqHtml += "</ul>";
      parts.push(
        '<div class="section" data-name="Requirements">' +
          sectionTitle("Requirements") +
          reqHtml +
          "</div>",
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
      (a11y && a11y.cardTitle) || "Accessibility",
      (a11y && a11y.cardSubtitle) ||
        "WCAG 2.1 AA requirements, keyboard navigation, ARIA patterns, and contrast ratios",
      parts.join(""),
      null,
      a11y,
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
    var fm2Title = (comp && comp.cardTitle) || "Actual component";
    var fm2Sub = (comp && comp.cardSubtitle) || "Locked component variants";
    return (
      '<div class="card" data-name="' +
      esc(fm2Title) +
      '">' +
      '<div class="card-header"><div class="card-header__title">' +
      esc(fm2Title) +
      "</div>" +
      '<div class="card-header__subtitle">' +
      esc(fm2Sub) +
      "</div></div>" +
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
    var fm3Title = (guidelines && guidelines.cardTitle) || "Design guidelines";
    return (
      '<div class="card" data-name="' +
      esc(fm3Title) +
      '">' +
      '<div class="card-header"><div class="card-header__title">' +
      esc(fm3Title) +
      "</div></div>" +
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
    var fm4Title = (content && content.cardTitle) || "Content guidelines";
    return (
      '<div class="card" data-name="' +
      esc(fm4Title) +
      '">' +
      '<div class="card-header"><div class="card-header__title">' +
      esc(fm4Title) +
      "</div></div>" +
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
    var fm5Title = (anatomy && anatomy.cardTitle) || "Anatomy";
    return (
      '<div class="card" data-name="' +
      esc(fm5Title) +
      '">' +
      '<div class="card-header"><div class="card-header__title">' +
      esc(fm5Title) +
      "</div></div>" +
      '<div class="card-content">' +
      parts.join("") +
      "</div></div>"
    );
  }

  // --- Entry Point ---

  if (typeof document !== "undefined") {
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

      // Support both new-style flat keys (card_header) and old-style numbered keys (card1_header)
      // card_api (was card5) and card_code (was card9) retired; validator blocks them.
      var d = {
        header: data.card_header || data.card1_header,
        component: data.card_component || data.card2_component,
        anatomy: data.card_anatomy || data.card3_anatomy,
        tokens: data.card_tokens || data.card4_tokens,
        motion: data.card_motion,
        usage: data.card_usage || data.card6_usage,
        content: data.card_content || data.card7_content,
        accessibility: data.card_accessibility || data.card8_accessibility,
        // FM keys
        designGuidelines:
          data.card_design_guidelines || data.card3_design_guidelines,
        contentGuidelines:
          data.card_content_guidelines || data.card4_content_guidelines,
      };

      var cards;
      if (isFm) {
        cards = [
          renderFmCard1(d.header),
          renderFmCard2(d.component, componentHtml),
          renderFmCard3(d.designGuidelines),
          renderFmCard4(d.contentGuidelines),
          renderFmCard5(d.anatomy, componentHtml),
        ];
      } else {
        // Section order (Brief Refresh v2 Phase 2 — v1.67.0).
        // Spec: comms/SPEC-brief-6-section-restructure.md
        // Plan: comms/PLAN-brief-6-section-restructure.md
        //
        //   Header                       (always)
        //   Section 1 supercard          (Anatomy + Variation + Tokens + Specs merged)
        //   Section 2 — Usages           (always if data)
        //   Section 3 — Content          (always if data)
        //   Section 4 — Motion           (conditional)
        //   Section 5 — Accessibility    (always)
        //   Section 6 — Real examples    (deferred entirely; not rendered)
        cards = [
          renderCard1(d.header), // Header
          renderSection1(d.component, d.anatomy, d.tokens, componentHtml), // Section 1
          renderCard6(d.usage), // Section 2
          renderCard7(d.content), // Section 3
          renderCardMotion(d.motion), // Section 4 (conditional)
          renderCard8(d.accessibility), // Section 5
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

      // Stub footer cue (v1.64.0+): surfaced when meta._stubGuideline is true so
      // designers know the brief is registry-derived only and the DS team owes
      // a curated guideline for this component.
      if (briefRow && data.meta && data.meta._stubGuideline === true) {
        var slug = esc(data.meta.slug || "this-component");
        var footer = document.createElement("div");
        footer.className = "stub-footer";
        footer.style.cssText =
          "margin-top: 24px; padding: 16px 20px; " +
          "background: var(--zen-color-background-grey-1, #fbfbff); " +
          "border-left: 3px solid var(--zen-color-status-warning, #d27b00); " +
          "color: var(--zen-color-text-secondary, #3f3f4a); font-size: 13px;";
        footer.innerHTML =
          "<strong>Guidance pending curation.</strong> " +
          "This brief is based on registry data only. The DS team has not yet " +
          "curated content / design / a11y guidelines for this component. " +
          "Briefs will improve once the guideline is fleshed out at " +
          "<code>docs/component-guidelines/" +
          slug +
          ".json</code>.";
        briefRow.appendChild(footer);
      }
    });
  } // end typeof document guard

  // Node-compatible exports — mirror fm-html-map.js so tests can require this module.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      renderCard1: renderCard1,
      renderCard2: renderCard2,
      renderCard3: renderCard3,
      renderCard4: renderCard4,
      renderCardMotion: renderCardMotion,
      renderCard6: renderCard6,
      renderCard7: renderCard7,
      renderCard8: renderCard8,
      renderVariationContent: renderVariationContent,
      renderAnatomyContent: renderAnatomyContent,
      renderTokensContent: renderTokensContent,
      renderSpecsContent: renderSpecsContent,
      renderSection1: renderSection1,
      pickSection1Provenance: pickSection1Provenance,
      subsectionTitle: subsectionTitle,
    };
  }
})(); // end IIFE
