// scripts/html-renderers/flow-renderer.js
// Client-side renderer for generate-flow screen chrome.
// Reads flow-data.json from #spec-data, builds screen frames into #flow-container.
// The AI writes only contentHtml per screen + custom CSS.

(function() {
  'use strict';

  function esc(str) {
    if (str == null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function genCard(meta) {
    return '<div class="gen-card" data-name="Generation log">'
      + '<div class="gen-card__label">GENERATED</div>'
      + '<div class="gen-card__field"><span class="gen-card__key">Skill</span> ' + esc(meta.skill) + '</div>'
      + '<div class="gen-card__field"><span class="gen-card__key">Prompt</span> ' + esc(meta.prompt || (meta.feature || '')) + '</div>'
      + '<div class="gen-card__field"><span class="gen-card__key">Date</span> ' + esc(meta.date || meta.generatedAt) + '</div>'
      + '<div class="gen-card__field"><span class="gen-card__key">Duration</span> ' + esc(meta.duration) + '</div>'
      + '<div class="gen-card__field"><span class="gen-card__key">Model</span> ' + esc(meta.model) + '</div>'
      + '<div class="gen-card__field"><span class="gen-card__key">Plugin</span> v' + esc(meta.pluginVersion) + '</div>'
      + '</div>';
  }

  function coverCard(flow) {
    return '<div class="screen cover-card" data-name="Cover: ' + esc(flow.name) + '">'
      + '<div class="cover-card__content">'
      + '<div class="cover-card__label">FEATURE</div>'
      + '<div class="cover-card__title">' + esc(flow.name || '') + '</div>'
      + '<div class="cover-card__meta">'
      + '<div>User: ' + esc(flow.user || 'User') + '</div>'
      + '<div>Screens: ' + ((flow.screens && flow.screens.length) || 0) + '</div>'
      + '</div></div></div>';
  }

  function appHeader(type) {
    var labels = { Studio: 'Studio', Explorer: 'Explorer', Administration: 'Administration', Actian: 'Actian' };
    var label = labels[type] || 'Studio';
    return '<div class="fm-app-header" data-name="App header">'
      + '<div class="fm-app-header__logo"></div>'
      + '<div class="fm-app-header__label">' + esc(label) + '</div>'
      + '<div class="fm-app-header__spacer"></div>'
      + '<div class="fm-app-header__avatar"></div>'
      + '</div>';
  }

  function sidebar(config) {
    if (!config) return '';
    var items = '';
    var total = config.items || 6;
    for (var i = 0; i < total; i++) {
      if (i === 0 && config.activeItem) {
        items += '<div class="fm-nav-item fm-nav-item--active" data-name="' + esc(config.activeItem) + '">'
          + '<div class="fm-nav-item__icon"></div>'
          + '<div class="fm-nav-item__label">' + esc(config.activeItem) + '</div>'
          + '</div>';
      } else {
        items += '<div class="fm-nav-item fm-nav-item--placeholder">'
          + '<div class="fm-nav-item__icon"></div>'
          + '<div class="fm-nav-item__bar"></div>'
          + '</div>';
      }
    }
    return '<div class="fm-sidebar" data-name="Sidebar">' + items + '</div>';
  }

  function pageHeader(config) {
    if (!config) return '';
    var html = '<div class="fm-page-header" data-name="Page header">'
      + '<div class="fm-page-header__title">' + esc(config.title) + '</div>';
    if (config.subtitle) html += '<div class="fm-page-header__subtitle">' + esc(config.subtitle) + '</div>';
    if (config.actions && config.actions.length) {
      html += '<div class="fm-page-header__actions">';
      config.actions.forEach(function(a) {
        html += '<div class="fm-button fm-button--primary">' + esc(a) + '</div>';
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function screen(s) {
    var type = s.type || 'standard';
    var w = type === 'compact' ? 1440 : 1440;
    var h = type === 'compact' ? 700 : 960;
    return '<div class="screen" data-name="' + esc(s.name) + '" style="width:' + w + 'px;height:' + h + 'px;">'
      + appHeader(s.appHeader || 'Studio')
      + '<div class="screen__body">'
      + sidebar(s.sidebar)
      + '<div class="screen__content">'
      + pageHeader(s.pageHeader)
      + '<div class="screen__content-area">' + (s.contentHtml || '') + '</div>'
      + '</div></div></div>';
  }

  function flowRow(flow, meta) {
    var html = genCard(meta);
    html += coverCard(flow);
    (flow.screens || []).forEach(function(s) { html += screen(s); });
    return '<div class="flow-row" data-name="Flow: ' + esc(flow.name) + '">' + html + '</div>';
  }

  // --- Entry Point ---
  document.addEventListener('DOMContentLoaded', function() {
    var dataEl = document.getElementById('spec-data');
    if (!dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var container = document.getElementById('flow-container');
    if (!container) return;

    container.innerHTML = (data.flows || []).map(function(flow) {
      return flowRow(flow, data.meta);
    }).join('\n');
  });

})();
