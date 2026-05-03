// scripts/html-renderers/presentation-renderer.js
// Client-side renderer for generate-presentation slide templates.
// Reads slide-data.json from #spec-data, builds slides into #deck-container.

(function() {
  'use strict';

  var fmMap = (typeof window !== 'undefined' && window.fmHtmlMap)
    || (typeof require !== 'undefined' && require('./fm-html-map'))
    || {};
  var esc = fmMap.esc || function(str) {
    if (str == null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  };
  var genCard = fmMap.genCard || function() { return ''; };

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
      + '<div class="geo-pattern geo-pattern--light">'
      + '<div class="geo-rect geo-rect--1"></div>'
      + '<div class="geo-rect geo-rect--2"></div>'
      + '<div class="geo-rect geo-rect--3"></div>'
      + '</div>'
      + '<div class="slide__section-topic">' + esc(slide.topic || '') + '</div>'
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
    var textHtml = slide.bodyHtml || '';
    if (!textHtml && slide.body) {
      textHtml = '<p>' + esc(slide.body).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
    }
    var visHtml = slide.visualHtml || '';
    if (!visHtml && slide.visualContent && Array.isArray(slide.visualContent)) {
      visHtml = slide.visualContent.map(function(el) { return renderContentElement(el); }).join('');
    }
    return '<div class="slide slide--body" data-name="' + esc('Slide: ' + slide.title) + '">'
      + '<div class="slide__title-bar">' + esc(slide.title) + '</div>'
      + '<div class="slide__two-col">'
      + '<div class="slide__text-col">' + textHtml + '</div>'
      + '<div class="slide__visual-col">' + visHtml + '</div>'
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

  var FONT_WEIGHT_MAP = {
    'Regular': '400', 'Medium': '500', 'Semi Bold': '600', 'SemiBold': '600',
    'Bold': '700', 'Light': '300', 'Thin': '100', 'Extra Bold': '800'
  };

  function renderSpecNode(node) {
    if (!node) return '';
    switch (node.type) {
      case 'FRAME': {
        var parts = [];
        var layout = node.layout || {};
        var sizing = node.sizing || {};
        if (layout.mode === 'HORIZONTAL') parts.push('display:flex;flex-direction:row');
        else if (layout.mode === 'VERTICAL') parts.push('display:flex;flex-direction:column');
        if (layout.spacing != null) parts.push('gap:' + layout.spacing + 'px');
        if (layout.primaryAxisAlignItems) {
          var jMap = { 'SPACE_BETWEEN': 'space-between', 'CENTER': 'center', 'MIN': 'flex-start', 'MAX': 'flex-end' };
          if (jMap[layout.primaryAxisAlignItems]) parts.push('justify-content:' + jMap[layout.primaryAxisAlignItems]);
        }
        if (layout.counterAxisAlignItems || layout.counterAxisAlign) {
          var aMap = { 'CENTER': 'center', 'MIN': 'flex-start', 'MAX': 'flex-end' };
          var ca = layout.counterAxisAlignItems || layout.counterAxisAlign;
          if (aMap[ca]) parts.push('align-items:' + aMap[ca]);
        }
        if (layout.padding) {
          var p = layout.padding;
          if (Array.isArray(p)) parts.push('padding:' + p.map(function(v) { return v + 'px'; }).join(' '));
          else if (typeof p === 'number') parts.push('padding:' + p + 'px');
        }
        if (sizing.horizontal === 'FILL') parts.push('flex:1;min-width:0');
        else if (typeof sizing.horizontal === 'number') parts.push('width:' + sizing.horizontal + 'px');
        if (sizing.vertical === 'FILL') parts.push('flex:1;min-height:0');
        else if (typeof sizing.vertical === 'number') parts.push('height:' + sizing.vertical + 'px');
        if (node.fills && node.fills.length && node.fills[0]) parts.push('background:' + node.fills[0]);
        if (node.cornerRadius) parts.push('border-radius:' + (typeof node.cornerRadius === 'number' ? node.cornerRadius + 'px' : '0'));
        if (node.stroke) parts.push('border:' + (node.stroke.weight || 1) + 'px solid ' + (node.stroke.color || '#E0E0E0'));
        var children = (node.children || []).map(renderSpecNode).join('');
        return '<div style="' + parts.join(';') + '">' + children + '</div>';
      }
      case 'TEXT': {
        var tp = [];
        if (node.font) {
          var fp = node.font.split(':');
          tp.push('font-family:' + (fp[0] || 'Roboto'));
          tp.push('font-weight:' + (FONT_WEIGHT_MAP[fp[1]] || '400'));
        }
        if (node.size) tp.push('font-size:' + (typeof node.size === 'object' ? node.size.value : node.size) + 'px');
        if (node.color) tp.push('color:' + node.color);
        if (node.textCase === 'UPPER') tp.push('text-transform:uppercase');
        return '<span style="' + tp.join(';') + '">' + esc(node.content || '') + '</span>';
      }
      case 'RECT': {
        var rp = 'width:' + (node.width || 32) + 'px;height:' + (node.height || 32) + 'px';
        if (node.fills && node.fills[0]) rp += ';background:' + node.fills[0];
        if (node.cornerRadius) rp += ';border-radius:' + node.cornerRadius + 'px';
        return '<div style="' + rp + '"></div>';
      }
      case 'DIVIDER': return '<hr style="border:none;border-top:1px solid #E2E7F0;margin:8px 0">';
      default:
        if (node.children && node.children.length) return node.children.map(renderSpecNode).join('');
        return '';
    }
  }

  function renderContentElement(el) {
    switch (el.type) {
      case 'stat-cards': return renderStatCards(el.cards);
      case 'bar-chart': return renderBarChart(el);
      case 'progress-bars': return renderProgressBars(el.bars);
      case 'comparison-table': return renderComparisonTable(el);
      case 'timeline': return renderTimeline(el.events);
      case 'html': return el.html || '';
      // Figma spec node types — render inline
      case 'FRAME': case 'TEXT': case 'RECT': case 'DIVIDER':
      case 'ELLIPSE': case 'INSTANCE':
        return renderSpecNode(el);
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
    container.innerHTML = '<div class="deck-row">' + html + '</div>';
  });

})();
