function hexToRgb(hex) {
  var h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255
  };
}

function angleToTransform(angleDeg) {
  var rad = (angleDeg * Math.PI) / 180;
  var cos = Math.cos(rad);
  var sin = Math.sin(rad);
  return [
    [cos, sin, 0.5 - 0.5 * cos - 0.5 * sin],
    [-sin, cos, 0.5 + 0.5 * sin - 0.5 * cos]
  ];
}

function setProp(instance, prefix, value) {
  var props = instance.componentProperties;
  for (var key in props) {
    var propName = key.split('#')[0];
    if (propName === prefix) {
      instance.setProperties({ [key]: value });
      return;
    }
  }
}

function _fillH(n) {
  var p = n.parent; if (!p) return;
  if (p.layoutMode && p.layoutMode !== 'NONE') { n.layoutSizingHorizontal = 'FILL'; }
  else { n.resize(Math.max((p.width||0)-(p.paddingLeft||0)-(p.paddingRight||0),1), n.height); }
}
function _fillV(n) {
  var p = n.parent; if (!p) return;
  if (p.layoutMode && p.layoutMode !== 'NONE') { n.layoutSizingVertical = 'FILL'; }
  else { n.resize(n.width, Math.max((p.height||0)-(p.paddingTop||0)-(p.paddingBottom||0),1)); }
}


// Navigate to target page
var _targetNode = await figma.getNodeByIdAsync(undefined);
var _page = _targetNode;
while (_page && _page.type !== 'PAGE') _page = _page.parent;
if (_page) await figma.setCurrentPageAsync(_page);

// Load fonts
await Promise.all([
  figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }),
  figma.loadFontAsync({ family: 'Inter', style: 'Bold' }),
]);

// Import components
var _imp_fmAppHeader = await figma.importComponentSetByKeyAsync('8fc9bcee610c7f8d22ebcc268467993f6dc99c87');
var _imp_fmSideNavItem = await figma.importComponentSetByKeyAsync('d18a0a772ed4acd760c497cb93de796ff052a7b4');
var _imp_fmPageHeader = await figma.importComponentSetByKeyAsync('ae1f8684a4a89aa74463d439e4e8c1e7a48137fe');
var _imp_fmTextInput = await figma.importComponentSetByKeyAsync('355855c7b2e05b5b336167883b3c9ebbfbd881ad');

// Create or find wrapper
var _wrapper = await figma.getNodeByIdAsync('__WRAPPER_ID__');
if (!_wrapper) throw new Error('Wrapper __WRAPPER_ID__ not found');

// Build tree
var _nodeCount = 0;
var c0 = figma.createFrame();
c0.name = 'New connection — Step 2';
c0.layoutMode = 'VERTICAL';
c0.itemSpacing = 0;
c0.primaryAxisSizingMode = 'AUTO';
c0.counterAxisSizingMode = 'AUTO';
c0.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c0.clipsContent = true;
c0.resize(1440, 960);
var c1;
(function() {
  var _cs = _imp_fmAppHeader;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Type=Studio') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Type=Studio') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c1 = _target.createInstance();
    } else {
      c1 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c1 = _cs.createInstance();
  }
})();
c1.name = 'App Header';
c0.appendChild(c1);
var c2 = figma.createFrame();
c2.name = 'Body';
c2.layoutMode = 'HORIZONTAL';
c2.itemSpacing = 0;
c2.primaryAxisSizingMode = 'AUTO';
c2.counterAxisSizingMode = 'AUTO';
c2.fills = [];
c2.resize(1440, 890);
var c3 = figma.createFrame();
c3.name = 'Sidebar';
c3.layoutMode = 'VERTICAL';
c3.itemSpacing = 0;
c3.paddingTop = 28;
c3.paddingRight = 16;
c3.paddingBottom = 8;
c3.paddingLeft = 16;
c3.primaryAxisSizingMode = 'AUTO';
c3.counterAxisSizingMode = 'AUTO';
c3.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
c3.resize(260, 890);
var c4;
(function() {
  var _cs = _imp_fmSideNavItem;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=On') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=On') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c4 = _target.createInstance();
    } else {
      c4 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c4 = _cs.createInstance();
  }
})();
c4.name = 'Nav: Home';
setProp(c4, 'Label', 'Home');
c3.appendChild(c4);
var c5;
(function() {
  var _cs = _imp_fmSideNavItem;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Placeholder') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Placeholder') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c5 = _target.createInstance();
    } else {
      c5 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c5 = _cs.createInstance();
  }
})();
c5.name = 'Nav: Placeholder 1';
c3.appendChild(c5);
var c6;
(function() {
  var _cs = _imp_fmSideNavItem;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Placeholder') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Placeholder') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c6 = _target.createInstance();
    } else {
      c6 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c6 = _cs.createInstance();
  }
})();
c6.name = 'Nav: Placeholder 2';
c3.appendChild(c6);
var c7;
(function() {
  var _cs = _imp_fmSideNavItem;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Placeholder') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Placeholder') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c7 = _target.createInstance();
    } else {
      c7 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c7 = _cs.createInstance();
  }
})();
c7.name = 'Nav: Placeholder 3';
c3.appendChild(c7);
c2.appendChild(c3);
var c8 = figma.createFrame();
c8.name = 'Content Area';
c8.layoutMode = 'VERTICAL';
c8.itemSpacing = 16;
c8.paddingTop = 24;
c8.paddingRight = 32;
c8.paddingBottom = 24;
c8.paddingLeft = 32;
c8.primaryAxisSizingMode = 'AUTO';
c8.counterAxisSizingMode = 'AUTO';
c8.fills = [{ type: 'SOLID', color: hexToRgb('#F5F5FA') }];
c8.resize(1180, 890);
var c9;
(function() {
  var _cs = _imp_fmPageHeader;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'Type=Title + Subtitle') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('Type=Title + Subtitle') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c9 = _target.createInstance();
    } else {
      c9 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c9 = _cs.createInstance();
  }
})();
c9.name = 'Page Header';
setProp(c9, 'Title', 'New connection');
setProp(c9, 'Subtitle', 'Step 2 of 3 — Configure');
c8.appendChild(c9);
var c10 = figma.createFrame();
c10.name = 'Form container';
c10.layoutMode = 'VERTICAL';
c10.itemSpacing = 16;
c10.paddingTop = 0;
c10.paddingRight = 0;
c10.paddingBottom = 0;
c10.paddingLeft = 0;
c10.primaryAxisSizingMode = 'AUTO';
c10.counterAxisSizingMode = 'AUTO';
c10.fills = [];
var c11;
(function() {
  var _cs = _imp_fmTextInput;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Default') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Default') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c11 = _target.createInstance();
    } else {
      c11 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c11 = _cs.createInstance();
  }
})();
setProp(c11, 'Label Text', 'Connection name');
setProp(c11, 'Input Text', '');
setProp(c11, 'Show label', true);
c10.appendChild(c11);
var c12;
(function() {
  var _cs = _imp_fmTextInput;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Default') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Default') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c12 = _target.createInstance();
    } else {
      c12 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c12 = _cs.createInstance();
  }
})();
setProp(c12, 'Label Text', 'Host');
setProp(c12, 'Input Text', 'localhost');
setProp(c12, 'Show label', true);
c10.appendChild(c12);
var c13;
(function() {
  var _cs = _imp_fmTextInput;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Default') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Default') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c13 = _target.createInstance();
    } else {
      c13 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c13 = _cs.createInstance();
  }
})();
setProp(c13, 'Label Text', 'Port');
setProp(c13, 'Input Text', '5432');
setProp(c13, 'Show label', true);
c10.appendChild(c13);
var c14;
(function() {
  var _cs = _imp_fmTextInput;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Default') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Default') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c14 = _target.createInstance();
    } else {
      c14 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c14 = _cs.createInstance();
  }
})();
setProp(c14, 'Label Text', 'Database name');
setProp(c14, 'Input Text', '');
setProp(c14, 'Show label', true);
c10.appendChild(c14);
var c15;
(function() {
  var _cs = _imp_fmTextInput;
  if (_cs.type === 'COMPONENT_SET') {
    var _variants = _cs.children;
    var _target = null;
    for (var _i = 0; _i < _variants.length; _i++) {
      if (_variants[_i].name === 'State=Default') { _target = _variants[_i]; break; }
    }
    if (!_target) {
      for (var _j = 0; _j < _variants.length; _j++) {
        if (_variants[_j].name.indexOf('State=Default') !== -1) { _target = _variants[_j]; break; }
      }
    }
    if (_target) {
      c15 = _target.createInstance();
    } else {
      c15 = (_cs.defaultVariant || _cs.children[0]).createInstance();
    }
  } else {
    c15 = _cs.createInstance();
  }
})();
setProp(c15, 'Label Text', 'Username');
setProp(c15, 'Input Text', '');
setProp(c15, 'Show label', true);
c10.appendChild(c15);
c8.appendChild(c10);
c10.layoutSizingVertical = 'HUG';
c2.appendChild(c8);
_fillH(c8);
_fillV(c8);
c0.appendChild(c2);
_fillH(c2);
_fillV(c2);
_wrapper.appendChild(c0);
_nodeCount++;

// Tag with plugin data
_wrapper.setSharedPluginData('actian_ds', 'skill', 'generate-flow');
_wrapper.setSharedPluginData('actian_ds', 'pushed_at', new Date().toISOString());

// Return metadata
return { wrapperId: _wrapper.id, nodeCount: _nodeCount };