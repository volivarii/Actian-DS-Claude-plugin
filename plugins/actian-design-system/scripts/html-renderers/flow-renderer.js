// scripts/html-renderers/flow-renderer.js
// Client-side renderer for generate-flow screen chrome.
// Reads flow-data.json from #spec-data, builds screen frames into #flow-container.
// The AI writes either contentHtml (legacy) or content[] (structured nodes).

(function() {
  'use strict';

  // -------------------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------------------

  function esc(str) {
    if (str == null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // -------------------------------------------------------------------------
  // FM HTML Map (inlined from fm-html-map.js)
  // -------------------------------------------------------------------------

  function parseVariant(variantString) {
    if (!variantString) return {};
    var result = {};
    variantString.split(',').forEach(function(part) {
      var kv = part.trim().split('=');
      if (kv.length === 2) {
        result[kv[0].trim()] = kv[1].trim();
      }
    });
    return result;
  }

  function renderFMComponent(node) {
    var ref = node.ref || '';
    var v = parseVariant(node.variant || '');
    var props = node.props || {};
    var name = node.name || ref;

    switch (ref) {

      case 'fmButton': {
        var typeMap = { Primary: 'primary', Secondary: 'secondary', Outline: 'outline', Destructive: 'destructive' };
        var sizeMap = { md: 'md', sm: 'sm', MD: 'md', SM: 'sm' };
        var btnType = typeMap[v.Type] || 'primary';
        var btnSize = sizeMap[v.Size] || 'md';
        var label = esc(props.Label || '');
        return '<div class="fm-button fm-button--' + btnType + ' fm-button--' + btnSize + '">' + label + '</div>';
      }

      case 'fmTextInput': {
        var stateMap = { Empty: 'empty', Placeholder: 'placeholder', Default: 'default', Disabled: 'disabled' };
        var inputType = stateMap[v.Type] || stateMap[v.State] || 'default';
        var text = esc(props['Input Text'] || '');
        return '<div class="fm-input fm-input--' + inputType + '"><span class="fm-input__text">' + text + '</span></div>';
      }

      case 'fmDropdown': {
        var ddMap = { Placeholder: 'placeholder', Open: 'open', Filled: 'filled', Disabled: 'disabled' };
        var ddType = ddMap[v.Type] || ddMap[v.State] || 'placeholder';
        var ddText = esc(props['Dropdown Text'] || '');
        return '<div class="fm-dropdown fm-dropdown--' + ddType + '"><span>' + ddText + '</span><span class="fm-dropdown__arrow">&#9662;</span></div>';
      }

      case 'fmSearchInput': {
        var searchType = (v.Type || v.State || 'default').toLowerCase();
        var searchText = esc(props['Input Text'] || '');
        return '<div class="fm-search-input fm-search-input--' + searchType + '"><span>' + searchText + '</span></div>';
      }

      case 'fmTextArea': {
        var taContent = (v.Content || '').toLowerCase().replace(/\s+/g, '-') || 'empty';
        return '<div class="fm-textarea fm-textarea--' + taContent + '"></div>';
      }

      case 'fmDateInput': {
        var dateState = (v.State || 'default').toLowerCase();
        var dateText = esc(props['Input Text'] || '');
        return '<div class="fm-date-input fm-date-input--' + dateState + '"><span>' + dateText + '</span></div>';
      }

      case 'fmInputLabel': {
        var labelText = esc(props['Label Text'] || '');
        var captionText = esc(props['Caption Text'] || '');
        return '<div class="fm-input-label">'
          + '<span class="fm-input-label__text">' + labelText + '</span>'
          + '<span class="fm-input-label__caption">' + captionText + '</span>'
          + '</div>';
      }

      case 'fmTableCell': {
        var cellTypeMap = { Header: 'header', Text: 'text', Pill: 'pill', Placeholder: 'placeholder' };
        var cellType = cellTypeMap[v.Type] || 'text';
        var cellText = esc(props['Cell Text'] || props['Text'] || name || '');
        return '<div class="fm-table-cell fm-table-cell--' + cellType + '">' + cellText + '</div>';
      }

      case 'fmCheckbox': {
        var cbStateMap = { Off: 'off', On: 'on', Indeterminate: 'indeterminate', Disabled: 'disabled' };
        var cbState = cbStateMap[v.State] || 'off';
        return '<div class="fm-checkbox fm-checkbox--' + cbState + '"></div>';
      }

      case 'fmRadioButton': {
        var rbStateMap = { On: 'on', Off: 'off', Disabled: 'disabled' };
        var rbState = rbStateMap[v.State] || 'off';
        return '<div class="fm-radio fm-radio--' + rbState + '"></div>';
      }

      case 'fmToggle': {
        var tgStateMap = { Off: 'off', On: 'on', Disabled: 'disabled' };
        var tgState = tgStateMap[v.State] || 'off';
        return '<div class="fm-toggle fm-toggle--' + tgState + '"></div>';
      }

      case 'fmAlert': {
        var alertTypeMap = { Success: 'success', Error: 'error', Warning: 'warning', Info: 'info' };
        var alertType = alertTypeMap[v.Type] || 'info';
        var alertText = esc(props['Alert Text'] || props['Message'] || '');
        return '<div class="fm-alert fm-alert--' + alertType + '">'
          + '<div class="fm-alert__bar"></div>'
          + '<div class="fm-alert__content">' + alertText + '</div>'
          + '</div>';
      }

      case 'fmBanner': {
        var bannerText = esc(props['Banner Text'] || props['Text'] || '');
        return '<div class="fm-banner">' + bannerText + '</div>';
      }

      case 'fmDialog': {
        return '<div class="fm-dialog">'
          + '<div class="fm-dialog__title">Dialog</div>'
          + '<div class="fm-dialog__body"></div>'
          + '</div>';
      }

      case 'fmStepper': {
        var stepStateMap = { Active: 'active', Complete: 'complete', Upcoming: 'upcoming' };
        var stepState = stepStateMap[v.State] || 'upcoming';
        var stepNum = esc(props['Step'] || props['Number'] || '');
        return '<div class="fm-stepper fm-stepper--' + stepState + '">' + stepNum + '</div>';
      }

      case 'fmBadge': {
        var badgeSizeMap = { Small: 'small', Medium: 'medium', Large: 'large', sm: 'small', md: 'medium', lg: 'large' };
        var badgeSize = badgeSizeMap[v.Size] || 'medium';
        var badgeText = esc(props['Badge Text'] || props['Text'] || props['Label'] || '');
        return '<div class="fm-badge fm-badge--' + badgeSize + '">' + badgeText + '</div>';
      }

      case 'fmTag': {
        var tagStyleMap = { Filled: 'filled', Outline: 'outline', Light: 'light' };
        var tagStyle = tagStyleMap[v.Style] || tagStyleMap[v.Type] || 'filled';
        var tagText = esc(props['Tag Text'] || props['Label'] || props['Text'] || '');
        return '<div class="fm-tag fm-tag--' + tagStyle + '">' + tagText + '</div>';
      }

      case 'fmChip': {
        var chipText = esc(props['Chip Text'] || props['Label'] || props['Text'] || '');
        return '<div class="fm-chip">' + chipText + '</div>';
      }

      case 'fmTab': {
        var tabStateMap = { On: 'on', Off: 'off', Placeholder: 'placeholder' };
        var tabState = tabStateMap[v.State] || 'off';
        var tabText = esc(props['Tab Text'] || props['Label'] || props['Text'] || '');
        return '<div class="fm-tab fm-tab--' + tabState + '">' + tabText + '</div>';
      }

      case 'fmToast': {
        var toastStyleMap = { Standard: 'standard', Outline: 'outline' };
        var toastStyle = toastStyleMap[v.Style] || toastStyleMap[v.Type] || 'standard';
        var toastText = esc(props['Toast Text'] || props['Message'] || props['Text'] || '');
        return '<div class="fm-toast fm-toast--' + toastStyle + '">' + toastText + '</div>';
      }

      case 'fmEmptyState': {
        return '<div class="fm-empty-state">'
          + '<div class="fm-empty-state__icon"></div>'
          + '<div class="fm-empty-state__text">No items</div>'
          + '</div>';
      }

      case 'fmPlaceholder': {
        var phTypeMap = {
          'Label+1line': 'label+1line', 'Label+3lines': 'label+3lines',
          'Label+6lines': 'label+6lines', 'Label+Avatars': 'label+avatars', 'Metric': 'metric'
        };
        var phType = phTypeMap[v.Type] || (v.Type || 'label+1line').toLowerCase();
        return '<div class="fm-placeholder fm-placeholder--' + phType + '"></div>';
      }

      case 'fmAppHeader': {
        var appHeaderLabels = {
          Admin: 'Administration', Administration: 'Administration',
          Studio: 'Studio', Explorer: 'Explorer', Actian: 'Actian'
        };
        var appLabel = appHeaderLabels[v.Type] || appHeaderLabels[v.Theme] || 'Studio';
        return '<div class="fm-app-header" data-name="App header">'
          + '<div class="fm-app-header__logo"></div>'
          + '<div class="fm-app-header__label">' + esc(appLabel) + '</div>'
          + '<div class="fm-app-header__spacer"></div>'
          + '<div class="fm-app-header__avatar"></div>'
          + '</div>';
      }

      case 'fmSideNavItem': {
        var navStateMap = { On: 'active', Off: 'off', Placeholder: 'placeholder' };
        var navState = navStateMap[v.State] || 'off';
        if (navState === 'placeholder') {
          return '<div class="fm-nav-item fm-nav-item--placeholder">'
            + '<div class="fm-nav-item__icon"></div>'
            + '<div class="fm-nav-item__bar"></div>'
            + '</div>';
        }
        var navLabel = esc(props.Label || '');
        return '<div class="fm-nav-item fm-nav-item--' + navState + '">'
          + '<div class="fm-nav-item__icon"></div>'
          + '<div class="fm-nav-item__label">' + navLabel + '</div>'
          + '</div>';
      }

      case 'fmPageHeader': {
        var phTitle = esc(props.Title || '');
        var phSubtitle = props.Subtitle ? esc(props.Subtitle) : null;
        var phTypeVal = v.Type || '';
        var hasActions = phTypeVal.indexOf('actions') !== -1 || phTypeVal.indexOf('Actions') !== -1;
        var phHtml = '<div class="fm-page-header" data-name="Page header">'
          + '<div class="fm-page-header__title">' + phTitle + '</div>';
        if (phSubtitle) {
          phHtml += '<div class="fm-page-header__subtitle">' + phSubtitle + '</div>';
        }
        if (hasActions && props.Actions) {
          phHtml += '<div class="fm-page-header__actions">';
          var actions = Array.isArray(props.Actions) ? props.Actions : [props.Actions];
          actions.forEach(function(a) {
            phHtml += '<div class="fm-button fm-button--primary">' + esc(a) + '</div>';
          });
          phHtml += '</div>';
        }
        phHtml += '</div>';
        return phHtml;
      }

      case 'fmIconButtons': {
        var iconTypeMap = { Primary: 'primary', Secondary: 'secondary', Outline: 'outline' };
        var iconType = iconTypeMap[v.Type] || 'secondary';
        return '<div class="fm-icon-button fm-icon-button--' + iconType + '"></div>';
      }

      case 'fmSpinner': {
        return '<div class="fm-spinner"></div>';
      }

      case 'fmProgressBar': {
        var progressVal = v.Completion || v.Progress || '0%';
        return '<div class="fm-progress-bar">'
          + '<div class="fm-progress-bar__fill" style="width:' + esc(progressVal) + '"></div>'
          + '</div>';
      }

      case 'fmMultiSelectDropdown': {
        var msText = esc(props['Dropdown Text'] || '');
        return '<div class="fm-dropdown fm-dropdown--multi"><span>' + msText + '</span></div>';
      }

      case 'fmMenuItem': {
        var miStateMap = { Default: 'default', Hover: 'hover', Active: 'active' };
        var miState = miStateMap[v.State] || 'default';
        var miText = esc(props['Menu Item Text'] || props['Label'] || props['Text'] || '');
        return '<div class="fm-menu-item fm-menu-item--' + miState + '">' + miText + '</div>';
      }

      case 'fmTooltip': {
        var ttText = esc(props['Tooltip Text'] || props['Text'] || '');
        return '<div class="fm-tooltip">' + ttText + '</div>';
      }

      case 'fmRichTextField': {
        var rtText = esc(props['Input Text'] || '');
        return '<div class="fm-textarea fm-textarea--rich">' + rtText + '</div>';
      }

      case 'fmSlider': {
        var sliderVal = v.Progress || v.Value || '0%';
        return '<div class="fm-slider">'
          + '<div class="fm-slider__fill" style="width:' + esc(sliderVal) + '"></div>'
          + '</div>';
      }

      default: {
        return '<div class="fm-component" data-ref="' + esc(ref) + '" data-name="' + esc(name) + '">[' + esc(ref) + ']</div>';
      }
    }
  }

  // -------------------------------------------------------------------------
  // Style builders for structured nodes
  // -------------------------------------------------------------------------

  var FONT_WEIGHT_MAP = {
    'Regular': '400', 'Medium': '500', 'Semi Bold': '600', 'SemiBold': '600',
    'Bold': '700', 'Light': '300', 'Thin': '100', 'Extra Bold': '800'
  };

  function buildFrameStyle(node) {
    var parts = [];
    var layout = node.layout || {};
    var sizing = node.sizing || {};

    // Flex layout
    if (layout.mode === 'HORIZONTAL') {
      parts.push('display:flex', 'flex-direction:row');
    } else if (layout.mode === 'VERTICAL') {
      parts.push('display:flex', 'flex-direction:column');
    }

    if (layout.spacing != null) {
      parts.push('gap:' + layout.spacing + 'px');
    }

    if (layout.padding) {
      var p = layout.padding;
      if (typeof p === 'object') {
        var t = p.top != null ? p.top : (p.vertical != null ? p.vertical : 0);
        var r = p.right != null ? p.right : (p.horizontal != null ? p.horizontal : 0);
        var b = p.bottom != null ? p.bottom : (p.vertical != null ? p.vertical : 0);
        var l = p.left != null ? p.left : (p.horizontal != null ? p.horizontal : 0);
        parts.push('padding:' + t + 'px ' + r + 'px ' + b + 'px ' + l + 'px');
      } else {
        parts.push('padding:' + p + 'px');
      }
    }

    // Horizontal sizing
    if (sizing.horizontal === 'FILL') {
      parts.push('flex:1', 'min-width:0');
    } else if (sizing.horizontal === 'HUG') {
      // default — no extra CSS
    } else if (typeof sizing.horizontal === 'number') {
      parts.push('width:' + sizing.horizontal + 'px', 'flex-shrink:0');
    } else if (node.width != null) {
      parts.push('width:' + node.width + 'px');
    }

    // Vertical sizing
    if (sizing.vertical === 'FILL') {
      parts.push('flex:1', 'min-height:0');
    } else if (typeof sizing.vertical === 'number') {
      parts.push('height:' + sizing.vertical + 'px');
    } else if (node.height != null) {
      parts.push('height:' + node.height + 'px');
    }

    // Fills
    if (node.fills && node.fills.length > 0) {
      parts.push('background:' + node.fills[0]);
    }

    // Corner radius
    if (node.cornerRadius != null) {
      if (typeof node.cornerRadius === 'number') {
        parts.push('border-radius:' + node.cornerRadius + 'px');
      } else if (typeof node.cornerRadius === 'object') {
        var cr = node.cornerRadius;
        parts.push('border-radius:'
          + (cr.topLeft || 0) + 'px '
          + (cr.topRight || 0) + 'px '
          + (cr.bottomRight || 0) + 'px '
          + (cr.bottomLeft || 0) + 'px');
      }
    }

    // Stroke
    if (node.stroke) {
      var stroke = node.stroke;
      var weight = stroke.weight != null ? stroke.weight : 1;
      var color = stroke.color || '#000000';
      if (stroke.sides && typeof stroke.sides === 'object') {
        if (stroke.sides.top) parts.push('border-top:' + weight + 'px solid ' + color);
        if (stroke.sides.right) parts.push('border-right:' + weight + 'px solid ' + color);
        if (stroke.sides.bottom) parts.push('border-bottom:' + weight + 'px solid ' + color);
        if (stroke.sides.left) parts.push('border-left:' + weight + 'px solid ' + color);
      } else {
        parts.push('border:' + weight + 'px solid ' + color);
      }
    }

    // Opacity
    if (node.opacity != null) {
      parts.push('opacity:' + node.opacity);
    }

    // Clips content
    if (node.clipsContent) {
      parts.push('overflow:hidden');
    }

    return parts.join(';');
  }

  function buildTextStyle(node) {
    var parts = [];

    // Font family + weight
    if (node.font) {
      var fontParts = node.font.split(':');
      var family = fontParts[0] ? fontParts[0].trim() : 'Inter';
      var weightName = fontParts[1] ? fontParts[1].trim() : 'Regular';
      var weight = FONT_WEIGHT_MAP[weightName] || '400';
      parts.push('font-family:' + family);
      parts.push('font-weight:' + weight);
    }

    if (node.size != null) {
      parts.push('font-size:' + node.size + 'px');
    }

    if (node.color) {
      parts.push('color:' + node.color);
    }

    if (node.width != null) {
      parts.push('display:block', 'width:' + node.width + 'px');
    }

    if (node.letterSpacing != null) {
      parts.push('letter-spacing:' + node.letterSpacing + 'px');
    }

    if (node.textAlign && node.textAlign.horizontal) {
      var align = node.textAlign.horizontal;
      if (align === 'CENTER') parts.push('text-align:center');
      else if (align === 'RIGHT') parts.push('text-align:right');
      else if (align === 'LEFT') parts.push('text-align:left');
    }

    if (node.opacity != null) {
      parts.push('opacity:' + node.opacity);
    }

    return parts.join(';');
  }

  // -------------------------------------------------------------------------
  // renderContentNode — recursive structured node → HTML
  // -------------------------------------------------------------------------

  function renderContentNode(node) {
    if (!node) return '';

    switch (node.type) {

      case 'FRAME': {
        var style = buildFrameStyle(node);
        var children = (node.children || []).map(renderContentNode).join('');
        return '<div class="fm-frame" data-name="' + esc(node.name || '') + '"'
          + (style ? ' style="' + style + '"' : '') + '>'
          + children + '</div>';
      }

      case 'TEXT': {
        var style = buildTextStyle(node);
        return '<span class="fm-text" data-name="' + esc(node.name || '') + '"'
          + (style ? ' style="' + style + '"' : '') + '>'
          + esc(node.content || '') + '</span>';
      }

      case 'INSTANCE': {
        return renderFMComponent(node);
      }

      case 'ELLIPSE': {
        var bg = (node.fills && node.fills[0]) || '#CBD2E0';
        var ellipseStyle = 'width:' + (node.width || 16) + 'px;height:' + (node.height || 16) + 'px;border-radius:50%;background:' + bg;
        if (node.opacity != null) ellipseStyle += ';opacity:' + node.opacity;
        return '<div class="fm-ellipse" data-name="' + esc(node.name || '') + '" style="' + ellipseStyle + '"></div>';
      }

      case 'RECT': {
        var rectStyle = 'width:' + (node.width || 32) + 'px;height:' + (node.height || 32) + 'px;';
        if (node.fills && node.fills[0]) rectStyle += 'background:' + node.fills[0] + ';';
        if (node.cornerRadius) rectStyle += 'border-radius:' + (typeof node.cornerRadius === 'number' ? node.cornerRadius + 'px' : '0') + ';';
        return '<div class="fm-rect" data-name="' + esc(node.name || '') + '" style="' + rectStyle + '"></div>';
      }

      case 'DIVIDER': {
        return '<hr class="fm-divider">';
      }

      default: {
        // Unknown node type — render children if present, otherwise empty
        if (node.children && node.children.length) {
          return (node.children || []).map(renderContentNode).join('');
        }
        return '';
      }
    }
  }

  // -------------------------------------------------------------------------
  // Chrome helpers
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Template → chrome config resolution
  // -------------------------------------------------------------------------

  var TEMPLATE_CHROME = {
    admin:      { appHeaderType: 'Administration', hasSidebar: true },
    studio:     { appHeaderType: 'Studio',         hasSidebar: true },
    explorer:   { appHeaderType: 'Explorer',       hasSidebar: true },
    'no-sidebar': { appHeaderType: 'Studio',       hasSidebar: false },
    bare:       { appHeaderType: null,             hasSidebar: false },
    mobile:     { appHeaderType: null,             hasSidebar: false },
    tablet:     { appHeaderType: null,             hasSidebar: false },
    compact:    { appHeaderType: null,             hasSidebar: false },
    custom:     { appHeaderType: null,             hasSidebar: false }
  };

  function resolveChrome(s) {
    if (s.template && TEMPLATE_CHROME[s.template]) {
      return TEMPLATE_CHROME[s.template];
    }
    // Backward compat: derive from legacy s.appHeader / s.sidebar
    return {
      appHeaderType: s.appHeader || null,
      hasSidebar: !!s.sidebar
    };
  }

  // -------------------------------------------------------------------------
  // Screen renderer
  // -------------------------------------------------------------------------

  function screen(s) {
    var type = s.type || 'standard';
    var w = 1440;
    var h = type === 'compact' ? 700 : 960;

    var chrome = resolveChrome(s);

    // Render content — prefer structured content[] over legacy contentHtml
    var contentHtml = '';
    if (s.content && s.content.length) {
      contentHtml = s.content.map(renderContentNode).join('');
    } else {
      contentHtml = s.contentHtml || '';
    }

    // Bare/mobile/tablet/compact/custom → no chrome wrapper
    var template = s.template || '';
    if (template === 'bare' || template === 'mobile' || template === 'tablet' || template === 'compact' || template === 'custom') {
      return '<div class="screen screen--' + esc(template) + '" data-name="' + esc(s.name) + '" style="width:' + w + 'px;height:' + h + 'px;">'
        + contentHtml
        + '</div>';
    }

    var headerHtml = chrome.appHeaderType ? appHeader(chrome.appHeaderType) : '';
    var sidebarHtml = chrome.hasSidebar ? sidebar(s.sidebar || { items: 6 }) : '';

    return '<div class="screen" data-name="' + esc(s.name) + '" style="width:' + w + 'px;height:' + h + 'px;">'
      + headerHtml
      + '<div class="screen__body">'
      + sidebarHtml
      + '<div class="screen__content">'
      + pageHeader(s.pageHeader)
      + '<div class="screen__content-area">' + contentHtml + '</div>'
      + '</div></div></div>';
  }

  function flowRow(flow, meta) {
    var html = genCard(meta);
    html += coverCard(flow);
    (flow.screens || []).forEach(function(s) { html += screen(s); });
    return '<div class="flow-row" data-name="Flow: ' + esc(flow.name) + '">' + html + '</div>';
  }

  // -------------------------------------------------------------------------
  // Entry Point
  // -------------------------------------------------------------------------

  if (typeof document !== 'undefined') {
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
  }

  // -------------------------------------------------------------------------
  // Test exports (browser only)
  // -------------------------------------------------------------------------

  if (typeof window !== 'undefined') {
    window._testExports = {
      renderContentNode: renderContentNode,
      renderFMComponent: renderFMComponent,
      parseVariant: parseVariant,
      buildFrameStyle: buildFrameStyle,
      buildTextStyle: buildTextStyle,
      resolveChrome: resolveChrome,
      screen: screen
    };
  }

})();
