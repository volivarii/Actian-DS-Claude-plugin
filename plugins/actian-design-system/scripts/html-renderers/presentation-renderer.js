// scripts/html-renderers/presentation-renderer.js
// Client-side renderer for generate-presentation slide templates.
// Reads slide-data.json from #spec-data, builds slides into #deck-container.

(function() {
  'use strict';

  function esc(str) {
    if (str == null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function genCard(meta) {
    return '<div class="gen-card">'
      + '<div class="gen-card__label">GENERATED</div>'
      + '<div class="gen-card__field"><span class="gen-card__key">Skill</span> ' + esc(meta.skill) + '</div>'
      + '<div class="gen-card__field"><span class="gen-card__key">Prompt</span> ' + esc(meta.prompt || meta.topic || '') + '</div>'
      + '<div class="gen-card__field"><span class="gen-card__key">Date</span> ' + esc(meta.date || meta.generatedAt) + '</div>'
      + '<div class="gen-card__field"><span class="gen-card__key">Duration</span> ' + esc(meta.duration) + '</div>'
      + '<div class="gen-card__field"><span class="gen-card__key">Model</span> ' + esc(meta.model) + '</div>'
      + '<div class="gen-card__field"><span class="gen-card__key">Plugin</span> v' + esc(meta.pluginVersion) + '</div>'
      + '</div>';
  }

  // Geometric background pattern (rotated rectangles)
  var geoPattern = '<div class="geo-pattern">'
    + '<div class="geo-rect geo-rect--1"></div>'
    + '<div class="geo-rect geo-rect--2"></div>'
    + '<div class="geo-rect geo-rect--3"></div>'
    + '</div>';

  function renderCover(slide) {
    return '<div class="slide slide--cover" data-name="' + esc('Slide: ' + slide.title) + '">'
      + geoPattern
      + '<div class="slide__topic">' + esc(slide.topic || '') + '</div>'
      + '<div class="slide__title">' + esc(slide.title) + '</div>'
      + (slide.subtitle ? '<div class="slide__subtitle">' + esc(slide.subtitle) + '</div>' : '')
      + '<div class="slide__meta">'
      + (slide.date ? '<span>' + esc(slide.date) + '</span>' : '')
      + (slide.creators ? '<span>' + esc(slide.creators) + '</span>' : '')
      + '</div></div>';
  }

  function renderSection(slide) {
    return '<div class="slide slide--section" data-name="' + esc('Section: ' + slide.title) + '">'
      + '<div class="geo-pattern geo-pattern--light"></div>'
      + '<div class="slide__topic">' + esc(slide.topic || '') + '</div>'
      + '<div class="slide__section-title">' + esc(slide.title) + '</div>'
      + '</div>';
  }

  function renderBodyFull(slide) {
    var contentHtml = '';
    if (slide.content && Array.isArray(slide.content)) {
      contentHtml = slide.content.map(function(el) { return renderContentElement(el); }).join('');
    } else if (slide.contentHtml) {
      contentHtml = slide.contentHtml;
    }
    return '<div class="slide slide--body" data-name="' + esc('Slide: ' + slide.title) + '">'
      + '<div class="slide__title-bar">' + esc(slide.title) + '</div>'
      + '<div class="slide__content-full">' + contentHtml + '</div>'
      + '</div>';
  }

  function renderBodyTextVisual(slide) {
    return '<div class="slide slide--body" data-name="' + esc('Slide: ' + slide.title) + '">'
      + '<div class="slide__title-bar">' + esc(slide.title) + '</div>'
      + '<div class="slide__two-col">'
      + '<div class="slide__text-col">' + (slide.bodyHtml || '') + '</div>'
      + '<div class="slide__visual-col">' + (slide.visualHtml || '') + '</div>'
      + '</div></div>';
  }

  function renderBackCover(slide) {
    return '<div class="slide slide--cover" data-name="Back cover">'
      + geoPattern
      + '<div class="slide__back-title">' + esc(slide.text || 'Thank you') + '</div>'
      + (slide.subtitle ? '<div class="slide__back-subtitle">' + esc(slide.subtitle) + '</div>' : '')
      + '</div>';
  }

  // --- Structured content elements ---

  function renderContentElement(el) {
    switch (el.type) {
      case 'stat-cards': return renderStatCards(el.cards);
      case 'bar-chart': return renderBarChart(el);
      case 'progress-bars': return renderProgressBars(el.bars);
      case 'comparison-table': return renderComparisonTable(el);
      case 'timeline': return renderTimeline(el.events);
      case 'html': return el.html || '';
      default: return el.html || '';
    }
  }

  function renderStatCards(cards) {
    return '<div class="stat-cards">' + cards.map(function(c) {
      return '<div class="stat-card">'
        + '<div class="stat-card__value">' + esc(c.value) + '</div>'
        + '<div class="stat-card__label">' + esc(c.label) + '</div>'
        + (c.trend ? '<div class="stat-card__trend">' + esc(c.trend) + '</div>' : '')
        + '</div>';
    }).join('') + '</div>';
  }

  function renderBarChart(chart) {
    var maxVal = Math.max.apply(null, chart.bars.map(function(b) { return b.value; }));
    return '<div class="bar-chart">'
      + (chart.title ? '<div class="bar-chart__title">' + esc(chart.title) + '</div>' : '')
      + chart.bars.map(function(b, i) {
        var pct = maxVal > 0 ? (b.value / maxVal * 100) : 0;
        return '<div class="bar-chart__row">'
          + '<div class="bar-chart__label">' + esc(b.label) + '</div>'
          + '<div class="bar-chart__track"><div class="bar-chart__fill bar-chart__fill--' + ((i % 9) + 1) + '" style="width:' + pct + '%;"></div></div>'
          + '<div class="bar-chart__value">' + esc(String(b.value)) + (b.unit ? esc(b.unit) : '') + '</div>'
          + '</div>';
      }).join('') + '</div>';
  }

  function renderProgressBars(bars) {
    return '<div class="progress-bars">' + bars.map(function(b) {
      return '<div class="progress-bar">'
        + '<div class="progress-bar__label">' + esc(b.label) + ' <span>' + b.percent + '%</span></div>'
        + '<div class="progress-bar__track"><div class="progress-bar__fill" style="width:' + b.percent + '%;"></div></div>'
        + '</div>';
    }).join('') + '</div>';
  }

  function renderComparisonTable(table) {
    var html = '<table class="comparison-table"><thead><tr>';
    (table.headers || []).forEach(function(h) { html += '<th>' + esc(h) + '</th>'; });
    html += '</tr></thead><tbody>';
    (table.rows || []).forEach(function(row) {
      html += '<tr>';
      row.forEach(function(cell) { html += '<td>' + esc(String(cell)) + '</td>'; });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function renderTimeline(events) {
    return '<div class="timeline">' + (events || []).map(function(ev) {
      return '<div class="timeline__event">'
        + '<div class="timeline__dot"></div>'
        + '<div class="timeline__date">' + esc(ev.date) + '</div>'
        + '<div class="timeline__title">' + esc(ev.title) + '</div>'
        + (ev.description ? '<div class="timeline__desc">' + esc(ev.description) + '</div>' : '')
        + '</div>';
    }).join('') + '</div>';
  }

  // --- Slide dispatcher ---

  function renderSlide(slide) {
    switch (slide.type) {
      case 'cover': return renderCover(slide);
      case 'section': return renderSection(slide);
      case 'body-full': return renderBodyFull(slide);
      case 'body-text-visual': return renderBodyTextVisual(slide);
      case 'back-cover': return renderBackCover(slide);
      default: return renderBodyFull(slide);
    }
  }

  // --- Entry Point ---
  document.addEventListener('DOMContentLoaded', function() {
    var dataEl = document.getElementById('spec-data');
    if (!dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var container = document.getElementById('deck-container');
    if (!container) return;

    var html = genCard(data.meta);
    html += (data.slides || []).map(function(slide) { return renderSlide(slide); }).join('\n');
    container.innerHTML = html;
  });

})();
